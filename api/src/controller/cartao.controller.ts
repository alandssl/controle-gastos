import { Request, Response } from "express";
import { CartaoService } from "../service/cartao.service";


export class CartaoController {
    constructor(private service: CartaoService) { }

    async buscarPorId(req: Request, res: Response) {
        try {
            const cartao = await this.service.buscarCartaoPorId(Number(req.params.id));
            return res.status(200).json(cartao);
        } catch (error) {
            console.error("Erro ao buscar cartao por id:", error);
            return res.status(500).json({ message: "Erro ao buscar cartao" });
        }
    }

    async postCartao(req: Request, res: Response) {
        try {
            const cartao = await this.service.criarCartao(req.body);
            return res.status(200).json(cartao);
        } catch (error) {
            console.error("Erro ao criar cartao:", error);
            return res.status(500).json({ message: "Erro ao criar cartao" });
        }
    }

    async buscarPorUsuario(req: Request, res: Response) {
        try {
            const cartoes = await this.service.buscarCartoesPorUsuario(Number(req.params.usuarioId));
            return res.status(200).json(cartoes);
        } catch (error) {
            console.error("Erro ao buscar cartoes do usuario:", error);
            return res.status(500).json({ message: "Erro ao buscar cartoes" });
        }
    }

    async deletarCartao(req: Request, res: Response) {
        try {
            const cartao = await this.service.deletarCartao(Number(req.params.id));
            return res.status(200).json(cartao);
        } catch (error) {
            console.error("Erro ao deletar cartao:", error);
            return res.status(500).json({ message: "Erro ao deletar cartao (verifique se há pagamentos vinculados)" });
        }
    }
}