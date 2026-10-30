import { useState, Component, type ErrorInfo, type ReactNode } from 'react';
import { FinancialProvider } from './context/FinancialContext';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { DashboardView } from './views/DashboardView';
import { UsuariosView } from './views/UsuariosView';
import { GastosChecklistView } from './views/GastosChecklistView';
import { PagamentosView } from './views/PagamentosView';
import type { ActiveTab } from './types';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary capturou erro:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#090d16',
          color: '#f8fafc',
          padding: '2rem',
          textAlign: 'center',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <div style={{
            maxWidth: '540px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '16px',
            padding: '2rem'
          }}>
            <h2 style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '1.4rem' }}>
              ⚠️ Ops! Ocorreu um erro ao carregar a interface
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
              {this.state.error?.message || 'Erro inesperado de renderização.'}
            </p>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              style={{
                backgroundColor: '#6366f1',
                color: '#fff',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Limpar Cache e Recarregar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export const MainApp: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<ActiveTab>('dashboard');
  const [isOpenMobile, setIsOpenMobile] = useState(false);

  return (
    <div className="app-container">
      {/* Sidebar */}
      <Sidebar 
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        isOpenMobile={isOpenMobile}
        onCloseMobile={() => setIsOpenMobile(false)}
      />

      {/* Main Content */}
      <div className="main-wrapper">
        <Topbar 
          currentTab={currentTab}
          onOpenMobileMenu={() => setIsOpenMobile(true)}
        />

        <main style={{ flex: 1 }}>
          {currentTab === 'dashboard' && <DashboardView onNavigateTab={setCurrentTab} />}
          {currentTab === 'usuarios' && <UsuariosView />}
          {currentTab === 'gastos' && <GastosChecklistView />}
          {currentTab === 'pagamentos' && <PagamentosView />}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <FinancialProvider>
        <MainApp />
      </FinancialProvider>
    </ErrorBoundary>
  );
}
