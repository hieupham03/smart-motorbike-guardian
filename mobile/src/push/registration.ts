import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';

import { pushApi } from '@/api/push.api';

const INSTALLATION_KEY = 'guardian.push.installation.v1';

async function installationId() {
  const existing = await AsyncStorage.getItem(INSTALLATION_KEY);
  if (existing) return existing;
  const created = `install-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  await AsyncStorage.setItem(INSTALLATION_KEY, created);
  return created;
}

export async function registerForPush() {
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') return false;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('guardian-alerts', {
      name: 'Guardian alerts', importance: AndroidImportance.HIGH,
    });
  }
  const current = await Notifications.getPermissionsAsync();
  const permission = current.status === 'granted' ? current : await Notifications.requestPermissionsAsync();
  if (permission.status !== 'granted') return false;
  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  const token = (await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined)).data;
  await pushApi.register({ token, platform: Platform.OS, installationId: await installationId() });
  return true;
}

export async function unregisterCurrentInstallation() {
  const id = await AsyncStorage.getItem(INSTALLATION_KEY);
  if (id) await pushApi.unregister(id);
}
