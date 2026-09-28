import React, { useState } from 'react';
import { useDevice } from '../../context/DeviceContext';
import { api } from '../../services/api';
import { Sliders, Zap, AlertTriangle, Play, ShieldAlert, Cpu } from 'lucide-react';

export default function VirtualTestbedSimulator() {
  const { selectedDevice, fetchDevices, fetchAlerts } = useDevice();
  const [speedSlider, setSpeedSlider] = useState(0);
  const [voltSlider, setVoltSlider] = useState(12.6);
  const [msg, setMsg] = useState('');

  if (!selectedDevice) return null;

  const handleSimAction = async (action, value) => {
    try {
      await api.triggerSimulatorAction(selectedDevice.deviceId, action, value);
      setMsg(`Mô phỏng thành công [${action}] với giá trị: ${value !== null ? value : 'N/A'}`);
      await fetchDevices();
      await fetchAlerts();
    } catch (err) {
      setMsg(`Lỗi mô phỏng: ${err.message}`);
    }
    setTimeout(() => setMsg(''), 4000);
  };

  return (
    <div className="glass-card" style={{
      background: 'linear-gradient(135deg, rgba(240, 249, 255, 0.95) 0%, rgba(224, 242, 254, 0.85) 100%)',
      border: '1.5px dashed #0284c7',
      padding: '1.25rem 1.5rem'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: '#0284c7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff'
          }}>
            <Cpu size={18} />
          </div>
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0c4a6e' }}>
              BỘ GIẢ LẬP PHẦN CỨNG TESTBED (VIRTUAL IOT SIMULATOR)
            </h4>
            <div style={{ fontSize: '0.75rem', color: '#0369a1' }}>
              Mô phỏng tín hiệu cảm biến Hall, MPU6050, LM2596 để kiểm thử kịch bản an toàn (S-07 / FR-04)
            </div>
          </div>
        </div>
        <span className="badge badge-active" style={{ background: '#0284c7', color: '#fff' }}>
          Testbed Demo Mode
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
        
        {/* Speed Slider Simulation */}
        <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '12px', border: '1px solid #bae6fd' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.5rem' }}>
            <span>Động cơ & Tốc độ bánh xe (Hall):</span>
            <span style={{ color: '#0284c7', fontSize: '0.95rem' }}>{speedSlider} km/h</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={speedSlider}
            onChange={(e) => setSpeedSlider(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#0284c7', cursor: 'pointer' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
            <button
              className="btn btn-sm btn-secondary"
              onClick={() => { setSpeedSlider(0); handleSimAction('SET_SPEED', 0); }}
            >
              Dừng xe (0 km/h)
            </button>
            <button
              className="btn btn-sm btn-primary"
              onClick={() => handleSimAction('SET_SPEED', speedSlider)}
            >
              Gửi tốc độ ({speedSlider} km/h)
            </button>
          </div>
        </div>

        {/* Battery Voltage Slider Simulation */}
        <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '12px', border: '1px solid #bae6fd' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.5rem' }}>
            <span>Điện áp nguồn ắc quy (LM2596):</span>
            <span style={{ color: voltSlider < 11.5 ? '#ef4444' : '#10b981', fontSize: '0.95rem' }}>{voltSlider.toFixed(1)} V</span>
          </div>
          <input
            type="range"
            min="10.0"
            max="13.2"
            step="0.2"
            value={voltSlider}
            onChange={(e) => setVoltSlider(Number(e.target.value))}
            style={{ width: '100%', accentColor: voltSlider < 11.5 ? '#ef4444' : '#10b981', cursor: 'pointer' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
            <button
              className="btn btn-sm btn-danger"
              onClick={() => { setVoltSlider(11.2); handleSimAction('SET_BATTERY', 11.2); }}
            >
              Ắc quy yếu (11.2V)
            </button>
            <button
              className="btn btn-sm btn-primary"
              onClick={() => handleSimAction('SET_BATTERY', voltSlider)}
            >
              Gửi điện áp ({voltSlider.toFixed(1)}V)
            </button>
          </div>
        </div>

      </div>

      {/* Incident Quick Simulators */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '1rem' }}>
        <button
          className="btn btn-sm btn-danger"
          onClick={() => handleSimAction('TRIGGER_FALL', null)}
          style={{ background: '#fef2f2', color: '#991b1b', borderColor: '#fca5a5' }}
        >
          <AlertTriangle size={15} /> Giả lập Ngã xe / Rơi ngã (&gt; 55° MPU6050)
        </button>

        <button
          className="btn btn-sm btn-secondary"
          onClick={() => handleSimAction('TRIGGER_THEFT_TAMPER', null)}
          style={{ background: '#fffbeb', color: '#92400e', borderColor: '#fde68a' }}
        >
          <ShieldAlert size={15} /> Giả lập Cắt dây / Cạy khoá
        </button>
      </div>

      {msg && (
        <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#0369a1', fontWeight: '700' }}>
          {msg}
        </div>
      )}
    </div>
  );
}
