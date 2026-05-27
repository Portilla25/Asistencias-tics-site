import React from 'react';
import { useApp } from '../context/AppContext';
import { Bell, CheckCircle, AlertTriangle, Info, XCircle, Check } from 'lucide-react';

const tipoConfig = {
  success: { icon: <CheckCircle className="w-4 h-4" />, color: 'text-green-400', bg: 'border-green-500/30' },
  warning: { icon: <AlertTriangle className="w-4 h-4" />, color: 'text-amber-400', bg: 'border-amber-500/30' },
  info: { icon: <Info className="w-4 h-4" />, color: 'text-blue-400', bg: 'border-blue-500/30' },
  error: { icon: <XCircle className="w-4 h-4" />, color: 'text-red-400', bg: 'border-red-500/30' },
};

const Notificaciones: React.FC = () => {
  const { notificaciones, currentUser, marcarNotificacionLeida, marcarTodasLeidas } = useApp();

  const misNotificaciones = notificaciones.filter(
    n => n.destinatarioId === currentUser?.id || currentUser?.rol === 'admin'
  ).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  const noLeidas = misNotificaciones.filter(n => !n.leida).length;

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-indigo-400" />
          <span className="text-sm font-medium text-gray-200">{noLeidas} sin leer</span>
        </div>
        {noLeidas > 0 && (
          <button onClick={marcarTodasLeidas} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-indigo-400 hover:bg-white/10 rounded-lg transition-colors font-medium">
            <Check className="w-4 h-4" />
            Marcar todas como leídas
          </button>
        )}
      </div>

      {/* Notifications */}
      <div className="space-y-3">
        {misNotificaciones.map(n => {
          const config = tipoConfig[n.tipo];
          const fecha = new Date(n.fecha).toLocaleDateString('es-AR', {
            day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
          });
          return (
            <div
              key={n.id}
              className={`flex items-start gap-4 p-4 rounded-xl transition-all backdrop-blur-[12px] shadow-[0_4px_6px_rgba(0,0,0,0.3)] ${
                n.leida 
                  ? 'bg-[rgba(30,41,59,0.4)] border border-white/5 opacity-75' 
                  : `bg-[rgba(30,41,59,0.7)] border ${config.bg || 'border-white/10'}`
              }`}
            >
              <div className={`${config.color} mt-0.5 flex-shrink-0`}>
                {config.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm font-semibold text-gray-100`}>{n.titulo}</p>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-gray-400">{fecha}</span>
                    {!n.leida && (
                      <div className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                    )}
                  </div>
                </div>
                <p className={`text-sm mt-0.5 text-gray-300`}>{n.mensaje}</p>
                {!n.leida && (
                  <button
                    onClick={() => marcarNotificacionLeida(n.id)}
                    className="mt-2 text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                  >
                    Marcar como leída
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {misNotificaciones.length === 0 && (
          <div className="bg-[rgba(30,41,59,0.5)] backdrop-blur-[12px] border border-white/10 rounded-xl p-12 text-center shadow-[0_4px_6px_rgba(0,0,0,0.3)]">
            <Bell className="w-12 h-12 text-gray-500 mx-auto mb-3" />
            <p className="text-gray-300 font-medium">No hay notificaciones</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notificaciones;
