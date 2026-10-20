import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  Calendar, 
  ChevronRight,
  TrendingDown,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';
import { formatCurrency } from '../utils/formatters';
import { CATEGORIA_CONFIG } from '../data/mockData';
import type { ActiveTab } from '../types';

interface DashboardViewProps {
  onNavigateTab: (tab: ActiveTab) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigateTab }) => {
  const { 
    metrics, 
    activeUser, 
    filteredGastos, 
    togglePagamento 
  } = useFinancial();

  // Pending gastos for quick checklist preview
  const pendingGastos = (filteredGastos || []).filter(g => !g.pagamentos?.some(p => p.pagamentoFeito)).slice(0, 5);

  const categoriesWithSpending = Object.entries(metrics.porCategoria).filter(([_, data]) => data.total > 0);

  // Friendly greeting message
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  return (
    <div className="page-content">
      {/* Friendly Human Header Banner */}
      <div 
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div 
            style={{
              width: 42,
              height: 42,
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(79, 70, 229, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#818cf8'
            }}
          >
            <Calendar size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#fff' }}>
              {activeUser 
                ? `${getGreeting()}, ${activeUser.nome.split(' ')[0]}! Salário previsto para o dia ${activeUser.diaSalario}`
                : `${getGreeting()}! Resumo financeiro consolidado`}
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
              {metrics.diasParaProximoSalario === 0
                ? 'Hoje é o dia do seu pagamento!'
                : `Faltam cerca de ${metrics.diasParaProximoSalario} dias para o próximo salário (${metrics.proximaDataSalario}).`}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>
              Salário Base
            </span>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--success)' }}>
              {formatCurrency(metrics.totalSalario)}
            </div>
          </div>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => onNavigateTab('gastos')}
          >
            Abrir Checklist <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {/* Main 4 Metric Cards */}
      <div className="metrics-grid">
        {/* Card 1: Salário */}
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Salário Base</span>
          </div>
          <div className="metric-value">{formatCurrency(metrics.totalSalario)}</div>
          <div className="metric-footer">
            <span>{activeUser ? `Renda de ${activeUser.nome}` : 'Soma de todas as rendas'}</span>
          </div>
        </div>

        {/* Card 2: Total de Contas */}
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Total em Contas</span>
          </div>
          <div className="metric-value" style={{ color: '#f87171' }}>
            {formatCurrency(metrics.totalGastos)}
          </div>
          <div className="metric-footer">
            <span>{metrics.percentualComprometido}% da renda comprometida</span>
          </div>
          <div className="progress-container">
            <div 
              className="progress-bar-fill" 
              style={{ 
                width: `${Math.min(100, metrics.percentualComprometido)}%`,
                background: metrics.percentualComprometido > 75 ? '#ef4444' : '#6366f1'
              }} 
            />
          </div>
        </div>

        {/* Card 3: Já Pago */}
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Já Pago</span>
            <CheckCircle2 size={16} color="var(--success)" />
          </div>
          <div className="metric-value" style={{ color: 'var(--success)' }}>
            {formatCurrency(metrics.totalPago)}
          </div>
          <div className="metric-footer">
            <span>
              {metrics.totalGastos > 0 
                ? `${Math.round((metrics.totalPago / metrics.totalGastos) * 100)}% das contas quitadas` 
                : 'Nenhum lançamento'}
            </span>
          </div>
        </div>

        {/* Card 4: Falta Pagar */}
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Falta Pagar</span>
            <Clock size={16} color="var(--warning)" />
          </div>
          <div className="metric-value" style={{ color: '#fbbf24' }}>
            {formatCurrency(metrics.totalPendente)}
          </div>
          <div className="metric-footer">
            <span>{pendingGastos.length} contas em aberto</span>
          </div>
        </div>

        {/* Card 5: Sobra Prevista */}
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Sobra Estimada no Fim do Mês</span>
          </div>
          <div className="metric-value" style={{ color: metrics.saldoRestante >= 0 ? '#38bdf8' : '#f87171' }}>
            {formatCurrency(metrics.saldoRestante)}
          </div>
          <div className="metric-footer">
            <span>Economia livre após pagar tudo</span>
          </div>
        </div>
      </div>

      {/* Middle Grid: Categories Breakdown & Quick Checklist */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
        
        {/* Category Breakdown */}
        <div className="glass-panel">
          <div className="panel-header">
            <div>
              <h3 className="panel-title">Gastos por Categoria</h3>
              <p className="panel-subtitle">Divisão do seu orçamento</p>
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
              {categoriesWithSpending.length} categorias
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginTop: '0.5rem' }}>
            {categoriesWithSpending.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
                Nenhum gasto registrado ainda.
              </div>
            ) : (
              categoriesWithSpending.map(([key, data]) => {
                const config = CATEGORIA_CONFIG[key] || CATEGORIA_CONFIG.OUTROS;
                return (
                  <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{config.label}</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>({data.count})</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 600, color: '#fff' }}>{formatCurrency(data.total)}</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', minWidth: '30px', textAlign: 'right' }}>
                          {data.percentual}%
                        </span>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 999, overflow: 'hidden' }}>
                      <div 
                        style={{ 
                          width: `${data.percentual}%`, 
                          height: '100%', 
                          background: config.color,
                          borderRadius: 999 
                        }} 
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Quick Checklist */}
        <div className="glass-panel">
          <div className="panel-header">
            <div>
              <h3 className="panel-title">
                Contas Próximas para Pagar
              </h3>
              <p className="panel-subtitle">Clique para marcar como paga</p>
            </div>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => onNavigateTab('gastos')}
            >
              Ver Todas ({filteredGastos.length})
            </button>
          </div>

          <div className="checklist-container" style={{ marginTop: '0.5rem' }}>
            {pendingGastos.length === 0 ? (
              <div 
                style={{ 
                  padding: '2rem 1rem', 
                  textAlign: 'center', 
                  color: 'var(--text-secondary)',
                  border: '1px dashed var(--border-light)',
                  borderRadius: 'var(--radius-md)'
                }}
              >
                <CheckCircle2 size={32} color="var(--success)" style={{ margin: '0 auto 0.5rem auto' }} />
                <h4 style={{ color: '#fff', fontSize: '0.92rem', marginBottom: '0.2rem' }}>Tudo em dia!</h4>
                <p style={{ fontSize: '0.78rem' }}>Você não tem contas pendentes no momento.</p>
              </div>
            ) : (
              pendingGastos.map((gasto) => {
                const config = CATEGORIA_CONFIG[gasto.tipoGasto] || CATEGORIA_CONFIG.OUTROS;
                const payment = gasto.pagamentos?.[0];

                return (
                  <div key={gasto.id} className="checklist-item">
                    <div className="checklist-left">
                      <div 
                        className="custom-checkbox"
                        onClick={() => togglePagamento(gasto.id)}
                        title="Marcar como Pago"
                      />
                      <div className="checklist-details">
                        <h4>{gasto.descricao}</h4>
                        <div className="checklist-meta">
                          <span 
                            className="category-tag" 
                            style={{ background: config.bg, color: config.color }}
                          >
                            {config.label}
                          </span>
                          <span>• {payment?.tipoPagamento || 'PIX'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="checklist-right">
                      <div>
                        <div className="item-value">{formatCurrency(gasto.valorGasto)}</div>
                        <span className="item-payment-badge" style={{ color: 'var(--warning)' }}>A pagar</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
