import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Check, 
  CheckSquare,
  X
} from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';
import { CATEGORIA_CONFIG } from '../data/mockData';
import type { TipoGasto, TipoPagamento, Gasto } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';

export const GastosChecklistView: React.FC = () => {
  const { 
    filteredGastos, 
    searchTerm, 
    setSearchTerm, 
    categoryFilter, 
    setCategoryFilter, 
    statusFilter, 
    setStatusFilter, 
    paymentTypeFilter, 
    setPaymentTypeFilter,
    togglePagamento,
    addGasto,
    deleteGasto,
    activeUser,
    usuarios
  } = useFinancial();

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    descricao: '',
    tipoGasto: 'ALIMENTACAO' as TipoGasto,
    valorGasto: '',
    usuarioId: activeUser ? activeUser.id : (usuarios[0]?.id || 1),
    tipoPagamento: 'PIX' as TipoPagamento,
    cartao: '',
    parcelas: '1',
    pagamentoFeito: false
  });

  // Calculate filtered totals
  const totalFiltrado = (filteredGastos || []).reduce((sum, g) => sum + (g.valorGasto || 0), 0);
  const totalPagoFiltrado = (filteredGastos || [])
    .filter(g => g.pagamentos?.some(p => p.pagamentoFeito))
    .reduce((sum, g) => sum + (g.valorGasto || 0), 0);
  const totalPendenteFiltrado = totalFiltrado - totalPagoFiltrado;

  const handleOpenModal = () => {
    setFormData({
      descricao: '',
      tipoGasto: 'ALIMENTACAO',
      valorGasto: '',
      usuarioId: activeUser ? activeUser.id : (usuarios[0]?.id || 1),
      tipoPagamento: 'PIX',
      cartao: '',
      parcelas: '1',
      pagamentoFeito: false
    });
    setIsModalOpen(true);
  };

  const handleCreateGasto = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(formData.valorGasto);
    if (!formData.descricao.trim() || isNaN(val) || val <= 0) {
      return;
    }

    const parcelasNum = parseInt(formData.parcelas, 10) || 1;
    const valorParcela = val / parcelasNum;

    addGasto({
      descricao: formData.descricao.trim(),
      tipoGasto: formData.tipoGasto,
      valorGasto: val,
      dataGasto: new Date().toISOString(),
      usuarioId: Number(formData.usuarioId),
      pagamentos: [
        {
          id: Date.now(),
          valorPago: val,
          dataPago: formData.pagamentoFeito ? new Date().toISOString() : null,
          pagamentoFeito: formData.pagamentoFeito,
          tipoPagamento: formData.tipoPagamento,
          cartao: formData.tipoPagamento === 'CREDITO' ? (formData.cartao || 'Cartão Principal') : undefined,
          parcelas: parcelasNum,
          valorParcela: valorParcela,
          gastoId: Date.now()
        }
      ]
    });

    setIsModalOpen(false);
  };

  return (
    <div className="page-content">
      {/* Top 3 Summary Cards */}
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '0.85rem',
        }}
      >
        <div className="metric-card" style={{ padding: '1rem 1.25rem' }}>
          <span className="metric-title">Total da Lista</span>
          <div className="metric-value" style={{ fontSize: '1.35rem', marginTop: '0.2rem' }}>
            {formatCurrency(totalFiltrado)}
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>{filteredGastos.length} itens listados</span>
        </div>

        <div className="metric-card" style={{ padding: '1rem 1.25rem' }}>
          <span className="metric-title">Já Pago</span>
          <div className="metric-value" style={{ fontSize: '1.35rem', color: 'var(--success)', marginTop: '0.2rem' }}>
            {formatCurrency(totalPagoFiltrado)}
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
            {filteredGastos.filter(g => g.pagamentos?.some(p => p.pagamentoFeito)).length} contas quitadas
          </span>
        </div>

        <div className="metric-card" style={{ padding: '1rem 1.25rem' }}>
          <span className="metric-title">Falta Pagar</span>
          <div className="metric-value" style={{ fontSize: '1.35rem', color: 'var(--warning)', marginTop: '0.2rem' }}>
            {formatCurrency(totalPendenteFiltrado)}
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
            {filteredGastos.filter(g => !g.pagamentos?.some(p => p.pagamentoFeito)).length} contas pendentes
          </span>
        </div>
      </div>

      {/* Control Bar: Search & New Button */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div className="search-bar">
          <Search size={16} />
          <input 
            type="text"
            className="form-input"
            placeholder="Buscar conta..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <button 
          className="btn btn-primary"
          onClick={handleOpenModal}
        >
          <Plus size={16} />
          <span>Nova Conta</span>
        </button>
      </div>

      {/* Clean Filters */}
      <div className="glass-panel" style={{ padding: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          
          {/* Status */}
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', fontWeight: 600, minWidth: '60px', textTransform: 'uppercase' }}>
              Status:
            </span>
            <button
              className={`filter-chip ${statusFilter === 'all' ? 'active' : ''}`}
              onClick={() => setStatusFilter('all')}
            >
              Todas ({filteredGastos.length})
            </button>
            <button
              className={`filter-chip ${statusFilter === 'pendente' ? 'active' : ''}`}
              onClick={() => setStatusFilter('pendente')}
            >
              A pagar
            </button>
            <button
              className={`filter-chip ${statusFilter === 'pago' ? 'active' : ''}`}
              onClick={() => setStatusFilter('pago')}
            >
              Pagas
            </button>
          </div>

          {/* Payment Type */}
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', fontWeight: 600, minWidth: '60px', textTransform: 'uppercase' }}>
              Forma:
            </span>
            <button
              className={`filter-chip ${paymentTypeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setPaymentTypeFilter('all')}
            >
              Todas
            </button>
            <button
              className={`filter-chip ${paymentTypeFilter === 'PIX' ? 'active' : ''}`}
              onClick={() => setPaymentTypeFilter('PIX')}
            >
              PIX
            </button>
            <button
              className={`filter-chip ${paymentTypeFilter === 'DEBITO' ? 'active' : ''}`}
              onClick={() => setPaymentTypeFilter('DEBITO')}
            >
              Débito
            </button>
            <button
              className={`filter-chip ${paymentTypeFilter === 'CREDITO' ? 'active' : ''}`}
              onClick={() => setPaymentTypeFilter('CREDITO')}
            >
              Cartão de Crédito
            </button>
          </div>

          {/* Categories */}
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', fontWeight: 600, minWidth: '60px', textTransform: 'uppercase' }}>
              Área:
            </span>
            <button
              className={`filter-chip ${categoryFilter === 'all' ? 'active' : ''}`}
              onClick={() => setCategoryFilter('all')}
            >
              Todas
            </button>
            {Object.entries(CATEGORIA_CONFIG).map(([key, config]) => (
              <button
                key={key}
                className={`filter-chip ${categoryFilter === key ? 'active' : ''}`}
                onClick={() => setCategoryFilter(key)}
              >
                {config.label}
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* Checklist Items */}
      <div className="checklist-container">
        {filteredGastos.length === 0 ? (
          <div 
            style={{ 
              padding: '2.5rem 1rem', 
              textAlign: 'center', 
              color: 'var(--text-secondary)',
              border: '1px dashed var(--border-light)',
              borderRadius: 'var(--radius-md)'
            }}
          >
            <CheckSquare size={36} color="var(--text-tertiary)" style={{ margin: '0 auto 0.75rem auto' }} />
            <h3 style={{ color: '#fff', fontSize: '0.95rem', marginBottom: '0.2rem' }}>Nenhuma conta encontrada</h3>
            <p style={{ fontSize: '0.8rem' }}>Ajuste os filtros ou adicione uma nova conta.</p>
          </div>
        ) : (
          filteredGastos.map((gasto) => {
            const config = CATEGORIA_CONFIG[gasto.tipoGasto] || CATEGORIA_CONFIG.OUTROS;
            const isPaid = Boolean(gasto.pagamentos?.some(p => p.pagamentoFeito));
            const payment = gasto.pagamentos?.[0];
            const userName = usuarios.find(u => u.id === gasto.usuarioId)?.nome || `Pessoa #${gasto.usuarioId}`;

            return (
              <div 
                key={gasto.id} 
                className={`checklist-item ${isPaid ? 'is-paid' : ''}`}
              >
                <div className="checklist-left">
                  {/* Clean tactile checkbox */}
                  <div 
                    className={`custom-checkbox ${isPaid ? 'checked' : ''}`}
                    onClick={() => togglePagamento(gasto.id)}
                    title={isPaid ? 'Marcar como não pago' : 'Marcar como pago'}
                  >
                    {isPaid && <Check size={14} strokeWidth={3} />}
                  </div>

                  <div className="checklist-details">
                    <h4>{gasto.descricao}</h4>
                    <div className="checklist-meta">
                      <span 
                        className="category-tag" 
                        style={{ background: config.bg, color: config.color }}
                      >
                        {config.label}
                      </span>
                      <span>{userName}</span>
                      <span>•</span>
                      <span>{payment?.tipoPagamento || 'PIX'}</span>
                      {payment?.cartao && <span>({payment.cartao})</span>}
                      {payment?.parcelas && payment.parcelas > 1 && (
                        <span>({payment.parcelas}x de {formatCurrency(payment.valorParcela)})</span>
                      )}
                      <span>•</span>
                      <span>{formatDate(gasto.dataGasto)}</span>
                    </div>
                  </div>
                </div>

                <div className="checklist-right">
                  <div>
                    <div className="item-value">{formatCurrency(gasto.valorGasto)}</div>
                    <span 
                      className="item-payment-badge" 
                      style={{ color: isPaid ? 'var(--success)' : 'var(--warning)', fontWeight: 500 }}
                    >
                      {isPaid ? 'Pago' : 'A pagar'}
                    </span>
                  </div>

                  <button
                    className="btn btn-secondary btn-icon"
                    onClick={() => deleteGasto(gasto.id)}
                    title="Excluir conta"
                    style={{ opacity: 0.5 }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Adicionar Conta */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Plus size={18} color="var(--primary)" />
                Adicionar Conta
              </h3>
              <button 
                className="btn btn-secondary btn-icon" 
                onClick={() => setIsModalOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateGasto}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Descrição da conta ou gasto</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: Supermercado, Aluguel, Farmácia"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    required
                    autoFocus
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">Valor (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      placeholder="0,00"
                      value={formData.valorGasto}
                      onChange={(e) => setFormData({ ...formData, valorGasto: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Categoria</label>
                    <select
                      className="form-select"
                      value={formData.tipoGasto}
                      onChange={(e) => setFormData({ ...formData, tipoGasto: e.target.value as TipoGasto })}
                    >
                      {Object.entries(CATEGORIA_CONFIG).map(([key, cfg]) => (
                        <option key={key} value={key}>{cfg.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">Responsável</label>
                    <select
                      className="form-select"
                      value={formData.usuarioId}
                      onChange={(e) => setFormData({ ...formData, usuarioId: Number(e.target.value) })}
                    >
                      {usuarios.map(u => (
                        <option key={u.id} value={u.id}>{u.nome}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Forma de pagamento</label>
                    <select
                      className="form-select"
                      value={formData.tipoPagamento}
                      onChange={(e) => setFormData({ ...formData, tipoPagamento: e.target.value as TipoPagamento })}
                    >
                      <option value="PIX">PIX</option>
                      <option value="DEBITO">Débito em conta</option>
                      <option value="CREDITO">Cartão de Crédito</option>
                    </select>
                  </div>
                </div>

                {formData.tipoPagamento === 'CREDITO' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="form-group">
                      <label className="form-label">Qual cartão?</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Ex: Nubank, Inter, XP"
                        value={formData.cartao}
                        onChange={(e) => setFormData({ ...formData, cartao: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Número de parcelas</label>
                      <input
                        type="number"
                        min="1"
                        max="36"
                        className="form-input"
                        value={formData.parcelas}
                        onChange={(e) => setFormData({ ...formData, parcelas: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.35rem' }}>
                  <input
                    type="checkbox"
                    id="pagamentoFeitoCheck"
                    checked={formData.pagamentoFeito}
                    onChange={(e) => setFormData({ ...formData, pagamentoFeito: e.target.checked })}
                    style={{ width: 16, height: 16, accentColor: 'var(--primary)', cursor: 'pointer' }}
                  />
                  <label htmlFor="pagamentoFeitoCheck" style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                    Esta conta já foi paga hoje
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                >
                  Salvar Conta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
