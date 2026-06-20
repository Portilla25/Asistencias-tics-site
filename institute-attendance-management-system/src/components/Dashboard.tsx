import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { getCursoGroups } from '../utils/cursoGroups';
import { Users, BookOpen, CheckCircle, XCircle, Clock, TrendingUp, AlertTriangle, Award } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';

const Dashboard: React.FC = () => {
  const { alumnos, materias, asistencias, currentUser, setActiveSection } = useApp();

  const stats = useMemo(() => {
    const totalAsistencias = asistencias.length;
    const presentes = asistencias.filter(a => a.estado === 'presente').length;
    const ausentes = asistencias.filter(a => a.estado === 'ausente').length;
    const tardanzas = asistencias.filter(a => a.estado === 'tardanza').length;
    const justificados = asistencias.filter(a => a.estado === 'justificado').length;
    const porcentajeAsistencia = totalAsistencias > 0 ? Math.round((presentes / totalAsistencias) * 100) : 0;
    return { totalAsistencias, presentes, ausentes, tardanzas, justificados, porcentajeAsistencia };
  }, [asistencias]);

  const asistenciasPorCurso = useMemo(() => {
    const grupos = getCursoGroups(materias);
    return grupos.map(g => {
      const materiaIds = g.materias.map(m => m.id);
      const asis = asistencias.filter(a => materiaIds.includes(a.materiaId));
      const presentes = asis.filter(a => a.estado === 'presente').length;
      const total = asis.length;
      return {
        name: g.label.length > 15 ? g.label.substring(0, 15) + '...' : g.label,
        originalName: g.label,
        Presentes: presentes,
        Ausentes: asis.filter(a => a.estado === 'ausente').length,
        Tardanzas: asis.filter(a => a.estado === 'tardanza').length,
        porcentaje: total > 0 ? Math.round((presentes / total) * 100) : 0,
      };
    });
  }, [materias, asistencias]);

  const pieData = [
    { name: 'Presentes', value: stats.presentes, color: '#10b981' },
    { name: 'Ausentes', value: stats.ausentes, color: '#ef4444' },
    { name: 'Tardanzas', value: stats.tardanzas, color: '#f59e0b' },
    { name: 'Justificados', value: stats.justificados, color: '#6366f1' },
  ];

  const tendencia = useMemo(() => {
    const meses = ['Mar', 'Abr', 'May', 'Jun'];
    const mesMap: Record<string, string> = { '03': 'Mar', '04': 'Abr', '05': 'May', '06': 'Jun' };
    const data: Record<string, { total: number; presentes: number }> = {};
    meses.forEach(m => { data[m] = { total: 0, presentes: 0 }; });
    asistencias.forEach(a => {
      const mes = mesMap[a.fecha.split('-')[1]];
      if (mes) {
        data[mes].total++;
        if (a.estado === 'presente') data[mes].presentes++;
      }
    });
    return meses.map(m => ({
      mes: m,
      Asistencia: data[m].total > 0 ? Math.round((data[m].presentes / data[m].total) * 100) : 0,
    }));
  }, [asistencias]);

  const alumnosEnRiesgo = useMemo(() => {
    return alumnos.map(a => {
      const asis = asistencias.filter(as => as.alumnoId === a.id);
      const ausencias = asis.filter(as => as.estado === 'ausente').length;
      const porcentaje = asis.length > 0 ? Math.round((ausencias / asis.length) * 100) : 0;
      return { ...a, ausencias, porcentaje };
    }).filter(a => a.porcentaje >= 20).sort((a, b) => b.porcentaje - a.porcentaje).slice(0, 5);
  }, [alumnos, asistencias]);

  const StatCard = ({ title, value, icon, color, subtitle }: { title: string; value: string | number; icon: React.ReactNode; color: string; subtitle?: string }) => (
    <div className="bg-card rounded-xl p-5 shadow-sm border border-border">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
    </div>
  );

  // Docente dashboard
  if (currentUser?.rol === 'docente') {
    const misAsistencias = asistencias.filter(a => a.registradoPor === currentUser.id);
    const misMaterias = materias.filter(m => m.docenteId === currentUser.id);
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Mis Materias" value={misMaterias.length} icon={<BookOpen className="w-5 h-5 text-purple-600" />} color="bg-purple-100" />
          <StatCard title="Total Alumnos" value={alumnos.length} icon={<Users className="w-5 h-5 text-blue-600" />} color="bg-blue-100" />
          <StatCard title="Clases Registradas" value={misAsistencias.filter((a, i, arr) => arr.findIndex(b => b.materiaId === a.materiaId && b.fecha === a.fecha) === i).length} icon={<CheckCircle className="w-5 h-5 text-green-600" />} color="bg-green-100" />
          <StatCard title="% Asistencia" value={`${stats.porcentajeAsistencia}%`} icon={<TrendingUp className="w-5 h-5 text-indigo-600" />} color="bg-indigo-100" subtitle="Promedio general" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-xl p-5 shadow-sm border border-border lg:col-span-2">
            <h3 className="font-semibold text-foreground mb-4">Asistencia por Curso</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={asistenciasPorCurso.filter(c => getCursoGroups(misMaterias).some(g => g.label === c.originalName))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="Presentes" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Ausentes" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card rounded-xl p-5 shadow-sm border border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Alumnos en Riesgo</h3>
              <span className="text-xs text-muted-foreground">+20% inasistencias</span>
            </div>
            {alumnosEnRiesgo.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Award className="w-10 h-10 mx-auto mb-2 text-green-400" />
                <p className="text-sm">¡Excelente! Ningún alumno en riesgo</p>
              </div>
            ) : (
              <div className="space-y-2">
                {alumnosEnRiesgo.map(a => (
                  <div key={a.id} className="flex items-center justify-between p-2.5 bg-red-50 rounded-lg border border-red-100">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-red-200 flex items-center justify-center text-red-700 text-xs font-bold">
                        {a.nombre[0]}{a.apellido[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{a.nombre} {a.apellido}</p>
                        <p className="text-xs text-muted-foreground">{a.curso}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-red-600">{a.porcentaje}%</p>
                      <p className="text-xs text-muted-foreground">{a.ausencias} ausencias</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-card rounded-xl p-5 shadow-sm border border-border">
          <h3 className="font-semibold text-foreground mb-4">Tendencia de Asistencia (%)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={tendencia}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => `${v}%`} />
              <Line type="monotone" dataKey="Asistencia" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  // Admin dashboard
  return (
    <div className="p-6 space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Alumnos" value={alumnos.length} icon={<Users className="w-5 h-5 text-blue-600" />} color="bg-blue-100" subtitle={`${alumnos.length} matriculados`} />
        <StatCard title="Cursos Activos" value={getCursoGroups(materias).length} icon={<BookOpen className="w-5 h-5 text-indigo-600" />} color="bg-indigo-100" />
        <StatCard title="% Asistencia" value={`${stats.porcentajeAsistencia}%`} icon={<TrendingUp className="w-5 h-5 text-green-600" />} color="bg-green-100" subtitle="Promedio general" />
        <StatCard title="Alertas" value={alumnosEnRiesgo.length} icon={<AlertTriangle className="w-5 h-5 text-red-600" />} color="bg-red-100" subtitle="Alumnos en riesgo" />
      </div>

      {/* Second row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Presentes" value={stats.presentes.toLocaleString()} icon={<CheckCircle className="w-5 h-5 text-green-600" />} color="bg-green-100" />
        <StatCard title="Ausentes" value={stats.ausentes.toLocaleString()} icon={<XCircle className="w-5 h-5 text-red-600" />} color="bg-red-100" />
        <StatCard title="Tardanzas" value={stats.tardanzas.toLocaleString()} icon={<Clock className="w-5 h-5 text-amber-600" />} color="bg-amber-100" />
        <StatCard title="Justificados" value={stats.justificados.toLocaleString()} icon={<CheckCircle className="w-5 h-5 text-indigo-600" />} color="bg-indigo-100" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card rounded-xl p-5 shadow-sm border border-border">
          <h3 className="font-semibold text-foreground mb-4">Asistencia por Curso</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={asistenciasPorCurso}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="Presentes" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Ausentes" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Tardanzas" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-xl p-5 shadow-sm border border-border">
          <h3 className="font-semibold text-foreground mb-4">Distribución General</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(v) => [(v as number).toLocaleString(), '']} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {pieData.map(d => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-muted-foreground">{d.name}</span>
                </div>
                <span className="font-semibold text-foreground">{d.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tendencia */}
        <div className="bg-card rounded-xl p-5 shadow-sm border border-border">
          <h3 className="font-semibold text-foreground mb-4">Tendencia de Asistencia (%)</h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={tendencia}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
              <YAxis domain={[60, 100]} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => `${v}%`} />
              <Line type="monotone" dataKey="Asistencia" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Alumnos en riesgo */}
        <div className="bg-card rounded-xl p-5 shadow-sm border border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Alumnos en Riesgo</h3>
            <button onClick={() => setActiveSection('alumnos')} className="text-xs text-indigo-600 hover:underline">Ver todos</button>
          </div>
          <div className="space-y-2">
            {alumnosEnRiesgo.map(a => (
              <div key={a.id} className="flex items-center justify-between p-2.5 bg-red-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-red-200 flex items-center justify-center text-red-700 text-xs font-bold">
                    {a.nombre[0]}{a.apellido[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{a.nombre} {a.apellido}</p>
                    <p className="text-xs text-muted-foreground">{a.curso}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-gray-200 rounded-full h-1.5">
                    <div className="bg-red-500 h-1.5 rounded-full" style={{ width: `${a.porcentaje}%` }} />
                  </div>
                  <span className="text-sm font-bold text-red-600 w-10 text-right">{a.porcentaje}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
