import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle, XCircle, Clock, FileText, Filter } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const estadoBadge: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  presente: { label: 'Presente', color: 'bg-green-100 text-green-700', icon: <CheckCircle className="w-3.5 h-3.5" /> },
  ausente: { label: 'Ausente', color: 'bg-red-100 text-red-700', icon: <XCircle className="w-3.5 h-3.5" /> },
  tardanza: { label: 'Tardanza', color: 'bg-amber-100 text-amber-700', icon: <Clock className="w-3.5 h-3.5" /> },
  justificado: { label: 'Justificado', color: 'bg-indigo-100 text-indigo-700', icon: <FileText className="w-3.5 h-3.5" /> },
};

const MisAsistencias: React.FC = () => {
  const { currentUser, alumnos, materias, asistencias } = useApp();
  const [filterMateria, setFilterMateria] = useState('');
  const [filterMes, setFilterMes] = useState('');

  const alumno = alumnos.find(a => a.email === currentUser?.email);

  const misAsistencias = useMemo(() => {
    if (!alumno) return [];
    return asistencias
      .filter(a => a.alumnoId === alumno.id)
      .filter(a => filterMateria ? a.materiaId === filterMateria : true)
      .filter(a => filterMes ? a.fecha.startsWith(filterMes) : true)
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
  }, [alumno, asistencias, filterMateria, filterMes]);

  const porMateria = useMemo(() => {
    if (!alumno) return [];
    const misMats = materias.filter(m => alumno.materias.includes(m.id));
    return misMats.map(m => {
      const asis = asistencias.filter(a => a.alumnoId === alumno.id && a.materiaId === m.id);
      const presentes = asis.filter(a => a.estado === 'presente').length;
      const pct = asis.length > 0 ? Math.round((presentes / asis.length) * 100) : 0;
      return { nombre: m.nombre.split(' ')[0], pct, color: m.color, total: asis.length, presentes };
    });
  }, [alumno, materias, asistencias]);

  const stats = useMemo(() => {
    const total = misAsistencias.length;
    const presentes = misAsistencias.filter(a => a.estado === 'presente').length;
    const ausentes = misAsistencias.filter(a => a.estado === 'ausente').length;
    const tardanzas = misAsistencias.filter(a => a.estado === 'tardanza').length;
    const justificados = misAsistencias.filter(a => a.estado === 'justificado').length;
    const pct = total > 0 ? Math.round((presentes / total) * 100) : 0;
    return { total, presentes, ausentes, tardanzas, justificados, pct };
  }, [misAsistencias]);

  const meses = useMemo(() => {
    const values = [...new Set(asistencias.map(a => a.fecha.slice(0, 7)).filter(Boolean))].sort().reverse();
    return values.map(value => ({
      value,
      label: new Date(`${value}-01T12:00:00`).toLocaleDateString('es-PE', { month: 'long', year: 'numeric' }),
    }));
  }, [asistencias]);

  if (!alumno) {
    return (
      <div className="p-6 text-center text-gray-500">
        <p>No se encontró información del alumno.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">
      {/* Perfil resumen */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-bold">
            {alumno.nombre[0]}{alumno.apellido[0]}
          </div>
          <div>
            <h2 className="text-xl font-bold">{alumno.nombre} {alumno.apellido}</h2>
            <p className="text-indigo-200 text-sm">Curso {alumno.curso} · DNI {alumno.dni}</p>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Asistencia', value: `${stats.pct}%`, highlight: true },
            { label: 'Presentes', value: stats.presentes },
            { label: 'Ausentes', value: stats.ausentes },
            { label: 'Tardanzas', value: stats.tardanzas },
          ].map(s => (
            <div key={s.label} className={`${s.highlight ? 'bg-white/20' : 'bg-white/10'} rounded-xl p-3 text-center`}>
              <p className={`${s.highlight ? 'text-2xl' : 'text-xl'} font-bold`}>{s.value}</p>
              <p className="text-xs text-indigo-200">{s.label}</p>
            </div>
          ))}
        </div>
        {stats.pct < 75 && (
          <div className="mt-4 bg-red-500/30 border border-red-400/50 rounded-xl p-3 text-sm">
            ⚠️ <strong>Atención:</strong> Tu porcentaje de asistencia ({stats.pct}%) está por debajo del mínimo requerido (75%).
          </div>
        )}
      </div>

      {/* Gráfico por materia */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-800 mb-4">Asistencia por Materia (%)</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={porMateria}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="nombre" tick={{ fontSize: 11 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => [`${v}%`, '% Asistencia']} />
            <Bar dataKey="pct" name="% Asistencia" radius={[4, 4, 0, 0]}>
              {porMateria.map((m, i) => <Cell key={i} fill={m.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-wrap gap-3 items-center">
          <Filter className="w-4 h-4 text-gray-400" />
          <select value={filterMateria} onChange={e => setFilterMateria(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">Todas las materias</option>
            {materias.filter(m => alumno.materias.includes(m.id)).map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
          </select>
          <select value={filterMes} onChange={e => setFilterMes(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">Todos los meses</option>
            {meses.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          <span className="text-xs text-gray-500 ml-auto">{misAsistencias.length} registros</span>
        </div>
      </div>

      {/* Lista de asistencias */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="divide-y divide-gray-50">
          {misAsistencias.slice(0, 50).map(asis => {
            const materia = materias.find(m => m.id === asis.materiaId);
            const badge = estadoBadge[asis.estado];
            const fecha = new Date(asis.fecha + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
            return (
              <div key={asis.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50/50">
                <div className="w-1.5 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: materia?.color || '#6366f1' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{materia?.nombre}</p>
                  <p className="text-xs text-gray-500 capitalize">{fecha}</p>
                  {asis.observacion && <p className="text-xs text-gray-400 italic mt-0.5">{asis.observacion}</p>}
                </div>
                <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${badge.color}`}>
                  {badge.icon}
                  {badge.label}
                </span>
              </div>
            );
          })}
          {misAsistencias.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <CheckCircle className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No hay registros de asistencia</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MisAsistencias;
