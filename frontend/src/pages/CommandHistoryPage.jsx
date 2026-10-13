import React from 'react';
import { useDevice } from '../context/DeviceContext';
import { Terminal, Clock, CheckCircle2, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

export default function CommandHistoryPage() {
  const { selectedDevice, commands } = useDevice();

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
                  const isRejected = ['REJECTED', 'TIMEOUT'].includes(cmd.status);
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
                        {cmd.reasonIfFailed || '—'}{cmd.lateAckAt && <div>ACK muộn: {cmd.lateAckResult} · {cmd.lateAckReason || '—'}</div>}
                      </td>
                      <td style={{ fontSize: '0.8rem' }}>
                        {cmd.issuedAt ? new Date(cmd.issuedAt).toLocaleString() : 'N/A'}
                      </td>
                      <td style={{ fontSize: '0.8rem' }}>
                        {cmd.ackAt ? new Date(cmd.ackAt).toLocaleString() : isPending ? 'Đang chờ...' : 'Không có ACK'}
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
