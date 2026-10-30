import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  CheckSquare, 
  CreditCard, 
  Wifi, 
  Wallet
} from 'lucide-react';
import type { ActiveTab } from '../types';
import { useFinancial } from '../context/FinancialContext';

interface SidebarProps {
  currentTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
}) => {
  const { usuarios, activeUserId, setActiveUserId, isWsConnected, isBackendOnline } = useFinancial();

  const navItems: Array<{ id: ActiveTab; label: string; icon: React.ReactNode; badge?: string }> = [
    { id: 'dashboard', label: 'Visão Geral', icon: <LayoutDashboard size={18} /> },
    { id: 'gastos', label: 'Contas do Mês', icon: <CheckSquare size={18} /> },
    { id: 'usuarios', label: 'Pessoas', icon: <Users size={18} />, badge: `${usuarios.length}` },
    { id: 'pagamentos', label: 'Cartões & Faturas', icon: <CreditCard size={18} /> },
    { id: 'websocket', label: 'Sincronização', icon: <Wifi size={18} /> },
  ];

  return (
    <aside className={`sidebar ${isOpenMobile ? 'open' : ''}`}>
      {/* Brand Header */}
      <div className="sidebar-header">
        <div className="logo-badge">
          <Wallet size={18} />
        </div>
        <div className="logo-text">
          <h1>Checklist</h1>
          <span>Controle de Contas</span>
        </div>
      </div>

      {/* Navigation */}
      <div className="nav-section">
        <span className="nav-label">Menu</span>
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${currentTab === item.id ? 'active' : ''}`}
            onClick={() => {
              onSelectTab(item.id);
              onCloseMobile();
            }}
          >
            {item.icon}
            <span style={{ flex: 1 }}>{item.label}</span>
            {item.badge && (
              <span
                style={{
                  fontSize: '0.7rem',
                  padding: '0.1rem 0.45rem',
                  borderRadius: '999px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: 'var(--text-secondary)',
                }}
              >
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* User Switcher */}
      <div className="sidebar-footer">
        <div className="user-selector-card">
          <div className="title">Visualizando contas de:</div>
          <select
            className="user-select-dropdown"
            value={activeUserId}
            onChange={(e) => {
              const val = e.target.value;
              setActiveUserId(val === 'all' ? 'all' : Number(val));
            }}
          >
            <option value="all">Todas as pessoas (Geral)</option>
            {usuarios.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nome} (Salário dia {u.diaSalario})
              </option>
            ))}
          </select>
        </div>

        {/* Discreet status */}
        <div
          style={{
            marginTop: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.72rem',
            color: 'var(--text-tertiary)',
            padding: '0 0.25rem',
          }}
        >
          <span>Status do sistema:</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: isBackendOnline ? 'var(--success)' : 'var(--text-secondary)' }}>
            <span className={`status-dot ${isBackendOnline ? 'online' : ''}`} />
            {isBackendOnline ? 'Conectado' : 'Modo local'}
          </span>
        </div>
      </div>
    </aside>
  );
};
