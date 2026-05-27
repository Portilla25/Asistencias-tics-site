import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Search, Edit3, Trash2, X, Check, Users, Eye, ChevronDown, ChevronUp, UserMinus, UserPlus } from 'lucide-react';
import { Alumno } from '../types';

const GestionAlumnos: React.FC = () => {
  const { alumnos, materias, asistencias, addAlumno, updateAlumno, deleteAlumno } = useApp();
  const [search, setSearch] = useState('');
  const [cursoFilter, setCursoFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'apellido' | 'curso'>('apellido');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const emptyForm = { nombre: '', apellido: '', email: '', dni: '', curso: '3°A', materias: [] as string[] };
  const [form, setForm] = useState(emptyForm);

  const cursos = [...new Set(alumnos.map(a => a.curso))].sort();

  const filtered = alumnos
    .filter(a => {
      const q = search.toLowerCase();
      const matchSearch = `${a.nombre} ${a.apellido} ${a.email} ${a.dni}`.toLowerCase().includes(q);
      const matchCurso = cursoFilter ? a.curso === cursoFilter : true;
      return matchSearch && matchCurso;
    })
    .sort((a, b) => {
      const aRetirado = a.estado === 'retirado';
      const bRetirado = b.estado === 'retirado';
      if (aRetirado && !bRetirado) return 1;
      if (!aRetirado && bRetirado) return -1;
      const aVal = sortField === 'apellido' ? a.apellido : a.curso;
      const bVal = sortField === 'apellido' ? b.apellido : b.curso;
      return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });

  const toggleRetirado = (alumno: Alumno) => {
    updateAlumno(alumno.id, { estado: alumno.estado === 'retirado' ? 'activo' : 'retirado' });
  };

  const getAlumnoStats = (alumnoId: string) => {
    const asis = asistencias.filter(a => a.alumnoId === alumnoId);
    const presentes = asis.filter(a => a.estado === 'presente').length;
    const ausentes = asis.filter(a => a.estado === 'ausente').length;
    const tardanzas = asis.filter(a => a.estado === 'tardanza').length;
    const pct = asis.length > 0 ? Math.round((presentes / asis.length) * 100) : 0;
    return { total: asis.length, presentes, ausentes, tardanzas, pct };
  };

  const handleSort = (field: 'apellido' | 'curso') => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (alumno: Alumno) => {
    setForm({ nombre: alumno.nombre, apellido: alumno.apellido, email: alumno.email, dni: alumno.dni, curso: alumno.curso, materias: alumno.materias });
    setEditingId(alumno.id);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateAlumno(editingId, form);
    } else {
      addAlumno(form);
    }
    setShowForm(false);
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    deleteAlumno(id);
    setDeleteConfirm(null);
  };

  const SortIcon = ({ field }: { field: 'apellido' | 'curso' }) => (
    sortField === field
      ? (sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)
      : <ChevronDown className="w-3 h-3 opacity-30" />
  );

  const viewingAlumno = viewingId ? alumnos.find(a => a.id === viewingId) : null;

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3 flex-1 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar alumno..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <select
            value={cursoFilter}
            onChange={e => setCursoFilter(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Todos los cursos</option>
            {cursos.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Nuevo Alumno
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card rounded-xl p-3 border border-border text-center shadow-sm">
          <p className="text-2xl font-bold text-indigo-600">{alumnos.length}</p>
          <p className="text-xs text-muted-foreground">Total alumnos</p>
        </div>
        <div className="bg-card rounded-xl p-3 border border-border text-center shadow-sm">
          <p className="text-2xl font-bold text-indigo-600">{cursos.length}</p>
          <p className="text-xs text-muted-foreground">Cursos</p>
        </div>
        <div className="bg-card rounded-xl p-3 border border-border text-center shadow-sm">
          <p className="text-2xl font-bold text-indigo-600">{filtered.length}</p>
          <p className="text-xs text-muted-foreground">Mostrando</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-background border-b border-border">
                <th className="px-4 py-3 text-left">
                  <button onClick={() => handleSort('apellido')} className="flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Alumno <SortIcon field="apellido" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">DNI</th>
                <th className="px-4 py-3 text-left">
                  <button onClick={() => handleSort('curso')} className="flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Curso <SortIcon field="curso" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Asistencia</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Materias</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(alumno => {
                const stats = getAlumnoStats(alumno.id);
                const enRiesgo = stats.pct < 75 && stats.total > 0;
                return (
                  <tr key={alumno.id} className={`transition-colors ${alumno.estado === 'retirado' ? 'bg-gray-50/80 opacity-75' : 'hover:bg-background/50'}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${alumno.estado === 'retirado' ? 'bg-gray-200 text-gray-500' : 'bg-indigo-100 text-indigo-700'}`}>
                          {alumno.nombre[0]}{alumno.apellido[0]}
                        </div>
                        <div>
                          <p className={`text-sm font-medium ${alumno.estado === 'retirado' ? 'text-gray-500 line-through decoration-gray-400' : 'text-foreground'}`}>
                            {alumno.apellido}, {alumno.nombre}
                          </p>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-muted-foreground">{alumno.email}</p>
                            {alumno.estado === 'retirado' && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">RETIRADO</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{alumno.dni}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">{alumno.curso}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${enRiesgo ? 'bg-red-500' : 'bg-green-500'}`}
                            style={{ width: `${stats.pct}%` }}
                          />
                        </div>
                        <span className={`text-xs font-semibold ${enRiesgo ? 'text-red-600' : 'text-green-600'}`}>
                          {stats.pct}%
                        </span>
                        {enRiesgo && <span className="text-xs text-red-500 font-medium">⚠</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-muted-foreground">{alumno.materias.length} materias</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setViewingId(alumno.id)} className="p-1.5 text-muted-foreground hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Ver detalles">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => openEdit(alumno)} className="p-1.5 text-muted-foreground hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Editar">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {deleteConfirm === alumno.id ? (
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleDelete(alumno.id)} className="p-1.5 text-white bg-red-500 rounded-lg hover:bg-red-600" title="Confirmar eliminación permanente">
                              <Check className="w-4 h-4" />
                            </button>
                            <button onClick={() => setDeleteConfirm(null)} className="p-1.5 text-muted-foreground hover:bg-muted rounded-lg" title="Cancelar">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <>
                            {alumno.estado === 'retirado' ? (
                              <button onClick={() => toggleRetirado(alumno)} className="p-1.5 text-muted-foreground hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Restaurar alumno">
                                <UserPlus className="w-4 h-4" />
                              </button>
                            ) : (
                              <button onClick={() => toggleRetirado(alumno)} className="p-1.5 text-muted-foreground hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors" title="Retirar alumno">
                                <UserMinus className="w-4 h-4" />
                              </button>
                            )}
                            <button onClick={() => setDeleteConfirm(alumno.id)} className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar permanentemente">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">No se encontraron alumnos</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="font-bold text-foreground">{editingId ? 'Editar Alumno' : 'Nuevo Alumno'}</h3>
              <button onClick={() => setShowForm(false)} className="p-1 text-muted-foreground hover:text-muted-foreground rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Nombre *</label>
                  <input required value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Nombre" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Apellido *</label>
                  <input required value={form.apellido} onChange={e => setForm(f => ({ ...f, apellido: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Apellido" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Email *</label>
                <input required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="email@instituto.edu" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">DNI *</label>
                  <input required value={form.dni} onChange={e => setForm(f => ({ ...f, dni: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="42123456" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Curso *</label>
                  <select value={form.curso} onChange={e => setForm(f => ({ ...f, curso: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    {['3°A', '3°B', '4°A', '4°B', '5°A', '5°B'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Materias</label>
                <div className="grid grid-cols-2 gap-2">
                  {materias.map(m => (
                    <label key={m.id} className="flex items-center gap-2 p-2 border border-border rounded-lg cursor-pointer hover:bg-background">
                      <input
                        type="checkbox"
                        checked={form.materias.includes(m.id)}
                        onChange={e => setForm(f => ({
                          ...f,
                          materias: e.target.checked ? [...f.materias, m.id] : f.materias.filter(id => id !== m.id)
                        }))}
                        className="accent-indigo-600"
                      />
                      <span className="text-xs text-foreground">{m.nombre}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 border border-border text-foreground rounded-lg text-sm hover:bg-background transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors">
                  {editingId ? 'Guardar Cambios' : 'Crear Alumno'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ver detalle */}
      {viewingAlumno && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="font-bold text-foreground">Perfil del Alumno</h3>
              <button onClick={() => setViewingId(null)} className="p-1 text-muted-foreground hover:text-muted-foreground rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              {(() => {
                const stats = getAlumnoStats(viewingAlumno.id);
                const asisAlumno = asistencias.filter(a => a.alumnoId === viewingAlumno.id);
                const justificados = asisAlumno.filter(a => a.estado === 'justificado').length;
                return (
                  <>
                    <div className="flex items-center gap-4 mb-5">
                      <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-700 text-2xl font-bold">
                        {viewingAlumno.nombre[0]}{viewingAlumno.apellido[0]}
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-foreground">{viewingAlumno.nombre} {viewingAlumno.apellido}</h4>
                        <p className="text-muted-foreground text-sm">{viewingAlumno.email}</p>
                        <div className="flex gap-2 mt-1">
                          <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">{viewingAlumno.curso}</span>
                          <span className="px-2 py-0.5 bg-muted text-muted-foreground text-xs font-semibold rounded-full">DNI: {viewingAlumno.dni}</span>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-3 mb-4">
                      <div className="text-center p-2 bg-green-50 rounded-lg">
                        <p className="text-lg font-bold text-green-600">{stats.presentes}</p>
                        <p className="text-xs text-muted-foreground">Presentes</p>
                      </div>
                      <div className="text-center p-2 bg-red-50 rounded-lg">
                        <p className="text-lg font-bold text-red-600">{stats.ausentes}</p>
                        <p className="text-xs text-muted-foreground">Ausentes</p>
                      </div>
                      <div className="text-center p-2 bg-amber-50 rounded-lg">
                        <p className="text-lg font-bold text-amber-600">{stats.tardanzas}</p>
                        <p className="text-xs text-muted-foreground">Tardanzas</p>
                      </div>
                      <div className="text-center p-2 bg-indigo-50 rounded-lg">
                        <p className="text-lg font-bold text-indigo-600">{justificados}</p>
                        <p className="text-xs text-muted-foreground">Justif.</p>
                      </div>
                    </div>
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-foreground">% Asistencia Global</span>
                        <span className={`text-sm font-bold ${stats.pct < 75 ? 'text-red-600' : 'text-green-600'}`}>{stats.pct}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className={`h-2.5 rounded-full ${stats.pct < 75 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${stats.pct}%` }} />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground mb-2">Materias inscriptas</p>
                      <div className="flex flex-wrap gap-2">
                        {viewingAlumno.materias.map(mId => {
                          const m = materias.find(mat => mat.id === mId);
                          return m ? (
                            <span key={mId} className="px-2 py-1 text-xs font-medium rounded-full text-white" style={{ backgroundColor: m.color }}>
                              {m.nombre}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionAlumnos;
