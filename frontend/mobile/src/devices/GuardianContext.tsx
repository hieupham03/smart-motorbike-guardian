import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AppState } from 'react-native';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { devicesApi } from '@/api/devices.api';
import { controlApi } from '@/api/control.api';
import { queryKeys } from '@/api/queryKeys';
import { useAuth } from '@/auth/AuthContext';
import { connectRealtime, type RealtimeStatus } from '@/realtime/client';
import { liveDeviceView, liveWheelSession, mergeWheelSession, mergeAlerts, mergeCommands, mergeDeviceSnapshot, mergeReadings } from '@/realtime/state';
import type { RealtimeEvent } from '@/realtime/types';
import type { CommandRequest, Device, DeviceAlert, DeviceCommand, Telemetry, WheelSession } from '@/types/api';

interface GuardianContextValue {
  devices: Device[];
  selectedDevice: ReturnType<typeof liveDeviceView>;
  selectedDeviceId: string | null;
  selectDevice(deviceId: string): void;
  telemetry: Telemetry | null;
  wheelSession: WheelSession | null;
  liveHistory: Telemetry[];
  commands: DeviceCommand[];
  alerts: DeviceAlert[];
  realtimeStatus: RealtimeStatus;
  loading: boolean;
  error: string | null;
  commandPending: boolean;
  refresh(): Promise<void>;
  sendCommand(request: CommandRequest): Promise<DeviceCommand>;
  acknowledgeAlert(alertId: string): Promise<void>;
  resolveAlert(alertId: string, actionTaken: string): Promise<void>;
}

const GuardianContext = createContext<GuardianContextValue | null>(null);

export function GuardianProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.userId ?? '';
  const queryClient = useQueryClient();
  const deviceRevisions = useRef(new Map<string, number>());
  const telemetryRevisions = useRef(new Map<string, number>());
  const commandRevisions = useRef(new Map<string, number>());
  const wheelRevisions = useRef(new Map<string, number>());
  const alertsRevision = useRef(0);
  const revoked = useRef(new Set<string>());
  const [preferredDeviceId, setPreferredDeviceId] = useState<string | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeStatus>('DISCONNECTED');
  const [now, setNow] = useState(0);
  const [commandPending, setCommandPending] = useState(false);
  const [foreground, setForeground] = useState(AppState.currentState !== 'background');

  const devicesQuery = useQuery({
    queryKey: queryKeys.devices(userId),
    enabled: !!userId,
    queryFn: async () => {
      const started = new Map(deviceRevisions.current);
      const response = await devicesApi.list();
      const current = queryClient.getQueryData<Device[]>(queryKeys.devices(userId));
      return mergeDeviceSnapshot(response.data ?? [], current, started, deviceRevisions.current, revoked.current);
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
      const revision = telemetryRevisions.current.get(deviceId) ?? 0;
      const response = await devicesApi.latestTelemetry(deviceId);
      if (revoked.current.has(deviceId)) return null;
      if ((telemetryRevisions.current.get(deviceId) ?? 0) > revision) {
        return queryClient.getQueryData<Telemetry | null>(queryKeys.latestTelemetry(userId, deviceId)) ?? null;
      }
      return response.data;
    },
  });

  const wheelQuery = useQuery({
    queryKey: queryKeys.wheelSession(userId, selectedDeviceId ?? ''),
    enabled: !!userId && !!selectedDeviceId && devices.some((device) => device.deviceId === selectedDeviceId && device.dataSource === 'HARDWARE'),
    queryFn: async () => {
      const id = selectedDeviceId!;
      const revision = wheelRevisions.current.get(id) ?? 0;
      const response = await devicesApi.wheelSession(id);
      if (revoked.current.has(id)) return null;
      const current = queryClient.getQueryData<WheelSession | null>(queryKeys.wheelSession(userId, id));
      return (wheelRevisions.current.get(id) ?? 0) > revision ? mergeWheelSession(response.data, current ?? null) : response.data;
    },
  });

  const historyQuery = useQuery({
    queryKey: queryKeys.liveHistory(userId, selectedDeviceId ?? ''),
    enabled: !!userId && !!selectedDeviceId,
    queryFn: async () => {
      const deviceId = selectedDeviceId!;
      const revision = telemetryRevisions.current.get(deviceId) ?? 0;
      const to = Math.floor(Date.now() / 1000);
      const response = await devicesApi.telemetryHistory(deviceId, to - 300, to, 0, 300);
      if (revoked.current.has(deviceId)) return [];
      const current = queryClient.getQueryData<Telemetry[]>(queryKeys.liveHistory(userId, deviceId)) ?? [];
      return (telemetryRevisions.current.get(deviceId) ?? 0) > revision
        ? mergeReadings(response.data ?? [], current)
        : mergeReadings([], response.data ?? []);
    },
  });

  const commandsQuery = useQuery({
    queryKey: queryKeys.commands(userId, selectedDeviceId ?? ''),
    enabled: !!userId && !!selectedDeviceId,
    queryFn: async () => {
      const deviceId = selectedDeviceId!;
      const revision = commandRevisions.current.get(deviceId) ?? 0;
      const response = await controlApi.commands(deviceId);
      if (revoked.current.has(deviceId)) return [];
      const current = queryClient.getQueryData<DeviceCommand[]>(queryKeys.commands(userId, deviceId)) ?? [];
      return (commandRevisions.current.get(deviceId) ?? 0) > revision
        ? mergeCommands(response.data ?? [], current)
        : mergeCommands([], response.data ?? []);
    },
  });

  const alertsQuery = useQuery({
    queryKey: queryKeys.alerts(userId),
    enabled: !!userId,
    queryFn: async () => {
      const revision = alertsRevision.current;
      const response = await controlApi.alerts();
      const current = queryClient.getQueryData<DeviceAlert[]>(queryKeys.alerts(userId)) ?? [];
      const incoming = (response.data ?? []).filter((alert) => !revoked.current.has(alert.deviceId));
      return alertsRevision.current > revision ? mergeAlerts(incoming, current) : mergeAlerts([], incoming);
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
    if (event.type === 'ACCESS_REMOVED') {
      deviceRevisions.current.set(event.deviceId, (deviceRevisions.current.get(event.deviceId) ?? 0) + 1);
      telemetryRevisions.current.set(event.deviceId, (telemetryRevisions.current.get(event.deviceId) ?? 0) + 1);
      commandRevisions.current.set(event.deviceId, (commandRevisions.current.get(event.deviceId) ?? 0) + 1);
      wheelRevisions.current.set(event.deviceId, (wheelRevisions.current.get(event.deviceId) ?? 0) + 1);
      alertsRevision.current += 1;
      removeDeviceCache(event.deviceId);
      return;
    }
    if (event.type !== 'DEVICE' && revoked.current.has(event.deviceId)) return;
    if (event.type === 'DEVICE') {
      deviceRevisions.current.set(event.deviceId, (deviceRevisions.current.get(event.deviceId) ?? 0) + 1);
      revoked.current.delete(event.deviceId);
      queryClient.setQueryData<Device[]>(queryKeys.devices(userId), (old = []) => {
        const found = old.some((device) => device.deviceId === event.deviceId);
        return found
          ? old.map((device) => device.deviceId === event.deviceId ? { ...device, ...event.data } : device)
          : [...old, event.data];
      });
    } else if (event.type === 'WHEEL_SESSION') {
      wheelRevisions.current.set(event.deviceId, (wheelRevisions.current.get(event.deviceId) ?? 0) + 1);
      queryClient.setQueryData<WheelSession | null>(queryKeys.wheelSession(userId, event.deviceId), (old) => mergeWheelSession(old, event.data));
    } else if (event.type === 'TELEMETRY') {
      telemetryRevisions.current.set(event.deviceId, (telemetryRevisions.current.get(event.deviceId) ?? 0) + 1);
      queryClient.setQueryData(queryKeys.latestTelemetry(userId, event.deviceId), event.data);
      queryClient.setQueryData<Telemetry[]>(queryKeys.liveHistory(userId, event.deviceId), (old = []) => mergeReadings(old, [event.data]));
    } else if (event.type === 'COMMAND') {
      commandRevisions.current.set(event.deviceId, (commandRevisions.current.get(event.deviceId) ?? 0) + 1);
      queryClient.setQueryData<DeviceCommand[]>(queryKeys.commands(userId, event.deviceId), (old = []) => mergeCommands(old, [event.data]));
    } else if (event.type === 'ALERT') {
      alertsRevision.current += 1;
      queryClient.setQueryData<DeviceAlert[]>(queryKeys.alerts(userId), (old = []) => mergeAlerts(old, [event.data]));
    }
  }, [queryClient, removeDeviceCache, userId]);

  const sendCommand = useCallback(async (request: CommandRequest) => {
    if (!selectedDeviceId) throw new Error('Chưa chọn thiết bị');
    setCommandPending(true);
    try {
      const response = await controlApi.sendCommand(selectedDeviceId, request);
      queryClient.setQueryData<DeviceCommand[]>(queryKeys.commands(userId, selectedDeviceId), (old = []) => mergeCommands(old, [response.data]));
      return response.data;
    } finally {
      setCommandPending(false);
    }
  }, [queryClient, selectedDeviceId, userId]);

  const acknowledgeAlert = useCallback(async (alertId: string) => {
    const response = await controlApi.acknowledgeAlert(alertId);
    alertsRevision.current += 1;
    queryClient.setQueryData<DeviceAlert[]>(queryKeys.alerts(userId), (old = []) => mergeAlerts(old, [response.data]));
  }, [queryClient, userId]);

  const resolveAlert = useCallback(async (alertId: string, actionTaken: string) => {
    const response = await controlApi.resolveAlert(alertId, actionTaken);
    alertsRevision.current += 1;
    queryClient.setQueryData<DeviceAlert[]>(queryKeys.alerts(userId), (old = []) => mergeAlerts(old, [response.data]));
  }, [queryClient, userId]);

  const refresh = useCallback(async () => {
    if (!userId) return;
    await queryClient.invalidateQueries({ queryKey: ['account', userId] });
  }, [queryClient, userId]);

  useEffect(() => {
    if (!userId) return;
    const deviceRevisionsForSession = deviceRevisions.current;
    const telemetryRevisionsForSession = telemetryRevisions.current;
    const commandRevisionsForSession = commandRevisions.current;
    const revokedForSession = revoked.current;
    const wheelRevisionsForSession = wheelRevisions.current;
    let active = true;
    const disconnect = connectRealtime({
      onEvent: (event) => { if (active) handleEvent(event); },
      onStatus: (status) => { if (active) setRealtimeStatus(status); },
      onConnected: () => { if (active) void refresh(); },
    });
    const subscription = AppState.addEventListener('change', (state) => {
      setForeground(state === 'active');
      if (state === 'active') void refresh();
    });
    return () => {
      active = false;
      subscription.remove();
      disconnect();
      deviceRevisionsForSession.clear();
      telemetryRevisionsForSession.clear();
      commandRevisionsForSession.clear();
      wheelRevisionsForSession.clear();
      revokedForSession.clear();
      alertsRevision.current = 0;
    };
  }, [handleEvent, refresh, userId]);

  const realtimeConnected = realtimeStatus === 'CONNECTED';
  useEffect(() => {
    if (!userId || !foreground || realtimeConnected) return;
    const timer = setInterval(() => { void refresh(); }, 5_000);
    return () => clearInterval(timer);
  }, [userId, foreground, realtimeConnected, refresh]);

  const selectedSnapshot = devices.find((device) => device.deviceId === selectedDeviceId) ?? devices[0] ?? null;
  const selectedDevice = liveDeviceView(selectedSnapshot, now);
  const value = useMemo<GuardianContextValue>(() => ({
    devices,
    selectedDevice,
    selectedDeviceId: selectedDevice?.deviceId ?? null,
    selectDevice,
    telemetry: telemetryQuery.data ?? null,
    wheelSession: liveWheelSession(wheelQuery.data, selectedDevice, now),
    liveHistory: historyQuery.data ?? [],
    commands: commandsQuery.data ?? [],
    alerts: alertsQuery.data ?? [],
    realtimeStatus,
    loading: devicesQuery.isLoading,
    error: devicesQuery.error instanceof Error ? devicesQuery.error.message : null,
    commandPending,
    refresh,
    sendCommand,
    acknowledgeAlert,
    resolveAlert,
  }), [devices, selectedDevice, selectDevice, telemetryQuery.data, wheelQuery.data, now, historyQuery.data, commandsQuery.data, alertsQuery.data, realtimeStatus, devicesQuery.isLoading, devicesQuery.error, commandPending, refresh, sendCommand, acknowledgeAlert, resolveAlert]);

  return <GuardianContext.Provider value={value}>{children}</GuardianContext.Provider>;
}

export function useGuardian() {
  const value = useContext(GuardianContext);
  if (!value) throw new Error('useGuardian must be used inside GuardianProvider');
  return value;
}
