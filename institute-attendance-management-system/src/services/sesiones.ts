export interface SesionData {
  id?: string;
  fecha: string;
  numeroClase: number;
  tema: string;
  modalidad: string;
  horas: number;
  updatedAt?: any;
}

export const getFirebaseFirestore = () => {
  if (typeof window === 'undefined' || !(window as any).firebase?.firestore) return null;
  const fb = (window as any).firebase;
  const app = fb.apps?.length ? fb.app() : fb.initializeApp(JSON.parse(localStorage.getItem('asist_firebase_config') || '{}'));
  return fb.firestore(app);
};

export const getSesiones = async (materiaId: string): Promise<SesionData[]> => {
  const db = getFirebaseFirestore();
  if (!db) return [];
  
  try {
    const snapshot = await db.collection('modulos').doc(materiaId).collection('sesiones').orderBy('fecha', 'asc').get();
    return snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    })) as SesionData[];
  } catch (error) {
    console.error("Error fetching sesiones:", error);
    return [];
  }
};

export const getSesion = async (materiaId: string, fecha: string): Promise<SesionData | null> => {
  const db = getFirebaseFirestore();
  if (!db) return null;
  
  try {
    const doc = await db.collection('modulos').doc(materiaId).collection('sesiones').doc(fecha).get();
    if (doc.exists) {
      return { id: doc.id, ...doc.data() } as SesionData;
    }
    return null;
  } catch (error) {
    console.error("Error fetching sesion:", error);
    return null;
  }
};

export const saveSesion = async (materiaId: string, fecha: string, data: Partial<SesionData>) => {
  const db = getFirebaseFirestore();
  if (!db) return;
  
  try {
    const fb = (window as any).firebase;
    await db.collection('modulos').doc(materiaId).collection('sesiones').doc(fecha).set({
      ...data,
      fecha,
      updatedAt: fb.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error("Error saving sesion:", error);
  }
};

export const recalcularNumerosClaseBatch = async (materiaId: string, fechaEditada: string, nuevoNumero: number) => {
  const db = getFirebaseFirestore();
  if (!db) return;

  try {
    const snapshot = await db.collection('modulos').doc(materiaId).collection('sesiones').orderBy('fecha', 'asc').get();
    const sesiones = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    })) as SesionData[];

    const editIndex = sesiones.findIndex(s => s.fecha === fechaEditada);
    if (editIndex === -1) return;

    const batch = db.batch();
    const fb = (window as any).firebase;

    sesiones.forEach((sesion, index) => {
      const calculatedNumero = nuevoNumero + (index - editIndex);
      if (sesion.numeroClase !== calculatedNumero) {
        const docRef = db.collection('modulos').doc(materiaId).collection('sesiones').doc(sesion.id || sesion.fecha);
        batch.update(docRef, { 
          numeroClase: calculatedNumero,
          updatedAt: fb.firestore.FieldValue.serverTimestamp()
        });
      }
    });

    await batch.commit();
    console.log("Recálculo en lote completado correctamente");
  } catch (error) {
    console.error("Error en recalcularNumerosClaseBatch:", error);
  }
};
