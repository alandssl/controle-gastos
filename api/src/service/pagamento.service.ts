import { PrismaClient, TipoPagamento } from "../../generated/prisma/client";
import { PagamentoInterface } from "../interface/pagamento.interface";


export class PagamentoService{
    constructor(private prisma: PrismaClient){}

    async listarTodosPagamentos(){
        return await this.prisma.pagamento.findMany();
    }


    async listarPorDataPagamento(data: Date): Promise<PagamentoInterface[]>{
        const mes = data.getMonth();
        const ano = data.getFullYear();

        const inicio = new Date(ano, mes, 1);
        const final = new Date(ano, mes + 1, 1);

        const result = await this.prisma.pagamento.findMany({

            where:{
                dataPago: {
                    gte: inicio,
                    lt: final
                }
            }
        })

        return result;
    }

    async buscarPorPagamentoFeito(pago: boolean): Promise<PagamentoInterface[]>{
        const result = await this.prisma.pagamento.findMany({
            where:{
                pagamentoFeito: pago
            }
        })

        return result;

    }

    // Alterna entre pago e não pago. Pago = todas as parcelas quitadas.
    async mudarSituacaoPagamento(pagamentoId: number){
        const pagamento = await this.prisma.pagamento.findUnique({
            where: { id: Number(pagamentoId) }
        })

        if(pagamento === null){
            console.log('Pagamento não encontrado.');
            return null;
        }

        const totalParcelas = pagamento.parcelas && pagamento.parcelas > 0 ? pagamento.parcelas : 1;

        if(pagamento.pagamentoFeito){
            return await this.prisma.pagamento.update({
                where: { id: pagamento.id },
                data: {
                    pagamentoFeito: false,
                    dataPago: null,
                    parcelasPagas: 0,
                    valorPago: 0
                }
            })
        }

        return await this.prisma.pagamento.update({
            where: { id: pagamento.id },
            data: {
                pagamentoFeito: true,
                dataPago: new Date(),
                parcelasPagas: totalParcelas,
                valorPago: pagamento.valorTotal
            }
        })
    }

    // Paga uma parcela (ou define exatamente quantas parcelas estão pagas).
    // Ao quitar a última, a compra inteira fica como paga.
    async pagarParcela(pagamentoId: number, quantidade?: number){
        const pagamento = await this.prisma.pagamento.findUnique({
            where: { id: Number(pagamentoId) }
        })

        if(pagamento === null){
            return null;
        }

        const totalParcelas = pagamento.parcelas && pagamento.parcelas > 0 ? pagamento.parcelas : 1;
        const alvo = quantidade === undefined ? pagamento.parcelasPagas + 1 : quantidade;
        const parcelasPagas = Math.max(0, Math.min(totalParcelas, Math.floor(alvo)));
        const valorParcela = pagamento.valorParcela ?? (pagamento.valorTotal / totalParcelas);
        const quitado = parcelasPagas >= totalParcelas;

        return await this.prisma.pagamento.update({
            where: { id: pagamento.id },
            data: {
                parcelasPagas: parcelasPagas,
                valorPago: quitado ? pagamento.valorTotal : valorParcela * parcelasPagas,
                pagamentoFeito: quitado,
                dataPago: parcelasPagas > 0 ? new Date() : null
            }
        })
    }
    async criarPagamento(pagamento: PagamentoInterface & { gastoId?: number }): Promise<PagamentoInterface>{
        const pagamentoFeito = Boolean(pagamento.pagamentoFeito);
        const valorTotal = Number(pagamento.valorTotal);
        const parcelas = pagamento.parcelas ? Number(pagamento.parcelas) : null;

        const result = await this.prisma.pagamento.create({
            data: {
                valorPago: pagamento.valorPago ?? null,
                pagamentoFeito: pagamentoFeito,
                dataPago: pagamento.dataPago ? new Date(pagamento.dataPago) : (pagamentoFeito ? new Date() : null),
                tipoPagamento: pagamento.tipoPagamento,
                valorTotal: valorTotal,
                parcelas: parcelas,
                valorParcela: pagamento.valorParcela ?? (parcelas ? valorTotal / parcelas : null),
                cartaoId: pagamento.cartaoId ? Number(pagamento.cartaoId) : null,
                // vincula ao gasto, se o front informar qual
                ...(pagamento.gastoId ? { gastos: { connect: { id: Number(pagamento.gastoId) } } } : {})
            }
        })

        return result;
    }

    async valoresParcela(valorTotal: number, parcelas: number, idPagamento: number, cartaoId: number): Promise<PagamentoInterface>{
        const valorParcelas = valorTotal / parcelas;

        const result = await this.prisma.pagamento.update({
            where: {
                id: Number(idPagamento)
            },
            data: {
                valorTotal: valorTotal,
                parcelas: parcelas,
                valorParcela: valorParcelas,
                cartaoId: cartaoId
            }
        })

        return result;
    }
    async buscarPorTipoPagamento(tipoPagamento: TipoPagamento):Promise<PagamentoInterface[]>{
        const result = await this.prisma.pagamento.findMany({
            where:{
                tipoPagamento: tipoPagamento
            }
        })

        return result;
    }
}