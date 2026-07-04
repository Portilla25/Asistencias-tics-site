import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Moon, Monitor, Palette, Sun } from 'lucide-react';
import { formatDateInPeru } from '../utils/dateUtils';

const sectionTitles: Record<string, string> = {
  asistencias: 'Asistencia',
  'mis-asistencias': 'Mis asistencias',
  alumnos: 'Alumnos',
  reportes: 'Reportes',
  calificaciones: 'Notas',
  'puntos-extra': 'Participacion',
  configuracion: 'Respaldo',
};

const Header: React.FC = () => {
  const { activeSection, currentUser } = useApp();
  const { theme, setTheme } = useTheme();
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  const today = formatDateInPeru(new Date(), { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const themes = [
    { id: 'light', name: 'Claro', icon: <Sun className="w-4 h-4" /> },
    { id: 'dark', name: 'Oscuro', icon: <Moon className="w-4 h-4" /> },
    { id: 'ocean', name: 'Oceano', icon: <Monitor className="w-4 h-4" /> },
    { id: 'midnight', name: 'Medianoche', icon: <Palette className="w-4 h-4" /> },
  ] as const;

  return (
    <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm backdrop-blur-md bg-opacity-90">
      <div>
        <h1 className="text-xl font-bold text-foreground">{sectionTitles[activeSection] || 'Asistencia'}</h1>
        <p className="text-xs text-muted-foreground capitalize">{today}</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <button
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            className="p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-colors"
            title="Cambiar tema"
          >
            {theme === 'light' ? <Sun className="w-5 h-5" /> :
             theme === 'ocean' ? <Monitor className="w-5 h-5" /> :
             theme === 'midnight' ? <Palette className="w-5 h-5" /> :
             <Moon className="w-5 h-5" />}
          </button>

          {showThemeMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowThemeMenu(false)} />
              <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50 py-1">
                {themes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => { setTheme(t.id); setShowThemeMenu(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-left transition-colors ${theme === t.id ? 'bg-primary/10 text-primary font-medium' : 'text-foreground hover:bg-muted'}`}
                  >
                    {t.icon}
                    {t.name}
                    {theme === t.id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

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
