import React from 'react';
import { CreditCard, Check, Clock } from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';
import { formatCurrency } from '../utils/formatters';

export const PagamentosView: React.FC = () => {
  const { filteredGastos, togglePagamento } = useFinancial();

  // Extract all payment entries
  const allPagamentos = (filteredGastos || []).flatMap(g => 
    (g.pagamentos || []).map(p => ({
      ...p,
      gastoDescricao: g.descricao,
      gastoData: g.dataGasto,
      gastoTipo: g.tipoGasto,
      gastoTotal: g.valorGasto,
      gastoIdRef: g.id
    }))
  );

  const cartoesPagamentos = allPagamentos.filter(p => p.tipoPagamento === 'CREDITO');
  const pixPagamentos = allPagamentos.filter(p => p.tipoPagamento === 'PIX');
  const debitoPagamentos = allPagamentos.filter(p => p.tipoPagamento === 'DEBITO');

  const totalCartao = cartoesPagamentos.reduce((acc, p) => acc + (p.valorParcela || p.valorPago || 0), 0);
  const totalPix = pixPagamentos.reduce((acc, p) => acc + (p.valorPago || p.gastoTotal || 0), 0);
  const totalDebito = debitoPagamentos.reduce((acc, p) => acc + (p.valorPago || p.gastoTotal || 0), 0);

  // Group credit cards by card name
  const cardsMap: Record<string, { total: number; count: number; items: typeof cartoesPagamentos }> = {};
  cartoesPagamentos.forEach(p => {
    const cardName = p.cartao || 'Cartão Principal';
    if (!cardsMap[cardName]) {
      cardsMap[cardName] = { total: 0, count: 0, items: [] };
    }
    cardsMap[cardName].total += (p.valorParcela || p.valorPago || 0);
    cardsMap[cardName].count += 1;
    cardsMap[cardName].items.push(p);
  });

  return (
    <div className="page-content">
      {/* 3 Summary Cards */}
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1rem',
        }}
      >
        <div className="metric-card">
          <span className="metric-title">Cartões de Crédito (Fatura)</span>
          <div className="metric-value" style={{ marginTop: '0.25rem' }}>
            {formatCurrency(totalCartao)}
          </div>
          <span className="metric-footer">{cartoesPagamentos.length} compras / parcelas este mês</span>
        </div>

        <div className="metric-card">
          <span className="metric-title">Transferências PIX</span>
          <div className="metric-value" style={{ marginTop: '0.25rem' }}>
            {formatCurrency(totalPix)}
          </div>
          <span className="metric-footer">{pixPagamentos.length} pagamentos instantâneos</span>
        </div>

        <div className="metric-card">
          <span className="metric-title">Débito em Conta</span>
          <div className="metric-value" style={{ marginTop: '0.25rem' }}>
            {formatCurrency(totalDebito)}
          </div>
          <span className="metric-footer">{debitoPagamentos.length} débitos diretos</span>
        </div>
      </div>

      {/* Credit Cards Section */}
      <div className="glass-panel">
        <div className="panel-header">
          <div>
            <h3 className="panel-title">
              <CreditCard size={18} />
              Faturas por Cartão
            </h3>
            <p className="panel-subtitle">Total acumulado e parcelamentos de cada cartão</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.85rem' }}>
          {Object.entries(cardsMap).map(([cardName, info]) => (
            <div 
              key={cardName}
              style={{
                background: 'rgba(0, 0, 0, 0.25)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-sm)',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff' }}>{cardName}</div>
                  <CreditCard size={16} color="var(--text-tertiary)" />
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Fatura Atual
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', marginTop: '0.1rem' }}>
                  {formatCurrency(info.total)}
                </div>
              </div>

              <div style={{ marginTop: '0.85rem', paddingTop: '0.65rem', borderTop: '1px solid var(--border-light)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {info.count} contas vinculadas
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Complete Ledger */}
      <div className="glass-panel">
        <div className="panel-header">
          <div>
            <h3 className="panel-title">Lista de Lançamentos</h3>
            <p className="panel-subtitle">Histórico de pagamentos deste mês</p>
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>{allPagamentos.length} registros</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-tertiary)', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '0.65rem 0.85rem' }}>Status</th>
                <th style={{ padding: '0.65rem 0.85rem' }}>Conta</th>
                <th style={{ padding: '0.65rem 0.85rem' }}>Forma</th>
                <th style={{ padding: '0.65rem 0.85rem' }}>Detalhes</th>
                <th style={{ padding: '0.65rem 0.85rem' }}>Parcelas</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'right' }}>Valor</th>
              </tr>
            </thead>
            <tbody>
              {allPagamentos.map((item, idx) => (
                <tr 
                  key={`${item.id}-${idx}`}
                  style={{ borderBottom: '1px solid var(--border-light)' }}
                >
                  <td style={{ padding: '0.75rem 0.85rem' }}>
                    <button
                      onClick={() => togglePagamento(item.gastoIdRef)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        color: item.pagamentoFeito ? 'var(--success)' : 'var(--warning)',
                        fontWeight: 500,
                        fontSize: '0.78rem'
                      }}
                    >
                      {item.pagamentoFeito ? <Check size={14} /> : <Clock size={14} />}
                      {item.pagamentoFeito ? 'Pago' : 'A pagar'}
                    </button>
                  </td>

                  <td style={{ padding: '0.75rem 0.85rem', fontWeight: 500, color: '#fff' }}>
                    {item.gastoDescricao}
                  </td>

                  <td style={{ padding: '0.75rem 0.85rem' }}>
                    <span 
                      style={{
                        padding: '0.15rem 0.5rem',
                        borderRadius: '999px',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        background: 'rgba(255, 255, 255, 0.05)',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      {item.tipoPagamento || 'PIX'}
                    </span>
                  </td>

                  <td style={{ padding: '0.75rem 0.85rem', color: 'var(--text-secondary)' }}>
                    {item.cartao || '—'}
                  </td>

                  <td style={{ padding: '0.75rem 0.85rem', color: 'var(--text-secondary)' }}>
                    {item.parcelas && item.parcelas > 1 ? `${item.parcelas}x (${formatCurrency(item.valorParcela)}/mês)` : 'À vista'}
                  </td>

                  <td style={{ padding: '0.75rem 0.85rem', textAlign: 'right', fontWeight: 600, color: '#fff' }}>
                    {formatCurrency(item.valorParcela || item.valorPago || item.gastoTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
