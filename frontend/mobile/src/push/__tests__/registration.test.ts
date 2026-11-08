import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { pushApi } from '@/api/push.api';
import { tokenStore } from '@/storage/tokenStore';
import { registerForPush } from '../registration';

jest.mock('@react-native-async-storage/async-storage', () => ({ getItem: jest.fn(), setItem: jest.fn() }));
jest.mock('expo-constants', () => ({ expoConfig: { extra: { eas: { projectId: 'local-test-project' } } } }));
jest.mock('expo', () => ({ isRunningInExpoGo: () => false }));
jest.mock('expo-notifications', () => ({
  AndroidImportance: { HIGH: 4 },
  setNotificationChannelAsync: jest.fn(), getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(), getExpoPushTokenAsync: jest.fn(),
}));
jest.mock('@/api/push.api', () => ({ pushApi: { register: jest.fn() } }));
jest.mock('@/storage/tokenStore', () => ({ tokenStore: { getGeneration: jest.fn(), getSession: jest.fn() } }));

beforeEach(() => {
  jest.clearAllMocks();
  jest.replaceProperty(Platform, 'OS', 'android');
  (tokenStore.getGeneration as jest.Mock).mockReturnValue(1);
  (tokenStore.getSession as jest.Mock).mockReturnValue({ user: { userId: 'owner' } });
  (AsyncStorage.getItem as jest.Mock).mockResolvedValue('local-installation');
  (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
  (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({ data: 'ExponentPushToken[local-test]' });
});
afterEach(() => jest.restoreAllMocks());

it('does not call native notification APIs on web', async () => {
  jest.replaceProperty(Platform, 'OS', 'web');
  expect(await registerForPush()).toBe(false);
  expect(Notifications.getPermissionsAsync).not.toHaveBeenCalled();
  expect(pushApi.register).not.toHaveBeenCalled();
});

it('does not register when notification permission is denied', async () => {
  (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });
  (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });
  expect(await registerForPush()).toBe(false);
  expect(Notifications.getExpoPushTokenAsync).not.toHaveBeenCalled();
  expect(pushApi.register).not.toHaveBeenCalled();
});

it('registers the installation and token for the current native session', async () => {
  expect(await registerForPush()).toBe(true);
  expect(pushApi.register).toHaveBeenCalledWith({
    token: 'ExponentPushToken[local-test]', platform: 'android', installationId: 'local-installation',
  });
});

it('discards registration if the account changes while reading installation storage', async () => {
  (AsyncStorage.getItem as jest.Mock).mockImplementation(async () => {
    (tokenStore.getGeneration as jest.Mock).mockReturnValue(2);
    return 'local-installation';
  });
  expect(await registerForPush()).toBe(false);
  expect(pushApi.register).not.toHaveBeenCalled();
});
