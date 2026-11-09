import React, { useState } from 'react';
import { api } from '../../services/api';

export default function DeviceConnectionTools({ device, admin, onRefresh }) {
  const [credential, setCredential] = useState(null);
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState('Thiết bị mới');
  const [claim, setClaim] = useState(null);
  const rotate = async (reactivate = false) => {
    if (!device || !window.confirm(reactivate ? 'Kích hoạt lại thiết bị đã thu hồi và cấp khóa mới? Khóa cũ sẽ không dùng lại được. Cần cập nhật firmware để kết nối lại.' : 'Cấp lại khóa kết nối cho thiết bị này? Kết nối hiện tại sẽ bị ngắt. Bạn cần cập nhật khóa mới trong firmware để thiết bị kết nối lại.')) return;
    setBusy(true); setCredential(null); setVisible(false); setMessage('');
    try {
      setCredential((await (reactivate ? api.reactivateDevice(device.deviceId) : api.rotateDeviceCredentials(device.deviceId))).data);
      setMessage('Khóa chỉ hiển thị trong lần cấp này. Lưu riêng để cấu hình thiết bị; không đưa vào GitHub, ảnh hoặc video demo.');
      await onRefresh();
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  };
  const provision = async () => {
    setBusy(true); setClaim(null); setMessage('');
    try {
      setClaim((await api.provisionDevice({ name: name.trim(), dataSource: 'HARDWARE' })).data);
      setMessage('Đã đăng ký thiết bị chưa kích hoạt. Chỉ nhận dữ liệu thật sau khi cấu hình đúng UUID và khóa trên board.');
      await onRefresh();
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  };
  return <section className="glass-card user-section">
    <h2>Cấp kết nối thiết bị</h2>
    <p>Chỉ dành cho chủ xe/quản trị viên khi lắp đặt hoặc thay khóa. Mỗi thiết bị dùng một khóa riêng.</p>
    {device?.dataSource === 'HARDWARE' && device.lifecycleState !== 'DECOMMISSIONED' &&
      <button className="btn btn-secondary" disabled={busy} onClick={() => void rotate(device.lifecycleState === 'FAULT')}>{busy ? 'Đang xử lý…' : device.lifecycleState === 'FAULT' ? 'Kích hoạt lại và cấp khóa mới' : 'Cấp lại khóa kết nối'}</button>}
    {message && <p role="status">{message}</p>}
    {credential && <div className="form-group">
      <p>Username: <code>{credential.username}</code> · Broker: <code>{credential.brokerHost}:{credential.brokerPort}</code></p>
      <label htmlFor="mqtt-one-time-secret">Khóa kết nối mới</label>
      <input id="mqtt-one-time-secret" className="form-input" type={visible ? 'text' : 'password'} readOnly value={credential.password} autoComplete="off" />
      <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
        <button className="btn btn-secondary" aria-pressed={visible} onClick={() => setVisible(v => !v)}>{visible ? 'Ẩn khóa' : 'Hiện khóa'}</button>
        <button className="btn btn-secondary" onClick={() => { setCredential(null); setVisible(false); }}>Xóa khỏi màn hình</button>
      </div>
    </div>}
    {admin && <details>
      <summary>Đăng ký board mới để kích hoạt sau</summary>
      <label htmlFor="provision-name">Tên thiết bị mới</label>
      <input id="provision-name" className="form-input" value={name} maxLength={100} onChange={e => setName(e.target.value)} />
      <button className="btn btn-secondary" disabled={busy || !name.trim()} onClick={provision}>Đăng ký thiết bị mới</button>
      {claim && <p role="status">UUID: <code>{claim.deviceUuid}</code><br/>Mã kích hoạt: <code>{claim.claimToken}</code><br/>Mã này dùng một lần; chưa thay cho khóa MQTT.</p>}
    </details>}
  </section>;
}
