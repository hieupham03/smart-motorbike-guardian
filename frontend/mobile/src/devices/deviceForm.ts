import type { DataSource, Device, DeviceConfigRequest } from '@/types/api';

export type DeviceForm = Record<string, string>;
export const thresholdFields = ['speedThresholdKmh', 'batteryLowThresholdV', 'tiltThresholdDeg'];
export function deviceFormSnapshot(device: Device): DeviceForm {
  return { name: device.name ?? '', licensePlate: device.licensePlate ?? '', vehicleModel: device.vehicleModel ?? '',
    speedThresholdKmh: String(device.speedThresholdKmh ?? ''), batteryLowThresholdV: String(device.batteryLowThresholdV ?? ''), tiltThresholdDeg: String(device.tiltThresholdDeg ?? '') };
}
export function mergeDeviceForm(current: DeviceForm, snapshot: DeviceForm, dirty: ReadonlySet<string>): DeviceForm {
  const next = { ...current };
  let changed = false;
  Object.entries(snapshot).forEach(([key, value]) => {
    if (!dirty.has(key) && next[key] !== value) { next[key] = value; changed = true; }
  });
  return changed ? next : current;
}
export function deviceConfigPayload(source: DataSource, form: DeviceForm): DeviceConfigRequest {
  const payload: DeviceConfigRequest = { name: form.name?.trim(), licensePlate: form.licensePlate?.trim(), vehicleModel: form.vehicleModel?.trim() };
  if (source !== 'SIMULATED') return payload;
  for (const key of thresholdFields) {
    const text = form[key]?.trim();
    if (!text) continue;
    const value = Number(text);
    if (!Number.isFinite(value) || value < 0) throw new Error('Các ngưỡng phải là số không âm.');
    (payload as Record<string, unknown>)[key] = value;
  }
  return payload;
}
