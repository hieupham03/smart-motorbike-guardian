import { apiClient, type GuardianApiClient } from './client';
import type { AlertStatus, CommandRequest, DeviceAlert, DeviceCommand } from '@/types/api';

export function createControlApi(client: GuardianApiClient = apiClient) {
  return {
    commands: (deviceId: string) =>
      client.request<DeviceCommand[]>({ url: `/api/devices/${deviceId}/commands`, method: 'GET' }),
    sendCommand: (deviceId: string, payload: CommandRequest) =>
      client.request<DeviceCommand>({ url: `/api/devices/${deviceId}/command`, method: 'POST', data: payload }),
    alerts: (deviceId?: string, status?: AlertStatus) =>
      client.request<DeviceAlert[]>({ url: '/api/alerts', method: 'GET', params: { device_id: deviceId, status } }),
    acknowledgeAlert: (alertId: string) =>
      client.request<DeviceAlert>({ url: `/api/alerts/${alertId}/acknowledge`, method: 'POST' }),
    resolveAlert: (alertId: string, actionTaken: string) =>
      client.request<DeviceAlert>({ url: `/api/alerts/${alertId}/resolve`, method: 'POST', data: { actionTaken } }),
  };
}

export const controlApi = createControlApi();
