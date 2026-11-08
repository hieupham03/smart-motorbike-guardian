import type { NotificationResponse } from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';

import { useGuardian } from '@/devices/GuardianContext';
import { registerForPush } from './registration';
import { notificationRoute } from './routing';
import { loadNativeNotifications } from './nativeNotifications';

export function NotificationBridge() {
  const router = useRouter();
  const { devices, selectDevice } = useGuardian();
  const lastHandled = useRef<string | null>(null);
  const open = useCallback((response: NotificationResponse | null) => {
    if (!response) return;
    const identifier = response.notification.request.identifier;
    if (lastHandled.current === identifier) return;
    const route = notificationRoute(response.notification.request.content.data ?? {});
    if (!route || !devices.some((device) => device.deviceId === route.deviceId)) return;
    lastHandled.current = identifier; selectDevice(route.deviceId); router.push(route.href);
  }, [devices, router, selectDevice]);
  useEffect(() => {
    let active = true;
    void loadNativeNotifications().then(async (notifications) => {
      if (!active || !notifications) return;
      notifications.setNotificationHandler({
        handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
      });
      await registerForPush();
    }).catch((error: unknown) => console.warn('Push registration unavailable:', error instanceof Error ? error.message : error));
    return () => { active = false; };
  }, []);
  useEffect(() => {
    let active = true;
    let subscription: { remove(): void } | undefined;
    void loadNativeNotifications().then(async (notifications) => {
      if (!active || !notifications) return;
      subscription = notifications.addNotificationResponseReceivedListener((response) => { if (active) open(response); });
      const response = await notifications.getLastNotificationResponseAsync();
      if (active) open(response);
    }).catch(() => {
      // Notification APIs can be unavailable in Expo Go or before native initialization.
    });
    return () => { active = false; subscription?.remove(); };
  }, [open]);
  return null;
}
