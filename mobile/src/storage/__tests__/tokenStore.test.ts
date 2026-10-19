import { createTokenStore, type SecureStorageAdapter } from '../tokenStore';
import type { AuthResponse } from '@/types/api';

function auth(suffix = 'one'): AuthResponse {
  return {
    accessToken: `access-${suffix}`,
    refreshToken: `refresh-${suffix}`,
    expiresIn: 900_000,
    tokenType: 'Bearer',
    user: {
      userId: `user-${suffix}`,
      email: `${suffix}@example.com`,
      fullName: suffix,
      role: 'OWNER',
      status: 'ACTIVE',
      createdAt: '2026-10-18T00:00:00Z',
    },
  };
}

function memoryStorage(): SecureStorageAdapter {
  const values = new Map<string, string>();
  return {
    getItem: async (key) => values.get(key) ?? null,
    setItem: async (key, value) => { values.set(key, value); },
    deleteItem: async (key) => { values.delete(key); },
  };
}

describe('tokenStore', () => {
  it('stores expiry using expiresIn milliseconds', async () => {
    const store = createTokenStore(memoryStorage());
    const before = Date.now();
    await store.startSession(auth());
    expect(store.getSession()?.accessExpiresAtMs).toBeGreaterThanOrEqual(before + 900_000);
  });

  it('does not let an old refresh replace a logged-out session', async () => {
    const store = createTokenStore(memoryStorage());
    const generation = await store.startSession(auth());
    await store.clear();
    expect(await store.replaceSession(auth('stale'), generation)).toBe(false);
    expect(store.getSession()).toBeNull();
  });

  it('hydrates a persisted session', async () => {
    const storage = memoryStorage();
    const first = createTokenStore(storage);
    await first.startSession(auth());
    const second = createTokenStore(storage);
    await second.hydrate();
    expect(second.getSession()?.user.userId).toBe('user-one');
  });
});
