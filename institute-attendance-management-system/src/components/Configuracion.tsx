import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Settings, Users, BookOpen, Calendar, Bell, Shield, Save, CheckCircle, Database, Download, Upload } from 'lucide-react';

const Configuracion: React.FC = () => {
  const { alumnos, materias, usuarios, periodos, asistencias, dataSource, exportBackup, importBackup } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saved, setSaved] = useState(false);
  const [config, setConfig] = useState({
    umbralInasistencia: 25,
    umbralAlerta: 20,
    permitirJustificaciones: true,
    notificarDocentes: true,
    notificarAlumnos: true,
    notificarPadres: false,
    diasHabiles: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'],
    nombre: 'Instituto Educativo',
    cicloLec: '2026',
    modoEstricto: true,
  });
  const [importing, setImporting] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const text = await file.text();
      const res = await importBackup(text);
      if (res.success) {
        alert(res.message);
        window.location.reload();
      } else {
        alert(res.message);
      }
    } catch (error) {
      alert('Error al procesar el archivo');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const statsGlobales = {
    totalRegistros: asistencias.length,
    alumnosActivos: alumnos.length,
    materiasActivas: materias.length,
    docentesActivos: usuarios.filter(u => u.rol === 'docente').length,
  };

  return (
    <div className="p-6 space-y-5">
      {/* System stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total alumnos', value: statsGlobales.alumnosActivos, icon: <Users className="w-5 h-5 text-blue-600" />, color: 'bg-blue-50' },
          { label: 'Materias', value: statsGlobales.materiasActivas, icon: <BookOpen className="w-5 h-5 text-purple-600" />, color: 'bg-purple-50' },
          { label: 'Docentes', value: statsGlobales.docentesActivos, icon: <Shield className="w-5 h-5 text-green-600" />, color: 'bg-green-50' },
          { label: 'Registros totales', value: statsGlobales.totalRegistros.toLocaleString(), icon: <Calendar className="w-5 h-5 text-indigo-600" />, color: 'bg-indigo-50' },
        ].map(s => (
          <div key={s.label} className={`${s.color} rounded-xl p-4 border border-border`}>
            <div className="flex items-center gap-2 mb-2">{s.icon}</div>
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-xl p-5 shadow-sm border border-border flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Respaldo de datos</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Fuente actual: {dataSource === 'legacy' ? 'datos heredados de la web anterior' : 'datos demo'}.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Institución */}
        <div className="bg-card rounded-xl p-5 shadow-sm border border-border">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-4 h-4 text-indigo-600" />
            <h3 className="font-semibold text-foreground">Datos de la Institución</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Nombre del Instituto</label>
              <input
                value={config.nombre}
                onChange={e => setConfig(c => ({ ...c, nombre: e.target.value }))}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Año Lectivo</label>
              <input
                value={config.cicloLec}
                onChange={e => setConfig(c => ({ ...c, cicloLec: e.target.value }))}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Asistencia */}
        <div className="bg-card rounded-xl p-5 shadow-sm border border-border">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <h3 className="font-semibold text-foreground">Configuración de Asistencias</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Umbral de inasistencia máximo ({config.umbralInasistencia}%)
              </label>
              <input
                type="range" min={10} max={50} step={5}
                value={config.umbralInasistencia}
                onChange={e => setConfig(c => ({ ...c, umbralInasistencia: +e.target.value }))}
                className="w-full accent-indigo-600"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>10%</span><span>50%</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Umbral de alerta ({config.umbralAlerta}%)
              </label>
              <input
                type="range" min={5} max={30} step={5}
                value={config.umbralAlerta}
                onChange={e => setConfig(c => ({ ...c, umbralAlerta: +e.target.value }))}
                className="w-full accent-indigo-600"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>5%</span><span>30%</span>
              </div>
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={config.permitirJustificaciones}
                onChange={e => setConfig(c => ({ ...c, permitirJustificaciones: e.target.checked }))}
                className="accent-indigo-600 w-4 h-4" />
              <span className="text-sm text-foreground">Permitir justificaciones</span>
            </label>
          </div>
        </div>

        {/* Notificaciones */}
        <div className="bg-card rounded-xl p-5 shadow-sm border border-border">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-4 h-4 text-indigo-600" />
            <h3 className="font-semibold text-foreground">Notificaciones</h3>
          </div>
          <div className="space-y-3">
            {[
              { key: 'notificarDocentes', label: 'Notificar a docentes sobre alertas', desc: 'Cuando un alumno supera el umbral de inasistencias' },
              { key: 'notificarAlumnos', label: 'Notificar a alumnos', desc: 'Cuando se registra su asistencia' },
              { key: 'notificarPadres', label: 'Notificar a padres/tutores', desc: 'Envío de emails automáticos' },
            ].map(item => (
              <label key={item.key} className="flex items-start gap-3 cursor-pointer p-2 hover:bg-background rounded-lg">
                <input
                  type="checkbox"
                  checked={config[item.key as keyof typeof config] as boolean}
                  onChange={e => setConfig(c => ({ ...c, [item.key]: e.target.checked }))}
                  className="accent-indigo-600 w-4 h-4 mt-0.5"
                />
                <div>
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Periodos */}
        <div className="bg-card rounded-xl p-5 shadow-sm border border-border">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <h3 className="font-semibold text-foreground">Períodos Académicos</h3>
          </div>
          <div className="space-y-3">
            {periodos.map(p => (
              <div key={p.id} className={`flex items-center justify-between p-3 rounded-lg border ${p.activo ? 'bg-indigo-50 border-indigo-200' : 'bg-background border-border'}`}>
                <div>
                  <p className="text-sm font-medium text-foreground">{p.nombre}</p>
                  <p className="text-xs text-muted-foreground">{p.fechaInicio} → {p.fechaFin}</p>
                </div>
                {p.activo && (
                  <span className="px-2 py-0.5 bg-indigo-600 text-white text-xs rounded-full font-semibold">Activo</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Guardar */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
        >
          {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? '¡Guardado!' : 'Guardar Configuración'}
        </button>
      </div>
    </div>
  );
};

export default Configuracion;
