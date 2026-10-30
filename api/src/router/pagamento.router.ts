import { Router } from "express";
import { prisma } from "../config/prisma";
import { PagamentoController } from "../controller/pagamento.controller";
import { PagamentoService } from "../service/pagamento.service";


const service = new PagamentoService(prisma);
const controller = new PagamentoController(service);

export const pagamentoRouter = Router();

pagamentoRouter.get('/all', (req, res) => controller.getAllPagamento(req, res));
pagamentoRouter.get('/data', (req, res) => controller.getDataPagamento(req, res));
pagamentoRouter.get('/pago', (req, res) => controller.getPagamentoFeito(req, res));
pagamentoRouter.put('/situacao/:id', (req, res) => controller.putSituacaoPagamento(req, res));
pagamentoRouter.put('/parcela/:id', (req, res) => controller.putPagarParcela(req, res));
pagamentoRouter.post('/criarPagamento', (req, res) => controller.postPagamento(req, res));
pagamentoRouter.put('/valorParcela/:idPagamento/:idCartao', (req, res) => controller.postValorParcelas(req, res));
pagamentoRouter.get('/tipoPag', (req, res) => controller.getTipoPagamento(req, res));