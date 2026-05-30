import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Clock, Calendar, BarChart3, ChevronDown, ChevronRight, Users, ChevronUp, Loader2, List, Grid } from 'lucide-react';
import { DEFAULT_CAREERS, LegacyCareer } from '../services/legacyData';
import { getSesiones, recalcularNumerosClaseBatch, SesionData } from '../services/sesiones';

/* ─── Schedule definitions for each module ─── */
const MODULE_SCHEDULES: Record<string, { turno: string; hora: string; dia: string }> = {
  // Redes Mañana
  redes_M_1: { turno: 'Mañana', hora: '09:00 – 13:00', dia: 'Sábado' },
  redes_M_2: { turno: 'Mañana', hora: '09:00 – 13:00', dia: 'Sábado' },
  redes_M_3: { turno: 'Mañana', hora: '09:00 – 13:00', dia: 'Sábado' },
  redes_M_4: { turno: 'Mañana', hora: '09:00 – 13:00', dia: 'Sábado' },
  // Redes Tarde
  redes_T_1: { turno: 'Tarde', hora: '14:00 – 18:00', dia: 'Sábado' },
  redes_T_2: { turno: 'Tarde', hora: '14:00 – 18:00', dia: 'Sábado' },
  redes_T_3: { turno: 'Tarde', hora: '14:00 – 18:00', dia: 'Sábado' },
  redes_T_4: { turno: 'Tarde', hora: '14:00 – 18:00', dia: 'Sábado' },
  // Gastronomía Lunes
  info_gastro_L_1: { turno: 'Mañana', hora: '10:30 – 12:20', dia: 'Lunes' },
  // TICs Sábados
  tics_S_1: { turno: 'Mañana', hora: '09:00 – 13:00', dia: 'Sábado' },
  tics_S_2: { turno: 'Mañana', hora: '09:00 – 13:00', dia: 'Sábado' },
  tics_S_3: { turno: 'Mañana', hora: '09:00 – 13:00', dia: 'Sábado' },
  tics_S_4: { turno: 'Mañana', hora: '09:00 – 13:00', dia: 'Sábado' },
  // Redes Sábados Mañana
  redes_S_M1: { turno: 'Mañana', hora: '09:00 – 13:00', dia: 'Sábado' },
  redes_S_M2: { turno: 'Mañana', hora: '09:00 – 13:00', dia: 'Sábado' },
  redes_S_M3: { turno: 'Mañana', hora: '09:00 – 13:00', dia: 'Sábado' },
  redes_S_M4: { turno: 'Mañana', hora: '09:00 – 13:00', dia: 'Sábado' },
  // Redes Sábados Tarde
  redes_S_T1: { turno: 'Tarde', hora: '14:00 – 18:00', dia: 'Sábado' },
  redes_S_T2: { turno: 'Tarde', hora: '14:00 – 18:00', dia: 'Sábado' },
  redes_S_T3: { turno: 'Tarde', hora: '14:00 – 18:00', dia: 'Sábado' },
  redes_S_T4: { turno: 'Tarde', hora: '14:00 – 18:00', dia: 'Sábado' },
};

/* Hours per module (1h per module, except Gastronomía = 2h) */
const HOURS_PER_MODULE: Record<string, number> = {
  info_gastro_L_1: 2,
  redes_M_1: 4, redes_M_2: 4, redes_M_3: 4, redes_M_4: 4,
  redes_T_1: 4, redes_T_2: 4, redes_T_3: 4, redes_T_4: 4,
  tics_S_1: 4, tics_S_2: 4, tics_S_3: 4, tics_S_4: 4,
  redes_S_M1: 4, redes_S_M2: 4, redes_S_M3: 4, redes_S_M4: 4,
  redes_S_T1: 4, redes_S_T2: 4, redes_S_T3: 4, redes_S_T4: 4,
};
const getHoursForModule = (id: string) => HOURS_PER_MODULE[id] || 1;

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

interface ClasePersonalizada {
  fecha: string;
  val: string;
  horas: number;
  horaInicio?: string;
  horaFin?: string;
}
interface AlumnoPersonalizado {
  id: number | string;
  nombre: string;
  horasPorMes: Record<string, { horas: number; clases: number; fechas: string[] }>;
  clases: ClasePersonalizada[];
}
const calcHoursFromTimes = (inicio: string, fin: string): number => {
  if (!inicio || !fin) return 0;
  const [h1, m1] = inicio.split(':').map(Number);
  const [h2, m2] = fin.split(':').map(Number);
  if (isNaN(h1) || isNaN(m1) || isNaN(h2) || isNaN(m2)) return 0;
  const diff = (h2 * 60 + m2) - (h1 * 60 + m1);
  return diff > 0 ? Math.round(diff / 30) * 0.5 : 0;
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
    const matchHours = str.match(/horas\s*=\s*([\d.,]+)/);
    const matchDate = str.match(/fecha\s*=\s*([0-9-T:\.Z]+)/);
    const matchVal = str.match(/val\s*=\s*([^;}]+)/);
    const matchInicio = str.match(/horaInicio\s*=\s*([\d:]+)/);
    const matchFin = str.match(/horaFin\s*=\s*([\d:]+)/);
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

type Tab = 'horarios' | 'horas';

const ModuleRowAccordion: React.FC<{ 
  materia: any; 
  data: any; 
  targetMonthStr: string; 
  totalHoras: number; 
  totalClases: number;
}> = ({ materia, data, targetMonthStr, totalHoras, totalClases }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [sesiones, setSesiones] = useState<SesionData[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const loadSesiones = async () => {
    setLoading(true);
    const data = await getSesiones(materia.id);
    const filtered = data.filter(s => s.fecha.startsWith(targetMonthStr));
    setSesiones(filtered);
    setLoading(false);
  };

  const handleToggle = () => {
    if (!isExpanded) {
      loadSesiones();
    }
    setIsExpanded(!isExpanded);
  };

  const handleEditSubmit = async (sesion: SesionData) => {
    if (editValue.trim() === '') return;
    const nuevoNumero = parseInt(editValue, 10);
    if (isNaN(nuevoNumero) || nuevoNumero === sesion.numeroClase) {
      setEditingId(null);
      return;
    }

    setLoading(true);
    await recalcularNumerosClaseBatch(materia.id, sesion.fecha, nuevoNumero);
    await loadSesiones(); // Reload after batch update
    setEditingId(null);
  };

  return (
    <>
      <tr onClick={handleToggle} className="hover:bg-white/5 transition-colors flex w-full cursor-pointer group">
        <td className="px-4 py-3 bg-[rgba(30,41,59,0.9)] border-r border-white/5 w-[50%] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: materia.color }} />
            <span className="text-sm font-medium text-gray-100 group-hover:text-white transition-colors">{materia.codigo}</span>
          </div>
          {isExpanded ? <ChevronUp className="w-4 h-4 text-indigo-400" /> : <ChevronDown className="w-4 h-4 text-gray-500 group-hover:text-gray-300" />}
        </td>
        <td className="px-3 py-3 text-center border-r border-white/5 w-[25%] flex flex-col justify-center">
          {data && data.horas > 0 ? (
            <div className="flex flex-col items-center justify-center gap-0.5">
              <span className="text-sm font-bold text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">{data.horas}h</span>
              {data.fechas && data.fechas.length > 0 && (
                <span className="text-[10px] text-indigo-200 font-mono bg-black/20 px-1.5 py-0.5 rounded border border-white/5" title={`Días: ${data.fechas.join(', ')}`}>
                  {data.fechas.join(', ')}
                </span>
              )}
            </div>
          ) : (
            <span className="text-sm font-medium text-gray-600">—</span>
          )}
        </td>
        <td className="px-4 py-3 text-center bg-white/5 w-[25%] flex flex-col justify-center">
          <span className="text-sm font-bold text-indigo-400">{totalHoras}h</span>
          <p className="text-[10px] text-gray-400">{totalClases} clases</p>
        </td>
      </tr>
      
      {/* Expanded Accordion Sub-table */}
      {isExpanded && (
        <tr className="w-full flex">
          <td colSpan={3} className="w-full p-0 bg-[rgba(15,23,42,0.8)] border-b border-white/10 shadow-inner">
            <div className="p-4">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-6 gap-2">
                  <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                  <span className="text-xs text-indigo-300 font-medium tracking-wide">Cargando sesiones...</span>
                </div>
              ) : sesiones.length > 0 ? (
                <div className="rounded-lg border border-white/5 overflow-hidden bg-black/20">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-white/5 text-xs uppercase text-gray-400">
                      <tr>
                        <th className="px-4 py-2 font-medium">Fecha</th>
                        <th className="px-4 py-2 font-medium">Tema</th>
                        <th className="px-4 py-2 font-medium text-center">Nº Clase</th>
                        <th className="px-4 py-2 font-medium text-center">Modalidad</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {sesiones.map(s => (
                        <tr key={s.fecha} className="hover:bg-white/5 transition-colors">
                          <td className="px-4 py-2.5 text-gray-300 font-mono text-xs">{s.fecha}</td>
                          <td className="px-4 py-2.5 text-gray-200">{s.tema || <span className="text-gray-500 italic">Sin tema registrado</span>}</td>
                          <td className="px-4 py-2.5 text-center">
                            {editingId === s.fecha ? (
                              <div className="flex items-center justify-center gap-1">
                                <input
                                  type="number"
                                  autoFocus
                                  defaultValue={s.numeroClase}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onBlur={() => handleEditSubmit(s)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleEditSubmit(s);
                                    if (e.key === 'Escape') setEditingId(null);
                                  }}
                                  className="w-16 px-1 py-0.5 text-center bg-indigo-900/50 border border-indigo-500/50 rounded text-indigo-100 outline-none focus:ring-1 focus:ring-indigo-400 text-xs"
                                />
                              </div>
                            ) : (
                              <span 
                                onClick={() => { setEditingId(s.fecha); setEditValue(s.numeroClase.toString()); }}
                                className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold text-xs cursor-pointer hover:bg-indigo-500/40 hover:text-indigo-200 transition-colors border border-indigo-500/10 shadow-[0_0_10px_rgba(99,102,241,0.1)] hover:shadow-[0_0_12px_rgba(99,102,241,0.2)]"
                                title="Haz clic para editar y recalcular"
                              >
                                {s.numeroClase || 0}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${s.modalidad === 'Virtual' ? 'bg-sky-500/10 text-sky-300 border-sky-500/20' : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'}`}>
                              {s.modalidad || 'Presencial'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-6 border border-white/5 border-dashed rounded-lg bg-white/[0.02]">
                  <p className="text-sm text-gray-400">No hay detalles de sesión guardados en Firebase para este mes.</p>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

const Horarios: React.FC = () => {
  const { materias, asistencias, alumnos, currentUser } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>('horarios');
  const [viewMode, setViewMode] = useState<'resumen' | 'detalle'>('resumen');
  const [expandedCareers, setExpandedCareers] = useState<Set<string>>(new Set(DEFAULT_CAREERS.map(c => c.id)));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [personalizados, setPersonalizados] = useState<AlumnoPersonalizado[]>([]);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem('asist_personalizados');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const enriched = parsed.map((a: any) => {
            const rawClases: any[] = Array.isArray(a.clases) ? a.clases : [];
            const parsedClases = rawClases
              .map(parseClase)
              .filter((c): c is ClasePersonalizada => c !== null && c.val.toLowerCase() === 'presente');
            
            const horasPorMes: Record<string, { horas: number; clases: number; fechas: string[] }> = {};
            parsedClases.forEach(c => {
              const parts = c.fecha.split('-');
              if (parts.length >= 2) {
                const mesKey = `${parts[0]}-${parts[1]}`;
                if (!horasPorMes[mesKey]) horasPorMes[mesKey] = { horas: 0, clases: 0, fechas: [] };
                horasPorMes[mesKey].horas += c.horas;
                horasPorMes[mesKey].clases += 1;
                horasPorMes[mesKey].fechas.push(parts[2] ? parts[2].substring(0, 2) : c.fecha);
              }
            });
            return {
              id: a.id || Date.now(),
              nombre: a.nombre || 'Sin nombre',
              horasPorMes,
              clases: parsedClases,
            };
          });
          setPersonalizados(enriched);
        }
      }
    } catch (e) {}
  }, []);

  const alumnoActual = alumnos.find(a => a.email === currentUser?.email);
  const misMateriaIds = useMemo(() => {
    if (currentUser?.rol === 'alumno' && alumnoActual) {
      return new Set(alumnoActual.materias);
    }
    if (currentUser?.rol === 'docente') {
      return new Set(materias.filter(m => m.docenteId === currentUser.id).map(m => m.id));
    }
    return new Set(materias.map(m => m.id));
  }, [materias, currentUser, alumnoActual]);

  // Group materias by career
  const careerGroups = useMemo(() => {
    const groups: { career: LegacyCareer; materias: typeof materias }[] = [];
    DEFAULT_CAREERS.forEach((career) => {
      const ids = new Set(career.secciones.map(s => s.id));
      const careerMaterias = materias.filter(m => ids.has(m.id) && misMateriaIds.has(m.id));
      if (careerMaterias.length > 0) {
        groups.push({ career, materias: careerMaterias });
      }
    });
    return groups;
  }, [materias, misMateriaIds]);

  const toggleCareer = (id: string) => {
    setExpandedCareers(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  /* ─── Horas dictadas por mes ─── */
  const horasPorMes = useMemo(() => {
    // For each materia, count unique dates where attendance was recorded per month
    const result: Record<string, Record<string, { clases: number; horas: number; fechas: string[] }>> = {};

    materias.forEach(m => {
      if (!misMateriaIds.has(m.id)) return;
      const materiaAsistencias = asistencias.filter(a => a.materiaId === m.id);
      const datesByMonth: Record<string, Set<string>> = {};

      materiaAsistencias.forEach(a => {
        const [year, month, day] = a.fecha.split('-');
        if (Number(year) !== selectedYear) return;
        const key = `${year}-${month}`;
        if (!datesByMonth[key]) datesByMonth[key] = new Set();
        datesByMonth[key].add(day ? day.substring(0,2) : a.fecha);
      });

      const horasModulo = getHoursForModule(m.id);
      result[m.id] = {};
      Object.entries(datesByMonth).forEach(([monthKey, dates]) => {
        result[m.id][monthKey] = {
          clases: dates.size,
          horas: dates.size * horasModulo,
          fechas: Array.from(dates).sort()
        };
      });
    });

    return result;
  }, [materias, asistencias, misMateriaIds, selectedYear]);

  // Get all months that have data
  const allMonths = useMemo(() => {
    const months = new Set<string>();
    Object.values(horasPorMes).forEach(byMonth => {
      Object.keys(byMonth).forEach(k => months.add(k));
    });
    return [...months].sort();
  }, [horasPorMes]);

  /* --- Detailed table data --- */
  const clasesDetalladas = useMemo(() => {
    const list: Array<{
      id: string;
      fechaStr: string;
      fechaObj: Date;
      diaStr: string;
      entidad: string;
      horario: string;
      horas: number;
      tipo: 'modulo' | 'personalizado';
      color: string;
      materiaId?: string;
    }> = [];

    const targetMonthStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;

    // 1. Regular Modules
    materias.forEach(m => {
      if (!misMateriaIds.has(m.id)) return;
      const sched = MODULE_SCHEDULES[m.id];
      const horasModulo = getHoursForModule(m.id);
      
      const materiaAsistencias = asistencias.filter(a => a.materiaId === m.id && a.fecha.startsWith(targetMonthStr));
      const uniqueDates = new Set(materiaAsistencias.map(a => a.fecha));
      
      uniqueDates.forEach(dateStr => {
        const dObj = new Date(`${dateStr}T12:00:00Z`); // Avoid timezone shift
        const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        list.push({
          id: `mod-${m.id}-${dateStr}`,
          fechaStr: dateStr,
          fechaObj: dObj,
          diaStr: days[dObj.getUTCDay()],
          entidad: `${m.codigo} - ${m.nombre}`,
          horario: sched ? sched.hora : 'Horario oficial',
          horas: horasModulo,
          tipo: 'modulo',
          color: m.color,
          materiaId: m.id
        });
      });
    });

    // 2. Personalizados
    personalizados.forEach(p => {
      const pClases = p.clases.filter(c => c.fecha.startsWith(targetMonthStr));
      pClases.forEach((c, idx) => {
        const dObj = new Date(`${c.fecha}T12:00:00Z`);
        const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const horarioStr = (c.horaInicio && c.horaFin) ? `de ${c.horaInicio} a ${c.horaFin}` : 'Horas asignadas';
        list.push({
          id: `pers-${p.id}-${idx}`,
          fechaStr: c.fecha,
          fechaObj: dObj,
          diaStr: days[dObj.getUTCDay()],
          entidad: `Personalizado: ${p.nombre}`,
          horario: horarioStr,
          horas: c.horas,
          tipo: 'personalizado',
          color: '#6366f1'
        });
      });
    });

    return list.sort((a, b) => a.fechaObj.getTime() - b.fechaObj.getTime());
  }, [materias, asistencias, personalizados, misMateriaIds, selectedYear, selectedMonth]);

  return (
    <div className="p-6 space-y-5">
      {/* Tab bar */}
      <div className="flex items-center gap-2 bg-card rounded-xl p-1.5 shadow-sm border border-border w-fit">
        <button
          onClick={() => setActiveTab('horarios')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'horarios' ? 'bg-indigo-600 text-white shadow-sm' : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          <Clock className="w-4 h-4" />
          Horarios
        </button>
        <button
          onClick={() => setActiveTab('horas')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'horas' ? 'bg-indigo-600 text-white shadow-sm' : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Horas Dictadas
        </button>
      </div>

      {/* ═══════ TAB: Horarios ═══════ */}
      {activeTab === 'horarios' && (
        <div className="space-y-4">
          {careerGroups.map(({ career, materias: careerMaterias }) => {
            const isExpanded = expandedCareers.has(career.id);
            return (
              <div key={career.id} className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                <button
                  onClick={() => toggleCareer(career.id)}
                  className="w-full flex items-center gap-3 px-5 py-4 hover:bg-background transition-colors"
                >
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: career.color }} />
                  <span className="font-bold text-foreground text-sm flex-1 text-left">{career.nombre}</span>
                  <span className="text-xs text-muted-foreground font-mono">{careerMaterias.length} módulo{careerMaterias.length !== 1 ? 's' : ''}</span>
                  {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                </button>

                {isExpanded && (
                  <div className="border-t border-border">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-background text-left">
                          <th className="px-5 py-2.5 text-xs font-semibold text-muted-foreground uppercase">Módulo</th>
                          <th className="px-5 py-2.5 text-xs font-semibold text-muted-foreground uppercase">Día</th>
                          <th className="px-5 py-2.5 text-xs font-semibold text-muted-foreground uppercase">Turno</th>
                          <th className="px-5 py-2.5 text-xs font-semibold text-muted-foreground uppercase">Horario</th>
                          <th className="px-5 py-2.5 text-xs font-semibold text-muted-foreground uppercase text-right">Alumnos</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {careerMaterias.map(m => {
                          const sched = MODULE_SCHEDULES[m.id];
                          const alumnoCount = alumnos.filter(a => a.materias.includes(m.id)).length;
                          return (
                            <tr key={m.id} className="hover:bg-background transition-colors">
                              <td className="px-5 py-3">
                                <div className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }} />
                                  <span className="font-medium text-sm text-foreground">{m.codigo}</span>
                                </div>
                              </td>
                              <td className="px-5 py-3 text-sm text-muted-foreground">{sched?.dia || '—'}</td>
                              <td className="px-5 py-3">
                                {sched ? (
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    sched.turno === 'Mañana'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-indigo-100 text-indigo-800'
                                  }`}>
                                    {sched.turno === 'Mañana' ? '☀️' : '🌙'} {sched.turno}
                                  </span>
                                ) : '—'}
                              </td>
                              <td className="px-5 py-3 font-mono text-sm text-muted-foreground">{sched?.hora || '—'}</td>
                              <td className="px-5 py-3 text-right">
                                <span className="inline-flex items-center gap-1 text-sm text-foreground">
                                  <Users className="w-3.5 h-3.5 text-muted-foreground" />
                                  {alumnoCount}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}

          {careerGroups.length === 0 && (
            <div className="bg-card rounded-xl p-12 text-center shadow-sm border border-border">
              <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">No hay horarios asignados</p>
            </div>
          )}
        </div>
      )}

      {/* ═══════ TAB: Horas Dictadas ═══════ */}
      {activeTab === 'horas' && (
        <div className="space-y-4">
          {/* Selectors */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-foreground">
              <Calendar className="w-4 h-4 inline mr-1.5 text-muted-foreground" />Año:
            </label>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
              className="px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {[2024, 2025, 2026].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>

            <label className="text-sm font-medium text-foreground ml-2">Mes:</label>
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(Number(e.target.value))}
              className="px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {MONTH_NAMES.map((name, i) => (
                <option key={i} value={i + 1}>{name}</option>
              ))}
            </select>
            
            {/* View Mode Toggle */}
            <div className="ml-auto flex items-center bg-card rounded-lg p-1 border border-border">
              <button
                onClick={() => setViewMode('resumen')}
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'resumen' ? 'bg-indigo-600 text-white' : 'text-muted-foreground hover:bg-muted'}`}
                title="Vista Resumen"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('detalle')}
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'detalle' ? 'bg-indigo-600 text-white' : 'text-muted-foreground hover:bg-muted'}`}
                title="Vista Detallada"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {viewMode === 'resumen' ? (
            <>
              {careerGroups.map(({ career, materias: careerMaterias }) => {
                const targetMonthStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
                const monthName = MONTH_NAMES[selectedMonth - 1].toUpperCase();

            return (
            <div key={career.id} className="bg-[rgba(30,41,59,0.7)] backdrop-blur-[12px] shadow-lg border border-white/10 rounded-xl overflow-hidden mb-6">
              <div className="px-5 py-4 border-b border-white/10 flex items-center gap-3">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: career.color }} />
                <h3 className="font-bold text-gray-100 text-sm">{career.nombre}</h3>
                <span className="text-xs text-gray-400">— {monthName} {selectedYear}</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10 flex w-full">
                      <th className="px-4 py-2.5 text-xs font-semibold text-gray-300 uppercase text-left bg-[rgba(30,41,59,0.9)] w-[50%] border-r border-white/10">Módulo</th>
                      <th className="px-3 py-2.5 text-xs font-semibold text-gray-300 uppercase text-center bg-white/5 w-[25%] border-r border-white/10">{monthName}</th>
                      <th className="px-4 py-2.5 text-xs font-bold text-white uppercase text-center bg-white/5 w-[25%]">Total</th>
                    </tr>
                  </thead>
                  <tbody className="flex flex-col w-full divide-y divide-white/5">
                    {careerMaterias.map(m => {
                      const monthData = horasPorMes[m.id] || {};
                      const data = monthData[targetMonthStr];
                      const totalHoras = data?.horas || 0;
                      const totalClases = data?.clases || 0;

                      return (
                        <ModuleRowAccordion 
                          key={m.id}
                          materia={m}
                          data={data}
                          targetMonthStr={targetMonthStr}
                          totalHoras={totalHoras}
                          totalClases={totalClases}
                        />
                      );
                    })}

                    {/* Career totals row */}
                    <tr className="bg-white/5 font-bold flex w-full">
                      <td className="px-4 py-3 text-sm text-gray-200 bg-[rgba(30,41,59,0.9)] border-r border-white/10 w-[50%] flex items-center">Total</td>
                      <td className="px-3 py-3 text-center text-sm border-r border-white/5 w-[25%] flex items-center justify-center">
                        {(() => {
                          const monthTotal = careerMaterias.reduce((sum, m) => sum + (horasPorMes[m.id]?.[targetMonthStr]?.horas || 0), 0);
                          return monthTotal > 0 ? <span className="text-indigo-400 font-bold">{monthTotal}h</span> : <span className="text-gray-600">—</span>;
                        })()}
                      </td>
                      <td className="px-4 py-3 text-center bg-indigo-500/20 w-[25%] flex items-center justify-center">
                        <span className="text-sm font-bold text-indigo-300">
                          {careerMaterias.reduce((sum, m) => sum + (horasPorMes[m.id]?.[targetMonthStr]?.horas || 0), 0)}h
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            );
          })}

          {/* Personalizados Table */}
          {personalizados.length > 0 && (
            <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-indigo-500" />
                <h3 className="font-bold text-foreground text-sm">Alumnos Personalizados</h3>
                <span className="text-xs text-muted-foreground">— Registro de horas {selectedYear}</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-background">
                      <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase text-left sticky left-0 bg-background min-w-[140px]">Alumno</th>
                      {allMonths.filter(m => {
                        const [y, mm] = m.split('-');
                        return Number(y) === selectedYear && Number(mm) >= 5;
                      }).map(m => {
                        const monthIdx = parseInt(m.split('-')[1], 10) - 1;
                        return (
                          <th key={m} className="px-3 py-2.5 text-xs font-semibold text-muted-foreground uppercase text-center min-w-[80px]">
                            {MONTH_NAMES[monthIdx]?.slice(0, 3)}
                          </th>
                        );
                      })}
                      <th className="px-4 py-2.5 text-xs font-bold text-foreground uppercase text-center bg-primary/5 min-w-[80px]">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {personalizados.map(p => {
                      const relevantMonths = allMonths.filter(mo => {
                        const [y, mm] = mo.split('-');
                        return Number(y) === selectedYear && Number(mm) >= 5;
                      });
                      const totalHoras = relevantMonths.reduce((sum, mo) => sum + (p.horasPorMes[mo]?.horas || 0), 0);
                      
                      return (
                        <tr key={p.id} className="hover:bg-background">
                          <td className="px-4 py-3 sticky left-0 bg-card">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-foreground">{p.nombre}</span>
                            </div>
                          </td>
                          {relevantMonths.map(mo => {
                            const data = p.horasPorMes[mo];
                            return (
                              <td key={mo} className="px-3 py-3 text-center">
                                {data && data.horas > 0 ? (
                                  <div className="flex flex-col items-center justify-center gap-0.5">
                                    <span className="text-sm font-bold text-foreground">{data.horas}h</span>
                                    {data.fechas && data.fechas.length > 0 && (
                                      <span className="text-[10px] text-muted-foreground font-mono bg-muted/50 px-1.5 py-0.5 rounded border border-border/50" title={`Días: ${data.fechas.join(', ')}`}>
                                        {data.fechas.join(', ')}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-300">—</span>
                                )}
                              </td>
                            );
                          })}
                          <td className="px-4 py-3 text-center bg-primary/5">
                            <span className="text-sm font-bold text-primary">{totalHoras}h</span>
                          </td>
                        </tr>
                      );
                    })}

                    <tr className="bg-background font-bold">
                      <td className="px-4 py-3 text-sm text-foreground sticky left-0 bg-background">Total</td>
                      {allMonths.filter(m => {
                        const [y, mm] = m.split('-');
                        return Number(y) === selectedYear && Number(mm) >= 5;
                      }).map(mo => {
                        const total = personalizados.reduce((sum, p) => sum + (p.horasPorMes[mo]?.horas || 0), 0);
                        return (
                          <td key={mo} className="px-3 py-3 text-center text-sm text-foreground">
                            {total > 0 ? `${total}h` : '—'}
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-center bg-primary/10">
                        <span className="text-sm font-bold text-primary">
                          {personalizados.reduce((sum, p) => {
                            return sum + allMonths.filter(mo => {
                              const [y, mm] = mo.split('-');
                              return Number(y) === selectedYear && Number(mm) >= 5;
                            }).reduce((s, mo) => s + (p.horasPorMes[mo]?.horas || 0), 0);
                          }, 0)}h
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {allMonths.length === 0 && (
            <div className="bg-card rounded-xl p-12 text-center shadow-sm border border-border mt-4">
              <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">No hay registros de clases para {selectedYear}</p>
              <p className="text-muted-foreground text-sm mt-1">Las horas se calculan automáticamente a partir de la asistencia registrada</p>
            </div>
          )}
            </>
          ) : (
            <div className="space-y-6 mt-4">
              {careerGroups.map(({ career, materias: careerMaterias }) => {
                const careerClasses = clasesDetalladas.filter(c => 
                  c.tipo === 'modulo' && careerMaterias.some(m => m.id === c.materiaId)
                );
                
                if (careerClasses.length === 0) return null;

                return (
                  <div key={career.id} className="bg-[rgba(30,41,59,0.7)] backdrop-blur-[12px] shadow-lg border border-white/10 rounded-xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-white/10 flex items-center gap-3">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: career.color }} />
                      <h3 className="font-bold text-gray-100 text-sm">{career.nombre}</h3>
                      <span className="text-xs text-gray-400">— Detalle de clases</span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-white/5 border-b border-white/10 text-left">
                            <th className="px-5 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wider">Fecha</th>
                            <th className="px-5 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wider">Día</th>
                            <th className="px-5 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wider">Módulo</th>
                            <th className="px-5 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wider">Hora Dictada</th>
                            <th className="px-5 py-3 text-xs font-bold text-white uppercase text-right">Horas</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {careerClasses.map((c, index) => (
                            <tr key={`${c.id}-${index}`} className="hover:bg-white/5 transition-colors">
                              <td className="px-5 py-3 font-medium text-gray-200 whitespace-nowrap text-sm">{c.fechaStr}</td>
                              <td className="px-5 py-3 text-sm text-gray-400">{c.diaStr}</td>
                              <td className="px-5 py-3">
                                <div className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                                  <span className="font-medium text-sm text-gray-200">{c.entidad}</span>
                                </div>
                              </td>
                              <td className="px-5 py-3 font-mono text-sm text-gray-400">{c.horario}</td>
                              <td className="px-5 py-3 text-right">
                                <span className="inline-flex items-center justify-center px-2 py-1 rounded bg-indigo-500/20 text-indigo-300 font-bold text-sm">
                                  {c.horas}h
                                </span>
                              </td>
                            </tr>
                          ))}
                          <tr className="bg-white/5 font-bold border-t-2 border-white/10">
                            <td colSpan={4} className="px-5 py-4 text-right text-gray-200">Total Horas del Mes:</td>
                            <td className="px-5 py-4 text-right text-lg text-indigo-400">
                              {careerClasses.reduce((acc, c) => acc + c.horas, 0)}h
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}

              {/* Personalizados Detailed Table */}
              {(() => {
                const persClasses = clasesDetalladas.filter(c => c.tipo === 'personalizado');
                if (persClasses.length === 0) return null;

                return (
                  <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden mt-6">
                    <div className="px-5 py-4 border-b border-border flex items-center gap-3">
                      <span className="w-3 h-3 rounded-full bg-indigo-500" />
                      <h3 className="font-bold text-foreground text-sm">Alumnos Personalizados</h3>
                      <span className="text-xs text-muted-foreground">— Detalle de clases</span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-background border-b border-border text-left">
                            <th className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fecha</th>
                            <th className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Día</th>
                            <th className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Alumno</th>
                            <th className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Hora Dictada</th>
                            <th className="px-5 py-3 text-xs font-bold text-foreground uppercase text-right">Horas</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {persClasses.map((c, index) => (
                            <tr key={`${c.id}-${index}`} className="hover:bg-background transition-colors">
                              <td className="px-5 py-3 font-medium text-foreground whitespace-nowrap text-sm">{c.fechaStr}</td>
                              <td className="px-5 py-3 text-sm text-muted-foreground">{c.diaStr}</td>
                              <td className="px-5 py-3">
                                <div className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                                  <span className="font-medium text-sm text-foreground">{c.entidad.replace('Personalizado: ', '')}</span>
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700">PERS</span>
                                </div>
                              </td>
                              <td className="px-5 py-3 font-mono text-sm text-muted-foreground">{c.horario}</td>
                              <td className="px-5 py-3 text-right">
                                <span className="inline-flex items-center justify-center px-2 py-1 rounded bg-indigo-50 text-indigo-700 font-bold text-sm">
                                  {c.horas}h
                                </span>
                              </td>
                            </tr>
                          ))}
                          <tr className="bg-background font-bold border-t-2 border-border">
                            <td colSpan={4} className="px-5 py-4 text-right text-foreground">Total Horas Personalizadas:</td>
                            <td className="px-5 py-4 text-right text-lg text-indigo-600">
                              {persClasses.reduce((acc, c) => acc + c.horas, 0)}h
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Horarios;
