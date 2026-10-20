import { GastoInterface } from "./gastos.interface";

export type UsuarioInterface = {
  id?: number;
  nome: string;
  diaSalario: number;
  salario: number;
  gastos?: GastoInterface[];
}
