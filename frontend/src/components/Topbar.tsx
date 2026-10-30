import React from 'react';
import { Menu, RefreshCw, User } from 'lucide-react';
import type { ActiveTab } from '../types';
import { useFinancial } from '../context/FinancialContext';

interface TopbarProps {
  currentTab: ActiveTab;
  onOpenMobileMenu: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ currentTab, onOpenMobileMenu }) => {
  const { 
    activeUser, 
    refreshUsuarios, 
    isLoading 
  } = useFinancial();

  const getPageTitle = (tab: ActiveTab) => {
    switch (tab) {
      case 'dashboard': return 'Visão Geral';
      case 'gastos': return 'Contas do Mês';
      case 'usuarios': return 'Pessoas Cadastradas';
      case 'pagamentos': return 'Cartões & Formas de Pagamento';
    }
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          className="btn btn-secondary btn-icon"
          onClick={onOpenMobileMenu}
          style={{ display: 'none' }}
          aria-label="Abrir menu"
          id="mobile-menu-btn"
        >
          <Menu size={18} />
        </button>

        <h2 className="page-title">{getPageTitle(currentTab)}</h2>

        {activeUser ? (
          <div className="user-active-badge">
            <User size={13} />
            <span>{activeUser.nome}</span>
            <span style={{ opacity: 0.4 }}>•</span>
            <span style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>Salário dia {activeUser.diaSalario}</span>
          </div>
        ) : (
          <div className="user-active-badge">
            <span>Todas as contas</span>
          </div>
        )}
      </div>

      <div className="topbar-right">
        {/* Discreet Real-time indicator */}
        <div className="status-pill" title="Atualizações automáticas ativas sem necessidade de F5">
          <span className="status-dot online" />
          <span>Sincronizado</span>
        </div>

        {/* Manual Refresh */}
        <button
          className="btn btn-secondary btn-icon"
          onClick={() => refreshUsuarios()}
          title="Atualizar dados"
          disabled={isLoading}
        >
          <RefreshCw size={14} className={isLoading ? 'spin-animation' : ''} />
        </button>
      </div>
    </header>
  );
};
