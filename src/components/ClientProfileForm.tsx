import React from 'react';
import { User, Car, Banknote, ShieldAlert, Sparkles, CreditCard, RotateCcw } from 'lucide-react';
import { ClientProfile, MandatoryCoverageKey } from '../types';

interface ClientProfileFormProps {
  profile: ClientProfile;
  onChange: (profile: ClientProfile) => void;
  onResetToDemo: () => void;
}

const COVERAGES_LIST: { key: MandatoryCoverageKey; label: string; desc: string }[] = [
  { key: 'colision', label: 'Colisión y vuelco', desc: 'Daños propios al vehículo por impacto o vuelco' },
  { key: 'robo', label: 'Robo total y parcial', desc: 'Indemnización por sustracción del auto o partes' },
  { key: 'asistencia_vial', label: 'Asistencia vial 24/7', desc: 'Mecánica ligera, cerrajería, paso de corriente y grúa' },
  { key: 'fenomenos_naturales', label: 'Fenómenos naturales', desc: 'Inundaciones, deslizamientos, caída de árboles' },
  { key: 'vehiculo_sustituto', label: 'Vehículo sustituto', desc: 'Auto temporal mientras el vehículo está en taller' },
];

export const ClientProfileForm: React.FC<ClientProfileFormProps> = ({
  profile,
  onChange,
  onResetToDemo,
}) => {
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'maxBudget') {
      const numVal = parseInt(value.replace(/[^0-9]/g, ''), 10) || 0;
      onChange({ ...profile, maxBudget: numVal });
    } else {
      onChange({ ...profile, [name]: value });
    }
  };

  const toggleCoverage = (key: MandatoryCoverageKey) => {
    const current = profile.mandatoryCoverages;
    const next = current.includes(key)
      ? current.filter((k) => k !== key)
      : [...current, key];
    onChange({ ...profile, mandatoryCoverages: next });
  };

  const formatColones = (amount: number) => {
    return amount.toLocaleString('es-CR');
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 sm:p-6 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#002244] text-white text-xs font-bold">
              2
            </span>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Perfil del cliente</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Parámetros y requisitos mínimos para que la IA contraste objetivamente cada póliza.
          </p>
        </div>

        <button
          type="button"
          onClick={onResetToDemo}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-blue-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer self-start sm:self-auto border border-slate-200"
          title="Restablecer datos recomendados para la cotización de prueba (Laura Solís)"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Restablecer datos de prueba</span>
        </button>
      </div>

      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Nombre */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-[#002244]" />
            Nombre del cliente
          </label>
          <input
            type="text"
            name="name"
            value={profile.name}
            onChange={handleTextChange}
            placeholder="Ej. Laura Solís Vargas"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-700 focus:ring-2 focus:ring-blue-100 text-sm font-medium text-slate-800 bg-white placeholder:text-slate-400 outline-none transition-all"
          />
        </div>

        {/* Vehículo y uso */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Car className="w-3.5 h-3.5 text-[#002244]" />
            Vehículo y uso
          </label>
          <input
            type="text"
            name="vehicleAndUse"
            value={profile.vehicleAndUse}
            onChange={handleTextChange}
            placeholder="Ej. Toyota Corolla XEi 2022 · Uso Particular"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-700 focus:ring-2 focus:ring-blue-100 text-sm font-medium text-slate-800 bg-white placeholder:text-slate-400 outline-none transition-all"
          />
        </div>

        {/* Presupuesto máximo anual */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Banknote className="w-3.5 h-3.5 text-[#002244]" />
            Presupuesto máximo anual (colones)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 font-bold">
              ₡
            </div>
            <input
              type="text"
              name="maxBudget"
              value={formatColones(profile.maxBudget)}
              onChange={handleTextChange}
              placeholder="400.000"
              className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-700 focus:ring-2 focus:ring-blue-100 text-sm font-semibold text-slate-800 bg-white outline-none transition-all"
            />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Se usará para determinar si la prima anual "Cabe en presupuesto".
          </p>
        </div>

        {/* Forma de pago preferida */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5 text-[#002244]" />
            Forma de pago preferida
          </label>
          <select
            name="preferredPayment"
            value={profile.preferredPayment}
            onChange={handleTextChange}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-700 focus:ring-2 focus:ring-blue-100 text-sm font-medium text-slate-800 bg-white outline-none transition-all cursor-pointer"
          >
            <option value="Anual de contado">Anual de contado</option>
            <option value="Mensual (cuotas)">Mensual (cuotas)</option>
            <option value="Semestral">Semestral</option>
            <option value="Trimestral">Trimestral</option>
          </select>
        </div>
      </div>

      {/* Coberturas obligatorias */}
      <div className="mt-5 pt-4 border-t border-slate-100">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-[#002244]" />
            Coberturas obligatorias requeridas por el cliente
          </span>
          <span className="text-[11px] font-normal text-slate-500 lowercase">
            ({profile.mandatoryCoverages.length} seleccionadas)
          </span>
        </label>
        <p className="text-xs text-slate-500 mb-3">
          Regla técnica: Una aseguradora solo obtendrá "Cumple obligatorias: Sí" si TODAS estas coberturas están incluidas en la prima base (los paquetes opcionales con costo extra no cuentan).
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {COVERAGES_LIST.map((cov) => {
            const isChecked = profile.mandatoryCoverages.includes(cov.key);
            return (
              <label
                key={cov.key}
                onClick={() => toggleCoverage(cov.key)}
                className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                  isChecked
                    ? 'border-blue-700 bg-blue-50/60 shadow-xs ring-1 ring-blue-700/30'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => {}} // Handled by label click
                  className="mt-0.5 rounded text-blue-900 focus:ring-blue-700 h-4 w-4 shrink-0"
                />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-800">{cov.label}</div>
                  <div className="text-[11px] text-slate-500 leading-tight mt-0.5">{cov.desc}</div>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Prioridades (área de texto) */}
      <div className="mt-5 pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#002244]" />
            Prioridades del cliente
          </label>
          <span className="text-[11px] text-slate-500">
            Orientará la "Recomendación preliminar"
          </span>
        </div>
        <textarea
          name="priorities"
          rows={3}
          value={profile.priorities}
          onChange={handleTextChange}
          placeholder="Ej. Prioriza amplio respaldo de grúa y vehículo sustituto para no quedarse varado. Dispuesto a evaluar una prima ligeramente mayor si el respaldo de asistencia es completo."
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-700 focus:ring-2 focus:ring-blue-100 text-sm font-medium text-slate-800 bg-white placeholder:text-slate-400 outline-none transition-all resize-y"
        />
        <div className="flex flex-wrap gap-1.5 mt-2">
          <span className="text-[11px] text-slate-400 font-medium">Sugerencias rápidas:</span>
          {[
            'Mayor kilometraje de grúa y vehículo sustituto',
            'Menor deducible en colisión y robo',
            'Cuidar el presupuesto máximo de forma estricta',
            'Mayor límite en responsabilidad civil a terceros',
          ].map((snippet) => (
            <button
              key={snippet}
              type="button"
              onClick={() => onChange({ ...profile, priorities: snippet })}
              className="text-[11px] text-blue-800 bg-blue-50/80 hover:bg-blue-100 px-2 py-0.5 rounded-md border border-blue-200/60 cursor-pointer transition-colors"
            >
              + {snippet}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
