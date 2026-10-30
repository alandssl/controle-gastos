import { PagamentoInterface } from "./pagamento.interface";

export type CartaoInterface = {
    id: number;
    diaVencimento: number;
    valorFaturaMes: number;
    pagamento?: PagamentoInterface[];
    usuarioId: number;
}