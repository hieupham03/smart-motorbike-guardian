import { parseSpeedLimit } from '../speedLimit';
import { commandFeedback } from '../presentation';
describe('speed limit and command feedback', () => {
  it('accepts decimal thresholds and rejects empty/coerced/out-of-range values', () => {
    for (const [text, expected] of [['1',1],['120',120],[' 5,5 ',5.5],['2.5',2.5],['',null],[' ',null],['0',null],['121',null],['1e1',null],['0x10',null],['NaN',null],['5km/h',null]] as const)
      expect(parseSpeedLimit(text)).toBe(expected);
  });
  it('explains the wheel interlock and distinguishes transport failures', () => {
    expect(commandFeedback({type:'ARM',status:'REJECTED',reasonIfFailed:'SPEED_NOT_ZERO'})).toBe('Chưa thể bật bảo vệ: bánh xe đang quay hoặc chưa dừng đủ lâu. Hãy để bánh dừng hẳn ít nhất 4 giây rồi bật lại.');
    expect(commandFeedback({type:'ARM',status:'REJECTED',reasonIfFailed:'MQTT_UNAVAILABLE'})).toMatch(/kết nối điều khiển đang gián đoạn/i);
    expect(commandFeedback({type:'ARM',status:'TIMEOUT',reasonIfFailed:'ACK_TIMEOUT'})).toMatch(/chưa xác định được yêu cầu đã thực hiện hay chưa/i);
    expect(commandFeedback({type:'CONFIG_THRESHOLDS',status:'EXECUTED'})).toBe('Đổi ngưỡng cảnh báo tốc độ: Đã thực hiện');
    expect(commandFeedback({type:'ARM',status:'TIMEOUT',lateAckAt:'2026-11-08T15:00:00Z',lateAckResult:'REJECTED',lateAckReason:'SPEED_NOT_ZERO'})).toMatch(/Phản hồi muộn từ xe: Không thể thực hiện/);
  });
});
