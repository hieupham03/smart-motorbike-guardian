import { liveDeviceView, mergeCommands, mergeDeviceSnapshot, mergeReadings } from '../state';
import type { Device, DeviceCommand, Telemetry } from '@/types/api';

const reading = (id: string, ts: number): Telemetry => ({
  readingId: id, deviceId: 'd', dataSource: 'HARDWARE', sensorConnected: true,
  imuValid: true, speedValid: true, gpsValid: false, gpsAgeMs: null,
  deviceUptimeS: ts, receivedAt: new Date(ts * 1000).toISOString(), speedKmh: null,
  batteryV: null, accelX: null, accelY: null, accelZ: null, latitude: null,
  longitude: null, state: 'PARKED', ts,
});

const command = (status: DeviceCommand['status'], lateAckAt: string | null = null): DeviceCommand => ({
  cmdId: 'c', deviceId: 'd', type: 'ARM', status, payload: null,
  reasonIfFailed: null, issuedByEmail: 'owner@example.com', issuedByName: 'Owner',
  issuedAt: '2026-10-18T00:00:00Z', ackAt: null, lateAckResult: null,
  lateAckReason: null, lateAckAt,
});

const device = (): Device => ({
  deviceId: 'd', deviceUuid: 'uuid', name: 'Xe', licensePlate: null, vehicleModel: null,
  lifecycleState: 'ACTIVE', securityState: 'PARKED', firmwareVersion: null, hwVersion: null,
  dataSource: 'HARDWARE', sensorConnected: true, imuValid: true, speedValid: true,
  gpsValid: true, gpsAgeMs: 4_000, lastTelemetryAt: '2026-10-18T00:00:00Z',
  lastLocationReceivedAt: null, lastSpeedKmh: null, lastBatteryV: null,
  lastLatitude: 0, lastLongitude: 0, speedThresholdKmh: null,
  batteryLowThresholdV: null, tiltThresholdDeg: null, lastSeenAt: null,
  createdAt: '2026-10-18T00:00:00Z', currentUserRole: 'OWNER',
});

describe('realtime state helpers', () => {
  it('keeps only the newest 300 deduplicated readings', () => {
    const rows = mergeReadings([], Array.from({ length: 310 }, (_, index) => reading(String(index), index)));
    expect(rows).toHaveLength(300);
    expect(rows[0]?.readingId).toBe('10');
  });
  it('does not revert terminal command state to PENDING', () => {
    expect(mergeCommands([command('EXECUTED')], [command('PENDING')])[0]?.status).toBe('EXECUTED');
  });
  it('preserves late ACK evidence from an older history snapshot', () => {
    const lateAt = '2026-10-18T00:00:20Z';
    expect(mergeCommands([command('TIMEOUT', lateAt)], [command('TIMEOUT')])[0]?.lateAckAt).toBe(lateAt);
  });
  it('expires GPS using gateway age plus time elapsed on the client', () => {
    const now = Date.parse('2026-10-18T00:00:02Z');
    expect(liveDeviceView(device(), now)?.gpsValid).toBe(false);
    expect(liveDeviceView(device(), now + 6_000)?.sensorConnected).toBe(false);
  });
  it('keeps a live device update when an older snapshot returns', () => {
    const live = { ...device(), securityState: 'ALARM' as const };
    const result = mergeDeviceSnapshot([device()], [live], new Map([['d', 0]]), new Map([['d', 1]]), new Set());
    expect(result[0]?.securityState).toBe('ALARM');
  });
  it('filters a revoked device from a snapshot', () => {
    expect(mergeDeviceSnapshot([device()], [], new Map(), new Map(), new Set(['d']))).toEqual([]);
  });
});
