import type { Gasto, Usuario } from '../types';

export const INITIAL_MOCK_USERS: Usuario[] = [];

export const INITIAL_MOCK_GASTOS: Gasto[] = [];

export const CATEGORIA_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  ALIMENTACAO: { label: "Alimentação", color: "#10b981", bg: "rgba(16, 185, 129, 0.1)", icon: "Utensils" },
  TRANSPORTE: { label: "Transporte", color: "#0284c7", bg: "rgba(2, 132, 199, 0.1)", icon: "Car" },
  CASA: { label: "Moradia", color: "#7c3aed", bg: "rgba(124, 58, 237, 0.1)", icon: "Home" },
  SAUDE: { label: "Saúde", color: "#e11d48", bg: "rgba(225, 29, 72, 0.1)", icon: "Activity" },
  LAZER: { label: "Lazer", color: "#d97706", bg: "rgba(217, 119, 6, 0.1)", icon: "Smile" },
  COMPRAS: { label: "Compras", color: "#4f46e5", bg: "rgba(79, 70, 229, 0.1)", icon: "ShoppingBag" },
  OUTROS: { label: "Outros", color: "#64748b", bg: "rgba(100, 116, 139, 0.1)", icon: "Tag" }
};
