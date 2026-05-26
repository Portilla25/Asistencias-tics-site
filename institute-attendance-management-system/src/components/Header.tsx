import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Bell, Search, Moon, Sun, Monitor, Palette } from 'lucide-react';

const sectionTitles: Record<string, string> = {
  dashboard: 'Dashboard',
  asistencias: 'Tomar Asistencia',
  'mis-asistencias': 'Mis Asistencias',
  alumnos: 'Gestión de Alumnos',
  materias: 'Gestión de Materias',
  horarios: 'Horarios',
  reportes: 'Reportes y Estadísticas',
  'reporte-redes': 'Reporte Redes',
  calendario: 'Calendario',
  notificaciones: 'Notificaciones',
  configuracion: 'Configuración',
};

const Header: React.FC = () => {
  const { activeSection, notificaciones, currentUser, setActiveSection } = useApp();
  const { theme, setTheme } = useTheme();
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  const unread = notificaciones.filter(n => !n.leida && (n.destinatarioId === currentUser?.id || currentUser?.rol === 'admin')).length;

  const today = new Date().toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const themes = [
    { id: 'light', name: 'Claro', icon: <Sun className="w-4 h-4" /> },
    { id: 'dark', name: 'Oscuro', icon: <Moon className="w-4 h-4" /> },
    { id: 'ocean', name: 'Océano', icon: <Monitor className="w-4 h-4" /> },
    { id: 'midnight', name: 'Medianoche', icon: <Palette className="w-4 h-4" /> },
  ] as const;

  return (
    <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm backdrop-blur-md bg-opacity-90">
      <div>
        <h1 className="text-xl font-bold text-foreground">{sectionTitles[activeSection] || activeSection}</h1>
        <p className="text-xs text-muted-foreground capitalize">{today}</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar..."
            className="pl-9 pr-4 py-2 text-sm border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary w-48 transition-colors"
          />
        </div>

        {/* Theme Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            className="p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-colors"
            title="Cambiar Tema"
          >
            {theme === 'light' ? <Sun className="w-5 h-5" /> : 
             theme === 'ocean' ? <Monitor className="w-5 h-5" /> : 
             theme === 'midnight' ? <Palette className="w-5 h-5" /> : 
             <Moon className="w-5 h-5" />}
          </button>
          
          {showThemeMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowThemeMenu(false)}></div>
              <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50 py-1">
                <div className="px-3 py-2 border-b border-border">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Apariencia</p>
                </div>
                {themes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => { setTheme(t.id); setShowThemeMenu(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-left transition-colors ${theme === t.id ? 'bg-primary/10 text-primary font-medium' : 'text-foreground hover:bg-muted'}`}
                  >
                    {t.icon}
                    {t.name}
                    {theme === t.id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary"></div>}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <button
          onClick={() => setActiveSection('notificaciones')}
          className="relative p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-colors"
        >
          <Bell className="w-5 h-5" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>

        <div className="flex items-center gap-2 pl-3 border-l border-border">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shadow-md">
            {currentUser?.nombre[0]}{currentUser?.apellido[0]}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-foreground leading-tight">{currentUser?.nombre} {currentUser?.apellido}</p>
            <p className="text-xs text-muted-foreground">{currentUser?.email}</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
