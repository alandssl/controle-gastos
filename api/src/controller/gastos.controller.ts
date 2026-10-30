import { Request, Response } from "express";
import { GastosService } from "../service/gastos.service";
import { TipoGasto } from "../../generated/prisma/enums";


export class GastosController {
    constructor(private service: GastosService) { }

    async postGasto(req: Request, res: Response) {
        try {
            const novoGasto = req.body;
            const result = await this.service.adicionarGasto(novoGasto)

            return res.status(200).json(result)
        } catch (err) {
            console.log('Erro ao salvar novo gasto', err);
            res.status(400).json(err);}
    }

    async getTipoGasto(req: Request, res: Response) {
        try {
            const tipoGasto = req.query.tipoGasto as TipoGasto;
            const result = await this.service.buscarPorTipoGasto(tipoGasto)

            return res.status(200).json(result);

        } catch (err) {
            console.log('Erro ao buscar por Tipo Gasto', err);
            res.status(400).json(err);}

    }

    async getTodasContas(req: Request, res: Response) {
        try {
            const result = await this.service.buscarTodasContas();
            return res.status(200).json(result);
        } catch (err) {
            console.log('Erro ao buscar todas as contas', err);
            return res.status(500).json(err);
        }
    }

    async getContaMesAtual(req: Request, res: Response) {
        try {
            const result = await this.service.buscarContasMesAtual();

            return res.status(200).json(result);
        } catch (err) {
            console.log('Erro ao buscar a data Atual', err);
            res.status(400).json(err);}



    }

    async getContasUsuario(req: Request, res: Response) {
        try {
            const usuario = Number(req.params.usuarioId);

            const result = await this.service.buscarTodasContasUsuario(usuario);

            return res.status(200).json(result);

        } catch (err) {
            console.log('Erro ao buscar gasto por Usuário', err);
            res.status(400).json(err);}
    }

    async getContasMes(req: Request, res: Response) {
        try {
            const recebido = req.query.dataGasto as string;
            const dataFormat = new Date(recebido);

            if (isNaN(dataFormat.getTime())) {
                return res.status(400).json({ erro: "Data inválida. Use o formato AAAA-MM-DD" });
            }
            const result = await this.service.buscarContasPorMes(dataFormat)

            return res.status(200).json(result);
        } catch (err) {
            console.error(err);
            return res.status(500).json({ erro: "Erro ao buscar contas do mês" });
        }
    }

    async getGastoPorTipoMes(req: Request, res: Response) {
        try {
            const tipo = req.query.TipoGasto as TipoGasto;
            const dataRecebida = req.query.dataGasto as string;

            if (!tipo) {
                console.log('Erro ao buscar por tiop, coloquen um tipo válido')
                return res.status(400).json({ erro: "Data inválida. Use o formato AAAA-MM-DD" });
            }

            const dataFormat = new Date(dataRecebida);
            const result = this.service.buscarTipoGastoEMes(dataFormat, tipo);

            return res.status(200).json(result);
        } catch (err) {
            console.error(err);
            return res.status(500).json({ erro: "Erro ao buscar contas do mês e tipo" });
        }

    }

    async getCategorias(req: Request, res: Response) {
        try {
            const descricao = req.params.descricao as string;

            const result = await this.service.buscarGastoPorDescricao(descricao);

            return res.status(200).json(result);

        } catch (err) {
            console.error(err);
            return res.status(500).json({ erro: "Erro ao buscar contas por descrição" });
        }
    }

    async deleteGasto(req: Request, res: Response) {
        try {
            const id = Number(req.params.id);

            const result = await this.service.deletarGasto(id);
            return res.status(200).json(result);

        } catch (err) {
            console.error('Erro ao deletar conta', err);
            return res.status(500).json({ erro: 'Erro ao deletar conta' });
        }
    }

    async desvincularPagamento(req: Request, res: Response) {
        const id = Number(req.params.id);

        if (isNaN(id)) {
            return res.status(400).json({ erro: "Id do gasto inválido" });
        }

        try {
            const result = await this.service.desvincularPagamento(id);
            return res.status(200).json(result);
        } catch (err) {
            console.error('Erro ao desvincular pagamento', err);
            return res.status(500).json({ erro: 'Erro ao desvincular pagamento' });
        }
    }
}