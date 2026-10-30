import React, { useMemo, useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  Calendar, 
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';
import { formatCurrency } from '../utils/formatters';
import { CATEGORIA_CONFIG } from '../data/mockData';
import { chaveMes, gerarLancamentos, MESES_NOMES } from '../utils/installments';
import type { LancamentoMensal } from '../utils/installments';
import type { ActiveTab } from '../types';

interface DashboardViewProps {
  onNavigateTab: (tab: ActiveTab) => void;
}

type ModoVisao = 'mes' | 'total';

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigateTab }) => {
  const { 
    metrics, 
    activeUser, 
    activeUserId,
    gastos,
    togglePagamento,
    pagarParcela
  } = useFinancial();

  const hoje = new Date();
  const [modo, setModo] = useState<ModoVisao>('mes');
  const [selectedMonth, setSelectedMonth] = useState(hoje.getMonth());
  const [selectedYear, setSelectedYear] = useState(hoje.getFullYear());

  // Todos os lançamentos (parcelas e compras) da pessoa selecionada
  const lancamentos = useMemo(() => {
    const escopo = activeUserId === 'all' ? gastos : gastos.filter(g => g.usuarioId === activeUserId);
    return gerarLancamentos(escopo);
  }, [gastos, activeUserId]);

  // Lançamentos do período escolhido (mês ou tudo)
  const periodo = useMemo(() => {
    const lista = modo === 'total'
      ? lancamentos
      : lancamentos.filter(l => l.month === selectedMonth && l.year === selectedYear);
    // A pagar primeiro, pagos no fim
    return [...lista].sort((a, b) => Number(a.paga) - Number(b.paga) || chaveMes(a.year, a.month) - chaveMes(b.year, b.month));
  }, [lancamentos, modo, selectedMonth, selectedYear]);

  const resumo = useMemo(() => {
    let totalGastos = 0;
    let totalPago = 0;
    const porCategoria: Record<string, { total: number; count: number; percentual: number }> = {};

    periodo.forEach(l => {
      totalGastos += l.valor;
      if (l.paga) totalPago += l.valor;
      if (!porCategoria[l.tipoGasto]) porCategoria[l.tipoGasto] = { total: 0, count: 0, percentual: 0 };
      porCategoria[l.tipoGasto].total += l.valor;
      porCategoria[l.tipoGasto].count += 1;
    });

    Object.values(porCategoria).forEach(c => {
      c.percentual = totalGastos > 0 ? Math.round((c.total / totalGastos) * 100) : 0;
    });

    const totalPendente = totalGastos - totalPago;
    const percentualComprometido = metrics.totalSalario > 0
      ? Math.min(100, Math.round((totalGastos / metrics.totalSalario) * 100))
      : 0;

    return {
      totalGastos,
      totalPago,
      totalPendente,
      percentualComprometido,
      sobra: metrics.totalSalario - totalGastos,
      qtdAbertas: periodo.filter(l => !l.paga).length,
      porCategoria,
    };
  }, [periodo, metrics.totalSalario]);

  // Visão de todos os meses (somente meses que têm lançamentos)
  const todosMeses = useMemo(() => {
    const mapa = new Map<number, { year: number; month: number; total: number; pago: number; itens: number }>();
    lancamentos.forEach(l => {
      const k = chaveMes(l.year, l.month);
      const atual = mapa.get(k) || { year: l.year, month: l.month, total: 0, pago: 0, itens: 0 };
      atual.total += l.valor;
      if (l.paga) atual.pago += l.valor;
      atual.itens += 1;
      mapa.set(k, atual);
    });
    return [...mapa.entries()].sort((a, b) => a[0] - b[0]).map(([, v]) => v);
  }, [lancamentos]);

  const categoriesWithSpending = Object.entries(resumo.porCategoria).filter(([, data]) => data.total > 0);

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(y => y - 1);
    } else {
      setSelectedMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(y => y + 1);
    } else {
      setSelectedMonth(m => m + 1);
    }
  };

  const handleCurrentMonth = () => {
    setSelectedMonth(hoje.getMonth());
    setSelectedYear(hoje.getFullYear());
    setModo('mes');
  };

  // Marca/desmarca o pagamento de um lançamento
  const handleToggleLancamento = (l: LancamentoMensal) => {
    if (l.semPagamento) {
      // Precisa vincular um pagamento antes (feito no checklist)
      onNavigateTab('gastos');
      return;
    }
    if (l.totalParcelas > 1) {
      // Pagar a parcela N quita até a N; desmarcar volta para N-1
      pagarParcela(l.gastoId, l.paga ? l.parcelaNumero - 1 : l.parcelaNumero);
    } else {
      togglePagamento(l.gastoId);
    }
  };

  // Friendly greeting message
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const tituloPeriodo = modo === 'total' ? 'Todos os meses' : `${MESES_NOMES[selectedMonth]} de ${selectedYear}`;

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

      {/* Seletor de período: mês a mês ou total */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          marginTop: '1rem'
        }}
      >
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button
            className={`btn btn-sm ${modo === 'mes' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setModo('mes')}
          >
            Mensal
          </button>
          <button
            className={`btn btn-sm ${modo === 'total' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setModo('total')}
          >
            Total
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', opacity: modo === 'mes' ? 1 : 0.4 }}>
          <button className="btn btn-secondary btn-sm" onClick={handlePrevMonth} disabled={modo !== 'mes'} title="Mês anterior">
            <ChevronLeft size={15} />
          </button>
          <select
            className="form-input"
            style={{ width: 'auto', padding: '0.3rem 0.6rem' }}
            value={selectedMonth}
            disabled={modo !== 'mes'}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
          >
            {MESES_NOMES.map((nome, idx) => (
              <option key={nome} value={idx}>{nome}</option>
            ))}
          </select>
          <input
            type="number"
            className="form-input"
            style={{ width: '5.5rem', padding: '0.3rem 0.6rem' }}
            value={selectedYear}
            disabled={modo !== 'mes'}
            onChange={(e) => setSelectedYear(Number(e.target.value) || hoje.getFullYear())}
          />
          <button className="btn btn-secondary btn-sm" onClick={handleNextMonth} disabled={modo !== 'mes'} title="Próximo mês">
            <ChevronRight size={15} />
          </button>
          <button className="btn btn-secondary btn-sm" onClick={handleCurrentMonth}>
            Mês atual
          </button>
        </div>
      </div>

      {/* Main Metric Cards (do período escolhido) */}
      <div className="metrics-grid" style={{ marginTop: '1rem' }}>
        {/* Card 1: Salário */}
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Salário Base</span>
          </div>
          <div className="metric-value">{formatCurrency(metrics.totalSalario)}</div>
          <div className="metric-footer">
            <span>{activeUser ? `Renda mensal de ${activeUser.nome}` : 'Soma das rendas mensais'}</span>
          </div>
        </div>

        {/* Card 2: Total de Contas */}
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">
              {modo === 'mes' ? `Contas de ${MESES_NOMES[selectedMonth]}` : 'Total em Contas'}
            </span>
          </div>
          <div className="metric-value" style={{ color: '#f87171' }}>
            {formatCurrency(resumo.totalGastos)}
          </div>
          <div className="metric-footer">
            <span>
              {modo === 'mes'
                ? `${resumo.percentualComprometido}% da renda comprometida`
                : `${periodo.length} lançamentos (parcelas somadas)`}
            </span>
          </div>
          {modo === 'mes' && (
            <div className="progress-container">
              <div 
                className="progress-bar-fill" 
                style={{ 
                  width: `${Math.min(100, resumo.percentualComprometido)}%`,
                  background: resumo.percentualComprometido > 75 ? '#ef4444' : '#6366f1'
                }} 
              />
            </div>
          )}
        </div>

        {/* Card 3: Já Pago */}
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Já Pago</span>
            <CheckCircle2 size={16} color="var(--success)" />
          </div>
          <div className="metric-value" style={{ color: 'var(--success)' }}>
            {formatCurrency(resumo.totalPago)}
          </div>
          <div className="metric-footer">
            <span>
              {resumo.totalGastos > 0 
                ? `${Math.round((resumo.totalPago / resumo.totalGastos) * 100)}% quitado` 
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
            {formatCurrency(resumo.totalPendente)}
          </div>
          <div className="metric-footer">
            <span>{resumo.qtdAbertas} lançamentos em aberto</span>
          </div>
        </div>

        {/* Card 5: Sobra Prevista (só faz sentido no mês) */}
        {modo === 'mes' && (
          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-title">Sobra Estimada do Mês</span>
            </div>
            <div className="metric-value" style={{ color: resumo.sobra >= 0 ? '#38bdf8' : '#f87171' }}>
              {formatCurrency(resumo.sobra)}
            </div>
            <div className="metric-footer">
              <span>Salário menos as contas de {MESES_NOMES[selectedMonth]}</span>
            </div>
          </div>
        )}
      </div>

      {/* Middle Grid: Categories Breakdown & Quick Checklist */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
        
        {/* Category Breakdown */}
        <div className="glass-panel">
          <div className="panel-header">
            <div>
              <h3 className="panel-title">Gastos por Categoria</h3>
              <p className="panel-subtitle">{tituloPeriodo}</p>
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
              {categoriesWithSpending.length} categorias
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginTop: '0.5rem' }}>
            {categoriesWithSpending.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
                Nenhum gasto neste período.
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

        {/* Lançamentos do período (parcelas e contas) */}
        <div className="glass-panel">
          <div className="panel-header">
            <div>
              <h3 className="panel-title">Contas e Parcelas — {tituloPeriodo}</h3>
              <p className="panel-subtitle">Clique para marcar como paga (em parcelas, marca aquela parcela)</p>
            </div>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => onNavigateTab('gastos')}
            >
              Ver Checklist
            </button>
          </div>

          <div className="checklist-container" style={{ marginTop: '0.5rem', maxHeight: 420, overflowY: 'auto' }}>
            {periodo.length === 0 ? (
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
                <h4 style={{ color: '#fff', fontSize: '0.92rem', marginBottom: '0.2rem' }}>Nada neste período</h4>
                <p style={{ fontSize: '0.78rem' }}>Não há contas nem parcelas para {tituloPeriodo}.</p>
              </div>
            ) : (
              periodo.map((l) => {
                const config = CATEGORIA_CONFIG[l.tipoGasto] || CATEGORIA_CONFIG.OUTROS;
                const parcelado = l.totalParcelas > 1;

                return (
                  <div key={l.key} className={`checklist-item ${l.paga ? 'is-paid' : ''}`}>
                    <div className="checklist-left">
                      <div 
                        className={`custom-checkbox ${l.paga ? 'checked' : ''}`}
                        onClick={() => handleToggleLancamento(l)}
                        title={
                          l.semPagamento
                            ? 'Sem pagamento vinculado. Clique para ir ao checklist.'
                            : parcelado
                              ? (l.paga ? `Desmarcar a parcela ${l.parcelaNumero}` : `Marcar a parcela ${l.parcelaNumero} como paga`)
                              : (l.paga ? 'Marcar como não paga' : 'Marcar como paga')
                        }
                      >
                        {l.paga ? '✓' : null}
                      </div>
                      <div className="checklist-details">
                        <h4>{l.descricao}</h4>
                        <div className="checklist-meta">
                          <span 
                            className="category-tag" 
                            style={{ background: config.bg, color: config.color }}
                          >
                            {config.label}
                          </span>
                          <span>• {l.tipoPagamento || 'Sem pagamento'}</span>
                          {parcelado && (
                            <span>
                              • Parcela {l.parcelaNumero}/{l.totalParcelas}
                              {modo === 'total' && ` (${MESES_NOMES[l.month].slice(0, 3)}/${l.year})`}
                            </span>
                          )}
                          {modo === 'total' && !parcelado && (
                            <span>• {MESES_NOMES[l.month].slice(0, 3)}/{l.year}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="checklist-right">
                      <div>
                        <div className="item-value">{formatCurrency(l.valor)}</div>
                        <span 
                          className="item-payment-badge" 
                          style={{ color: l.paga ? 'var(--success)' : 'var(--warning)' }}
                        >
                          {l.compraQuitada
                            ? 'Compra quitada'
                            : l.paga
                              ? 'Paga'
                              : (l.semPagamento ? 'Sem pagamento' : 'A pagar')}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Visão de todos os meses */}
      <div className="glass-panel" style={{ marginTop: '1.25rem' }}>
        <div className="panel-header">
          <div>
            <h3 className="panel-title">Todos os Meses</h3>
            <p className="panel-subtitle">Clique em um mês para ver os detalhes dele</p>
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
            {todosMeses.length} meses com lançamentos
          </span>
        </div>

        {todosMeses.length === 0 ? (
          <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
            Nenhum lançamento registrado ainda.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: 'var(--text-tertiary)', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.6rem 0.85rem' }}>Mês</th>
                  <th style={{ padding: '0.6rem 0.85rem', textAlign: 'right' }}>Total</th>
                  <th style={{ padding: '0.6rem 0.85rem', textAlign: 'right' }}>Pago</th>
                  <th style={{ padding: '0.6rem 0.85rem', textAlign: 'right' }}>Falta</th>
                  <th style={{ padding: '0.6rem 0.85rem' }}>Situação</th>
                </tr>
              </thead>
              <tbody>
                {todosMeses.map((m) => {
                  const falta = m.total - m.pago;
                  const quitado = falta <= 0.009;
                  const selecionado = modo === 'mes' && m.month === selectedMonth && m.year === selectedYear;
                  return (
                    <tr
                      key={`${m.year}-${m.month}`}
                      onClick={() => {
                        setSelectedMonth(m.month);
                        setSelectedYear(m.year);
                        setModo('mes');
                      }}
                      style={{
                        cursor: 'pointer',
                        borderBottom: '1px solid var(--border-light)',
                        background: selecionado ? 'rgba(99, 102, 241, 0.12)' : 'transparent'
                      }}
                    >
                      <td style={{ padding: '0.65rem 0.85rem', color: '#fff', fontWeight: 500 }}>
                        {MESES_NOMES[m.month]} / {m.year}
                      </td>
                      <td style={{ padding: '0.65rem 0.85rem', textAlign: 'right', color: '#fff' }}>{formatCurrency(m.total)}</td>
                      <td style={{ padding: '0.65rem 0.85rem', textAlign: 'right', color: 'var(--success)' }}>{formatCurrency(m.pago)}</td>
                      <td style={{ padding: '0.65rem 0.85rem', textAlign: 'right', color: quitado ? 'var(--text-tertiary)' : '#fbbf24' }}>
                        {formatCurrency(Math.max(0, falta))}
                      </td>
                      <td style={{ padding: '0.65rem 0.85rem', color: quitado ? 'var(--success)' : 'var(--warning)', fontWeight: 600 }}>
                        {quitado ? 'Mês pago' : `${m.itens} lançamentos`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
