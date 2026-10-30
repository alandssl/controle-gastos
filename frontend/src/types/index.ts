export type TipoGasto = 
  | 'ALIMENTACAO' 
  | 'TRANSPORTE' 
  | 'COMPRAS' 
  | 'LAZER' 
  | 'SAUDE' 
  | 'CASA' 
  | 'OUTROS';

export type TipoPagamento = 
  | 'DEBITO' 
  | 'PIX' 
  | 'CREDITO';

export interface Pagamento {
  id: number;
  valorPago?: number;
  dataPago?: string | null;
  pagamentoFeito: boolean;
  tipoPagamento?: TipoPagamento;
  cartao?: string;
  gastoId: number;
  parcelas?: number;
  valorParcela?: number;
}

export interface Gasto {
  id: number;
  descricao: string;
  tipoGasto: TipoGasto;
  valorGasto: number;
  dataGasto: string;
  usuarioId: number;
  pagamentos: Pagamento[];
}

export interface Usuario {
  id: number;
  nome: string;
  salario: number;
  diaSalario: number;
  gastos?: Gasto[];
  createdAt?: string;
}

export interface FinancialSummary {
  totalSalario: number;
  totalGastos: number;
  totalPago: number;
  totalPendente: number;
  saldoRestante: number;
  percentualComprometido: number;
  diasParaProximoSalario: number;
  proximaDataSalario: string;
  porCategoria: Record<TipoGasto, { total: number; count: number; percentual: number }>;
  porTipoPagamento: Record<TipoPagamento, { total: number; count: number }>;
}

export type ActiveTab = 'dashboard' | 'usuarios' | 'gastos' | 'pagamentos' | 'websocket';

export interface WsMessagePayload {
  type: 'USER_CREATED' | 'USER_UPDATED' | 'USER_DELETED' | 'GASTO_ADDED' | 'GASTO_UPDATED' | 'GASTO_DELETED' | 'PAGAMENTO_TOGGLED' | 'SYNC_ALL' | 'PING' | 'PONG';
  data?: any;
  timestamp: string;
  source?: string;
}

export const TYPES_LOADED = true;
