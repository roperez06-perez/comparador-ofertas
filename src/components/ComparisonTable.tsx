import React from 'react';
import { 
  Check, 
  X, 
  AlertTriangle, 
  Shield, 
  DollarSign, 
  HelpCircle, 
  Wrench, 
  Car, 
  CloudRain, 
  Eye, 
  AlertOctagon,
  Sparkles
} from 'lucide-react';
import { ProposalComparison } from '../types';

interface ComparisonTableProps {
  comparisons: ProposalComparison[];
}

export const ComparisonTable: React.FC<ComparisonTableProps> = ({ comparisons }) => {
  if (!comparisons || comparisons.length === 0) {
    return null;
  }

  const renderSemaforo = (color: string, reason: string) => {
    const normalized = color?.toLowerCase() || '';
    if (normalized.includes('verde') || normalized === 'green') {
      return (
        <div className="flex flex-col items-center sm:items-start gap-1 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-emerald-500 shadow-sm shadow-emerald-400/50 ring-2 ring-emerald-200"></span>
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-800">
              Verde · Recomendable
            </span>
          </div>
          <p className="text-[11px] text-emerald-700 leading-tight mt-0.5">
            {reason || 'Cabe en presupuesto y cumple todas las coberturas obligatorias.'}
          </p>
        </div>
      );
    }
    if (normalized.includes('amarillo') || normalized === 'yellow') {
      return (
        <div className="flex flex-col items-center sm:items-start gap-1 p-2.5 rounded-xl bg-amber-50 border border-amber-200">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-amber-500 shadow-sm shadow-amber-400/50 ring-2 ring-amber-200"></span>
            <span className="text-xs font-extrabold uppercase tracking-wider text-amber-800">
              Amarillo · Sobre presupuesto
            </span>
          </div>
          <p className="text-[11px] text-amber-700 leading-tight mt-0.5">
            {reason || 'Cumple coberturas obligatorias pero supera el presupuesto fijado.'}
          </p>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center sm:items-start gap-1 p-2.5 rounded-xl bg-rose-50 border border-rose-200">
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-full bg-rose-500 shadow-sm shadow-rose-400/50 ring-2 ring-rose-200"></span>
          <span className="text-xs font-extrabold uppercase tracking-wider text-rose-800">
            Rojo · No cumple
          </span>
        </div>
        <p className="text-[11px] text-rose-700 leading-tight mt-0.5">
          {reason || 'No cumple con las coberturas obligatorias requeridas.'}
        </p>
      </div>
    );
  };

  const renderYesNoBadge = (val: string, positiveWhenYes = true) => {
    const isYes = val?.toLowerCase().startsWith('sí') || val?.toLowerCase().startsWith('si');
    const isPositive = positiveWhenYes ? isYes : !isYes;

    return (
      <div className="flex items-start gap-1.5">
        <span
          className={`inline-flex items-center justify-center w-5 h-5 rounded-full shrink-0 mt-0.5 ${
            isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
          }`}
        >
          {isPositive ? <Check className="w-3 h-3 stroke-[3]" /> : <X className="w-3 h-3 stroke-[3]" />}
        </span>
        <span className={`text-xs font-medium leading-relaxed ${isPositive ? 'text-slate-800' : 'text-rose-900 font-semibold'}`}>
          {val}
        </span>
      </div>
    );
  };

  const rows: {
    id: string;
    title: string;
    icon?: React.ReactNode;
    render: (c: ProposalComparison) => React.ReactNode;
    highlight?: boolean;
  }[] = [
    {
      id: 'prima_anual',
      title: 'Prima anual',
      icon: <DollarSign className="w-3.5 h-3.5 text-blue-900" />,
      highlight: true,
      render: (c) => (
        <div>
          <div className="text-base font-extrabold text-[#002244] font-mono tracking-tight">
            {c.prima_anual}
          </div>
        </div>
      ),
    },
    {
      id: 'cabe_en_presupuesto',
      title: 'Cabe en presupuesto',
      render: (c) => renderYesNoBadge(c.cabe_en_presupuesto, true),
    },
    {
      id: 'deducible_colision',
      title: 'Deducible colisión',
      render: (c) => <span className="text-xs text-slate-700 font-medium">{c.deducible_colision}</span>,
    },
    {
      id: 'deducible_robo',
      title: 'Deducible robo',
      render: (c) => <span className="text-xs text-slate-700 font-medium">{c.deducible_robo}</span>,
    },
    {
      id: 'rc_danos_terceros',
      title: 'RC daños a terceros',
      render: (c) => (
        <span className="text-xs font-semibold text-slate-800 font-mono">
          {c.rc_danos_terceros}
        </span>
      ),
    },
    {
      id: 'rc_lesiones',
      title: 'RC lesiones',
      render: (c) => (
        <span className="text-xs font-semibold text-slate-800 font-mono">
          {c.rc_lesiones}
        </span>
      ),
    },
    {
      id: 'asistencia_vial_24_7',
      title: 'Asistencia vial 24/7',
      render: (c) => {
        const text = c.asistencia_vial_24_7 || 'No indicado';
        const isNotIncluded = text.toLowerCase().includes('no') || text.toLowerCase().includes('opcional');
        return (
          <div className="text-xs">
            <span
              className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold mb-1 ${
                !isNotIncluded
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-900'
              }`}
            >
              {!isNotIncluded ? 'Incluida' : 'Con restricción / Opcional'}
            </span>
            <div className="text-slate-600 leading-tight">{text}</div>
          </div>
        );
      },
    },
    {
      id: 'grua',
      title: 'Grúa',
      render: (c) => <span className="text-xs text-slate-700 font-medium">{c.grua}</span>,
    },
    {
      id: 'vehiculo_sustituto',
      title: 'Vehículo sustituto',
      render: (c) => {
        const text = c.vehiculo_sustituto || 'No indicado';
        const hasIt = !text.toLowerCase().includes('no');
        return (
          <div className="text-xs">
            <span
              className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold mb-1 ${
                hasIt ? 'bg-blue-100 text-blue-900' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {hasIt ? 'Incluido' : 'No incluido'}
            </span>
            <div className="text-slate-600 leading-tight">{text}</div>
          </div>
        );
      },
    },
    {
      id: 'fenomenos_naturales',
      title: 'Fenómenos naturales',
      render: (c) => {
        const text = c.fenomenos_naturales || 'No indicado';
        const hasIt = !text.toLowerCase().includes('no') && !text.toLowerCase().includes('excluido');
        return (
          <div className="text-xs">
            <span
              className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold mb-1 ${
                hasIt ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}
            >
              {hasIt ? 'Cubierto' : 'No cubierto'}
            </span>
            <div className="text-slate-600 leading-tight">{text}</div>
          </div>
        );
      },
    },
    {
      id: 'rotura_cristales',
      title: 'Rotura de cristales',
      render: (c) => <span className="text-xs text-slate-700 font-medium">{c.rotura_cristales}</span>,
    },
    {
      id: 'exclusiones_destacadas',
      title: 'Exclusiones destacadas',
      render: (c) => (
        <p className="text-xs text-slate-600 leading-relaxed max-w-xs">
          {c.exclusiones_destacadas}
        </p>
      ),
    },
    {
      id: 'cumple_obligatorias',
      title: 'Cumple obligatorias',
      highlight: true,
      render: (c) => renderYesNoBadge(c.cumple_obligatorias, true),
    },
    {
      id: 'semaforo',
      title: 'Semáforo',
      highlight: true,
      render: (c) => renderSemaforo(c.semaforo, c.semaforo_razon),
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden transition-all">
      {/* Header bar */}
      <div className="bg-[#002244] text-white px-5 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-amber-400" />
          <h3 className="text-base font-bold tracking-tight">
            Tabla Comparativa de Cotizaciones ({comparisons.length} Aseguradoras)
          </h3>
        </div>
        <div className="flex items-center gap-2 text-xs text-blue-200">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span> Verde: Cabe y cumple
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 ml-2"></span> Amarillo: Cumple / Excede
          <span className="w-2.5 h-2.5 rounded-full bg-rose-400 ml-2"></span> Rojo: No cumple
        </div>
      </div>

      {/* Responsive Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="border-b-2 border-slate-200 bg-slate-100/80">
              <th className="py-4 px-4 sm:px-5 text-xs font-bold uppercase tracking-wider text-slate-600 w-1/4 sticky left-0 bg-slate-100/95 z-10 shadow-[1px_0_0_0_rgba(203,213,225,1)]">
                Parámetro / Cobertura
              </th>
              {comparisons.map((c, idx) => (
                <th
                  key={idx}
                  className="py-4 px-4 sm:px-5 text-slate-900 border-l border-slate-200 w-1/4 align-top"
                >
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-900 bg-blue-100/80 px-2 py-0.5 rounded self-start mb-1">
                      Propuesta #{idx + 1}
                    </span>
                    <span className="text-sm font-extrabold text-slate-900 tracking-tight">
                      {c.aseguradora}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {rows.map((row, index) => {
              const isEven = index % 2 === 0;
              const isSemaforoRow = row.id === 'semaforo';

              return (
                <tr
                  key={row.id}
                  className={`transition-colors ${
                    isSemaforoRow
                      ? 'bg-slate-50/90 font-medium'
                      : isEven
                      ? 'bg-white hover:bg-blue-50/20'
                      : 'bg-slate-50/50 hover:bg-blue-50/30'
                  }`}
                >
                  <td
                    className={`py-3.5 px-4 sm:px-5 text-xs font-bold text-slate-700 sticky left-0 z-10 shadow-[1px_0_0_0_rgba(226,232,240,1)] ${
                      isSemaforoRow
                        ? 'bg-slate-100'
                        : isEven
                        ? 'bg-white'
                        : 'bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      {row.icon}
                      <span>{row.title}</span>
                    </div>
                  </td>
                  {comparisons.map((c, colIndex) => (
                    <td
                      key={colIndex}
                      className={`py-3.5 px-4 sm:px-5 border-l border-slate-200 align-middle ${
                        isSemaforoRow ? 'py-4' : ''
                      }`}
                    >
                      {row.render(c)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
