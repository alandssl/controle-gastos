import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Edit3, 
  Trash2, 
  X
} from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';
import type { Usuario } from '../types';
import { formatCurrency } from '../utils/formatters';

export const UsuariosView: React.FC = () => {
  const { 
    usuarios, 
    activeUserId, 
    setActiveUserId, 
    createUsuario, 
    updateUsuario, 
    deleteUsuario, 
    refreshUsuarios,
    gastos
  } = useFinancial();

  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [deletingUser, setDeletingUser] = useState<Usuario | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    nome: '',
    salario: '',
    diaSalario: '5',
  });
  const [formError, setFormError] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      refreshUsuarios(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery, refreshUsuarios]);

  const handleOpenCreate = () => {
    setFormData({ nome: '', salario: '', diaSalario: '5' });
    setFormError('');
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (user: Usuario) => {
    setEditingUser(user);
    setFormData({
      nome: user.nome,
      salario: user.salario.toString(),
      diaSalario: user.diaSalario.toString(),
    });
    setFormError('');
  };

  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome.trim()) {
      setFormError('Informe o nome da pessoa.');
      return;
    }
    const salarioNum = parseFloat(formData.salario);
    if (isNaN(salarioNum) || salarioNum <= 0) {
      setFormError('Informe um valor de salário válido.');
      return;
    }
    const diaNum = parseInt(formData.diaSalario, 10);
    if (isNaN(diaNum) || diaNum < 1 || diaNum > 31) {
      setFormError('O dia do salário deve ser entre 1 e 31.');
      return;
    }

    try {
      setIsSubmitting(true);
      await createUsuario({
        nome: formData.nome.trim(),
        salario: salarioNum,
        diaSalario: diaNum,
      });
      setIsCreateModalOpen(false);
    } catch (err: any) {
      setFormError('Erro ao salvar: ' + (err.message || 'tente novamente'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    if (!formData.nome.trim()) {
      setFormError('Informe o nome da pessoa.');
      return;
    }
    const salarioNum = parseFloat(formData.salario);
    if (isNaN(salarioNum) || salarioNum <= 0) {
      setFormError('Informe um valor de salário válido.');
      return;
    }
    const diaNum = parseInt(formData.diaSalario, 10);
    if (isNaN(diaNum) || diaNum < 1 || diaNum > 31) {
      setFormError('O dia do salário deve ser entre 1 e 31.');
      return;
    }

    try {
      setIsSubmitting(true);
      await updateUsuario({
        id: editingUser.id,
        nome: formData.nome.trim(),
        salario: salarioNum,
        diaSalario: diaNum,
      });
      setEditingUser(null);
    } catch (err: any) {
      setFormError('Erro ao atualizar: ' + (err.message || 'tente novamente'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingUser) return;
    try {
      setDeleteError('');
      setIsSubmitting(true);
      await deleteUsuario(deletingUser.id);
      setDeletingUser(null);
    } catch (err: any) {
      console.error("Falha ao excluir pessoa:", err);
      setDeleteError(err.message || 'Erro ao remover usuário. Verifique se existem contas ou cartões vinculados a esta pessoa.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-content">
      {/* Control Bar */}
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
            placeholder="Buscar por nome..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <button 
          className="btn btn-primary"
          onClick={handleOpenCreate}
        >
          <UserPlus size={16} />
          <span>Adicionar Pessoa</span>
        </button>
      </div>

      {/* Users Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
        {usuarios.length === 0 ? (
          <div 
            style={{ 
              gridColumn: '1 / -1',
              padding: '2.5rem 1rem', 
              textAlign: 'center', 
              color: 'var(--text-secondary)',
              border: '1px dashed var(--border-light)',
              borderRadius: 'var(--radius-md)'
            }}
          >
            <Users size={36} color="var(--text-tertiary)" style={{ margin: '0 auto 0.75rem auto' }} />
            <h3 style={{ color: '#fff', fontSize: '0.95rem', marginBottom: '0.2rem' }}>Nenhuma pessoa cadastrada</h3>
            <p style={{ fontSize: '0.8rem' }}>Adicione a primeira pessoa para organizar os salários e contas.</p>
          </div>
        ) : (
          usuarios.map((user) => {
            const isActive = activeUserId === user.id;
            const userGastosCount = (gastos || []).filter(g => g.usuarioId === user.id).length;
            const userGastosTotal = (gastos || [])
              .filter(g => g.usuarioId === user.id)
              .reduce((sum, g) => sum + (g.valorGasto || 0), 0);

            const initials = user.nome
              .split(' ')
              .map(n => n[0])
              .slice(0, 2)
              .join('')
              .toUpperCase();

            return (
              <div 
                key={user.id} 
                className="metric-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  border: isActive ? '1px solid var(--primary)' : '1px solid var(--border-light)',
                  padding: '1.25rem',
                }}
              >
                <div>
                  {/* Avatar & Name */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div 
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 'var(--radius-sm)',
                          background: isActive ? 'var(--primary)' : 'rgba(255, 255, 255, 0.06)',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 600,
                          fontSize: '0.92rem',
                        }}
                      >
                        {initials}
                      </div>
                      <div>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff' }}>{user.nome}</h4>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>Salário cai dia {user.diaSalario}</span>
                      </div>
                    </div>

                    {isActive && (
                      <span 
                        style={{
                          fontSize: '0.68rem',
                          background: 'rgba(79, 70, 229, 0.15)',
                          color: '#818cf8',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '999px',
                          fontWeight: 600
                        }}
                      >
                        Ativo
                      </span>
                    )}
                  </div>

                  {/* Financial Info */}
                  <div 
                    style={{
                      background: 'rgba(0, 0, 0, 0.2)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '1rem'
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>
                        Salário
                      </span>
                      <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--success)', marginTop: '0.1rem' }}>
                        {formatCurrency(user.salario)}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>
                        Contas Vinculadas
                      </span>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.1rem' }}>
                        {userGastosCount} ({formatCurrency(userGastosTotal)})
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingTop: '0.65rem', borderTop: '1px solid var(--border-light)' }}>
                  <button
                    className={`btn btn-sm ${isActive ? 'btn-secondary' : 'btn-primary'}`}
                    style={{ flex: 1 }}
                    onClick={() => setActiveUserId(user.id)}
                  >
                    {isActive ? 'Selecionado' : 'Filtrar contas'}
                  </button>

                  <button
                    className="btn btn-secondary btn-icon"
                    onClick={() => handleOpenEdit(user)}
                    title="Editar"
                  >
                    <Edit3 size={14} />
                  </button>

                  <button
                    className="btn btn-danger btn-icon"
                    onClick={() => {
                      setDeleteError('');
                      setDeletingUser(user);
                    }}
                    title="Excluir"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Adicionar Pessoa */}
      {isCreateModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCreateModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Adicionar Pessoa</h3>
              <button 
                className="btn btn-secondary btn-icon" 
                onClick={() => setIsCreateModalOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmitCreate}>
              <div className="modal-body">
                {formError && (
                  <div style={{ padding: '0.65rem', borderRadius: 'var(--radius-sm)', background: 'var(--danger-subtle)', color: '#f87171', fontSize: '0.8rem' }}>
                    {formError}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Nome Completo</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: Alan Duarte"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    required
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Salário Mensal Líquido (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    placeholder="0,00"
                    value={formData.salario}
                    onChange={(e) => setFormData({ ...formData, salario: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Dia do mês em que cai o salário (1 a 31)</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    className="form-input"
                    placeholder="Ex: 5"
                    value={formData.diaSalario}
                    onChange={(e) => setFormData({ ...formData, diaSalario: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Salvando...' : 'Salvar Pessoa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Editar Pessoa */}
      {editingUser && (
        <div className="modal-overlay" onClick={() => setEditingUser(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Editar Dados</h3>
              <button 
                className="btn btn-secondary btn-icon" 
                onClick={() => setEditingUser(null)}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmitEdit}>
              <div className="modal-body">
                {formError && (
                  <div style={{ padding: '0.65rem', borderRadius: 'var(--radius-sm)', background: 'var(--danger-subtle)', color: '#f87171', fontSize: '0.8rem' }}>
                    {formError}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Nome Completo</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Salário Mensal (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={formData.salario}
                    onChange={(e) => setFormData({ ...formData, salario: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Dia do Pagamento (1 a 31)</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    className="form-input"
                    value={formData.diaSalario}
                    onChange={(e) => setFormData({ ...formData, diaSalario: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setEditingUser(null)}
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Atualizando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirmar Exclusão */}
      {deletingUser && (
        <div className="modal-overlay" onClick={() => setDeletingUser(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Remover Pessoa</h3>
              <button 
                className="btn btn-secondary btn-icon" 
                onClick={() => setDeletingUser(null)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="modal-body">
              <p style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                Tem certeza que deseja remover <strong>{deletingUser.nome}</strong> do sistema?
              </p>

              {deleteError && (
                <div style={{
                  padding: '0.65rem 0.85rem',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: 'var(--radius-sm)',
                  color: '#f87171',
                  fontSize: '0.8rem',
                  marginTop: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}>
                  <span>⚠️</span>
                  <span>{deleteError}</span>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => setDeletingUser(null)}
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button 
                type="button" 
                className="btn btn-danger"
                onClick={handleConfirmDelete}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Removendo...' : 'Sim, Remover'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
