import { CalificacionData, RegistroNotasMateria } from '../types';
import { enqueueDeferredSync } from './deferredSync';
import { getFirebaseFirestore } from './sesiones';

const NOTAS_CACHE_PREFIX = 'asist_notas_cache_';
const NOTAS_CACHE_TTL_MS = 30 * 60 * 1000;

type NotasCache = {
  savedAtMs: number;
  data: RegistroNotasMateria;
};

const cacheKey = (materiaId: string) => `${NOTAS_CACHE_PREFIX}${materiaId}`;

const normalizeNotas = (data: RegistroNotasMateria): RegistroNotasMateria => {
  const normalized: RegistroNotasMateria = {};
  Object.entries(data).forEach(([alumnoId, value]) => {
    normalized[alumnoId] = {
      nota1: value?.nota1 ?? null,
      nota2: value?.nota2 ?? null,
      nota3: value?.nota3 ?? null,
      promedioFinal: value?.promedioFinal ?? null,
      puntosExtra: value?.puntosExtra ?? 0,
    };
  });
  return normalized;
};

const readNotasCache = (materiaId: string, allowExpired = false): RegistroNotasMateria | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(cacheKey(materiaId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as NotasCache;
    if (!parsed.data || typeof parsed.data !== 'object') return null;
    if (!allowExpired && Date.now() - parsed.savedAtMs > NOTAS_CACHE_TTL_MS) return null;
    return normalizeNotas(parsed.data);
  } catch {
    return null;
  }
};

const writeNotasCache = (materiaId: string, data: RegistroNotasMateria) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(cacheKey(materiaId), JSON.stringify({
      savedAtMs: Date.now(),
      data,
    }));
  } catch {
    // Cache failures should never block local state in React or Firebase sync later.
  }
};

const queueNotasSync = (materiaId: string, data: RegistroNotasMateria) => {
  enqueueDeferredSync('notes', { materiaId, notas: data }, materiaId);
};

/**
 * Obtiene las notas de todos los alumnos de una materia especifica.
 */
export const obtenerNotasMateria = async (materiaId: string): Promise<RegistroNotasMateria> => {
  const cached = readNotasCache(materiaId);
  if (cached) return cached;

  const db = getFirebaseFirestore();
  if (!db) return {};

  try {
    const snapshot = await db.collection('modulos').doc(materiaId).collection('notas').get();
    const notas: RegistroNotasMateria = {};

    snapshot.docs.forEach((doc: any) => {
      const data = doc.data() as CalificacionData;
      notas[doc.id] = {
        nota1: data.nota1 ?? null,
        nota2: data.nota2 ?? null,
        nota3: data.nota3 ?? null,
        promedioFinal: data.promedioFinal ?? null,
        puntosExtra: data.puntosExtra ?? 0,
      };
    });

    writeNotasCache(materiaId, notas);
    return notas;
  } catch (error) {
    console.error(`Error al obtener notas de la materia ${materiaId}:`, error);
    return {};
  }
};

/**
 * Guarda notas localmente y deja el ultimo estado en cola para Firebase.
 */
export const guardarNotasBatch = async (materiaId: string, notas: RegistroNotasMateria): Promise<void> => {
  const cached = readNotasCache(materiaId, true) || {};
  const merged = { ...cached };
  Object.entries(notas).forEach(([alumnoId, datosCalificacion]) => {
    const previous = merged[alumnoId] || {
      nota1: null,
      nota2: null,
      nota3: null,
      promedioFinal: null,
      puntosExtra: 0,
    };
    merged[alumnoId] = {
      ...previous,
      ...datosCalificacion,
    };
  });

  const normalized = normalizeNotas(merged as RegistroNotasMateria);
  writeNotasCache(materiaId, normalized);
  queueNotasSync(materiaId, normalized);
  console.log(`Notas de la materia ${materiaId} guardadas localmente y encoladas para Firebase.`);
};

export const flushNotasSyncTask = async (payload: { materiaId: string; notas: RegistroNotasMateria }) => {
  const db = getFirebaseFirestore();
  const fb = (window as any).firebase;

  if (!db || !fb) {
    throw new Error('Firebase no esta inicializado para notas.');
  }

  const batch = db.batch();
  const collectionRef = db.collection('modulos').doc(payload.materiaId).collection('notas');

  Object.entries(payload.notas).forEach(([alumnoId, datosCalificacion]) => {
    const docRef = collectionRef.doc(alumnoId);
    batch.set(docRef, {
      ...datosCalificacion,
      updatedAt: fb.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  });

  await batch.commit();
};
