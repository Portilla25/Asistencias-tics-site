import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle, XCircle, Clock, FileText, Save, ChevronDown, ChevronRight, Calendar, Users } from 'lucide-react';
import { Asistencia } from '../types';
import { DEFAULT_CAREERS, LegacyCareer } from '../services/legacyData';

type Estado = Asistencia['estado'];

const estadoConfig: Record<Estado, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  presente: { label: 'Presente', color: 'text-green-700', bg: 'bg-green-100 border-green-300', icon: <CheckCircle className="w-4 h-4" /> },
  ausente: { label: 'Ausente', color: 'text-red-700', bg: 'bg-red-100 border-red-300', icon: <XCircle className="w-4 h-4" /> },
  tardanza: { label: 'Tardanza', color: 'text-amber-700', bg: 'bg-amber-100 border-amber-300', icon: <Clock className="w-4 h-4" /> },
  justificado: { label: 'Justificado', color: 'text-indigo-700', bg: 'bg-indigo-100 border-indigo-300', icon: <FileText className="w-4 h-4" /> },
};

const CAREER_ICONS: Record<string, string> = {
  info_gastro: '🍽️',
  redes: '🌐',
  tics_sabados: '💻',
  redes_sabados: '📡',
};

const TomarAsistencia: React.FC = () => {
  const { currentUser, materias, alumnos, asistencias, registrarAsistenciaLote } = useApp();

  const today = new Date().toLocaleDateString('en-CA');
  const [fecha, setFecha] = useState(today);
  const [selectedMateria, setSelectedMateria] = useState('');
  const [selectedCareer, setSelectedCareer] = useState('info_gastro'); // Lunes por defecto
  const [expandedCareers, setExpandedCareers] = useState<Set<string>>(new Set(['info_gastro']));
  const [estados, setEstados] = useState<Record<string, Estado>>({});
  const [observaciones, setObservaciones] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [, setMarcarTodos] = useState<Estado | ''>('');

  const misMaterias = currentUser?.rol === 'admin'
    ? materias
    : materias.filter(m => m.docenteId === currentUser?.id);

  // Group materias by career
  const careerGroups = useMemo(() => {
    const groups: { career: LegacyCareer; materias: typeof misMaterias }[] = [];

    DEFAULT_CAREERS.forEach((career) => {
      const careerMateriaIds = new Set(career.secciones.map((s) => s.id));
      const careerMaterias = misMaterias.filter((m) => careerMateriaIds.has(m.id));
      if (careerMaterias.length > 0) {
        groups.push({ career, materias: careerMaterias });
      }
    });

    // Any materias not in any career
    const allCareerIds = new Set(DEFAULT_CAREERS.flatMap((c) => c.secciones.map((s) => s.id)));
    const ungrouped = misMaterias.filter((m) => !allCareerIds.has(m.id));
    if (ungrouped.length > 0) {
      groups.push({
        career: { id: '_otros', nombre: 'Otros módulos', color: '#6b7280', secciones: [] },
        materias: ungrouped,
      });
    }

    return groups;
  }, [misMaterias]);

  const toggleCareer = (careerId: string) => {
    setExpandedCareers((prev) => {
      const next = new Set(prev);
      if (next.has(careerId)) {
        next.delete(careerId);
      } else {
        next.add(careerId);
      }
      return next;
    });
  };

  const selectCareerAndMateria = (careerId: string, materiaId: string) => {
    setSelectedCareer(careerId);
    setSelectedMateria(materiaId);
    setExpandedCareers((prev) => new Set(prev).add(careerId));
  };

  const alumnosMateria = useMemo(() => {
    if (!selectedMateria) return [];
    return alumnos.filter(a => a.materias.includes(selectedMateria));
  }, [selectedMateria, alumnos]);

  // Pre-fill with existing attendance
  React.useEffect(() => {
    if (!selectedMateria || !fecha) return;
    const newEstados: Record<string, Estado> = {};
    const newObs: Record<string, string> = {};
    alumnosMateria.forEach(alumno => {
      const existing = asistencias.find(a => a.alumnoId === alumno.id && a.materiaId === selectedMateria && a.fecha === fecha);
      if (existing) {
        newEstados[alumno.id] = existing.estado;
        newObs[alumno.id] = existing.observacion || '';
      }
    });
    setEstados(newEstados);
    setObservaciones(newObs);
    setSaved(false);
  }, [selectedMateria, fecha, alumnosMateria, asistencias]);

  const handleEstado = (alumnoId: string, estado: Estado) => {
    setEstados(prev => ({ ...prev, [alumnoId]: estado }));
    setSaved(false);
  };

  const handleMarcarTodos = (estado: Estado) => {
    const newEstados: Record<string, Estado> = {};
    alumnosMateria.forEach(a => { newEstados[a.id] = estado; });
    setEstados(newEstados);
    setMarcarTodos(estado);
    setSaved(false);
  };

  const handleGuardar = () => {
    const batch: Omit<Asistencia, 'id'>[] = alumnosMateria
      .filter(a => estados[a.id])
      .map(a => ({
        alumnoId: a.id,
        materiaId: selectedMateria,
        fecha,
        estado: estados[a.id],
        observacion: observaciones[a.id] || undefined,
        registradoPor: currentUser?.id || '',
      }));
    registrarAsistenciaLote(batch);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const resumen = useMemo(() => {
    const counts = { presente: 0, ausente: 0, tardanza: 0, justificado: 0 };
    Object.values(estados).forEach(e => { if (e) counts[e]++; });
    return counts;
  }, [estados]);

  const materia = materias.find(m => m.id === selectedMateria);
  const completados = alumnosMateria.filter(a => estados[a.id]).length;

  return (
    <div className="flex h-full">
      {/* ====== LEFT SIDEBAR: Course selector ====== */}
      <div className="w-72 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col overflow-y-auto">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Mis Cursos</h2>
          <p className="text-xs text-gray-400 mt-0.5">Selecciona un curso y módulo</p>
        </div>

        <nav className="flex-1 p-2 space-y-1">
          {careerGroups.map(({ career, materias: careerMaterias }) => {
            const isExpanded = expandedCareers.has(career.id);
            const hasSelected = careerMaterias.some((m) => m.id === selectedMateria);
            const icon = CAREER_ICONS[career.id] || '📚';

            return (
              <div key={career.id} className="rounded-lg overflow-hidden">
                {/* Career header */}
                <button
                  onClick={() => toggleCareer(career.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                    hasSelected
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-base">{icon}</span>
                  <span className="flex-1 text-left truncate">{career.nombre}</span>
                  <span className="text-xs text-gray-400 font-normal">{careerMaterias.length}</span>
                  {isExpanded
                    ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                    : <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                  }
                </button>

                {/* Materias grouped by turno */}
                {isExpanded && (() => {
                  // Group materias by shift
                  const getShift = (id: string): string => {
                    if (id.includes('_S_M')) return '☀️ Sábado Mañana';
                    if (id.includes('_S_T')) return '🌙 Sábado Tarde';
                    if (id.includes('_S_')) return '📅 Sábado';
                    if (id.includes('_M_')) return '☀️ Turno Mañana';
                    if (id.includes('_T_')) return '🌙 Turno Tarde';
                    if (id.includes('_L_')) return '📅 Lunes';
                    return '';
                  };

                  const groups = new Map<string, typeof careerMaterias>();
                  careerMaterias.forEach(m => {
                    const shift = getShift(m.id);
                    if (!groups.has(shift)) groups.set(shift, []);
                    groups.get(shift)!.push(m);
                  });

                  const entries = [...groups.entries()];
                  const needsHeaders = entries.length > 1 || (entries.length === 1 && entries[0][0] !== '');

                  return (
                    <div className="ml-2 mt-0.5 pb-1">
                      {entries.map(([shift, mats]) => (
                        <div key={shift || '_flat'}>
                          {needsHeaders && shift && (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 mt-1">
                              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{shift}</span>
                              <div className="flex-1 border-t border-gray-100" />
                            </div>
                          )}
                          <div className="space-y-0.5">
                            {mats.map(m => (
                              <button
                                key={m.id}
                                onClick={() => selectCareerAndMateria(career.id, m.id)}
                                className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-all ${
                                  selectedMateria === m.id
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'text-gray-600 hover:bg-gray-100'
                                }`}
                              >
                                <span
                                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: m.color }}
                                />
                                <span className="truncate text-left">{m.codigo}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            );
          })}
        </nav>
      </div>

      {/* ====== MAIN CONTENT ====== */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Date + materia info */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <Calendar className="w-4 h-4 inline mr-1.5 text-gray-400" />Fecha
              </label>
              <input
                type="date"
                value={fecha}
                onChange={e => setFecha(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
            {materia && (
              <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: materia.color }} />
                <div>
                  <p className="text-sm font-semibold text-gray-900">{materia.nombre}</p>
                  <p className="text-xs text-gray-500">{materia.codigo}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {selectedMateria && (
          <>
            {/* Resumen */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(Object.keys(estadoConfig) as Estado[]).map(e => (
                <div key={e} className={`rounded-xl p-3 border ${estadoConfig[e].bg}`}>
                  <div className={`flex items-center gap-1.5 ${estadoConfig[e].color} font-semibold text-sm mb-1`}>
                    {estadoConfig[e].icon}
                    <span>{estadoConfig[e].label}</span>
                  </div>
                  <p className={`text-2xl font-bold ${estadoConfig[e].color}`}>{resumen[e]}</p>
                </div>
              ))}
            </div>

            {/* Acciones rápidas */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-gray-400" />
                  Marcar todos como:
                </span>
                {(Object.keys(estadoConfig) as Estado[]).map(e => (
                  <button
                    key={e}
                    onClick={() => handleMarcarTodos(e)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${estadoConfig[e].bg} ${estadoConfig[e].color} hover:opacity-80`}
                  >
                    {estadoConfig[e].label}
                  </button>
                ))}
                <div className="ml-auto flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    {completados}/{alumnosMateria.length} completados
                  </span>
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all"
                      style={{ width: `${alumnosMateria.length > 0 ? (completados / alumnosMateria.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Lista de alumnos */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-800">{materia?.nombre}</h3>
                  <p className="text-xs text-gray-500">{alumnosMateria.length} alumnos · {fecha}</p>
                </div>
                <button
                  onClick={handleGuardar}
                  disabled={completados === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Guardar
                </button>
              </div>

              {saved && (
                <div className="px-5 py-2.5 bg-green-50 text-green-700 text-sm flex items-center gap-2 border-b border-green-100">
                  <CheckCircle className="w-4 h-4" />
                  ¡Asistencia guardada correctamente!
                </div>
              )}

              <div className="divide-y divide-gray-50">
                {alumnosMateria.map((alumno, idx) => {
                  const estado = estados[alumno.id];
                  return (
                    <div key={alumno.id} className={`px-5 py-4 ${estado ? '' : 'bg-gray-50/50'}`}>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        {/* Alumno info */}
                        <div className="flex items-center gap-3 flex-1">
                          <span className="text-xs text-gray-400 w-5 text-center">{idx + 1}</span>
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
                            style={{ backgroundColor: materia?.color || '#6366f1' }}>
                            {alumno.nombre[0]}{alumno.apellido[0]}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{alumno.apellido}, {alumno.nombre}</p>
                            <p className="text-xs text-gray-500">DNI: {alumno.dni} · {alumno.curso}</p>
                          </div>
                        </div>

                        {/* Estado buttons */}
                        <div className="flex gap-1.5 flex-wrap">
                          {(Object.keys(estadoConfig) as Estado[]).map(e => (
                            <button
                              key={e}
                              onClick={() => handleEstado(alumno.id, e)}
                              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                                estado === e
                                  ? `${estadoConfig[e].bg} ${estadoConfig[e].color} ring-2 ring-offset-1 ring-current`
                                  : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                              }`}
                            >
                              {estadoConfig[e].icon}
                              <span className="hidden sm:inline">{estadoConfig[e].label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {(estado === 'ausente' || estado === 'tardanza' || estado === 'justificado') && (
                        <div className="mt-2 ml-14">
                          <input
                            type="text"
                            placeholder="Observación (opcional)..."
                            value={observaciones[alumno.id] || ''}
                            onChange={e => setObservaciones(prev => ({ ...prev, [alumno.id]: e.target.value }))}
                            className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {alumnosMateria.length > 0 && (
                <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex justify-end">
                  <button
                    onClick={handleGuardar}
                    disabled={completados === 0}
                    className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    Guardar Asistencia
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {!selectedMateria && (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
            <ClipboardListIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Seleccioná un curso del panel izquierdo para comenzar</p>
            <p className="text-gray-400 text-sm mt-1">Verás la lista de alumnos para registrar su asistencia</p>
          </div>
        )}
      </div>
    </div>
  );
};

const ClipboardListIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
  </svg>
);

export default TomarAsistencia;
