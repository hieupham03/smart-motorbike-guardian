import React, { useState, useEffect } from 'react';
import { useDevice } from '../context/DeviceContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import SpeedometerGauge from '../components/dashboard/SpeedometerGauge';
import BatteryIndicator from '../components/dashboard/BatteryIndicator';
import AccelLiveChart from '../components/dashboard/AccelLiveChart';
import QuickControlPanel from '../components/dashboard/QuickControlPanel';
import VirtualTestbedSimulator from '../components/dashboard/VirtualTestbedSimulator';
import LiveGpsMap from '../components/map/LiveGpsMap';
import { Shield, AlertTriangle, Radio, CheckCircle, RefreshCw, Bike, BellRing, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DashboardPage() {
  const { selectedDevice, alerts, loading } = useDevice();
  const { user, role } = useAuth();
  const [telemetryHistory, setTelemetryHistory] = useState([]);

  useEffect(() => {
    async function loadTelemetry() {
      if (selectedDevice) {
        try {
          const res = await api.getTelemetryHistory(selectedDevice.deviceId);
          if (res.success && res.data) {
            const sorted = [...res.data].sort((a, b) => (a.ts || 0) - (b.ts || 0));
            setTelemetryHistory(sorted);
          }
        } catch (err) {
          console.error(err);
        }
      }
    }
    loadTelemetry();
    const interval = setInterval(loadTelemetry, 2500);
    return () => clearInterval(interval);
  }, [selectedDevice]);

  if (loading && !selectedDevice) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#0284c7' }}>
        <RefreshCw className="animate-spin" size={32} />
        <div style={{ marginTop: '1rem', fontWeight: '700' }}>Đang kết nối hệ thống IoT Guardian...</div>
      </div>
    );
  }

  if (!selectedDevice) {
    return (
      <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
        <Bike size={48} color="#0284c7" style={{ margin: '0 auto 1rem' }} />
        <h3 style={{ fontSize: '1.35rem', color: '#0c4a6e', fontWeight: '800' }}>Chưa có thiết bị nào được kích hoạt</h3>
        <p style={{ color: '#64748b', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
          Vui lòng quét mã QR hoặc nhập Claim Token trên Gateway Node để bắt đầu giám sát xe của bạn.
        </p>
        <Link to="/devices" className="btn btn-primary btn-lg">
          Kích hoạt thiết bị mới
        </Link>
      </div>
    );
  }

  const latestTel = telemetryHistory.length > 0 ? telemetryHistory[telemetryHistory.length - 1] : null;
  const speed = latestTel?.speedKmh ?? selectedDevice.lastSpeedKmh ?? 0;
  const battery = latestTel?.batteryV ?? selectedDevice.lastBatteryV ?? 12.6;
  const state = selectedDevice.securityState || 'PARKED';
  const openAlerts = alerts.filter(a => a.status === 'OPEN');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Top Banner: Device Info & Security Mode Alert */}
      <div className="glass-card" style={{
        padding: '1.15rem 1.5rem',
        background: state === 'ALARM' ? 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)' :
                    state === 'THEFT_LOCK' ? 'linear-gradient(135deg, #f3e8ff 0%, #fae8ff 100%)' :
                    state === 'ARMED' ? 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' :
                    'linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)',
        borderLeft: `6px solid ${state === 'ALARM' ? '#ef4444' : state === 'THEFT_LOCK' ? '#9333ea' : state === 'ARMED' ? '#10b981' : '#0284c7'}`
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.85rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0c4a6e' }}>
                {selectedDevice.name}
              </h2>
              <span className={`badge badge-${state.toLowerCase().replace('_', '-')}`}>
                {state === 'ARMED' ? '🛡️ ĐANG CANH GIỮ' :
                 state === 'ALARM' ? '🚨 ĐANG BÁO ĐỘNG!' :
                 state === 'THEFT_LOCK' ? '🔒 ĐÃ KHOÁ ĐỘNG CƠ' : 'PARKED (BÌNH THƯỜNG)'}
              </span>
            </div>
            <div style={{ fontSize: '0.825rem', color: '#475569', marginTop: '0.35rem', display: 'flex', flexWrap: 'wrap', gap: '0.85rem' }}>
              <span>Biển số: <strong style={{ color: '#0f172a' }}>{selectedDevice.licensePlate || 'N/A'}</strong></span>
              <span>• Dòng xe: <strong style={{ color: '#0f172a' }}>{selectedDevice.vehicleModel || 'ESP32 IoT Node'}</strong></span>
              <span>• Firmware: <strong style={{ color: '#0f172a' }}>{selectedDevice.firmwareVersion}</strong></span>
              <span>• Giao thức: <strong style={{ color: '#0f172a' }}>UART Framing 115200</strong></span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.725rem', color: '#64748b' }}>Trạng thái mạng Gateway</div>
              <div style={{ fontSize: '0.825rem', fontWeight: '800', color: selectedDevice.lifecycleState === 'ACTIVE' ? '#16a34a' : '#dc2626' }}>
                MQTT TLS: {selectedDevice.lifecycleState}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Alarm Banner if ALARM is active */}
      {state === 'ALARM' && (
        <div style={{
          background: '#fef2f2',
          border: '2px solid #ef4444',
          borderRadius: '14px',
          padding: '0.85rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          animation: 'pulse-glow 1.5s infinite',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <BellRing size={26} color="#dc2626" />
            <div>
              <div style={{ fontSize: '1rem', fontWeight: '800', color: '#991b1b' }}>
                CẢNH BÁO XÂM PHẠM / SỰ CỐ KHẨN CẤP ĐANG KÍCH HOẠT!
              </div>
              <div style={{ fontSize: '0.8rem', color: '#b91c1c' }}>
                Hệ thống phát hiện chuyển động bất thường khi đang bật chế độ canh giữ. Còi báo động tại chỗ đang kêu.
              </div>
            </div>
          </div>
          <Link to="/alerts" className="btn btn-danger btn-sm">
            Xem Chi Tiết Sự Cố
          </Link>
        </div>
      )}

      {/* 3 Main Realtime Sensor Gauges (Grid-3) */}
      <div className="grid-3">
        {/* Speedometer */}
        <SpeedometerGauge speed={speed} maxSpeed={selectedDevice.speedThresholdKmh ? selectedDevice.speedThresholdKmh * 1.25 : 120} />
        
        {/* Battery Monitor */}
        <BatteryIndicator voltage={battery} lowThreshold={selectedDevice.batteryLowThresholdV || 11.5} />

        {/* Accelerometer Waveform & Tilt */}
        <AccelLiveChart
          telemetryHistory={telemetryHistory}
          currentX={telemetryHistory.length > 0 ? telemetryHistory[telemetryHistory.length - 1].accelX : 0}
          currentY={telemetryHistory.length > 0 ? telemetryHistory[telemetryHistory.length - 1].accelY : 0}
          currentZ={telemetryHistory.length > 0 ? telemetryHistory[telemetryHistory.length - 1].accelZ : 1}
        />
      </div>

      {/* Actuator Controls + GPS Map (Grid 1.8fr / 1.2fr) */}
      <div className="grid-main-side">
        {/* Left Column: Control Panel & Virtual Testbed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <QuickControlPanel />
          <VirtualTestbedSimulator />
        </div>

        {/* Right Column: Live GPS Map Mini Widget & Recent Alerts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <LiveGpsMap
            latitude={selectedDevice.lastLatitude}
            longitude={selectedDevice.lastLongitude}
            deviceName={selectedDevice.name}
            licensePlate={selectedDevice.licensePlate}
            speed={speed}
            securityState={state}
            height="360px"
          />

          {/* Recent Open Alerts list */}
          <div className="glass-card" style={{ marginTop: '1.25rem', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: '800', color: '#0c4a6e', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertTriangle size={18} color="#eab308" /> SỰ CỐ MỚI ({openAlerts.length})
              </span>
              <Link to="/alerts" style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: '700', textDecoration: 'none' }}>
                Tất cả &rarr;
              </Link>
            </div>

            {openAlerts.length === 0 ? (
              <div style={{ fontSize: '0.8rem', color: '#10b981', textAlign: 'center', padding: '1rem 0' }}>
                ✓ Không có sự cố nào chưa xử lý. Xe đang an toàn.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {openAlerts.slice(0, 3).map(a => (
                  <div key={a.alertId} style={{
                    padding: '0.65rem 0.85rem',
                    borderRadius: '10px',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    fontSize: '0.8rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', color: '#991b1b' }}>
                      <span>{a.reason}</span>
                      <span className={`badge badge-${a.severity.toLowerCase()}`}>{a.severity}</span>
                    </div>
                    <div style={{ color: '#475569', fontSize: '0.75rem', marginTop: '2px' }}>
                      {a.details || a.actionTaken}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
