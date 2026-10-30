import type { Gasto, TipoGasto, TipoPagamento } from '../types';

/**
 * Um lançamento é o que vence em UM mês: uma parcela do cartão, ou a compra
 * inteira (PIX, débito ou sem pagamento vinculado).
 */
export interface LancamentoMensal {
  key: string;
  gastoId: number;
  usuarioId: number;
  descricao: string;
  tipoGasto: TipoGasto;
  tipoPagamento: TipoPagamento | null;
  pagamentoId: number | null;
  /** Parcela deste lançamento (1 para compras à vista) */
  parcelaNumero: number;
  totalParcelas: number;
  parcelasPagas: number;
  valor: number;
  month: number;
  year: number;
  paga: boolean;
  semPagamento: boolean;
  /** Compra inteira quitada (todas as parcelas pagas) */
  compraQuitada: boolean;
}

export const MESES_NOMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export const gerarLancamentos = (gastos: Gasto[]): LancamentoMensal[] => {
  const lista: LancamentoMensal[] = [];

  gastos.forEach((g) => {
    const compra = g.dataGasto ? new Date(g.dataGasto) : new Date();
    const baseYear = isNaN(compra.getTime()) ? new Date().getFullYear() : compra.getFullYear();
    const baseMonth = isNaN(compra.getTime()) ? new Date().getMonth() : compra.getMonth();
    const valorGasto = Number(g.valorGasto) || 0;
    const pagamento = g.pagamentos?.[0];

    if (!pagamento) {
      lista.push({
        key: `${g.id}-sem`,
        gastoId: g.id,
        usuarioId: g.usuarioId,
        descricao: g.descricao,
        tipoGasto: g.tipoGasto,
        tipoPagamento: null,
        pagamentoId: null,
        parcelaNumero: 1,
        totalParcelas: 1,
        parcelasPagas: 0,
        valor: valorGasto,
        month: baseMonth,
        year: baseYear,
        paga: false,
        semPagamento: true,
        compraQuitada: false,
      });
      return;
    }

    const parcelado = pagamento.tipoPagamento === 'CREDITO';
    const totalParcelas = parcelado ? Math.max(1, Number(pagamento.parcelas) || 1) : 1;
    const quitada = Boolean(pagamento.pagamentoFeito);
    const parcelasPagas = quitada
      ? totalParcelas
      : Math.min(totalParcelas, Math.max(0, Number(pagamento.parcelasPagas) || 0));
    const valorParcela = totalParcelas > 1
      ? (Number(pagamento.valorParcela) || valorGasto / totalParcelas)
      : valorGasto;

    for (let i = 0; i < totalParcelas; i++) {
      const data = new Date(baseYear, baseMonth + i, 1);
      lista.push({
        key: `${g.id}-${i + 1}`,
        gastoId: g.id,
        usuarioId: g.usuarioId,
        descricao: g.descricao,
        tipoGasto: g.tipoGasto,
        tipoPagamento: pagamento.tipoPagamento || null,
        pagamentoId: pagamento.id,
        parcelaNumero: i + 1,
        totalParcelas,
        parcelasPagas,
        valor: valorParcela,
        month: data.getMonth(),
        year: data.getFullYear(),
        paga: i < parcelasPagas,
        semPagamento: false,
        compraQuitada: quitada,
      });
    }
  });

  return lista;
};

export const chaveMes = (year: number, month: number) => year * 12 + month;

