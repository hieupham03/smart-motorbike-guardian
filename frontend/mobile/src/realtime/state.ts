import type { Device, DeviceAlert, DeviceCommand, Telemetry, WheelSession } from '@/types/api';

function eventTime(item: { receivedAt?: string; createdAt?: string; issuedAt?: string; ts?: number }) {
  const iso = item.receivedAt ?? item.createdAt ?? item.issuedAt;
  const parsed = iso ? Date.parse(iso) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : (item.ts ?? 0) * 1000;
}

export function mergeReadings(oldRows: Telemetry[] = [], incoming: Telemetry[] = []) {
  const rows = new Map(oldRows.map((row) => [row.readingId, row]));
  incoming.forEach((row) => rows.set(row.readingId, row));
  return [...rows.values()].sort((a, b) => eventTime(a) - eventTime(b)).slice(-300);
}

export function mergeCommands(oldRows: DeviceCommand[] = [], incoming: DeviceCommand[] = []) {
  const rows = new Map(oldRows.map((row) => [row.cmdId, row]));
  incoming.forEach((row) => {
    const previous = rows.get(row.cmdId);
    if (previous && previous.status !== 'PENDING' && row.status === 'PENDING') return;
    if (previous?.lateAckAt && !row.lateAckAt) return;
    rows.set(row.cmdId, row);
  });
  return [...rows.values()].sort((a, b) => eventTime(b) - eventTime(a)).slice(0, 100);
}

export function mergeAlerts(oldRows: DeviceAlert[] = [], incoming: DeviceAlert[] = []) {
  const rows = new Map(oldRows.map((row) => [row.alertId, row]));
  incoming.forEach((row) => rows.set(row.alertId, row));
  return [...rows.values()].sort((a, b) => eventTime(b) - eventTime(a));
}

export function liveDeviceView(device: Device | null | undefined, now = Date.now()) {
  if (!device) return null;
  const age = device.lastTelemetryAt ? now - Date.parse(device.lastTelemetryAt) : Number.POSITIVE_INFINITY;
  const fresh = age >= -1_000 && age <= 5_000 && device.lifecycleState === 'ACTIVE';
  return {
    ...device,
    sensorConnected: Boolean(fresh && device.sensorConnected),
    speedValid: Boolean(fresh && device.speedValid),
    imuValid: Boolean(fresh && device.imuValid),
    gpsValid: Boolean(fresh && device.gpsValid && device.gpsAgeMs != null && device.gpsAgeMs + Math.max(0, age) <= 5_000),
  };
}

export function mergeDeviceSnapshot(
  incoming: Device[], current: Device[] = [], revisionsAtStart: Map<string, number>,
  revisionsNow: Map<string, number>, revoked: Set<string>,
) {
  const existing = new Map(current.map((device) => [device.deviceId, device]));
  const rows = new Map<string, Device>();
  const newer = (id: string) => (revisionsNow.get(id) ?? 0) > (revisionsAtStart.get(id) ?? 0);
  incoming.forEach((device) => {
    if (newer(device.deviceId) && revoked.has(device.deviceId)) return;
    rows.set(device.deviceId, newer(device.deviceId) ? existing.get(device.deviceId) ?? device : device);
    if (!newer(device.deviceId)) revoked.delete(device.deviceId); // An authoritative, newly requested snapshot restores access.
  });
  current.forEach((device) => {
    if (newer(device.deviceId) && !revoked.has(device.deviceId)) rows.set(device.deviceId, device);
  });
  return [...rows.values()];
}

export function mergeWheelSession(old: WheelSession | null | undefined, incoming: WheelSession | null) {
  if (!old || !incoming) return incoming;
  if (eventTime(incoming) < eventTime(old)) return old;
  if (old.sessionId.slice(0, 8) === incoming.sessionId.slice(0, 8)) {
    const delta = (incoming.sequence - old.sequence) >>> 0;
    if (delta === 0) return incoming.fresh === false ? { ...old, fresh: false } : old;
    if (delta >= 0x80000000) return old;
  }
  return incoming;
}

export function liveWheelSession(session: WheelSession | null | undefined, device: ReturnType<typeof liveDeviceView>, now = Date.now()) {
  if (!session || !device || device.dataSource !== 'HARDWARE') return null;
  const age = now - Date.parse(session.receivedAt);
  return { ...session, fresh: Boolean(session.fresh && device.sensorConnected && age >= -1000 && age <= 5000) };
}
