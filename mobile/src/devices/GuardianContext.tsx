import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AppState } from 'react-native';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { devicesApi } from '@/api/devices.api';
import { queryKeys } from '@/api/queryKeys';
import { useAuth } from '@/auth/AuthContext';
import { connectRealtime, type RealtimeStatus } from '@/realtime/client';
import { liveDeviceView, mergeCommands, mergeDeviceSnapshot, mergeReadings } from '@/realtime/state';
import type { RealtimeEvent } from '@/realtime/types';
import type { Device, DeviceAlert, DeviceCommand, Telemetry } from '@/types/api';

interface GuardianContextValue {
  devices: Device[];
  selectedDevice: ReturnType<typeof liveDeviceView>;
  selectedDeviceId: string | null;
  selectDevice(deviceId: string): void;
  telemetry: Telemetry | null;
  liveHistory: Telemetry[];
  commands: DeviceCommand[];
  alerts: DeviceAlert[];
  realtimeStatus: RealtimeStatus;
  loading: boolean;
  error: string | null;
  refresh(): Promise<void>;
}

const GuardianContext = createContext<GuardianContextValue | null>(null);

export function GuardianProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.userId ?? '';
  const queryClient = useQueryClient();
  const revisions = useRef(new Map<string, number>());
  const revoked = useRef(new Set<string>());
  const [preferredDeviceId, setPreferredDeviceId] = useState<string | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeStatus>('DISCONNECTED');
  const [now, setNow] = useState(0);

  const devicesQuery = useQuery({
    queryKey: queryKeys.devices(userId),
    enabled: !!userId,
    queryFn: async () => {
      const started = new Map(revisions.current);
      const response = await devicesApi.list();
      const current = queryClient.getQueryData<Device[]>(queryKeys.devices(userId));
      return mergeDeviceSnapshot(response.data ?? [], current, started, revisions.current, revoked.current);
    },
  });
  const devices = useMemo(() => devicesQuery.data ?? [], [devicesQuery.data]);
  const selectedDeviceId = devices.some((device) => device.deviceId === preferredDeviceId)
    ? preferredDeviceId
    : devices[0]?.deviceId ?? null;

  useEffect(() => {
    if (!userId) return;
    const key = `guardian.selected-device.${userId}`;
    void AsyncStorage.getItem(key).then((stored) => setPreferredDeviceId(stored));
  }, [userId]);

  const selectDevice = useCallback((deviceId: string) => {
    setPreferredDeviceId(deviceId);
    if (userId) void AsyncStorage.setItem(`guardian.selected-device.${userId}`, deviceId);
  }, [userId]);

  useEffect(() => {
    const initial = setTimeout(() => setNow(Date.now()), 0);
    const timer = setInterval(() => setNow(Date.now()), 1_000);
    return () => {
      clearTimeout(initial);
      clearInterval(timer);
    };
  }, []);

  const telemetryQuery = useQuery({
    queryKey: queryKeys.latestTelemetry(userId, selectedDeviceId ?? ''),
    enabled: !!userId && !!selectedDeviceId,
    queryFn: async () => {
      const deviceId = selectedDeviceId!;
      const revision = revisions.current.get(deviceId) ?? 0;
      const response = await devicesApi.latestTelemetry(deviceId);
      if ((revisions.current.get(deviceId) ?? 0) > revision) {
        return queryClient.getQueryData<Telemetry | null>(queryKeys.latestTelemetry(userId, deviceId)) ?? null;
      }
      return response.data;
    },
  });

  const historyQuery = useQuery({
    queryKey: queryKeys.liveHistory(userId, selectedDeviceId ?? ''),
    enabled: !!userId && !!selectedDeviceId,
    queryFn: async () => {
      const deviceId = selectedDeviceId!;
      const revision = revisions.current.get(deviceId) ?? 0;
      const to = Math.floor(Date.now() / 1000);
      const response = await devicesApi.telemetryHistory(deviceId, to - 300, to, 0, 300);
      const current = queryClient.getQueryData<Telemetry[]>(queryKeys.liveHistory(userId, deviceId)) ?? [];
      return (revisions.current.get(deviceId) ?? 0) > revision
        ? mergeReadings(response.data ?? [], current)
        : mergeReadings([], response.data ?? []);
    },
  });

  const removeDeviceCache = useCallback((deviceId: string) => {
    revoked.current.add(deviceId);
    queryClient.setQueryData<Device[]>(queryKeys.devices(userId), (old = []) => old.filter((device) => device.deviceId !== deviceId));
    queryClient.setQueryData<DeviceAlert[]>(queryKeys.alerts(userId), (old = []) => old.filter((alert) => alert.deviceId !== deviceId));
    queryClient.removeQueries({ predicate: (query) => query.queryKey.includes(deviceId) });
    setPreferredDeviceId((current) => (current === deviceId ? null : current));
  }, [queryClient, userId]);

  const handleEvent = useCallback((event: RealtimeEvent) => {
    revisions.current.set(event.deviceId, (revisions.current.get(event.deviceId) ?? 0) + 1);
    if (event.type === 'ACCESS_REMOVED') {
      removeDeviceCache(event.deviceId);
      return;
    }
    if (event.type === 'DEVICE') {
      revoked.current.delete(event.deviceId);
      queryClient.setQueryData<Device[]>(queryKeys.devices(userId), (old = []) => {
        const found = old.some((device) => device.deviceId === event.deviceId);
        return found
          ? old.map((device) => device.deviceId === event.deviceId ? { ...device, ...event.data } : device)
          : [...old, event.data];
      });
    } else if (event.type === 'TELEMETRY') {
      queryClient.setQueryData(queryKeys.latestTelemetry(userId, event.deviceId), event.data);
      queryClient.setQueryData<Telemetry[]>(queryKeys.liveHistory(userId, event.deviceId), (old = []) => mergeReadings(old, [event.data]));
    } else if (event.type === 'COMMAND') {
      queryClient.setQueryData<DeviceCommand[]>(queryKeys.commands(userId, event.deviceId), (old = []) => mergeCommands(old, [event.data]));
    } else if (event.type === 'ALERT') {
      queryClient.setQueryData<DeviceAlert[]>(queryKeys.alerts(userId), (old = []) =>
        [event.data, ...old.filter((alert) => alert.alertId !== event.data.alertId)]
          .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
      );
    }
  }, [queryClient, removeDeviceCache, userId]);

  const refresh = useCallback(async () => {
    if (!userId) return;
    await queryClient.invalidateQueries({ queryKey: ['account', userId] });
  }, [queryClient, userId]);

  useEffect(() => {
    if (!userId) return;
    const revisionsForSession = revisions.current;
    const revokedForSession = revoked.current;
    const disconnect = connectRealtime({
      onEvent: handleEvent,
      onStatus: setRealtimeStatus,
      onConnected: () => { void refresh(); },
    });
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refresh();
    });
    return () => {
      subscription.remove();
      disconnect();
      revisionsForSession.clear();
      revokedForSession.clear();
    };
  }, [handleEvent, refresh, userId]);

  const selectedSnapshot = devices.find((device) => device.deviceId === selectedDeviceId) ?? devices[0] ?? null;
  const selectedDevice = liveDeviceView(selectedSnapshot, now);
  const value = useMemo<GuardianContextValue>(() => ({
    devices,
    selectedDevice,
    selectedDeviceId: selectedDevice?.deviceId ?? null,
    selectDevice,
    telemetry: telemetryQuery.data ?? null,
    liveHistory: historyQuery.data ?? [],
    commands: [],
    alerts: [],
    realtimeStatus,
    loading: devicesQuery.isLoading,
    error: devicesQuery.error instanceof Error ? devicesQuery.error.message : null,
    refresh,
  }), [devices, selectedDevice, selectDevice, telemetryQuery.data, historyQuery.data, realtimeStatus, devicesQuery.isLoading, devicesQuery.error, refresh]);

  return <GuardianContext.Provider value={value}>{children}</GuardianContext.Provider>;
}

export function useGuardian() {
  const value = useContext(GuardianContext);
  if (!value) throw new Error('useGuardian must be used inside GuardianProvider');
  return value;
}
