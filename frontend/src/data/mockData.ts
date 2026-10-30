import type { Gasto, Usuario } from '../types';

export const INITIAL_MOCK_USERS: Usuario[] = [
  {
    id: 1,
    nome: "Alan Duarte",
    salario: 6500.0,
    diaSalario: 5,
  },
  {
    id: 2,
    nome: "Mariana Silva",
    salario: 4800.0,
    diaSalario: 10,
  },
  {
    id: 3,
    nome: "Carlos Eduardo",
    salario: 8200.0,
    diaSalario: 20,
  }
];

export const INITIAL_MOCK_GASTOS: Gasto[] = [
  {
    id: 101,
    descricao: "Supermercado Mensal Pão de Açúcar",
    tipoGasto: "ALIMENTACAO",
    valorGasto: 890.50,
    dataGasto: "2026-10-06T14:30:00Z",
    usuarioId: 1,
    pagamentos: [
      {
        id: 201,
        valorPago: 890.50,
        dataPago: "2026-10-06T14:35:00Z",
        pagamentoFeito: true,
        tipoPagamento: "PIX",
        gastoId: 101,
      }
    ]
  },
  {
    id: 102,
    descricao: "Aluguel & Condomínio Edifício Horizon",
    tipoGasto: "CASA",
    valorGasto: 1950.00,
    dataGasto: "2026-10-10T09:00:00Z",
    usuarioId: 1,
    pagamentos: [
      {
        id: 202,
        valorPago: 1950.00,
        dataPago: null,
        pagamentoFeito: false,
        tipoPagamento: "PIX",
        gastoId: 102,
      }
    ]
  },
  {
    id: 103,
    descricao: "Combustível Shell V-Power",
    tipoGasto: "TRANSPORTE",
    valorGasto: 280.00,
    dataGasto: "2026-10-12T18:15:00Z",
    usuarioId: 1,
    pagamentos: [
      {
        id: 203,
        valorPago: 280.00,
        dataPago: "2026-10-12T18:16:00Z",
        pagamentoFeito: true,
        tipoPagamento: "DEBITO",
        cartao: "Visa Santander Débito",
        gastoId: 103,
      }
    ]
  },
  {
    id: 104,
    descricao: "Plano de Saúde Unimed Família",
    tipoGasto: "SAUDE",
    valorGasto: 540.00,
    dataGasto: "2026-10-15T11:00:00Z",
    usuarioId: 1,
    pagamentos: [
      {
        id: 204,
        valorPago: 540.00,
        dataPago: "2026-10-15T11:05:00Z",
        pagamentoFeito: true,
        tipoPagamento: "DEBITO",
        cartao: "Itaú Personalité",
        gastoId: 104,
      }
    ]
  },
  {
    id: 105,
    descricao: "Notebook Dell Inspiron Core i7 (Parcela 3/10)",
    tipoGasto: "COMPRAS",
    valorGasto: 4200.00,
    dataGasto: "2026-10-18T16:00:00Z",
    usuarioId: 1,
    pagamentos: [
      {
        id: 205,
        valorPago: 420.00,
        dataPago: null,
        pagamentoFeito: false,
        tipoPagamento: "CREDITO",
        cartao: "Nubank Ultravioleta Mastercard",
        parcelas: 10,
        valorParcela: 420.00,
        gastoId: 105,
      }
    ]
  },
  {
    id: 106,
    descricao: "Jantar Especial Bistrô Paris 6",
    tipoGasto: "LAZER",
    valorGasto: 320.00,
    dataGasto: "2026-10-18T21:40:00Z",
    usuarioId: 1,
    pagamentos: [
      {
        id: 206,
        valorPago: 320.00,
        dataPago: "2026-10-18T23:10:00Z",
        pagamentoFeito: true,
        tipoPagamento: "CREDITO",
        cartao: "Nubank Ultravioleta Mastercard",
        parcelas: 1,
        valorParcela: 320.00,
        gastoId: 106,
      }
    ]
  },
  {
    id: 107,
    descricao: "Internet Fibra Vivo 600 Mega",
    tipoGasto: "CASA",
    valorGasto: 139.90,
    dataGasto: "2026-10-22T08:00:00Z",
    usuarioId: 1,
    pagamentos: [
      {
        id: 207,
        valorPago: 139.90,
        dataPago: null,
        pagamentoFeito: false,
        tipoPagamento: "PIX",
        gastoId: 107,
      }
    ]
  },
  {
    id: 108,
    descricao: "Assinaturas Streaming (Netflix + Spotify + HBO)",
    tipoGasto: "LAZER",
    valorGasto: 94.70,
    dataGasto: "2026-10-25T10:00:00Z",
    usuarioId: 1,
    pagamentos: [
      {
        id: 208,
        valorPago: 94.70,
        dataPago: null,
        pagamentoFeito: false,
        tipoPagamento: "CREDITO",
        cartao: "Inter Black Mastercard",
        parcelas: 1,
        valorParcela: 94.70,
        gastoId: 108,
      }
    ]
  },
  {
    id: 109,
    descricao: "Farmácia Drogasil - Medicamentos e Vitaminas",
    tipoGasto: "SAUDE",
    valorGasto: 145.30,
    dataGasto: "2026-10-14T17:20:00Z",
    usuarioId: 1,
    pagamentos: [
      {
        id: 209,
        valorPago: 145.30,
        dataPago: "2026-10-14T17:22:00Z",
        pagamentoFeito: true,
        tipoPagamento: "DEBITO",
        cartao: "Visa Santander Débito",
        gastoId: 109,
      }
    ]
  },
  {
    id: 110,
    descricao: "Mensalidade Academia SmartFit",
    tipoGasto: "SAUDE",
    valorGasto: 129.90,
    dataGasto: "2026-10-15T07:00:00Z",
    usuarioId: 2,
    pagamentos: [
      {
        id: 210,
        valorPago: 129.90,
        dataPago: "2026-10-15T07:05:00Z",
        pagamentoFeito: true,
        tipoPagamento: "CREDITO",
        cartao: "C6 Carbon Mastercard",
        parcelas: 1,
        valorParcela: 129.90,
        gastoId: 110,
      }
    ]
  },
  {
    id: 111,
    descricao: "Supermercado Carrefour",
    tipoGasto: "ALIMENTACAO",
    valorGasto: 640.00,
    dataGasto: "2026-10-11T16:00:00Z",
    usuarioId: 2,
    pagamentos: [
      {
        id: 211,
        valorPago: 640.00,
        dataPago: "2026-10-11T16:10:00Z",
        pagamentoFeito: true,
        tipoPagamento: "PIX",
        gastoId: 111,
      }
    ]
  },
  {
    id: 112,
    descricao: "Passagem Aérea Férias (Parcela 2/6)",
    tipoGasto: "LAZER",
    valorGasto: 2400.00,
    dataGasto: "2026-10-08T12:00:00Z",
    usuarioId: 3,
    pagamentos: [
      {
        id: 212,
        valorPago: 400.00,
        dataPago: "2026-10-08T12:05:00Z",
        pagamentoFeito: true,
        tipoPagamento: "CREDITO",
        cartao: "XP Infinite Visa",
        parcelas: 6,
        valorParcela: 400.00,
        gastoId: 112,
      }
    ]
  }
];

export const CATEGORIA_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  ALIMENTACAO: { label: "Alimentação", color: "#10b981", bg: "rgba(16, 185, 129, 0.1)", icon: "Utensils" },
  TRANSPORTE: { label: "Transporte", color: "#0284c7", bg: "rgba(2, 132, 199, 0.1)", icon: "Car" },
  CASA: { label: "Moradia", color: "#7c3aed", bg: "rgba(124, 58, 237, 0.1)", icon: "Home" },
  SAUDE: { label: "Saúde", color: "#e11d48", bg: "rgba(225, 29, 72, 0.1)", icon: "Activity" },
  LAZER: { label: "Lazer", color: "#d97706", bg: "rgba(217, 119, 6, 0.1)", icon: "Smile" },
  COMPRAS: { label: "Compras", color: "#4f46e5", bg: "rgba(79, 70, 229, 0.1)", icon: "ShoppingBag" },
  OUTROS: { label: "Outros", color: "#64748b", bg: "rgba(100, 116, 139, 0.1)", icon: "Tag" }
};
