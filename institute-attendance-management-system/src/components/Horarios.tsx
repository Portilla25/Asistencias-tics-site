import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Clock, Calendar, BarChart3, ChevronDown, ChevronRight, Users } from 'lucide-react';
import { DEFAULT_CAREERS, LegacyCareer } from '../services/legacyData';

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
}
interface AlumnoPersonalizado {
  id: number | string;
  nombre: string;
  horasPorMes: Record<string, number>;
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

  return { horas, fecha, val };
};

type Tab = 'horarios' | 'horas';

const Horarios: React.FC = () => {
  const { materias, asistencias, alumnos, currentUser } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>('horarios');
  const [expandedCareers, setExpandedCareers] = useState<Set<string>>(new Set(DEFAULT_CAREERS.map(c => c.id)));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
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
          {/* Year selector */}
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
          </div>

          {careerGroups.map(({ career, materias: careerMaterias }) => {
            const relevantMonths = Array.from({ length: 12 }, (_, i) => `${selectedYear}-${String(i + 1).padStart(2, '0')}`);
            return (
            <div key={career.id} className="bg-[rgba(30,41,59,0.7)] backdrop-blur-[12px] shadow-lg border border-white/10 rounded-xl overflow-hidden mb-6">
              <div className="px-5 py-4 border-b border-white/10 flex items-center gap-3">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: career.color }} />
                <h3 className="font-bold text-gray-100 text-sm">{career.nombre}</h3>
                <span className="text-xs text-gray-400">— Registro de horas {selectedYear}</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="px-4 py-2.5 text-xs font-semibold text-gray-300 uppercase text-left sticky left-0 bg-[rgba(30,41,59,0.9)] min-w-[140px] z-10">Módulo</th>
                      {relevantMonths.map(m => {
                        const monthIdx = parseInt(m.split('-')[1], 10) - 1;
                        return (
                          <th key={m} className="px-3 py-2.5 text-xs font-semibold text-gray-300 uppercase text-center min-w-[80px]">
                            {MONTH_NAMES[monthIdx]?.slice(0, 3)}
                          </th>
                        );
                      })}
                      <th className="px-4 py-2.5 text-xs font-bold text-white uppercase text-center bg-white/5 min-w-[80px]">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {careerMaterias.map(m => {
                      const monthData = horasPorMes[m.id] || {};
                      const totalHoras = relevantMonths.reduce((sum, mo) => sum + (monthData[mo]?.horas || 0), 0);
                      const totalClases = relevantMonths.reduce((sum, mo) => sum + (monthData[mo]?.clases || 0), 0);

                      return (
                        <tr key={m.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-4 py-3 sticky left-0 bg-[rgba(30,41,59,0.9)] z-10 border-r border-white/5">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: m.color }} />
                              <span className="text-sm font-medium text-gray-100 whitespace-nowrap">{m.codigo}</span>
                            </div>
                          </td>
                          {relevantMonths.map(mo => {
                            const data = monthData[mo];
                            return (
                              <td key={mo} className="px-3 py-3 text-center border-r border-white/5 last:border-r-0">
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
                            );
                          })}
                          <td className="px-4 py-3 text-center bg-white/5">
                            <span className="text-sm font-bold text-indigo-400">{totalHoras}h</span>
                            <p className="text-[10px] text-gray-400">{totalClases} clases</p>
                          </td>
                        </tr>
                      );
                    })}

                    {/* Career totals row */}
                    <tr className="bg-white/5 font-bold">
                      <td className="px-4 py-3 text-sm text-gray-200 sticky left-0 bg-[rgba(30,41,59,0.9)] z-10 border-r border-white/10">Total</td>
                      {relevantMonths.map(mo => {
                        const total = careerMaterias.reduce((sum, m) => sum + (horasPorMes[m.id]?.[mo]?.horas || 0), 0);
                        return (
                          <td key={mo} className="px-3 py-3 text-center text-sm border-r border-white/5">
                            {total > 0 ? <span className="text-indigo-400 font-bold">{total}h</span> : <span className="text-gray-600">—</span>}
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-center bg-indigo-500/20">
                        <span className="text-sm font-bold text-indigo-300">
                          {careerMaterias.reduce((sum, m) => {
                            return sum + relevantMonths
                              .reduce((s, mo) => s + (horasPorMes[m.id]?.[mo]?.horas || 0), 0);
                          }, 0)}h
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
            <div className="bg-card rounded-xl p-12 text-center shadow-sm border border-border">
              <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">No hay registros de clases para {selectedYear}</p>
              <p className="text-muted-foreground text-sm mt-1">Las horas se calculan automáticamente a partir de la asistencia registrada</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Horarios;
