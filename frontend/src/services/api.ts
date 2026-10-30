import type { Usuario } from '../types';
import { INITIAL_MOCK_USERS } from '../data/mockData';
import { liveSync } from './websocket';

// Base API configuration (proxied in Vite or direct)
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const LOCAL_STORAGE_USERS_KEY = 'con_checklist_usuarios_fallback';

// Initialize local fallback storage if not present
function getLocalUsers(): Usuario[] {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
    if (!data) {
      localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(INITIAL_MOCK_USERS));
      return INITIAL_MOCK_USERS;
    }
    return JSON.parse(data);
  } catch {
    return INITIAL_MOCK_USERS;
  }
}

function saveLocalUsers(users: Usuario[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(users));
  } catch (e) {
    console.error("Erro ao salvar usuários locais:", e);
  }
}

export interface ApiStatus {
  isBackendConnected: boolean;
  lastChecked: Date | null;
  message: string;
}

export const apiService = {
  // Check backend health/reachability
  async checkBackend(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(`${API_BASE_URL}/usuario/buscar`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return res.ok;
    } catch {
      return false;
    }
  },

  // 1. List or search users by name
  async getUsuarios(nome?: string): Promise<{ data: Usuario[]; fromBackend: boolean }> {
    try {
      const url = nome?.trim() 
        ? `${API_BASE_URL}/usuario/buscar?nome=${encodeURIComponent(nome.trim())}`
        : `${API_BASE_URL}/usuario/buscar`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Status ${response.status}`);
      }

      const users: Usuario[] = await response.json();
      
      // Update local cache so offline view is synchronized
      if (Array.isArray(users) && users.length > 0) {
        saveLocalUsers(users);
      }
      
      return { data: users, fromBackend: true };
    } catch (err) {
      console.warn("Backend indisponível ou erro ao buscar usuários, usando dados locais:", err);
      const local = getLocalUsers();
      const filtered = nome?.trim()
        ? local.filter(u => u.nome.toLowerCase().includes(nome.toLowerCase()))
        : local;
      return { data: filtered, fromBackend: false };
    }
  },

  // 2. Create user (POST /usuario/criar)
  async criarUsuario(payload: { nome: string; salario: number; diaSalario: number }): Promise<{ data: Usuario; fromBackend: boolean }> {
    try {
      const response = await fetch(`${API_BASE_URL}/usuario/criar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Erro ao criar: status ${response.status}`);
      }

      const created: Usuario = await response.json();
      
      // Sync local storage
      const local = getLocalUsers();
      saveLocalUsers([created, ...local.filter(u => u.id !== created.id)]);

      // Broadcast live event via WebSocket / BroadcastChannel
      liveSync.emit('USER_CREATED', created);

      return { data: created, fromBackend: true };
    } catch (err) {
      console.warn("Backend offline ao criar usuário, salvando localmente:", err);
      const local = getLocalUsers();
      const newId = local.length > 0 ? Math.max(...local.map(u => u.id || 0)) + 1 : 1;
      const fallbackUser: Usuario = {
        id: newId,
        nome: payload.nome,
        salario: Number(payload.salario),
        diaSalario: Number(payload.diaSalario),
      };
      
      const updatedList = [fallbackUser, ...local];
      saveLocalUsers(updatedList);
      liveSync.emit('USER_CREATED', fallbackUser);

      return { data: fallbackUser, fromBackend: false };
    }
  },

  // 3. Update user (PUT /usuario/atualizar)
  async atualizarUsuario(payload: { id: number; nome: string; salario: number; diaSalario: number }): Promise<{ data: Usuario; fromBackend: boolean }> {
    try {
      const response = await fetch(`${API_BASE_URL}/usuario/atualizar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Erro ao atualizar: status ${response.status}`);
      }

      const updated: Usuario = await response.json();
      
      const local = getLocalUsers();
      saveLocalUsers(local.map(u => (u.id === updated.id ? updated : u)));

      liveSync.emit('USER_UPDATED', updated);
      return { data: updated, fromBackend: true };
    } catch (err) {
      console.warn("Backend offline ao atualizar usuário, atualizando localmente:", err);
      const local = getLocalUsers();
      const updatedUser: Usuario = {
        id: payload.id,
        nome: payload.nome,
        salario: Number(payload.salario),
        diaSalario: Number(payload.diaSalario),
      };
      saveLocalUsers(local.map(u => (u.id === payload.id ? updatedUser : u)));
      liveSync.emit('USER_UPDATED', updatedUser);
      return { data: updatedUser, fromBackend: false };
    }
  },

  // 4. Delete user (DELETE /usuario/deletar/:id)
  async deletarUsuario(id: number): Promise<{ success: boolean; fromBackend: boolean }> {
    try {
      const response = await fetch(`${API_BASE_URL}/usuario/deletar/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Erro ao deletar: status ${response.status}`);
      }

      const local = getLocalUsers();
      saveLocalUsers(local.filter(u => u.id !== id));

      liveSync.emit('USER_DELETED', { id });
      return { success: true, fromBackend: true };
    } catch (err) {
      console.warn("Backend offline ao deletar usuário, removendo localmente:", err);
      const local = getLocalUsers();
      saveLocalUsers(local.filter(u => u.id !== id));
      liveSync.emit('USER_DELETED', { id });
      return { success: true, fromBackend: false };
    }
  }
};
