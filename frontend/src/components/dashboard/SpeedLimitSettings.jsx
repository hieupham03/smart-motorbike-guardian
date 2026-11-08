import React, { useState } from 'react';
import { useDevice } from '../../context/DeviceContext';
import { commandFeedback, reasonLabel } from '../../services/presentation';
import { parseSpeedLimit } from '../../services/speedLimit';

export default function SpeedLimitSettings() {
  const { selectedDevice: device, wheelSession: session, commands, isArming, sendDeviceCommand } = useDevice();
  const [value, setValue] = useState('');
  const [id, setId] = useState(null);
  const [error, setError] = useState('');
  if (device?.dataSource !== 'HARDWARE') return null;
  const allowed = ['OWNER', 'ADMIN'].includes(device.currentUserRole);
  const age = session ? Date.now() - Date.parse(session.receivedAt) : Infinity;
  const fresh = session?.fresh && device.sensorConnected && device.lifecycleState === 'ACTIVE' && age >= -1000 && age <= 5000;
  const pending = isArming || commands.some(c => c.status === 'PENDING');
  const ready = allowed && fresh && session?.speedLimitConfigurable === true && !pending;
  const command = commands.find(c => c.cmdId === id);
  async function save(event) {
    event.preventDefault();
    if (!ready) return;
    const limit = parseSpeedLimit(value);
    if (limit === null) { setError('Nhập ngưỡng từ 1 đến 120 km/h.'); return; }
    setError(''); setId(null);
    try {
      const response = await sendDeviceCommand('CONFIG_THRESHOLDS', JSON.stringify({ speed_limit_kmh: limit }));
      if (response?.data) setId(response.data.cmdId);
    } catch (cause) { setError(reasonLabel(cause.message)); }
  }
  return <div className="speed-limit-settings">
    <h3>Ngưỡng cảnh báo tốc độ</h3>
    <p className="muted">Ngưỡng thiết bị báo về: <strong>{session ? `${session.speedLimitKmh.toLocaleString('vi-VN')} km/h` : 'Chưa có thông tin'}</strong>.</p>
    {allowed ? <form onSubmit={save} noValidate>
      <label className="form-label" htmlFor="speed-limit-kmh">Ngưỡng mới (km/h)</label>
      <div className="control-actions">
        <input id="speed-limit-kmh" className="form-input" type="number" inputMode="decimal" min="1" max="120" step="any"
          value={value} onChange={event => { setValue(event.target.value); setError(''); }} disabled={!ready}
          aria-describedby="speed-limit-help" aria-invalid={!!error} />
        <button type="submit" className="btn btn-primary" disabled={!ready}>Lưu ngưỡng cảnh báo</button>
      </div>
    </form> : <p className="muted">Chỉ chủ xe hoặc quản trị viên được thay đổi ngưỡng.</p>}
    <p id="speed-limit-help" className="fine-print">Từ 1–120 km/h. Ngưỡng được lưu trên thiết bị, giữ lại sau khi tắt nguồn. Cảnh báo không tự giảm tốc hoặc khóa xe.</p>
    {allowed && !pending && (!fresh ? <p role="status" className="notice notice-warning">Chờ thiết bị kết nối và gửi dữ liệu mới để đổi ngưỡng.</p>
      : !session?.speedLimitConfigurable && <p role="status" className="notice notice-warning">Thiết bị chưa hỗ trợ đổi ngưỡng từ xa. Cần cập nhật phần mềm thiết bị.</p>)}
    {command && <p role="status" className={`notice ${command.status === 'REJECTED' || command.status === 'TIMEOUT' ? 'notice-warning' : 'notice-info'}`}>{commandFeedback(command)}</p>}
    {error && <p role="alert" className="notice notice-danger">{error}</p>}
  </div>;
}
