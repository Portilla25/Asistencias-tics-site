import { enqueueDeferredSync } from './deferredSync';

export interface SesionData {
  id?: string;
  fecha: string;
  numeroClase: number;
  tema: string;
  modalidad: string;
  horas: number;
  updatedAt?: any;
}

const SESIONES_CACHE_PREFIX = 'asist_sesiones_cache_';
const SESIONES_CACHE_TTL_MS = 30 * 60 * 1000;

type SesionesCache = {
  savedAtMs: number;
  data: SesionData[];
};

const cacheKey = (materiaId: string) => `${SESIONES_CACHE_PREFIX}${materiaId}`;

const readSesionesCache = (materiaId: string, allowExpired = false): SesionData[] | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(cacheKey(materiaId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SesionesCache;
    if (!Array.isArray(parsed.data)) return null;
    if (!allowExpired && Date.now() - parsed.savedAtMs > SESIONES_CACHE_TTL_MS) return null;
    return parsed.data;
  } catch {
    return null;
  }
};

const writeSesionesCache = (materiaId: string, data: SesionData[]) => {
  if (typeof window === 'undefined') return;
  try {
    const ordered = [...data].sort((a, b) => a.fecha.localeCompare(b.fecha));
    window.localStorage.setItem(cacheKey(materiaId), JSON.stringify({
      savedAtMs: Date.now(),
      data: ordered,
    }));
  } catch {
    // Cache failures should never block Firebase operations.
  }
};

const upsertSesionCache = (materiaId: string, sesion: SesionData) => {
  const cached = readSesionesCache(materiaId, true) || [];
  const next = cached.filter((item) => item.fecha !== sesion.fecha);
  next.push(sesion);
  writeSesionesCache(materiaId, next);
};

const queueSesionSync = (materiaId: string, sesion: SesionData) => {
  enqueueDeferredSync('session', { materiaId, sesion }, `${materiaId}:${sesion.fecha}`);
};

const queueSesionesBatchSync = (materiaId: string, sesiones: SesionData[]) => {
  enqueueDeferredSync('sessionsBatch', { materiaId, sesiones }, materiaId);
};

export const getFirebaseFirestore = () => {
  if (typeof window === 'undefined' || !(window as any).firebase?.firestore) return null;
  const fb = (window as any).firebase;
  const app = fb.apps?.length ? fb.app() : fb.initializeApp(JSON.parse(localStorage.getItem('asist_firebase_config') || '{}'));
  return fb.firestore(app);
};

export const getSesiones = async (materiaId: string): Promise<SesionData[]> => {
  const cached = readSesionesCache(materiaId);
  if (cached) return cached;

  const db = getFirebaseFirestore();
  if (!db) return [];
  
  try {
    const snapshot = await db.collection('modulos').doc(materiaId).collection('sesiones').orderBy('fecha', 'asc').get();
    const sesiones = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    })) as SesionData[];
    writeSesionesCache(materiaId, sesiones);
    return sesiones;
  } catch (error) {
    console.error("Error fetching sesiones:", error);
    return [];
  }
};

export const getSesion = async (materiaId: string, fecha: string): Promise<SesionData | null> => {
  const cached = readSesionesCache(materiaId);
  const cachedSesion = cached?.find((sesion) => sesion.fecha === fecha);
  if (cachedSesion) return cachedSesion;

  const db = getFirebaseFirestore();
  if (!db) return null;
  
  try {
    const doc = await db.collection('modulos').doc(materiaId).collection('sesiones').doc(fecha).get();
    if (doc.exists) {
      const sesion = { id: doc.id, ...doc.data() } as SesionData;
      upsertSesionCache(materiaId, sesion);
      return sesion;
    }
    return null;
  } catch (error) {
    console.error("Error fetching sesion:", error);
    return null;
  }
};

export const saveSesion = async (materiaId: string, fecha: string, data: Partial<SesionData>) => {
  const sesion = { ...(data as SesionData), fecha };
  upsertSesionCache(materiaId, sesion);
  queueSesionSync(materiaId, sesion);
};

export const saveSesionesBatch = async (materiaId: string, sesiones: SesionData[]) => {
  const cached = readSesionesCache(materiaId, true) || [];
  const byFecha = new Map(cached.map((sesion) => [sesion.fecha, sesion]));
  sesiones.forEach((sesion) => {
    byFecha.set(sesion.fecha, { ...byFecha.get(sesion.fecha), ...sesion });
  });
  const merged = [...byFecha.values()];
  writeSesionesCache(materiaId, merged);
  queueSesionesBatchSync(materiaId, merged);
};

export const flushSesionSyncTask = async (payload: { materiaId: string; sesion: SesionData }) => {
  const db = getFirebaseFirestore();
  const fb = (window as any).firebase;
  if (!db || !fb) throw new Error('Firebase no esta inicializado para sesiones.');

  const { materiaId, sesion } = payload;
  await db.collection('modulos').doc(materiaId).collection('sesiones').doc(sesion.fecha).set({
    ...sesion,
    fecha: sesion.fecha,
    updatedAt: fb.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
};

export const flushSesionesBatchSyncTask = async (payload: { materiaId: string; sesiones: SesionData[] }) => {
  const db = getFirebaseFirestore();
  const fb = (window as any).firebase;
  if (!db || !fb) throw new Error('Firebase no esta inicializado para sesiones.');

  const batch = db.batch();
  payload.sesiones.forEach((sesion) => {
    const docRef = db.collection('modulos').doc(payload.materiaId).collection('sesiones').doc(sesion.fecha);
    batch.set(docRef, {
      ...sesion,
      fecha: sesion.fecha,
      updatedAt: fb.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  });
  await batch.commit();
};

export const recalcularNumerosClaseBatch = async (materiaId: string, fechaEditada: string, nuevoNumero: number) => {
  try {
    const sesiones = await getSesiones(materiaId);
    const editIndex = sesiones.findIndex(s => s.fecha === fechaEditada);
    if (editIndex === -1) return;

    const recalculadas = sesiones.map((sesion, index) => ({
      ...sesion,
      numeroClase: nuevoNumero + (index - editIndex),
    }));
    writeSesionesCache(materiaId, recalculadas);
    queueSesionesBatchSync(materiaId, recalculadas);
    console.log("Recálculo en lote completado correctamente");
  } catch (error) {
    console.error("Error en recalcularNumerosClaseBatch:", error);
  }
};
