import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { AuthResponse } from '@book-scanner/shared';
import { tokenStorage } from './token-storage';
import { api } from './api';

interface AuthState {
  user: { id: string; email: string } | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const handleAuthResponse = useCallback(async (response: AuthResponse) => {
    await tokenStorage.setTokens(response.accessToken, response.refreshToken);
    setState({ user: response.user, isLoading: false, isAuthenticated: true });
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const token = await tokenStorage.getAccessToken();
        if (token) {
          const { user } = await api.getMe();
          setState({ user, isLoading: false, isAuthenticated: true });
        } else {
          setState({ user: null, isLoading: false, isAuthenticated: false });
        }
      } catch {
        await tokenStorage.clear();
        setState({ user: null, isLoading: false, isAuthenticated: false });
      }
    })();
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await api.login({ email, password });
      await handleAuthResponse(response);
    },
    [handleAuthResponse],
  );

  const register = useCallback(
    async (email: string, password: string) => {
      const response = await api.register({ email, password });
      await handleAuthResponse(response);
    },
    [handleAuthResponse],
  );

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      // Proceed even if API call fails
    }
    await tokenStorage.clear();
    setState({ user: null, isLoading: false, isAuthenticated: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
