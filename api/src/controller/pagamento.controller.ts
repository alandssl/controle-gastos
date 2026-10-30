import { Request, Response } from "express";
import { PagamentoService } from "../service/pagamento.service";
import { TipoPagamento } from "../../generated/prisma/enums";


export class PagamentoController{
    constructor(private service: PagamentoService){}

    async getAllPagamento(req: Request, res: Response){
        try {
            const payload = await this.service.listarTodosPagamentos();

            return res.status(200).json(payload);
        } catch(err){
            console.log('Erro ao buscar Pagamentos', err);
            return res.status(500).json({ mensagem: 'Erro ao buscar Pagamentos' });
        }
    }

    async getDataPagamento(req: Request, res: Response){
        const data = req.query.dataPagamento as string;
        const formatData = new Date(data);

        if(isNaN(formatData.getTime())){
            return res.status(400).json({erro: "Data inválida, mande no formato AAAA-MM-DD"});
        }

        try {
            const payload = await this.service.listarPorDataPagamento(formatData)

            return res.status(200).json(payload);

        }catch (err){
            console.log('Erro ao buscar Pagamentos por data', err);
            return res.status(500).json({ mensagem: 'Erro ao buscar Pagamentos por data' });
        }

    }

    async getPagamentoFeito(req: Request, res: Response){
        const parametro = req.query.pagamentoFeito;
        if(parametro !== 'true' && parametro !== 'false'){
            return res.status(400).json({
                mensagem: 'O parametro pagamentoFeito deve ser true ou false'
            });
        }

        const pago = parametro === 'true'

        try {
            const payload = await this.service.buscarPorPagamentoFeito(pago)

            return res.status(200).json(payload);

        }catch (err){
            console.log('Erro ao buscar Pagamentos por situação', err);
            return res.status(500).json({ mensagem: 'Erro ao buscar Pagamentos' });
        }
    }

    async putSituacaoPagamento(req: Request, res: Response){
        const idPagamento = Number(req.params.id);

        if(isNaN(idPagamento)){
            return res.status(400).json({ mensagem: 'Id do pagamento inválido' });
        }

        try {
            const payload = await this.service.mudarSituacaoPagamento(idPagamento);

            if(!payload){
                return res.status(404).json({
                    mensagem: 'Pagamento não encontrado ou sem valor pago para marcar como pago'
                });
            }

            return res.status(200).json(payload);

        }catch (err){
            console.log('Erro ao mudar Situação do Pagamento', err);
            return res.status(500).json({ mensagem: 'Erro ao mudar situação do Pagamento' });
        }
    }

    async postPagamento(req: Request, res: Response){
        const pagamento = req.body;

        if(pagamento?.valorTotal === undefined || pagamento.valorTotal === null || isNaN(Number(pagamento.valorTotal))){
            return res.status(400).json({ mensagem: 'valorTotal é obrigatório e deve ser numérico' });
        }

        try {
            const payload = await this.service.criarPagamento(pagamento);

            return res.status(201).json(payload)

        }catch (err){
            console.log('Erro ao criar Pagamento', err);
            return res.status(500).json({ mensagem: 'Erro ao criar Pagamento' });
        }
    }

    async postValorParcelas(req: Request, res: Response){
        const pagamentoId = Number(req.params.idPagamento);
        const cartaoId = Number(req.params.idCartao);
        const valorTotal = Number(req.body.valorTotal);
        const parcelas = Number(req.body.parcelas);

        if(isNaN(pagamentoId) || isNaN(cartaoId) || isNaN(valorTotal) || isNaN(parcelas) || parcelas < 1){
            return res.status(400).json({
                mensagem: 'Os parametros passados não estão corretos'
            });
        }
        try {

            const payload = await this.service.valoresParcela(valorTotal, parcelas, pagamentoId, cartaoId);
            return res.status(200).json(payload)

        }catch (err){
            console.log('Erro ao criar valores de parcelas para pagamento', err);
            return res.status(500).json({ mensagem: 'Erro ao atualizar parcelas do Pagamento' });
        }
    }

    async getTipoPagamento(req: Request, res: Response){
        const tipoPag = req.query.tipoPagamento as TipoPagamento;

        if(!['DEBITO', 'PIX', 'CREDITO'].includes(tipoPag)){
            return res.status(400).json({ mensagem: 'tipoPagamento deve ser DEBITO, PIX ou CREDITO' });
        }

         try {
            const payload = await this.service.buscarPorTipoPagamento(tipoPag);

            return res.status(200).json(payload)

        }catch (err){
            console.log('Erro ao buscar pelo tipo de Pagamento', err);
            return res.status(500).json({ mensagem: 'Erro ao buscar Pagamentos' });
        }
    }

    async putPagarParcela(req: Request, res: Response){
        const idPagamento = Number(req.params.id);

        if(isNaN(idPagamento)){
            return res.status(400).json({ mensagem: 'Id do pagamento inválido' });
        }

        try {
            const quantidade = req.body?.parcelasPagas;

            if(quantidade !== undefined && (isNaN(Number(quantidade)) || Number(quantidade) < 0)){
                return res.status(400).json({ mensagem: 'parcelasPagas deve ser um número maior ou igual a zero' });
            }

            const payload = await this.service.pagarParcela(idPagamento, quantidade === undefined ? undefined : Number(quantidade));

            if(!payload){
                return res.status(404).json({ mensagem: 'Pagamento não encontrado' });
            }

            return res.status(200).json(payload);

        }catch (err){
            console.log('Erro ao pagar parcela', err);
            return res.status(500).json({ mensagem: 'Erro ao pagar parcela' });
        }
    }
}