import { PagamentoInterface } from "./pagamento.interfacce";

export type GastoInterface = {
  id: number;
  descricao: string;
  tipoGasto: string;
  valorGasto: number;
  dataGasto: Date;
  usuarioId: number;
  pagamentos: PagamentoInterface[];
}