import { TipoGasto } from "../../generated/prisma/enums";

export type GastoInterface = {
  id: number;
  descricao: string;
  tipoGasto: TipoGasto;
  valorGasto: number;
  dataGasto: Date;
  usuarioId: number;
  pagamentoId?: number | null;
}