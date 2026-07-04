import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Loader2,
  Minus,
  Plus,
  Save,
  Star,
} from 'lucide-react';
import { obtenerNotasMateria, guardarNotasBatch } from '../services/notas';
import { CalificacionData, RegistroNotasMateria } from '../types';
import { getCursoGroups } from '../utils/cursoGroups';

const EMPTY_NOTAS: CalificacionData = {
  nota1: null,
  nota2: null,
  nota3: null,
  promedioFinal: null,
  puntosExtra: 0,
};

const notaFields = ['nota1', 'nota2', 'nota3'] as const;
type NotaField = typeof notaFields[number];

const clampNumber = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const Notas: React.FC = () => {
  const { materias, alumnos, currentUser } = useApp();
  const misMaterias = currentUser?.rol === 'admin' ? materias : materias.filter(m => m.docenteId === currentUser?.id);

  const modulosRegulares = useMemo(() => {
    return misMaterias.filter(m =>
      !m.nombre.toLowerCase().includes('personalizado') &&
      !m.codigo.toLowerCase().includes('personalizado')
    );
  }, [misMaterias]);

  const cursoGroups = useMemo(() => getCursoGroups(modulosRegulares), [modulosRegulares]);
  const [selectedCursoId, setSelectedCursoId] = useState<string>('');
  const [selectedModuloId, setSelectedModuloId] = useState<string>('');
  const [notasLocales, setNotasLocales] = useState<RegistroNotasMateria>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [alertMsg, setAlertMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const selectedGroup = cursoGroups.find(g => g.id === selectedCursoId);
  const modulosDisponibles = selectedGroup && selectedGroup.materias.length > 1 ? selectedGroup.materias : [];

  const selectedMateriaId = useMemo(() => {
    if (selectedModuloId) return selectedModuloId;
    if (selectedGroup && selectedGroup.materias.length === 1) return selectedGroup.materias[0].id;
    return '';
  }, [selectedModuloId, selectedGroup]);

  const calcularPromedioBase = (n1: number | null, n2: number | null, n3: number | null): number | null => {
    const validas = [n1, n2, n3].filter((n): n is number => n !== null);
    if (validas.length === 0) return null;
    return Math.round(validas.reduce((acc, curr) => acc + curr, 0) / validas.length);
  };

  const calcularPromedioFinal = (
    n1: number | null,
    n2: number | null,
    n3: number | null,
    puntosExtra = 0
  ): number | null => {
    const promedioBase = calcularPromedioBase(n1, n2, n3);
    if (promedioBase === null) return null;
    return clampNumber(promedioBase + puntosExtra, 0, 20);
  };

  const parseNota = (valorStr: string): number | null => {
    if (valorStr === '') return null;
    const value = Number(valorStr);
    if (!Number.isFinite(value)) return null;
    return clampNumber(value, 0, 20);
  };

  const parsePuntosExtra = (valorStr: string): number => {
    const value = Number(valorStr);
    if (!Number.isFinite(value)) return 0;
    return clampNumber(Math.round(value), 0, 20);
  };

  const normalizeAlumnoNotas = (notas?: CalificacionData): CalificacionData => {
    const normalized = {
      ...EMPTY_NOTAS,
      ...notas,
      puntosExtra: notas?.puntosExtra ?? 0,
    };
    return {
      ...normalized,
      promedioFinal: calcularPromedioFinal(
        normalized.nota1,
        normalized.nota2,
        normalized.nota3,
        normalized.puntosExtra
      ),
    };
  };

  useEffect(() => {
    if (!selectedCursoId && cursoGroups.length > 0) {
      setSelectedCursoId(cursoGroups[0].id);
      if (cursoGroups[0].materias.length > 1) {
        setSelectedModuloId(cursoGroups[0].materias[0].id);
      }
    }
  }, [cursoGroups, selectedCursoId]);

  const alumnosDelModulo = useMemo(() => {
    if (!selectedMateriaId) return [];
    return alumnos
      .filter(a => a.materias.includes(selectedMateriaId) && a.estado !== 'retirado')
      .sort((a, b) => a.apellido.localeCompare(b.apellido));
  }, [alumnos, selectedMateriaId]);

  useEffect(() => {
    const fetchNotas = async () => {
      if (!selectedMateriaId) return;
      setLoading(true);
      setAlertMsg(null);
      try {
        const data = await obtenerNotasMateria(selectedMateriaId);
        const inicializadas: RegistroNotasMateria = { ...data };

        alumnosDelModulo.forEach(alumno => {
          inicializadas[alumno.id] = normalizeAlumnoNotas(inicializadas[alumno.id]);
        });

        setNotasLocales(inicializadas);
      } catch (error) {
        console.error('Error cargando notas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotas();
  }, [selectedMateriaId, alumnosDelModulo]);

  const updateAlumnoNotas = (alumnoId: string, patch: Partial<CalificacionData>) => {
    setNotasLocales(prev => {
      const current = normalizeAlumnoNotas(prev[alumnoId]);
      const next = {
        ...current,
        ...patch,
      };

      const normalized = {
        ...next,
        promedioFinal: calcularPromedioFinal(
          next.nota1,
          next.nota2,
          next.nota3,
          next.puntosExtra ?? 0
        ),
      };

      return { ...prev, [alumnoId]: normalized };
    });
  };

  const handleNotaChange = (alumnoId: string, campo: NotaField, valorStr: string) => {
    updateAlumnoNotas(alumnoId, { [campo]: parseNota(valorStr) });
  };

  const handlePuntosExtraChange = (alumnoId: string, value: number | string) => {
    const puntosExtra = typeof value === 'number'
      ? clampNumber(value, 0, 20)
      : parsePuntosExtra(value);
    updateAlumnoNotas(alumnoId, { puntosExtra });
  };

  const handleGuardar = async () => {
    if (!selectedMateriaId) return;
    setSaving(true);
    setAlertMsg(null);
    try {
      await guardarNotasBatch(selectedMateriaId, notasLocales);
      setAlertMsg({ text: 'Calificaciones y puntos extra guardados localmente. Se subiran a Firebase en la sincronizacion diaria.', type: 'success' });
      setTimeout(() => setAlertMsg(null), 3000);
    } catch {
      setAlertMsg({ text: 'Error al intentar guardar las calificaciones.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-6 rounded-2xl border border-border shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center border border-indigo-500/30">
            <BookOpen className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Calificaciones</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gestiona notas, puntos extra y promedio final de tus modulos.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none sm:min-w-[250px]">
            <select
              value={selectedCursoId}
              onChange={(e) => { setSelectedCursoId(e.target.value); setSelectedModuloId(''); }}
              className="w-full pl-4 pr-10 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none shadow-sm transition-all hover:bg-muted/30"
              disabled={loading || saving}
            >
              {cursoGroups.length === 0 && <option value="">No hay cursos disponibles</option>}
              {cursoGroups.map(g => (
                <option key={g.id} value={g.id}>{g.label}</option>
              ))}
            </select>
          </div>

          {modulosDisponibles.length > 0 && (
            <div className="relative flex-1 sm:flex-none sm:min-w-[150px]">
              <select
                value={selectedModuloId}
                onChange={(e) => setSelectedModuloId(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none shadow-sm transition-all hover:bg-muted/30"
                disabled={loading || saving}
              >
                {modulosDisponibles.map((m, i) => (
                  <option key={m.id} value={m.id}>Modulo {i + 1}</option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={handleGuardar}
            disabled={loading || saving || alumnosDelModulo.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 text-white rounded-xl font-medium transition-all shadow-md shadow-indigo-500/20 active:scale-95 disabled:active:scale-100 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{saving ? 'Guardando...' : 'Guardar'}</span>
          </button>
        </div>
      </div>

      {alertMsg && (
        <div className={`flex items-center gap-3 p-4 rounded-xl border ${
          alertMsg.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
            : 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'
        }`}>
          {alertMsg.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
          <p className="text-sm font-medium">{alertMsg.text}</p>
        </div>
      )}

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col min-h-[400px]">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            <p className="text-muted-foreground font-medium animate-pulse">Cargando registros...</p>
          </div>
        ) : alumnosDelModulo.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 px-4 text-center border border-dashed border-border m-8 rounded-xl bg-muted/30">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Sin alumnos</h3>
            <p className="text-muted-foreground max-w-sm mt-2">
              No hay alumnos activos matriculados en este modulo para calificar.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm text-left">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-semibold">Alumno</th>
                  <th className="px-4 py-4 font-semibold text-center w-32">Nota 1</th>
                  <th className="px-4 py-4 font-semibold text-center w-32">Nota 2</th>
                  <th className="px-4 py-4 font-semibold text-center w-32">Nota 3</th>
                  <th className="px-4 py-4 font-semibold text-center w-44">Puntos extra</th>
                  <th className="px-6 py-4 font-semibold text-center w-36">Promedio final</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {alumnosDelModulo.map(alumno => {
                  const notas = normalizeAlumnoNotas(notasLocales[alumno.id]);
                  const puntosExtra = notas.puntosExtra ?? 0;
                  const promedioBase = calcularPromedioBase(notas.nota1, notas.nota2, notas.nota3);

                  return (
                    <tr key={alumno.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 border border-primary/20">
                            <span className="text-xs font-bold text-primary">
                              {alumno.nombre.charAt(0)}{alumno.apellido.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{alumno.apellido}, {alumno.nombre}</p>
                            <p className="text-xs text-muted-foreground">{alumno.dni}</p>
                          </div>
                        </div>
                      </td>

                      {notaFields.map((campo) => (
                        <td key={campo} className="px-4 py-4">
                          <input
                            type="number"
                            min="0"
                            max="20"
                            value={notas[campo] === null ? '' : notas[campo]}
                            onChange={(e) => handleNotaChange(alumno.id, campo, e.target.value)}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-center font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all disabled:opacity-50 group-hover:bg-card"
                            placeholder="-"
                            disabled={saving}
                          />
                        </td>
                      ))}

                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handlePuntosExtraChange(alumno.id, puntosExtra - 1)}
                            disabled={saving || puntosExtra <= 0}
                            className="w-8 h-8 rounded-lg border border-border bg-background text-muted-foreground hover:bg-red-500/10 hover:text-red-500 disabled:opacity-40 disabled:hover:bg-background disabled:hover:text-muted-foreground transition-colors flex items-center justify-center"
                            title="Quitar punto extra"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <div className="relative w-16">
                            <input
                              type="number"
                              min="0"
                              max="20"
                              value={puntosExtra}
                              onChange={(e) => handlePuntosExtraChange(alumno.id, e.target.value)}
                              className={`w-full px-2 py-2 bg-background border rounded-lg text-center font-mono text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all disabled:opacity-50 ${
                                puntosExtra > 0 ? 'border-amber-500 text-amber-500' : 'border-border text-foreground'
                              }`}
                              disabled={saving}
                            />
                            {puntosExtra > 0 && (
                              <Star className="w-3 h-3 text-amber-500 fill-amber-500 absolute -top-1 -right-1" />
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handlePuntosExtraChange(alumno.id, puntosExtra + 1)}
                            disabled={saving || puntosExtra >= 20}
                            className="w-8 h-8 rounded-lg border border-border bg-background text-muted-foreground hover:bg-emerald-500/10 hover:text-emerald-500 disabled:opacity-40 disabled:hover:bg-background disabled:hover:text-muted-foreground transition-colors flex items-center justify-center"
                            title="Agregar punto extra"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        {promedioBase !== null && puntosExtra > 0 && (
                          <p className="mt-1 text-center text-[11px] text-muted-foreground">
                            Base {promedioBase} + {puntosExtra}
                          </p>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <div className={`flex items-center justify-center px-3 py-2 rounded-lg font-mono text-base font-bold transition-all border ${
                          notas.promedioFinal === null
                            ? 'bg-muted border-border text-muted-foreground'
                            : notas.promedioFinal >= 13
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                              : 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'
                        }`}>
                          {notas.promedioFinal === null ? '--' : notas.promedioFinal.toString().padStart(2, '0')}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notas;
