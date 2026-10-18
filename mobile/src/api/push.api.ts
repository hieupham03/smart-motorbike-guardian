import { apiClient, type GuardianApiClient } from './client';

export function createPushApi(client: GuardianApiClient = apiClient) {
  return {
    register: (payload: { token: string; platform: 'android' | 'ios'; installationId: string }) =>
      client.request<{ status: string }>({ url: '/api/push-tokens', method: 'POST', data: payload }),
    unregister: (installationId: string) =>
      client.request<{ status: string }>({ url: `/api/push-tokens/${encodeURIComponent(installationId)}`, method: 'DELETE' }),
  };
}

export const pushApi = createPushApi();
