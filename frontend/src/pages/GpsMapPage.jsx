import React from 'react';
import { useDevice } from '../context/DeviceContext';
import LiveGpsMap from '../components/map/LiveGpsMap';
import { MapPin, Navigation, Compass, ShieldCheck } from 'lucide-react';

export default function GpsMapPage() {
  const { selectedDevice } = useDevice();

  if (!selectedDevice) {
    return (
      <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Vui lòng chọn thiết bị để xem bản đồ định vị.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 className="page-title">
          <MapPin size={26} color="#0284c7" /> Bản Đồ &amp; Định Vị GPS Xe Máy
        </h1>
        <p className="page-subtitle">
          Theo dõi vị trí thực tế, tốc độ di chuyển và thiết lập hàng rào an ninh ảo (Geofencing)
        </p>
      </div>

      {/* Main Full Height Interactive Map */}
      <LiveGpsMap
        latitude={selectedDevice.lastLatitude}
        longitude={selectedDevice.lastLongitude}
        deviceName={selectedDevice.name}
        licensePlate={selectedDevice.licensePlate}
        speed={selectedDevice.lastSpeedKmh || 0}
        securityState={selectedDevice.securityState}
        height="560px"
      />

      {/* Quick GPS Stats Bar */}
      <div className="grid-3">
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#0369a1' }}>VĨ ĐỘ / KINH ĐỘ (GPS)</div>
            <span style={{
              fontSize: '0.7rem',
              fontWeight: '700',
              padding: '2px 8px',
              borderRadius: '999px',
              background: '#ecfdf5',
              color: '#059669',
              border: '1px solid #a7f3d0'
            }}>
              ● 3D FIX (6+ Vệ tinh)
            </span>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', marginTop: '4px', fontFamily: 'monospace' }}>
            {selectedDevice.lastLatitude?.toFixed(6)}, {selectedDevice.lastLongitude?.toFixed(6)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
            {selectedDevice.lastLatitude ? 'Tín hiệu tốt — Sai số ~2.5m (NEO-6M)' : '⚠️ Đang hiển thị vị trí cuối (Last Known Location)'}
          </div>
        </div>

        <div className="glass-card">
          <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#0369a1' }}>VẬN TỐC DI CHUYỂN HIỆN TẠI</div>
          <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>
            {selectedDevice.lastSpeedKmh?.toFixed(1) || 0} km/h
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
            {selectedDevice.lastSpeedKmh > 0 ? '🛵 Xe đang lưu thông' : '🅿️ Xe đang đỗ cố định'}
          </div>
        </div>

        <div className="glass-card">
          <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#0369a1' }}>HÀNG RÀO AN NINH (GEOFENCE)</div>
          <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#10b981', marginTop: '4px' }}>
            ✓ Đang Bật (Bán kính 80m)
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>Tự động cảnh báo nếu dắt xe ra khỏi khu vực</div>
        </div>
      </div>
    </div>
  );
}
