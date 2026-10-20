import { PrismaClient } from "../../generated/prisma/client";
import { UsuarioInterface } from "../interface/usuario.interface";

export class UsuarioService {
    constructor(private prisma: PrismaClient) {}

    async criarUsuario(usuario: UsuarioInterface): Promise<UsuarioInterface> {
        const novoUsuario = await this.prisma.usuario.create({
            data:{
                nome: usuario.nome,
                salario: usuario.salario,
                diaSalario: usuario.diaSalario,
            }
        })

        return novoUsuario;
    }

    async buscarUsuarioPorId(id: number): Promise<UsuarioInterface | null> {
        const usuario = await this.prisma.usuario.findUnique({
            where: { id},
        })

        return usuario;
    }

    async buscarPorNome(nome: string): Promise<UsuarioInterface[]> {
        const usuarios: UsuarioInterface[] = await this.prisma.usuario.findMany({
            where: { 
                nome: { contains: nome } 
            },
        }) 
        
        return usuarios;     
    }

    async atualizarUsuario(id: number, usuario: UsuarioInterface): Promise<UsuarioInterface> {
        const usuarioAtualizado = await this.prisma.usuario.update({
            where: { id },
            data: {
                nome: usuario.nome,
                salario: usuario.salario,
                diaSalario: usuario.diaSalario,
            }
        })
        return usuarioAtualizado;
    }

    async deletarUsuario(id: number): Promise<UsuarioInterface>{
        const usuarioDeletado = await this.prisma.usuario.delete({
            where: { id },
        })

        return usuarioDeletado;
    }

    async listarUsuarios(): Promise<UsuarioInterface[]> {
        const usuarios: UsuarioInterface[] = await this.prisma.usuario.findMany();
        return usuarios;
    }

}