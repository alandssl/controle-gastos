import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Check, 
  CheckSquare,
  X,
  RefreshCw,
  CreditCard,
  Calendar,
  AlertCircle,
  Zap
} from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';
import { CATEGORIA_CONFIG } from '../data/mockData';
import type { Gasto, TipoGasto, TipoPagamento } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { VincularPagamentoModal } from '../components/VincularPagamentoModal';

export const GastosChecklistView: React.FC = () => {
  const { 
    gastos,
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
    pagarParcela,
    addGasto,
    deleteGasto,
    activeUser,
    usuarios,
    cartoes,
    refreshGastos
  } = useFinancial();

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Vincular Pagamento Modal state
  const [selectedGastoForPagamento, setSelectedGastoForPagamento] = useState<Gasto | null>(null);
  const [isVincularModalOpen, setIsVincularModalOpen] = useState(false);

  // Form data para criar conta
  const [formData, setFormData] = useState({
    descricao: '',
    tipoGasto: 'ALIMENTACAO' as TipoGasto,
    valorGasto: '',
    usuarioId: activeUser ? activeUser.id : (usuarios[0]?.id || ''),
    dataGasto: new Date().toISOString().split('T')[0],
    // Flag opcional: Vincular pagamento já na criação (se false, cria gasto puro)
    vincularPagamentoAgora: false,
    tipoPagamento: 'PIX' as TipoPagamento,
    cartaoId: '' as string | number,
    cartaoNomeCustom: '',
    parcelas: '1',
    pagamentoFeito: true
  });

  // Totais calculados
  const totalFiltrado = (filteredGastos || []).reduce((sum, g) => sum + (g.valorGasto || 0), 0);
  const totalPagoFiltrado = (filteredGastos || [])
    .filter(g => g.pagamentos?.some(p => p.pagamentoFeito))
    .reduce((sum, g) => sum + (g.valorGasto || 0), 0);
  const totalPendenteFiltrado = totalFiltrado - totalPagoFiltrado;
  const semPagamentoCount = (filteredGastos || []).filter(g => !g.pagamentos || g.pagamentos.length === 0).length;

  // Cartões do usuário selecionado no form
  const cartoesDoUsuario = cartoes.filter(c => c.usuarioId === Number(formData.usuarioId));

  const handleOpenModal = () => {
    const defaultUserId = activeUser ? activeUser.id : (usuarios[0]?.id || '');
    const userCartoes = cartoes.filter(c => c.usuarioId === defaultUserId);
    setModalError(null);
    setFormData({
      descricao: '',
      tipoGasto: 'ALIMENTACAO',
      valorGasto: '',
      usuarioId: defaultUserId,
      dataGasto: new Date().toISOString().split('T')[0],
      vincularPagamentoAgora: false,
      tipoPagamento: 'PIX',
      cartaoId: userCartoes[0]?.id || '',
      cartaoNomeCustom: '',
      parcelas: '1',
      pagamentoFeito: true
    });
    setIsModalOpen(true);
  };

  const handleOpenVincularModal = (gasto: Gasto) => {
    setSelectedGastoForPagamento(gasto);
    setIsVincularModalOpen(true);
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refreshGastos();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleCreateGasto = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (usuarios.length === 0) {
      setModalError("É necessário cadastrar uma pessoa na aba 'Pessoas' antes de adicionar contas.");
      return;
    }

    if (!formData.usuarioId) {
      setModalError("Selecione a pessoa responsável pela conta.");
      return;
    }

    const val = parseFloat(formData.valorGasto);
    if (!formData.descricao.trim()) {
      setModalError("Informe a descrição da conta.");
      return;
    }
    if (isNaN(val) || val <= 0) {
      setModalError("Informe um valor válido maior que zero.");
      return;
    }

    setIsSubmitting(true);
    const expenseDate = formData.dataGasto ? new Date(formData.dataGasto + 'T12:00:00').toISOString() : new Date().toISOString();

    try {
      let pagamentosPayload = undefined;

      // Se o usuário optou por vincular pagamento agora (opção 'já pago' / informar pagamento)
      if (formData.vincularPagamentoAgora) {
        const parcelasNum = Math.max(1, parseInt(formData.parcelas, 10) || 1);
        const valorParcela = val / parcelasNum;
        const selectedCartao = cartoes.find(c => c.id === Number(formData.cartaoId));

        pagamentosPayload = [
          {
            id: Date.now(),
            valorPago: val,
            dataPago: formData.pagamentoFeito ? expenseDate : null,
            pagamentoFeito: Boolean(formData.pagamentoFeito),
            tipoPagamento: formData.tipoPagamento,
            cartaoId: formData.tipoPagamento === 'CREDITO' && formData.cartaoId ? Number(formData.cartaoId) : null,
            cartao: formData.tipoPagamento === 'CREDITO' 
              ? (selectedCartao ? `Cartão (Vence dia ${selectedCartao.diaVencimento})` : (formData.cartaoNomeCustom || 'Cartão de Crédito'))
              : undefined,
            parcelas: parcelasNum,
            valorParcela: valorParcela,
            gastoId: Date.now()
          }
        ];
      }

      await addGasto({
        descricao: formData.descricao.trim(),
        tipoGasto: formData.tipoGasto,
        valorGasto: val,
        dataGasto: expenseDate,
        usuarioId: Number(formData.usuarioId),
        pagamentos: pagamentosPayload || []
      });

      setIsModalOpen(false);
    } catch (err: any) {
      console.error("Erro ao criar gasto:", err);
      setModalError(err.message || "Erro ao salvar conta. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
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
            {semPagamentoCount > 0 && ` (${semPagamentoCount} sem pagamento)`}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: 1, minWidth: '240px' }}>
          <div className="search-bar" style={{ flex: 1 }}>
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
            className="btn btn-secondary btn-icon"
            onClick={handleManualRefresh}
            title="Recarregar gastos da API"
            style={{ height: '38px', width: '38px' }}
          >
            <RefreshCw size={15} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
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
              className={`filter-chip ${paymentTypeFilter === 'SEM_PAGAMENTO' ? 'active' : ''}`}
              onClick={() => setPaymentTypeFilter('SEM_PAGAMENTO')}
              style={paymentTypeFilter === 'SEM_PAGAMENTO' ? { background: 'rgba(245, 158, 11, 0.25)', borderColor: 'var(--warning)', color: '#fcd34d' } : {}}
            >
              ⚠️ Sem Pagamento ({gastos.filter(g => !g.pagamentos || g.pagamentos.length === 0).length})
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
            const hasPayment = Boolean(gasto.pagamentos && gasto.pagamentos.length > 0);
            const isPaid = Boolean(gasto.pagamentos?.some(p => p.pagamentoFeito));
            const payment = gasto.pagamentos?.[0];
            const userName = usuarios.find(u => u.id === gasto.usuarioId)?.nome || `Pessoa #${gasto.usuarioId}`;

            return (
              <div 
                key={gasto.id} 
                className={`checklist-item ${isPaid ? 'is-paid' : ''}`}
                style={!hasPayment ? { borderLeft: '3px solid var(--warning)' } : undefined}
              >
                <div className="checklist-left">
                  {/* Clean tactile checkbox */}
                  <div 
                    className={`custom-checkbox ${isPaid ? 'checked' : ''}`}
                    onClick={() => {
                      if (!hasPayment) {
                        // Se não tem pagamento vinculado, abre modal para vincular
                        handleOpenVincularModal(gasto);
                      } else {
                        // Traz status pago ou não pago
                        togglePagamento(gasto.id);
                      }
                    }}
                    title={
                      !hasPayment 
                        ? 'Conta sem pagamento vinculado. Clique para vincular.' 
                        : (isPaid ? 'Marcar como não pago' : 'Marcar como pago')
                    }
                    style={!hasPayment ? { borderColor: 'rgba(245, 158, 11, 0.4)', background: 'rgba(245, 158, 11, 0.05)' } : undefined}
                  >
                    {isPaid ? (
                      <Check size={14} strokeWidth={3} />
                    ) : !hasPayment ? (
                      <span style={{ fontSize: '10px', color: 'var(--warning)', fontWeight: 800 }}>!</span>
                    ) : null}
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
                      
                      {hasPayment ? (
                        <>
                          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                            {payment?.tipoPagamento}
                          </span>
                          {payment?.cartao && (
                            <span>
                              ({typeof payment.cartao === 'object' ? `Cartão dia ${payment.cartao.diaVencimento}` : payment.cartao})
                            </span>
                          )}
                          {payment?.parcelas && payment.parcelas > 1 && (
                            <span>
                              ({payment.parcelas}x de {formatCurrency(payment.valorParcela)}
                              {' · '}{Math.min(payment.parcelasPagas || 0, payment.parcelas)}/{payment.parcelas} pagas)
                            </span>
                          )}
                          {payment?.parcelas && payment.parcelas > 1 && isPaid && (
                            <span style={{ color: 'var(--success)', fontWeight: 700 }}>✓ Compra quitada</span>
                          )}
                          {payment?.parcelas && payment.parcelas > 1 && !isPaid && (
                            <button
                              type="button"
                              className="btn btn-secondary"
                              style={{ padding: '0.1rem 0.5rem', fontSize: '0.7rem' }}
                              title="Pagar a próxima parcela. Ao pagar todas, a compra é marcada como paga."
                              onClick={() => pagarParcela(gasto.id)}
                            >
                              Pagar parcela
                            </button>
                          )}
                        </>
                      ) : (
                        <span 
                          style={{ 
                            color: 'var(--warning)', 
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            background: 'rgba(245, 158, 11, 0.12)',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.72rem'
                          }}
                        >
                          ⚠️ Sem pagamento vinculado
                        </span>
                      )}

                      <span>•</span>
                      <span>{formatDate(gasto.dataGasto)}</span>
                    </div>
                  </div>
                </div>

                <div className="checklist-right">
                  <div>
                    <div className="item-value">{formatCurrency(gasto.valorGasto)}</div>
                    {hasPayment ? (
                      <span 
                        className="item-payment-badge" 
                        style={{ color: isPaid ? 'var(--success)' : 'var(--warning)', fontWeight: 500 }}
                      >
                        {isPaid ? 'Pago' : 'A pagar'}
                      </span>
                    ) : (
                      <span 
                        className="item-payment-badge" 
                        style={{ color: 'var(--warning)', fontWeight: 500, fontSize: '0.72rem' }}
                      >
                        Aguardando pagamento
                      </span>
                    )}
                  </div>

                  {/* Botão Vincular / Alterar Pagamento */}
                  {!hasPayment ? (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleOpenVincularModal(gasto)}
                      title="Vincular Pagamento a esta conta"
                      style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                    >
                      <CreditCard size={13} />
                      <span>Vincular Pagamento</span>
                    </button>
                  ) : (
                    <button
                      className="btn btn-secondary btn-icon"
                      onClick={() => handleOpenVincularModal(gasto)}
                      title="Editar / Gerenciar Pagamento"
                      style={{ width: '32px', height: '32px' }}
                    >
                      <CreditCard size={14} color="var(--primary)" />
                    </button>
                  )}

                  <button
                    className="btn btn-secondary btn-icon"
                    onClick={() => deleteGasto(gasto.id)}
                    title="Excluir conta"
                    style={{ opacity: 0.5, width: '32px', height: '32px' }}
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
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
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
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                {modalError && (
                  <div style={{
                    padding: '0.65rem 0.85rem',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: 'var(--radius-sm)',
                    color: '#f87171',
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}>
                    <AlertCircle size={15} />
                    <span>{modalError}</span>
                  </div>
                )}

                {usuarios.length === 0 && (
                  <div style={{
                    padding: '0.65rem 0.85rem',
                    background: 'rgba(234, 179, 8, 0.15)',
                    border: '1px solid rgba(234, 179, 8, 0.3)',
                    borderRadius: 'var(--radius-sm)',
                    color: '#fde047',
                    fontSize: '0.8rem'
                  }}>
                    💡 Não há pessoas cadastradas. Cadastre uma pessoa na aba <strong>Pessoas</strong> antes de salvar uma conta.
                  </div>
                )}

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
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Calendar size={13} />
                      Data da Compra / Conta
                    </label>
                    <input
                      type="date"
                      className="form-input"
                      value={formData.dataGasto}
                      onChange={(e) => setFormData({ ...formData, dataGasto: e.target.value })}
                      required
                    />
                  </div>

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
                </div>

                {/* Bloco de Opção: Vincular Pagamento Agora ou Deixar para depois */}
                <div 
                  style={{
                    padding: '0.85rem',
                    borderRadius: 'var(--radius-md)',
                    background: formData.vincularPagamentoAgora ? 'rgba(99, 102, 241, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                    border: formData.vincularPagamentoAgora ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid var(--border-subtle)',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <label 
                        htmlFor="vincularPagamentoAgoraToggle" 
                        style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        <Zap size={14} color="var(--primary)" />
                        Já foi pago? (Vincular pagamento agora)
                      </label>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                        {formData.vincularPagamentoAgora 
                          ? 'A forma de pagamento será definida e marcada como paga.' 
                          : 'Cria apenas a conta. Você poderá vincular o pagamento a qualquer momento.'}
                      </p>
                    </div>

                    <input
                      type="checkbox"
                      id="vincularPagamentoAgoraToggle"
                      checked={formData.vincularPagamentoAgora}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        vincularPagamentoAgora: e.target.checked,
                        pagamentoFeito: e.target.checked 
                      })}
                      style={{ width: 18, height: 18, accentColor: 'var(--primary)', cursor: 'pointer' }}
                    />
                  </div>

                  {/* Campos de pagamento que aparecem APENAS se o usuário marcar a flag */}
                  {formData.vincularPagamentoAgora && (
                    <div style={{ marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
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

                      {formData.tipoPagamento === 'CREDITO' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                          <div className="form-group">
                            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <CreditCard size={13} />
                              Cartão (Vencimento)
                            </label>
                            {cartoesDoUsuario.length > 0 ? (
                              <select
                                className="form-select"
                                value={formData.cartaoId}
                                onChange={(e) => setFormData({ ...formData, cartaoId: e.target.value })}
                              >
                                <option value="">Selecione cartão...</option>
                                {cartoesDoUsuario.map(c => (
                                  <option key={c.id} value={c.id}>
                                    Cartão #{c.id} — Dia {c.diaVencimento}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="text"
                                className="form-input"
                                placeholder="Ex: Nubank, Inter"
                                value={formData.cartaoNomeCustom}
                                onChange={(e) => setFormData({ ...formData, cartaoNomeCustom: e.target.value })}
                              />
                            )}
                          </div>

                          <div className="form-group">
                            <label className="form-label">Parcelas</label>
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
                    </div>
                  )}
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
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Salvando...' : 'Salvar Conta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Dedicado para Vincular / Editar Pagamento */}
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
