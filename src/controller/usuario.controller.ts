import { Request, Response } from "express";
import { UsuarioService } from "../service/usuario.service";
import { REPLCommand } from "node:repl";


export class UsuarioController {
    constructor(private usuarioService: UsuarioService) {}

    async postUsuario(req: Request, res: Response){
        try {
            const usuario = req.body;
             
            if (!usuario.nome || !usuario.diaSalario || !usuario.salario) {
                return res.status(400).json({ error: "Campos obrigatórios ausentes" });
            }

            const novoUsuario = await this.usuarioService.criarUsuario(usuario);
            return res.status(201).json(novoUsuario);

        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Erro ao criar usuário" });
        }
    }
    
    async getUsuario(req: Request, res: Response){
        try {
            const nomeRecebido = req.query.nome as string | undefined;

            const buscaUsuario = nomeRecebido
            ? await this.usuarioService.buscarPorNome(nomeRecebido)
            : await this.usuarioService.listarUsuarios();

            return res.status(200).json(buscaUsuario);

        } catch (err){
            console.log(err);
            res.status(500).json({err: "Erro ao buscar usuário"})
            throw err;
        }
    }

    async putUsuario(req: Request, res: Response){
        try {
            const usuarioAtualiza = req.body;

            const usuarioAtualizado = await this.usuarioService.atualizarUsuario(usuarioAtualiza.id ,usuarioAtualiza);
            return res.status(200).json(usuarioAtualizado);

        } catch (err){
            console.log(err);
            res.status(500).json({err: "Erro ao atualizar usuário"})
            throw err;           

        }
    }

    async deleteUsuario(req: Request, res: Response){
        try {   
            const usuarioDeletado = await this.usuarioService.deletarUsuario(Number(req.params.id));
            return res.status(200).json(usuarioDeletado);

        }catch (err){
            console.log(err);
            res.status(500).json({err: "Erro ao deletar usuário"})
            throw err; 
        }

    }

}
