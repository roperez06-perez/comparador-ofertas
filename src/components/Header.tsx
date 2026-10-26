import React from 'react';
import { ShieldCheck, LogOut, User as UserIcon, Building2 } from 'lucide-react';
import { AppUser } from '../types';

interface HeaderProps {
  user?: AppUser | null;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  return (
    <header className="bg-gradient-to-r from-[#002244] via-[#0A2540] to-[#0A3663] text-white border-b border-blue-950 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start sm:items-center space-x-3.5">
            <div className="bg-white/10 p-2.5 rounded-xl border border-white/15 shadow-inner flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-8 h-8 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider font-semibold text-blue-200 bg-blue-900/60 px-2 py-0.5 rounded border border-blue-700/50">
                  Banco de Colombia · Seguros
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-white mt-1">
                Comparador de Propuestas · Banco de Colombia
              </h1>
              <p className="text-xs sm:text-sm text-blue-100/90 font-medium mt-0.5">
                Compara propuestas de seguro de automóvil en minutos. La IA prepara, el asesor decide.
              </p>
            </div>
          </div>

          {user && (
            <div className="flex items-center gap-3 self-stretch sm:self-auto justify-between sm:justify-end bg-blue-950/40 p-2.5 rounded-2xl border border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 text-amber-300 border border-white/15 flex items-center justify-center font-bold text-xs uppercase">
                  {user.usuario.substring(0, 2)}
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white leading-tight">
                      {user.nombreCompleto}
                    </span>
                    <span
                      className={`text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded ${
                        user.rol === 'administrador'
                          ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                          : 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30'
                      }`}
                    >
                      {user.rol}
                    </span>
                  </div>
                  <div className="text-[11px] text-blue-200/80 font-mono">
                    @{user.usuario}
                  </div>
                </div>
              </div>

              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-rose-600/80 hover:bg-rose-600 active:bg-rose-700 rounded-xl transition-all shadow-xs cursor-pointer border border-rose-500/30"
                  title="Cerrar sesión segura"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Cerrar sesión</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
