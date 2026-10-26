import React, { useState } from 'react';
import { KeyRound, ShieldAlert, Check, AlertCircle, Loader2 } from 'lucide-react';
import { AppUser } from '../types';

interface ForcePasswordChangeModalProps {
  user: AppUser;
  onPasswordChanged: (updatedUser: AppUser) => void;
  onLogout: () => void;
}

export const ForcePasswordChangeModal: React.FC<ForcePasswordChangeModalProps> = ({
  user,
  onPasswordChanged,
  onLogout,
}) => {
  const [nuevaClave, setNuevaClave] = useState('');
  const [confirmarClave, setConfirmarClave] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const hasMinLength = nuevaClave.length >= 8;
  const hasNumber = /\d/.test(nuevaClave);
  const passwordsMatch = nuevaClave !== '' && nuevaClave === confirmarClave;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!hasMinLength) {
      setErrorMessage('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (!hasNumber) {
      setErrorMessage('La contraseña debe contener al menos un número.');
      return;
    }

    if (!passwordsMatch) {
      setErrorMessage('Las contraseñas no coinciden.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/cambiar-clave', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nuevaClave: nuevaClave,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.error || 'No se pudo actualizar la contraseña.');
        return;
      }

      if (data.ok && data.user) {
        onPasswordChanged(data.user);
      } else {
        setErrorMessage('Error al actualizar contraseña.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Error de conexión al guardar la contraseña.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#002244] to-[#0A3663] text-white p-6">
          <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 text-amber-300 flex items-center justify-center mb-3">
            <KeyRound className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold tracking-tight">Cambio obligatorio de contraseña</h3>
          <p className="text-xs text-blue-100 mt-1">
            Hola, <span className="font-semibold text-white">{user.nombreCompleto}</span> (@{user.usuario}). Por seguridad de la institución, debe cambiar su clave temporal antes de acceder al comparador.
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Nueva contraseña
              </label>
              <input
                type="password"
                value={nuevaClave}
                onChange={(e) => setNuevaClave(e.target.value)}
                placeholder="Mínimo 8 caracteres y 1 número"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-700 focus:ring-2 focus:ring-blue-100 text-sm font-medium text-slate-800 bg-white outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Confirmar nueva contraseña
              </label>
              <input
                type="password"
                value={confirmarClave}
                onChange={(e) => setConfirmarClave(e.target.value)}
                placeholder="Repita la nueva contraseña"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-700 focus:ring-2 focus:ring-blue-100 text-sm font-medium text-slate-800 bg-white outline-none transition-all"
              />
            </div>

            {/* Validation Checklist */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1.5 text-xs">
              <div className="font-semibold text-slate-700 mb-1">Requisitos de seguridad:</div>
              <div className={`flex items-center gap-2 ${hasMinLength ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${hasMinLength ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-500'}`}>
                  {hasMinLength ? <Check className="w-3 h-3 stroke-[3]" /> : '•'}
                </span>
                <span>Mínimo 8 caracteres</span>
              </div>
              <div className={`flex items-center gap-2 ${hasNumber ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${hasNumber ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-500'}`}>
                  {hasNumber ? <Check className="w-3 h-3 stroke-[3]" /> : '•'}
                </span>
                <span>Al menos un número (0-9)</span>
              </div>
              <div className={`flex items-center gap-2 ${passwordsMatch ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${passwordsMatch ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-500'}`}>
                  {passwordsMatch ? <Check className="w-3 h-3 stroke-[3]" /> : '•'}
                </span>
                <span>Las contraseñas coinciden</span>
              </div>
            </div>

            <div className="pt-3 flex flex-col gap-2">
              <button
                type="submit"
                disabled={isLoading || !hasMinLength || !hasNumber || !passwordsMatch}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl shadow-md text-sm font-bold text-white bg-gradient-to-r from-[#002244] to-[#0A3663] hover:from-[#001730] hover:to-[#082a4d] disabled:opacity-50 cursor-pointer transition-all"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                    <span>Guardando contraseña...</span>
                  </>
                ) : (
                  <span>Definir nueva contraseña y entrar</span>
                )}
              </button>

              <button
                type="button"
                onClick={onLogout}
                className="w-full text-center py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
              >
                Cancelar y cerrar sesión
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
