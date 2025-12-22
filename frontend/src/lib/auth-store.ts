import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  name: string;
  role: string;
}

interface AuthResponse {
  success: boolean;
  data?: {
    user: User;
    scope: string;
    clearance: number;
    permissions: string[];
  };
  error?: string;
  code?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  scope: string | null;
  clearance: number;
  permissions: string[];
  login: (apiKey: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  verify: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      token: null,
      scope: null,
      clearance: 0,
      permissions: [],
      
      login: async (apiKey: string) => {
        try {
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ apiKey }),
          });
          
          const result: AuthResponse = await response.json();
          
          if (result.success && result.data) {
            set({
              isAuthenticated: true,
              token: apiKey,
              user: result.data.user,
              scope: result.data.scope,
              clearance: result.data.clearance,
              permissions: result.data.permissions,
            });
            return { success: true };
          }
          
          return { 
            success: false, 
            error: result.error || 'Authentication failed' 
          };
        } catch (error) {
          console.error('[AUTH] Login error:', error);
          return { 
            success: false, 
            error: 'Network error. Unable to reach authentication server.' 
          };
        }
      },
      
      logout: () => {
        const token = get().token;
        if (token) {
          // Fire and forget logout notification
          fetch('/api/auth/logout', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          }).catch(() => {});
        }
        set({ 
          isAuthenticated: false, 
          user: null, 
          token: null,
          scope: null,
          clearance: 0,
          permissions: [],
        });
      },
      
      verify: async () => {
        const token = get().token;
        if (!token) return false;
        
        try {
          const response = await fetch('/api/auth/verify', {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          
          if (!response.ok) {
            get().logout();
            return false;
          }
          
          return true;
        } catch {
          return false;
        }
      },
    }),
    {
      name: 'flowgen-nexus-auth',
    }
  )
);