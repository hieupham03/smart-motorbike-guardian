import test from 'node:test';
import assert from 'node:assert/strict';
import { commandFeedback } from './presentation.js';

test('ARM rejected by the wheel interlock explains how to stop and retry', () => {
  const message = commandFeedback({ type: 'ARM', status: 'REJECTED', reasonIfFailed: 'SPEED_NOT_ZERO' });
  assert.equal(message, 'Chưa thể bật bảo vệ: bánh xe đang quay hoặc chưa dừng đủ lâu. Hãy để bánh dừng hẳn ít nhất 4 giây rồi bật lại.');
});

test('a publish failure explains the control connection, without inventing a wheel rejection', () => {
  const message = commandFeedback({ type: 'ARM', status: 'REJECTED', reasonIfFailed: 'MQTT_UNAVAILABLE' });
  assert.match(message, /kết nối điều khiển đang gián đoạn/i);
  assert.doesNotMatch(message, /bánh xe|chưa được xác nhận|MQTT_UNAVAILABLE/);
});

test('an ACK timeout leaves execution uncertain and asks the user to check state', () => {
  const message = commandFeedback({ type: 'ARM', status: 'TIMEOUT', reasonIfFailed: 'ACK_TIMEOUT' });
  assert.match(message, /chưa nhận được phản hồi/i);
  assert.match(message, /chưa xác định được yêu cầu đã thực hiện hay chưa/i);
  assert.doesNotMatch(message, /bánh xe|ACK_TIMEOUT/);
});

test('a late wheel rejection is explained while the command keeps its timeout status', () => {
  const message = commandFeedback({ type: 'ARM', status: 'TIMEOUT', reasonIfFailed: 'ACK_TIMEOUT', lateAckAt: '2026-11-08T15:00:00Z', lateAckResult: 'REJECTED', lateAckReason: 'SPEED_NOT_ZERO' });
  assert.match(message, /Chưa nhận được phản hồi/);
  assert.match(message, /Phản hồi muộn từ xe: Không thể thực hiện/);
  assert.match(message, /bánh xe đang quay hoặc chưa dừng đủ lâu/i);
  assert.doesNotMatch(message, /Đã thực hiện/);
});

test('successful and pending commands do not acquire a rejection message', () => {
  assert.equal(commandFeedback({ type: 'ARM', status: 'EXECUTED' }), 'Bật bảo vệ: Đã thực hiện');
  assert.equal(commandFeedback({ type: 'ARM', status: 'PENDING' }), 'Bật bảo vệ: Đang chờ thiết bị');
});
