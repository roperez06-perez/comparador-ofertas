import React, { useRef, useState } from 'react';
import { Upload, FileText, Trash2, Plus, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import { UploadedProposal } from '../types';

interface ProposalUploaderProps {
  proposals: UploadedProposal[];
  onProposalsChange: (proposals: UploadedProposal[]) => void;
  onLoadSamples: () => Promise<void>;
  isLoadingSamples: boolean;
}

export const ProposalUploader: React.FC<ProposalUploaderProps> = ({
  proposals,
  onProposalsChange,
  onLoadSamples,
  isLoadingSamples,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const handleFiles = async (files: FileList | File[]) => {
    setErrorMessage(null);
    const pdfFiles = Array.from(files).filter(
      (file) => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    );

    if (pdfFiles.length === 0) {
      setErrorMessage('Por favor seleccione únicamente archivos en formato PDF.');
      return;
    }

    const availableSlots = 3 - proposals.length;
    if (availableSlots <= 0) {
      setErrorMessage('Ya ha alcanzado el límite máximo de 3 propuestas.');
      return;
    }

    const filesToProcess = pdfFiles.slice(0, availableSlots);
    if (pdfFiles.length > availableSlots) {
      setErrorMessage(`Solo se pueden agregar ${availableSlots} archivo(s) más (máximo 3 propuestas en total).`);
    }

    try {
      const newProposals: UploadedProposal[] = [];
      for (const file of filesToProcess) {
        const base64 = await readFileAsBase64(file);
        newProposals.push({
          id: `upload-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          name: file.name,
          base64: base64,
          size: file.size,
        });
      }

      onProposalsChange([...proposals, ...newProposals]);
    } catch (err) {
      console.error(err);
      setErrorMessage('Ocurrió un error al leer el archivo PDF.');
    }
  };

  const handleRemove = (id: string) => {
    onProposalsChange(proposals.filter((p) => p.id !== id));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 sm:p-6 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#002244] text-white text-xs font-bold">
              1
            </span>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Propuestas</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Suba de 1 a 3 cotizaciones en PDF de aseguradoras autorizadas (ej. Cordillera, Alborada, Protectora del Valle).
          </p>
        </div>

        <button
          type="button"
          onClick={onLoadSamples}
          disabled={isLoadingSamples}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50 self-start sm:self-auto"
          title="Carga automáticamente las 3 cotizaciones de ejemplo adjuntas para probar el comparador al instante"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>{isLoadingSamples ? 'Cargando ejemplos...' : 'Cargar 3 cotizaciones de prueba'}</span>
        </button>
      </div>

      {errorMessage && (
        <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Upload Zone */}
      <div className="mt-4">
        {proposals.length < 3 ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-blue-500 bg-blue-50/70 scale-[0.99]'
                : 'border-slate-300 hover:border-[#002244] hover:bg-slate-50/70 bg-slate-50/40'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) {
                  handleFiles(e.target.files);
                  e.target.value = '';
                }
              }}
            />
            <div className="flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-blue-100/70 text-[#002244] flex items-center justify-center mb-3">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-800">
                Haga clic para seleccionar o arrastre sus archivos PDF aquí
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Puede cargar hasta 3 propuestas (archivos .pdf de cotizaciones). {proposals.length} de 3 cargadas.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800">
            <span className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Límite de 3 propuestas alcanzado. Lista para comparar.
            </span>
            <span className="text-emerald-700 font-semibold">3 / 3 PDFs</span>
          </div>
        )}
      </div>

      {/* Uploaded List */}
      {proposals.length > 0 && (
        <div className="mt-4 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">
            <span>Archivos cargados ({proposals.length}/3)</span>
            {proposals.length < 3 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-blue-700 hover:text-blue-900 inline-flex items-center gap-1 font-medium capitalize"
              >
                <Plus className="w-3.5 h-3.5" /> Agregar otra
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            {proposals.map((prop, idx) => (
              <div
                key={prop.id}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-white hover:border-blue-300 transition-all shadow-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate" title={prop.name}>
                      <span className="text-slate-400 mr-1">#{idx + 1}</span>
                      {prop.name}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {formatSize(prop.size) || 'PDF cargado'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemove(prop.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
                  title="Eliminar propuesta"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
