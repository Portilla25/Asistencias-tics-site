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
    id: 'redes',
    nombre: 'Redes & TICs',
    color: '#f59e0b',
    secciones: [
      { id: 'redes_M_1', label: 'Mañana - Módulo 1 (09:00–13:00)', badge: 'Mañana M1' },
      { id: 'redes_M_2', label: 'Mañana - Módulo 2 (09:00–13:00)', badge: 'Mañana M2' },
      { id: 'redes_M_3', label: 'Mañana - Módulo 3 (09:00–13:00)', badge: 'Mañana M3' },
      { id: 'redes_M_4', label: 'Mañana - Módulo 4 (09:00–13:00)', badge: 'Mañana M4' },
      { id: 'redes_T_1', label: 'Tarde - Módulo 1 (14:00–18:00)', badge: 'Tarde M1' },
      { id: 'redes_T_2', label: 'Tarde - Módulo 2 (14:00–18:00)', badge: 'Tarde M2' },
      { id: 'redes_T_3', label: 'Tarde - Módulo 3 (14:00–18:00)', badge: 'Tarde M3' },
      { id: 'redes_T_4', label: 'Tarde - Módulo 4 (14:00–18:00)', badge: 'Tarde M4' },
    ],
  },
  {
    id: 'info_gastro',
    nombre: 'Gastronomía · Tecnologías de la Información',
    color: '#0d9488',
    secciones: [{ id: 'info_gastro_L_1', label: 'Lunes 10:30–12:20 (2h)', badge: 'Lunes' }],
  },

  {
    id: 'redes_sabados',
    nombre: 'Tecnologías de la Información y Redes',
    color: '#e11d48',
    secciones: [
      { id: 'redes_S_M1', label: 'Sábado Mañana - Módulo 1', badge: 'Sáb Mañana M1' },
      { id: 'redes_S_M2', label: 'Sábado Mañana - Módulo 2', badge: 'Sáb Mañana M2' },
      { id: 'redes_S_M3', label: 'Sábado Mañana - Módulo 3', badge: 'Sáb Mañana M3' },
      { id: 'redes_S_M4', label: 'Sábado Mañana - Módulo 4', badge: 'Sáb Mañana M4' },
      { id: 'redes_S_T1', label: 'Sábado Tarde - Módulo 1', badge: 'Sáb Tarde T1' },
      { id: 'redes_S_T2', label: 'Sábado Tarde - Módulo 2', badge: 'Sáb Tarde T2' },
      { id: 'redes_S_T3', label: 'Sábado Tarde - Módulo 3', badge: 'Sáb Tarde T3' },
      { id: 'redes_S_T4', label: 'Sábado Tarde - Módulo 4', badge: 'Sáb Tarde T4' },
    ],
  },
];

export { DEFAULT_CAREERS };

const safeParse = <T,>(value: string | null, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

export const getCareers = (): LegacyCareer[] => {
  return safeParse<LegacyCareer[]>(readStorage('asist_carreras'), DEFAULT_CAREERS);
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
    const state = safeParse<Record<string, LegacyModule>>(window.localStorage.getItem(STORAGE_STATE_KEY), {});
    if (!state[newModuleId]) {
      state[newModuleId] = { alumnos: [], fechas: [], asistencias: {} };
      window.localStorage.setItem(STORAGE_STATE_KEY, JSON.stringify(state));
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
  const config = safeParse<Record<string, unknown>>(window.localStorage.getItem('fb_config'), {});
  if (Object.keys(config).length === 0) return null;
  const app = window.firebase.apps?.length ? window.firebase.app() : window.firebase.initializeApp(config);
  return window.firebase.firestore(app);
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
};

const syncTouchedModules = (moduleIds: Set<string>, state: Record<string, LegacyModule>) => {
  moduleIds.forEach((moduleId) => {
    syncLegacyModuleToFirestore(moduleId, state[moduleId]).catch((error) => {
      console.warn(`No se pudo sincronizar ${moduleId} con Firestore`, error);
    });
  });
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
    module.fechas?.forEach((date) => dates.add(date));
    Object.values(module.asistencias || {}).forEach((byDate) => {
      Object.keys(byDate || {}).forEach((date) => dates.add(date));
    });
  });
  return [...dates].sort();
};

const buildPeriodos = (dates: string[]): Periodo[] => {
  const activeDate = dates[dates.length - 1] || new Date().toLocaleDateString('en-CA');
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

/* ─── One-time migration v2: ensure ALL Redes students in ALL 4 Tarde modules ─── */
const MIGRATION_FLAG_TURNO = 'redes_turno_migration_v2';

const runMigrations = () => {
  if (typeof window === 'undefined') return;
  if (window.localStorage.getItem(MIGRATION_FLAG_TURNO)) return;

  const raw = window.localStorage.getItem(STORAGE_STATE_KEY);
  if (!raw) return;

  try {
    const state = JSON.parse(raw) as Record<string, LegacyModule>;
    const allModuleIds = ['redes_M_1','redes_M_2','redes_M_3','redes_M_4','redes_T_1','redes_T_2','redes_T_3','redes_T_4'];
    const afternoonIds = ['redes_T_1','redes_T_2','redes_T_3','redes_T_4'];

    // Step 1: Collect ALL unique students by name from all redes modules
    const byName = new Map<string, LegacyStudent>();
    allModuleIds.forEach(mId => {
      const mod = state[mId];
      if (!mod?.alumnos) return;
      mod.alumnos.forEach(student => {
        if (student.retirado) return;
        const name = String(student.nombre || '').trim();
        if (!name) return;
        // Keep the version with more data (longer JSON = more fields filled)
        const existing = byName.get(name);
        if (!existing || JSON.stringify(student).length > JSON.stringify(existing).length) {
          byName.set(name, { ...student });
        }
      });
    });

    const allStudents = [...byName.values()];
    console.log(`[REDES_MIGRACION_V2] ${allStudents.length} alumnos únicos encontrados`);

    // Step 2: Ensure ALL students exist in ALL 4 afternoon modules
    let totalAdded = 0;
    afternoonIds.forEach(tId => {
      if (!state[tId]) {
        state[tId] = { alumnos: [], fechas: [], asistencias: {}, motivos: {} };
      }
      const mod = state[tId];
      const existingNames = new Set((mod.alumnos || []).map(a => String(a.nombre || '').trim()));

      allStudents.forEach(student => {
        const name = String(student.nombre || '').trim();
        if (!existingNames.has(name)) {
          // Generate a new unique id for this student in this module
          const newId = Date.now() + Math.floor(Math.random() * 10000);
          mod.alumnos = mod.alumnos || [];
          mod.alumnos.push({ ...student, id: newId, retirado: false });
          totalAdded++;
        }
      });

      // Sort students alphabetically
      if (mod.alumnos) {
        mod.alumnos.sort((a, b) =>
          String(a.nombre || '').localeCompare(String(b.nombre || ''), 'es')
        );
      }

      console.log(`[REDES_MIGRACION_V2] ${tId}: ${mod.alumnos?.length || 0} alumnos`);
    });

    // Step 3: Merge attendance from morning to all afternoon modules
    const morningIds = ['redes_M_1','redes_M_2','redes_M_3','redes_M_4'];
    morningIds.forEach((mId, idx) => {
      const morning = state[mId];
      const tId = afternoonIds[idx];
      const afternoon = state[tId];
      if (!morning || !afternoon) return;

      // Copy attendance records that don't exist yet
      Object.entries(morning.asistencias || {}).forEach(([studentId, byDate]) => {
        afternoon.asistencias = afternoon.asistencias || {};
        if (!afternoon.asistencias[studentId]) {
          afternoon.asistencias[studentId] = { ...byDate };
        }
      });

      // Merge motivos
      Object.entries(morning.motivos || {}).forEach(([studentId, byDate]) => {
        afternoon.motivos = afternoon.motivos || {};
        if (!afternoon.motivos[studentId]) {
          afternoon.motivos[studentId] = { ...byDate };
        }
      });

      // Merge dates
      const allDates = new Set([...(afternoon.fechas || []), ...(morning.fechas || [])]);
      afternoon.fechas = [...allDates].sort();

      // Clear morning students
      morning.alumnos = [];
    });

    // Clean old backups to free localStorage space
    ['asist_state_backup_redes_v1', 'asist_state_backup_turno_v1', 'redes_migracion_v1', 'redes_turno_migration_v1', 'reporteComparativoRedes'].forEach(k => {
      try { window.localStorage.removeItem(k); } catch { /* ignore */ }
    });

    // Backup (skip if quota exceeded) and save
    try {
      window.localStorage.setItem('asist_state_backup_turno_v2', raw);
    } catch {
      console.warn('[REDES_MIGRACION_V2] No se pudo guardar backup en localStorage (cuota excedida). Usa el backup descargado.');
    }
    window.localStorage.setItem(STORAGE_STATE_KEY, JSON.stringify(state));
    window.localStorage.setItem(MIGRATION_FLAG_TURNO, new Date().toISOString());
    console.log(`[REDES_MIGRACION_V2] Completada. ${totalAdded} alumnos añadidos.`);
  } catch (e) {
    console.error('[REDES_MIGRACION_V2] Error:', e);
  }
};

/* ─── One-time migration v3: move tics_sabados students to redes_M ─── */
const MIGRATION_FLAG_TICS_SAB = 'tics_sabados_to_redes_M_v1';

const runMigrationsV3 = () => {
  if (typeof window === 'undefined') return;
  if (window.localStorage.getItem(MIGRATION_FLAG_TICS_SAB)) return;

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
      window.localStorage.setItem(STORAGE_STATE_KEY, JSON.stringify(state));
      console.log(`[REDES_MIGRACION_V3] Completada. ${totalMigrated} alumnos migrados de tics_S a redes_M.`);
    }
    window.localStorage.setItem(MIGRATION_FLAG_TICS_SAB, new Date().toISOString());
  } catch (e) {
    console.error('[REDES_MIGRACION_V3] Error:', e);
  }
};

export const loadInitialAppData = (): InitialAppData => {
  // Run one-time migrations first
  runMigrations();
  runMigrationsV3();

  const state = safeParse<Record<string, LegacyModule>>(readStorage(STORAGE_STATE_KEY), {});
  const hasLegacyState = Object.keys(state).length > 0;
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

  const careers = safeParse<LegacyCareer[]>(readStorage('asist_carreras'), DEFAULT_CAREERS);
  const moduleIds = new Set<string>();
  careers.forEach((career) => career.secciones?.forEach((section) => moduleIds.add(section.id)));
  Object.keys(state).forEach((key) => moduleIds.add(key));

  const materias = [...moduleIds].sort().map((moduleId, index): Materia => {
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

  materias.forEach((materia) => {
    const module = state[materia.id];
    module?.alumnos?.forEach((legacyStudent) => {
      if (legacyStudent.retirado) return;
      const fullName = String(legacyStudent.nombre || '').trim();
      if (!fullName) return;

      const email = String(legacyStudent.correo || legacyStudent.email || '').trim();
      const identity = normalize(email || fullName);
      const alumnoId = `a-${hash(identity)}`;
      const names = splitName(fullName);
      const current = alumnosByKey.get(alumnoId);
      const legacyStudentId = String(legacyStudent.id ?? `${materia.id}-${hash(fullName)}`);

      if (current) {
        if (!current.materias.includes(materia.id)) current.materias.push(materia.id);
        current.legacyRefs = { ...current.legacyRefs, [materia.id]: legacyStudentId };
      } else {
        alumnosByKey.set(alumnoId, {
          id: alumnoId,
          nombre: names.nombre,
          apellido: names.apellido,
          email,
          dni: formatDni(legacyStudent.dni),
          curso: legacyStudent.curso || materia.codigo,
          materias: [materia.id],
          legacyRefs: { [materia.id]: legacyStudentId },
        });
      }
      legacyRefToAlumno.set(`${materia.id}:${legacyStudentId}`, alumnoId);
    });
  });

  const asistencias: Asistencia[] = [];
  materias.forEach((materia) => {
    const module = state[materia.id];
    Object.entries(module?.asistencias || {}).forEach(([legacyStudentId, byDate]) => {
      const alumnoId = legacyRefToAlumno.get(`${materia.id}:${legacyStudentId}`);
      if (!alumnoId) return;
      Object.entries(byDate || {}).forEach(([fecha, estado]) => {
        asistencias.push({
          id: `as-${materia.id}-${legacyStudentId}-${fecha}`,
          alumnoId,
          materiaId: materia.id,
          fecha,
          estado: legacyToEstado(estado),
          observacion: module?.motivos?.[legacyStudentId]?.[fecha],
          registradoPor: DOCENTE_ID,
        });
      });
    });
  });

  const alumnos = [...alumnosByKey.values()].sort((a, b) =>
    `${a.apellido} ${a.nombre}`.localeCompare(`${b.apellido} ${b.nombre}`, 'es', { sensitivity: 'base' })
  );
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

  const state = safeParse<Record<string, LegacyModule>>(window.localStorage.getItem(STORAGE_STATE_KEY), {});
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

  window.localStorage.setItem(STORAGE_STATE_KEY, JSON.stringify(state));
  syncTouchedModules(touchedModules, state);
};

export const deleteLegacyAttendance = (alumnoId: string, materiaId: string, fecha: string, alumnos: Alumno[]) => {
  if (typeof window === 'undefined') return;

  try {
    const state = safeParse<Record<string, LegacyModule>>(window.localStorage.getItem(STORAGE_STATE_KEY), {});
    const alumno = alumnos.find((a) => a.id === alumnoId);
    const legacyStudentId = alumno?.legacyRefs?.[materiaId];

    if (legacyStudentId && state[materiaId]?.asistencias?.[legacyStudentId]) {
      delete state[materiaId].asistencias[legacyStudentId][fecha];
      
      if (state[materiaId].motivos?.[legacyStudentId]) {
        delete state[materiaId].motivos![legacyStudentId][fecha];
      }
      
      window.localStorage.setItem(STORAGE_STATE_KEY, JSON.stringify(state));
      console.log(`Asistencia de alumno ${alumnoId} en la fecha ${fecha} limpiada con éxito de la base de datos (LocalStorage).`);
    }
  } catch (error) {
    console.error("Error real al limpiar asistencia en base de datos:", error);
  }
};

export const persistAlumno = (alumnoId: string, updates: Partial<Alumno>, currentAlumnos: Alumno[]) => {
  if (typeof window === 'undefined') return;

  try {
    const state = safeParse<Record<string, LegacyModule>>(window.localStorage.getItem(STORAGE_STATE_KEY), {});
    let touched = false;

    const alumno = currentAlumnos.find(a => a.id === alumnoId);
    if (!alumno) return;

    Object.keys(alumno.legacyRefs || {}).forEach(materiaId => {
      const legacyId = alumno.legacyRefs?.[materiaId];
      if (!legacyId || !state[materiaId]?.alumnos) return;
      
      const legacyStudent = state[materiaId].alumnos?.find(a => String(a.id) === String(legacyId));
      if (legacyStudent) {
        if (updates.estado !== undefined) {
          legacyStudent.retirado = updates.estado === 'retirado';
          touched = true;
        }
      }
    });

    if (touched) {
      window.localStorage.setItem(STORAGE_STATE_KEY, JSON.stringify(state));
      console.log(`Alumno con ID ${alumnoId} actualizado/retirado con éxito de la base de datos (LocalStorage).`);
    }
  } catch (error) {
    console.error("Error real al eliminar/actualizar en base de datos:", error);
  }
};

export const persistNewAlumno = (alumno: Alumno) => {
  if (typeof window === 'undefined') return;

  try {
    const state = safeParse<Record<string, LegacyModule>>(window.localStorage.getItem(STORAGE_STATE_KEY), {});
    let touched = false;

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
    });

    if (touched) {
      window.localStorage.setItem(STORAGE_STATE_KEY, JSON.stringify(state));
      console.log(`Nuevo alumno guardado con éxito en la base de datos (LocalStorage).`);
    }
  } catch (error) {
    console.error("Error al guardar nuevo alumno en base de datos:", error);
  }
};

export const createLegacyBackup = () => {
  const backup = {
    state: safeParse<Record<string, LegacyModule>>(readStorage(STORAGE_STATE_KEY), {}),
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
  URL.revokeObjectURL(url);
};
