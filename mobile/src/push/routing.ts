export interface NotificationData { type?: unknown; deviceId?: unknown; alertId?: unknown; cmdId?: unknown }

export function notificationRoute(data: NotificationData) {
  if (typeof data.deviceId !== 'string' || !data.deviceId) return null;
  if (data.type === 'ALERT') return { deviceId: data.deviceId, href: '/(app)/(tabs)/alerts' as const };
  if (data.type === 'COMMAND') return { deviceId: data.deviceId, href: '/(app)/(tabs)/control' as const };
  if (data.type === 'DEVICE_OFFLINE') return { deviceId: data.deviceId, href: '/(app)/(tabs)' as const };
  return null;
}
