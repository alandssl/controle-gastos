import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  RefreshCw, 
  CheckCircle2, 
  Send,
  Zap
} from 'lucide-react';
import { liveSync } from '../services/websocket';
import { useFinancial } from '../context/FinancialContext';

export const WebSocketView: React.FC = () => {
  const { isWsConnected, simulateLiveTransaction } = useFinancial();
  const [wsUrl, setWsUrl] = useState(liveSync.getUrl());
  const [logs, setLogs] = useState(liveSync.getActivityLogs());

  useEffect(() => {
    const interval = setInterval(() => {
      setLogs(liveSync.getActivityLogs());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleReconnect = () => {
    liveSync.connect(wsUrl);
  };

  return (
    <div className="page-content">
      {/* 2 Simple Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
        
        <div className="metric-card">
          <span className="metric-title">Status da Sincronização</span>
          <div className="metric-value" style={{ fontSize: '1.3rem', marginTop: '0.25rem', color: isWsConnected ? 'var(--success)' : 'var(--text-primary)' }}>
            {isWsConnected ? 'Conectado via WebSocket' : 'Sincronizado entre Abas'}
          </div>
          <span className="metric-footer">
            {isWsConnected 
              ? 'Conexão ativa com o servidor WebSocket na porta 3000' 
              : 'As alterações refletem instantaneamente sem precisar dar F5'}
          </span>
        </div>

        <div className="metric-card">
          <span className="metric-title">Atualização Automática</span>
          <div className="metric-value" style={{ fontSize: '1.3rem', marginTop: '0.25rem', color: 'var(--primary)' }}>
            Em Tempo Real
          </div>
          <span className="metric-footer">Qualquer conta paga ou adicionada atualiza o dashboard no mesmo instante</span>
        </div>

      </div>

      {/* Test & Endpoint Box */}
      <div className="glass-panel">
        <div className="panel-header">
          <div>
            <h3 className="panel-title">
              <Wifi size={18} />
              Configuração da Conexão
            </h3>
            <p className="panel-subtitle">Endereço do servidor para atualizações em tempo real</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
          <input
            type="text"
            className="form-input"
            style={{ flex: 1, minWidth: '240px' }}
            value={wsUrl}
            onChange={(e) => setWsUrl(e.target.value)}
            placeholder="ws://localhost:3000/ws"
          />
          <button 
            className="btn btn-primary"
            onClick={handleReconnect}
          >
            <RefreshCw size={14} />
            <span>Reconectar</span>
          </button>
        </div>

        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
            Deseja testar se a atualização em tempo real está funcionando?
          </span>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={simulateLiveTransaction}
          >
            <Zap size={14} color="var(--warning)" />
            <span>Disparar conta de teste (ver atualização instantânea)</span>
          </button>
        </div>
      </div>

      {/* Clean Activity Feed */}
      <div className="glass-panel">
        <div className="panel-header">
          <div>
            <h3 className="panel-title">Histórico de Sincronizações Recentes</h3>
            <p className="panel-subtitle">Eventos recebidos e enviados pelo sistema</p>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{logs.length} eventos</span>
        </div>

        <div 
          style={{
            background: 'rgba(0, 0, 0, 0.25)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.85rem',
            fontSize: '0.8rem',
            maxHeight: '260px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem'
          }}
        >
          {logs.length === 0 ? (
            <div style={{ color: 'var(--text-tertiary)', fontStyle: 'italic', padding: '0.5rem' }}>
              Nenhuma alteração recente registrada ainda.
            </div>
          ) : (
            logs.map((log) => (
              <div 
                key={log.id} 
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '0.65rem',
                  color: 'var(--text-secondary)',
                  lineHeight: '1.4'
                }}
              >
                <span style={{ color: 'var(--text-tertiary)', fontSize: '0.72rem' }}>{log.timestamp}</span>
                <span style={{ color: '#fff', fontWeight: 500 }}>{log.message}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Human explainer */}
      <div 
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-md)',
          padding: '1rem 1.25rem',
          fontSize: '0.82rem',
          color: 'var(--text-secondary)',
          lineHeight: '1.5'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff', fontWeight: 600, marginBottom: '0.25rem' }}>
          <CheckCircle2 size={16} color="var(--success)" />
          Como funciona a atualização automática:
        </div>
        <p>
          Você não precisa atualizar a página (F5) enquanto organiza suas contas. Se você abrir o sistema no celular e no computador ao mesmo tempo, marcar uma conta como paga em um aparelho atualiza o painel do outro no mesmo segundo.
        </p>
      </div>
    </div>
  );
};
