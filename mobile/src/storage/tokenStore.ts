import * as SecureStore from 'expo-secure-store';

import type { AuthResponse, User } from '@/types/api';

const SESSION_KEY = 'guardian.auth.session.v1';

export interface StoredSession {
  accessToken: string;
  refreshToken: string;
  accessExpiresAtMs: number;
  user: User;
}

export interface SecureStorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  deleteItem(key: string): Promise<void>;
}

const expoSecureStorage: SecureStorageAdapter = {
  getItem: (key) => SecureStore.getItemAsync(key),
  setItem: (key, value) =>
    SecureStore.setItemAsync(key, value, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    }),
  deleteItem: (key) => SecureStore.deleteItemAsync(key),
};

function isStoredSession(value: unknown): value is StoredSession {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<StoredSession>;
  return (
    typeof candidate.accessToken === 'string' &&
    typeof candidate.refreshToken === 'string' &&
    typeof candidate.accessExpiresAtMs === 'number' &&
    !!candidate.user &&
    typeof candidate.user.userId === 'string'
  );
}

export function createTokenStore(storage: SecureStorageAdapter = expoSecureStorage) {
  let session: StoredSession | null = null;
  let generation = 0;
  const listeners = new Set<(next: StoredSession | null) => void>();

  const notify = () => listeners.forEach((listener) => listener(session));

  const persist = async () => {
    if (session) await storage.setItem(SESSION_KEY, JSON.stringify(session));
    else await storage.deleteItem(SESSION_KEY);
  };

  return {
    async hydrate() {
      const expectedGeneration = generation;
      const raw = await storage.getItem(SESSION_KEY);
      if (expectedGeneration !== generation || !raw) return session;
      try {
        const parsed: unknown = JSON.parse(raw);
        if (isStoredSession(parsed)) {
          session = parsed;
          notify();
        }
        else await storage.deleteItem(SESSION_KEY);
      } catch {
        await storage.deleteItem(SESSION_KEY);
      }
      return session;
    },

    getSession: () => session,
    getGeneration: () => generation,

    async startSession(auth: AuthResponse) {
      generation += 1;
      session = {
        accessToken: auth.accessToken,
        refreshToken: auth.refreshToken,
        accessExpiresAtMs: Date.now() + auth.expiresIn,
        user: auth.user,
      };
      await persist();
      notify();
      return generation;
    },

    async replaceSession(auth: AuthResponse, expectedGeneration: number) {
      if (expectedGeneration !== generation || !session) return false;
      session = {
        accessToken: auth.accessToken,
        refreshToken: auth.refreshToken,
        accessExpiresAtMs: Date.now() + auth.expiresIn,
        user: auth.user,
      };
      await persist();
      notify();
      return expectedGeneration === generation;
    },

    async updateUser(user: User, expectedGeneration = generation) {
      if (expectedGeneration !== generation || !session) return false;
      session = { ...session, user };
      await persist();
      notify();
      return expectedGeneration === generation;
    },

    async clear(expectedGeneration?: number) {
      if (expectedGeneration !== undefined && expectedGeneration !== generation) return false;
      generation += 1;
      session = null;
      await persist();
      notify();
      return true;
    },

    subscribe(listener: (next: StoredSession | null) => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

export type TokenStore = ReturnType<typeof createTokenStore>;
export const tokenStore = createTokenStore();
