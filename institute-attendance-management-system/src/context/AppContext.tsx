import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { User, Alumno, Materia, Asistencia, Notificacion, ClaseHorario, Periodo, Role } from '../types';
import {
  ADMIN_EMAILS,
  createLegacyBackup,
  InitialAppData,
  loadInitialAppData,
  persistLegacyAttendanceBatch,
  persistAlumno,
} from '../services/legacyData';

interface AppContextType {
  currentUser: User | null;
  login: (email: string, password: string) => boolean;
  loginAsRole: (role: Role) => void;
  loginWithGoogle: () => Promise<{ ok: boolean; message?: string }>;
  logout: () => void;
  alumnos: Alumno[];
  materias: Materia[];
  asistencias: Asistencia[];
  notificaciones: Notificacion[];
  horarios: ClaseHorario[];
  periodos: Periodo[];
  usuarios: User[];
  dataSource: InitialAppData['source'];
  exportBackup: () => void;
  addAlumno: (alumno: Omit<Alumno, 'id'>) => void;
  updateAlumno: (id: string, alumno: Partial<Alumno>) => void;
  deleteAlumno: (id: string) => void;
  addMateria: (materia: Omit<Materia, 'id'>) => void;
  updateMateria: (id: string, materia: Partial<Materia>) => void;
  deleteMateria: (id: string) => void;
  registrarAsistencia: (asistencia: Omit<Asistencia, 'id'>) => void;
  registrarAsistenciaLote: (asistencias: Omit<Asistencia, 'id'>[]) => void;
  updateAsistencia: (id: string, data: Partial<Asistencia>) => void;
  marcarNotificacionLeida: (id: string) => void;
  marcarTodasLeidas: () => void;
  activeSection: string;
  setActiveSection: (section: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextType | null>(null);

const getStoredFirebaseConfig = () => {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem('fb_config');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const getFirebaseApp = () => {
  const firebase = typeof window !== 'undefined' ? window.firebase : undefined;
  const config = getStoredFirebaseConfig();
  if (!firebase || !config) return null;
  if (firebase.apps?.length) return firebase.app();
  return firebase.initializeApp(config);
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [initialData] = useState(loadInitialAppData);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [alumnos, setAlumnos] = useState(initialData.alumnos);
  const [materias, setMaterias] = useState(initialData.materias);
  const [asistencias, setAsistencias] = useState(initialData.asistencias);
  const [notificaciones, setNotificaciones] = useState(initialData.notificaciones);
  const [usuarios] = useState(initialData.usuarios);
  const [horarios] = useState(initialData.horarios);
  const [periodos] = useState(initialData.periodos);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const resolveGoogleUser = useCallback((email: string, displayName?: string | null): User | null => {
    const normalizedEmail = email.toLowerCase();
    const known = usuarios.find(u => u.email.toLowerCase() === normalizedEmail);
    if (known) return { ...known, provider: 'google' };

    if (ADMIN_EMAILS.includes(normalizedEmail)) {
      return {
        id: 'u-admin',
        nombre: displayName?.split(' ')[0] || 'Fernando',
        apellido: displayName?.split(' ').slice(1).join(' ') || 'Portilla',
        email,
        password: '',
        rol: 'admin',
        provider: 'google',
      };
    }

    const alumno = alumnos.find(a => a.email.toLowerCase() === normalizedEmail);
    if (alumno) {
      return {
        id: `u-${alumno.id}`,
        nombre: alumno.nombre,
        apellido: alumno.apellido,
        email,
        password: '',
        rol: 'alumno',
        provider: 'google',
      };
    }

    return null;
  }, [alumnos, usuarios]);

  useEffect(() => {
    const app = getFirebaseApp();
    if (!app) return;
    const unsubscribe = window.firebase.auth(app).onAuthStateChanged((authUser: { email?: string; displayName?: string } | null) => {
      if (!authUser?.email) return;
      const user = resolveGoogleUser(authUser.email, authUser.displayName);
      if (user) {
        setCurrentUser(prev => {
          if (!prev || prev.email !== user.email) {
            setActiveSection(user.rol === 'alumno' ? 'mis-asistencias' : 'dashboard');
          }
          return user;
        });
      }
    });
    return () => unsubscribe?.();
  }, [resolveGoogleUser]);

  const login = useCallback((email: string, password: string): boolean => {
    const user = usuarios.find(u => u.email === email && u.password === password);
    if (user) {
      setCurrentUser(user);
      setActiveSection(user.rol === 'alumno' ? 'mis-asistencias' : 'dashboard');
      return true;
    }
    return false;
  }, [usuarios]);

  const loginAsRole = useCallback((role: Role) => {
    const user = usuarios.find(u => u.rol === role) || usuarios[0];
    setCurrentUser(user);
    setActiveSection(role === 'alumno' ? 'mis-asistencias' : 'dashboard');
  }, [usuarios]);

  const loginWithGoogle = useCallback(async () => {
    const app = getFirebaseApp();
    if (!app) {
      return { ok: false, message: 'No encontré la configuración de Firebase guardada. Puedes entrar con una vista local para revisar los datos actuales.' };
    }

    try {
      const provider = new window.firebase.auth.GoogleAuthProvider();
      const result = await window.firebase.auth(app).signInWithPopup(provider);
      const email = result.user?.email;
      const user = email ? resolveGoogleUser(email, result.user?.displayName) : null;
      if (!user) {
        await window.firebase.auth(app).signOut();
        return { ok: false, message: 'Este correo no tiene rol asignado en la nueva interfaz.' };
      }
      setCurrentUser(user);
      setActiveSection(user.rol === 'alumno' ? 'mis-asistencias' : 'dashboard');
      return { ok: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo iniciar sesión con Google.';
      return { ok: false, message };
    }
  }, [resolveGoogleUser]);

  const logout = useCallback(() => {
    const app = getFirebaseApp();
    if (app) window.firebase.auth(app).signOut().catch(() => undefined);
    setCurrentUser(null);
    setActiveSection('dashboard');
  }, []);

  const addAlumno = useCallback((alumno: Omit<Alumno, 'id'>) => {
    setAlumnos(prev => [...prev, { ...alumno, id: `a${Date.now()}` }]);
  }, []);

  const updateAlumno = useCallback((id: string, data: Partial<Alumno>) => {
    persistAlumno(id, data, alumnos);
    setAlumnos(prev => prev.map(a => a.id === id ? { ...a, ...data } : a));
  }, [alumnos]);

  const deleteAlumno = useCallback((id: string) => {
    setAlumnos(prev => prev.filter(a => a.id !== id));
    setAsistencias(prev => prev.filter(a => a.alumnoId !== id));
  }, []);

  const addMateria = useCallback((materia: Omit<Materia, 'id'>) => {
    setMaterias(prev => [...prev, { ...materia, id: `m${Date.now()}` }]);
  }, []);

  const updateMateria = useCallback((id: string, data: Partial<Materia>) => {
    setMaterias(prev => prev.map(m => m.id === id ? { ...m, ...data } : m));
  }, []);

  const deleteMateria = useCallback((id: string) => {
    setMaterias(prev => prev.filter(m => m.id !== id));
    setAlumnos(prev => prev.map(alumno => ({ ...alumno, materias: alumno.materias.filter(materiaId => materiaId !== id) })));
    setAsistencias(prev => prev.filter(a => a.materiaId !== id));
  }, []);

  const registrarAsistencia = useCallback((asistencia: Omit<Asistencia, 'id'>) => {
    persistLegacyAttendanceBatch([asistencia], alumnos);
    setAsistencias(prev => {
      const exists = prev.find(a => a.alumnoId === asistencia.alumnoId && a.materiaId === asistencia.materiaId && a.fecha === asistencia.fecha);
      if (exists) {
        return prev.map(a => a.id === exists.id ? { ...a, ...asistencia } : a);
      }
      return [...prev, { ...asistencia, id: `as${Date.now()}_${Math.random()}` }];
    });
  }, [alumnos]);

  const registrarAsistenciaLote = useCallback((nuevas: Omit<Asistencia, 'id'>[]) => {
    persistLegacyAttendanceBatch(nuevas, alumnos);
    setAsistencias(prev => {
      let updated = [...prev];
      nuevas.forEach(asistencia => {
        const idx = updated.findIndex(a => a.alumnoId === asistencia.alumnoId && a.materiaId === asistencia.materiaId && a.fecha === asistencia.fecha);
        if (idx >= 0) {
          updated[idx] = { ...updated[idx], ...asistencia };
        } else {
          updated.push({ ...asistencia, id: `as${Date.now()}_${Math.random()}` });
        }
      });
      return updated;
    });
  }, [alumnos]);

  const updateAsistencia = useCallback((id: string, data: Partial<Asistencia>) => {
    setAsistencias(prev => prev.map(a => a.id === id ? { ...a, ...data } : a));
  }, []);

  const marcarNotificacionLeida = useCallback((id: string) => {
    setNotificaciones(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n));
  }, []);

  const marcarTodasLeidas = useCallback(() => {
    setNotificaciones(prev => prev.map(n => (
      n.destinatarioId === currentUser?.id || currentUser?.rol === 'admin'
        ? { ...n, leida: true }
        : n
    )));
  }, [currentUser]);

  return (
    <AppContext.Provider value={{
      currentUser, login, loginAsRole, loginWithGoogle, logout,
      alumnos, materias, asistencias, notificaciones, horarios, periodos, usuarios,
      dataSource: initialData.source,
      exportBackup: createLegacyBackup,
      addAlumno, updateAlumno, deleteAlumno,
      addMateria, updateMateria, deleteMateria,
      registrarAsistencia, registrarAsistenciaLote, updateAsistencia,
      marcarNotificacionLeida, marcarTodasLeidas,
      activeSection, setActiveSection,
      sidebarOpen, setSidebarOpen,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
