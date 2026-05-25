import React from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard, Users, BookOpen, ClipboardList, BarChart3,
  Bell, Calendar, Settings, LogOut, GraduationCap, ChevronLeft, ChevronRight, Clock
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  roles: string[];
  badge?: number;
}

const Sidebar: React.FC = () => {
  const { currentUser, logout, activeSection, setActiveSection, sidebarOpen, setSidebarOpen, notificaciones } = useApp();

  const unread = notificaciones.filter(n => !n.leida && (n.destinatarioId === currentUser?.id || currentUser?.rol === 'admin')).length;

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, roles: ['admin', 'docente'] },
    { id: 'asistencias', label: 'Tomar Asistencia', icon: <ClipboardList className="w-5 h-5" />, roles: ['admin', 'docente'] },
    { id: 'mis-asistencias', label: 'Mis Asistencias', icon: <ClipboardList className="w-5 h-5" />, roles: ['alumno'] },
    { id: 'alumnos', label: 'Alumnos', icon: <Users className="w-5 h-5" />, roles: ['admin', 'docente'] },
    { id: 'materias', label: 'Materias', icon: <BookOpen className="w-5 h-5" />, roles: ['admin', 'docente'] },
    { id: 'horarios', label: 'Horarios', icon: <Clock className="w-5 h-5" />, roles: ['admin', 'docente', 'alumno'] },
    { id: 'reportes', label: 'Reportes', icon: <BarChart3 className="w-5 h-5" />, roles: ['admin', 'docente'] },
    { id: 'reporte-redes', label: 'Reporte Redes', icon: <BarChart3 className="w-5 h-5" />, roles: ['admin', 'docente'] },
    { id: 'calendario', label: 'Calendario', icon: <Calendar className="w-5 h-5" />, roles: ['admin', 'docente', 'alumno'] },
    { id: 'notificaciones', label: 'Notificaciones', icon: <Bell className="w-5 h-5" />, roles: ['admin', 'docente', 'alumno'], badge: unread },
    { id: 'configuracion', label: 'Configuración', icon: <Settings className="w-5 h-5" />, roles: ['admin'] },
  ];

  const filteredItems = navItems.filter(item => currentUser && item.roles.includes(currentUser.rol));

  const roleLabel = { admin: 'Administrador', docente: 'Docente', alumno: 'Alumno' };
  const roleColor = { admin: 'bg-indigo-100 text-indigo-700', docente: 'bg-purple-100 text-purple-700', alumno: 'bg-pink-100 text-pink-700' };

  return (
    <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} transition-all duration-300 bg-gray-900 text-white flex flex-col h-screen sticky top-0 flex-shrink-0`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        {sidebarOpen && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold leading-tight">Instituto</p>
              <p className="text-xs text-gray-400">Central</p>
            </div>
          </div>
        )}
        {!sidebarOpen && (
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center mx-auto">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
        )}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-gray-400 hover:text-white transition-colors ml-auto"
        >
          {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {filteredItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveSection(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium relative group ${
              activeSection === item.id
                ? 'bg-indigo-600 text-white'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <span className="flex-shrink-0">{item.icon}</span>
            {sidebarOpen && <span>{item.label}</span>}
            {item.badge && item.badge > 0 && (
              <span className={`${sidebarOpen ? 'ml-auto' : 'absolute -top-1 -right-1'} bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold`}>
                {item.badge > 9 ? '9+' : item.badge}
              </span>
            )}
            {!sidebarOpen && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                {item.label}
              </div>
            )}
          </button>
        ))}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-gray-700">
        {sidebarOpen ? (
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {currentUser?.nombre[0]}{currentUser?.apellido[0]}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-white truncate">{currentUser?.nombre} {currentUser?.apellido}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${currentUser && roleColor[currentUser.rol]}`}>
                {currentUser && roleLabel[currentUser.rol]}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex justify-center mb-3">
            <div className="w-9 h-9 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-sm">
              {currentUser?.nombre[0]}{currentUser?.apellido[0]}
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:bg-red-900/30 hover:text-red-400 transition-all text-sm"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {sidebarOpen && <span>Cerrar Sesión</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
