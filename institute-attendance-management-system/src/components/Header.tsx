import React from 'react';
import { useApp } from '../context/AppContext';
import { Bell, Search } from 'lucide-react';

const sectionTitles: Record<string, string> = {
  dashboard: 'Dashboard',
  asistencias: 'Tomar Asistencia',
  'mis-asistencias': 'Mis Asistencias',
  alumnos: 'Gestión de Alumnos',
  materias: 'Gestión de Materias',
  horarios: 'Horarios',
  reportes: 'Reportes y Estadísticas',
  calendario: 'Calendario',
  notificaciones: 'Notificaciones',
  configuracion: 'Configuración',
};

const Header: React.FC = () => {
  const { activeSection, notificaciones, currentUser, setActiveSection } = useApp();
  const unread = notificaciones.filter(n => !n.leida && (n.destinatarioId === currentUser?.id || currentUser?.rol === 'admin')).length;

  const today = new Date().toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
      <div>
        <h1 className="text-xl font-bold text-gray-900">{sectionTitles[activeSection] || activeSection}</h1>
        <p className="text-xs text-gray-500 capitalize">{today}</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar..."
            className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48"
          />
        </div>

        <button
          onClick={() => setActiveSection('notificaciones')}
          className="relative p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
        >
          <Bell className="w-5 h-5" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>

        <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
          <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-sm">
            {currentUser?.nombre[0]}{currentUser?.apellido[0]}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-gray-800 leading-tight">{currentUser?.nombre} {currentUser?.apellido}</p>
            <p className="text-xs text-gray-500">{currentUser?.email}</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
