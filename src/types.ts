export interface AppUser {
  id: string;
  usuario: string;
  nombreCompleto: string;
  rol: 'administrador' | 'asesor';
  estado: 'activo' | 'suspendido';
  debeCambiarClave: boolean;
  fechaCreacion: string;
  ultimoAcceso: string | null;
}

export interface UploadedProposal {
  id: string;
  name: string;
  base64: string;
  size?: number;
  companyName?: string;
}

export type MandatoryCoverageKey = 
  | 'colision'
  | 'robo'
  | 'asistencia_vial'
  | 'fenomenos_naturales'
  | 'vehiculo_sustituto';

export interface ClientProfile {
  name: string;
  vehicleAndUse: string;
  maxBudget: number;
  mandatoryCoverages: MandatoryCoverageKey[];
  priorities: string;
  preferredPayment: string;
}

export interface ProposalComparison {
  id?: string;
  aseguradora: string;
  prima_anual: string;
  prima_anual_numerica: number;
  cabe_en_presupuesto: string;
  deducible_colision: string;
  deducible_robo: string;
  rc_danos_terceros: string;
  rc_lesiones: string;
  asistencia_vial_24_7: string;
  grua: string;
  vehiculo_sustituto: string;
  fenomenos_naturales: string;
  rotura_cristales: string;
  exclusiones_destacadas: string;
  cumple_obligatorias: string;
  semaforo: 'verde' | 'amarillo' | 'rojo' | string;
  semaforo_razon: string;
}

export interface ComparisonResponse {
  comparisons: ProposalComparison[];
  recomendacion_preliminar: string;
  mensaje_whatsapp: string;
}
