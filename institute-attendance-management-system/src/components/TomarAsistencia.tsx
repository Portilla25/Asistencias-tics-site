import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle, XCircle, Clock, FileText, Save, ChevronDown, Calendar, Users } from 'lucide-react';
import { Asistencia } from '../types';

type Estado = Asistencia['estado'];

const estadoConfig: Record<Estado, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  presente: { label: 'Presente', color: 'text-green-700', bg: 'bg-green-100 border-green-300', icon: <CheckCircle className="w-4 h-4" /> },
  ausente: { label: 'Ausente', color: 'text-red-700', bg: 'bg-red-100 border-red-300', icon: <XCircle className="w-4 h-4" /> },
  tardanza: { label: 'Tardanza', color: 'text-amber-700', bg: 'bg-amber-100 border-amber-300', icon: <Clock className="w-4 h-4" /> },
  justificado: { label: 'Justificado', color: 'text-indigo-700', bg: 'bg-indigo-100 border-indigo-300', icon: <FileText className="w-4 h-4" /> },
};

const TomarAsistencia: React.FC = () => {
  const { currentUser, materias, alumnos, asistencias, registrarAsistenciaLote } = useApp();

  const today = new Date().toLocaleDateString('en-CA');
  const [fecha, setFecha] = useState(today);
  const [selectedMateria, setSelectedMateria] = useState('');
  const [estados, setEstados] = useState<Record<string, Estado>>({});
  const [observaciones, setObservaciones] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [, setMarcarTodos] = useState<Estado | ''>('');

  const misMaterias = currentUser?.rol === 'admin'
    ? materias
    : materias.filter(m => m.docenteId === currentUser?.id);

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
    <div className="p-6 space-y-6">
      {/* Selección */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-gray-800 mb-4">Seleccionar Clase</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <ChevronDown className="w-4 h-4 inline mr-1.5 text-gray-400" />Materia
            </label>
            <select
              value={selectedMateria}
              onChange={e => setSelectedMateria(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            >
              <option value="">-- Seleccionar materia --</option>
              {misMaterias.map(m => (
                <option key={m.id} value={m.id}>{m.nombre} ({m.codigo})</option>
              ))}
            </select>
          </div>
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
          <p className="text-gray-500 font-medium">Seleccioná una materia y fecha para comenzar</p>
          <p className="text-gray-400 text-sm mt-1">Verás la lista de alumnos para registrar su asistencia</p>
        </div>
      )}
    </div>
  );
};

const ClipboardListIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
  </svg>
);

export default TomarAsistencia;
