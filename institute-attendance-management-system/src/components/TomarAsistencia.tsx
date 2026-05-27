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

    // Any materias not in any career are intentionally hidden as requested by user
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
    return alumnos
      .filter(a => a.materias.includes(selectedMateria))
      .sort((a, b) => {
        const aRetirado = a.estado === 'retirado';
        const bRetirado = b.estado === 'retirado';
        if (aRetirado && !bRetirado) return 1;
        if (!aRetirado && bRetirado) return -1;
        return a.apellido.localeCompare(b.apellido);
      });
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
    <div className="flex h-full bg-background">
      {/* ====== LEFT SIDEBAR: Premium Course Selector ====== */}
      <div className="w-[300px] flex-shrink-0 bg-card/80 backdrop-blur-xl border-r border-border flex flex-col overflow-y-auto shadow-[4px_0_24px_-12px_rgba(0,0,0,0.05)] z-10">
        <div className="p-6 border-b border-border bg-card/50 sticky top-0 z-20 backdrop-blur-md">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-primary/10 text-primary rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-foreground tracking-tight">Mis Cursos</h2>
              <p className="text-[13px] text-muted-foreground font-medium">Gestión de asistencia</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-4">
          {careerGroups.map(({ career, materias: careerMaterias }) => {
            const isExpanded = expandedCareers.has(career.id);
            const hasSelected = careerMaterias.some((m) => m.id === selectedMateria);
            const icon = CAREER_ICONS[career.id] || '📚';

            return (
              <div key={career.id} className="relative group">
                {/* Career header */}
                <button
                  onClick={() => toggleCareer(career.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 ${
                    hasSelected
                      ? 'bg-card shadow-[0_4px_20px_-4px_rgba(var(--primary),0.15)] border border-primary/20 ring-1 ring-primary/10'
                      : 'hover:bg-card-hover hover:shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] border border-transparent'
                  }`}
                >
                  <div className={`flex items-center justify-center w-10 h-10 rounded-lg text-lg transition-transform duration-300 ${hasSelected ? 'scale-110 bg-primary/10' : 'bg-muted group-hover:scale-105'}`}>
                    {icon}
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className={`text-[14px] font-bold leading-tight ${hasSelected ? 'text-primary' : 'text-foreground'}`}>
                      {career.nombre}
                    </h3>
                    <p className="text-[12px] font-medium text-muted-foreground mt-0.5">
                      {careerMaterias.length} módulos
                    </p>
                  </div>
                  <div className={`p-1 rounded-full transition-colors ${hasSelected ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`}>
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </div>
                </button>

                {/* Materias grouped by turno */}
                <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[1000px] opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
                  {(() => {
                    const getShiftInfo = (id: string) => {
                      if (id.includes('_S_M')) return { name: 'Sábado Mañana', icon: '☀️', color: 'text-amber-500', border: 'border-amber-200' };
                      if (id.includes('_S_T')) return { name: 'Sábado Tarde', icon: '🌙', color: 'text-indigo-400', border: 'border-indigo-200' };
                      if (id.includes('_S_')) return { name: 'Sábados', icon: '📅', color: 'text-emerald-500', border: 'border-emerald-200' };
                      if (id.includes('_M_')) return { name: 'Turno Mañana', icon: '☀️', color: 'text-amber-500', border: 'border-amber-200' };
                      if (id.includes('_T_')) return { name: 'Turno Tarde', icon: '🌙', color: 'text-indigo-400', border: 'border-indigo-200' };
                      if (id.includes('_L_')) return { name: 'Lunes', icon: '📅', color: 'text-emerald-500', border: 'border-emerald-200' };
                      return null;
                    };

                    const groups = new Map<string, typeof careerMaterias>();
                    const shiftMeta = new Map<string, any>();
                    careerMaterias.forEach(m => {
                      const meta = getShiftInfo(m.id) || { name: 'General', icon: '📌', color: 'text-slate-400', border: 'border-slate-200' };
                      if (!groups.has(meta.name)) {
                        groups.set(meta.name, []);
                        shiftMeta.set(meta.name, meta);
                      }
                      groups.get(meta.name)!.push(m);
                    });

                    const entries = [...groups.entries()];
                    // Solo mostramos encabezados de turno si hay MÁS de 1 turno en la carrera
                    const needsHeaders = entries.length > 1;

                    return (
                      <div className="relative pl-6 pr-2 pb-2">
                        {/* Vertical connection line */}
                        <div className="absolute left-[34px] top-2 bottom-6 w-px bg-border"></div>
                        
                        {entries.map(([shiftName, mats], gIdx) => {
                          const meta = shiftMeta.get(shiftName);
                          return (
                            <div key={shiftName} className={`${gIdx > 0 ? 'mt-5' : 'mt-2'}`}>
                              {needsHeaders && (
                                <div className="flex items-center gap-2 mb-3 relative z-10">
                                  <div className={`w-5 h-5 rounded-full bg-card border-2 flex items-center justify-center text-[10px] ${meta.border} shadow-sm`}>
                                    {meta.icon}
                                  </div>
                                  <span className={`text-[11px] font-bold uppercase tracking-widest ${meta.color}`}>
                                    {shiftName}
                                  </span>
                                </div>
                              )}
                              <div className="space-y-1.5 pl-6 relative z-10">
                                {mats.map(m => {
                                  const isActive = selectedMateria === m.id;
                                  return (
                                    <button
                                      key={m.id}
                                      onClick={() => selectCareerAndMateria(career.id, m.id)}
                                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-300 relative overflow-hidden group/btn ${
                                        isActive
                                          ? 'text-primary-foreground shadow-lg transform scale-[1.02]'
                                          : 'text-muted-foreground hover:text-foreground hover:bg-card-hover hover:shadow-sm'
                                      }`}
                                    >
                                      {isActive && (
                                        <div className="absolute inset-0 bg-primary opacity-100"></div>
                                      )}
                                      
                                      <span
                                        className={`w-2.5 h-2.5 rounded-full flex-shrink-0 relative z-10 transition-transform ${isActive ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] scale-110' : 'opacity-70 group-hover/btn:scale-110 group-hover/btn:opacity-100'}`}
                                        style={!isActive ? { backgroundColor: m.color } : undefined}
                                      />
                                      <span className={`text-[13px] font-semibold truncate relative z-10 ${isActive ? 'text-primary-foreground' : ''}`}>
                                        {m.codigo}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </div>
            );
          })}
        </nav>
      </div>

      {/* ====== MAIN CONTENT ====== */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Date + materia info */}
        <div className="bg-card rounded-xl p-5 shadow-sm border border-border">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-foreground mb-1.5">
                <Calendar className="w-4 h-4 inline mr-1.5 text-muted-foreground" />Fecha
              </label>
              <input
                type="date"
                value={fecha}
                onChange={e => setFecha(e.target.value)}
                className="w-full px-3 py-2.5 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              />
            </div>
            {materia && (
              <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border border-border bg-muted">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: materia.color }} />
                <div>
                  <p className="text-sm font-semibold text-foreground">{materia.nombre}</p>
                  <p className="text-xs text-muted-foreground">{materia.codigo}</p>
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
            <div className="bg-card rounded-xl p-4 shadow-sm border border-border">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-muted-foreground" />
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
                  <span className="text-xs text-muted-foreground">
                    {completados}/{alumnosMateria.length} completados
                  </span>
                  <div className="w-24 bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${alumnosMateria.length > 0 ? (completados / alumnosMateria.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Lista de alumnos */}
            <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
              <div className="px-5 py-3 border-b border-border bg-muted flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">{materia?.nombre}</h3>
                  <p className="text-xs text-muted-foreground">{alumnosMateria.length} alumnos · {fecha}</p>
                </div>
                <button
                  onClick={handleGuardar}
                  disabled={completados === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground rounded-lg text-sm font-medium transition-colors"
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

              <div className="divide-y divide-border">
                {alumnosMateria.map((alumno, idx) => {
                  const estado = estados[alumno.id];
                  return (
                    <div key={alumno.id} className={`px-5 py-4 ${alumno.estado === 'retirado' ? 'bg-gray-50/50 opacity-80' : (estado ? '' : 'bg-muted/30')}`}>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        {/* Alumno info */}
                        <div className="flex items-center gap-3 flex-1">
                          <span className="text-xs text-muted-foreground w-5 text-center">{idx + 1}</span>
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white ${alumno.estado === 'retirado' ? 'bg-gray-300' : ''}`}
                            style={alumno.estado !== 'retirado' ? { backgroundColor: materia?.color || '#6366f1' } : undefined}>
                            {alumno.nombre[0]}{alumno.apellido[0]}
                          </div>
                          <div>
                            <p className={`font-medium text-sm ${alumno.estado === 'retirado' ? 'text-gray-500 line-through decoration-gray-400' : 'text-foreground'}`}>
                              {alumno.apellido}, {alumno.nombre}
                            </p>
                            <div className="flex items-center gap-2">
                              <p className="text-xs text-muted-foreground">DNI: {alumno.dni} · {alumno.curso}</p>
                              {alumno.estado === 'retirado' && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">RETIRADO</span>
                              )}
                            </div>
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
                                  : 'bg-card border-border text-muted-foreground hover:border-primary/50'
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
                            className="w-full px-3 py-1.5 border border-border bg-background text-foreground rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {alumnosMateria.length > 0 && (
                <div className="px-5 py-3 bg-muted border-t border-border flex justify-end">
                  <button
                    onClick={handleGuardar}
                    disabled={completados === 0}
                    className="flex items-center gap-2 px-6 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground rounded-lg text-sm font-semibold transition-colors"
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
          <div className="bg-card rounded-xl p-12 text-center shadow-sm border border-border">
            <ClipboardListIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground font-medium">Seleccioná un curso del panel izquierdo para comenzar</p>
            <p className="text-muted-foreground/70 text-sm mt-1">Verás la lista de alumnos para registrar su asistencia</p>
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
