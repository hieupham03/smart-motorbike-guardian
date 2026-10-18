import type { QueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { authApi } from '@/api/auth.api';
import { normalizeApiError } from '@/api/errors';
import { tokenStore } from '@/storage/tokenStore';
import { unregisterCurrentInstallation } from '@/push/registration';
import type { LoginRequest, RegisterRequest, User } from '@/types/api';

type AuthStatus = 'loading' | 'anonymous' | 'authenticated';

interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  error: string | null;
  login(payload: LoginRequest): Promise<void>;
  register(payload: RegisterRequest): Promise<void>;
  logout(): Promise<void>;
  refreshProfile(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children,
  queryClient,
}: {
  children: React.ReactNode;
  queryClient: QueryClient;
}) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  const logout = useCallback(async () => {
    try { await unregisterCurrentInstallation(); } catch { /* Local logout must still succeed offline. */ }
    await tokenStore.clear();
    queryClient.clear();
    setUser(null);
    setError(null);
    setStatus('anonymous');
  }, [queryClient]);

  const refreshProfile = useCallback(async () => {
    const generation = tokenStore.getGeneration();
    try {
      const response = await authApi.me();
      if (generation !== tokenStore.getGeneration()) return;
      await tokenStore.updateUser(response.data, generation);
      setUser(response.data);
      setError(null);
    } catch (cause) {
      const apiError = normalizeApiError(cause);
      if (apiError.status === 401 || apiError.status === 403) await logout();
      else setError(apiError.message);
    }
  }, [logout]);

  useEffect(() => {
    return tokenStore.subscribe((next) => {
      if (next) {
        setUser(next.user);
        setStatus('authenticated');
      } else {
        queryClient.clear();
        setUser(null);
        setStatus('anonymous');
      }
    });
  }, [queryClient]);

  useEffect(() => {
    let active = true;
    void tokenStore.hydrate().then(async (session) => {
      if (!active) return;
      if (!session) {
        setStatus('anonymous');
        return;
      }
      setUser(session.user);
      setStatus('authenticated');
      await refreshProfile();
    });
    return () => {
      active = false;
    };
  }, [refreshProfile]);

  const beginSession = async (response: Awaited<ReturnType<typeof authApi.login>>) => {
    if (!response.success || !response.data) throw new Error(response.message);
    queryClient.clear();
    await tokenStore.startSession(response.data);
    setError(null);
  };
  const login = async (payload: LoginRequest) => beginSession(await authApi.login(payload));
  const register = async (payload: RegisterRequest) => beginSession(await authApi.register(payload));

  const value = { status, user, error, login, register, logout, refreshProfile };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used within AuthProvider');
  return value;
}
