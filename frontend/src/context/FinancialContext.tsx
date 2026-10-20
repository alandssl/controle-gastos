import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import type { Usuario, Gasto, FinancialSummary, TipoGasto, TipoPagamento } from '../types';
import { INITIAL_MOCK_GASTOS, CATEGORIA_CONFIG } from '../data/mockData';
import { apiService } from '../services/api';
import { liveSync } from '../services/websocket';

interface FinancialContextType {
  usuarios: Usuario[];
  activeUserId: number | 'all';
  activeUser: Usuario | null;
  gastos: Gasto[];
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
  createUsuario: (data: { nome: string; salario: number; diaSalario: number }) => Promise<Usuario>;
  updateUsuario: (data: { id: number; nome: string; salario: number; diaSalario: number }) => Promise<Usuario>;
  deleteUsuario: (id: number) => Promise<boolean>;
  togglePagamento: (gastoId: number) => void;
  addGasto: (gasto: Omit<Gasto, 'id'>) => void;
  deleteGasto: (id: number) => void;
  simulateLiveTransaction: () => void;
}

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

const LOCAL_STORAGE_GASTOS_KEY = 'con_checklist_gastos_v1';

export const FinancialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [activeUserId, setActiveUserId] = useState<number | 'all'>('all');
  const [gastos, setGastos] = useState<Gasto[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_GASTOS_KEY);
      return stored ? JSON.parse(stored) : INITIAL_MOCK_GASTOS;
    } catch {
      return INITIAL_MOCK_GASTOS;
    }
  });

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
    setIsLoading(true);
    try {
      const res = await apiService.getUsuarios(query);
      setUsuarios(res.data);
      setIsBackendOnline(res.fromBackend);

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
      setIsBackendOnline(false);
    } finally {
      setIsLoading(false);
    }
  }, [activeUserId]);

  // Initial setup: start WebSocket connection and fetch initial data
  useEffect(() => {
    liveSync.connect();
    const unsubWs = liveSync.onStateChange((state) => setIsWsConnected(state));

    refreshUsuarios();

    // Listen to real-time events from other tabs or server
    const unsubEvents = liveSync.on('*', (payload) => {
      console.log("[Live Event Received]", payload.type, payload.data);
      if (payload.type === 'USER_CREATED' || payload.type === 'USER_UPDATED' || payload.type === 'USER_DELETED') {
        refreshUsuarios();
      } else if (payload.type === 'GASTO_UPDATED' || payload.type === 'GASTO_ADDED' || payload.type === 'PAGAMENTO_TOGGLED') {
        try {
          const stored = localStorage.getItem(LOCAL_STORAGE_GASTOS_KEY);
          if (stored) {
            setGastos(JSON.parse(stored));
          }
        } catch (e) {
          console.error(e);
        }
      }
    });

    return () => {
      unsubWs();
      unsubEvents();
    };
  }, [refreshUsuarios]);

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

  // Toggle payment status for an expense
  const togglePagamento = (gastoId: number) => {
    setGastos((prev) => {
      const updated = prev.map((gasto) => {
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
      });

      // Save and emit real-time event
      try {
        localStorage.setItem(LOCAL_STORAGE_GASTOS_KEY, JSON.stringify(updated));
      } catch {}
      liveSync.emit('PAGAMENTO_TOGGLED', { gastoId });
      return updated;
    });
  };

  // Add new expense
  const addGasto = (gastoData: Omit<Gasto, 'id'>) => {
    const newId = Math.max(0, ...gastos.map((g) => g.id)) + 1;
    const newGasto: Gasto = {
      ...gastoData,
      id: newId,
    };
    const updated = [newGasto, ...gastos];
    setGastos(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_GASTOS_KEY, JSON.stringify(updated));
    } catch {}
    liveSync.emit('GASTO_ADDED', newGasto);
  };

  // Delete expense
  const deleteGasto = (id: number) => {
    const updated = gastos.filter((g) => g.id !== id);
    setGastos(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_GASTOS_KEY, JSON.stringify(updated));
    } catch {}
    liveSync.emit('GASTO_DELETED', { id });
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
        const matchesType = gasto.pagamentos?.some((p) => p.tipoPagamento === paymentTypeFilter);
        if (!matchesType) return false;
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
        createUsuario,
        updateUsuario,
        deleteUsuario,
        togglePagamento,
        addGasto,
        deleteGasto,
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
