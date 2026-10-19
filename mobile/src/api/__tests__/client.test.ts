import { create } from 'axios';
import MockAdapter from 'axios-mock-adapter';

import { createApiClient } from '../client';
import { GuardianApiError } from '../errors';
import { createTokenStore, type SecureStorageAdapter } from '@/storage/tokenStore';
import type { ApiResponse, AuthResponse } from '@/types/api';

function memoryStorage(): SecureStorageAdapter {
  const values = new Map<string, string>();
  return {
    getItem: async (key) => values.get(key) ?? null,
    setItem: async (key, value) => { values.set(key, value); },
    deleteItem: async (key) => { values.delete(key); },
  };
}

function auth(suffix: string): AuthResponse {
  return {
    accessToken: `access-${suffix}`,
    refreshToken: `refresh-${suffix}`,
    expiresIn: 900_000,
    tokenType: 'Bearer',
    user: {
      userId: 'user-1',
      email: 'owner@example.com',
      fullName: 'Owner',
      role: 'OWNER',
      status: 'ACTIVE',
      createdAt: '2026-10-18T00:00:00Z',
    },
  };
}

const ok = <T,>(data: T): ApiResponse<T> => ({
  success: true,
  message: 'Success',
  data,
  timestamp: Date.now(),
});

describe('API refresh handling', () => {
  it('uses one refresh request for concurrent 401 responses and replays each request once', async () => {
    const store = createTokenStore(memoryStorage());
    await store.startSession(auth('old'));
    const apiAxios = create();
    const refreshAxios = create();
    const apiMock = new MockAdapter(apiAxios);
    const refreshMock = new MockAdapter(refreshAxios, { delayResponse: 10 });
    apiMock.onGet('/api/secure').reply((config) =>
      config.headers?.Authorization === 'Bearer access-new'
        ? [200, ok({ value: 42 })]
        : [401, { success: false, message: 'Expired' }],
    );
    refreshMock.onPost('/api/auth/refresh').reply(200, ok(auth('new')));
    const client = createApiClient({ store, axiosInstance: apiAxios, refreshInstance: refreshAxios });

    const [first, second] = await Promise.all([
      client.request<{ value: number }>({ url: '/api/secure' }),
      client.request<{ value: number }>({ url: '/api/secure' }),
    ]);

    expect(first.data.value).toBe(42);
    expect(second.data.value).toBe(42);
    expect(refreshMock.history.post).toHaveLength(1);
    expect(apiMock.history.get).toHaveLength(4);
    expect(store.getSession()?.accessToken).toBe('access-new');
  });

  it('keeps the stored session when refresh fails because the network is unavailable', async () => {
    const store = createTokenStore(memoryStorage());
    await store.startSession(auth('old'));
    const apiAxios = create();
    const refreshAxios = create();
    new MockAdapter(apiAxios).onGet('/api/secure').reply(401);
    new MockAdapter(refreshAxios).onPost('/api/auth/refresh').networkError();
    const client = createApiClient({ store, axiosInstance: apiAxios, refreshInstance: refreshAxios });

    await expect(client.request({ url: '/api/secure' })).rejects.toMatchObject({ kind: 'network' });
    expect(store.getSession()?.refreshToken).toBe('refresh-old');
  });

  it('clears the session when the refresh token is rejected', async () => {
    const store = createTokenStore(memoryStorage());
    await store.startSession(auth('old'));
    const apiAxios = create();
    const refreshAxios = create();
    new MockAdapter(apiAxios).onGet('/api/secure').reply(401);
    new MockAdapter(refreshAxios).onPost('/api/auth/refresh').reply(401, {
      success: false,
      message: 'Refresh token hết hạn',
    });
    const client = createApiClient({ store, axiosInstance: apiAxios, refreshInstance: refreshAxios });

    await expect(client.request({ url: '/api/secure' })).rejects.toBeInstanceOf(GuardianApiError);
    expect(store.getSession()).toBeNull();
  });
});
