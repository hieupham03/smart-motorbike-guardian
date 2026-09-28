import React, { useState, useEffect } from 'react';
import { useDevice } from '../context/DeviceContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import InviteViewerModal from '../components/devices/InviteViewerModal';
import { Users, UserPlus, Trash2, Shield, Eye, Key } from 'lucide-react';

export default function UsersPage() {
  const { selectedDevice } = useDevice();
  const { role } = useAuth();
  const [deviceUsers, setDeviceUsers] = useState([]);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const isViewer = role === 'VIEWER';

  const loadUsers = async () => {
    if (!selectedDevice) return;
    try {
      const res = await api.getDeviceUsers(selectedDevice.deviceId);
      if (res.success && res.data) {
        setDeviceUsers(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [selectedDevice]);

  const handleRemove = async (userId, email) => {
    if (!window.confirm(`Bạn có chắc muốn gỡ quyền truy cập xe của [${email}]?`)) return;
    try {
      await api.removeDeviceUser(selectedDevice.deviceId, userId);
      setFeedback(`Đã xoá quyền truy cập của ${email}`);
      await loadUsers();
    } catch (err) {
      setFeedback(`Lỗi: ${err.message}`);
    }
    setTimeout(() => setFeedback(null), 3000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">
            <Users size={26} color="#0284c7" /> Phân Quyền &amp; Người Theo Dõi (Viewers)
          </h1>
          <p className="page-subtitle">
            Cấp quyền xem trạng thái xe {selectedDevice?.name} cho người thân và gia đình
          </p>
        </div>

        {!isViewer && (
          <button className="btn btn-primary" onClick={() => setIsInviteOpen(true)}>
            <UserPlus size={18} /> Cấp Quyền Người Thân Mới
          </button>
        )}
      </div>

      {feedback && (
        <div style={{ padding: '0.75rem 1rem', borderRadius: '10px', background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', fontWeight: '600' }}>
          ✓ {feedback}
        </div>
      )}

      {/* Users List Card */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#0c4a6e', marginBottom: '1rem' }}>
          DANH SÁCH THÀNH VIÊN ĐƯỢC CẤP QUYỀN ({deviceUsers.length})
        </h3>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Họ và Tên</th>
                <th>Email Tài Khoản</th>
                <th>Vai Trò Truy Cập</th>
                <th>Trạng Thái</th>
                <th style={{ textAlign: 'right' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {deviceUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                    Chưa có người dùng nào được gán cho thiết bị này.
                  </td>
                </tr>
              ) : (
                deviceUsers.map(u => (
                  <tr key={u.userId}>
                    <td style={{ fontWeight: '700', color: '#0f172a' }}>{u.fullName}</td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`badge ${u.role === 'OWNER' ? 'badge-armed' : 'badge-low'}`}>
                        {u.role === 'OWNER' ? '🔑 CHỦ XE (OWNER)' : '👁️ NGƯỜI XEM (VIEWER)'}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: '#10b981', fontWeight: '700' }}>● {u.status}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {!isViewer && u.role !== 'OWNER' && (
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleRemove(u.userId, u.email)}
                          title="Gỡ quyền"
                        >
                          <Trash2 size={15} /> Gỡ
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RBAC Matrix Explanatory Card */}
      <div className="glass-card" style={{ padding: '1.5rem', background: '#f8fafc' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#0369a1', marginBottom: '0.75rem' }}>
          BẢNG MA TRẬN PHÂN QUYỀN (RBAC MATRIX MỤC 12.2)
        </h3>
        <p style={{ fontSize: '0.825rem', color: '#64748b', marginBottom: '1rem' }}>
          Backend tự động kiểm tra quyền qua JWT và bảng Ownership trước khi xử lý mọi yêu cầu:
        </p>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Chức năng</th>
                <th>Chủ xe (Owner)</th>
                <th>Người thân (Viewer)</th>
                <th>Quản trị (Admin)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Xem Telemetry &amp; Vị trí GPS</td>
                <td><span style={{ color: '#10b981', fontWeight: '800' }}>✓ Đầy đủ</span></td>
                <td><span style={{ color: '#10b981', fontWeight: '800' }}>✓ Đầy đủ</span></td>
                <td><span style={{ color: '#10b981', fontWeight: '800' }}>✓ Đầy đủ</span></td>
              </tr>
              <tr>
                <td>Bật/Tắt Canh giữ (Arm / Disarm)</td>
                <td><span style={{ color: '#10b981', fontWeight: '800' }}>✓ Được phép</span></td>
                <td><span style={{ color: '#ef4444', fontWeight: '800' }}>✗ Bị cấm (403)</span></td>
                <td><span style={{ color: '#10b981', fontWeight: '800' }}>✓ Được phép</span></td>
              </tr>
              <tr>
                <td>Khoá động cơ khẩn cấp (Lock Engine)</td>
                <td><span style={{ color: '#10b981', fontWeight: '800' }}>✓ Kèm Step-up Pass</span></td>
                <td><span style={{ color: '#ef4444', fontWeight: '800' }}>✗ Bị cấm (403)</span></td>
                <td><span style={{ color: '#10b981', fontWeight: '800' }}>✓ Kèm Step-up Pass</span></td>
              </tr>
              <tr>
                <td>Mời thêm Viewer &amp; Cấu hình xe</td>
                <td><span style={{ color: '#10b981', fontWeight: '800' }}>✓ Được phép</span></td>
                <td><span style={{ color: '#ef4444', fontWeight: '800' }}>✗ Bị cấm (403)</span></td>
                <td><span style={{ color: '#10b981', fontWeight: '800' }}>✓ Được phép</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <InviteViewerModal
        isOpen={isInviteOpen}
        deviceId={selectedDevice?.deviceId}
        onClose={() => setIsInviteOpen(false)}
        onSuccess={() => {
          setFeedback('Đã cấp quyền người xem thành công');
          loadUsers();
        }}
      />

    </div>
  );
}
