import type { Usuario, Gasto, Cartao, Pagamento, TipoPagamento, TipoGasto } from '../types';
import { liveSync } from './websocket';

// Base API configuration (proxied in Vite or direct)
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const LOCAL_STORAGE_USERS_KEY = 'con_checklist_usuarios_api_cache';
const LOCAL_STORAGE_GASTOS_KEY = 'con_checklist_gastos_api_data';
const LOCAL_STORAGE_PAGAMENTOS_KEY = 'con_checklist_pagamentos_api_data';
const LOCAL_STORAGE_CARTOES_KEY = 'con_checklist_cartoes_v1';

function getLocalUsers(): Usuario[] {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveLocalUsers(users: Usuario[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(users));
  } catch (e) {
    console.error("Erro ao salvar usuários locais:", e);
  }
}

function getLocalGastos(): Gasto[] {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_GASTOS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveLocalGastos(gastos: Gasto[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_GASTOS_KEY, JSON.stringify(gastos));
  } catch (e) {
    console.error("Erro ao salvar gastos locais:", e);
  }
}

function getLocalPagamentos(): Pagamento[] {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_PAGAMENTOS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveLocalPagamentos(pagamentos: Pagamento[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_PAGAMENTOS_KEY, JSON.stringify(pagamentos));
  } catch (e) {
    console.error("Erro ao salvar pagamentos locais:", e);
  }
}

function getLocalCartoes(): Cartao[] {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_CARTOES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveLocalCartoes(cartoes: Cartao[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_CARTOES_KEY, JSON.stringify(cartoes));
  } catch (e) {
    console.error("Erro ao salvar cartões locais:", e);
  }
}

export interface ApiStatus {
  isBackendConnected: boolean;
  lastChecked: Date | null;
  message: string;
}

export const apiService = {
  // Check backend health/reachability
  async checkBackend(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(`${API_BASE_URL}/usuario/buscar`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return res.ok;
    } catch {
      return false;
    }
  },

  // ================= USURÁRIOS =================
  async getUsuarios(nome?: string): Promise<{ data: Usuario[]; fromBackend: boolean }> {
    try {
      const url = nome?.trim()
        ? `${API_BASE_URL}/usuario/buscar?nome=${encodeURIComponent(nome.trim())}`
        : `${API_BASE_URL}/usuario/buscar`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Status ${response.status}`);
      }

      const users: Usuario[] = await response.json();

      if (Array.isArray(users) && users.length > 0) {
        saveLocalUsers(users);
      }

      return { data: users, fromBackend: true };
    } catch (err) {
      console.warn("Backend indisponível ao buscar usuários, usando dados locais:", err);
      const local = getLocalUsers();
      const filtered = nome?.trim()
        ? local.filter(u => u.nome.toLowerCase().includes(nome.toLowerCase()))
        : local;
      return { data: filtered, fromBackend: false };
    }
  },

  async criarUsuario(payload: { nome: string; salario: number; diaSalario: number }): Promise<{ data: Usuario; fromBackend: boolean }> {
    try {
      const body = {
        nome: String(payload.nome).trim(),
        salario: parseFloat(String(payload.salario)),
        diaSalario: parseInt(String(payload.diaSalario), 10),
      };

      const response = await fetch(`${API_BASE_URL}/usuario/criar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        let msg = `Erro ${response.status} ao criar pessoa`;
        try {
          const errData = await response.json();
          msg = errData.error || errData.err || errData.message || JSON.stringify(errData);
        } catch { }
        throw new Error(msg);
      }

      const created: Usuario = await response.json();

      const local = getLocalUsers();
      saveLocalUsers([created, ...local.filter(u => u.id !== created.id)]);

      liveSync.emit('USER_CREATED', created);

      return { data: created, fromBackend: true };
    } catch (err: any) {
      console.error("Erro ao criar usuário:", err);
      throw err;
    }
  },

  async atualizarUsuario(payload: { id: number; nome: string; salario: number; diaSalario: number }): Promise<{ data: Usuario; fromBackend: boolean }> {
    try {
      const response = await fetch(`${API_BASE_URL}/usuario/atualizar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Erro ao atualizar: status ${response.status}`);
      }

      const updated: Usuario = await response.json();

      const local = getLocalUsers();
      saveLocalUsers(local.map(u => (u.id === updated.id ? updated : u)));

      liveSync.emit('USER_UPDATED', updated);
      return { data: updated, fromBackend: true };
    } catch (err) {
      console.warn("Backend offline ao atualizar usuário, atualizando localmente:", err);
      const local = getLocalUsers();
      const updatedUser: Usuario = {
        id: payload.id,
        nome: payload.nome,
        salario: Number(payload.salario),
        diaSalario: Number(payload.diaSalario),
      };
      saveLocalUsers(local.map(u => (u.id === payload.id ? updatedUser : u)));
      liveSync.emit('USER_UPDATED', updatedUser);
      return { data: updatedUser, fromBackend: false };
    }
  },

  async deletarUsuario(id: number): Promise<{ success: boolean; fromBackend: boolean }> {
    try {
      // O controller do backend lê especificamente Number(req.query.id)
      let response = await fetch(`${API_BASE_URL}/usuario/deletar/${id}?id=${id}`, {
        method: 'DELETE',
      });

      if (response.status === 404) {
        response = await fetch(`${API_BASE_URL}/usuario/deletar?id=${id}`, {
          method: 'DELETE',
        });
      }

      if (response.status === 404) {
        response = await fetch(`${API_BASE_URL}/usuario/${id}?id=${id}`, {
          method: 'DELETE',
        });
      }

      if (!response.ok) {
        let errorMsg = `Erro ${response.status} ao remover usuário`;
        try {
          const errData = await response.json();
          errorMsg = errData.err || errData.erro || errData.error || errData.message || JSON.stringify(errData);
        } catch { }
        throw new Error(errorMsg);
      }

      const local = getLocalUsers();
      saveLocalUsers(local.filter(u => u.id !== id));

      liveSync.emit('USER_DELETED', { id });
      return { success: true, fromBackend: true };
    } catch (err: any) {
      console.error("Erro ao deletar usuário:", err);
      throw err;
    }
  },

  // ================= GASTOS =================
  async getGastos(usuarioId?: number): Promise<{ data: Gasto[]; fromBackend: boolean }> {
    try {
      const url = usuarioId
        ? `${API_BASE_URL}/gastos/usuarioContas/${usuarioId}`
        : `${API_BASE_URL}/gastos/todosGastos`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Status ${response.status}`);
      }

      const rawGastos = await response.json();

      // Buscar pagamentos na API de pagamento para correlacionar
      let apiPagamentos: Pagamento[] = [];
      try {
        const pagRes = await fetch(`${API_BASE_URL}/pagamento/all`);
        if (pagRes.ok) {
          apiPagamentos = await pagRes.json();
          if (Array.isArray(apiPagamentos) && apiPagamentos.length > 0) {
            saveLocalPagamentos(apiPagamentos);
          }
        }
      } catch {
        apiPagamentos = getLocalPagamentos();
      }

      const formattedGastos: Gasto[] = (Array.isArray(rawGastos) ? rawGastos : []).map((g: any) => {
        let pagamentosList: any[] = [];
        if (g.pagamentos && Array.isArray(g.pagamentos) && g.pagamentos.length > 0) {
          pagamentosList = g.pagamentos;
        } else if (g.pagamento) {
          pagamentosList = [g.pagamento];
        } else if (g.pagamentoId) {
          const found = apiPagamentos.find(p => p.id === g.pagamentoId);
          if (found) pagamentosList = [found];
        } else {
          const found = apiPagamentos.filter((p: any) => p.gastoId === g.id || (p.gastos && p.gastos.some((sub: any) => sub.id === g.id)));
          if (found.length > 0) pagamentosList = found;
        }

        return {
          id: g.id,
          descricao: g.descricao,
          tipoGasto: g.tipoGasto,
          valorGasto: Number(g.valorGasto),
          dataGasto: g.dataGasto || new Date().toISOString(),
          usuarioId: Number(g.usuarioId),
          pagamentoId: g.pagamentoId || (pagamentosList[0]?.id ?? null),
          usuario: g.usuario,
          pagamentos: pagamentosList.map((p: any) => ({
            id: p.id,
            valorPago: p.valorPago !== undefined && p.valorPago !== null ? Number(p.valorPago) : Number(g.valorGasto),
            dataPago: p.dataPago,
            pagamentoFeito: Boolean(p.pagamentoFeito),
            tipoPagamento: p.tipoPagamento,
            cartaoId: p.cartaoId,
            cartao: p.cartao ? (typeof p.cartao === 'string' ? p.cartao : `Cartão Venc. dia ${p.cartao.diaVencimento}`) : undefined,
            gastoId: p.gastoId || g.id,
            parcelas: p.parcelas || 1,
            parcelasPagas: Number(p.parcelasPagas) || 0,
            valorParcela: p.valorParcela !== undefined && p.valorParcela !== null ? Number(p.valorParcela) : Number(g.valorGasto),
            valorTotal: p.valorTotal !== undefined && p.valorTotal !== null ? Number(p.valorTotal) : Number(g.valorGasto)
          }))
        };
      });

      if (formattedGastos.length > 0) {
        saveLocalGastos(formattedGastos);
      }

      return { data: formattedGastos, fromBackend: true };
    } catch (err) {
      console.warn("Backend indisponível ao buscar gastos pela API, usando locais:", err);
      const local = getLocalGastos();
      const filtered = usuarioId ? local.filter(g => g.usuarioId === usuarioId) : local;
      return { data: filtered, fromBackend: false };
    }
  },

  async criarGasto(payload: {
    descricao: string;
    tipoGasto: string;
    valorGasto: number;
    usuarioId: number;
    dataGasto?: string;
    pagamentos?: any[];
  }): Promise<{ data: Gasto; fromBackend: boolean }> {
    const cleanBody = {
      descricao: String(payload.descricao).trim(),
      tipoGasto: payload.tipoGasto,
      valorGasto: Number(payload.valorGasto),
      dataGasto: payload.dataGasto ? new Date(payload.dataGasto).toISOString() : new Date().toISOString(),
      usuarioId: Number(payload.usuarioId),
    };

    try {
      // 1. Cria gasto no backend (/gastos/criar)
      const response = await fetch(`${API_BASE_URL}/gastos/criar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanBody),
      });

      if (!response.ok) {
        throw new Error(`Status ${response.status}`);
      }

      const createdRaw = await response.json();
      let createdPagamento: Pagamento | null = null;

      // 2. Se houver informações de pagamento, registra na API de pagamento (/pagamento/criarPagamento)
      if (payload.pagamentos && payload.pagamentos.length > 0) {
        const pInfo = payload.pagamentos[0];
        try {
          const pagRes = await this.criarPagamento({
            valorPago: pInfo.valorPago !== undefined ? Number(pInfo.valorPago) : Number(payload.valorGasto),
            dataPago: pInfo.dataPago || (pInfo.pagamentoFeito ? new Date().toISOString() : null),
            pagamentoFeito: Boolean(pInfo.pagamentoFeito),
            tipoPagamento: pInfo.tipoPagamento || null,
            valorTotal: Number(payload.valorGasto),
            cartaoId: pInfo.cartaoId ? Number(pInfo.cartaoId) : null,
            parcelas: Number(pInfo.parcelas) || 1,
            valorParcela: Number(pInfo.valorParcela) || (Number(payload.valorGasto) / (Number(pInfo.parcelas) || 1)),
            gastoId: createdRaw.id,
          });
          createdPagamento = pagRes.data;
        } catch (pagErr) {
          console.warn("Falha ao registrar pagamento no backend:", pagErr);
        }
      }

      const created: Gasto = {
        id: createdRaw.id,
        descricao: createdRaw.descricao,
        tipoGasto: createdRaw.tipoGasto,
        valorGasto: Number(createdRaw.valorGasto),
        dataGasto: createdRaw.dataGasto,
        usuarioId: Number(createdRaw.usuarioId),
        pagamentoId: createdPagamento ? createdPagamento.id : createdRaw.pagamentoId,
        pagamentos: createdPagamento ? [{
          ...createdPagamento,
          gastoId: createdRaw.id
        }] : (payload.pagamentos || []).map((p: any) => ({
          id: p.id || Date.now(),
          valorPago: Number(p.valorPago || createdRaw.valorGasto),
          dataPago: p.dataPago,
          pagamentoFeito: Boolean(p.pagamentoFeito),
          tipoPagamento: p.tipoPagamento,
          cartaoId: p.cartaoId,
          cartao: p.cartao,
          gastoId: createdRaw.id,
          parcelas: p.parcelas || 1,
          valorParcela: Number(p.valorParcela || createdRaw.valorGasto),
          valorTotal: Number(createdRaw.valorGasto)
        }))
      };

      const local = getLocalGastos();
      saveLocalGastos([created, ...local.filter(g => g.id !== created.id)]);
      liveSync.emit('GASTO_ADDED', created);

      return { data: created, fromBackend: true };
    } catch (err: any) {
      console.warn("Backend não processou gasto, salvando localmente:", err);
      const local = getLocalGastos();
      const localId = Date.now();
      const created: Gasto = {
        id: localId,
        descricao: cleanBody.descricao,
        tipoGasto: cleanBody.tipoGasto as any,
        valorGasto: cleanBody.valorGasto,
        dataGasto: cleanBody.dataGasto,
        usuarioId: cleanBody.usuarioId,
        pagamentos: (payload.pagamentos || []).map((p: any, idx: number) => ({
          id: Date.now() + idx,
          valorPago: Number(p.valorPago || cleanBody.valorGasto),
          dataPago: p.dataPago || (p.pagamentoFeito ? new Date().toISOString() : null),
          pagamentoFeito: Boolean(p.pagamentoFeito),
          tipoPagamento: p.tipoPagamento || null,
          cartaoId: p.cartaoId ? Number(p.cartaoId) : null,
          cartao: p.cartao,
          gastoId: localId,
          parcelas: Number(p.parcelas) || 1,
          valorParcela: Number(p.valorParcela) || (cleanBody.valorGasto / (Number(p.parcelas) || 1)),
          valorTotal: cleanBody.valorGasto
        }))
      };

      saveLocalGastos([created, ...local.filter(g => g.id !== created.id)]);
      liveSync.emit('GASTO_ADDED', created);
      return { data: created, fromBackend: false };
    }
  },

  async deletarGasto(id: number): Promise<{ success: boolean; fromBackend: boolean }> {
    try {
      const response = await fetch(`${API_BASE_URL}/gastos/deletar/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Erro ao deletar gasto: status ${response.status}`);
      }

      const local = getLocalGastos();
      saveLocalGastos(local.filter(g => g.id !== id));
      liveSync.emit('GASTO_DELETED', { id });

      return { success: true, fromBackend: true };
    } catch (err) {
      console.warn("Backend offline ao deletar gasto, removendo localmente:", err);
      const local = getLocalGastos();
      saveLocalGastos(local.filter(g => g.id !== id));
      liveSync.emit('GASTO_DELETED', { id });
      return { success: true, fromBackend: false };
    }
  },

  // ================= PAGAMENTOS =================
  async getPagamentos(): Promise<{ data: Pagamento[]; fromBackend: boolean }> {
    try {
      const response = await fetch(`${API_BASE_URL}/pagamento/all`);
      if (!response.ok) {
        throw new Error(`Status ${response.status}`);
      }
      const pagamentos: Pagamento[] = await response.json();
      if (Array.isArray(pagamentos)) {
        saveLocalPagamentos(pagamentos);
      }
      return { data: pagamentos, fromBackend: true };
    } catch (err) {
      console.warn("Backend indisponível ao buscar pagamentos, usando locais:", err);
      return { data: getLocalPagamentos(), fromBackend: false };
    }
  },

  async getPagamentosPorData(dataFormat: string): Promise<{ data: Pagamento[]; fromBackend: boolean }> {
    try {
      const response = await fetch(`${API_BASE_URL}/pagamento/data?dataPagamento=${encodeURIComponent(dataFormat)}`);
      if (!response.ok) {
        throw new Error(`Status ${response.status}`);
      }
      const data: Pagamento[] = await response.json();
      return { data, fromBackend: true };
    } catch (err) {
      console.warn("Erro ao buscar pagamentos por data na API:", err);
      return { data: [], fromBackend: false };
    }
  },

  async getPagamentosPorStatus(pago: boolean): Promise<{ data: Pagamento[]; fromBackend: boolean }> {
    try {
      const response = await fetch(`${API_BASE_URL}/pagamento/pago?pagamentoFeito=${pago}`);
      if (!response.ok) {
        throw new Error(`Status ${response.status}`);
      }
      const data: Pagamento[] = await response.json();
      return { data, fromBackend: true };
    } catch (err) {
      console.warn("Erro ao buscar pagamentos por status na API:", err);
      return { data: [], fromBackend: false };
    }
  },

  async getPagamentosPorTipo(tipo: TipoPagamento): Promise<{ data: Pagamento[]; fromBackend: boolean }> {
    try {
      const response = await fetch(`${API_BASE_URL}/pagamento/tipoPag?tipoPagamento=${encodeURIComponent(tipo)}`);
      if (!response.ok) {
        throw new Error(`Status ${response.status}`);
      }
      const data: Pagamento[] = await response.json();
      return { data, fromBackend: true };
    } catch (err) {
      console.warn("Erro ao buscar pagamentos por tipo na API:", err);
      return { data: [], fromBackend: false };
    }
  },

  async criarPagamento(payload: {
    valorPago?: number | null;
    dataPago?: string | null;
    pagamentoFeito?: boolean;
    tipoPagamento?: TipoPagamento | null;
    valorTotal: number;
    cartaoId?: number | null;
    parcelas?: number | null;
    valorParcela?: number | null;
    gastoId?: number | null;
  }): Promise<{ data: Pagamento; fromBackend: boolean }> {
    try {
      const body = {
        gastoId: payload.gastoId ?? undefined,
        valorPago: payload.valorPago !== undefined ? payload.valorPago : payload.valorTotal,
        dataPago: payload.dataPago ? new Date(payload.dataPago).toISOString() : (payload.pagamentoFeito ? new Date().toISOString() : null),
        pagamentoFeito: Boolean(payload.pagamentoFeito),
        tipoPagamento: payload.tipoPagamento || null,
        valorTotal: Number(payload.valorTotal),
        cartaoId: payload.cartaoId ? Number(payload.cartaoId) : null,
        parcelas: payload.parcelas ? Number(payload.parcelas) : 1,
        valorParcela: payload.valorParcela !== undefined && payload.valorParcela !== null ? Number(payload.valorParcela) : Number(payload.valorTotal)
      };

      const response = await fetch(`${API_BASE_URL}/pagamento/criarPagamento`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error(`Status ${response.status}`);
      }

      const created: Pagamento = await response.json();
      const local = getLocalPagamentos();
      saveLocalPagamentos([created, ...local.filter(p => p.id !== created.id)]);

      return { data: created, fromBackend: true };
    } catch (err) {
      console.warn("Erro ao criar pagamento na API, salvando localmente:", err);
      const fallbackPagamento: Pagamento = {
        id: Date.now(),
        valorPago: (payload.valorPago !== undefined && payload.valorPago !== null) ? payload.valorPago : payload.valorTotal,
        dataPago: payload.dataPago || (payload.pagamentoFeito ? new Date().toISOString() : null),
        pagamentoFeito: Boolean(payload.pagamentoFeito),
        tipoPagamento: payload.tipoPagamento || undefined,
        cartaoId: payload.cartaoId || null,
        parcelas: payload.parcelas || 1,
        valorParcela: payload.valorParcela || payload.valorTotal,
        valorTotal: payload.valorTotal
      };
      const local = getLocalPagamentos();
      saveLocalPagamentos([fallbackPagamento, ...local]);
      return { data: fallbackPagamento, fromBackend: false };
    }
  },

  async mudarSituacaoPagamento(idPagamento: number): Promise<{ success: boolean; fromBackend: boolean }> {
    try {
      const response = await fetch(`${API_BASE_URL}/pagamento/situacao/${idPagamento}`, {
        method: 'PUT'
      });
      if (!response.ok) {
        throw new Error(`Status ${response.status}`);
      }
      return { success: true, fromBackend: true };
    } catch (err) {
      console.warn(`Erro ao mudar situação de pagamento ${idPagamento} na API:`, err);
      return { success: true, fromBackend: false };
    }
  },

  async pagarParcela(idPagamento: number, parcelasPagas?: number): Promise<{ data: Pagamento | null; fromBackend: boolean }> {
    try {
      const response = await fetch(`${API_BASE_URL}/pagamento/parcela/${idPagamento}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parcelasPagas === undefined ? {} : { parcelasPagas })
      });
      if (!response.ok) {
        throw new Error(`Status ${response.status}`);
      }
      const data: Pagamento = await response.json();
      liveSync.emit('PAGAMENTO_TOGGLED', { pagamentoId: idPagamento });
      return { data, fromBackend: true };
    } catch (err) {
      console.warn(`Erro ao pagar parcela do pagamento ${idPagamento} na API:`, err);
      return { data: null, fromBackend: false };
    }
  },

  async atualizarValorParcelas(
    idPagamento: number,
    idCartao: number,
    valorTotal: number,
    parcelas: number
  ): Promise<{ data: any; fromBackend: boolean }> {
    try {
      const response = await fetch(`${API_BASE_URL}/pagamento/valorParcela/${idPagamento}/${idCartao}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ valorTotal, parcelas })
      });
      if (!response.ok) {
        throw new Error(`Status ${response.status}`);
      }
      const data = await response.json();
      return { data, fromBackend: true };
    } catch (err) {
      console.warn("Erro ao atualizar parcelas na API:", err);
      return { data: null, fromBackend: false };
    }
  },

  async vincularPagamento(
    gastoId: number, 
    dados: {
      tipoPagamento: TipoPagamento;
      cartaoId?: number | null;
      cartaoNome?: string;
      parcelas?: number;
      valorPago?: number;
      pagamentoFeito?: boolean;
      dataPago?: string | null;
    }
  ): Promise<{ data: Gasto; fromBackend: boolean }> {
    const local = getLocalGastos();
    const gastoIndex = local.findIndex(g => g.id === gastoId);
    const gasto = gastoIndex !== -1 ? local[gastoIndex] : null;

    const parcelas = Number(dados.parcelas) || 1;
    const valorTotal = gasto ? Number(gasto.valorGasto) : (Number(dados.valorPago) || 0);
    const valorPago = dados.valorPago !== undefined ? Number(dados.valorPago) : valorTotal;
    const valorParcela = valorPago / parcelas;
    const pagamentoFeito = Boolean(dados.pagamentoFeito);
    const dataPago = pagamentoFeito ? (dados.dataPago || new Date().toISOString()) : null;

    let createdId = Date.now();
    let fromBackend = false;

    try {
      const res = await this.criarPagamento({
        valorPago,
        dataPago,
        pagamentoFeito,
        tipoPagamento: dados.tipoPagamento,
        valorTotal,
        cartaoId: dados.cartaoId || null,
        parcelas,
        valorParcela,
        gastoId
      });
      createdId = res.data.id;
      fromBackend = res.fromBackend;
    } catch (err) {
      console.warn("Erro ao registrar pagamento na API:", err);
    }

    const novoPagamento: Pagamento = {
      id: createdId,
      valorPago,
      dataPago,
      pagamentoFeito,
      tipoPagamento: dados.tipoPagamento,
      cartaoId: dados.cartaoId || null,
      cartao: dados.cartaoNome || undefined,
      gastoId: gastoId,
      parcelas,
      parcelasPagas: pagamentoFeito ? parcelas : 0,
      valorParcela,
      valorTotal
    };

    if (gasto) {
      const gastoAtualizado: Gasto = {
        ...gasto,
        pagamentoId: createdId,
        pagamentos: [novoPagamento]
      };
      local[gastoIndex] = gastoAtualizado;
      saveLocalGastos([...local]);
      liveSync.emit('GASTO_UPDATED', gastoAtualizado);
      return { data: gastoAtualizado, fromBackend };
    }

    return {
      data: {
        id: gastoId,
        descricao: '',
        tipoGasto: 'OUTROS' as TipoGasto,
        valorGasto: valorTotal,
        dataGasto: new Date().toISOString(),
        usuarioId: 1,
        pagamentoId: createdId,
        pagamentos: [novoPagamento]
      },
      fromBackend
    };
  },

  async desvincularPagamento(gastoId: number): Promise<{ data: Gasto; fromBackend: boolean }> {
    const local = getLocalGastos();
    const gastoIndex = local.findIndex(g => g.id === gastoId);
    if (gastoIndex === -1) {
      throw new Error("Gasto não encontrado.");
    }

    const gasto = local[gastoIndex];
    const gastoAtualizado: Gasto = {
      ...gasto,
      pagamentoId: null,
      pagamentos: []
    };

    let fromBackend = false;
    try {
      const response = await fetch(`${API_BASE_URL}/gastos/desvincular/${gastoId}`, { method: 'PUT' });
      if (!response.ok) {
        throw new Error(`Status ${response.status}`);
      }
      fromBackend = true;
    } catch (err) {
      console.warn('Erro ao desvincular pagamento na API, alterando só localmente:', err);
    }

    local[gastoIndex] = gastoAtualizado;
    saveLocalGastos([...local]);
    liveSync.emit('GASTO_UPDATED', gastoAtualizado);

    return { data: gastoAtualizado, fromBackend };
  },

  async togglePagamento(gastoId: number, pagamentoId?: number): Promise<{ success: boolean; fromBackend: boolean }> {
    let fromBackend = false;
    if (pagamentoId) {
      try {
        const res = await this.mudarSituacaoPagamento(pagamentoId);
        fromBackend = res.fromBackend;
      } catch (e) {
        console.warn("Não foi possível chamar PUT /pagamento/:id:", e);
      }
    }

    liveSync.emit('PAGAMENTO_TOGGLED', { gastoId, pagamentoId });
    return { success: true, fromBackend };
  },

  // ================= CARTÕES =================
  async getCartaoPorId(id: number): Promise<{ data: Cartao | null; fromBackend: boolean }> {
    try {
      const response = await fetch(`${API_BASE_URL}/cartao/${id}`);
      if (!response.ok) {
        throw new Error(`Status ${response.status}`);
      }
      const cartao: Cartao = await response.json();
      if (cartao) {
        const local = getLocalCartoes();
        saveLocalCartoes([cartao, ...local.filter(c => c.id !== cartao.id)]);
      }
      return { data: cartao, fromBackend: true };
    } catch (err) {
      console.warn(`Erro ao buscar cartão ${id} na API:`, err);
      const local = getLocalCartoes().find(c => c.id === id) || null;
      return { data: local, fromBackend: false };
    }
  },

  async getCartoes(usuarioId?: number): Promise<{ data: Cartao[]; fromBackend: boolean }> {
    const local = getLocalCartoes();
    const knownCartoes = usuarioId ? local.filter(c => c.usuarioId === usuarioId) : local;

    // Buscar cartões conhecidos ou referenciados em pagamentos via GET /cartao/:id
    const pagamentos = getLocalPagamentos();
    const cartaoIdsFromPagamentos = pagamentos
      .map(p => p.cartaoId)
      .filter((id): id is number => typeof id === 'number' && id > 0);

    const allIds = Array.from(new Set([...knownCartoes.map(c => c.id), ...cartaoIdsFromPagamentos]));

    if (allIds.length > 0) {
      try {
        const results = await Promise.allSettled(
          allIds.map(async (id) => {
            const res = await fetch(`${API_BASE_URL}/cartao/${id}`);
            if (res.ok) return (await res.json()) as Cartao;
            return null;
          })
        );

        const updatedCards: Cartao[] = [];
        results.forEach((r) => {
          if (r.status === 'fulfilled' && r.value) {
            updatedCards.push(r.value);
          }
        });

        if (updatedCards.length > 0) {
          const merged = [
            ...updatedCards,
            ...local.filter(l => !updatedCards.some(u => u.id === l.id))
          ];
          saveLocalCartoes(merged);
          const filtered = usuarioId ? merged.filter(c => c.usuarioId === usuarioId) : merged;
          return { data: filtered, fromBackend: true };
        }
      } catch (err) {
        console.warn("Erro ao sincronizar cartões da API:", err);
      }
    }

    return { data: knownCartoes, fromBackend: false };
  },

  async criarCartao(payload: {
    diaVencimento: number;
    valorFaturaMes: number;
    usuarioId: number;
  }): Promise<{ data: Cartao; fromBackend: boolean }> {
    const body = {
      diaVencimento: parseInt(String(payload.diaVencimento), 10),
      valorFaturaMes: parseFloat(String(payload.valorFaturaMes)),
      usuarioId: parseInt(String(payload.usuarioId), 10),
    };

    try {
      const response = await fetch(`${API_BASE_URL}/cartao/criar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`Erro ao criar cartão: status ${response.status}`);
      }

      const created: Cartao = await response.json();
      const local = getLocalCartoes();
      saveLocalCartoes([created, ...local.filter(c => c.id !== created.id)]);
      liveSync.emit('CARTAO_CREATED', created);

      return { data: created, fromBackend: true };
    } catch (err) {
      console.warn("Backend offline ao criar cartão, salvando localmente:", err);
      const local = getLocalCartoes();
      const newId = local.length > 0 ? Math.max(...local.map(c => c.id)) + 1 : 1;
      const fallbackCartao: Cartao = {
        id: newId,
        diaVencimento: Number(payload.diaVencimento),
        valorFaturaMes: Number(payload.valorFaturaMes),
        usuarioId: Number(payload.usuarioId),
      };

      const updatedList = [fallbackCartao, ...local];
      saveLocalCartoes(updatedList);
      liveSync.emit('CARTAO_CREATED', fallbackCartao);

      return { data: fallbackCartao, fromBackend: false };
    }
  },

  async deletarCartao(id: number): Promise<{ success: boolean; fromBackend: boolean }> {
    const local = getLocalCartoes();
    saveLocalCartoes(local.filter(c => c.id !== id));
    liveSync.emit('CARTAO_DELETED', { id });
    return { success: true, fromBackend: false };
  }
};

