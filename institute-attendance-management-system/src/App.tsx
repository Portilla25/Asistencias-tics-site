import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import TomarAsistencia from './components/TomarAsistencia';
import MisAsistencias from './components/MisAsistencias';
import GestionAlumnos from './components/GestionAlumnos';
import GestionMaterias from './components/GestionMaterias';
import Reportes from './components/Reportes';
import Calendario from './components/Calendario';
import Notificaciones from './components/Notificaciones';
import Horarios from './components/Horarios';
import Configuracion from './components/Configuracion';
import ReporteRedes from './components/ReporteRedes';
import AlumnosPersonalizados from './components/AlumnosPersonalizados';
import Notas from './components/Notas';
import PuntosExtra from './components/PuntosExtra';

const AppContent: React.FC = () => {
  const { currentUser, activeSection } = useApp();

  if (!currentUser) return <Login />;

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard': return <Dashboard />;
      case 'asistencias': return <TomarAsistencia />;
      case 'mis-asistencias': return <MisAsistencias />;
      case 'alumnos': return <GestionAlumnos />;
      case 'materias': return <GestionMaterias />;
      case 'horarios': return <Horarios />;
      case 'reportes': return <Reportes />;
      case 'reporte-redes': return <ReporteRedes />;
      case 'calificaciones': return <Notas />;
      case 'puntos-extra': return <PuntosExtra />;
      case 'personalizados': return <AlumnosPersonalizados />;
      case 'calendario': return <Calendario />;
      case 'notificaciones': return <Notificaciones />;
      case 'configuracion': return <Configuracion />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          {renderSection()}
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => (
  <AppProvider>
    <AppContent />
  </AppProvider>
);

export default App;
