import React, { useState, useEffect } from 'react';
import { useDevice } from '../context/DeviceContext';
import { api } from '../services/api';
import { Terminal, Clock, CheckCircle2, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

export default function CommandHistoryPage() {
  const { selectedDevice } = useDevice();
  const [commands, setCommands] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadCommands() {
      if (!selectedDevice) return;
      setLoading(true);
      try {
        const res = await api.getCommands(selectedDevice.deviceId);
        if (res.success && res.data) {
          setCommands(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadCommands();
    const interval = setInterval(loadCommands, 3000);
    return () => clearInterval(interval);
  }, [selectedDevice]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      <div>
        <h1 className="page-title">
          <Terminal size={26} color="#0284c7" /> Lịch Sử Lệnh &amp; Xác Nhận Phần Cứng (ACK)
        </h1>
        <p className="page-subtitle">
          Theo dõi toàn bộ lệnh điều khiển hai chiều gửi xuống vi điều khiển Gateway ESP32
        </p>
      </div>

      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#0c4a6e' }}>
            DANH SÁCH LỆNH CỦA THIẾT BỊ: {selectedDevice?.name}
          </h3>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
            {commands.length} bản ghi
          </span>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Mã Lệnh (cmd_id)</th>
                <th>Loại Lệnh</th>
                <th>Người Gửi</th>
                <th>Trạng Thái</th>
                <th>Lý Do Từ Chối (Nếu có)</th>
                <th>Thời Gian Gửi</th>
                <th>Thời Gian Nhận ACK</th>
              </tr>
            </thead>
            <tbody>
              {commands.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                    Chưa có lệnh nào được gửi tới thiết bị này.
                  </td>
                </tr>
              ) : (
                commands.map((cmd) => {
                  const isSuccess = cmd.status === 'EXECUTED';
                  const isRejected = cmd.status === 'REJECTED';
                  const isPending = cmd.status === 'PENDING';

                  return (
                    <tr key={cmd.cmdId}>
                      <td style={{ fontFamily: 'monospace', fontWeight: '700', color: '#0369a1' }}>
                        {cmd.cmdId}
                      </td>
                      <td>
                        <span style={{ fontWeight: '800', color: '#0f172a' }}>{cmd.type}</span>
                      </td>
                      <td>{cmd.issuedByName || cmd.issuedByEmail || 'System'}</td>
                      <td>
                        <span className={`badge ${isSuccess ? 'badge-armed' : isRejected ? 'badge-alarm' : 'badge-medium'}`}>
                          {cmd.status}
                        </span>
                      </td>
                      <td style={{ color: isRejected ? '#dc2626' : '#64748b', fontWeight: isRejected ? '700' : 'normal' }}>
                        {cmd.reasonIfFailed || '—'}
                      </td>
                      <td style={{ fontSize: '0.8rem' }}>
                        {cmd.issuedAt ? new Date(cmd.issuedAt).toLocaleTimeString() : 'N/A'}
                      </td>
                      <td style={{ fontSize: '0.8rem' }}>
                        {cmd.ackAt ? new Date(cmd.ackAt).toLocaleTimeString() : 'Đang chờ...'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
