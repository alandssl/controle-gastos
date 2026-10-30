import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  X, 
  Check, 
  AlertCircle, 
  Zap, 
  Layers,
  Trash2
} from 'lucide-react';
import type { Gasto, TipoPagamento } from '../types';
import { useFinancial } from '../context/FinancialContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import { CATEGORIA_CONFIG } from '../data/mockData';

interface VincularPagamentoModalProps {
  gasto: Gasto | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (updatedGasto: Gasto) => void;
}

export const VincularPagamentoModal: React.FC<VincularPagamentoModalProps> = ({
  gasto,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { vincularPagamento, desvincularPagamento, cartoes, usuarios } = useFinancial();

  const [tipoPagamento, setTipoPagamento] = useState<TipoPagamento>('PIX');
  const [cartaoId, setCartaoId] = useState<string | number>('');
  const [cartaoNomeCustom, setCartaoNomeCustom] = useState('');
  const [parcelas, setParcelas] = useState('1');
  const [pagamentoFeito, setPagamentoFeito] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Preencher dados ao abrir modal com o gasto selecionado
  useEffect(() => {
    if (gasto) {
      setErrorMsg(null);
      const existingPayment = gasto.pagamentos?.[0];
      if (existingPayment) {
        setTipoPagamento(existingPayment.tipoPagamento || 'PIX');
        setCartaoId(existingPayment.cartaoId || '');
        setCartaoNomeCustom(typeof existingPayment.cartao === 'string' ? existingPayment.cartao : '');
        setParcelas(String(existingPayment.parcelas || 1));
        setPagamentoFeito(Boolean(existingPayment.pagamentoFeito));
      } else {
        // Padrão novo pagamento para o gasto
        setTipoPagamento('PIX');
        const userCartoes = cartoes.filter(c => c.usuarioId === gasto.usuarioId);
        setCartaoId(userCartoes[0]?.id || '');
        setCartaoNomeCustom('');
        setParcelas('1');
        setPagamentoFeito(false);
      }
    }
  }, [gasto, cartoes, isOpen]);

  if (!isOpen || !gasto) return null;

  const user = usuarios.find(u => u.id === gasto.usuarioId);
  const cartoesDoUsuario = cartoes.filter(c => c.usuarioId === gasto.usuarioId);
  const selectedCartao = cartoes.find(c => c.id === Number(cartaoId));
  const parcelasNum = Math.max(1, parseInt(parcelas, 10) || 1);
  const valorParcelaCalculado = gasto.valorGasto / parcelasNum;
  const config = CATEGORIA_CONFIG[gasto.tipoGasto] || CATEGORIA_CONFIG.OUTROS;
  const jaTemPagamento = Boolean(gasto.pagamentos && gasto.pagamentos.length > 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      let cartaoNome = undefined;
      if (tipoPagamento === 'CREDITO') {
        if (selectedCartao) {
          cartaoNome = `Cartão (Venc. dia ${selectedCartao.diaVencimento})`;
        } else if (cartaoNomeCustom.trim()) {
          cartaoNome = cartaoNomeCustom.trim();
        } else {
          cartaoNome = 'Cartão de Crédito';
        }
      }

      const updated = await vincularPagamento(gasto.id, {
        tipoPagamento,
        cartaoId: tipoPagamento === 'CREDITO' && cartaoId ? Number(cartaoId) : null,
        cartaoNome,
        parcelas: tipoPagamento === 'CREDITO' ? parcelasNum : 1,
        valorPago: gasto.valorGasto,
        pagamentoFeito,
        dataPago: pagamentoFeito ? new Date().toISOString() : null,
      });

      if (onSuccess) onSuccess(updated);
      onClose();
    } catch (err: any) {
      console.error("Erro ao vincular pagamento:", err);
      setErrorMsg(err.message || "Não foi possível vincular o pagamento.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDesvincular = async () => {
    if (!window.confirm("Deseja desvincular o pagamento desta conta? Ela voltará para o estado 'Sem pagamento vinculado'.")) {
      return;
    }
    setIsSubmitting(true);
    try {
      const updated = await desvincularPagamento(gasto.id);
      if (onSuccess) onSuccess(updated);
      onClose();
    } catch (err: any) {
      console.error("Erro ao desvincular pagamento:", err);
      setErrorMsg(err.message || "Erro ao desvincular pagamento.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '480px' }}
      >
        <div className="modal-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CreditCard size={18} color="var(--primary)" />
            {jaTemPagamento ? 'Editar / Gerenciar Pagamento' : 'Vincular Pagamento'}
          </h3>
          <button 
            className="btn btn-secondary btn-icon" 
            onClick={onClose}
            title="Fechar"
          >
            <X size={16} />
          </button>
        </div>

        {/* Info do Gasto */}
        <div 
          style={{
            margin: '1rem 1.25rem 0 1.25rem',
            padding: '0.85rem 1rem',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>
              {gasto.descricao}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginTop: '0.25rem', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
              <span className="category-tag" style={{ background: config.bg, color: config.color, fontSize: '0.7rem', padding: '0.15rem 0.45rem' }}>
                {config.label}
              </span>
              <span>•</span>
              <span>{user?.nome || `Pessoa #${gasto.usuarioId}`}</span>
              <span>•</span>
              <span>{formatDate(gasto.dataGasto)}</span>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary)' }}>
              {formatCurrency(gasto.valorGasto)}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
              Valor da conta
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {errorMsg && (
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
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Seleção do Tipo de Pagamento */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Zap size={14} color="var(--primary)" />
                Forma de Pagamento
              </label>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginTop: '0.2rem' }}>
                {[
                  { id: 'PIX', label: 'PIX', desc: 'Instantâneo' },
                  { id: 'DEBITO', label: 'Débito', desc: 'Em conta' },
                  { id: 'CREDITO', label: 'Crédito', desc: 'Cartão / Fatura' }
                ].map((item) => {
                  const isSelected = tipoPagamento === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setTipoPagamento(item.id as TipoPagamento)}
                      style={{
                        padding: '0.65rem 0.5rem',
                        borderRadius: 'var(--radius-md)',
                        border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
                        background: isSelected ? 'rgba(99, 102, 241, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                        color: isSelected ? '#fff' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all var(--transition-fast)'
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{item.label}</div>
                      <div style={{ fontSize: '0.68rem', color: isSelected ? 'var(--primary-glow)' : 'var(--text-tertiary)', marginTop: '2px' }}>
                        {item.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Configurações específicas para Cartão de Crédito */}
            {tipoPagamento === 'CREDITO' && (
              <div 
                style={{
                  padding: '0.85rem',
                  background: 'rgba(99, 102, 241, 0.05)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem'
                }}
              >
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <CreditCard size={13} />
                    Cartão do Usuário
                  </label>
                  {cartoesDoUsuario.length > 0 ? (
                    <select
                      className="form-select"
                      value={cartaoId}
                      onChange={(e) => setCartaoId(e.target.value)}
                    >
                      <option value="">Selecione um cartão cadastrado...</option>
                      {cartoesDoUsuario.map(c => (
                        <option key={c.id} value={c.id}>
                          Cartão #{c.id} — Vencimento todo dia {c.diaVencimento} (Fatura base: {formatCurrency(c.valorFaturaMes)})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Identificação do cartão (ex: Nubank, Inter, XP)"
                      value={cartaoNomeCustom}
                      onChange={(e) => setCartaoNomeCustom(e.target.value)}
                    />
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Layers size={13} />
                    Número de Parcelas
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <select
                      className="form-select"
                      value={parcelas}
                      onChange={(e) => setParcelas(e.target.value)}
                      style={{ flex: 1 }}
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 18, 24, 36].map(num => (
                        <option key={num} value={num}>
                          {num}x de {formatCurrency(gasto.valorGasto / num)}
                        </option>
                      ))}
                    </select>
                    
                    <div 
                      style={{
                        padding: '0.55rem 0.85rem',
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-subtle)',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        color: 'var(--primary)',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {parcelasNum}x {formatCurrency(valorParcelaCalculado)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Flag Pago ou Não Pago */}
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.85rem',
                background: pagamentoFeito ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                borderRadius: 'var(--radius-md)',
                border: pagamentoFeito ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-subtle)',
                transition: 'all var(--transition-fast)'
              }}
            >
              <div>
                <label 
                  htmlFor="statusPagoCheckbox" 
                  style={{ 
                    fontSize: '0.85rem', 
                    fontWeight: 600, 
                    color: pagamentoFeito ? 'var(--success)' : '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                >
                  {pagamentoFeito ? <Check size={16} /> : null}
                  {pagamentoFeito ? 'Pagamento já efetuado (Pago)' : 'Ainda não foi pago (A Pagar)'}
                </label>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                  {pagamentoFeito 
                    ? 'A conta será marcada como concluída e entrará no total pago.' 
                    : 'A conta ficará como pendente até você marcá-la no checklist.'}
                </p>
              </div>

              <input
                type="checkbox"
                id="statusPagoCheckbox"
                checked={pagamentoFeito}
                onChange={(e) => setPagamentoFeito(e.target.checked)}
                style={{ width: 18, height: 18, accentColor: 'var(--success)', cursor: 'pointer' }}
              />
            </div>
          </div>

          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {jaTemPagamento ? (
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={handleDesvincular}
                disabled={isSubmitting}
                title="Desvincular pagamento deste gasto"
              >
                <Trash2 size={13} />
                Desvincular
              </button>
            ) : <div />}

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Salvando...' : 'Salvar Pagamento'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
