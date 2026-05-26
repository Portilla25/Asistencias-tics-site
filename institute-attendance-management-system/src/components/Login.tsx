import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  AlertCircle,
  BookOpenCheck,
  GraduationCap,
  Loader2,
  LogIn,
  ShieldCheck,
  UserRound,
  UsersRound,
} from 'lucide-react';
import { Role } from '../types';

const roleCards: Array<{
  role: Role;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  tone: string;
}> = [
  {
    role: 'admin',
    title: 'Administrador',
    subtitle: 'Panel completo, backups y configuración',
    icon: <ShieldCheck className="w-5 h-5" />,
    tone: 'border-amber-200 bg-amber-50 text-amber-800',
  },
  {
    role: 'docente',
    title: 'Docente',
    subtitle: 'Asistencia, alumnos y reportes de módulos',
    icon: <UsersRound className="w-5 h-5" />,
    tone: 'border-teal-200 bg-teal-50 text-teal-800',
  },
  {
    role: 'alumno',
    title: 'Alumno',
    subtitle: 'Mis asistencias, horario y calendario',
    icon: <UserRound className="w-5 h-5" />,
    tone: 'border-sky-200 bg-sky-50 text-sky-800',
  },
];

const Login: React.FC = () => {
  const { login, loginAsRole, loginWithGoogle, dataSource } = useApp();
  const [email, setEmail] = useState('fer250423@gmail.com');
  const [password, setPassword] = useState('admin');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    const result = await loginWithGoogle();
    if (!result.ok) setError(result.message || 'No se pudo iniciar sesión con Google.');
    setLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const ok = login(email, password);
    if (!ok) setError('No encontré ese usuario local. Prueba con Google o una vista por rol.');
  };

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-foreground grid lg:grid-cols-[1.08fr_.92fr]">
      <section className="relative min-h-[46vh] lg:min-h-screen overflow-hidden bg-slate-950 px-6 py-8 flex items-end">
        <div className="absolute inset-0 bg-[linear-gradient(140deg,rgba(15,23,42,.96),rgba(15,23,42,.76)),url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1600&q=80')] bg-cover bg-center" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-slate-950 to-transparent" />
        <div className="relative max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-card/10 px-3 py-1.5 text-sm text-white/85 mb-5">
            <BookOpenCheck className="w-4 h-4 text-amber-300" />
            Sistema de Asistencias Redes & TICs
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Gestión clara para clases, módulos y alumnos reales.
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-200 max-w-xl">
            La nueva interfaz lee los datos actuales del sistema anterior y conserva el formato de respaldo antes de avanzar con la migración completa.
          </p>
          <div className="mt-6 grid grid-cols-3 gap-3 max-w-lg">
            {['Admin', 'Docentes', 'Alumnos'].map(item => (
              <div key={item} className="rounded-lg border border-white/10 bg-card/10 px-3 py-3">
                <p className="text-sm font-semibold text-white">{item}</p>
                <p className="text-xs text-slate-300 mt-1">Vista dedicada</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-8 sm:px-10 lg:px-12 flex items-center">
        <div className="w-full max-w-lg mx-auto">
          <div className="mb-7">
            <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center mb-4">
              <GraduationCap className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-bold text-slate-950">Iniciar sesión</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {dataSource === 'legacy'
                ? 'Datos actuales detectados en este navegador.'
                : 'Modo demo activo hasta encontrar datos heredados.'}
            </p>
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            className="w-full h-12 rounded-lg bg-slate-950 hover:bg-slate-800 disabled:opacity-60 text-white font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
            Entrar con Google
          </button>

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Acceso local</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <div className="grid gap-3">
            {roleCards.map(card => (
              <button
                key={card.role}
                type="button"
                onClick={() => loginAsRole(card.role)}
                className={`w-full rounded-lg border px-4 py-3 text-left transition-transform hover:-translate-y-0.5 ${card.tone}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-card/70 flex items-center justify-center">
                    {card.icon}
                  </div>
                  <div>
                    <p className="font-bold text-sm">{card.title}</p>
                    <p className="text-xs opacity-80">{card.subtitle}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="mt-6 rounded-lg border border-border bg-card p-4 shadow-sm">
            <p className="text-sm font-semibold text-foreground mb-3">Entrada local manual</p>
            <div className="grid sm:grid-cols-[1fr_120px] gap-2">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="h-10 rounded-lg border border-border px-3 text-sm outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="correo"
              />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="h-10 rounded-lg border border-border px-3 text-sm outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="clave"
              />
            </div>
            <button className="mt-3 w-full h-10 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-background">
              Ingresar
            </button>
          </form>
        </div>
      </section>
    </div>
  );
};

export default Login;
