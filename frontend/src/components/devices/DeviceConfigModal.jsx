import React, { useState, useEffect } from 'react';
import { Settings2, X } from 'lucide-react';
import { api } from '../../services/api';

export default function DeviceConfigModal({ isOpen, onClose, device, onSuccess }) {
  const [name, setName] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [speedThresholdKmh, setSpeedThresholdKmh] = useState(80);
  const [batteryLowThresholdV, setBatteryLowThresholdV] = useState(11.5);
  const [tiltThresholdDeg, setTiltThresholdDeg] = useState(45);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (device) {
      setName(device.name || '');
      setLicensePlate(device.licensePlate || '');
      setVehicleModel(device.vehicleModel || '');
      setSpeedThresholdKmh(device.speedThresholdKmh || 80);
      setBatteryLowThresholdV(device.batteryLowThresholdV || 11.5);
      setTiltThresholdDeg(device.tiltThresholdDeg || 45);
    }
  }, [device]);

  if (!isOpen || !device) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.updateConfig(device.deviceId, {
        name,
        licensePlate,
        vehicleModel,
        speedThresholdKmh: Number(speedThresholdKmh),
        batteryLowThresholdV: Number(batteryLowThresholdV),
        tiltThresholdDeg: Number(tiltThresholdDeg)
      });

      if (res.success) {
        onSuccess(res.data);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Lỗi khi cập nhật cấu hình');
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
              <Settings2 size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0c4a6e' }}>
                CẤU HÌNH THIẾT BỊ & NGƯỠNG AN TOÀN
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#64748b' }}>
                {device.name} ({device.deviceUuid})
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
              <label className="form-label">Tên thiết bị:</label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Biển số:</label>
                <input
                  type="text"
                  className="form-input"
                  value={licensePlate}
                  onChange={(e) => setLicensePlate(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Dòng xe:</label>
                <input
                  type="text"
                  className="form-input"
                  value={vehicleModel}
                  onChange={(e) => setVehicleModel(e.target.value)}
                />
              </div>
            </div>

            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem', marginTop: '0.5rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#0369a1', marginBottom: '0.75rem' }}>
                NGƯỠNG CẢNH BÁO TỰ ĐỘNG
              </div>

              <div className="form-group">
                <label className="form-label">Ngưỡng cảnh báo quá tốc độ (km/h):</label>
                <input
                  type="number"
                  className="form-input"
                  min="20"
                  max="150"
                  value={speedThresholdKmh}
                  onChange={(e) => setSpeedThresholdKmh(e.target.value)}
                  required
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Ngưỡng ắc quy yếu (V):</label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-input"
                    min="10.0"
                    max="12.5"
                    value={batteryLowThresholdV}
                    onChange={(e) => setBatteryLowThresholdV(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Ngưỡng góc nghiêng / ngã (°):</label>
                  <input
                    type="number"
                    className="form-input"
                    min="30"
                    max="80"
                    value={tiltThresholdDeg}
                    onChange={(e) => setTiltThresholdDeg(e.target.value)}
                    required
                  />
                </div>
              </div>
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
              {loading ? 'Đang lưu...' : 'Lưu Thay Đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
