import { Router } from "express";
import { prisma } from "../config/prisma";
import { CartaoController } from "../controller/cartao.controller";
import { CartaoService } from "../service/cartao.service";


const service = new CartaoService(prisma);
const controller = new CartaoController(service);

export const cartaoRouter = Router()

cartaoRouter.get('/usuario/:usuarioId', (req, res) => controller.buscarPorUsuario(req, res));
cartaoRouter.delete('/:id', (req, res) => controller.deletarCartao(req, res));
cartaoRouter.get('/:id', (req, res) => controller.buscarPorId(req, res));
cartaoRouter.post('/criar', (req, res) => controller.postCartao(req, res));