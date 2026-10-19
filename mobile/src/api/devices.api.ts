import { apiClient, type GuardianApiClient } from './client';
import type { Device, Telemetry } from '@/types/api';

export function createDevicesApi(client: GuardianApiClient = apiClient) {
  return {
    list: () => client.request<Device[]>({ url: '/api/devices', method: 'GET' }),
    detail: (deviceId: string) => client.request<Device>({ url: `/api/devices/${deviceId}`, method: 'GET' }),
    latestTelemetry: (deviceId: string) => client.request<Telemetry | null>({ url: `/api/devices/${deviceId}/telemetry/latest`, method: 'GET' }),
    telemetryHistory: (deviceId: string, from: number, to: number, page = 0, size = 300) =>
      client.request<Telemetry[]>({
        url: `/api/devices/${deviceId}/telemetry`, method: 'GET', params: { from, to, page, size },
      }),
  };
}

export const devicesApi = createDevicesApi();
