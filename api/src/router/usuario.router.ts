import { Router } from "express";
import { prisma } from "../config/prisma";
import { UsuarioController } from "../controller/usuario.controller";
import { UsuarioService } from "../service/usuario.service";

const service = new UsuarioService(prisma);
const usuarioController = new UsuarioController(service);

export const usuarioRouter = Router();

usuarioRouter.post('/criar', (req, res) => usuarioController.postUsuario(req, res));
usuarioRouter.get('/buscar', (req, res) => usuarioController.getUsuario(req, res));
usuarioRouter.put('/atualizar', (req, res) => usuarioController.putUsuario(req, res))
usuarioRouter.delete('/deletar/:id', (req, res) => usuarioController.deleteUsuario(req, res));