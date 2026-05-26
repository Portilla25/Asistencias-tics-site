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
    { id: 'personalizados', label: 'Personalizados', icon: <Users className="w-5 h-5 text-indigo-500" />, roles: ['admin', 'docente'] },
    { id: 'calendario', label: 'Calendario', icon: <Calendar className="w-5 h-5" />, roles: ['admin', 'docente', 'alumno'] },
    { id: 'notificaciones', label: 'Notificaciones', icon: <Bell className="w-5 h-5" />, roles: ['admin', 'docente', 'alumno'], badge: unread },
    { id: 'configuracion', label: 'Configuración', icon: <Settings className="w-5 h-5" />, roles: ['admin'] },
  ];

  const filteredItems = navItems.filter(item => currentUser && item.roles.includes(currentUser.rol));

  const roleLabel = { admin: 'Administrador', docente: 'Docente', alumno: 'Alumno' };
  
  // Use generic style for roles so it adapts to theme
  const roleColor = { 
    admin: 'bg-primary/20 text-primary', 
    docente: 'bg-indigo-500/20 text-indigo-500', 
    alumno: 'bg-pink-500/20 text-pink-500' 
  };

  return (
    <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} transition-all duration-300 bg-card text-foreground border-r border-border flex flex-col h-screen sticky top-0 flex-shrink-0 z-40 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)]`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        {sidebarOpen && (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-md">
              <GraduationCap className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-[15px] font-bold leading-tight tracking-tight text-foreground">Instituto</p>
              <p className="text-xs text-muted-foreground font-medium">Central</p>
            </div>
          </div>
        )}
        {!sidebarOpen && (
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center mx-auto shadow-md">
            <GraduationCap className="w-5 h-5 text-primary-foreground" />
          </div>
        )}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-muted-foreground hover:text-foreground transition-colors ml-auto hidden sm:block p-1"
        >
          {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        {filteredItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveSection(item.id)}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all text-[13px] font-semibold relative group ${
              activeSection === item.id
                ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-[1.02]'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <span className="flex-shrink-0">{item.icon}</span>
            {sidebarOpen && <span>{item.label}</span>}
            {item.badge && item.badge > 0 && (
              <span className={`${sidebarOpen ? 'ml-auto' : 'absolute -top-1 -right-1'} bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold shadow-sm`}>
                {item.badge > 9 ? '9+' : item.badge}
              </span>
            )}
            {!sidebarOpen && (
              <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-foreground text-background text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity shadow-lg">
                {item.label}
              </div>
            )}
          </button>
        ))}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-border bg-card">
        {sidebarOpen ? (
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm flex-shrink-0 shadow-md">
              {currentUser?.nombre[0]}{currentUser?.apellido[0]}
            </div>
            <div className="overflow-hidden">
              <p className="text-[13px] font-bold text-foreground truncate">{currentUser?.nombre} {currentUser?.apellido}</p>
              <span className={`text-[11px] px-2 py-0.5 rounded-md font-semibold mt-0.5 inline-block ${currentUser && roleColor[currentUser.rol]}`}>
                {currentUser && roleLabel[currentUser.rol]}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex justify-center mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shadow-md">
              {currentUser?.nombre[0]}{currentUser?.apellido[0]}
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-all text-[13px] font-semibold group"
        >
          <LogOut className="w-4 h-4 flex-shrink-0 transition-transform group-hover:-translate-x-1" />
          {sidebarOpen && <span>Cerrar Sesión</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
