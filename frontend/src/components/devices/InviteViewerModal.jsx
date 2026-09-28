import React, { useState } from 'react';
import { UserPlus, X, Mail } from 'lucide-react';
import { api } from '../../services/api';

export default function InviteViewerModal({ isOpen, onClose, deviceId, onSuccess }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('VIEWER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.inviteViewer(deviceId, { email, role });
      setEmail('');
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Lỗi khi cấp quyền truy cập');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '440px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: '#0284c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff'
            }}>
              <UserPlus size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0c4a6e' }}>
                CẤP QUYỀN TRUY CẬP XE
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Mời người thân (Viewer) cùng theo dõi hành trình
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Email tài khoản người được mời:</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  className="form-input"
                  placeholder="viewer@guardian.iot"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Vai trò uỷ quyền:</label>
              <select
                className="form-select"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="VIEWER">Người theo dõi (Viewer - Chỉ xem, không thể điều khiển)</option>
                <option value="OWNER">Đồng chủ sở hữu (Owner - Đầy đủ quyền điều khiển)</option>
              </select>
            </div>

            {error && (
              <div style={{ color: '#ef4444', fontSize: '0.825rem', marginTop: '0.5rem', fontWeight: '600' }}>
                {error}
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Huỷ
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Đang cấp quyền...' : 'Gửi Lời Mời'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
