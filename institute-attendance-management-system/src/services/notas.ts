import { getFirebaseFirestore } from './sesiones';
import { CalificacionData, RegistroNotasMateria } from '../types';

/**
 * Obtiene las notas de todos los alumnos de una materia específica.
 * @param materiaId El ID de la materia (módulo)
 * @returns Un objeto de tipo RegistroNotasMateria (diccionario de ID de alumno -> CalificacionData)
 */
export const obtenerNotasMateria = async (materiaId: string): Promise<RegistroNotasMateria> => {
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
      };
    });

    return notas;
  } catch (error) {
    console.error(`Error al obtener notas de la materia ${materiaId}:`, error);
    return {};
  }
};

/**
 * Guarda o actualiza en lote (writeBatch) las notas de varios alumnos para una materia.
 * @param materiaId El ID de la materia (módulo)
 * @param notas Un objeto de tipo RegistroNotasMateria con las notas a guardar
 */
export const guardarNotasBatch = async (materiaId: string, notas: RegistroNotasMateria): Promise<void> => {
  const db = getFirebaseFirestore();
  const fb = (window as any).firebase;
  
  if (!db || !fb) {
    console.error("Firebase no está inicializado.");
    return;
  }

  try {
    const batch = db.batch();
    const collectionRef = db.collection('modulos').doc(materiaId).collection('notas');

    Object.entries(notas).forEach(([alumnoId, datosCalificacion]) => {
      const docRef = collectionRef.doc(alumnoId);
      batch.set(docRef, {
        ...datosCalificacion,
        updatedAt: fb.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    });

    await batch.commit();
    console.log(`Notas de la materia ${materiaId} guardadas en lote exitosamente.`);
  } catch (error) {
    console.error(`Error al guardar notas en lote para la materia ${materiaId}:`, error);
    throw error;
  }
};
