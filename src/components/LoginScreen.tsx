import React, { useState } from 'react';
import { ShieldCheck, Lock, User, AlertCircle, Loader2, KeyRound } from 'lucide-react';
import { AppUser } from '../types';

interface LoginScreenProps {
  onLoginSuccess: (user: AppUser) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanUser = usuario.trim().toLowerCase();
    if (!cleanUser || !contrasena) {
      setErrorMessage('usuario o contraseña incorrectos');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          usuario: cleanUser,
          contrasena: contrasena,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Enforce the exact messages specified in Rule 6
        if (response.status === 403 || data.error?.includes('suspendido')) {
          setErrorMessage('usuario suspendido, contacte al administrador');
        } else {
          setErrorMessage('usuario o contraseña incorrectos');
        }
        return;
      }

      if (data.ok && data.user) {
        onLoginSuccess(data.user);
      } else {
        setErrorMessage('usuario o contraseña incorrectos');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Error de conexión con el servidor. Intente nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#002244] to-[#0A3663] text-amber-400 flex items-center justify-center shadow-lg border border-blue-900/20">
            <ShieldCheck className="w-8 h-8 text-amber-300" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl sm:text-3xl font-extrabold text-[#002244] tracking-tight">
          Banco de Colombia
        </h2>
        <p className="mt-1 text-center text-sm font-semibold text-slate-600">
          Correduría de Seguros · Portal de Asesores
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl rounded-3xl border border-slate-200/90">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              Iniciar sesión
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Acceso exclusivo para personal autorizado. Ingrese con sus credenciales de usuario.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span className="font-semibold">{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="usuario"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1"
              >
                Usuario
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="usuario"
                  type="text"
                  autoComplete="username"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                  placeholder="admin"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-700 focus:ring-2 focus:ring-blue-100 text-sm font-medium text-slate-800 bg-white placeholder:text-slate-400 outline-none transition-all lowercase"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Nombre corto de usuario asignado por el administrador</p>
            </div>

            <div>
              <label
                htmlFor="contrasena"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1"
              >
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="contrasena"
                  type="password"
                  autoComplete="current-password"
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-700 focus:ring-2 focus:ring-blue-100 text-sm font-medium text-slate-800 bg-white placeholder:text-slate-400 outline-none transition-all"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl shadow-md text-sm font-bold text-white bg-gradient-to-r from-[#002244] to-[#0A3663] hover:from-[#001730] hover:to-[#082a4d] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-900 active:scale-98 transition-all cursor-pointer disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                    <span>Verificando credenciales...</span>
                  </>
                ) : (
                  <span>Entrar</span>
                )}
              </button>
            </div>
          </form>

          {/* Quick Helper Box for initial admin */}
          <div className="mt-6 pt-5 border-t border-slate-100 bg-slate-50/70 -mx-6 -mb-8 px-6 py-4 rounded-b-3xl">
            <div className="flex items-start gap-2 text-xs text-slate-600">
              <KeyRound className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-800">Credenciales del administrador inicial:</span>
                <div className="font-mono text-[11px] text-slate-700 mt-0.5">
                  Usuario: <span className="font-bold text-blue-900">admin</span> · Clave temporal: <span className="font-bold text-blue-900">Fundepos2026*</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          ¿No tiene cuenta? Los usuarios son creados únicamente por el administrador.
        </p>
      </div>
    </div>
  );
};
