import { PrismaClient, TipoGasto } from "../../generated/prisma/client";
import { GastoInterface } from "../interface/gastos.interface";

export class GastosService {
    constructor(private prisma: PrismaClient) { }

    async adicionarGasto(gasto: GastoInterface): Promise<GastoInterface> {
        const gastoNovo = await this.prisma.gasto.create({
            data: {
                descricao: gasto.descricao,
                tipoGasto: gasto.tipoGasto,
                valorGasto: gasto.valorGasto,
                dataGasto: gasto.dataGasto,
                usuario: {
                    connect: { id: Number(gasto.usuarioId) }
                }
            }

        })

        return gastoNovo;
    }

    async buscarPorTipoGasto(tipoGasto: TipoGasto): Promise<GastoInterface[]> {
        const resposta = await this.prisma.gasto.findMany({
            where: { tipoGasto }
        })

        return resposta;
    }

    async buscarTodasContas(): Promise<GastoInterface[]> {
        return await this.prisma.gasto.findMany();
    }

    // buscar todas as contas do mes atual
    async buscarContasMesAtual(): Promise<GastoInterface[]> {
        const data = new Date();
        const mes = data.getMonth();
        const ano = data.getFullYear();

        const inicio = new Date(ano, mes, 1);
        const final = new Date(ano, mes + 1, 1);

        const gastosMesAtual = await this.prisma.gasto.findMany({
            where: {
                dataGasto: {
                    gte: inicio,
                    lt: final
                }
            }
        });

        return gastosMesAtual
    }

    // buscar TODAS as contas do usuario
    async buscarTodasContasUsuario(usuarioId: number) {
        const contasUsuario = await this.prisma.gasto.findMany({
            where: {
                usuarioId: usuarioId
            }
        })

        return contasUsuario;
    }

    // tambem filtar por mes as contas
    async buscarContasPorMes(dataRecebida: Date): Promise<GastoInterface[]> {
        const mes = dataRecebida.getMonth();
        const ano = dataRecebida.getFullYear();

        const inicio = new Date(ano, mes, 1); //ano q veio, mes q veio e dia 1
        const final = new Date(ano, mes + 1, 1); //ano q veio, proximo mes e dia 1

        const result = await this.prisma.gasto.findMany({
            where: {
                dataGasto: {
                    gte: inicio,
                    lt: final
                }
            }
        })

        return result;

    }

    async buscarTipoGastoEMes(data: Date, tipoGasto: TipoGasto): Promise<GastoInterface[]> {
        const mes = data.getMonth();
        const ano = data.getFullYear();

        const inicio = new Date(ano, mes, 1);
        const final = new Date(ano, mes + 1, 1);


        const result = await this.prisma.gasto.findMany({
            where: {
                tipoGasto: tipoGasto,
                dataGasto: {
                    gte: inicio,
                    lt: final
                }
            }
        })

        return result;
    }

    async buscarGastoPorDescricao(descricaoRecebida: string): Promise<GastoInterface[]> {
        const result = await this.prisma.gasto.findMany({
            where: {
                descricao: { contains: descricaoRecebida },
            }
        })

        return result;
    }

    async deletarGasto(id: number): Promise<GastoInterface> {
        const gastoDeletado = await this.prisma.gasto.delete({
            where: { id }
        })

        return gastoDeletado;
    }


    async desvincularPagamento(id: number): Promise<GastoInterface> {
        return await this.prisma.gasto.update({
            where: { id },
            data: { pagamentoId: null }
        });
    }
}