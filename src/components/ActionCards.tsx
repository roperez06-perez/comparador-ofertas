import React, { useState } from 'react';
import { 
  Copy, 
  Check, 
  RotateCcw, 
  MessageSquare, 
  Sparkles, 
  Send,
  ExternalLink,
  ShieldCheck,
  FileCheck2
} from 'lucide-react';

interface ActionCardsProps {
  recomendacion: string;
  mensajeWhatsapp: string;
  onReset: () => void;
}

export const ActionCards: React.FC<ActionCardsProps> = ({
  recomendacion,
  mensajeWhatsapp,
  onReset,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(mensajeWhatsapp);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Error copying to clipboard:', err);
    }
  };

  const handleOpenWhatsApp = () => {
    const encoded = encodeURIComponent(mensajeWhatsapp);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cuadro 1: Recomendación preliminar (borrador) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#002244] flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-blue-800" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">
                    Recomendación preliminar (borrador)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Justificación técnica según prioridades del cliente (máx. 5 líneas)
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-900 bg-blue-100/70 px-2 py-0.5 rounded border border-blue-200">
                Uso interno asesor
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-sm text-slate-800 leading-relaxed whitespace-pre-line font-normal">
              {recomendacion}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <FileCheck2 className="w-3.5 h-3.5 text-blue-700" />
              Sujeto a validación contra condiciones generales de la póliza
            </span>
          </div>
        </div>

        {/* Cuadro 2: Mensaje sugerido para el cliente (WhatsApp) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">
                    Mensaje sugerido para el cliente (WhatsApp)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Tono cordial, sin tecnicismos, listo para enviar (máx. 8 líneas)
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-900 bg-emerald-100/80 px-2 py-0.5 rounded border border-emerald-200">
                WhatsApp
              </span>
            </div>

            {/* Chat Bubble Style */}
            <div className="p-4 rounded-xl bg-[#eef7f0] border border-emerald-200/80 text-sm text-slate-800 leading-relaxed whitespace-pre-line relative">
              <div className="absolute top-2 right-2 text-[10px] text-emerald-800/70 font-mono">
                WhatsApp Ready
              </div>
              {mensajeWhatsapp}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-all shadow-xs cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>¡Mensaje copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar mensaje</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleOpenWhatsApp}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
                title="Abrir WhatsApp Web con este mensaje precargado"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Enviar por WhatsApp</span>
              </button>
            </div>

            <span className="text-[11px] text-slate-400">
              Formateado con *negritas* para WhatsApp
            </span>
          </div>
        </div>
      </div>

      {/* Action Footer Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
        <button
          type="button"
          onClick={handleCopy}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm active:scale-98 transition-all cursor-pointer"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          <span>Copiar mensaje</span>
        </button>

        <button
          type="button"
          onClick={onReset}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold rounded-xl text-[#002244] bg-white hover:bg-slate-50 border-2 border-[#002244] shadow-xs active:scale-98 transition-all cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Nueva comparación</span>
        </button>
      </div>
    </div>
  );
};
