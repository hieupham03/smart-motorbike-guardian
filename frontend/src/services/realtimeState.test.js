import test from 'node:test';
import assert from 'node:assert/strict';
import { initialRealtimeState, realtimeReducer as reduce, mergeReadings, mergeCommands, liveDeviceView } from './realtimeState.js';
test('slower PENDING response does not overwrite executed ACK', () => {
  const rows = mergeCommands([{ cmdId: 'a', status: 'EXECUTED' }], [{ cmdId: 'a', status: 'PENDING' }]);
  assert.equal(rows[0].status, 'EXECUTED');
});
test('late ACK evidence survives older history snapshot', () => {
  const rows = mergeCommands([{ cmdId: 'a', status: 'TIMEOUT', lateAckAt: '2026-10-13T00:00:00Z' }], [{ cmdId: 'a', status: 'TIMEOUT' }]);
  assert.ok(rows[0].lateAckAt);
});
test('telemetry deduplicates and retains null readings, zero coordinates, source and uptime', () => {
  const reading = { readingId: 'a', deviceId: 'd', receivedAt: '2026-10-13T00:00:00Z', ts: 5, batteryV: null, speedKmh: null, latitude: 0, longitude: 0, deviceUptimeS: 123, dataSource: 'HARDWARE' };
  const state = reduce(reduce(initialRealtimeState, { type: 'TELEMETRY', deviceId: 'd', data: reading }), { type: 'HISTORY', deviceId: 'd', data: [reading] });
  assert.equal(state.histories.d.length, 1); assert.deepEqual(state.telemetry.d, reading);
});
test('in-flight device snapshot cannot revert a live update', () => {
  let state = reduce(initialRealtimeState, { type: 'DEVICES', version: 0, data: [{ deviceId: 'd', securityState: 'PARKED' }] });
  state = reduce(state, { type: 'DEVICE', deviceId: 'd', data: { deviceId: 'd', securityState: 'ALARM' } });
  state = reduce(state, { type: 'DEVICES', version: 0, data: [{ deviceId: 'd', securityState: 'PARKED' }] });
  assert.equal(state.devices[0].securityState, 'ALARM');
});
test('device streams are isolated and logout clears all caches', () => {
  let state = reduce(initialRealtimeState, { type: 'TELEMETRY', deviceId: 'one', data: { readingId: 'a', speedKmh: 12 } });
  state = reduce(state, { type: 'TELEMETRY', deviceId: 'two', data: { readingId: 'b', speedKmh: 2 } });
  assert.equal(state.telemetry.one.speedKmh, 12); assert.equal(state.telemetry.two.speedKmh, 2);
  assert.deepEqual(reduce(state, { type: 'RESET' }), initialRealtimeState);
});
test('live buffer remains bounded', () => {
  assert.equal(mergeReadings([], Array.from({ length: 1000 }, (_, ts) => ({ readingId: String(ts), ts }))).length, 300);
});
test('revoked device is removed from dashboard and cached telemetry', () => {
  let state = reduce(initialRealtimeState, { type: 'DEVICE', deviceId: 'd', data: { deviceId: 'd' } });
  state = reduce(state, { type: 'TELEMETRY', deviceId: 'd', data: { readingId: 'r' } });
  state = reduce(state, { type: 'ACCESS_REMOVED', deviceId: 'd', data: { deviceId: 'd' } });
  assert.deepEqual(state.devices, []); assert.equal(state.telemetry.d, undefined);
  state = reduce(state, { type: 'DEVICES', version: 0, data: [{ deviceId: 'd' }] });
  assert.deepEqual(state.devices, []);
});
test('alert snapshot keeps historical alerts while a new live alert arrives', () => {
  let state = reduce(initialRealtimeState, { type: 'ALERT', deviceId: 'd', data: { alertId: 'live', deviceId: 'd', status: 'OPEN' } });
  state = reduce(state, { type: 'ALERTS', version: 0, data: [{ alertId: 'historical', deviceId: 'd', status: 'OPEN' }] });
  assert.equal(state.alerts.length, 2);
});
test('GPS freshness includes age at gateway and elapsed time in the UI', () => {
  const now = Date.parse('2026-10-13T00:00:02Z');
  const device = { lifecycleState: 'ACTIVE', lastTelemetryAt: '2026-10-13T00:00:00Z', gpsValid: true, gpsAgeMs: 4000, sensorConnected: true, speedValid: true, imuValid: true };
  const view = liveDeviceView(device, now);
  assert.equal(view.gpsValid, false); assert.equal(view.speedValid, true);
  const expired = liveDeviceView(device, now + 6000);
  assert.equal(expired.sensorConnected, false); assert.equal(expired.imuValid, false);
});
