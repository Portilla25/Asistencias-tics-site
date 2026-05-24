import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Edit3, Trash2, X, Check, BookOpen } from 'lucide-react';
import { Materia } from '../types';

const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6', '#f97316', '#84cc16'];

const GestionMaterias: React.FC = () => {
  const { materias, alumnos, asistencias, usuarios, addMateria, updateMateria, deleteMateria, currentUser } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const emptyForm = { nombre: '', codigo: '', docenteId: '', descripcion: '', color: colors[0] };
  const [form, setForm] = useState(emptyForm);

  const docentes = usuarios.filter(u => u.rol === 'docente');
  const misMaterias = currentUser?.rol === 'admin' ? materias : materias.filter(m => m.docenteId === currentUser?.id);

  const getMateriaStats = (materiaId: string) => {
    const asis = asistencias.filter(a => a.materiaId === materiaId);
    const alsMat = alumnos.filter(a => a.materias.includes(materiaId));
    const presentes = asis.filter(a => a.estado === 'presente').length;
    const pct = asis.length > 0 ? Math.round((presentes / asis.length) * 100) : 0;
    const clases = [...new Set(asis.map(a => a.fecha))].length;
    return { alumnos: alsMat.length, clases, pct };
  };

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (m: Materia) => {
    setForm({ nombre: m.nombre, codigo: m.codigo, docenteId: m.docenteId, descripcion: m.descripcion, color: m.color });
    setEditingId(m.id);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) updateMateria(editingId, form);
    else addMateria(form);
    setShowForm(false);
  };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500">{misMaterias.length} materias en total</div>
        {currentUser?.rol === 'admin' && (
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" />
            Nueva Materia
          </button>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {misMaterias.map(materia => {
          const stats = getMateriaStats(materia.id);
          const docente = usuarios.find(u => u.id === materia.docenteId);
          return (
            <div key={materia.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-2" style={{ backgroundColor: materia.color }} />
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${materia.color}20` }}>
                      <BookOpen className="w-5 h-5" style={{ color: materia.color }} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{materia.nombre}</h3>
                      <p className="text-xs text-gray-500 font-mono">{materia.codigo}</p>
                    </div>
                  </div>
                  {currentUser?.rol === 'admin' && (
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(materia)} className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      {deleteConfirm === materia.id ? (
                        <>
                          <button onClick={() => { deleteMateria(materia.id); setDeleteConfirm(null); }} className="p-1.5 text-white bg-red-500 rounded-lg hover:bg-red-600">
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setDeleteConfirm(null)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <button onClick={() => setDeleteConfirm(materia.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <p className="text-xs text-gray-500 mb-4 line-clamp-2">{materia.descripcion}</p>

                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="text-center p-2 bg-gray-50 rounded-lg">
                    <p className="text-base font-bold text-gray-900">{stats.alumnos}</p>
                    <p className="text-[10px] text-gray-500">Alumnos</p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded-lg">
                    <p className="text-base font-bold text-gray-900">{stats.clases}</p>
                    <p className="text-[10px] text-gray-500">Clases</p>
                  </div>
                  <div className="text-center p-2 rounded-lg" style={{ backgroundColor: `${materia.color}10` }}>
                    <p className="text-base font-bold" style={{ color: materia.color }}>{stats.pct}%</p>
                    <p className="text-[10px] text-gray-500">Asistencia</p>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full transition-all" style={{ width: `${stats.pct}%`, backgroundColor: materia.color }} />
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500">Docente</p>
                  <p className="text-sm font-medium text-gray-800">{docente ? `${docente.nombre} ${docente.apellido}` : 'Sin asignar'}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">{editingId ? 'Editar Materia' : 'Nueva Materia'}</h3>
              <button onClick={() => setShowForm(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                  <input required value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Matemáticas" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Código *</label>
                  <input required value={form.codigo} onChange={e => setForm(f => ({ ...f, codigo: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="MAT-101" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" rows={2} placeholder="Descripción de la materia..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Docente</label>
                <select value={form.docenteId} onChange={e => setForm(f => ({ ...f, docenteId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">-- Sin asignar --</option>
                  {docentes.map(d => <option key={d.id} value={d.id}>{d.nombre} {d.apellido}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                <div className="flex flex-wrap gap-2">
                  {colors.map(c => (
                    <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))}
                      className={`w-7 h-7 rounded-full transition-transform hover:scale-110 ${form.color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors">
                  {editingId ? 'Guardar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionMaterias;
