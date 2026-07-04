import { DeferredSyncTask } from './deferredSync';
import { flushLegacyModuleSyncTask } from './legacyData';
import { flushNotasSyncTask } from './notas';
import {
  flushSesionSyncTask,
  flushSesionesBatchSyncTask,
  getFirebaseFirestore,
} from './sesiones';

const readPersonalizadosLocal = (): any[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem('asist_personalizados');
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const flushPersonalizadosSyncTask = async (payload: { data?: any[] }) => {
  const db = getFirebaseFirestore();
  const fb = (window as any).firebase;
  if (!db || !fb) throw new Error('Firebase no esta inicializado para personalizados.');

  const data = Array.isArray(payload.data) ? payload.data : readPersonalizadosLocal();
  await db.collection('personalizados').doc('datos').set({
    alumnos: data,
    updatedAt: fb.firestore.FieldValue.serverTimestamp()
  });
};

export const flushQueuedFirebaseWrites = async (tasks: DeferredSyncTask[]) => {
  for (const task of tasks) {
    switch (task.type) {
      case 'legacyModule':
        await flushLegacyModuleSyncTask(task.payload.moduleId);
        break;
      case 'session':
        await flushSesionSyncTask(task.payload);
        break;
      case 'sessionsBatch':
        await flushSesionesBatchSyncTask(task.payload);
        break;
      case 'notes':
        await flushNotasSyncTask(task.payload);
        break;
      case 'personalizados':
        await flushPersonalizadosSyncTask(task.payload);
        break;
      default:
        throw new Error(`Tipo de sincronizacion no soportado: ${task.type}`);
    }
  }
};
