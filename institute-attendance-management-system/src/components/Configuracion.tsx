import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Calendar, Clock, Database, Download, RefreshCw, Upload } from 'lucide-react';
import {
  flushDeferredSyncNow,
  getDeferredSyncStatus,
  updateDeferredSyncSettings,
} from '../services/deferredSync';

const Configuracion: React.FC = () => {
  const {
    alumnos,
    materias,
    asistencias,
    dataSource,
    exportBackup,
    importBackup,
    showWeekdayLabels,
    setShowWeekdayLabels,
  } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [syncingNow, setSyncingNow] = useState(false);
  const [syncStatus, setSyncStatus] = useState(getDeferredSyncStatus);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    const refresh = () => setSyncStatus(getDeferredSyncStatus());
    refresh();
    const id = window.setInterval(refresh, 30000);
    return () => window.clearInterval(id);
  }, []);

  const handleSyncTimeChange = (time: string) => {
    updateDeferredSyncSettings({ time });
    setSyncStatus(getDeferredSyncStatus());
  };

  const handleSyncNow = async () => {
    setSyncingNow(true);
    try {
      const result = await flushDeferredSyncNow('manual');
      alert(result.message);
    } finally {
      setSyncingNow(false);
      setSyncStatus(getDeferredSyncStatus());
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const text = await file.text();
      const res = await importBackup(text);
      alert(res.message);
      if (res.success) window.location.reload();
    } catch {
      alert('Error al procesar el archivo');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const nextSyncLabel = syncStatus.nextRunAtMs
    ? new Date(syncStatus.nextRunAtMs).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })
    : 'Sin cambios pendientes';
  const lastSyncLabel = syncStatus.lastRunAtMs
    ? new Date(syncStatus.lastRunAtMs).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })
    : 'Aun no se subio en este navegador';

  return (
    <div className="p-6 space-y-5 max-w-5xl">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Alumnos', value: alumnos.length },
          { label: 'Modulos', value: materias.length },
          { label: 'Asistencias', value: asistencias.length.toLocaleString() },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-xl p-5 shadow-sm border border-border flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Copia de seguridad</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Fuente actual: {dataSource === 'legacy' ? 'datos reales guardados' : 'datos demo'}.
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="file"
            accept=".json"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImportFile}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            {importing ? 'Importando...' : 'Importar backup'}
          </button>
          <button
            onClick={exportBackup}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            <Download className="w-4 h-4" />
            Descargar backup
          </button>
        </div>
      </div>

      <div className="bg-card rounded-xl p-5 shadow-sm border border-border flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Subida a Firebase</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Cambios pendientes: {syncStatus.pendingCount}. Proxima subida: {nextSyncLabel}.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Ultima subida: {lastSyncLabel}
              {syncStatus.lastError ? ` - Ultimo error: ${syncStatus.lastError}` : ''}
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <label className="flex items-center gap-2 text-sm text-foreground">
            Hora
            <input
              type="time"
              value={syncStatus.time}
              onChange={(event) => handleSyncTimeChange(event.target.value)}
              className="px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </label>
          <button
            onClick={handleSyncNow}
            disabled={syncingNow || syncStatus.pendingCount === 0}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${syncingNow ? 'animate-spin' : ''}`} />
            {syncingNow ? 'Subiendo...' : 'Subir ahora'}
          </button>
        </div>
      </div>

      <div className="bg-card rounded-xl p-5 shadow-sm border border-border">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4 text-indigo-600" />
          <h3 className="font-semibold text-foreground">Fechas</h3>
        </div>
        <label className="flex items-start gap-3 cursor-pointer p-2 hover:bg-background rounded-lg">
          <input
            type="checkbox"
            checked={showWeekdayLabels}
            onChange={e => setShowWeekdayLabels(e.target.checked)}
            className="accent-indigo-600 w-4 h-4 mt-0.5"
          />
          <div>
            <p className="text-sm font-medium text-foreground">Mostrar dia de la semana sobre cada fecha</p>
            <p className="text-xs text-muted-foreground">
              Usa la zona horaria de Peru para calcular el dia correcto.
            </p>
          </div>
        </label>
      </div>
    </div>
  );
};

export default Configuracion;
