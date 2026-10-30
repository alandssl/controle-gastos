import React, { useState, useMemo } from 'react';
import { 
  CreditCard, 
  Check, 
  Clock, 
  Plus, 
  Trash2, 
  X, 
  Calendar, 
  DollarSign, 
  ChevronLeft, 
  ChevronRight, 
  TrendingUp,
  Receipt,
  CalendarRange,
  AlertCircle
} from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import { VincularPagamentoModal } from '../components/VincularPagamentoModal';
import type { Gasto } from '../types';

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const MESES_ABREV = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

export const PagamentosView: React.FC = () => {
  const { filteredGastos, togglePagamento, pagarParcela, cartoes, addCartao, deleteCartao, usuarios, activeUser } = useFinancial();

  // Selected Month & Year for invoice inspection (defaults to current date)
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());
  const [viewMode, setViewMode] = useState<'mes' | 'todos'>('mes');

  // Modal Novo Cartão
  const [isModalCartaoOpen, setIsModalCartaoOpen] = useState(false);
  const [cartaoForm, setCartaoForm] = useState({
    diaVencimento: '10',
    valorFaturaMes: '',
    usuarioId: activeUser ? activeUser.id : (usuarios[0]?.id || 1),
  });
  const [isSavingCartao, setIsSavingCartao] = useState(false);

  // Modal Vincular Pagamento
  const [selectedGastoForPagamento, setSelectedGastoForPagamento] = useState<Gasto | null>(null);
  const [isVincularModalOpen, setIsVincularModalOpen] = useState(false);

  // Contas que ainda não possuem forma de pagamento vinculada
  const gastosSemPagamento = useMemo(() => {
    return (filteredGastos || []).filter(g => !g.pagamentos || g.pagamentos.length === 0);
  }, [filteredGastos]);

  // Month navigation helpers
  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(prev => prev - 1);
    } else {
      setSelectedMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(prev => prev + 1);
    } else {
      setSelectedMonth(prev => prev + 1);
    }
  };

  const handleCurrentMonth = () => {
    const now = new Date();
    setSelectedMonth(now.getMonth());
    setSelectedYear(now.getFullYear());
  };

  // Flatten and normalize all payments from all expenses
  const allPagamentosRaw = useMemo(() => {
    return (filteredGastos || []).flatMap(g => 
      (g.pagamentos || []).map(p => {
        const purchaseDate = g.dataGasto ? new Date(g.dataGasto) : new Date();
        const parcelasNum = Math.max(1, p.parcelas || 1);
        const valorUnitario = p.valorParcela || (p.valorPago ? p.valorPago / parcelasNum : g.valorGasto / parcelasNum);

        return {
          ...p,
          gastoDescricao: g.descricao,
          gastoData: g.dataGasto,
          gastoTipo: g.tipoGasto,
          gastoTotal: g.valorGasto,
          gastoIdRef: g.id,
          purchaseYear: isNaN(purchaseDate.getFullYear()) ? today.getFullYear() : purchaseDate.getFullYear(),
          purchaseMonth: isNaN(purchaseDate.getMonth()) ? today.getMonth() : purchaseDate.getMonth(),
          totalParcelas: parcelasNum,
          valorUnitarioParcela: valorUnitario
        };
      })
    );
  }, [filteredGastos]);

  // Calculate items due specifically in the selectedMonth / selectedYear
  const pagamentosDesteMes = useMemo(() => {
    return allPagamentosRaw.flatMap(item => {
      // Month offset from purchase date
      const monthOffset = (selectedYear - item.purchaseYear) * 12 + (selectedMonth - item.purchaseMonth);

      if (item.tipoPagamento === 'CREDITO') {
        // Active if this month falls within installment range [0, totalParcelas - 1]
        if (monthOffset >= 0 && monthOffset < item.totalParcelas) {
          const currentParcela = monthOffset + 1;
          return [{
            ...item,
            currentParcela,
            valorDevidoMes: item.valorUnitarioParcela,
            isInSelectedMonth: true,
            isInstallment: item.totalParcelas > 1
          }];
        }
        return [];
      } else {
        // PIX and DEBITO fall only into their purchase month
        if (monthOffset === 0) {
          return [{
            ...item,
            currentParcela: 1,
            valorDevidoMes: item.valorPago || item.gastoTotal || 0,
            isInSelectedMonth: true,
            isInstallment: false
          }];
        }
        return [];
      }
    });
  }, [allPagamentosRaw, selectedMonth, selectedYear]);

  // Breakdown of selected month payments
  const cartaoItensDesteMes = pagamentosDesteMes.filter(p => p.tipoPagamento === 'CREDITO');
  const pixItensDesteMes = pagamentosDesteMes.filter(p => p.tipoPagamento === 'PIX');
  const debitoItensDesteMes = pagamentosDesteMes.filter(p => p.tipoPagamento === 'DEBITO');

  const totalFaturaCartaoMes = cartaoItensDesteMes.reduce((acc, p) => acc + (p.valorDevidoMes || 0), 0);
  const totalPixMes = pixItensDesteMes.reduce((acc, p) => acc + (p.valorDevidoMes || 0), 0);
  const totalDebitoMes = debitoItensDesteMes.reduce((acc, p) => acc + (p.valorDevidoMes || 0), 0);
  const totalGeralMes = totalFaturaCartaoMes + totalPixMes + totalDebitoMes;

  // 12-Month Future Projection Roadmap for Credit Cards & Invoices
  const projecaoFutura = useMemo(() => {
    const list = [];
    const baseDate = new Date();
    // Start from current month and project next 10 months
    for (let i = 0; i < 10; i++) {
      const targetDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + i, 1);
      const targetMonth = targetDate.getMonth();
      const targetYear = targetDate.getFullYear();

      // Sum installments due in targetMonth/targetYear
      const itemsInTargetMonth = allPagamentosRaw.filter(item => {
        if (item.tipoPagamento !== 'CREDITO') return false;
        const diff = (targetYear - item.purchaseYear) * 12 + (targetMonth - item.purchaseMonth);
        return diff >= 0 && diff < item.totalParcelas;
      });

      const totalFatura = itemsInTargetMonth.reduce((acc, item) => acc + item.valorUnitarioParcela, 0);

      list.push({
        month: targetMonth,
        year: targetYear,
        label: `${MESES_ABREV[targetMonth]}/${String(targetYear).slice(-2)}`,
        total: totalFatura,
        count: itemsInTargetMonth.length,
        isSelected: targetMonth === selectedMonth && targetYear === selectedYear,
        isCurrent: targetMonth === today.getMonth() && targetYear === today.getFullYear()
      });
    }
    return list;
  }, [allPagamentosRaw, selectedMonth, selectedYear, today]);

  // Handle Add Card
  const handleCreateCartao = async (e: React.FormEvent) => {
    e.preventDefault();
    const dia = parseInt(cartaoForm.diaVencimento, 10);
    const fatura = parseFloat(cartaoForm.valorFaturaMes) || 0;
    if (isNaN(dia) || dia < 1 || dia > 31) return;

    setIsSavingCartao(true);
    try {
      await addCartao({
        diaVencimento: dia,
        valorFaturaMes: fatura,
        usuarioId: Number(cartaoForm.usuarioId),
      });
      setIsModalCartaoOpen(false);
      setCartaoForm({
        diaVencimento: '10',
        valorFaturaMes: '',
        usuarioId: activeUser ? activeUser.id : (usuarios[0]?.id || 1),
      });
    } catch (err) {
      console.error("Erro ao cadastrar cartão:", err);
    } finally {
      setIsSavingCartao(false);
    }
  };

  const isCurrentMonthSelected = selectedMonth === today.getMonth() && selectedYear === today.getFullYear();

  return (
    <div className="page-content">
      {/* Dynamic Month Selector Bar */}
      <div 
        className="glass-panel" 
        style={{ 
          padding: '1rem 1.25rem', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          border: '1px solid rgba(139, 92, 246, 0.25)',
          background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.45) 0%, rgba(15, 23, 42, 0.6) 100%)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <button 
              className="btn btn-secondary btn-icon" 
              onClick={handlePrevMonth}
              title="Mês anterior"
              style={{ width: '34px', height: '34px' }}
            >
              <ChevronLeft size={18} />
            </button>
            <button 
              className="btn btn-secondary btn-icon" 
              onClick={handleNextMonth}
              title="Próximo mês"
              style={{ width: '34px', height: '34px' }}
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CalendarRange size={20} color="var(--primary)" />
            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>
              Fatura de {MESES[selectedMonth]} {selectedYear}
            </span>
          </div>

          {isCurrentMonthSelected ? (
            <span 
              style={{ 
                fontSize: '0.72rem', 
                padding: '0.2rem 0.6rem', 
                borderRadius: '999px', 
                background: 'rgba(16, 185, 129, 0.15)', 
                color: 'var(--success)', 
                fontWeight: 600,
                border: '1px solid rgba(16, 185, 129, 0.3)'
              }}
            >
              Mês Atual
            </span>
          ) : (
            <button 
              onClick={handleCurrentMonth}
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}
            >
              Voltar p/ Mês Atual
            </button>
          )}
        </div>

        {/* Quick Month & Year Picker Dropdowns */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <select 
            className="form-select" 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', width: 'auto' }}
          >
            {MESES.map((nome, idx) => (
              <option key={idx} value={idx}>{nome}</option>
            ))}
          </select>

          <select 
            className="form-select" 
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', width: 'auto' }}
          >
            {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          <button 
            className="btn btn-primary"
            onClick={() => setIsModalCartaoOpen(true)}
            style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
          >
            <Plus size={15} />
            <span>Novo Cartão</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Cards for the Selected Month */}
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
        }}
      >
        <div className="metric-card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <span className="metric-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <CreditCard size={15} color="var(--primary)" />
            Fatura Cartões ({MESES_ABREV[selectedMonth]}/{selectedYear})
          </span>
          <div className="metric-value" style={{ marginTop: '0.35rem', color: 'var(--primary)' }}>
            {formatCurrency(totalFaturaCartaoMes)}
          </div>
          <span className="metric-footer">{cartaoItensDesteMes.length} parcelas / compras ativas neste mês</span>
        </div>

        <div className="metric-card">
          <span className="metric-title">Transferências PIX ({MESES_ABREV[selectedMonth]})</span>
          <div className="metric-value" style={{ marginTop: '0.35rem' }}>
            {formatCurrency(totalPixMes)}
          </div>
          <span className="metric-footer">{pixItensDesteMes.length} lançamentos</span>
        </div>

        <div className="metric-card">
          <span className="metric-title">Débito em Conta ({MESES_ABREV[selectedMonth]})</span>
          <div className="metric-value" style={{ marginTop: '0.35rem' }}>
            {formatCurrency(totalDebitoMes)}
          </div>
          <span className="metric-footer">{debitoItensDesteMes.length} débitos diretos</span>
        </div>

        <div className="metric-card" style={{ borderLeft: '4px solid var(--accent)' }}>
          <span className="metric-title">Total a Pagar ({MESES_ABREV[selectedMonth]})</span>
          <div className="metric-value" style={{ marginTop: '0.35rem', color: '#fff' }}>
            {formatCurrency(totalGeralMes)}
          </div>
          <span className="metric-footer">Cartão + PIX + Débito em {MESES_ABREV[selectedMonth]}</span>
        </div>
      </div>

      {/* Gastos Sem Pagamento Vinculado */}
      {gastosSemPagamento.length > 0 && (
        <div 
          className="glass-panel" 
          style={{ 
            padding: '1.1rem 1.25rem',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(15, 23, 42, 0.6) 100%)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={18} color="var(--warning)" />
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                  Contas aguardando vinculação de pagamento ({gastosSemPagamento.length})
                </h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', margin: '2px 0 0 0' }}>
                  Estas contas foram criadas sem pagamento vinculado. Vincule agora (PIX, Débito ou Cartão) para incluí-las nas faturas.
                </p>
              </div>
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--warning)' }}>
              Total: {formatCurrency(gastosSemPagamento.reduce((s, g) => s + g.valorGasto, 0))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
            {gastosSemPagamento.map(g => (
              <div 
                key={g.id}
                style={{
                  padding: '0.75rem 0.9rem',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#fff' }}>{g.descricao}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                    {formatDate(g.dataGasto)} • <strong style={{ color: 'var(--text-main)' }}>{formatCurrency(g.valorGasto)}</strong>
                  </div>
                </div>

                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    setSelectedGastoForPagamento(g);
                    setIsVincularModalOpen(true);
                  }}
                  style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                >
                  <CreditCard size={12} />
                  <span>Vincular</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Future Roadmap / Projeção de Parcelas Futuras */}
      <div className="glass-panel" style={{ padding: '1.25rem' }}>
        <div className="panel-header" style={{ marginBottom: '1rem' }}>
          <div>
            <h3 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={18} color="var(--primary)" />
              Projeção de Faturas Futuras (Próximos Meses)
            </h3>
            <p className="panel-subtitle">
              Acompanhe quanto você tem a pagar nos próximos meses com compras parceladas. Clique em qualquer mês para abrir a fatura.
            </p>
          </div>
        </div>

        {/* Horizontal scrollable roadmap */}
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
            gap: '0.75rem',
            overflowX: 'auto',
            paddingBottom: '0.25rem'
          }}
        >
          {projecaoFutura.map((proj) => {
            const hasPurchases = proj.total > 0;
            return (
              <div
                key={`${proj.year}-${proj.month}`}
                onClick={() => {
                  setSelectedMonth(proj.month);
                  setSelectedYear(proj.year);
                }}
                style={{
                  background: proj.isSelected 
                    ? 'rgba(139, 92, 246, 0.22)' 
                    : 'rgba(0, 0, 0, 0.3)',
                  border: proj.isSelected 
                    ? '2px solid var(--primary)' 
                    : '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.75rem 0.65rem',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  if (!proj.isSelected) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
                }}
                onMouseLeave={(e) => {
                  if (!proj.isSelected) e.currentTarget.style.borderColor = 'var(--border-light)';
                }}
              >
                {proj.isCurrent && (
                  <span 
                    style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: 'var(--success)'
                    }} 
                    title="Mês Atual"
                  />
                )}
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: proj.isSelected ? 'var(--primary)' : 'var(--text-secondary)', textTransform: 'uppercase' }}>
                  {proj.label}
                </div>
                <div style={{ fontSize: '0.98rem', fontWeight: 700, color: hasPurchases ? '#fff' : 'var(--text-tertiary)', marginTop: '0.35rem' }}>
                  {formatCurrency(proj.total)}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>
                  {proj.count === 0 ? 'Sem parcelas' : `${proj.count} parcela(s)`}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Credit Cards Section - Model Cartao */}
      <div className="glass-panel">
        <div className="panel-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 className="panel-title">
              <CreditCard size={18} />
              Model de Cartões Cadastrados & Faturas de {MESES[selectedMonth]}/{selectedYear}
            </h3>
            <p className="panel-subtitle">
              Resumo da fatura calculada em {MESES[selectedMonth]} para cada cartão cadastrado
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {cartoes.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', padding: '1.5rem', textAlign: 'center', color: 'var(--text-tertiary)', border: '1px dashed var(--border-light)', borderRadius: 'var(--radius-sm)' }}>
              Nenhum cartão cadastrado ainda. Clique em "Novo Cartão" para adicionar.
            </div>
          ) : (
            cartoes.map((cartao) => {
              const titular = usuarios.find(u => u.id === cartao.usuarioId)?.nome || `Usuário #${cartao.usuarioId}`;
              
              // Parcelas e compras vinculadas a este cartão no MÊS SELECIONADO
              const vinculadosMes = cartaoItensDesteMes.filter(p => p.cartaoId === cartao.id);
              const totalFaturaCalculadaMes = vinculadosMes.reduce((acc, p) => acc + (p.valorDevidoMes || 0), 0);

              // Todas as compras de qualquer mês vinculadas
              const todasComprasCartao = allPagamentosRaw.filter(p => p.cartaoId === cartao.id);

              return (
                <div 
                  key={cartao.id}
                  style={{
                    background: 'rgba(0, 0, 0, 0.28)',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '1.15rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <CreditCard size={17} color="var(--primary)" />
                        Cartão #{cartao.id}
                      </div>
                      <button
                        onClick={() => deleteCartao(cartao.id)}
                        title="Remover cartão"
                        style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: '3px' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                      Titular: <strong style={{ color: '#fff' }}>{titular}</strong>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', padding: '0.65rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                      <div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>
                          Vencimento
                        </div>
                        <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#fff', marginTop: '0.15rem' }}>
                          Todo dia {cartao.diaVencimento}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>
                          Fatura Cadastrada
                        </div>
                        <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                          {formatCurrency(cartao.valorFaturaMes)}
                        </div>
                      </div>
                    </div>

                    {/* Calculated Invoice for Selected Month */}
                    <div style={{ marginTop: '0.85rem', padding: '0.65rem 0.85rem', background: 'rgba(139, 92, 246, 0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                      <div style={{ fontSize: '0.68rem', color: 'var(--primary)', textTransform: 'uppercase', fontWeight: 700 }}>
                        Fatura em {MESES_ABREV[selectedMonth]}/{selectedYear}
                      </div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', marginTop: '0.2rem' }}>
                        {formatCurrency(totalFaturaCalculadaMes)}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                        {vinculadosMes.length === 0 ? 'Nenhuma compra para este mês' : `${vinculadosMes.length} parcela(s) vencem em ${MESES_ABREV[selectedMonth]}`}
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: '1rem', paddingTop: '0.65rem', borderTop: '1px solid var(--border-light)', fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{todasComprasCartao.length} compras no histórico total</span>
                    <span style={{ color: 'var(--text-tertiary)' }}>Dia {cartao.diaVencimento}/{MESES_ABREV[selectedMonth]}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal Novo Cartão */}
      {isModalCartaoOpen && (
        <div className="modal-overlay" onClick={() => setIsModalCartaoOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CreditCard size={18} color="var(--primary)" />
                Cadastrar Cartão
              </h3>
              <button 
                className="btn btn-secondary btn-icon" 
                onClick={() => setIsModalCartaoOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateCartao}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Usuário Titular</label>
                  <select
                    className="form-select"
                    value={cartaoForm.usuarioId}
                    onChange={(e) => setCartaoForm({ ...cartaoForm, usuarioId: Number(e.target.value) })}
                  >
                    {usuarios.map(u => (
                      <option key={u.id} value={u.id}>{u.nome}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Calendar size={13} />
                    Dia de Vencimento da Fatura (1 a 31)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    className="form-input"
                    value={cartaoForm.diaVencimento}
                    onChange={(e) => setCartaoForm({ ...cartaoForm, diaVencimento: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <DollarSign size={13} />
                    Valor da Fatura Base / Limite (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    placeholder="0,00"
                    value={cartaoForm.valorFaturaMes}
                    onChange={(e) => setCartaoForm({ ...cartaoForm, valorFaturaMes: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setIsModalCartaoOpen(false)}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={isSavingCartao}
                >
                  {isSavingCartao ? 'Salvando...' : 'Cadastrar Cartão'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Ledger with Toggle (Month vs All) */}
      <div className="glass-panel">
        <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Receipt size={17} color="var(--primary)" />
              {viewMode === 'mes' ? `Lançamentos e Fatura de ${MESES[selectedMonth]} ${selectedYear}` : 'Todos os Lançamentos'}
            </h3>
            <p className="panel-subtitle">
              {viewMode === 'mes' 
                ? `Mostrando compras e parcelas ativas especificamente com vencimento em ${MESES[selectedMonth]} de ${selectedYear}`
                : 'Mostrando o histórico global sem filtro de mês'}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', padding: '3px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
              <button 
                onClick={() => setViewMode('mes')}
                style={{
                  background: viewMode === 'mes' ? 'var(--primary)' : 'transparent',
                  color: viewMode === 'mes' ? '#fff' : 'var(--text-secondary)',
                  border: 'none',
                  padding: '0.35rem 0.75rem',
                  borderRadius: 'var(--radius-xs)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Fatura de {MESES_ABREV[selectedMonth]} ({pagamentosDesteMes.length})
              </button>
              <button 
                onClick={() => setViewMode('todos')}
                style={{
                  background: viewMode === 'todos' ? 'var(--primary)' : 'transparent',
                  color: viewMode === 'todos' ? '#fff' : 'var(--text-secondary)',
                  border: 'none',
                  padding: '0.35rem 0.75rem',
                  borderRadius: 'var(--radius-xs)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Todos ({allPagamentosRaw.length})
              </button>
            </div>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-tertiary)', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '0.65rem 0.85rem' }}>Status</th>
                <th style={{ padding: '0.65rem 0.85rem' }}>Conta / Compra</th>
                <th style={{ padding: '0.65rem 0.85rem' }}>Forma</th>
                <th style={{ padding: '0.65rem 0.85rem' }}>Cartão / Detalhes</th>
                <th style={{ padding: '0.65rem 0.85rem' }}>Parcela no Mês</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'right' }}>
                  {viewMode === 'mes' ? `Valor em ${MESES_ABREV[selectedMonth]}` : 'Valor Parcela/Total'}
                </th>
              </tr>
            </thead>
            <tbody>
              {(viewMode === 'mes' ? pagamentosDesteMes : allPagamentosRaw).length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                    Nenhuma fatura ou lançamento encontrado para {MESES[selectedMonth]} de {selectedYear}.
                  </td>
                </tr>
              ) : (
                (viewMode === 'mes' ? pagamentosDesteMes : allPagamentosRaw).map((item: any, idx: number) => {
                  const isCredit = item.tipoPagamento === 'CREDITO';
                  const valorExibido = viewMode === 'mes' ? item.valorDevidoMes : (item.valorUnitarioParcela || item.valorPago || item.gastoTotal);
                  // Em parcelas, cada mês tem a sua parcela paga ou não
                  const parcelaIndividual = isCredit && item.totalParcelas > 1 && viewMode === 'mes' && Boolean(item.currentParcela);
                  const parcelaPaga = item.pagamentoFeito || (parcelaIndividual && item.currentParcela <= (item.parcelasPagas || 0));

                  return (
                    <tr 
                      key={`${item.id}-${idx}`}
                      style={{ borderBottom: '1px solid var(--border-light)' }}
                    >
                      <td style={{ padding: '0.75rem 0.85rem' }}>
                        <button
                          onClick={() => parcelaIndividual
                            ? pagarParcela(item.gastoIdRef, parcelaPaga ? item.currentParcela - 1 : item.currentParcela)
                            : togglePagamento(item.gastoIdRef)}
                          title={parcelaIndividual ? (parcelaPaga ? 'Desmarcar esta parcela' : 'Marcar esta parcela como paga') : undefined}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            color: parcelaPaga ? 'var(--success)' : 'var(--warning)',
                            fontWeight: 500,
                            fontSize: '0.78rem'
                          }}
                        >
                          {parcelaPaga ? <Check size={14} /> : <Clock size={14} />}
                          {parcelaPaga ? (item.pagamentoFeito && item.totalParcelas > 1 ? 'Compra quitada' : 'Pago') : 'A pagar'}
                        </button>
                      </td>

                      <td style={{ padding: '0.75rem 0.85rem', fontWeight: 500, color: '#fff' }}>
                        <div>{item.gastoDescricao}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                          Comprado em {formatDate(item.gastoData)}
                        </div>
                      </td>

                      <td style={{ padding: '0.75rem 0.85rem' }}>
                        <span 
                          style={{
                            padding: '0.15rem 0.5rem',
                            borderRadius: '999px',
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            background: isCredit ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                            color: isCredit ? 'var(--primary)' : 'var(--text-secondary)',
                            border: isCredit ? '1px solid rgba(139, 92, 246, 0.3)' : 'none'
                          }}
                        >
                          {item.tipoPagamento || 'PIX'}
                        </span>
                      </td>

                      <td style={{ padding: '0.75rem 0.85rem', color: 'var(--text-secondary)' }}>
                        {typeof item.cartao === 'object' 
                          ? `Cartão dia ${item.cartao.diaVencimento}` 
                          : (item.cartao || (item.cartaoId ? `Cartão #${item.cartaoId}` : '—'))}
                      </td>

                      <td style={{ padding: '0.75rem 0.85rem', color: 'var(--text-secondary)' }}>
                        {isCredit && item.totalParcelas > 1 ? (
                          <span style={{ 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '0.35rem',
                            background: 'rgba(255, 255, 255, 0.04)',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            fontWeight: 600,
                            color: '#fff'
                          }}>
                            {item.currentParcela ? `${item.currentParcela}ª de ${item.totalParcelas}` : `${item.totalParcelas}x`}
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', fontWeight: 400 }}>
                              (Total: {formatCurrency(item.gastoTotal)})
                            </span>
                          </span>
                        ) : (
                          'À vista'
                        )}
                      </td>

                      <td style={{ padding: '0.75rem 0.85rem', textAlign: 'right', fontWeight: 600, color: '#fff' }}>
                        <div style={{ fontSize: '0.95rem' }}>{formatCurrency(valorExibido)}</div>
                        {isCredit && item.totalParcelas > 1 && viewMode === 'mes' && (
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>
                            de {formatCurrency(item.gastoTotal)} total
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Dedicado para Vincular Pagamento */}
      <VincularPagamentoModal
        gasto={selectedGastoForPagamento}
        isOpen={isVincularModalOpen}
        onClose={() => {
          setIsVincularModalOpen(false);
          setSelectedGastoForPagamento(null);
        }}
      />
    </div>
  );
};
