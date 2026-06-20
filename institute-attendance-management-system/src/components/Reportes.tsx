import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Download, Filter, TrendingUp, TrendingDown, Award, AlertTriangle, FileSpreadsheet } from 'lucide-react';
import { exportToGastronomiaExcel } from '../utils/exportExcel';
import { obtenerNotasMateria } from '../services/notas';

const Reportes: React.FC = () => {
  const { alumnos, materias, asistencias, currentUser } = useApp();
  const [filterMateria, setFilterMateria] = useState('');
  const [filterCurso, setFilterCurso] = useState('');
  const [activeTab, setActiveTab] = useState<'general' | 'alumnos' | 'materias'>('general');

  const misMaterias = currentUser?.rol === 'admin' ? materias : materias.filter(m => m.docenteId === currentUser?.id);
  const cursos = [...new Set(alumnos.map(a => a.curso))].sort();

  const filteredAsistencias = useMemo(() => {
    let filtered = asistencias;
    if (currentUser?.rol === 'docente') {
      const materiaIds = materias.filter(m => m.docenteId === currentUser.id).map(m => m.id);
      filtered = filtered.filter(a => materiaIds.includes(a.materiaId));
    }
    if (filterMateria) filtered = filtered.filter(a => a.materiaId === filterMateria);
    if (filterCurso) {
      const alumnosCurso = alumnos.filter(a => a.curso === filterCurso).map(a => a.id);
      filtered = filtered.filter(a => alumnosCurso.includes(a.alumnoId));
    }
    return filtered;
  }, [asistencias, currentUser, materias, filterMateria, filterCurso, alumnos]);

  const generalStats = useMemo(() => {
    const total = filteredAsistencias.length;
    const presentes = filteredAsistencias.filter(a => a.estado === 'presente').length;
    const ausentes = filteredAsistencias.filter(a => a.estado === 'ausente').length;
    const tardanzas = filteredAsistencias.filter(a => a.estado === 'tardanza').length;
    const justificados = filteredAsistencias.filter(a => a.estado === 'justificado').length;
    return {
      total, presentes, ausentes, tardanzas, justificados,
      pctPresentes: total > 0 ? Math.round((presentes / total) * 100) : 0,
      pctAusentes: total > 0 ? Math.round((ausentes / total) * 100) : 0,
    };
  }, [filteredAsistencias]);

  const alumnosReport = useMemo(() => {
    const visibleAlumnos = currentUser?.rol === 'docente'
      ? alumnos.filter(a => a.materias.some(materiaId => misMaterias.some(m => m.id === materiaId)))
      : alumnos;
    const filtAlumnos = filterCurso ? visibleAlumnos.filter(a => a.curso === filterCurso) : visibleAlumnos;
    return filtAlumnos.map(alumno => {
      const asis = filteredAsistencias.filter(a => a.alumnoId === alumno.id);
      const presentes = asis.filter(a => a.estado === 'presente').length;
      const ausentes = asis.filter(a => a.estado === 'ausente').length;
      const tardanzas = asis.filter(a => a.estado === 'tardanza').length;
      const justificados = asis.filter(a => a.estado === 'justificado').length;
      const pct = asis.length > 0 ? Math.round((presentes / asis.length) * 100) : 0;
      return { ...alumno, presentes, ausentes, tardanzas, justificados, total: asis.length, pct };
    }).sort((a, b) => b.pct - a.pct);
  }, [alumnos, filteredAsistencias, filterCurso, currentUser, misMaterias]);

  const materiasReport = useMemo(() => {
    return misMaterias.map(m => {
      const asis = filteredAsistencias.filter(a => a.materiaId === m.id);
      const presentes = asis.filter(a => a.estado === 'presente').length;
      const pct = asis.length > 0 ? Math.round((presentes / asis.length) * 100) : 0;
      const clases = [...new Set(asis.map(a => a.fecha))].length;
      return { ...m, presentes, total: asis.length, pct, clases };
    }).sort((a, b) => b.pct - a.pct);
  }, [misMaterias, filteredAsistencias]);

  const tendenciaMensual = useMemo(() => {
    const meses = [...new Set(filteredAsistencias.map(a => a.fecha.slice(0, 7)).filter(Boolean))].sort();
    const visibleMeses = meses.length ? meses : [new Date().toLocaleDateString('en-CA').slice(0, 7)];
    return visibleMeses.map((mes) => {
      const asis = filteredAsistencias.filter(a => a.fecha.startsWith(mes));
      const presentes = asis.filter(a => a.estado === 'presente').length;
      const pct = asis.length > 0 ? Math.round((presentes / asis.length) * 100) : 0;
      return {
        mes: new Date(`${mes}-01T12:00:00`).toLocaleDateString('es-PE', { month: 'short' }),
        Asistencia: pct,
        total: asis.length,
      };
    });
  }, [filteredAsistencias]);

  const pieData = [
    { name: 'Presentes', value: generalStats.presentes, color: '#10b981' },
    { name: 'Ausentes', value: generalStats.ausentes, color: '#ef4444' },
    { name: 'Tardanzas', value: generalStats.tardanzas, color: '#f59e0b' },
    { name: 'Justificados', value: generalStats.justificados, color: '#6366f1' },
  ];

  const handleExport = () => {
    const data = alumnosReport.map(a => `${a.apellido},${a.nombre},${a.curso},${a.presentes},${a.ausentes},${a.tardanzas},${a.pct}%`);
    const csv = ['Apellido,Nombre,Curso,Presentes,Ausentes,Tardanzas,% Asistencia', ...data].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-asistencias-${new Date().toLocaleDateString('en-CA')}.csv`;
    a.click();
  };

  const [isExportingExcel, setIsExportingExcel] = useState(false);

  const handleExportExcel = async () => {
    if (!filterMateria) {
      alert("Por favor, selecciona una materia específica en el filtro para generar su reporte oficial en Excel.");
      return;
    }
    
    setIsExportingExcel(true);
    try {
      const materiaInfo = misMaterias.find(m => m.id === filterMateria);
      const materiaName = materiaInfo ? materiaInfo.nombre : 'Gastronomia';
      
      // Obtener notas desde Firebase si es posible (si no hay, devuelve {})
      let notasMateria = {};
      try {
        notasMateria = await obtenerNotasMateria(filterMateria);
      } catch (e) {
        console.warn("No se pudieron cargar las notas", e);
      }

      const success = await exportToGastronomiaExcel(
        alumnosReport, // pasamos solo los alumnos filtrados
        filteredAsistencias,
        notasMateria,
        materiaName
      );
      
      if (!success) {
        alert("Hubo un error al generar el archivo Excel.");
      }
    } finally {
      setIsExportingExcel(false);
    }
  };

  return (
    <div className="p-6 space-y-5">
      {/* Filters */}
      <div className="bg-card rounded-xl p-4 shadow-sm border border-border">
        <div className="flex flex-wrap gap-3 items-center">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select value={filterMateria} onChange={e => setFilterMateria(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">Todas las materias</option>
            {misMaterias.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
          </select>
          <select value={filterCurso} onChange={e => setFilterCurso(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">Todos los cursos</option>
            {cursos.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button
            onClick={() => { setFilterMateria(''); setFilterCurso(''); }}
            className="px-3 py-2 text-sm text-muted-foreground hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            Limpiar filtros
          </button>
          <button onClick={handleExport} className="ml-auto flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors">
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
          <button 
            onClick={handleExportExcel} 
            disabled={isExportingExcel}
            className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors ${isExportingExcel ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            {isExportingExcel ? 'Generando...' : 'Exportar Oficial (Excel)'}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Presentes', value: generalStats.presentes, pct: generalStats.pctPresentes, color: 'text-green-600 bg-green-50', icon: <TrendingUp className="w-4 h-4 text-green-600" /> },
          { label: 'Ausentes', value: generalStats.ausentes, pct: generalStats.pctAusentes, color: 'text-red-600 bg-red-50', icon: <TrendingDown className="w-4 h-4 text-red-600" /> },
          { label: 'Tardanzas', value: generalStats.tardanzas, pct: generalStats.total > 0 ? Math.round((generalStats.tardanzas / generalStats.total) * 100) : 0, color: 'text-amber-600 bg-amber-50', icon: <AlertTriangle className="w-4 h-4 text-amber-600" /> },
          { label: 'Justificados', value: generalStats.justificados, pct: generalStats.total > 0 ? Math.round((generalStats.justificados / generalStats.total) * 100) : 0, color: 'text-indigo-600 bg-indigo-50', icon: <Award className="w-4 h-4 text-indigo-600" /> },
        ].map(s => (
          <div key={s.label} className={`${s.color} rounded-xl p-4 border border-border`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium">{s.label}</span>
              {s.icon}
            </div>
            <p className="text-2xl font-bold">{s.value.toLocaleString()}</p>
            <p className="text-xs mt-1 opacity-70">{s.pct}% del total</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-xl w-fit">
        {(['general', 'alumnos', 'materias'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${activeTab === tab ? 'bg-card shadow-sm text-indigo-600' : 'text-muted-foreground hover:text-foreground'}`}>
            {tab === 'general' ? 'General' : tab === 'alumnos' ? 'Por Alumno' : 'Por Materia'}
          </button>
        ))}
      </div>

      {activeTab === 'general' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-card rounded-xl p-5 shadow-sm border border-border">
            <h3 className="font-semibold text-foreground mb-4">Tendencia Mensual (%)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={tendenciaMensual}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis domain={[50, 100]} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => [`${v}%`, 'Asistencia']} />
                <Line type="monotone" dataKey="Asistencia" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: '#6366f1', r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card rounded-xl p-5 shadow-sm border border-border">
            <h3 className="font-semibold text-foreground mb-4">Distribución de Estados</h3>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {pieData.map(d => (
                <div key={d.name} className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-muted-foreground">{d.name}: <strong>{d.value}</strong></span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 bg-card rounded-xl p-5 shadow-sm border border-border">
            <h3 className="font-semibold text-foreground mb-4">Asistencia por Materia (%)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={materiasReport}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="nombre" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`${v}%`, '% Asistencia']} />
                <Bar dataKey="pct" name="% Asistencia" radius={[4, 4, 0, 0]}>
                  {materiasReport.map((m, i) => <Cell key={i} fill={m.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'alumnos' && (
        <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-background border-b border-border">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Alumno</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">Curso</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-green-600 uppercase">Presentes</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-red-600 uppercase">Ausentes</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-amber-600 uppercase">Tardanzas</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">% Asistencia</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {alumnosReport.map(a => (
                <tr key={a.id} className="hover:bg-background/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700">
                        {a.nombre[0]}{a.apellido[0]}
                      </div>
                      <span className="text-sm font-medium text-foreground">{a.apellido}, {a.nombre}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">{a.curso}</span>
                  </td>
                  <td className="px-4 py-3 text-center text-sm font-semibold text-green-600">{a.presentes}</td>
                  <td className="px-4 py-3 text-center text-sm font-semibold text-red-600">{a.ausentes}</td>
                  <td className="px-4 py-3 text-center text-sm font-semibold text-amber-600">{a.tardanzas}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full ${a.pct >= 75 ? 'bg-green-500' : a.pct >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                          style={{ width: `${a.pct}%` }} />
                      </div>
                      <span className={`text-xs font-bold w-8 text-right ${a.pct >= 75 ? 'text-green-600' : a.pct >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                        {a.pct}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                      a.pct >= 75 ? 'bg-green-100 text-green-700' :
                      a.pct >= 60 ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {a.pct >= 75 ? 'Regular' : a.pct >= 60 ? 'En riesgo' : 'Crítico'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'materias' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {materiasReport.map(m => (
            <div key={m.id} className="bg-card rounded-xl p-5 shadow-sm border border-border">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${m.color}20` }}>
                  <span className="text-sm font-bold" style={{ color: m.color }}>{m.nombre[0]}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm">{m.nombre}</h3>
                  <p className="text-xs text-muted-foreground">{m.clases} clases dictadas</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">% Asistencia</span>
                    <span className="font-bold" style={{ color: m.color }}>{m.pct}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="h-2 rounded-full" style={{ width: `${m.pct}%`, backgroundColor: m.color }} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Presentes:</span>
                    <span className="font-semibold text-green-600">{m.presentes}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ausentes:</span>
                    <span className="font-semibold text-red-600">{m.total - m.presentes}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total reg:</span>
                    <span className="font-semibold">{m.total}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Reportes;
