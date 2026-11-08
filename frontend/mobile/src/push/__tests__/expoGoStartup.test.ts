/* eslint-disable @typescript-eslint/no-require-imports -- Load actual entry modules only after resetting the runtime and installing native-module mocks. */
// Simulate the native runtime from the reported stack: importing expo-notifications
// immediately throws because ExpoTopicSubscriptionModule is absent.
const missingNativeModule = jest.fn(() => {
  throw new Error("Cannot find native module 'ExpoTopicSubscriptionModule'");
});

beforeEach(() => {
  jest.resetModules();
  missingNativeModule.mockClear();
  jest.doMock('expo', () => ({ isRunningInExpoGo: () => true }));
  jest.doMock('expo-notifications', () => missingNativeModule());
  jest.doMock('expo-router', () => ({ useRouter: jest.fn() }));
  jest.doMock('@/devices/GuardianContext', () => ({ useGuardian: jest.fn() }));
  jest.doMock('@/api/push.api', () => ({ pushApi: { register: jest.fn(), unregister: jest.fn() } }));
  jest.doMock('@/storage/tokenStore', () => ({ tokenStore: { getGeneration: jest.fn(), getSession: jest.fn() } }));
  jest.doMock('@react-native-async-storage/async-storage', () => ({ getItem: jest.fn(), setItem: jest.fn() }));
  const { Platform } = require('react-native');
  jest.replaceProperty(Platform, 'OS', 'android');
});
afterEach(() => jest.restoreAllMocks());

it('loads the auth registration dependency and skips push in Expo Go without importing native notifications', async () => {
  const { registerForPush } = require('../registration');
  expect(await registerForPush()).toBe(false);
  expect(missingNativeModule).not.toHaveBeenCalled();
});

it('loads NotificationBridge in Expo Go without importing the missing native module', () => {
  expect(() => require('../NotificationBridge')).not.toThrow();
  expect(missingNativeModule).not.toHaveBeenCalled();
});

it('keeps an outdated native build usable when its push module is missing', async () => {
  jest.doMock('expo', () => ({ isRunningInExpoGo: () => false }));
  const warning = jest.spyOn(console, 'warn').mockImplementation(() => {});
  const { registerForPush } = require('../registration');
  expect(await registerForPush()).toBe(false);
  expect(await registerForPush()).toBe(false);
  expect(missingNativeModule).toHaveBeenCalledTimes(1);
  expect(warning).toHaveBeenCalledTimes(1);
});
