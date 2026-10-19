import { notificationRoute } from '../routing';

describe('notificationRoute', () => {
  it('routes supported payloads with a device id', () => {
    expect(notificationRoute({ type: 'ALERT', deviceId: 'd1' })).toEqual({ deviceId: 'd1', href: '/(app)/(tabs)/alerts' });
    expect(notificationRoute({ type: 'COMMAND', deviceId: 'd1' })?.href).toBe('/(app)/(tabs)/control');
    expect(notificationRoute({ type: 'DEVICE_OFFLINE', deviceId: 'd1' })?.href).toBe('/(app)/(tabs)');
  });
  it('rejects untrusted or incomplete payloads', () => {
    expect(notificationRoute({ type: 'ALERT' })).toBeNull();
    expect(notificationRoute({ type: 'UNKNOWN', deviceId: 'd1' })).toBeNull();
  });
});
