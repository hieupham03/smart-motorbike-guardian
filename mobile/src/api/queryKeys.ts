export const queryKeys = {
  devices: (userId: string) => ['account', userId, 'devices'] as const,
  device: (userId: string, deviceId: string) => ['account', userId, 'device', deviceId] as const,
  latestTelemetry: (userId: string, deviceId: string) => ['account', userId, 'telemetry', deviceId, 'latest'] as const,
  liveHistory: (userId: string, deviceId: string) => ['account', userId, 'telemetry', deviceId, 'live'] as const,
  telemetryHistory: (userId: string, deviceId: string, from?: number, to?: number) => ['account', userId, 'telemetry', deviceId, 'history', from, to] as const,
  commands: (userId: string, deviceId: string) => ['account', userId, 'commands', deviceId] as const,
  alerts: (userId: string) => ['account', userId, 'alerts'] as const,
};
