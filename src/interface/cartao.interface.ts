import { PagamentoInterface } from "./pagamento.interfacce";

export type CartaoInterface = {
    id: number;
    diaVencimento: number;
    valorFaturMes: number;
    pagamento: PagamentoInterface[];
    usuarioId: number;
}