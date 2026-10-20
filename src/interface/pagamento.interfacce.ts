export type PagamentoInterface = {
    id: number;
    valorPago: number;
    dataPago: Date;
    pagamentoFeito: boolean;
    tipoPagamento: string;
    cartao: string;
    gastoId: number;
    parcelas: number;
    valorParcela: number;
}