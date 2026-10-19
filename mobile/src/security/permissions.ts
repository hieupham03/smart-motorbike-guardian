import type { AccountRole } from '@/types/api';

export function canControlDevice(role: AccountRole | null | undefined) {
  return role === 'OWNER' || role === 'ADMIN';
}

export function canAcknowledgeAlert(role: AccountRole | null | undefined) {
  return role === 'OWNER' || role === 'VIEWER' || role === 'ADMIN';
}

export const canResolveAlert = canControlDevice;
