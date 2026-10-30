import { TipoPagamento } from "../../generated/prisma/enums";

export type PagamentoInterface = {
    id: number;
    valorPago: number | null;
    dataPago?: Date | null;
    pagamentoFeito: boolean;
    tipoPagamento: TipoPagamento | null;
    cartaoId?: number | null;
    parcelas: number | null;
    valorParcela: number | null;
    parcelasPagas?: number;
    valorTotal: number
}