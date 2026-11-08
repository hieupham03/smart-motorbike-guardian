import { deviceConfigPayload, deviceFormSnapshot, mergeDeviceForm } from '../deviceForm';
import type { Device } from '@/types/api';

describe('device metadata editing', () => {
  it('never sends thresholds for a hardware metadata save', () => {
    expect(deviceConfigPayload('HARDWARE', { name: ' New ', speedThresholdKmh: '80', tiltThresholdDeg: 'bad' })).toEqual({ name: 'New', licensePlate: undefined, vehicleModel: undefined });
  });
  it('validates simulator thresholds and includes supported values', () => {
    expect(deviceConfigPayload('SIMULATED', { name: 'S', speedThresholdKmh: '3', batteryLowThresholdV: '11.5' })).toMatchObject({ speedThresholdKmh: 3, batteryLowThresholdV: 11.5 });
    expect(() => deviceConfigPayload('SIMULATED', { speedThresholdKmh: '-1' })).toThrow();
  });
  it('retains typed fields across live telemetry but refreshes untouched metadata', () => {
    const current = { name: 'Unsaved edit', licensePlate: 'Old' };
    expect(mergeDeviceForm(current, { name: 'Server name', licensePlate: 'New' }, new Set(['name']))).toEqual({ name: 'Unsaved edit', licensePlate: 'New' });
    expect(mergeDeviceForm(current, current, new Set())).toBe(current);
  });
  it('initializes all fields and represents absent thresholds as empty', () => {
    expect(deviceFormSnapshot({ name: 'Bike' } as Device)).toMatchObject({ name: 'Bike', speedThresholdKmh: '', licensePlate: '' });
  });
});
