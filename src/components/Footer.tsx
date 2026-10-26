import React from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-12 border-t border-slate-200 bg-white/80 backdrop-blur-xs py-4 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50/80 px-3 py-1.5 rounded-lg border border-amber-200/60 font-medium">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>
            Borrador generado con IA. Debe ser validado por un asesor contra las condiciones reales de la póliza. No suba datos reales de clientes.
          </span>
        </div>
        <div className="text-[11px] text-slate-500 font-medium shrink-0">
          Banco de Colombia · Correduría de Seguros
        </div>
      </div>
    </footer>
  );
};
