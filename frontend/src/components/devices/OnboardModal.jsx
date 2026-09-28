import React, { useState } from 'react';
import { QrCode, Bike, X, CheckCircle } from 'lucide-react';
import { api } from '../../services/api';

export default function OnboardModal({ isOpen, onClose, onSuccess }) {
  const [claimToken, setClaimToken] = useState('GUARDIAN-QR-2026');
  const [name, setName] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.onboardDevice({
        claimToken,
        name,
        licensePlate,
        vehicleModel
      });

      if (res.success) {
        onSuccess(res.data);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Lỗi khi kích hoạt thiết bị');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
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
              <QrCode size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0c4a6e' }}>
                KÍCH HOẠT THIẾT BỊ MỚI (ONBOARDING)
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Nhập Claim Token từ mã QR in trên Gateway ESP32
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Sample Token Helper Box */}
            <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '10px', padding: '0.75rem', marginBottom: '1rem', fontSize: '0.8rem', color: '#0369a1' }}>
              <strong>Mã Claim Token mẫu có sẵn để thử nghiệm:</strong><br />
              • <code>GUARDIAN-QR-2026</code> (VinFast Theon S)<br />
              • <code>CLAIM-SH150-2026</code> (Honda SH 150i)<br />
              • <code>CLAIM-EX155-2026</code> (Yamaha Exciter 155)
            </div>

            <div className="form-group">
              <label className="form-label">Mã Claim Token (từ QR):</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ví dụ: GUARDIAN-QR-2026"
                value={claimToken}
                onChange={(e) => setClaimToken(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Tên thiết bị / Xe:</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ví dụ: VinFast Theon S 2024"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Biển số xe (Tuỳ chọn):</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ví dụ: 30A1-999.99"
                value={licensePlate}
                onChange={(e) => setLicensePlate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Dòng xe / Năm sản xuất:</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ví dụ: Honda SH 150i ABS 2024"
                value={vehicleModel}
                onChange={(e) => setVehicleModel(e.target.value)}
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
              Đóng
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Đang kích hoạt...' : 'Kích hoạt Thiết Bị'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
