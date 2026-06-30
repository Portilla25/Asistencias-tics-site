import React, { useState, useEffect, useCallback } from 'react';
import { BarChart3, Users, AlertTriangle, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { formatDateTimeInPeru, PERU_TIME_ZONE } from '../utils/dateUtils';

interface MigrationReport {
  fecha: string;
  totalOriginal: number;
  totalValidos: number;
  totalDistribuido: number;
  retirados: number;
  corruptos: number;
  duplicadosIgnorados: number;
  faltantes: number;
  detalle: Record<string, number>;
}

interface RetiradoAlumno {
  id: string | number;
  nombre: string;
  status: string;
  _etiqueta?: string;
  _razon?: string;
}

interface LegacyModule {
  alumnos?: RetiradoAlumno[];
  [key: string]: unknown;
}

const MODULOS_INFO: Record<string, { turno: string; hora: string; label: string }> = {
  redes_S_M1: { turno: 'Mañana', hora: '09:00 - 13:00', label: 'Módulo 1' },
  redes_S_M2: { turno: 'Mañana', hora: '09:00 - 13:00', label: 'Módulo 2' },
  redes_S_M3: { turno: 'Mañana', hora: '09:00 - 13:00', label: 'Módulo 3' },
  redes_S_M4: { turno: 'Mañana', hora: '09:00 - 13:00', label: 'Módulo 4' },
  redes_S_T1: { turno: 'Tarde', hora: '14:00 - 18:00', label: 'Módulo 1' },
  redes_S_T2: { turno: 'Tarde', hora: '14:00 - 18:00', label: 'Módulo 2' },
  redes_S_T3: { turno: 'Tarde', hora: '14:00 - 18:00', label: 'Módulo 3' },
  redes_S_T4: { turno: 'Tarde', hora: '14:00 - 18:00', label: 'Módulo 4' },
};

const STATUS_OPTIONS = [
  { value: 'activo', label: 'Activo', color: 'bg-green-100 text-green-800' },
  { value: 'inactivo', label: 'Inactivo', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'retirado', label: 'Retirado', color: 'bg-red-100 text-red-800' },
  { value: 'corrupto', label: 'Corrupto', color: 'bg-muted text-foreground' },
];

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: number; color: string }> = ({
  icon, label, value, color,
}) => (
  <div className={`rounded-xl border p-4 ${color}`}>
    <div className="flex items-center gap-3">
      <div className="flex-shrink-0">{icon}</div>
      <div>
        <p className="text-2xl font-bold font-mono">{value}</p>
        <p className="text-xs font-medium opacity-75 uppercase tracking-wide">{label}</p>
      </div>
    </div>
  </div>
);

const ReporteRedes: React.FC = () => {
  const [report, setReport] = useState<MigrationReport | null>(null);
  const [retirados, setRetirados] = useState<RetiradoAlumno[]>([]);
  const [moduleCounts, setModuleCounts] = useState<Record<string, number>>({});
  const [lastUpdate, setLastUpdate] = useState<string>('');

  const loadData = useCallback(() => {
    // Load migration report
    try {
      const raw = localStorage.getItem('reporteComparativoRedes');
      if (raw) setReport(JSON.parse(raw));
    } catch { /* ignore */ }

    // Load module data from asist_state
    try {
      const state = JSON.parse(localStorage.getItem('asist_state') || '{}') as Record<string, LegacyModule>;
      const counts: Record<string, number> = {};
      Object.keys(MODULOS_INFO).forEach((id) => {
        counts[id] = state[id]?.alumnos?.length || 0;
      });
      setModuleCounts(counts);

      // Load retirados
      const retModule = state['redes_retirados'];
      if (retModule?.alumnos) {
        setRetirados([...retModule.alumnos]);
      }
    } catch { /* ignore */ }

    setLastUpdate(new Date().toLocaleTimeString('es-PE', { timeZone: PERU_TIME_ZONE }));
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStatusChange = (index: number, newStatus: string) => {
    try {
      const state = JSON.parse(localStorage.getItem('asist_state') || '{}');
      if (state['redes_retirados']?.alumnos?.[index]) {
        state['redes_retirados'].alumnos[index].status = newStatus;
        localStorage.setItem('asist_state', JSON.stringify(state));

        // Update local state
        setRetirados((prev) => {
          const updated = [...prev];
          if (updated[index]) updated[index] = { ...updated[index], status: newStatus };
          return updated;
        });

        // Log the change
        const changeLog = JSON.parse(localStorage.getItem('redes_changelog') || '[]');
        changeLog.push({
          fecha: new Date().toISOString(),
          alumno: state['redes_retirados'].alumnos[index].nombre,
          cambio: `Estado cambiado a: ${newStatus}`,
        });
        localStorage.setItem('redes_changelog', JSON.stringify(changeLog));
      }
    } catch (e) {
      console.error('[REDES_MIGRACION] Error al cambiar estado:', e);
    }
  };

  const totalModulos = Object.values(moduleCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <BarChart3 className="w-7 h-7 text-rose-600" />
            Reporte de Migración — Redes & TICs
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sábados · Turnos Mañana (09:00-13:00) y Tarde (14:00-18:00)
          </p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-background transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Users className="w-5 h-5 text-blue-600" />}
          label="Total Original"
          value={report?.totalOriginal || 0}
          color="bg-blue-50 border-blue-200"
        />
        <StatCard
          icon={<CheckCircle2 className="w-5 h-5 text-green-600" />}
          label="Válidos / Distribuidos"
          value={report?.totalDistribuido || totalModulos}
          color="bg-green-50 border-green-200"
        />
        <StatCard
          icon={<AlertTriangle className="w-5 h-5 text-amber-600" />}
          label="Retirados"
          value={report?.retirados || retirados.filter((r) => r.status === 'retirado').length}
          color="bg-amber-50 border-amber-200"
        />
        <StatCard
          icon={<XCircle className="w-5 h-5 text-red-600" />}
          label="Corruptos / Duplicados"
          value={(report?.corruptos || 0) + (report?.duplicadosIgnorados || 0)}
          color="bg-red-50 border-red-200"
        />
      </div>

      {/* Migration date */}
      {report?.fecha && (
        <div className="text-xs text-muted-foreground font-mono">
          Migración ejecutada: {formatDateTimeInPeru(report.fecha)} • Última carga: {lastUpdate}
        </div>
      )}

      {/* Distribution Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-border bg-background">
          <h2 className="font-bold text-foreground flex items-center gap-2">
            📦 Distribución por módulo
          </h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-background text-left">
              <th className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Módulo</th>
              <th className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Turno</th>
              <th className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Horario</th>
              <th className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Alumnos</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {Object.entries(MODULOS_INFO).map(([id, info]) => (
              <tr key={id} className="hover:bg-background transition-colors">
                <td className="px-5 py-3">
                  <span className="font-mono text-sm font-medium text-foreground">{id}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{info.label}</span>
                </td>
                <td className="px-5 py-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    info.turno === 'Mañana' ? 'bg-yellow-100 text-yellow-800' : 'bg-indigo-100 text-indigo-800'
                  }`}>
                    {info.turno === 'Mañana' ? '☀️' : '🌙'} {info.turno}
                  </span>
                </td>
                <td className="px-5 py-3 font-mono text-sm text-muted-foreground">{info.hora}</td>
                <td className="px-5 py-3 text-right">
                  <span className="font-mono text-sm font-bold text-foreground">
                    {moduleCounts[id] || 0}
                  </span>
                </td>
              </tr>
            ))}
            {/* Total row */}
            <tr className="bg-background font-bold">
              <td className="px-5 py-3 text-sm text-foreground" colSpan={3}>Total distribuido</td>
              <td className="px-5 py-3 text-right font-mono text-sm text-foreground">{totalModulos}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Retired/Corrupt Students */}
      {retirados.length > 0 && (
        <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-border bg-background">
            <h2 className="font-bold text-foreground flex items-center gap-2">
              👤 Alumnos retirados / inactivos / corruptos
              <span className="ml-auto text-xs font-normal text-muted-foreground">
                Selecciona el estado correcto. Los cambios se guardan automáticamente.
              </span>
            </h2>
          </div>
          <table className="w-full">
            <thead>
              <tr className="bg-background text-left">
                <th className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-12">#</th>
                <th className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nombre</th>
                <th className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Etiqueta</th>
                <th className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {retirados.map((alumno, index) => (
                <tr key={`ret-${index}`} className="hover:bg-background transition-colors">
                  <td className="px-5 py-3 font-mono text-sm text-muted-foreground">{index + 1}</td>
                  <td className="px-5 py-3 text-sm font-medium text-foreground">{alumno.nombre || '(sin nombre)'}</td>
                  <td className="px-5 py-3">
                    <span className="text-xs text-muted-foreground italic">{alumno._etiqueta || '—'}</span>
                  </td>
                  <td className="px-5 py-3">
                    <select
                      value={alumno.status || 'retirado'}
                      onChange={(e) => handleStatusChange(index, e.target.value)}
                      className={`text-sm font-medium rounded-lg border-border px-3 py-1.5 cursor-pointer focus:ring-2 focus:ring-rose-500 focus:border-rose-500 ${
                        STATUS_OPTIONS.find((o) => o.value === alumno.status)?.color || 'bg-muted text-foreground'
                      }`}
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* No data fallback */}
      {!report && retirados.length === 0 && totalModulos === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-40" />
          <p className="text-lg font-medium">No hay datos de migración disponibles</p>
          <p className="text-sm mt-1">La migración de módulos sábado aún no se ha ejecutado.</p>
        </div>
      )}
    </div>
  );
};

export default ReporteRedes;
