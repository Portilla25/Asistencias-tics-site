import React, { useState, useEffect } from 'react';
import { Users, Clock, Calendar, BarChart, ChevronDown, UserSquare2, Plus, X, Trash2 } from 'lucide-react';
import mergedData from '../data/merged_personalizados.json';

interface ClasePersonalizada {
  fecha: string;
  val: string;
  horas: number;
  horaInicio: string;
  horaFin: string;
}

interface AlumnoPersonalizado {
  id: number | string;
  nombre: string;
  tel: string;
  clasesRaw: string[];
  clasesParsed: ClasePersonalizada[];
  totalHoras: number;
  horasPorMes: Record<string, number>;
}

/** Calculate hours between two HH:MM time strings */
const calcHoursFromTimes = (inicio: string, fin: string): number => {
  if (!inicio || !fin) return 0;
  const [h1, m1] = inicio.split(':').map(Number);
  const [h2, m2] = fin.split(':').map(Number);
  if (isNaN(h1) || isNaN(m1) || isNaN(h2) || isNaN(m2)) return 0;
  const diff = (h2 * 60 + m2) - (h1 * 60 + m1);
  return diff > 0 ? Math.round(diff / 30) * 0.5 : 0; // round to nearest 0.5
};

const parseClase = (str: unknown): ClasePersonalizada | null => {
  let horas = 0, fecha = '', val = 'Presente', horaInicio = '', horaFin = '';

  if (typeof str === 'object' && str !== null) {
    const s = str as any;
    horas = parseFloat(s.horas || 0);
    fecha = s.fecha || '';
    val = s.val || 'Presente';
    horaInicio = s.horaInicio || '';
    horaFin = s.horaFin || '';
  } else if (typeof str === 'string') {
    const matchHours = str.match(/horas=([\d.,]+)/);
    const matchDate = str.match(/fecha=([0-9-T:\.Z]+)/);
    const matchVal = str.match(/val=([^;}]+)/);
    const matchInicio = str.match(/horaInicio=([\d:]+)/);
    const matchFin = str.match(/horaFin=([\d:]+)/);
    horas = matchHours ? parseFloat(matchHours[1].replace(',', '.')) : 0;
    fecha = matchDate ? matchDate[1].trim() : '';
    val = matchVal ? matchVal[1].trim() : 'Presente';
    horaInicio = matchInicio ? matchInicio[1].trim() : '';
    horaFin = matchFin ? matchFin[1].trim() : '';
  } else {
    return null;
  }

  // Always recalculate hours from times if both are available
  if (horaInicio && horaFin) {
    const calculated = calcHoursFromTimes(horaInicio, horaFin);
    if (calculated > 0) horas = calculated;
  }

  return { horas, fecha, val, horaInicio, horaFin };
};

const getMonthLabel = (dateStr: string) => {
  if (!dateStr) return 'Sin fecha';
  const parts = dateStr.split('-');
  if (parts.length >= 2) {
    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1);
    return d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  }
  return dateStr;
};

/* ─── Firebase helpers for personalizados ─── */
const getFirestore = () => {
  if (typeof window === 'undefined' || !(window as any).firebase?.firestore) return null;
  const raw = window.localStorage.getItem('fb_config');
  if (!raw) return null;
  try {
    const config = JSON.parse(raw);
    if (!Object.keys(config).length) return null;
    const fb = (window as any).firebase;
    const app = fb.apps?.length ? fb.app() : fb.initializeApp(config);
    return fb.firestore(app);
  } catch { return null; }
};

const saveToFirestore = (data: any[]) => {
  const db = getFirestore();
  if (!db) return;
  db.collection('personalizados').doc('datos').set({
    alumnos: data,
    updatedAt: (window as any).firebase.firestore.FieldValue.serverTimestamp()
  }).catch((e: any) => console.warn('[Personalizados] Error guardando en Firestore', e));
};

const loadFromFirestore = async (): Promise<any[] | null> => {
  const db = getFirestore();
  if (!db) return null;
  try {
    const doc = await db.collection('personalizados').doc('datos').get();
    if (doc.exists) {
      const data = doc.data();
      return data?.alumnos || null;
    }
  } catch (e) { console.warn('[Personalizados] Error leyendo Firestore', e); }
  return null;
};

/** Smart-merge: combine two arrays of students, keeping the union of all clases */
const smartMerge = (base: any[], incoming: any[]): any[] => {
  const byName = new Map<string, any>();

  // Add all from base first
  base.forEach(a => {
    const key = (a.nombre || '').trim().toLowerCase();
    byName.set(key, { ...a, clases: Array.isArray(a.clases) ? [...a.clases] : [] });
  });

  // Merge incoming — add new students, and for existing ones merge clases
  incoming.forEach(a => {
    const key = (a.nombre || '').trim().toLowerCase();
    if (!byName.has(key)) {
      byName.set(key, { ...a, clases: Array.isArray(a.clases) ? [...a.clases] : [] });
    } else {
      const existing = byName.get(key)!;
      // Deduplicate clases by fecha+horaInicio+horaFin
      const existingKeys = new Set(
        existing.clases.map((c: any) => {
          if (typeof c === 'string') return c;
          return `${c.fecha}|${c.horaInicio}|${c.horaFin}|${c.horas}`;
        })
      );
      (Array.isArray(a.clases) ? a.clases : []).forEach((c: any) => {
        const ck = typeof c === 'string' ? c : `${c.fecha}|${c.horaInicio}|${c.horaFin}|${c.horas}`;
        if (!existingKeys.has(ck)) {
          existing.clases.push(c);
          existingKeys.add(ck);
        }
      });
      // Keep the most complete tel
      if (!existing.tel && a.tel) existing.tel = a.tel;
    }
  });

  return Array.from(byName.values());
};

const persistPersonalizados = (data: any[]) => {
  localStorage.setItem('asist_personalizados', JSON.stringify(data));
  saveToFirestore(data);
};

const AlumnosPersonalizados: React.FC = () => {
  const [alumnos, setAlumnos] = useState<AlumnoPersonalizado[]>([]);
  const [expandedId, setExpandedId] = useState<string | number | null>(null);

  const refreshLocalState = () => {
    try {
      const raw = localStorage.getItem('asist_personalizados');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const enriched = parsed.map((a: any) => {
            const rawClases: string[] = Array.isArray(a.clases) ? a.clases : [];
            const parsedClases = rawClases
              .map(parseClase)
              .filter((c): c is ClasePersonalizada => c !== null && c.val.toLowerCase() === 'presente')
              .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

            let totalHoras = 0;
            const horasPorMes: Record<string, number> = {};

            parsedClases.forEach((c) => {
              totalHoras += c.horas;
              const mes = getMonthLabel(c.fecha);
              horasPorMes[mes] = (horasPorMes[mes] || 0) + c.horas;
            });

            return {
              id: a.id || Date.now() + Math.random(),
              nombre: a.nombre || 'Sin nombre',
              tel: a.tel || '-',
              clasesRaw: rawClases,
              clasesParsed: parsedClases,
              totalHoras,
              horasPorMes,
            };
          });
          setAlumnos(enriched);
        }
      }
    } catch (e) {
      console.error('Error parsing personalizados', e);
    }
  };

  const initializeData = async () => {
    try {
      const localRaw = localStorage.getItem('asist_personalizados');
      const localData: any[] = localRaw ? JSON.parse(localRaw) : [];
      const firestoreData = await loadFromFirestore();

      const hasSeeded = localStorage.getItem('asist_personalizados_seeded_v4');
      
      let merged: any[] = [];
      
      if (!hasSeeded) {
        merged = smartMerge(
          Array.isArray(mergedData) ? [...mergedData] : [],
          Array.isArray(localData) ? localData : []
        );
        if (firestoreData && Array.isArray(firestoreData)) {
          merged = smartMerge(merged, firestoreData);
        }
        localStorage.setItem('asist_personalizados_seeded_v4', 'true');
        persistPersonalizados(merged);
      } else {
        merged = (firestoreData && Array.isArray(firestoreData)) ? firestoreData : localData;
        if (firestoreData) {
          localStorage.setItem('asist_personalizados', JSON.stringify(firestoreData));
        }
      }

      refreshLocalState();
    } catch (e) {
      console.error('Error initializing personalizados', e);
    }
  };

  useEffect(() => {
    initializeData();
  }, []);

  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [classToDelete, setClassToDelete] = useState<{ studentId: string | number, clase: ClasePersonalizada } | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<{ id: string | number, nombre: string } | null>(null);
  
  const [selectedStudentId, setSelectedStudentId] = useState<string | number>('');
  const [classForm, setClassForm] = useState({
    fecha: new Date().toISOString().split('T')[0],
    horaInicio: '',
    horaFin: '',
    horas: 0
  });

  const updateClassForm = (patch: Partial<typeof classForm>) => {
    setClassForm(prev => {
      const next = { ...prev, ...patch };
      // Auto-calculate hours whenever start or end time changes
      const inicio = patch.horaInicio ?? prev.horaInicio;
      const fin = patch.horaFin ?? prev.horaFin;
      if (inicio && fin) {
        next.horas = calcHoursFromTimes(inicio, fin);
      }
      return next;
    });
  };

  const [studentForm, setStudentForm] = useState({
    nombre: '',
    tel: ''
  });

  const handleAddClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) return alert('Seleccione un alumno');
    try {
      const raw = localStorage.getItem('asist_personalizados');
      const parsed = raw ? JSON.parse(raw) : [];
      const studentIndex = parsed.findIndex((a: any) => String(a.id) === String(selectedStudentId));
      if (studentIndex >= 0) {
        if (!Array.isArray(parsed[studentIndex].clases)) {
          parsed[studentIndex].clases = [];
        }
        parsed[studentIndex].clases.push({
          fecha: classForm.fecha,
          val: 'Presente',
          horas: Number(classForm.horas),
          horaInicio: classForm.horaInicio,
          horaFin: classForm.horaFin
        });
        persistPersonalizados(parsed);
        setIsClassModalOpen(false);
        setClassForm({ fecha: new Date().toISOString().split('T')[0], horaInicio: '', horaFin: '', horas: 1 });
        refreshLocalState();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentForm.nombre) return alert('Ingrese un nombre');
    try {
      const raw = localStorage.getItem('asist_personalizados');
      const parsed = raw ? JSON.parse(raw) : [];
      parsed.push({
        id: Date.now(),
        nombre: studentForm.nombre,
        tel: studentForm.tel,
        clases: []
      });
      persistPersonalizados(parsed);
      setIsStudentModalOpen(false);
      setStudentForm({ nombre: '', tel: '' });
      refreshLocalState();
    } catch (err) {
      console.error(err);
    }
  };

  const confirmDeleteClass = () => {
    if (!classToDelete) return;
    try {
      const raw = localStorage.getItem('asist_personalizados');
      const parsed = raw ? JSON.parse(raw) : [];
      const studentIndex = parsed.findIndex((a: any) => String(a.id) === String(classToDelete.studentId));
      if (studentIndex >= 0 && Array.isArray(parsed[studentIndex].clases)) {
        const rawClases = parsed[studentIndex].clases;
        
        // Find by matching the exact properties
        const rawIndex = rawClases.findIndex((c: any) => {
          const p = parseClase(c);
          if (!p) return false;
          return p.fecha === classToDelete.clase.fecha && 
                 p.horaInicio === classToDelete.clase.horaInicio && 
                 p.horaFin === classToDelete.clase.horaFin &&
                 p.horas === classToDelete.clase.horas;
        });
        
        if (rawIndex >= 0) {
          parsed[studentIndex].clases.splice(rawIndex, 1);
          persistPersonalizados(parsed);
          refreshLocalState();
        }
      }
    } catch (err) {
      console.error(err);
    }
    setClassToDelete(null);
  };

  const confirmDeleteStudent = () => {
    if (!studentToDelete) return;
    try {
      const raw = localStorage.getItem('asist_personalizados');
      const parsed = raw ? JSON.parse(raw) : [];
      const studentIndex = parsed.findIndex((a: any) => String(a.id) === String(studentToDelete.id));
      if (studentIndex >= 0) {
        parsed.splice(studentIndex, 1);
        persistPersonalizados(parsed);
        refreshLocalState();
      }
    } catch (err) {
      console.error(err);
    }
    setStudentToDelete(null);
  };

  if (alumnos.length === 0) {
      <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
          <UserSquare2 className="w-12 h-12 text-muted-foreground opacity-50" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Sin Alumnos Personalizados</h2>
        <p className="text-muted-foreground max-w-md mb-6">
          No se encontraron registros de alumnos personalizados en la base de datos local.
        </p>
        <button
          onClick={() => setIsStudentModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-colors"
        >
          <Plus className="w-4 h-4" />
          Añadir Primer Alumno
        </button>

        {/* Modal Alumno (Empty State) */}
        {isStudentModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-card text-left w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-border">
              <div className="flex justify-between items-center p-5 border-b border-border">
                <h3 className="font-bold text-lg text-foreground">Nuevo Alumno Personalizado</h3>
                <button onClick={() => setIsStudentModalOpen(false)} className="text-muted-foreground hover:bg-muted p-1.5 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleAddStudent} className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Nombre Completo</label>
                  <input required value={studentForm.nombre} onChange={e => setStudentForm({...studentForm, nombre: e.target.value})} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Ej. Juan Pérez" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Teléfono (Opcional)</label>
                  <input value={studentForm.tel} onChange={e => setStudentForm({...studentForm, tel: e.target.value})} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Ej. 987654321" />
                </div>
                <div className="pt-2 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsStudentModalOpen(false)} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-lg transition-colors">Cancelar</button>
                  <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg transition-colors shadow-sm">Guardar Alumno</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
              <UserSquare2 className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Alumnos Personalizados</h1>
          </div>
          <p className="text-muted-foreground text-sm font-medium ml-14">
            Gestión y reporte de horas dictadas individualmente
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-4 bg-card border border-border rounded-xl p-3 shadow-sm hidden sm:flex">
            <div className="flex items-center gap-3 px-4">
              <Users className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Total Alumnos</p>
                <p className="text-lg font-bold text-foreground leading-none">{alumnos.length}</p>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => setIsStudentModalOpen(true)}
            className="flex items-center justify-center w-12 h-12 bg-card hover:bg-muted border border-border rounded-xl transition-colors shrink-0"
            title="Añadir Alumno"
          >
            <UserSquare2 className="w-5 h-5 text-foreground" />
          </button>
          
          <button
            onClick={() => setIsClassModalOpen(true)}
            className="flex items-center gap-2 px-4 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-colors shadow-sm shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Añadir Clase</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {alumnos.map((alumno) => (
          <div 
            key={alumno.id} 
            className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col group transition-all duration-300 hover:shadow-md hover:border-primary/30"
          >
            {/* Card Header */}
            <div className="p-6 border-b border-border bg-muted/20">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                    {alumno.nombre}
                  </h3>
                  <p className="text-sm font-mono text-muted-foreground mt-1">Tel: {alumno.tel}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary shrink-0">
                  {alumno.nombre.substring(0, 2).toUpperCase()}
                </div>
                <button
                  onClick={() => setStudentToDelete({ id: alumno.id, nombre: alumno.nombre })}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-red-400 hover:bg-red-500/10 hover:text-red-500 transition-colors"
                  title="Eliminar Alumno"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">Horas Totales</p>
                  <p className="text-2xl font-black text-foreground">{alumno.totalHoras}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">Clases</p>
                  <p className="text-2xl font-black text-foreground">{alumno.clasesParsed.length}</p>
                </div>
              </div>
            </div>

            {/* Monthly Summary */}
            <div className="p-6 bg-card flex-1">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                <BarChart className="w-4 h-4" /> Resumen por Mes
              </h4>
              {Object.keys(alumno.horasPorMes).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(alumno.horasPorMes).map(([mes, horas]) => (
                    <div key={mes} className="flex justify-between items-center p-3 rounded-xl bg-muted/50 border border-border/50">
                      <span className="text-sm font-medium capitalize text-foreground">{mes}</span>
                      <span className="text-sm font-bold text-primary">{horas} hrs</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">No hay clases registradas.</p>
              )}
            </div>

            {/* Expandable Details */}
            {alumno.clasesParsed.length > 0 && (
              <div className="border-t border-border mt-auto">
                <button
                  onClick={() => setExpandedId(expandedId === alumno.id ? null : alumno.id)}
                  className="w-full p-4 flex items-center justify-center gap-2 text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors hover:text-foreground"
                >
                  {expandedId === alumno.id ? 'Ocultar historial' : 'Ver historial completo'}
                  <ChevronDown className={`w-4 h-4 transition-transform ${expandedId === alumno.id ? 'rotate-180' : ''}`} />
                </button>
                
                {expandedId === alumno.id && (
                  <div className="px-6 pb-6 pt-2 bg-muted/10">
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                      {alumno.clasesParsed.map((clase, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card text-sm">
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-semibold text-foreground flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5 text-primary" />
                                {clase.fecha}
                              </span>
                              <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs font-bold">
                                {clase.horas} hrs
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="w-3.5 h-3.5" />
                              {clase.horaInicio || '--:--'} hasta {clase.horaFin || '--:--'}
                            </div>
                          </div>
                          <button
                            onClick={() => setClassToDelete({ studentId: alumno.id, clase })}
                            className="flex-shrink-0 p-2 rounded-lg text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors border border-transparent hover:border-red-500/30"
                            title="Eliminar este registro"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal Alumno */}
      {isStudentModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card text-left w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-border">
            <div className="flex justify-between items-center p-5 border-b border-border">
              <h3 className="font-bold text-lg text-foreground">Nuevo Alumno Personalizado</h3>
              <button onClick={() => setIsStudentModalOpen(false)} className="text-muted-foreground hover:bg-muted p-1.5 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddStudent} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Nombre Completo</label>
                <input required value={studentForm.nombre} onChange={e => setStudentForm({...studentForm, nombre: e.target.value})} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Ej. Juan Pérez" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Teléfono (Opcional)</label>
                <input value={studentForm.tel} onChange={e => setStudentForm({...studentForm, tel: e.target.value})} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Ej. 987654321" />
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setIsStudentModalOpen(false)} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-lg transition-colors">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg transition-colors shadow-sm">Guardar Alumno</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Clase */}
      {isClassModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card text-left w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-border">
            <div className="flex justify-between items-center p-5 border-b border-border">
              <h3 className="font-bold text-lg text-foreground">Añadir Registro de Horas</h3>
              <button onClick={() => setIsClassModalOpen(false)} className="text-muted-foreground hover:bg-muted p-1.5 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddClass} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Alumno</label>
                <select required value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option value="" disabled>Seleccione un alumno...</option>
                  {alumnos.map(a => (
                    <option key={a.id} value={a.id}>{a.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Fecha</label>
                <input type="date" required value={classForm.fecha} onChange={e => updateClassForm({ fecha: e.target.value })} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Hora Inicio</label>
                  <input type="time" required value={classForm.horaInicio} onChange={e => updateClassForm({ horaInicio: e.target.value })} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Hora Fin</label>
                  <input type="time" required value={classForm.horaFin} onChange={e => updateClassForm({ horaFin: e.target.value })} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
              </div>
              {classForm.horas > 0 && (
                <div className="flex items-center gap-2 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                  <Clock className="w-4 h-4 text-indigo-400" />
                  <span className="text-sm font-bold text-indigo-300">Total calculado: {classForm.horas} hora{classForm.horas !== 1 ? 's' : ''}</span>
                </div>
              )}
              <div className="pt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setIsClassModalOpen(false)} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-lg transition-colors">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg transition-colors shadow-sm">Guardar Registro</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminar */}
      {classToDelete && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card text-left w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-border p-6 text-center">
            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-lg text-foreground mb-2">¿Eliminar registro?</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Estás a punto de eliminar la clase del <strong className="text-foreground">{classToDelete.clase.fecha}</strong> ({classToDelete.clase.horas} hrs). Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-center gap-3 w-full">
              <button 
                onClick={() => setClassToDelete(null)} 
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-muted-foreground bg-muted hover:bg-muted/80 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDeleteClass} 
                className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-bold rounded-xl transition-colors shadow-sm"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminar Alumno */}
      {studentToDelete && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card text-left w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-border p-6 text-center">
            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserSquare2 className="w-8 h-8 relative" />
              <X className="w-4 h-4 absolute top-10 right-10 text-red-500 font-bold" />
            </div>
            <h3 className="font-bold text-lg text-foreground mb-2">¿Eliminar Alumno?</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Estás a punto de eliminar a <strong className="text-foreground">{studentToDelete.nombre}</strong> y todo su historial de clases. Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-center gap-3 w-full">
              <button 
                onClick={() => setStudentToDelete(null)} 
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-muted-foreground bg-muted hover:bg-muted/80 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDeleteStudent} 
                className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl shadow-sm hover:shadow transition-all"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AlumnosPersonalizados;
