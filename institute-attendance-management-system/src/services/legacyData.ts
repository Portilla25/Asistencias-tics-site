import {
  Alumno,
  Asistencia,
  ClaseHorario,
  Materia,
  Notificacion,
  Periodo,
  User,
  RegistroNotasMateria,
} from '../types';
import {
  alumnos as mockAlumnos,
  asistencias as mockAsistencias,
  horarios as mockHorarios,
  materias as mockMaterias,
  notificaciones as mockNotificaciones,
  periodos as mockPeriodos,
  usuarios as mockUsuarios,
} from '../data/mockData';
import { getTodayInPeru } from '../utils/dateUtils';
import { enqueueDeferredSync } from './deferredSync';
import {
  recoverConfirmedAfternoonAttendance,
  repairTechnologyTurnSeparation,
  TECHNOLOGY_MODULE_IDS,
} from './turnSeparation';

type LegacyStudent = {
  id?: string | number;
  nombre?: string;
  correo?: string;
  email?: string;
  dni?: string | number;
  cel?: string | number;
  retirado?: boolean;
  curso?: string;
};

type LegacyModule = {
  alumnos?: LegacyStudent[];
  retirados?: LegacyStudent[];
  fechas?: string[];
  asistencias?: Record<string, Record<string, string>>;
  motivos?: Record<string, Record<string, string>>;
  notas?: unknown;
  participacion?: unknown;
};

type LegacySection = {
  id: string;
  label: string;
  badge?: string;
};

export type LegacyCareer = {
  id: string;
  nombre: string;
  icono?: string;
  color?: string;
  secciones: LegacySection[];
};

export type InitialAppData = {
  alumnos: Alumno[];
  materias: Materia[];
  asistencias: Asistencia[];
  notificaciones: Notificacion[];
  horarios: ClaseHorario[];
  periodos: Periodo[];
  usuarios: User[];
  notas?: Record<string, RegistroNotasMateria>;
  source: 'legacy' | 'mock';
};

export const ADMIN_EMAILS = ['fer250423@gmail.com'];
const DOCENTE_ID = 'u-docente-principal';
const ALUMNO_DEMO_ID = 'u-alumno-demo';
const STORAGE_STATE_KEY = 'asist_state';
const INDEXED_DB_NAME = 'asistencias_local_db';
const INDEXED_DB_STORE = 'kv';
const INDEXED_DB_STATE_KEY = 'legacy_state';
const FIRESTORE_CACHE_META_KEY = 'asist_firestore_cache_meta';
const FIRESTORE_META_COLLECTION = 'system';
const FIRESTORE_META_DOC_ID = 'legacy_state';
const FIRESTORE_META_CHECK_INTERVAL_MS = 10 * 60 * 1000;
const FIRESTORE_LEGACY_CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const JUNE_2026_RECOVERY_FLAG_KEY = 'asist_june_2026_recovery_done_v1';
const JUNE_2026_RECOVERY_REPORT_KEY = 'asist_june_2026_recovery_report_v1';
const JUNE_2026_START = '2026-06-01';
const JUNE_2026_END = '2026-06-30';
const TURN_SEPARATION_BACKUP_KEY = 'asist_state_backup_turnos_separados_v1';
const TURN_SEPARATION_ATTENDANCE_RECOVERY_FLAG_KEY = 'asist_turnos_asistencia_recuperada_v1';

type FirestoreCacheMeta = {
  downloadedAt?: string;
  downloadedAtMs?: number;
  lastCheckedAtMs?: number;
  remoteVersion?: string | null;
};

type RemoteStateMeta = {
  exists: boolean;
  version: string | null;
  updatedAtMs: number | null;
};

type DownloadFromFirestoreOptions = {
  force?: boolean;
};

// In-memory flags to avoid re-running migrations when localStorage is full
let __inMemoryState: Record<string, LegacyModule> | null = null;
let __firebaseDownloadedThisSession = false;
const __inMemoryFlags = new Set<string>();

const saveStateLocally = (state: Record<string, LegacyModule>) => {
  if (typeof window !== 'undefined') {
    __inMemoryState = state;
    saveStateToIndexedDb(state);
    try {
      window.localStorage.setItem(STORAGE_STATE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn("localStorage quota exceeded, state kept in memory", e);
    }
  }
};

const getStateLocally = (): Record<string, LegacyModule> => {
  if (__inMemoryState) {
    return __inMemoryState;
  }
  return safeParse<Record<string, LegacyModule>>(readStorage(STORAGE_STATE_KEY), {});
};

const openLocalDb = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB no disponible.'));
      return;
    }

    const request = window.indexedDB.open(INDEXED_DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(INDEXED_DB_STORE)) {
        db.createObjectStore(INDEXED_DB_STORE, { keyPath: 'key' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('No se pudo abrir IndexedDB.'));
  });

const saveStateToIndexedDb = (state: Record<string, LegacyModule>) => {
  if (typeof window === 'undefined' || !window.indexedDB) return;

  openLocalDb()
    .then((db) => {
      const transaction = db.transaction(INDEXED_DB_STORE, 'readwrite');
      transaction.objectStore(INDEXED_DB_STORE).put({
        key: INDEXED_DB_STATE_KEY,
        value: state,
        updatedAtMs: Date.now(),
      });
      transaction.oncomplete = () => db.close();
      transaction.onerror = () => {
        console.warn('[LOCAL_DB] No se pudo guardar estado en IndexedDB.', transaction.error);
        db.close();
      };
    })
    .catch((error) => {
      console.warn('[LOCAL_DB] No se pudo abrir IndexedDB para guardar estado.', error);
    });
};

export const restoreLocalStateFromIndexedDb = async (): Promise<boolean> => {
  if (Object.keys(getStateLocally()).length > 0) return false;
  if (typeof window === 'undefined' || !window.indexedDB) return false;

  try {
    const db = await openLocalDb();
    const restored = await new Promise<Record<string, LegacyModule> | null>((resolve, reject) => {
      const transaction = db.transaction(INDEXED_DB_STORE, 'readonly');
      const request = transaction.objectStore(INDEXED_DB_STORE).get(INDEXED_DB_STATE_KEY);
      request.onsuccess = () => {
        const value = request.result?.value;
        resolve(value && typeof value === 'object' ? value as Record<string, LegacyModule> : null);
      };
      request.onerror = () => reject(request.error || new Error('No se pudo leer IndexedDB.'));
    });
    db.close();

    if (!restored || Object.keys(restored).length === 0) return false;
    __inMemoryState = restored;
    try {
      window.localStorage.setItem(STORAGE_STATE_KEY, JSON.stringify(restored));
    } catch {
      // It is still available from memory for this session.
    }
    return true;
  } catch (error) {
    console.warn('[LOCAL_DB] No se pudo restaurar estado desde IndexedDB.', error);
    return false;
  }
};

/** Check a migration flag - checks both memory and localStorage */
const hasMigrationFlag = (flag: string): boolean => {
  if (__inMemoryFlags.has(flag)) return true;
  if (typeof window !== 'undefined' && window.localStorage.getItem(flag)) {
    __inMemoryFlags.add(flag);
    return true;
  }
  return false;
};

/** Set a migration flag - always sets in memory, tries localStorage */
const setMigrationFlag = (flag: string) => {
  __inMemoryFlags.add(flag);
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(flag, new Date().toISOString());
    } catch {
      // Quota exceeded - flag is still stored in memory
    }
  }
};
const FIRESTORE_LIMIT = 800_000;
const CHUNK_LIMIT = 700_000;
const CHUNK_FIELDS = ['alumnos', 'retirados', 'asistencias', 'motivos', 'notas', 'participacion'] as const;
const ARRAY_CHUNK_FIELDS = new Set<string>(['alumnos', 'retirados']);

const readStorage = (key: string): string | null => {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(key);
};

const DEFAULT_CAREERS: LegacyCareer[] = [
  {
    id: 'info_gastro',
    nombre: 'Tecnologías de la información - gastronomía',
    color: '#0d9488',
    secciones: [
      { id: 'info_gastro_L_1', label: 'Lunes 10:30-12:20 (2h)', badge: 'Gastro Lunes' }
    ],
  },
  {
    id: 'redes',
    nombre: 'Tecnologías de la información turno mañana',
    color: '#f59e0b',
    secciones: [
      { id: 'redes_M_1', label: 'Módulo 1 (Mañana)', badge: 'Mañana M1' },
      { id: 'redes_M_2', label: 'Módulo 2 (Mañana)', badge: 'Mañana M2' },
      { id: 'redes_M_3', label: 'Módulo 3 (Mañana)', badge: 'Mañana M3' },
      { id: 'redes_M_4', label: 'Módulo 4 (Mañana)', badge: 'Mañana M4' },
    ],
  },
  {
    id: 'redes_sabados',
    nombre: 'Tecnologías de la información turno tarde',
    color: '#e11d48',
    secciones: [
      { id: 'redes_T_1', label: 'Módulo 1 (Tarde)', badge: 'Tarde M1' },
      { id: 'redes_T_2', label: 'Módulo 2 (Tarde)', badge: 'Tarde M2' },
      { id: 'redes_T_3', label: 'Módulo 3 (Tarde)', badge: 'Tarde M3' },
      { id: 'redes_T_4', label: 'Módulo 4 (Tarde)', badge: 'Tarde M4' },
    ],
  },
];

export { DEFAULT_CAREERS };

const HIDDEN_CAREER_IDS = new Set<string>([
  'tics_sabados',
]);

const HIDDEN_MODULE_IDS = new Set<string>([
  'redes_S_M1',
  'redes_S_M2',
  'redes_S_M3',
  'redes_S_M4',
  'redes_S_T1',
  'redes_S_T2',
  'redes_S_T3',
  'redes_S_T4',
  'tics_S_1',
  'tics_S_2',
  'tics_S_3',
  'tics_S_4',
]);

export const isHiddenCareerId = (id: string) => HIDDEN_CAREER_IDS.has(id);

export const isHiddenMateriaId = (id: string) =>
  HIDDEN_MODULE_IDS.has(id) ||
  id.startsWith('tics_S_');

const safeParse = <T,>(value: string | null, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const readFirestoreCacheMeta = (): FirestoreCacheMeta => {
  if (typeof window === 'undefined') return {};
  return safeParse<FirestoreCacheMeta>(window.localStorage.getItem(FIRESTORE_CACHE_META_KEY), {});
};

const saveFirestoreCacheMeta = (patch: Partial<FirestoreCacheMeta>) => {
  if (typeof window === 'undefined') return;
  const current = readFirestoreCacheMeta();
  try {
    window.localStorage.setItem(FIRESTORE_CACHE_META_KEY, JSON.stringify({ ...current, ...patch }));
  } catch {
    // If localStorage is full, the app can still use the in-memory state.
  }
};

export const getCareers = (): LegacyCareer[] => {
  let stored = safeParse<LegacyCareer[]>(readStorage('asist_carreras'), DEFAULT_CAREERS);
  let needsSave = false;
  
  // Migration to strictly enforce user's requested names without losing their IDs
  stored = stored.map(c => {
    const normalizedName = c.nombre.toLowerCase();
    const isAfternoonCareer =
      c.id === 'redes_sabados' ||
      normalizedName.includes('turno tarde') ||
      normalizedName.includes('tarde sábados') ||
      c.nombre === 'Tecnologías Turno mañana sábados' ||
      c.nombre.includes('Tecnologías de la Información y Redes');

    if (c.id === 'info_gastro' || c.nombre === 'Tecnologías de la Información' || c.nombre.includes('Gastronomía')) {
      if (c.nombre !== 'Tecnologías de la información - gastronomía') {
        c.nombre = 'Tecnologías de la información - gastronomía';
        needsSave = true;
      }
    } else if (isAfternoonCareer) {
      if (c.nombre !== 'Tecnologías de la información turno tarde') {
        c.nombre = 'Tecnologías de la información turno tarde';
        needsSave = true;
      }
    } else if (c.id === 'redes' || c.nombre.includes('Redes & TICs') || normalizedName.includes('tic y redes') || normalizedName.includes('turno mañana') || c.nombre.includes('sábados')) {
      if (c.nombre !== 'Tecnologías de la información turno mañana') {
        c.nombre = 'Tecnologías de la información turno mañana';
        needsSave = true;
      }
    }
    return c;
  });

  // Force sync sections from DEFAULT_CAREERS to ensure all mappings (M-1, T-1, etc.) exist
  DEFAULT_CAREERS.forEach(defaultCareer => {
    let storedCareer = stored.find(c => c.id === defaultCareer.id);
    if (!storedCareer) {
      storedCareer = { ...defaultCareer, secciones: [] };
      stored.push(storedCareer);
      needsSave = true;
    }
    defaultCareer.secciones.forEach(ds => {
      if (!storedCareer!.secciones.some(ss => ss.id === ds.id)) {
        storedCareer!.secciones.push(ds);
        needsSave = true;
      } else {
        // Also update the badge/label if they changed
        const existing = storedCareer!.secciones.find(ss => ss.id === ds.id);
        if (existing && (existing.badge !== ds.badge || existing.label !== ds.label)) {
          existing.badge = ds.badge;
          existing.label = ds.label;
          needsSave = true;
        }
      }
    });

    // Strip out legacy IDs that were deleted
    if (storedCareer!.secciones) {
      const oldLen = storedCareer!.secciones.length;
      const currentDefaultSectionIds = new Set(defaultCareer.secciones.map((s) => s.id));
      const belongsToAnotherDefaultCareer = (sectionId: string) =>
        DEFAULT_CAREERS.some((career) =>
          career.id !== defaultCareer.id && career.secciones.some((section) => section.id === sectionId)
        );

      storedCareer!.secciones = storedCareer!.secciones.filter((s) =>
        !['M-1','M-2','M-3','M-4','T-1','T-2','T-3','T-4'].includes(s.id) &&
        !isHiddenMateriaId(s.id) &&
        (currentDefaultSectionIds.has(s.id) || !belongsToAnotherDefaultCareer(s.id))
      );
      if (oldLen !== storedCareer!.secciones.length) needsSave = true;
    }
  });

  if (needsSave && typeof window !== 'undefined') {
    try {
      window.localStorage.setItem('asist_carreras', JSON.stringify(stored));
    } catch {}
  }
  return stored.filter((career) => !isHiddenCareerId(career.id));
};

export const saveCareers = (careers: LegacyCareer[]) => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem('asist_carreras', JSON.stringify(careers));
  }
};

export const createModuloForCareer = (careerId: string): Omit<Materia, 'id'> & { id: string } => {
  const careers = getCareers();
  const career = careers.find(c => c.id === careerId);
  if (!career) throw new Error('Career not found');

  const moduleNumber = (career.secciones?.length || 0) + 1;
  const newModuleId = `${careerId}_${Date.now()}`;
  const newSectionLabel = `Módulo ${moduleNumber}`;
  const newBadge = `Mod ${moduleNumber}`;

  career.secciones = career.secciones || [];
  career.secciones.push({
    id: newModuleId,
    label: newSectionLabel,
    badge: newBadge,
  });

  saveCareers(careers);

  // also create empty state for it so it persists fully
  if (typeof window !== 'undefined') {
    const state = getStateLocally();
    if (!state[newModuleId]) {
      state[newModuleId] = { alumnos: [], fechas: [], asistencias: {} };
      saveStateLocally(state);
    }
  }

  return {
    id: newModuleId,
    nombre: `${career.nombre} · ${newSectionLabel}`,
    codigo: newBadge,
    docenteId: DOCENTE_ID,
    descripcion: `Módulo ${moduleNumber} creado manualmente.`,
    color: career.color || '#6366f1',
  };
};

const cloneJson = <T,>(value: T): T => JSON.parse(JSON.stringify(value ?? null)) as T;

const estimateSize = (value: unknown) => new Blob([JSON.stringify(value)]).size;

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const flattenObject = (value: unknown, path: string[] = []): Array<{ path: string[]; value: unknown }> => {
  if (!isPlainObject(value)) return path.length ? [{ path, value }] : [];
  const entries = Object.entries(value);
  if (entries.length === 0) return path.length ? [{ path, value: {} }] : [];
  return entries.flatMap(([key, nested]) => flattenObject(nested, [...path, key]));
};

const chunkArrayField = (field: string, value: unknown) => {
  const rows = Array.isArray(value) ? value : [];
  const chunks: Array<Record<string, unknown>> = [];
  let current: unknown[] = [];
  const flush = () => {
    if (current.length > 0) {
      chunks.push({ [field]: current });
      current = [];
    }
  };

  rows.forEach((row) => {
    const next = [...current, row];
    if (current.length > 0 && estimateSize({ [field]: next }) > CHUNK_LIMIT) flush();
    current.push(row);
  });
  flush();
  return chunks;
};

const chunkObjectField = (value: unknown) => {
  const entries = flattenObject(value || {});
  const chunks: Array<{ _flat: true; entries: Array<{ path: string[]; value: unknown }> }> = [];
  let current: Array<{ path: string[]; value: unknown }> = [];
  const flush = () => {
    if (current.length > 0) {
      chunks.push({ _flat: true, entries: current });
      current = [];
    }
  };

  entries.forEach((entry) => {
    const next = [...current, entry];
    if (current.length > 0 && estimateSize({ _flat: true, entries: next }) > CHUNK_LIMIT) flush();
    current.push(entry);
  });
  flush();
  return chunks;
};

const chunkField = (field: string, value: unknown) =>
  ARRAY_CHUNK_FIELDS.has(field) ? chunkArrayField(field, value) : chunkObjectField(value);

const getFirebaseFirestore = () => {
  if (typeof window === 'undefined' || !window.firebase?.firestore) return null;
  const __B64_FB_CONF = "eyJhcGlLZXkiOiJBSXphU3lBdmc4V2JJY09GQ0F0eVRVdTVpUHhhT1JPUzJNZXhzLVUiLCJhdXRoRG9tYWluIjoiYXNpc3RlbmNpYXMtcmVkZXMuZmlyZWJhc2VhcHAuY29tIiwicHJvamVjdElkIjoiYXNpc3RlbmNpYXMtcmVkZXMiLCJzdG9yYWdlQnVja2V0IjoiYXNpc3RlbmNpYXMtcmVkZXMuZmlyZWJhc2VzdG9yYWdlLmFwcCIsIm1lc3NhZ2luZ1NlbmRlcklkIjoiNTExODI2OTk1NTE0IiwiYXBwSWQiOiIxOjUxMTgyNjk5NTUxNDp3ZWI6ZGE0NmQ0ZTJjYjlkNmFhMDkwODgwMyIsIm1lYXN1cmVtZW50SWQiOiJHLU1ZMjBRVk44RjIifQ==";
  const config = safeParse<Record<string, unknown>>(atob(__B64_FB_CONF), {});
  const app = window.firebase.apps?.length ? window.firebase.app() : window.firebase.initializeApp(config);
  return window.firebase.firestore(app);
};

const timestampToMillis = (value: unknown): number | null => {
  if (!value) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  if (typeof value === 'object') {
    const timestamp = value as { seconds?: number; nanoseconds?: number; toMillis?: () => number };
    if (typeof timestamp.toMillis === 'function') return timestamp.toMillis();
    if (typeof timestamp.seconds === 'number') {
      return (timestamp.seconds * 1000) + Math.floor((timestamp.nanoseconds || 0) / 1_000_000);
    }
  }
  return null;
};

const getRemoteStateMeta = async (db: any): Promise<RemoteStateMeta> => {
  const doc = await db.collection(FIRESTORE_META_COLLECTION).doc(FIRESTORE_META_DOC_ID).get();
  if (!doc.exists) return { exists: false, version: null, updatedAtMs: null };

  const data = doc.data() || {};
  const updatedAtMs = timestampToMillis(data.updatedAt) ?? timestampToMillis(data.updatedAtMs);
  const version = typeof data.version === 'string'
    ? data.version
    : updatedAtMs
      ? String(updatedAtMs)
      : null;

  return { exists: true, version, updatedAtMs };
};

const makeFirestoreStateVersion = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const touchFirestoreStateMeta = async (db: any, moduleIds: string[]) => {
  const now = Date.now();
  const version = makeFirestoreStateVersion();
  try {
    await db.collection(FIRESTORE_META_COLLECTION).doc(FIRESTORE_META_DOC_ID).set({
      version,
      updatedAt: window.firebase.firestore.FieldValue.serverTimestamp(),
      updatedAtMs: now,
      touchedModules: moduleIds.slice(0, 20),
    }, { merge: true });

    saveFirestoreCacheMeta({
      downloadedAt: new Date(now).toISOString(),
      downloadedAtMs: now,
      lastCheckedAtMs: now,
      remoteVersion: version,
    });
  } catch (error) {
    console.warn('[FIREBASE_META] No se pudo actualizar metadata de sincronizacion.', error);
  }
};

const markFirestoreCacheChecked = (remoteVersion?: string | null) => {
  saveFirestoreCacheMeta({
    lastCheckedAtMs: Date.now(),
    ...(remoteVersion !== undefined ? { remoteVersion } : {}),
  });
};

const fetchLegacyStateFromFirestore = async (db: any): Promise<Record<string, LegacyModule>> => {
  const snapshot = await db.collection('modulos').get();
  if (snapshot.empty) {
    console.warn('Firestore: coleccion modulos esta vacia');
    return {};
  }

  const state: Record<string, LegacyModule> = {};
  const chunks: any[] = [];

  snapshot.forEach((doc: any) => {
    if (doc.id.includes('__chunk_')) {
      chunks.push({ id: doc.id, data: doc.data() });
    } else {
      state[doc.id] = doc.data() as LegacyModule;
    }
  });

  const unflattenObject = (entries: Array<{ path: string[]; value: unknown }>, target: Record<string, unknown> = {}) => {
    for (const { path, value } of entries) {
      if (!path || path.length === 0) continue;
      let current = target;
      for (let i = 0; i < path.length - 1; i++) {
        const key = path[i];
        if (!current[key] || typeof current[key] !== 'object') current[key] = {};
        current = current[key] as Record<string, unknown>;
      }
      current[path[path.length - 1]] = value;
    }
    return target;
  };

  for (const [moduleId, module] of Object.entries(state)) {
    if (!(module as any)._chunked) continue;

    const counts = (module as any)._chunkCounts || {};
    for (const field of Object.keys(counts)) {
      const count = counts[field];
      let reassembled: any = ARRAY_CHUNK_FIELDS.has(field) ? [] : {};

      for (let i = 0; i < count; i++) {
        const chunkId = `${moduleId}__chunk_${field}_${i}`;
        const chunkData = chunks.find((chunk) => chunk.id === chunkId)?.data;
        if (!chunkData) continue;

        if (Array.isArray(reassembled)) {
          const chunkArray = chunkData[field];
          if (Array.isArray(chunkArray)) {
            chunkArray.forEach((item) => reassembled.push(item));
          }
        } else if (chunkData._flat && Array.isArray(chunkData.entries)) {
          unflattenObject(chunkData.entries, reassembled);
        } else {
          Object.assign(reassembled, chunkData);
        }
      }

      (module as any)[field] = reassembled;
    }
  }

  return state;
};

const syncLegacyModuleToFirestore = async (moduleId: string, module: LegacyModule) => {
  const db = getFirebaseFirestore();
  if (!db) return;

  const payload: Record<string, unknown> = cloneJson({
    alumnos: module.alumnos || [],
    retirados: (module as Record<string, unknown>).retirados || [],
    asistencias: module.asistencias || {},
    fechas: module.fechas || [],
    motivos: module.motivos || {},
    notas: module.notas || {},
    participacion: module.participacion || {},
  });

  if (estimateSize(payload) < FIRESTORE_LIMIT) {
    await db.collection('modulos').doc(moduleId).set({
      ...payload,
      _chunked: false,
      updatedAt: window.firebase.firestore.FieldValue.serverTimestamp(),
    });
    await touchFirestoreStateMeta(db, [moduleId]);
    return;
  }

  const chunks: Array<{ id: string; data: Record<string, unknown> }> = [];
  const counts: Record<string, number> = {};
  CHUNK_FIELDS.forEach((field) => {
    const fieldChunks = chunkField(field, payload[field]);
    counts[field] = fieldChunks.length;
    fieldChunks.forEach((data, index) => {
      chunks.push({ id: `${moduleId}__chunk_${field}_${index}`, data: cloneJson(data) });
    });
  });

  const batch = db.batch();
  batch.set(db.collection('modulos').doc(moduleId), {
    _chunked: true,
    _chunkVersion: 3,
    _chunkCounts: counts,
    fechas: payload.fechas || [],
    updatedAt: window.firebase.firestore.FieldValue.serverTimestamp(),
  });
  chunks.forEach((chunk) => {
    batch.set(db.collection('modulos').doc(chunk.id), chunk.data);
  });
  await batch.commit();
  await touchFirestoreStateMeta(db, [moduleId]);
};

export const downloadFromFirestore = async (options: DownloadFromFirestoreOptions = {}): Promise<boolean> => {
  const db = getFirebaseFirestore();
  if (!db) {
    console.warn('Firebase: No se pudo inicializar Firestore');
    return false;
  }

  try {
    const now = Date.now();
    const cacheMeta = readFirestoreCacheMeta();
    const localState = getStateLocally();
    const hasLocalState = Object.keys(localState).length > 0;
    let remoteMetaBeforeFullDownload: RemoteStateMeta | null = null;

    if (!options.force && hasLocalState) {
      if (cacheMeta.lastCheckedAtMs && now - cacheMeta.lastCheckedAtMs < FIRESTORE_META_CHECK_INTERVAL_MS) {
        __firebaseDownloadedThisSession = true;
        console.log('[FIREBASE_DOWNLOAD] Skip: cache local revisada recientemente.');
        return false;
      }

      try {
        const remoteMeta = await getRemoteStateMeta(db);
        remoteMetaBeforeFullDownload = remoteMeta;
        if (remoteMeta.exists) {
          if (cacheMeta.remoteVersion && remoteMeta.version === cacheMeta.remoteVersion) {
            markFirestoreCacheChecked(remoteMeta.version);
            __firebaseDownloadedThisSession = true;
            console.log('[FIREBASE_DOWNLOAD] Skip: cache local coincide con la version remota.');
            return false;
          }

          if (!cacheMeta.remoteVersion) {
            markFirestoreCacheChecked(remoteMeta.version);
            __firebaseDownloadedThisSession = true;
            console.log('[FIREBASE_DOWNLOAD] Skip: version remota adoptada para evitar descarga completa inicial.');
            return false;
          }
        } else if (!cacheMeta.downloadedAtMs || now - cacheMeta.downloadedAtMs < FIRESTORE_LEGACY_CACHE_MAX_AGE_MS) {
          markFirestoreCacheChecked(cacheMeta.remoteVersion);
          __firebaseDownloadedThisSession = true;
          console.log('[FIREBASE_DOWNLOAD] Skip: usando cache local porque aun no hay metadata remota.');
          return false;
        }
      } catch (metaError) {
        markFirestoreCacheChecked(cacheMeta.remoteVersion);
        __firebaseDownloadedThisSession = true;
        console.warn('[FIREBASE_DOWNLOAD] No se pudo revisar metadata remota; usando cache local.', metaError);
        return false;
      }
    }

    const snapshot = await db.collection('modulos').get();
    if (snapshot.empty) {
      console.warn('Firestore: colección modulos está vacía');
      return false;
    }

    const state: Record<string, LegacyModule> = {};
    const chunks: any[] = [];
    
    snapshot.forEach((doc: any) => {
      if (doc.id.includes('__chunk_')) {
        chunks.push({ id: doc.id, data: doc.data() });
      } else {
        state[doc.id] = doc.data() as LegacyModule;
      }
    });

    for (const [moduleId, module] of Object.entries(state)) {
      if ((module as any)._chunked) {
        const counts = (module as any)._chunkCounts || {};
        const unflattenObject = (entries: Array<{ path: string[]; value: unknown }>, target: Record<string, unknown> = {}) => {
          for (const { path, value } of entries) {
            if (!path || path.length === 0) continue;
            let current = target;
            for (let i = 0; i < path.length - 1; i++) {
              const key = path[i];
              if (!current[key] || typeof current[key] !== 'object') current[key] = {};
              current = current[key] as Record<string, unknown>;
            }
            current[path[path.length - 1]] = value;
          }
          return target;
        };

        for (const field of Object.keys(counts)) {
          const count = counts[field];
          let reassembled: any = ARRAY_CHUNK_FIELDS.has(field) ? [] : {};
          for (let i = 0; i < count; i++) {
            const chunkId = `${moduleId}__chunk_${field}_${i}`;
            const chunkData = chunks.find(c => c.id === chunkId)?.data;
            if (chunkData) {
              if (Array.isArray(reassembled)) {
                 // Array chunks are stored as { [field]: [...] }
                 const chunkArray = chunkData[field];
                 if (Array.isArray(chunkArray)) {
                   chunkArray.forEach(item => reassembled.push(item));
                 }
              } else {
                 if (chunkData._flat && Array.isArray(chunkData.entries)) {
                   unflattenObject(chunkData.entries, reassembled);
                 } else {
                   Object.assign(reassembled, chunkData);
                 }
              }
            }
          }
          (module as any)[field] = reassembled;
        }
      }
    }

    if (Object.keys(state).length > 0) {
      applyTechnologyTurnSeparation(state);

      // Count total asistencias across all modules for debugging
      let totalAsist = 0;
      let latestDate = '';
      for (const mod of Object.values(state)) {
        for (const byDate of Object.values((mod as any).asistencias || {})) {
          if (typeof byDate === 'object' && byDate !== null) {
            for (const fecha of Object.keys(byDate)) {
              totalAsist++;
              if (fecha > latestDate) latestDate = fecha;
            }
          }
        }
      }
      console.log(`[FIREBASE_DOWNLOAD] OK: ${Object.keys(state).length} modules, ${totalAsist} asistencias, latest date: ${latestDate}`);
      saveStateLocally(state);
      saveFirestoreCacheMeta({
        downloadedAt: new Date().toISOString(),
        downloadedAtMs: Date.now(),
        lastCheckedAtMs: Date.now(),
      });
      const cacheMetaPromise = remoteMetaBeforeFullDownload
        ? Promise.resolve(remoteMetaBeforeFullDownload)
        : getRemoteStateMeta(db);

      cacheMetaPromise
        .then((remoteMeta) => {
          if (remoteMeta.exists) {
            saveFirestoreCacheMeta({ remoteVersion: remoteMeta.version });
            return undefined;
          }
          return touchFirestoreStateMeta(db, Object.keys(state));
        })
        .catch((metaError) => {
          console.warn('[FIREBASE_DOWNLOAD] No se pudo actualizar metadata de cache.', metaError);
        });
      __firebaseDownloadedThisSession = true;
      return true;
    }
  } catch (error: any) {
    console.error('Error downloading from Firestore', error);
  }
  return false;
};

const queueLegacyModuleSync = (moduleId: string) => {
  enqueueDeferredSync('legacyModule', { moduleId }, moduleId);
};

export const flushLegacyModuleSyncTask = async (moduleId: string) => {
  const state = getStateLocally();
  const module = state[moduleId];
  if (!module) return;
  await syncLegacyModuleToFirestore(moduleId, module);
};

const syncTouchedModules = (moduleIds: Set<string>, _state: Record<string, LegacyModule>) => {
  moduleIds.forEach((moduleId) => {
    queueLegacyModuleSync(moduleId);
  });
};

const applyTechnologyTurnSeparation = (state: Record<string, LegacyModule>) => {
  let backupJson: string | null = null;
  const shouldCreateBackup =
    typeof window !== 'undefined' &&
    !readStorage(TURN_SEPARATION_BACKUP_KEY);

  if (shouldCreateBackup) {
    try {
      const modules = Object.fromEntries(
        TECHNOLOGY_MODULE_IDS
          .filter((moduleId) => state[moduleId])
          .map((moduleId) => [moduleId, state[moduleId]]),
      );
      backupJson = JSON.stringify({
        createdAt: new Date().toISOString(),
        reason: 'Antes de separar los turnos mañana y tarde',
        modules,
      });
    } catch {
      backupJson = null;
    }
  }

  if (backupJson && typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(TURN_SEPARATION_BACKUP_KEY, backupJson);
    } catch {
      console.warn('[TURNOS] No se pudo guardar el respaldo previo por falta de espacio.');
    }
  }

  const storedBackup = safeParse<{ modules?: Record<string, LegacyModule> }>(
    readStorage(TURN_SEPARATION_BACKUP_KEY),
    {},
  );
  const report = repairTechnologyTurnSeparation(state, storedBackup.modules);
  const shouldRecoverAttendance =
    !!storedBackup.modules &&
    !hasMigrationFlag(TURN_SEPARATION_ATTENDANCE_RECOVERY_FLAG_KEY);
  const recoveryReport = shouldRecoverAttendance
    ? recoverConfirmedAfternoonAttendance(state, storedBackup.modules)
    : { changed: false, touchedModuleIds: [] as string[], restoredRecords: 0 };
  const combinedReport = {
    ...report,
    changed: report.changed || recoveryReport.changed,
    touchedModuleIds: Array.from(new Set([
      ...report.touchedModuleIds,
      ...recoveryReport.touchedModuleIds,
    ])).sort(),
    recoveredAfternoonRecords: recoveryReport.restoredRecords,
  };

  if (shouldRecoverAttendance) {
    setMigrationFlag(TURN_SEPARATION_ATTENDANCE_RECOVERY_FLAG_KEY);
  }

  if (!combinedReport.changed) return combinedReport;

  saveStateLocally(state);
  syncTouchedModules(new Set(combinedReport.touchedModuleIds), state);
  console.log('[TURNOS] Turnos separados y asistencias protegidas correctamente.', combinedReport);
  return combinedReport;
};

const normalize = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const hash = (value: string) => {
  let result = 0;
  for (let i = 0; i < value.length; i++) {
    result = (result * 31 + value.charCodeAt(i)) >>> 0;
  }
  return result.toString(36);
};

const formatDni = (value: unknown) => String(value ?? '').replace(/\.0$/, '');

const normalizeDateKey = (value: unknown): string => {
  const raw = String(value ?? '').trim();
  const isoMatch = raw.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2].padStart(2, '0')}-${isoMatch[3].padStart(2, '0')}`;
  }

  const localMatch = raw.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/);
  if (localMatch) {
    return `${localMatch[3]}-${localMatch[2].padStart(2, '0')}-${localMatch[1].padStart(2, '0')}`;
  }

  return raw;
};

const isFullDateKey = (value: unknown) => /^\d{4}-\d{2}-\d{2}$/.test(normalizeDateKey(value));

const asPlainRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};

const legacyAttendanceValue = (value: unknown): string => {
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return String(record.estado ?? record.val ?? record.value ?? record.status ?? record.asistencia ?? record.attendance ?? '');
  }
  return String(value ?? '');
};

const isJune2026Date = (value: unknown) => {
  const normalized = normalizeDateKey(value);
  return normalized >= JUNE_2026_START && normalized <= JUNE_2026_END;
};

export const recoverJuneAttendanceFromFirestore = async (): Promise<boolean> => {
  if (typeof window === 'undefined') return false;
  if (hasMigrationFlag(JUNE_2026_RECOVERY_FLAG_KEY)) return false;

  const localState = getStateLocally();
  if (Object.keys(localState).length === 0) return false;

  const db = getFirebaseFirestore();
  if (!db) return false;

  try {
    const remoteState = await fetchLegacyStateFromFirestore(db);
    const nextState = cloneJson(localState);
    const touchedModules = new Set<string>();
    const recoveredDates = new Set<string>();
    const modulesSeen = new Set<string>();
    let recoveredAttendances = 0;
    let copiedStudents = 0;

    Object.entries(remoteState).forEach(([moduleId, remoteModule]) => {
      const remoteAttendances = asPlainRecord(remoteModule.asistencias);
      const remoteJuneEntries: Array<{ legacyStudentId: string; fecha: string; estado: string }> = [];

      Object.entries(remoteAttendances).forEach(([legacyStudentId, rawByDate]) => {
        Object.entries(asPlainRecord(rawByDate)).forEach(([rawFecha, rawEstado]) => {
          const fecha = normalizeDateKey(rawFecha);
          const estado = legacyAttendanceValue(rawEstado);
          if (!isJune2026Date(fecha) || !estado) return;
          remoteJuneEntries.push({ legacyStudentId, fecha, estado });
        });
      });

      if (remoteJuneEntries.length === 0) return;
      modulesSeen.add(moduleId);

      const localModule = nextState[moduleId] || { alumnos: [], fechas: [], asistencias: {}, motivos: {} };
      if ((!Array.isArray(localModule.alumnos) || localModule.alumnos.length === 0) && Array.isArray(remoteModule.alumnos)) {
        localModule.alumnos = cloneJson(remoteModule.alumnos);
        copiedStudents += localModule.alumnos.length;
      }

      if ((!Array.isArray(localModule.retirados) || localModule.retirados.length === 0) && Array.isArray(remoteModule.retirados)) {
        localModule.retirados = cloneJson(remoteModule.retirados);
        copiedStudents += localModule.retirados.length;
      }

      localModule.fechas = Array.from(new Set([
        ...(localModule.fechas || []).map((fecha) => normalizeDateKey(fecha)),
        ...remoteJuneEntries.map((entry) => entry.fecha),
      ])).filter((fecha) => isFullDateKey(fecha)).sort();

      localModule.asistencias = localModule.asistencias || {};
      remoteJuneEntries.forEach(({ legacyStudentId, fecha, estado }) => {
        localModule.asistencias![legacyStudentId] = localModule.asistencias![legacyStudentId] || {};
        if (localModule.asistencias![legacyStudentId][fecha]) return;
        localModule.asistencias![legacyStudentId][fecha] = estado;
        recoveredAttendances++;
        recoveredDates.add(fecha);
        touchedModules.add(moduleId);
      });

      const remoteMotivos = asPlainRecord(remoteModule.motivos);
      Object.entries(remoteMotivos).forEach(([legacyStudentId, rawByDate]) => {
        Object.entries(asPlainRecord(rawByDate)).forEach(([rawFecha, rawMotivo]) => {
          const fecha = normalizeDateKey(rawFecha);
          if (!isJune2026Date(fecha) || !rawMotivo) return;
          localModule.motivos = localModule.motivos || {};
          localModule.motivos[legacyStudentId] = localModule.motivos[legacyStudentId] || {};
          if (!localModule.motivos[legacyStudentId][fecha]) {
            localModule.motivos[legacyStudentId][fecha] = String(rawMotivo);
          }
        });
      });

      nextState[moduleId] = localModule;
    });

    const report = {
      recoveredAt: new Date().toISOString(),
      month: '2026-06',
      recoveredAttendances,
      copiedStudents,
      modulesWithJuneInFirestore: [...modulesSeen].sort(),
      touchedModules: [...touchedModules].sort(),
      recoveredDates: [...recoveredDates].sort(),
    };

    if (recoveredAttendances > 0 || copiedStudents > 0) {
      saveStateLocally(nextState);
    }

    setMigrationFlag(JUNE_2026_RECOVERY_FLAG_KEY);
    try {
      window.localStorage.setItem(JUNE_2026_RECOVERY_REPORT_KEY, JSON.stringify(report));
    } catch {
      // The recovery itself has already been applied; the report is only diagnostic.
    }
    console.log('[JUNE_RECOVERY] Resultado:', report);
    return recoveredAttendances > 0 || copiedStudents > 0;
  } catch (error) {
    console.warn('[JUNE_RECOVERY] No se pudo recuperar junio desde Firestore.', error);
    return false;
  }
};

const splitName = (fullName: string) => {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { nombre: fullName || 'Alumno', apellido: '' };
  if (parts.length === 2) return { apellido: parts[0], nombre: parts[1] };
  return {
    apellido: parts.slice(0, 2).join(' '),
    nombre: parts.slice(2).join(' ') || parts.slice(0, 1).join(' '),
  };
};

const COLORS = ['#f59e0b', '#0d9488', '#2563eb', '#16a34a', '#dc2626', '#7c3aed', '#0284c7', '#f97316'];

const labelFor = (careers: LegacyCareer[], moduleId: string) => {
  for (const career of careers) {
    const section = career.secciones?.find((item) => item.id === moduleId);
    if (section) {
      return {
        name: `${career.nombre} · ${section.label}`,
        code: section.badge || moduleId,
        color: career.color || COLORS[Math.abs(hash(moduleId).charCodeAt(0)) % COLORS.length],
      };
    }
  }
  return {
    name: moduleId.replace(/_/g, ' '),
    code: moduleId,
    color: COLORS[Math.abs(hash(moduleId).charCodeAt(0)) % COLORS.length],
  };
};

const legacyToEstado = (value: string): Asistencia['estado'] => {
  const normalized = normalize(value);
  if (['j', 'justificada', 'justificado', 'permiso'].includes(normalized)) return 'justificado';
  if (['t', 'tarde', 'tardanza'].includes(normalized)) return 'tardanza';
  if (['a', 'ausente', 'falta', 'false', '0', 'no'].includes(normalized)) return 'ausente';
  if (['p', 'presente', 'true', '1', 'si', 's'].includes(normalized)) return 'presente';
  if (normalized.includes('permiso') || normalized.includes('just')) return 'justificado';
  if (normalized.includes('tard')) return 'tardanza';
  if (normalized.includes('falt') || normalized.includes('aus')) return 'ausente';
  return 'presente';
};

const estadoToLegacy = (estado: Asistencia['estado']) => {
  if (estado === 'ausente') return 'Falta';
  if (estado === 'justificado') return 'Permiso';
  if (estado === 'tardanza') return 'Tardanza';
  return 'Presente';
};

const uniqueDates = (state: Record<string, LegacyModule>) => {
  const dates = new Set<string>();
  Object.values(state).forEach((module) => {
    module.fechas?.forEach((date) => dates.add(normalizeDateKey(date)));
    Object.entries(asPlainRecord(module.asistencias)).forEach(([outerKey, outerValue]) => {
      if (isFullDateKey(outerKey)) {
        dates.add(normalizeDateKey(outerKey));
        return;
      }
      Object.keys(asPlainRecord(outerValue)).forEach((date) => dates.add(normalizeDateKey(date)));
    });
  });
  return [...dates].filter((date) => isFullDateKey(date)).sort();
};

const buildPeriodos = (dates: string[]): Periodo[] => {
  const activeDate = dates[dates.length - 1] || getTodayInPeru();
  const [year, month] = activeDate.split('-').map(Number);
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const end = new Date(year, month, 0).toISOString().slice(0, 10);
  return [
    {
      id: 'periodo-actual',
      nombre: `Periodo activo ${String(month).padStart(2, '0')}/${year}`,
      fechaInicio: start,
      fechaFin: end,
      activo: true,
    },
  ];
};

const dayFromDate = (date: string): ClaseHorario['dia'] | null => {
  const day = new Date(`${date}T12:00:00`).getDay();
  const days: Array<ClaseHorario['dia'] | null> = [null, 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
  return days[day] || null;
};

const buildHorarios = (materias: Materia[]): ClaseHorario[] => {
  const horasLog = safeParse<Array<Record<string, unknown>>>(readStorage('horas_log'), []);
  const seen = new Set<string>();
  const horarios: ClaseHorario[] = [];

  horasLog.forEach((entry, index) => {
    const materiaId = String(entry._key || '');
    const materia = materias.find((item) => item.id === materiaId);
    const fecha = String(entry.fecha || '');
    const dia = dayFromDate(fecha);
    if (!materia || !dia) return;

    const horaInicio = String(entry.entrada || '08:00');
    const horaFin = String(entry.salida || '10:00');
    const key = `${materiaId}-${dia}-${horaInicio}-${horaFin}`;
    if (seen.has(key)) return;
    seen.add(key);
    horarios.push({
      id: `h-${index}-${materiaId}`,
      materiaId,
      dia,
      horaInicio,
      horaFin,
      aula: String(entry.aula || entry.curso || materia.codigo),
    });
  });

  return horarios;
};

const buildUsers = (alumnos: Alumno[]): User[] => {
  const firstAlumno = alumnos.find((alumno) => alumno.email);
  return [
    {
      id: 'u-admin',
      nombre: 'Fernando',
      apellido: 'Portilla',
      email: ADMIN_EMAILS[0],
      password: 'admin',
      rol: 'admin',
      provider: 'google',
    },
    {
      id: DOCENTE_ID,
      nombre: 'Docente',
      apellido: 'Redes & TICs',
      email: 'docente@redes-tics.local',
      password: 'docente',
      rol: 'docente',
      provider: 'local',
    },
    {
      id: ALUMNO_DEMO_ID,
      nombre: firstAlumno?.nombre || 'Alumno',
      apellido: firstAlumno?.apellido || 'Demo',
      email: firstAlumno?.email || 'alumno@redes-tics.local',
      password: 'alumno',
      rol: 'alumno',
      provider: 'local',
    },
  ];
};

const buildNotifications = (alumnos: Alumno[], asistencias: Asistencia[]): Notificacion[] => {
  const notifications: Notificacion[] = [
    {
      id: 'n-backup',
      titulo: 'Backup protegido',
      mensaje: 'Se conserva una copia de la web anterior y un respaldo de mayo antes del cambio visual.',
      fecha: new Date().toISOString(),
      leida: false,
      tipo: 'success',
      destinatarioId: 'u-admin',
    },
  ];

  alumnos.slice(0, 3).forEach((alumno) => {
    const records = asistencias.filter((item) => item.alumnoId === alumno.id);
    if (records.length === 0) return;
    const ausencias = records.filter((item) => item.estado === 'ausente').length;
    const pct = Math.round((ausencias / records.length) * 100);
    if (pct >= 20) {
      notifications.push({
        id: `n-risk-${alumno.id}`,
        titulo: 'Alumno con inasistencias',
        mensaje: `${alumno.nombre} ${alumno.apellido} tiene ${pct}% de faltas registradas.`,
        fecha: new Date().toISOString(),
        leida: false,
        tipo: 'warning',
        destinatarioId: DOCENTE_ID,
      });
    }
  });

  return notifications;
};

/* ─── One-time migration v3: move tics_sabados students to redes_M ─── */
const MIGRATION_FLAG_TICS_SAB = 'tics_sabados_to_redes_M_v1';

const runMigrationsV3 = () => {
  if (typeof window === 'undefined') return;
  if (__firebaseDownloadedThisSession) return; // Firebase data is authoritative, skip
  if (hasMigrationFlag(MIGRATION_FLAG_TICS_SAB)) return;

  const raw = window.localStorage.getItem(STORAGE_STATE_KEY);
  if (!raw) return;

  try {
    const state = JSON.parse(raw) as Record<string, LegacyModule>;
    const SAB_TO_MANANA: Record<string, string> = {
      tics_S_1: 'redes_M_1',
      tics_S_2: 'redes_M_2',
      tics_S_3: 'redes_M_3',
      tics_S_4: 'redes_M_4',
    };

    let changed = false;
    let totalMigrated = 0;

    Object.entries(SAB_TO_MANANA).forEach(([sabId, mananaId]) => {
      const sab = state[sabId];
      if (!sab?.alumnos?.length) return;

      if (!state[mananaId]) {
        state[mananaId] = { alumnos: [], fechas: [], asistencias: {}, motivos: {} };
      }
      const manana = state[mananaId];
      const existingNames = new Set((manana.alumnos || []).map(a => String(a.nombre || '').trim()));

      sab.alumnos.forEach(student => {
        const name = String(student.nombre || '').trim();
        if (!existingNames.has(name) && !student.retirado) {
          manana.alumnos = manana.alumnos || [];
          manana.alumnos.push({ ...student });
          totalMigrated++;
        }
      });

      // Copy attendance records
      Object.entries(sab.asistencias || {}).forEach(([studentId, byDate]) => {
        manana.asistencias = manana.asistencias || {};
        if (!manana.asistencias[studentId]) {
          manana.asistencias[studentId] = { ...byDate };
        }
      });

      // Copy motivos
      Object.entries(sab.motivos || {}).forEach(([studentId, byDate]) => {
        manana.motivos = manana.motivos || {};
        if (!manana.motivos[studentId]) {
          manana.motivos[studentId] = { ...byDate };
        }
      });

      // Merge dates
      const allDates = new Set([...(manana.fechas || []), ...(sab.fechas || [])]);
      manana.fechas = [...allDates].sort();

      // Clear sab students
      sab.alumnos = [];
      changed = true;
    });

    if (changed) {
      try {
        window.localStorage.setItem('asist_state_backup_tics_sab_v1', raw);
      } catch {
        // Ignore quota error for backup
      }
      saveStateLocally(state);
      console.log(`[REDES_MIGRACION_V3] Completada. ${totalMigrated} alumnos migrados de tics_S a redes_M.`);
    }
    setMigrationFlag(MIGRATION_FLAG_TICS_SAB);
  } catch (e) {
    console.error('[REDES_MIGRACION_V3] Error:', e);
  }
};

export const loadInitialAppData = (): InitialAppData => {
  // Run one-time migrations first
  runMigrationsV3();



  // Use legacy state
  const state = getStateLocally();
  applyTechnologyTurnSeparation(state);

  // Cleanup legacy duplicates that were deleted from Firebase
  ['M-1', 'M-2', 'M-3', 'M-4', 'T-1', 'T-2', 'T-3', 'T-4'].forEach(id => {
    delete state[id];
  });

  const hasLegacyState = Object.keys(state).length > 0;
  console.log(`[LOAD_INITIAL] firebaseDownloaded=${__firebaseDownloadedThisSession}, stateKeys=${Object.keys(state).length}, hasLegacy=${hasLegacyState}`);
  if (!hasLegacyState) {
    return {
      alumnos: mockAlumnos,
      materias: mockMaterias,
      asistencias: mockAsistencias,
      notificaciones: mockNotificaciones,
      horarios: mockHorarios,
      periodos: mockPeriodos,
      usuarios: mockUsuarios,
      source: 'mock',
    };
  }

  const careers = getCareers();
  const moduleIds = new Set<string>();
  careers.forEach((career) => career.secciones?.forEach((section) => moduleIds.add(section.id)));
  Object.keys(state).forEach((key) => moduleIds.add(key));

  const materias = [...moduleIds].filter((moduleId) => !isHiddenMateriaId(moduleId)).sort().map((moduleId, index): Materia => {
    const meta = labelFor(careers, moduleId);
    return {
      id: moduleId,
      nombre: meta.name,
      codigo: meta.code,
      docenteId: DOCENTE_ID,
      descripcion: 'Módulo migrado desde la versión anterior del sistema.',
      color: meta.color || COLORS[index % COLORS.length],
    };
  });

  const alumnosByKey = new Map<string, Alumno>();
  const legacyRefToAlumno = new Map<string, string>();
  const addLegacyRef = (materiaId: string, key: unknown, alumnoId: string) => {
    const rawKey = String(key ?? '').trim();
    if (!rawKey) return;
    const scopedKey = `${materiaId}:${rawKey}`;
    if (!legacyRefToAlumno.has(scopedKey)) legacyRefToAlumno.set(scopedKey, alumnoId);

    const normalizedKey = normalize(rawKey);
    if (normalizedKey) {
      const scopedNormalizedKey = `${materiaId}:${normalizedKey}`;
      if (!legacyRefToAlumno.has(scopedNormalizedKey)) legacyRefToAlumno.set(scopedNormalizedKey, alumnoId);
    }
  };

  let unmatchedAttendanceCount = 0;
  materias.forEach((materia) => {
    const module = state[materia.id];
    const addLegacyStudent = (legacyStudent: LegacyStudent, isRetired: boolean) => {
      const fullName = String(legacyStudent.nombre || '').trim();
      if (!fullName) return;

      const email = String(legacyStudent.correo || legacyStudent.email || '').trim();
      const identity = normalize(email || fullName);
      const alumnoId = `a-${hash(identity)}`;
      const names = splitName(fullName);
      const current = alumnosByKey.get(alumnoId);
      const legacyStudentId = String(legacyStudent.id ?? `${materia.id}-${hash(fullName)}`);
      const dni = formatDni(legacyStudent.dni);
      const estado: Alumno['estado'] = isRetired || legacyStudent.retirado ? 'retirado' : 'activo';

      if (current) {
        if (!current.materias.includes(materia.id)) current.materias.push(materia.id);
        current.legacyRefs = { ...current.legacyRefs, [materia.id]: current.legacyRefs?.[materia.id] || legacyStudentId };
        if (estado === 'activo') {
          current.estado = 'activo';
        } else if (!current.estado) {
          current.estado = 'retirado';
        }
      } else {
        alumnosByKey.set(alumnoId, {
          id: alumnoId,
          nombre: names.nombre,
          apellido: names.apellido,
          email,
          dni,
          curso: legacyStudent.curso || materia.codigo,
          estado,
          materias: [materia.id],
          legacyRefs: { [materia.id]: legacyStudentId },
        });
      }

      addLegacyRef(materia.id, legacyStudentId, alumnoId);
      addLegacyRef(materia.id, alumnoId, alumnoId);
      addLegacyRef(materia.id, legacyStudent.id, alumnoId);
      addLegacyRef(materia.id, hash(identity), alumnoId);
      addLegacyRef(materia.id, hash(fullName), alumnoId);
      addLegacyRef(materia.id, `${materia.id}-${hash(fullName)}`, alumnoId);
      addLegacyRef(materia.id, fullName, alumnoId);
      addLegacyRef(materia.id, `${names.apellido} ${names.nombre}`, alumnoId);
      addLegacyRef(materia.id, `${names.apellido}, ${names.nombre}`, alumnoId);
      addLegacyRef(materia.id, dni, alumnoId);
      addLegacyRef(materia.id, email, alumnoId);
    };

    module?.alumnos?.forEach((legacyStudent) => addLegacyStudent(legacyStudent, !!legacyStudent.retirado));
    module?.retirados?.forEach((legacyStudent) => addLegacyStudent(legacyStudent, true));
  });

  const asistenciasByKey = new Map<string, Asistencia>();
  let orphanStudentCount = 0;
  const findAlumnoIdForLegacyKey = (materiaId: string, legacyKey: unknown) => {
    const rawKey = String(legacyKey ?? '').trim();
    if (!rawKey) return undefined;
    const directMatch = legacyRefToAlumno.get(`${materiaId}:${rawKey}`) || legacyRefToAlumno.get(`${materiaId}:${normalize(rawKey)}`);
    if (directMatch) return directMatch;

    const normalizedParts = normalize(rawKey).split(' ').filter(Boolean);
    const suffix = normalizedParts[normalizedParts.length - 1];
    if (suffix && suffix.length >= 4) {
      return legacyRefToAlumno.get(`${materiaId}:${suffix}`);
    }
    return undefined;
  };

  const ensureOrphanAlumno = (materia: Materia, legacyStudentId: string) => {
    const alumnoId = `a-orphan-${materia.id}-${hash(legacyStudentId)}`;
    if (!alumnosByKey.has(alumnoId)) {
      alumnosByKey.set(alumnoId, {
        id: alumnoId,
        nombre: `ID ${legacyStudentId}`,
        apellido: 'Alumno sin ficha',
        email: '',
        dni: '',
        curso: materia.codigo,
        estado: 'retirado',
        materias: [materia.id],
        legacyRefs: { [materia.id]: legacyStudentId },
      });
      orphanStudentCount++;
    }
    addLegacyRef(materia.id, legacyStudentId, alumnoId);
    return alumnoId;
  };

  const getMotivo = (module: LegacyModule | undefined, legacyStudentId: string, rawFecha: string, fecha: string) => {
    const motivos = asPlainRecord(module?.motivos);
    const byStudent = asPlainRecord(motivos[legacyStudentId]);
    const byRawDate = asPlainRecord(motivos[rawFecha]);
    const byNormalizedDate = asPlainRecord(motivos[fecha]);
    const value = byStudent[rawFecha] ?? byStudent[fecha] ?? byRawDate[legacyStudentId] ?? byNormalizedDate[legacyStudentId];
    return value ? String(value) : undefined;
  };

  materias.forEach((materia) => {
    const module = state[materia.id];
    const rawAsistencias = asPlainRecord(module?.asistencias);
    const addAsistencia = (legacyStudentId: string, rawFecha: string, rawEstado: unknown) => {
      const estadoValue = legacyAttendanceValue(rawEstado);
      if (!estadoValue) return;

      const fecha = normalizeDateKey(rawFecha);
      if (!isFullDateKey(fecha)) return;

      const alumnoId = findAlumnoIdForLegacyKey(materia.id, legacyStudentId) || ensureOrphanAlumno(materia, legacyStudentId);
      if (!alumnoId) {
        unmatchedAttendanceCount++;
        return;
      }

      const key = `${alumnoId}:${materia.id}:${fecha}`;
      asistenciasByKey.set(key, {
        id: `as-${materia.id}-${legacyStudentId}-${fecha}`,
        alumnoId,
        materiaId: materia.id,
        fecha,
        estado: legacyToEstado(estadoValue),
        observacion: getMotivo(module, legacyStudentId, rawFecha, fecha),
        registradoPor: DOCENTE_ID,
      });
    };

    Object.entries(rawAsistencias).forEach(([outerKey, outerValue]) => {
      const innerRecord = asPlainRecord(outerValue);
      if (isFullDateKey(outerKey)) {
        const fecha = normalizeDateKey(outerKey);
        Object.entries(innerRecord).forEach(([legacyStudentId, estado]) => addAsistencia(legacyStudentId, fecha, estado));
        return;
      }

      Object.entries(innerRecord).forEach(([rawFecha, estado]) => addAsistencia(outerKey, rawFecha, estado));
    });
  });

  const asistencias = [...asistenciasByKey.values()];
  if (unmatchedAttendanceCount > 0) {
    console.warn(`[LOAD_INITIAL] ${unmatchedAttendanceCount} asistencias de Firebase no pudieron asociarse a alumnos visibles.`);
  }
  if (orphanStudentCount > 0) {
    console.warn(`[LOAD_INITIAL] ${orphanStudentCount} alumnos sin ficha fueron reconstruidos desde asistencias de Firebase.`);
  }

  const alumnos = [...alumnosByKey.values()].sort((a, b) =>
    `${a.apellido} ${a.nombre}`.localeCompare(`${b.apellido} ${b.nombre}`, 'es', { sensitivity: 'base' })
  );
  console.log(`[LOAD_INITIAL] Built ${alumnos.length} alumnos, ${asistencias.length} asistencias, ${materias.length} materias`);
  // Find latest asistencia date
  if (asistencias.length > 0) {
    const latestAsist = asistencias.reduce((latest, a) => a.fecha > latest ? a.fecha : latest, '');
    console.log(`[LOAD_INITIAL] Latest asistencia date: ${latestAsist}`);
  }

  const usuarios = buildUsers(alumnos);

  return {
    alumnos,
    materias,
    asistencias,
    notificaciones: buildNotifications(alumnos, asistencias),
    horarios: buildHorarios(materias),
    periodos: buildPeriodos(uniqueDates(state)),
    usuarios,
    source: 'legacy',
  };
};

export const persistLegacyAttendanceBatch = (items: Omit<Asistencia, 'id'>[], alumnos: Alumno[]) => {
  if (typeof window === 'undefined' || items.length === 0) return;

  const state = getStateLocally();
  const touchedModules = new Set<string>();
  items.forEach((item) => {
    const alumno = alumnos.find((candidate) => candidate.id === item.alumnoId);
    const legacyStudentId = alumno?.legacyRefs?.[item.materiaId];
    if (!legacyStudentId) return;

    const module = state[item.materiaId] || { alumnos: [], fechas: [], asistencias: {} };
    module.fechas = Array.from(new Set([...(module.fechas || []), item.fecha])).sort();
    module.asistencias = module.asistencias || {};
    module.asistencias[legacyStudentId] = module.asistencias[legacyStudentId] || {};
    module.asistencias[legacyStudentId][item.fecha] = estadoToLegacy(item.estado);
    if (item.observacion) {
      module.motivos = module.motivos || {};
      module.motivos[legacyStudentId] = module.motivos[legacyStudentId] || {};
      module.motivos[legacyStudentId][item.fecha] = item.observacion;
    }
    state[item.materiaId] = module;
    touchedModules.add(item.materiaId);
  });

  saveStateLocally(state);
  syncTouchedModules(touchedModules, state);
};

export const deleteLegacyAttendance = (alumnoId: string, materiaId: string, fecha: string, alumnos: Alumno[]) => {
  if (typeof window === 'undefined') return;

  try {
    const state = getStateLocally();
    const alumno = alumnos.find((a) => a.id === alumnoId);
    const legacyStudentId = alumno?.legacyRefs?.[materiaId];

    if (legacyStudentId && state[materiaId]?.asistencias?.[legacyStudentId]) {
      delete state[materiaId].asistencias[legacyStudentId][fecha];
      
      if (state[materiaId].motivos?.[legacyStudentId]) {
        delete state[materiaId].motivos![legacyStudentId][fecha];
      }
      
      saveStateLocally(state);
      queueLegacyModuleSync(materiaId);
      console.log(`Asistencia de alumno ${alumnoId} en la fecha ${fecha} limpiada localmente y encolada para Firebase.`);
    }
  } catch (error) {
    console.error("Error real al limpiar asistencia en base de datos:", error);
  }
};

export const persistAlumno = (alumnoId: string, updates: Partial<Alumno>, currentAlumnos: Alumno[]) => {
  if (typeof window === 'undefined') return;

  try {
    const state = getStateLocally();
    let touched = false;
    const touchedModules = new Set<string>();

    const alumno = currentAlumnos.find(a => a.id === alumnoId);
    if (!alumno) return;
    const nextAlumno: Alumno = {
      ...alumno,
      ...updates,
      legacyRefs: { ...(alumno.legacyRefs || {}) },
    };
    const nextMateriaIds = Array.isArray(updates.materias) ? updates.materias : alumno.materias;
    const moduleIds = new Set([
      ...Object.keys(nextAlumno.legacyRefs || {}),
      ...nextMateriaIds,
    ]);

    moduleIds.forEach(materiaId => {
      const module = state[materiaId] || { alumnos: [], fechas: [], asistencias: {}, motivos: {} };
      module.alumnos = module.alumnos || [];
      module.retirados = module.retirados || [];

      let legacyId = nextAlumno.legacyRefs?.[materiaId];
      const shouldBelongToModule = nextMateriaIds.includes(materiaId);
      if (!legacyId && shouldBelongToModule) {
        legacyId = `${nextAlumno.id}-${hash(materiaId)}`;
        nextAlumno.legacyRefs![materiaId] = legacyId;
      }
      if (!legacyId) return;
      
      const activeStudents = module.alumnos || [];
      const retiredStudents = module.retirados || [];
      const activeStudent = activeStudents.find(a => String(a.id) === String(legacyId));
      const retiredStudent = retiredStudents.find(a => String(a.id) === String(legacyId));
      const legacyStudent = activeStudent || retiredStudent;
      const shouldRetire = nextAlumno.estado === 'retirado' || !shouldBelongToModule;
      const updatedStudent: LegacyStudent = {
        ...(legacyStudent || {}),
        id: legacyId,
        nombre: `${nextAlumno.apellido} ${nextAlumno.nombre}`.trim(),
        correo: nextAlumno.email,
        email: nextAlumno.email,
        dni: nextAlumno.dni,
        curso: nextAlumno.curso,
        retirado: shouldRetire,
      };

      if (shouldRetire) {
        module.alumnos = activeStudents.filter(a => String(a.id) !== String(legacyId));
        module.retirados = retiredStudents.some(a => String(a.id) === String(legacyId))
          ? retiredStudents.map(a => String(a.id) === String(legacyId) ? updatedStudent : a)
          : [...retiredStudents, updatedStudent];
      } else {
        module.retirados = retiredStudents.filter(a => String(a.id) !== String(legacyId));
        module.alumnos = activeStudents.some(a => String(a.id) === String(legacyId))
          ? activeStudents.map(a => String(a.id) === String(legacyId) ? updatedStudent : a)
          : [...activeStudents, updatedStudent];
      }

      state[materiaId] = module;
      touched = true;
      touchedModules.add(materiaId);
    });

    if (touched) {
      saveStateLocally(state);
      syncTouchedModules(touchedModules, state);
      console.log(`Alumno con ID ${alumnoId} actualizado localmente y encolado para Firebase.`);
    }
  } catch (error) {
    console.error("Error real al eliminar/actualizar en base de datos:", error);
  }
};

export const persistNewAlumno = (alumno: Alumno) => {
  if (typeof window === 'undefined') return;

  try {
    const state = getStateLocally();
    let touched = false;
    const touchedModules = new Set<string>();

    alumno.legacyRefs = alumno.legacyRefs || {};

    alumno.materias.forEach(materiaId => {
      const module = state[materiaId] || { alumnos: [], fechas: [], asistencias: {}, motivos: {} };
      module.alumnos = module.alumnos || [];
      
      const newLegacyId = alumno.id.replace('a', '') + Math.floor(Math.random() * 1000);
      module.alumnos.push({
        id: newLegacyId,
        nombre: `${alumno.apellido} ${alumno.nombre}`.trim(),
        correo: alumno.email,
        dni: alumno.dni,
        curso: alumno.curso,
        retirado: false
      });
      
      alumno.legacyRefs![materiaId] = newLegacyId;
      state[materiaId] = module;
      touched = true;
      touchedModules.add(materiaId);
    });

    if (touched) {
      saveStateLocally(state);
      syncTouchedModules(touchedModules, state);
      console.log(`Nuevo alumno guardado localmente y encolado para Firebase.`);
    }
  } catch (error) {
    console.error("Error al guardar nuevo alumno en base de datos:", error);
  }
};

export const createLegacyBackup = () => {
  const backup = {
    state: getStateLocally(),
    personalizados: safeParse<unknown[]>(readStorage('asist_personalizados'), []),
    historial: safeParse<unknown[]>(readStorage('asist_historial'), []),
    carreras: safeParse<LegacyCareer[]>(readStorage('asist_carreras'), DEFAULT_CAREERS),
    horasLog: safeParse<unknown[]>(readStorage('horas_log'), []),
    claseBaseConfig: safeParse<Record<string, unknown>>(readStorage('clase_base_config'), {}),
    exportedAt: new Date().toISOString(),
    exportedFrom: 'new-react-ui',
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `backup_asistencias_${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
};

export const importLegacyBackup = async (jsonString: string): Promise<{ success: boolean; message: string }> => {
  try {
    const backup = JSON.parse(jsonString);
    if (!backup.state || typeof backup.state !== 'object') {
      return { success: false, message: 'Archivo inválido: falta el estado principal.' };
    }

    // Guardar en LocalStorage
    saveStateLocally(backup.state);
    if (backup.personalizados) window.localStorage.setItem('asist_personalizados', JSON.stringify(backup.personalizados));
    if (backup.historial) window.localStorage.setItem('asist_historial', JSON.stringify(backup.historial));
    if (backup.carreras) window.localStorage.setItem('asist_carreras', JSON.stringify(backup.carreras));
    if (backup.horasLog) window.localStorage.setItem('horas_log', JSON.stringify(backup.horasLog));
    if (backup.claseBaseConfig) window.localStorage.setItem('clase_base_config', JSON.stringify(backup.claseBaseConfig));

    // Encolar todos los modulos para que se respalden en la siguiente sincronizacion.
    Object.keys(backup.state).forEach((moduleId) => queueLegacyModuleSync(moduleId));

    return { success: true, message: 'Datos importados en local y encolados para Firebase. Recargando pagina...' };
  } catch (error) {
    return { success: false, message: `Error al leer el archivo: ${error instanceof Error ? error.message : 'JSON inválido'}` };
  }
};
