import {
  create as createAxios,
  isAxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';

import { env } from '@/config/env';
import { tokenStore, type TokenStore } from '@/storage/tokenStore';
import type { ApiResponse, AuthResponse } from '@/types/api';
import { normalizeApiError } from './errors';

type RetriableRequest = InternalAxiosRequestConfig & { _guardianRetried?: boolean };

interface ApiClientOptions {
  baseUrl?: string;
  store?: TokenStore;
  onAuthExpired?: () => void | Promise<void>;
  axiosInstance?: AxiosInstance;
  refreshInstance?: AxiosInstance;
}

export function createApiClient(options: ApiClientOptions = {}) {
  const store = options.store ?? tokenStore;
  const baseURL = options.baseUrl ?? env.apiBaseUrl;
  const client =
    options.axiosInstance ??
    createAxios({ baseURL, timeout: 12_000, headers: { Accept: 'application/json' } });
  const refreshClient =
    options.refreshInstance ??
    createAxios({ baseURL, timeout: 12_000, headers: { Accept: 'application/json' } });
  let refreshPromise: Promise<string> | null = null;

  const expireSession = async (generation: number) => {
    const cleared = await store.clear(generation);
    if (cleared) await options.onAuthExpired?.();
  };

  const refreshAccessToken = () => {
    if (refreshPromise) return refreshPromise;
    const current = store.getSession();
    const generation = store.getGeneration();
    if (!current?.refreshToken) {
      refreshPromise = Promise.reject(
        normalizeApiError(new Error('Không có refresh token')),
      );
      return refreshPromise.finally(() => {
        refreshPromise = null;
      });
    }

    refreshPromise = refreshClient
      .post<ApiResponse<AuthResponse>>('/api/auth/refresh', {
        refreshToken: current.refreshToken,
      })
      .then(async ({ data }) => {
        if (!data.success || !data.data?.accessToken) {
          throw new Error(data.message || 'Phản hồi refresh token không hợp lệ');
        }
        const stored = await store.replaceSession(data.data, generation);
        if (!stored) throw new Error('Phiên đã thay đổi trong khi làm mới token');
        return data.data.accessToken;
      })
      .catch(async (error: unknown) => {
        const normalized = normalizeApiError(error);
        if (normalized.status === 401 || normalized.status === 403) {
          await expireSession(generation);
        }
        throw normalized;
      })
      .finally(() => {
        refreshPromise = null;
      });
    return refreshPromise;
  };

  const ensureAccessToken = async (minimumValidityMs = 45_000) => {
    const current = store.getSession();
    if (!current) throw new Error('Chưa đăng nhập');
    if (current.accessExpiresAtMs > Date.now() + minimumValidityMs) {
      return current.accessToken;
    }
    return refreshAccessToken();
  };

  client.interceptors.request.use((config) => {
    const accessToken = store.getSession()?.accessToken;
    if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    async (error: unknown) => {
      if (!isAxiosError(error) || error.response?.status !== 401 || !error.config) {
        throw normalizeApiError(error);
      }
      const request = error.config as RetriableRequest;
      const isAuthRequest = request.url?.startsWith('/api/auth/');
      if (request._guardianRetried || isAuthRequest) throw normalizeApiError(error);
      request._guardianRetried = true;
      request.headers.Authorization = `Bearer ${await refreshAccessToken()}`;
      return client.request(request);
    },
  );

  async function request<T>(config: AxiosRequestConfig) {
    try {
      const response = await client.request<ApiResponse<T>>(config);
      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Phản hồi API không hợp lệ');
      }
      return response.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  }

  return { request, raw: client, ensureAccessToken, refreshAccessToken };
}

export type GuardianApiClient = ReturnType<typeof createApiClient>;
export const apiClient = createApiClient();
