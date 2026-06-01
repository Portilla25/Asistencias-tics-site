import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { BookOpen, Save, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { obtenerNotasMateria, guardarNotasBatch } from '../services/notas';
import { RegistroNotasMateria, CalificacionData } from '../types';

const Notas: React.FC = () => {
  const { materias, alumnos } = useApp();
  
  // Filtrar explícitamente materias para excluir 'Alumnos Personalizados' si existe alguna con ese nombre/código
  const modulosRegulares = useMemo(() => {
    return materias.filter(m => 
      !m.nombre.toLowerCase().includes('personalizado') && 
      !m.codigo.toLowerCase().includes('personalizado')
    );
  }, [materias]);

  const [selectedMateriaId, setSelectedMateriaId] = useState<string>(modulosRegulares[0]?.id || '');
  const [notasLocales, setNotasLocales] = useState<RegistroNotasMateria>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [alertMsg, setAlertMsg] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

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
        
        // Inicializar los alumnos que no tengan registro previo
        const inicializadas: RegistroNotasMateria = { ...data };
        alumnosDelModulo.forEach(alumno => {
          if (!inicializadas[alumno.id]) {
            inicializadas[alumno.id] = { nota1: null, nota2: null, nota3: null, promedioFinal: null };
          }
        });
        
        setNotasLocales(inicializadas);
      } catch (error) {
        console.error("Error cargando notas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotas();
  }, [selectedMateriaId, alumnosDelModulo]);

  const calcularPromedio = (n1: number | null, n2: number | null, n3: number | null): number | null => {
    const validas = [n1, n2, n3].filter((n): n is number => n !== null);
    if (validas.length === 0) return null;
    const suma = validas.reduce((acc, curr) => acc + curr, 0);
    return Math.round(suma / validas.length);
  };

  const handleNotaChange = (alumnoId: string, campo: keyof CalificacionData, valorStr: string) => {
    setNotasLocales(prev => {
      const alumnoNotas = prev[alumnoId] || { nota1: null, nota2: null, nota3: null, promedioFinal: null };
      
      const valor = valorStr === '' ? null : Number(valorStr);
      
      // Actualizar el campo editado
      const nuevasNotas = { ...alumnoNotas, [campo]: valor };
      
      // Recalcular promedio dinámicamente
      nuevasNotas.promedioFinal = calcularPromedio(nuevasNotas.nota1, nuevasNotas.nota2, nuevasNotas.nota3);
      
      return { ...prev, [alumnoId]: nuevasNotas };
    });
  };

  const handleGuardar = async () => {
    if (!selectedMateriaId) return;
    setSaving(true);
    setAlertMsg(null);
    try {
      await guardarNotasBatch(selectedMateriaId, notasLocales);
      setAlertMsg({ text: 'Calificaciones guardadas exitosamente en la nube.', type: 'success' });
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setAlertMsg(null), 3000);
    } catch (error) {
      setAlertMsg({ text: 'Error al intentar guardar las calificaciones.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-6 rounded-2xl border border-border shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center border border-indigo-500/30">
            <BookOpen className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Calificaciones</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gestiona y promedia las notas de tus módulos.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none sm:min-w-[250px]">
            <select
              value={selectedMateriaId}
              onChange={(e) => setSelectedMateriaId(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none shadow-sm transition-all hover:bg-muted/30"
              disabled={loading || saving}
            >
              {modulosRegulares.length === 0 && <option value="">No hay módulos disponibles</option>}
              {modulosRegulares.map(m => (
                <option key={m.id} value={m.id}>
                  {m.nombre} ({m.codigo})
                </option>
              ))}
            </select>
          </div>
          
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

      {/* Alert Messages */}
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

      {/* Table Section (Glassmorphism) */}
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
            <h3 className="text-lg font-bold text-foreground">Sin Alumnos</h3>
            <p className="text-muted-foreground max-w-sm mt-2">
              No hay alumnos activos matriculados en este módulo para calificar.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-semibold">Alumno</th>
                  <th className="px-4 py-4 font-semibold text-center w-32">Nota 1</th>
                  <th className="px-4 py-4 font-semibold text-center w-32">Nota 2</th>
                  <th className="px-4 py-4 font-semibold text-center w-32">Nota 3</th>
                  <th className="px-6 py-4 font-semibold text-center w-36">Promedio Final</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {alumnosDelModulo.map(alumno => {
                  const notas = notasLocales[alumno.id] || { nota1: null, nota2: null, nota3: null, promedioFinal: null };
                  
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
                      
                      {/* Inputs de Notas */}
                      {(['nota1', 'nota2', 'nota3'] as const).map((campo) => (
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

                      {/* Promedio Final */}
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
