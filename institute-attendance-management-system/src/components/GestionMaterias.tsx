import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Edit3, Trash2, X, Check, BookOpen, Layers } from 'lucide-react';
import { Materia } from '../types';
import { createModuloForCareer } from '../services/legacyData';
import { getCursoGroups } from '../utils/cursoGroups';

const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6', '#f97316', '#84cc16'];

const CAREER_ICONS: Record<string, string> = {
  info_gastro: '🍽️',
  redes: '💻',
};

const GestionMaterias: React.FC = () => {
  const { materias, alumnos, asistencias, usuarios, addMateria, updateMateria, deleteMateria, currentUser } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const emptyForm = { nombre: '', codigo: '', docenteId: '', descripcion: '', color: colors[0] };
  const [form, setForm] = useState(emptyForm);

  const docentes = usuarios.filter(u => u.rol === 'docente');
  const misMaterias = currentUser?.rol === 'admin' ? materias : materias.filter(m => m.docenteId === currentUser?.id);

  const careerGroups = useMemo(() => getCursoGroups(misMaterias), [misMaterias]);

  const handleAddModuleToCourse = (cursoId: string) => {
    try {
      const newMateria = createModuloForCareer(cursoId);
      addMateria(newMateria);
    } catch (e) {
      console.error(e);
      alert("No se pudo añadir el módulo a este curso libre. Asegúrate de que sea una carrera predeterminada.");
    }
  };

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
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestión de Módulos</h1>
          <p className="text-sm text-muted-foreground mt-1">Organizados por Carrera / Curso</p>
        </div>
        {currentUser?.rol === 'admin' && (
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-sm font-semibold shadow-md transition-colors">
            <Plus className="w-5 h-5" />
            Nuevo Módulo
          </button>
        )}
      </div>

      {/* Grouped by Careers */}
      <div className="space-y-8">
        {careerGroups.map((group) => (
          <div key={group.id} className="bg-card/50 backdrop-blur-sm rounded-2xl p-6 border border-border shadow-sm">
            <div className="flex items-center gap-4 mb-6 border-b border-border pb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl shadow-sm">
                {CAREER_ICONS[group.id] || '📚'}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-foreground tracking-tight">{group.label}</h2>
                <p className="text-sm font-medium text-muted-foreground">{group.materias.length} módulos asignados a esta carrera</p>
              </div>
              {currentUser?.rol === 'admin' && (
                <button 
                  onClick={() => handleAddModuleToCourse(group.id)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium transition-colors"
                  title="Añade un nuevo módulo automáticamente a este curso"
                >
                  <Layers className="w-4 h-4" />
                  + Añadir Módulo
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {group.materias.map(materia => {
                const stats = getMateriaStats(materia.id);
                const docente = usuarios.find(u => u.id === materia.docenteId);
                return (
                  <div key={materia.id} className="bg-card rounded-xl shadow-sm border border-border overflow-hidden hover:shadow-md transition-all hover:-translate-y-1 group">
                    <div className="h-2" style={{ backgroundColor: materia.color }} />
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm" style={{ backgroundColor: `${materia.color}20` }}>
                            <BookOpen className="w-5 h-5" style={{ color: materia.color }} />
                          </div>
                          <div>
                            <h3 className="font-bold text-foreground text-sm line-clamp-1 group-hover:text-primary transition-colors">{materia.nombre}</h3>
                            <p className="text-[11px] font-semibold text-muted-foreground tracking-widest uppercase mt-0.5">{materia.codigo}</p>
                          </div>
                        </div>
                        {currentUser?.rol === 'admin' && (
                          <div className="flex gap-1">
                            <button onClick={() => openEdit(materia)} className="p-1.5 text-muted-foreground hover:text-amber-600 hover:bg-amber-500/10 rounded-lg transition-colors">
                              <Edit3 className="w-4 h-4" />
                            </button>
                            {deleteConfirm === materia.id ? (
                              <div className="flex items-center gap-1 bg-red-500/10 rounded-lg p-0.5">
                                <button onClick={() => { deleteMateria(materia.id); setDeleteConfirm(null); }} className="p-1 text-red-600 hover:bg-red-500/20 rounded-md">
                                  <Check className="w-4 h-4" />
                                </button>
                                <button onClick={() => setDeleteConfirm(null)} className="p-1 text-muted-foreground hover:bg-muted rounded-md">
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <button onClick={() => setDeleteConfirm(materia.id)} className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      <p className="text-[13px] text-muted-foreground mb-4 h-10 line-clamp-2 leading-relaxed">{materia.descripcion || 'Sin descripción'}</p>

                      <div className="grid grid-cols-3 gap-2 mb-4">
                        <div className="text-center p-2.5 bg-muted rounded-xl">
                          <p className="text-lg font-bold text-foreground leading-none mb-1">{stats.alumnos}</p>
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Alumnos</p>
                        </div>
                        <div className="text-center p-2.5 bg-muted rounded-xl">
                          <p className="text-lg font-bold text-foreground leading-none mb-1">{stats.clases}</p>
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Clases</p>
                        </div>
                        <div className="text-center p-2.5 rounded-xl border" style={{ backgroundColor: `${materia.color}10`, borderColor: `${materia.color}20` }}>
                          <p className="text-lg font-bold leading-none mb-1" style={{ color: materia.color }}>{stats.pct}%</p>
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Asistencia</p>
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                          <div className="h-1.5 rounded-full transition-all duration-1000 ease-out" style={{ width: `${stats.pct}%`, backgroundColor: materia.color }} />
                        </div>
                      </div>

                      <div className="pt-3 border-t border-border flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                          {docente ? `${docente.nombre[0]}${docente.apellido[0]}` : '?'}
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Docente Asignado</p>
                          <p className="text-xs font-medium text-foreground">{docente ? `${docente.nombre} ${docente.apellido}` : 'Sin asignar'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
              <h3 className="font-bold text-foreground text-lg">{editingId ? 'Editar Módulo' : 'Nuevo Módulo'}</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Nombre *</label>
                  <input required value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground transition-shadow" placeholder="Matemáticas" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Código *</label>
                  <input required value={form.codigo} onChange={e => setForm(f => ({ ...f, codigo: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground transition-shadow" placeholder="MAT-101" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Descripción</label>
                <textarea value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground resize-none transition-shadow" rows={2} placeholder="Descripción breve..." />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Docente Titular</label>
                <select value={form.docenteId} onChange={e => setForm(f => ({ ...f, docenteId: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground transition-shadow">
                  <option value="">-- Seleccionar Docente --</option>
                  {docentes.map(d => <option key={d.id} value={d.id}>{d.nombre} {d.apellido}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Color Distintivo</label>
                <div className="flex flex-wrap gap-2.5">
                  {colors.map(c => (
                    <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))}
                      className={`w-8 h-8 rounded-full transition-all hover:scale-110 shadow-sm ${form.color === c ? 'ring-2 ring-offset-2 ring-primary scale-110 ring-offset-card' : ''}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-4 border-t border-border">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2.5 border border-border text-muted-foreground font-semibold rounded-xl text-sm hover:bg-muted transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-sm font-semibold shadow-md transition-colors">
                  {editingId ? 'Guardar Cambios' : 'Crear Módulo'}
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
