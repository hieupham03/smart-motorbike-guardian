import test from 'node:test';
import assert from 'node:assert/strict';
import { initialRealtimeState, mergeWheelSession, realtimeReducer } from './realtimeState.js';

const packet = (sequence, sessionId = '12345678-1', seconds = sequence) => ({
  sessionId, sequence, receivedAt: new Date(1_700_000_000_000 + seconds * 1000).toISOString(), pulseCount: sequence,
});
test('wheel session snapshot cannot roll back a newer event or a reset session', () => {
  const current = packet(20, '12345678-2');
  assert.equal(mergeWheelSession(current, packet(19, '12345678-1')), current);
  assert.equal(mergeWheelSession(current, packet(20, '12345678-2')), current);
  assert.equal(mergeWheelSession(current, packet(19, '12345678-1', 30)), current);
  const reset = packet(21, '12345678-3');
  assert.equal(mergeWheelSession(current, reset), reset);
});
test('wheel sequence wraps and gateway reboot starts a new sequence', () => {
  assert.equal(mergeWheelSession(packet(0xffffffff, '12345678-1', 1), packet(0, '12345678-1', 2)).sequence, 0);
  assert.equal(mergeWheelSession(packet(100, '12345678-1', 1), packet(1, '87654321-1', 2)).sequence, 1);
});
test('wheel session is cleared on access removal and late snapshots cannot restore it', () => {
  let state = realtimeReducer(initialRealtimeState, { type: 'WHEEL_SESSION', deviceId: 'd', data: packet(1) });
  assert.equal(state.wheelSessions.d.sequence, 1);
  state = realtimeReducer(state, { type: 'ACCESS_REMOVED', deviceId: 'd', data: { deviceId: 'd' } });
  assert.equal(state.wheelSessions.d, undefined);
  state = realtimeReducer(state, { type: 'WHEEL_SESSION', deviceId: 'd', data: packet(2) });
  assert.equal(state.wheelSessions.d, undefined);
  assert.deepEqual(realtimeReducer(state, { type: 'RESET' }).wheelSessions, {});
});
