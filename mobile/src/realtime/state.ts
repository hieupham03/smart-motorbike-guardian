import type { Device, DeviceCommand, Telemetry } from '@/types/api';

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
  return incoming
    .filter((device) => !revoked.has(device.deviceId))
    .map((device) =>
      (revisionsNow.get(device.deviceId) ?? 0) > (revisionsAtStart.get(device.deviceId) ?? 0)
        ? existing.get(device.deviceId) ?? device
        : device,
    );
}
