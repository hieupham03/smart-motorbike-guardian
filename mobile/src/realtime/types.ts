import type { Device, DeviceAlert, DeviceCommand, Telemetry } from '@/types/api';

export type RealtimeEvent =
  | { type: 'DEVICE'; deviceId: string; data: Device; sentAt: string }
  | { type: 'TELEMETRY'; deviceId: string; data: Telemetry; sentAt: string }
  | { type: 'COMMAND'; deviceId: string; data: DeviceCommand; sentAt: string }
  | { type: 'ALERT'; deviceId: string; data: DeviceAlert; sentAt: string }
  | { type: 'ACCESS_REMOVED'; deviceId: string; data: { deviceId: string }; sentAt: string };
