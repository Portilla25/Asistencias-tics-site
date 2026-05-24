import React from 'react';
import { useApp } from '../context/AppContext';
import { Bell, CheckCircle, AlertTriangle, Info, XCircle, Check } from 'lucide-react';

const tipoConfig = {
  success: { icon: <CheckCircle className="w-4 h-4" />, color: 'text-green-600', bg: 'bg-green-50 border-green-200' },
  warning: { icon: <AlertTriangle className="w-4 h-4" />, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
  info: { icon: <Info className="w-4 h-4" />, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
  error: { icon: <XCircle className="w-4 h-4" />, color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
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
          <Bell className="w-5 h-5 text-indigo-600" />
          <span className="text-sm font-medium text-gray-700">{noLeidas} sin leer</span>
        </div>
        {noLeidas > 0 && (
          <button onClick={marcarTodasLeidas} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors font-medium">
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
              className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${
                n.leida ? 'bg-white border-gray-100' : `${config.bg} border`
              }`}
            >
              <div className={`${config.color} mt-0.5 flex-shrink-0`}>
                {config.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm font-semibold ${n.leida ? 'text-gray-700' : 'text-gray-900'}`}>{n.titulo}</p>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-gray-400">{fecha}</span>
                    {!n.leida && (
                      <div className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0" />
                    )}
                  </div>
                </div>
                <p className={`text-sm mt-0.5 ${n.leida ? 'text-gray-500' : 'text-gray-700'}`}>{n.mensaje}</p>
                {!n.leida && (
                  <button
                    onClick={() => marcarNotificacionLeida(n.id)}
                    className="mt-2 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    Marcar como leída
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {misNotificaciones.length === 0 && (
          <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
            <Bell className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No hay notificaciones</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notificaciones;
