import { isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';

type NotificationsModule = typeof import('expo-notifications');
let modulePromise: Promise<NotificationsModule | null> | undefined;

// Importing SDK 58 notifications itself requires native modules absent in Expo Go.
// A platform check after a static import cannot protect auth/app startup.
export async function loadNativeNotifications(): Promise<NotificationsModule | null> {
  if ((Platform.OS !== 'android' && Platform.OS !== 'ios') || isRunningInExpoGo()) return null;
  // Metro evaluates this require only after the runtime guard above has passed.
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- This native SDK must not load at module initialization in Expo Go.
  modulePromise ??= Promise.resolve().then(() => require('expo-notifications') as NotificationsModule).catch(() => {
    console.warn('Native push unavailable. Rebuild the development/native app to enable notifications.');
    return null;
  });
  return modulePromise;
}
