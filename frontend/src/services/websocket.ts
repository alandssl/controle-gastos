import type { WsMessagePayload } from '../types';

type ListenerCallback = (payload: WsMessagePayload) => void;

class LiveSyncService {
  private ws: WebSocket | null = null;
  private wsUrl: string = 'ws://localhost:3000/ws';
  private listeners: Map<string, Set<ListenerCallback>> = new Map();
  private broadcastChannel: BroadcastChannel | null = null;
  private reconnectTimer: any = null;
  private isConnected: boolean = false;
  private activityLogs: Array<{ id: string; timestamp: string; message: string; type: string }> = [];
  private onStateChangeListeners: Set<(connected: boolean) => void> = new Set();

  constructor() {
    // Initialize cross-tab synchronization
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.broadcastChannel = new BroadcastChannel('con_checklist_realtime_bus');
      this.broadcastChannel.onmessage = (event) => {
        if (event.data && event.data.type) {
          this.handleIncomingMessage(event.data, 'BroadcastChannel (Outra Aba)');
        }
      };
    }
  }

  public connect(customUrl?: string) {
    if (customUrl) {
      this.wsUrl = customUrl;
    }

    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      this.ws = new WebSocket(this.wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.logActivity('Conexão WebSocket estabelecida com sucesso.', 'success');
        this.notifyStateChange(true);
      };

      this.ws.onmessage = (event) => {
        try {
          const payload: WsMessagePayload = JSON.parse(event.data);
          this.handleIncomingMessage(payload, 'Servidor WebSocket');
        } catch {
          this.logActivity(`Mensagem recebida: ${event.data}`, 'info');
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.notifyStateChange(false);
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        this.isConnected = false;
        this.notifyStateChange(false);
      };
    } catch {
      this.isConnected = false;
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      // Background retry silently without spamming
      this.connect();
    }, 6000);
  }

  public emit(type: WsMessagePayload['type'], data?: any) {
    const payload: WsMessagePayload = {
      type,
      data,
      timestamp: new Date().toISOString(),
      source: 'Client UI'
    };

    // 1. Dispatch locally to current tab listeners
    this.dispatchLocal(payload);

    // 2. Broadcast to other open browser tabs
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(payload);
      } catch (e) {
        console.warn('BroadcastChannel error:', e);
      }
    }

    // 3. Send over active WebSocket if connected
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(payload));
      } catch (e) {
        console.warn('WebSocket send error:', e);
      }
    }

    this.logActivity(`Evento emitido: ${type}`, 'emit');
  }

  private handleIncomingMessage(payload: WsMessagePayload, sourceName: string) {
    this.logActivity(`Evento recebido (${sourceName}): ${payload.type}`, 'incoming');
    this.dispatchLocal(payload);
  }

  private dispatchLocal(payload: WsMessagePayload) {
    const specificListeners = this.listeners.get(payload.type);
    if (specificListeners) {
      specificListeners.forEach((callback) => callback(payload));
    }

    const allListeners = this.listeners.get('*');
    if (allListeners) {
      allListeners.forEach((callback) => callback(payload));
    }
  }

  public on(type: string, callback: ListenerCallback) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(callback);
    return () => this.off(type, callback);
  }

  public off(type: string, callback: ListenerCallback) {
    const set = this.listeners.get(type);
    if (set) {
      set.delete(callback);
    }
  }

  public onStateChange(listener: (connected: boolean) => void) {
    this.onStateChangeListeners.add(listener);
    listener(this.isConnected);
    return () => this.onStateChangeListeners.delete(listener);
  }

  private notifyStateChange(connected: boolean) {
    this.onStateChangeListeners.forEach((fn) => fn(connected));
  }

  public getIsConnected(): boolean {
    return this.isConnected;
  }

  public getUrl(): string {
    return this.wsUrl;
  }

  public getActivityLogs() {
    return [...this.activityLogs];
  }

  private logActivity(message: string, type: string) {
    const logItem = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString('pt-BR'),
      message,
      type
    };
    this.activityLogs = [logItem, ...this.activityLogs.slice(0, 49)];
  }
}

export const liveSync = new LiveSyncService();
