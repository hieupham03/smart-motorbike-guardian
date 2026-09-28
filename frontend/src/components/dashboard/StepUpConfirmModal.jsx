import React, { useState } from 'react';
import { Lock, AlertOctagon, X, CheckCircle, ShieldAlert } from 'lucide-react';

export default function StepUpConfirmModal({ isOpen, onClose, onConfirm, currentSpeed = 0 }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) {
      setError('Vui lòng nhập mật khẩu tài khoản để xác nhận');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await onConfirm(password);
      setPassword('');
      onClose();
    } catch (err) {
      setError(err.message || 'Mật khẩu không chính xác hoặc lệnh bị từ chối');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '460px' }}>
        <div className="modal-header" style={{ background: '#fef2f2', borderBottom: '1px solid #fecaca' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff'
            }}>
              <ShieldAlert size={20} />
            </div>
            <div>
              <div style={{ fontSize: '1.05rem', fontWeight: '800', color: '#991b1b' }}>
                XÁC THỰC KHOÁ ĐỘNG CƠ KHẨN CẤP
              </div>
              <div style={{ fontSize: '0.75rem', color: '#b91c1c' }}>
                Cơ chế bảo mật hai lớp (Step-up Confirmation)
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#991b1b' }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Safety Notice */}
            <div style={{
              background: currentSpeed > 0 ? '#fef2f2' : '#f0f9ff',
              border: `1px solid ${currentSpeed > 0 ? '#fca5a5' : '#bae6fd'}`,
              borderRadius: '10px',
              padding: '0.85rem',
              marginBottom: '1rem',
              fontSize: '0.825rem',
              color: currentSpeed > 0 ? '#991b1b' : '#0369a1'
            }}>
              {currentSpeed > 0 ? (
                <div>
                  <strong>⚠️ CẢNH BÁO AN TOÀN (S-07 / FR-04):</strong><br />
                  Tốc độ xe hiện tại là <strong>{currentSpeed.toFixed(1)} km/h</strong> (&gt; 0). Firmware Gateway Node sẽ <strong>TỪ CHỐI</strong> lệnh khoá để chống tai nạn khi xe đang lưu thông!
                </div>
              ) : (
                <div>
                  <strong>✓ RÀNG BUỘC AN TOÀN ĐẠT:</strong><br />
                  Tốc độ xe = 0 km/h (đã dừng hẳn). Relay cắt nguồn motor DC sẽ được kích hoạt để ngăn chặn trộm cắp.
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: '700' }}>
                Nhập mật khẩu tài khoản của bạn để tiếp tục:
              </label>
              <input
                type="password"
                className="form-input"
                placeholder="Nhập mật khẩu..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                required
              />
            </div>

            {error && (
              <div style={{ color: '#ef4444', fontSize: '0.825rem', marginTop: '0.5rem', fontWeight: '600' }}>
                {error}
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Huỷ bỏ
            </button>
            <button type="submit" className="btn btn-danger" disabled={loading}>
              {loading ? 'Đang xác thực & gửi lệnh...' : 'Xác nhận Khoá Động Cơ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
