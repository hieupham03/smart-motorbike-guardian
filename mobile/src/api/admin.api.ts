import { apiClient, type GuardianApiClient } from './client';
import type { AuditLog, Device, User } from '@/types/api';

export function createAdminApi(client: GuardianApiClient = apiClient) {
  return {
    users: () => client.request<User[]>({ url: '/api/admin/users', method: 'GET' }),
    devices: () => client.request<Device[]>({ url: '/api/admin/devices', method: 'GET' }),
    auditLog: () => client.request<AuditLog[]>({ url: '/api/admin/audit-log', method: 'GET' }),
    updateUserStatus: (userId: string, status: 'ACTIVE' | 'LOCKED') =>
      client.request<User>({ url: `/api/admin/users/${userId}/status`, method: 'PATCH', data: { status } }),
  };
}

export const adminApi = createAdminApi();
