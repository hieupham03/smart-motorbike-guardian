import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';

import { useGuardian } from '@/devices/GuardianContext';
import { registerForPush } from './registration';
import { notificationRoute } from './routing';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

export function NotificationBridge() {
  const router = useRouter();
  const { devices, selectDevice } = useGuardian();
  const lastHandled = useRef<string | null>(null);
  const open = useCallback((response: Notifications.NotificationResponse | null) => {
    if (!response) return;
    const identifier = response.notification.request.identifier;
    if (lastHandled.current === identifier) return;
    const route = notificationRoute(response.notification.request.content.data ?? {});
    if (!route || !devices.some((device) => device.deviceId === route.deviceId)) return;
    lastHandled.current = identifier; selectDevice(route.deviceId); router.push(route.href);
  }, [devices, router, selectDevice]);
  useEffect(() => {
    void registerForPush().catch((error: unknown) => console.warn('Push registration unavailable:', error instanceof Error ? error.message : error));
  }, []);
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(open);
    void Notifications.getLastNotificationResponseAsync().then(open);
    return () => subscription.remove();
  }, [open]);
  return null;
}
