import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import type { Usuario, Gasto, Cartao, FinancialSummary, TipoGasto, TipoPagamento, Pagamento } from '../types';
import { apiService } from '../services/api';
import { liveSync } from '../services/websocket';

interface FinancialContextType {
  usuarios: Usuario[];
  activeUserId: number | 'all';
  activeUser: Usuario | null;
  gastos: Gasto[];
  cartoes: Cartao[];
  pagamentos: Pagamento[];
  filteredGastos: Gasto[];
  searchTerm: string;
  categoryFilter: string;
  statusFilter: 'all' | 'pago' | 'pendente';
  paymentTypeFilter: string;
  metrics: FinancialSummary;
  isBackendOnline: boolean;
  isWsConnected: boolean;
  isLoading: boolean;
  setActiveUserId: (id: number | 'all') => void;
  setSearchTerm: (term: string) => void;
  setCategoryFilter: (cat: string) => void;
  setStatusFilter: (status: 'all' | 'pago' | 'pendente') => void;
  setPaymentTypeFilter: (type: string) => void;
  refreshUsuarios: (query?: string) => Promise<void>;
  refreshGastos: () => Promise<void>;
  refreshPagamentos: () => Promise<void>;
  refreshCartoes: () => Promise<void>;
  createUsuario: (data: { nome: string; salario: number; diaSalario: number }) => Promise<Usuario>;
  updateUsuario: (data: { id: number; nome: string; salario: number; diaSalario: number }) => Promise<Usuario>;
  deleteUsuario: (id: number) => Promise<boolean>;
  togglePagamento: (gastoId: number) => Promise<void>;
  pagarParcela: (gastoId: number, parcelasPagas?: number) => Promise<void>;
  vincularPagamento: (
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
  ) => Promise<Gasto>;
  desvincularPagamento: (gastoId: number) => Promise<Gasto>;
  addGasto: (gasto: Omit<Gasto, 'id'>) => Promise<Gasto>;
  deleteGasto: (id: number) => Promise<void>;
  addCartao: (data: { diaVencimento: number; valorFaturaMes: number; usuarioId: number }) => Promise<Cartao>;
  deleteCartao: (id: number) => Promise<boolean>;
  simulateLiveTransaction: () => void;
}

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

const LOCAL_STORAGE_GASTOS_KEY = 'con_checklist_gastos_api_data';

export const FinancialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [activeUserId, setActiveUserId] = useState<number | 'all'>('all');
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [cartoes, setCartoes] = useState<Cartao[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pago' | 'pendente'>('all');
  const [paymentTypeFilter, setPaymentTypeFilter] = useState('all');
  
  const [isBackendOnline, setIsBackendOnline] = useState<boolean>(false);
  const [isWsConnected, setIsWsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sync gastos to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_GASTOS_KEY, JSON.stringify(gastos));
    } catch (e) {
      console.error("Erro ao salvar gastos no localStorage:", e);
    }
  }, [gastos]);

  // Load and refresh usuarios from API
  const refreshUsuarios = useCallback(async (query?: string) => {
    try {
      const res = await apiService.getUsuarios(query);
      setUsuarios(res.data);
      if (res.fromBackend) {
        setIsBackendOnline(true);
      }

      // If activeUserId not set or invalid, select first user or keep 'all'
      if (activeUserId !== 'all' && !res.data.some(u => u.id === activeUserId)) {
        if (res.data.length > 0) {
          setActiveUserId(res.data[0].id);
        } else {
          setActiveUserId('all');
        }
      }
    } catch (err) {
      console.error("Falha ao buscar usuários:", err);
    }
  }, [activeUserId]);

  // Load and refresh gastos from API
  const refreshGastos = useCallback(async () => {
    try {
      const userIdParam = activeUserId !== 'all' ? activeUserId : undefined;
      const res = await apiService.getGastos(userIdParam);
      setGastos(res.data);
      if (res.fromBackend) {
        setIsBackendOnline(true);
      }
    } catch (err) {
      console.error("Falha ao buscar gastos da API:", err);
    }
  }, [activeUserId]);

  // Load and refresh pagamentos from API
  const refreshPagamentos = useCallback(async () => {
    try {
      const res = await apiService.getPagamentos();
      setPagamentos(res.data);
      if (res.fromBackend) {
        setIsBackendOnline(true);
      }
    } catch (err) {
      console.error("Falha ao buscar pagamentos da API:", err);
    }
  }, []);

  // Load and refresh cartões from API
  const refreshCartoes = useCallback(async () => {
    try {
      const userIdParam = activeUserId !== 'all' ? activeUserId : undefined;
      const res = await apiService.getCartoes(userIdParam);
      setCartoes(res.data);
    } catch (err) {
      console.error("Falha ao buscar cartões da API:", err);
    }
  }, [activeUserId]);

  // Initial setup: start WebSocket connection and fetch initial data
  useEffect(() => {
    liveSync.connect();
    const unsubWs = liveSync.onStateChange((state) => setIsWsConnected(state));

    const loadAll = async () => {
      setIsLoading(true);
      await Promise.all([refreshUsuarios(), refreshGastos(), refreshPagamentos(), refreshCartoes()]);
      setIsLoading(false);
    };

    loadAll();

    // Listen to real-time events from other tabs or server
    const unsubEvents = liveSync.on('*', (payload) => {
      console.log("[Live Event Received]", payload.type, payload.data);
      if (payload.type === 'USER_CREATED' || payload.type === 'USER_UPDATED' || payload.type === 'USER_DELETED') {
        refreshUsuarios();
      } else if (
        payload.type === 'GASTO_UPDATED' || 
        payload.type === 'GASTO_ADDED' || 
        payload.type === 'GASTO_DELETED' || 
        payload.type === 'PAGAMENTO_TOGGLED'
      ) {
        refreshGastos();
        refreshPagamentos();
      } else if (payload.type === 'CARTAO_CREATED' || payload.type === 'CARTAO_DELETED') {
        refreshCartoes();
      }
    });

    return () => {
      unsubWs();
      unsubEvents();
    };
  }, [refreshUsuarios, refreshGastos, refreshPagamentos, refreshCartoes]);

  // User actions
  const createUsuario = async (data: { nome: string; salario: number; diaSalario: number }) => {
    const result = await apiService.criarUsuario(data);
    await refreshUsuarios();
    setActiveUserId(result.data.id);
    return result.data;
  };

  const updateUsuario = async (data: { id: number; nome: string; salario: number; diaSalario: number }) => {
    const result = await apiService.atualizarUsuario(data);
    await refreshUsuarios();
    return result.data;
  };

  const deleteUsuario = async (id: number) => {
    const result = await apiService.deletarUsuario(id);
    if (activeUserId === id) {
      setActiveUserId('all');
    }
    await refreshUsuarios();
    return result.success;
  };

  // Cartão actions
  const addCartao = async (data: { diaVencimento: number; valorFaturaMes: number; usuarioId: number }) => {
    const result = await apiService.criarCartao(data);
    await refreshCartoes();
    return result.data;
  };

  const deleteCartao = async (id: number) => {
    const result = await apiService.deletarCartao(id);
    await refreshCartoes();
    return result.success;
  };

  // Toggle payment status for an expense
  const togglePagamento = async (gastoId: number) => {
    const targetGasto = gastos.find((g) => g.id === gastoId);
    const pId = targetGasto?.pagamentos?.[0]?.id || targetGasto?.pagamentoId;

    // Optimistic UI update
    setGastos((prev) =>
      prev.map((gasto) => {
        if (gasto.id === gastoId) {
          const isCurrentlyPaid = gasto.pagamentos.some((p) => p.pagamentoFeito);
          const newStatus = !isCurrentlyPaid;
          const updatedPagamentos = gasto.pagamentos.map((p) => ({
            ...p,
            pagamentoFeito: newStatus,
            dataPago: newStatus ? new Date().toISOString() : null,
          }));
          return {
            ...gasto,
            pagamentos: updatedPagamentos,
          };
        }
        return gasto;
      })
    );

    await apiService.togglePagamento(gastoId, pId || undefined);
    await refreshGastos();
    await refreshPagamentos();
  };

  // Vincular ou atualizar pagamento de um gasto
  const vincularPagamento = async (
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
  ) => {
    const result = await apiService.vincularPagamento(gastoId, dados);
    setGastos((prev) => prev.map((g) => (g.id === gastoId ? result.data : g)));
    await refreshPagamentos();
    return result.data;
  };

  // Paga uma parcela do cartão; ao quitar todas, a compra fica como paga
  const pagarParcela = async (gastoId: number, parcelasPagas?: number) => {
    const targetGasto = gastos.find((g) => g.id === gastoId);
    const pId = targetGasto?.pagamentos?.[0]?.id || targetGasto?.pagamentoId;
    if (!pId) return;

    await apiService.pagarParcela(pId, parcelasPagas);
    await refreshGastos();
    await refreshPagamentos();
  };

  // Desvincular pagamento de um gasto
  const desvincularPagamento = async (gastoId: number) => {
    const result = await apiService.desvincularPagamento(gastoId);
    setGastos((prev) => prev.map((g) => (g.id === gastoId ? result.data : g)));
    await refreshPagamentos();
    return result.data;
  };

  // Add new expense via API
  const addGasto = async (gastoData: Omit<Gasto, 'id'>) => {
    const result = await apiService.criarGasto({
      descricao: gastoData.descricao,
      tipoGasto: gastoData.tipoGasto,
      valorGasto: gastoData.valorGasto,
      dataGasto: gastoData.dataGasto,
      usuarioId: gastoData.usuarioId,
      pagamentos: gastoData.pagamentos,
    });
    setGastos((prev) => [result.data, ...prev.filter((g) => g.id !== result.data.id)]);
    await refreshPagamentos();
    return result.data;
  };

  // Delete expense via API
  const deleteGasto = async (id: number) => {
    setGastos((prev) => prev.filter((g) => g.id !== id));
    await apiService.deletarGasto(id);
  };

  // Simulate a live transaction event from WebSocket / Server
  const simulateLiveTransaction = () => {
    const sampleExpenses = [
      { desc: "Uber Viagem Corporativa", tipo: "TRANSPORTE" as TipoGasto, val: 45.90, pay: "PIX" as TipoPagamento },
      { desc: "iFood Almoço Executivo", tipo: "ALIMENTACAO" as TipoGasto, val: 62.50, pay: "DEBITO" as TipoPagamento },
      { desc: "Café Starbucks", tipo: "ALIMENTACAO" as TipoGasto, val: 24.00, pay: "CREDITO" as TipoPagamento },
      { desc: "Farmácia Panvel", tipo: "SAUDE" as TipoGasto, val: 89.00, pay: "PIX" as TipoPagamento },
    ];
    const item = sampleExpenses[Math.floor(Math.random() * sampleExpenses.length)];
    const targetUserId = activeUserId !== 'all' ? activeUserId : (usuarios[0]?.id || 1);

    addGasto({
      descricao: `${item.desc} (Ao Vivo)`,
      tipoGasto: item.tipo,
      valorGasto: item.val,
      dataGasto: new Date().toISOString(),
      usuarioId: targetUserId,
      pagamentos: [
        {
          id: Date.now(),
          valorPago: item.val,
          dataPago: new Date().toISOString(),
          pagamentoFeito: true,
          tipoPagamento: item.pay,
          gastoId: Date.now(),
        }
      ]
    });
  };

  // Current active user object
  const activeUser = useMemo(() => {
    if (activeUserId === 'all') return null;
    return usuarios.find((u) => u.id === activeUserId) || null;
  }, [usuarios, activeUserId]);

  // Filtered gastos based on active user and filters
  const filteredGastos = useMemo(() => {
    return gastos.filter((gasto) => {
      // User filter
      if (activeUserId !== 'all' && gasto.usuarioId !== activeUserId) {
        return false;
      }
      // Category filter
      if (categoryFilter !== 'all' && gasto.tipoGasto !== categoryFilter) {
        return false;
      }
      // Payment type filter
      if (paymentTypeFilter !== 'all') {
        if (paymentTypeFilter === 'SEM_PAGAMENTO') {
          if (gasto.pagamentos && gasto.pagamentos.length > 0) return false;
        } else {
          const matchesType = gasto.pagamentos?.some((p) => p.tipoPagamento === paymentTypeFilter);
          if (!matchesType) return false;
        }
      }
      // Status filter (pago / pendente)
      const isPaid = gasto.pagamentos?.some((p) => p.pagamentoFeito);
      if (statusFilter === 'pago' && !isPaid) return false;
      if (statusFilter === 'pendente' && isPaid) return false;

      // Text search in description
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        return gasto.descricao.toLowerCase().includes(query);
      }

      return true;
    });
  }, [gastos, activeUserId, categoryFilter, paymentTypeFilter, statusFilter, searchTerm]);

  // Dynamic Financial Summary & Metrics
  const metrics = useMemo<FinancialSummary>(() => {
    // Determine salary base
    let totalSalario = 0;
    let diaSalarioTarget = 5;

    if (activeUser) {
      totalSalario = activeUser.salario;
      diaSalarioTarget = activeUser.diaSalario;
    } else {
      totalSalario = usuarios.reduce((sum, u) => sum + (Number(u.salario) || 0), 0);
      diaSalarioTarget = usuarios.length > 0 ? usuarios[0].diaSalario : 5;
    }

    // Expense calculations based on active user scope
    const userGastos = activeUserId === 'all' 
      ? gastos 
      : gastos.filter((g) => g.usuarioId === activeUserId);

    let totalGastos = 0;
    let totalPago = 0;
    let totalPendente = 0;

    const porCategoria: Record<TipoGasto, { total: number; count: number; percentual: number }> = {
      ALIMENTACAO: { total: 0, count: 0, percentual: 0 },
      TRANSPORTE: { total: 0, count: 0, percentual: 0 },
      COMPRAS: { total: 0, count: 0, percentual: 0 },
      LAZER: { total: 0, count: 0, percentual: 0 },
      SAUDE: { total: 0, count: 0, percentual: 0 },
      CASA: { total: 0, count: 0, percentual: 0 },
      OUTROS: { total: 0, count: 0, percentual: 0 },
    };

    const porTipoPagamento: Record<TipoPagamento, { total: number; count: number }> = {
      DEBITO: { total: 0, count: 0 },
      PIX: { total: 0, count: 0 },
      CREDITO: { total: 0, count: 0 },
    };

    userGastos.forEach((g) => {
      const val = Number(g.valorGasto) || 0;
      totalGastos += val;

      const isPaid = g.pagamentos?.some((p) => p.pagamentoFeito);
      if (isPaid) {
        totalPago += val;
      } else {
        totalPendente += val;
      }

      // Group by Category
      if (porCategoria[g.tipoGasto]) {
        porCategoria[g.tipoGasto].total += val;
        porCategoria[g.tipoGasto].count += 1;
      } else {
        porCategoria.OUTROS.total += val;
        porCategoria.OUTROS.count += 1;
      }

      // Group by Payment Type
      g.pagamentos?.forEach((p) => {
        if (p.tipoPagamento && porTipoPagamento[p.tipoPagamento]) {
          porTipoPagamento[p.tipoPagamento].total += (p.valorParcela || p.valorPago || val);
          porTipoPagamento[p.tipoPagamento].count += 1;
        }
      });
    });

    // Calculate percentages
    Object.keys(porCategoria).forEach((k) => {
      const catKey = k as TipoGasto;
      porCategoria[catKey].percentual = totalGastos > 0 
        ? Math.round((porCategoria[catKey].total / totalGastos) * 100) 
        : 0;
    });

    const saldoRestante = Math.max(0, totalSalario - totalGastos);
    const percentualComprometido = totalSalario > 0 
      ? Math.min(100, Math.round((totalGastos / totalSalario) * 100)) 
      : 0;

    // Calculate days until next salary
    const today = new Date();
    const currentDay = today.getDate();
    let diasRestantes = 0;
    let nextSalaryDate = new Date(today.getFullYear(), today.getMonth(), diaSalarioTarget);

    if (currentDay > diaSalarioTarget) {
      nextSalaryDate = new Date(today.getFullYear(), today.getMonth() + 1, diaSalarioTarget);
    }
    const diffTime = nextSalaryDate.getTime() - today.getTime();
    diasRestantes = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    return {
      totalSalario,
      totalGastos,
      totalPago,
      totalPendente,
      saldoRestante,
      percentualComprometido,
      diasParaProximoSalario: diasRestantes,
      proximaDataSalario: nextSalaryDate.toLocaleDateString('pt-BR'),
      porCategoria,
      porTipoPagamento,
    };
  }, [usuarios, activeUser, activeUserId, gastos]);

  return (
    <FinancialContext.Provider
      value={{
        usuarios,
        activeUserId,
        activeUser,
        gastos,
        cartoes,
        pagamentos,
        filteredGastos,
        searchTerm,
        categoryFilter,
        statusFilter,
        paymentTypeFilter,
        metrics,
        isBackendOnline,
        isWsConnected,
        isLoading,
        setActiveUserId,
        setSearchTerm,
        setCategoryFilter,
        setStatusFilter,
        setPaymentTypeFilter,
        refreshUsuarios,
        refreshGastos,
        refreshPagamentos,
        refreshCartoes,
        createUsuario,
        updateUsuario,
        deleteUsuario,
        togglePagamento,
    pagarParcela,
        vincularPagamento,
        desvincularPagamento,
        addGasto,
        deleteGasto,
        addCartao,
        deleteCartao,
        simulateLiveTransaction,
      }}
    >
      {children}
    </FinancialContext.Provider>
  );
};

export const useFinancial = () => {
  const context = useContext(FinancialContext);
  if (!context) {
    throw new Error('useFinancial must be used within a FinancialProvider');
  }
  return context;
};
