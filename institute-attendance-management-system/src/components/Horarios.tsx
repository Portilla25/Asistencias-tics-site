import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Clock, Calendar, BarChart3, ChevronDown, ChevronRight, Users } from 'lucide-react';
import { DEFAULT_CAREERS, LegacyCareer } from '../services/legacyData';

/* ─── Schedule definitions for each module ─── */
const MODULE_SCHEDULES: Record<string, { turno: string; hora: string; dia: string }> = {
  // Redes Mañana
  redes_M_1: { turno: 'Mañana', hora: '09:00 – 10:00', dia: 'Lun a Vie' },
  redes_M_2: { turno: 'Mañana', hora: '10:00 – 11:00', dia: 'Lun a Vie' },
  redes_M_3: { turno: 'Mañana', hora: '11:00 – 12:00', dia: 'Lun a Vie' },
  redes_M_4: { turno: 'Mañana', hora: '12:00 – 13:00', dia: 'Lun a Vie' },
  // Redes Tarde
  redes_T_1: { turno: 'Tarde', hora: '14:00 – 15:00', dia: 'Lun a Vie' },
  redes_T_2: { turno: 'Tarde', hora: '15:00 – 16:00', dia: 'Lun a Vie' },
  redes_T_3: { turno: 'Tarde', hora: '16:00 – 17:00', dia: 'Lun a Vie' },
  redes_T_4: { turno: 'Tarde', hora: '17:00 – 18:00', dia: 'Lun a Vie' },
  // Gastronomía Lunes
  info_gastro_L_1: { turno: 'Mañana', hora: '10:30 – 12:20', dia: 'Lunes' },
  // TICs Sábados
  tics_S_1: { turno: 'Mañana', hora: '09:00 – 10:00', dia: 'Sábado' },
  tics_S_2: { turno: 'Mañana', hora: '10:00 – 11:00', dia: 'Sábado' },
  tics_S_3: { turno: 'Mañana', hora: '11:00 – 12:00', dia: 'Sábado' },
  tics_S_4: { turno: 'Mañana', hora: '12:00 – 13:00', dia: 'Sábado' },
  // Redes Sábados Mañana
  redes_S_M1: { turno: 'Mañana', hora: '09:00 – 10:00', dia: 'Sábado' },
  redes_S_M2: { turno: 'Mañana', hora: '10:00 – 11:00', dia: 'Sábado' },
  redes_S_M3: { turno: 'Mañana', hora: '11:00 – 12:00', dia: 'Sábado' },
  redes_S_M4: { turno: 'Mañana', hora: '12:00 – 13:00', dia: 'Sábado' },
  // Redes Sábados Tarde
  redes_S_T1: { turno: 'Tarde', hora: '14:00 – 15:00', dia: 'Sábado' },
  redes_S_T2: { turno: 'Tarde', hora: '15:00 – 16:00', dia: 'Sábado' },
  redes_S_T3: { turno: 'Tarde', hora: '16:00 – 17:00', dia: 'Sábado' },
  redes_S_T4: { turno: 'Tarde', hora: '17:00 – 18:00', dia: 'Sábado' },
};

/* Hours per module (1h per module, except Gastronomía = 2h) */
const HOURS_PER_MODULE: Record<string, number> = {
  info_gastro_L_1: 2,
};
const getHoursForModule = (id: string) => HOURS_PER_MODULE[id] || 1;

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

type Tab = 'horarios' | 'horas';

const Horarios: React.FC = () => {
  const { materias, asistencias, alumnos, currentUser } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>('horarios');
  const [expandedCareers, setExpandedCareers] = useState<Set<string>>(new Set(DEFAULT_CAREERS.map(c => c.id)));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

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
    const result: Record<string, Record<string, { clases: number; horas: number }>> = {};

    materias.forEach(m => {
      if (!misMateriaIds.has(m.id)) return;
      const materiaAsistencias = asistencias.filter(a => a.materiaId === m.id);
      const datesByMonth: Record<string, Set<string>> = {};

      materiaAsistencias.forEach(a => {
        const [year, month] = a.fecha.split('-');
        if (Number(year) !== selectedYear) return;
        const key = `${year}-${month}`;
        if (!datesByMonth[key]) datesByMonth[key] = new Set();
        datesByMonth[key].add(a.fecha);
      });

      const horasModulo = getHoursForModule(m.id);
      result[m.id] = {};
      Object.entries(datesByMonth).forEach(([monthKey, dates]) => {
        result[m.id][monthKey] = {
          clases: dates.size,
          horas: dates.size * horasModulo,
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

          {careerGroups.map(({ career, materias: careerMaterias }) => (
            <div key={career.id} className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center gap-3">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: career.color }} />
                <h3 className="font-bold text-foreground text-sm">{career.nombre}</h3>
                <span className="text-xs text-muted-foreground">— Registro de horas {selectedYear}</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-background">
                      <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase text-left sticky left-0 bg-background min-w-[140px]">Módulo</th>
                      {allMonths.filter(m => m.startsWith(String(selectedYear))).map(m => {
                        const monthIdx = parseInt(m.split('-')[1], 10) - 1;
                        return (
                          <th key={m} className="px-3 py-2.5 text-xs font-semibold text-muted-foreground uppercase text-center min-w-[80px]">
                            {MONTH_NAMES[monthIdx]?.slice(0, 3)}
                          </th>
                        );
                      })}
                      <th className="px-4 py-2.5 text-xs font-bold text-foreground uppercase text-center bg-indigo-50 min-w-[80px]">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {careerMaterias.map(m => {
                      const monthData = horasPorMes[m.id] || {};
                      const relevantMonths = allMonths.filter(mo => mo.startsWith(String(selectedYear)));
                      const totalHoras = relevantMonths.reduce((sum, mo) => sum + (monthData[mo]?.horas || 0), 0);
                      const totalClases = relevantMonths.reduce((sum, mo) => sum + (monthData[mo]?.clases || 0), 0);

                      return (
                        <tr key={m.id} className="hover:bg-background">
                          <td className="px-4 py-3 sticky left-0 bg-card">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }} />
                              <span className="text-sm font-medium text-foreground">{m.codigo}</span>
                            </div>
                          </td>
                          {relevantMonths.map(mo => {
                            const data = monthData[mo];
                            return (
                              <td key={mo} className="px-3 py-3 text-center">
                                {data ? (
                                  <div>
                                    <span className="text-sm font-bold text-foreground">{data.horas}h</span>
                                    <p className="text-[10px] text-muted-foreground">{data.clases} clase{data.clases !== 1 ? 's' : ''}</p>
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-300">—</span>
                                )}
                              </td>
                            );
                          })}
                          <td className="px-4 py-3 text-center bg-indigo-50/50">
                            <span className="text-sm font-bold text-indigo-700">{totalHoras}h</span>
                            <p className="text-[10px] text-muted-foreground">{totalClases} clases</p>
                          </td>
                        </tr>
                      );
                    })}

                    {/* Career totals row */}
                    <tr className="bg-background font-bold">
                      <td className="px-4 py-3 text-sm text-foreground sticky left-0 bg-background">Total</td>
                      {allMonths.filter(m => m.startsWith(String(selectedYear))).map(mo => {
                        const total = careerMaterias.reduce((sum, m) => sum + (horasPorMes[m.id]?.[mo]?.horas || 0), 0);
                        return (
                          <td key={mo} className="px-3 py-3 text-center text-sm text-foreground">
                            {total > 0 ? `${total}h` : '—'}
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-center bg-indigo-100/50">
                        <span className="text-sm font-bold text-indigo-800">
                          {careerMaterias.reduce((sum, m) => {
                            return sum + allMonths
                              .filter(mo => mo.startsWith(String(selectedYear)))
                              .reduce((s, mo) => s + (horasPorMes[m.id]?.[mo]?.horas || 0), 0);
                          }, 0)}h
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ))}

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
