import { apiClient, type GuardianApiClient } from './client';
import type { Device, DeviceConfigRequest, OnboardRequest, Telemetry, User } from '@/types/api';

export function createDevicesApi(client: GuardianApiClient = apiClient) {
  return {
    list: () => client.request<Device[]>({ url: '/api/devices', method: 'GET' }),
    detail: (deviceId: string) => client.request<Device>({ url: `/api/devices/${deviceId}`, method: 'GET' }),
    latestTelemetry: (deviceId: string) => client.request<Telemetry | null>({ url: `/api/devices/${deviceId}/telemetry/latest`, method: 'GET' }),
    telemetryHistory: (deviceId: string, from: number, to: number, page = 0, size = 300) =>
      client.request<Telemetry[]>({
        url: `/api/devices/${deviceId}/telemetry`, method: 'GET', params: { from, to, page, size },
      }),
    onboard: (payload: OnboardRequest) =>
      client.request<Device>({ url: '/api/devices/onboard', method: 'POST', data: payload }),
    updateConfig: (deviceId: string, payload: DeviceConfigRequest) =>
      client.request<Device>({ url: `/api/devices/${deviceId}/config`, method: 'PATCH', data: payload }),
    users: (deviceId: string) =>
      client.request<User[]>({ url: `/api/devices/${deviceId}/users`, method: 'GET' }),
    inviteViewer: (deviceId: string, email: string) =>
      client.request<null>({ url: `/api/devices/${deviceId}/users`, method: 'POST', data: { email, role: 'VIEWER' } }),
    removeUser: (deviceId: string, userId: string) =>
      client.request<null>({ url: `/api/devices/${deviceId}/users/${userId}`, method: 'DELETE' }),
  };
}

export const devicesApi = createDevicesApi();
