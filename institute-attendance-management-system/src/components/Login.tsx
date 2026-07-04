import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  AlertCircle,
  BookOpenCheck,
  GraduationCap,
  Loader2,
  LogIn,
} from 'lucide-react';

const Login: React.FC = () => {
  const { login, loginWithGoogle, dataSource } = useApp();
  const [email, setEmail] = useState('fer250423@gmail.com');
  const [password, setPassword] = useState('admin');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    const result = await loginWithGoogle();
    if (!result.ok) setError(result.message || 'No se pudo iniciar sesion con Google.');
    setLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const ok = login(email, password);
    if (!ok) setError('No encontre ese usuario local. Prueba con Google o revisa el correo y la clave.');
  };

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-foreground grid lg:grid-cols-[1fr_.9fr]">
      <section className="relative min-h-[42vh] lg:min-h-screen overflow-hidden bg-slate-950 px-6 py-8 flex items-end">
        <div className="absolute inset-0 bg-[linear-gradient(140deg,rgba(15,23,42,.96),rgba(15,23,42,.76)),url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1600&q=80')] bg-cover bg-center" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-slate-950 to-transparent" />
        <div className="relative max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-card/10 px-3 py-1.5 text-sm text-white/85 mb-5">
            <BookOpenCheck className="w-4 h-4 text-amber-300" />
            Sistema de asistencias
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Asistencia, notas y respaldos sin vueltas.
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-200 max-w-xl">
            Una entrada directa al trabajo del dia, con los datos actuales protegidos antes de cualquier cambio.
          </p>
        </div>
      </section>

      <section className="px-5 py-8 sm:px-10 lg:px-12 flex items-center">
        <div className="w-full max-w-lg mx-auto">
          <div className="mb-7">
            <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center mb-4">
              <GraduationCap className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-bold text-slate-950">Iniciar sesion</h2>
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

          <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-card p-4 shadow-sm">
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
