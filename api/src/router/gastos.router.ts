import { Router } from "express";
import { prisma } from "../config/prisma";
import { GastosController } from "../controller/gastos.controller";
import { GastosService } from "../service/gastos.service";


const service = new GastosService(prisma);
const controller = new GastosController(service);

export const gastosRouter = Router()

gastosRouter.post('/criar', (req, res) => controller.postGasto(req, res));
gastosRouter.get('/tipoGasto', (req, res) => controller.getTipoGasto(req, res));
gastosRouter.get('/todosGastos', (req, res) => controller.getTodasContas(req, res));
gastosRouter.get('/mesAtual', (req, res) => controller.getContaMesAtual(req, res));
gastosRouter.get('/usuarioContas/:usuarioId', (req, res) => controller.getContasUsuario(req, res));
gastosRouter.get('/contaMes', (req, res) => controller.getContasMes(req, res));
gastosRouter.get('/mesTipo', (req, res) => controller.getGastoPorTipoMes(req, res));
gastosRouter.delete('/deletar/:id', (req, res) => controller.deleteGasto(req, res));
gastosRouter.put('/desvincular/:id', (req, res) => controller.desvincularPagamento(req, res));
gastosRouter.get('/buscar/:descricao', (req, res) => controller.getCategorias(req, res));