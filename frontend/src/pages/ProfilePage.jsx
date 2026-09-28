import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Settings, Key, User, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ProfilePage() {
  const { user, role } = useAuth();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setFeedback({ type: 'error', message: 'Mật khẩu mới và xác nhận mật khẩu không khớp' });
      return;
    }

    setLoading(true);
    try {
      await api.changePassword(oldPassword, newPassword);
      setFeedback({ type: 'success', message: 'Đổi mật khẩu thành công!' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Lỗi đổi mật khẩu' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '800px' }}>
      
      <div>
        <h1 className="page-title">
          <Settings size={26} color="#0284c7" /> Cài Đặt Tài Khoản &amp; Bảo Mật
        </h1>
        <p className="page-subtitle">
          Quản lý thông tin định danh và đổi mật khẩu truy cập hệ thống
        </p>
      </div>

      {feedback && (
        <div style={{
          padding: '0.85rem 1rem',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          fontSize: '0.875rem',
          fontWeight: '600',
          background: feedback.type === 'error' ? '#fef2f2' : '#f0fdf4',
          color: feedback.type === 'error' ? '#991b1b' : '#166534',
          border: `1px solid ${feedback.type === 'error' ? '#fecaca' : '#bbf7d0'}`
        }}>
          {feedback.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* User Information Card */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0c4a6e', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <User size={20} color="#0284c7" /> THÔNG TIN TÀI KHOẢN
        </h3>

        <div className="grid-2">
          <div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Họ và tên:</div>
            <div style={{ fontSize: '1rem', fontWeight: '700', color: '#0f172a', marginTop: '2px' }}>{user?.fullName}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Địa chỉ Email:</div>
            <div style={{ fontSize: '1rem', fontWeight: '700', color: '#0f172a', marginTop: '2px' }}>{user?.email}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Vai trò hệ thống:</div>
            <div style={{ marginTop: '4px' }}>
              <span className="badge badge-armed">{role}</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Trạng thái tài khoản:</div>
            <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#10b981', marginTop: '4px' }}>
              ● {user?.status} (Đã xác thực JWT)
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Card */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0c4a6e', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Key size={20} color="#0284c7" /> ĐỔI MẬT KHẨU
        </h3>

        <form onSubmit={handlePasswordChange}>
          <div className="form-group">
            <label className="form-label">Mật khẩu hiện tại:</label>
            <input
              type="password"
              className="form-input"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Mật khẩu mới (Tối thiểu 6 ký tự):</label>
              <input
                type="password"
                className="form-input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Xác nhận mật khẩu mới:</label>
              <input
                type="password"
                className="form-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '0.5rem' }}>
            {loading ? 'Đang cập nhật...' : 'Cập Nhật Mật Khẩu'}
          </button>
        </form>
      </div>

    </div>
  );
}
