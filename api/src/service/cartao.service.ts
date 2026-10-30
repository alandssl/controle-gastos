import { PrismaClient } from "../../generated/prisma/client";
import { CartaoInterface } from "../interface/cartao.interface";


export class CartaoService {
    constructor(private prisma: PrismaClient) { }

    async criarCartao(cartao: CartaoInterface): Promise<CartaoInterface> {
        const novoCartao = await this.prisma.cartao.create({
            data: {
                diaVencimento: cartao.diaVencimento,
                valorFaturaMes: cartao.valorFaturaMes,
                usuarioId: cartao.usuarioId,
            },
        });
        return novoCartao;
    }

    async buscarCartaoPorId(id: number) {
        const cartao = await this.prisma.cartao.findUnique({
            where: {
                id: id
            }
        });
        return cartao;
    }

    async buscarCartoesPorUsuario(usuarioId: number) {
        return await this.prisma.cartao.findMany({
            where: { usuarioId }
        });
    }

    async deletarCartao(id: number) {
        return await this.prisma.cartao.delete({
            where: { id }
        });
    }
}