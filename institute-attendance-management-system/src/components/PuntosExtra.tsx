import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Star, Save, Loader2, AlertCircle, CheckCircle2, Minus, Plus } from 'lucide-react';
import { obtenerNotasMateria, guardarNotasBatch } from '../services/notas';
import { RegistroNotasMateria } from '../types';

const PuntosExtra: React.FC = () => {
  const { materias, alumnos } = useApp();
  
  // Filtrar explícitamente materias para excluir 'Alumnos Personalizados'
  const modulosRegulares = useMemo(() => {
    return materias.filter(m => 
      !m.nombre.toLowerCase().includes('personalizado') && 
      !m.codigo.toLowerCase().includes('personalizado')
    );
  }, [materias]);

  const [selectedMateriaId, setSelectedMateriaId] = useState<string>(modulosRegulares[0]?.id || '');
  const [puntosLocales, setPuntosLocales] = useState<Record<string, number>>({});
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
    const fetchPuntos = async () => {
      if (!selectedMateriaId) return;
      setLoading(true);
      setAlertMsg(null);
      try {
        const data = await obtenerNotasMateria(selectedMateriaId);
        
        // Extraer únicamente los puntos extra de los registros de notas
        const puntosMap: Record<string, number> = {};
        alumnosDelModulo.forEach(alumno => {
          puntosMap[alumno.id] = data[alumno.id]?.puntosExtra || 0;
        });
        
        setPuntosLocales(puntosMap);
      } catch (error) {
        console.error("Error cargando puntos extra:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPuntos();
  }, [selectedMateriaId, alumnosDelModulo]);

  const handleUpdatePuntos = (alumnoId: string, delta: number) => {
    setPuntosLocales(prev => {
      const current = prev[alumnoId] || 0;
      const newValue = Math.max(0, current + delta); // Evitar negativos si se desea (o quitar Math.max si se permiten)
      return { ...prev, [alumnoId]: newValue };
    });
  };

  const handleInputChange = (alumnoId: string, val: string) => {
    const num = parseInt(val, 10);
    setPuntosLocales(prev => ({
      ...prev,
      [alumnoId]: isNaN(num) ? 0 : num
    }));
  };

  const handleGuardar = async () => {
    if (!selectedMateriaId) return;
    setSaving(true);
    setAlertMsg(null);
    try {
      // Reconstruir objeto RegistroNotasMateria solo con los puntosExtra para usar el guardado en lote seguro (merge)
      const batchData: RegistroNotasMateria = {};
      Object.entries(puntosLocales).forEach(([alumnoId, puntos]) => {
        // Al enviar null en las notas, podríamos sobreescribirlas si no tenemos cuidado, PERO
        // en types no son opcionales. Vamos a mandarlo como Partial pero tipado.
        // Cast a any para enviar solo el fragmento de actualización. Firebase docRef.set({ merge: true }) respetará.
        batchData[alumnoId] = { puntosExtra: puntos } as any; 
      });

      await guardarNotasBatch(selectedMateriaId, batchData);
      
      setAlertMsg({ text: 'Puntos guardados exitosamente en la nube.', type: 'success' });
      setTimeout(() => setAlertMsg(null), 3000);
    } catch (error) {
      setAlertMsg({ text: 'Error al intentar guardar los puntos.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-6 rounded-2xl border border-border shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center border border-amber-500/30">
            <Star className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Puntos Extra</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Asigna méritos de participación a tus alumnos.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none sm:min-w-[250px]">
            <select
              value={selectedMateriaId}
              onChange={(e) => setSelectedMateriaId(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500 appearance-none shadow-sm transition-all hover:bg-muted/30"
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
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/50 text-white rounded-xl font-medium transition-all shadow-md shadow-amber-500/20 active:scale-95 disabled:active:scale-100 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{saving ? 'Guardando...' : 'Guardar Puntos'}</span>
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

      {/* Table Section */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col min-h-[400px]">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
            <p className="text-muted-foreground font-medium animate-pulse">Cargando registros...</p>
          </div>
        ) : alumnosDelModulo.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 px-4 text-center border border-dashed border-border m-8 rounded-xl bg-muted/30">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Star className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Sin Alumnos</h3>
            <p className="text-muted-foreground max-w-sm mt-2">
              No hay alumnos activos matriculados en este módulo.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-semibold w-[60%]">Apellidos y Nombres</th>
                  <th className="px-6 py-4 font-semibold text-center w-[40%]">Puntos Extra</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {alumnosDelModulo.map(alumno => {
                  const puntos = puntosLocales[alumno.id] || 0;
                  
                  return (
                    <tr key={alumno.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 border border-primary/20">
                            <span className="text-sm font-bold text-primary">
                              {alumno.nombre.charAt(0)}{alumno.apellido.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-bold text-foreground text-base">{alumno.apellido}, {alumno.nombre}</p>
                            <p className="text-xs text-muted-foreground">DNI: {alumno.dni}</p>
                          </div>
                        </div>
                      </td>
                      
                      {/* Control de Puntos */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={() => handleUpdatePuntos(alumno.id, -1)}
                            disabled={saving}
                            className="w-10 h-10 rounded-full bg-muted/50 border border-border flex items-center justify-center text-muted-foreground hover:bg-red-500/20 hover:text-red-500 hover:border-red-500/30 transition-all active:scale-90 disabled:opacity-50"
                          >
                            <Minus className="w-5 h-5" />
                          </button>
                          
                          <div className="relative">
                            <input
                              type="text"
                              value={puntos}
                              onChange={(e) => handleInputChange(alumno.id, e.target.value)}
                              disabled={saving}
                              className={`w-16 text-center font-bold text-xl bg-transparent border-b-2 py-1 focus:outline-none transition-colors ${
                                puntos > 0 ? 'text-amber-500 border-amber-500' : 'text-foreground border-border'
                              }`}
                            />
                            {puntos > 0 && (
                              <Star className="w-3 h-3 text-amber-500 absolute -top-1 -right-3 animate-pulse fill-amber-500" />
                            )}
                          </div>

                          <button
                            onClick={() => handleUpdatePuntos(alumno.id, 1)}
                            disabled={saving}
                            className="w-10 h-10 rounded-full bg-muted/50 border border-border flex items-center justify-center text-muted-foreground hover:bg-emerald-500/20 hover:text-emerald-500 hover:border-emerald-500/30 transition-all active:scale-90 disabled:opacity-50"
                          >
                            <Plus className="w-5 h-5" />
                          </button>
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

export default PuntosExtra;
