import React from 'react';
import { Activity } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function AccelLiveChart({ telemetryHistory = [], currentX = null, currentY = null, currentZ = null }) {
  // Format data for chart
  const data = (telemetryHistory.slice(-15) || []).map((t, idx) => ({
    time: t.ts ? new Date(t.ts * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : `t-${idx}`,
    X: t.accelX != null ? Number(t.accelX.toFixed(2)) : null,
    Y: t.accelY != null ? Number(t.accelY.toFixed(2)) : null,
    Z: t.accelZ != null ? Number(t.accelZ.toFixed(2)) : null,
  }));

  const chartData = data;
  const valid = [currentX, currentY, currentZ].every(Number.isFinite);
  const tiltDeg = valid ? Math.round(Math.atan2(Math.hypot(currentX, currentY), currentZ) * 180 / Math.PI) : null;
  const isDangerousTilt = tiltDeg > 45;

  return (
    <div className="glass-card dashboard-card" style={{ padding: '1.25rem 1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.825rem', fontWeight: '700', color: '#0369a1', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Activity size={18} color="#0284c7" /> CẢM BIẾN GIA TỐC MPU6050
        </span>
        <span className={`badge ${!valid ? 'badge-offline' : isDangerousTilt ? 'badge-critical' : 'badge-armed'}`}>
          {!valid ? 'CHƯA CÓ DỮ LIỆU' : isDangerousTilt ? `⚠️ NGHIÊNG (${tiltDeg}°)` : `NGHIÊNG: ${tiltDeg}°`}
        </span>
      </div>

      {/* Compact 3-Axis Badges */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', margin: '0.5rem 0' }}>
        <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', padding: '0.35rem 0.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#0284c7' }}>TRỤC X</div>
          <div style={{ fontSize: '1rem', fontWeight: '800', color: '#0c4a6e' }}>{(Number.isFinite(currentX) ? currentX.toFixed(2) : '—')} <span style={{ fontSize: '0.7rem', color: '#64748b' }}>m/s²</span></div>
        </div>
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '0.35rem 0.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#16a34a' }}>TRỤC Y</div>
          <div style={{ fontSize: '1rem', fontWeight: '800', color: '#0c4a6e' }}>{(Number.isFinite(currentY) ? currentY.toFixed(2) : '—')} <span style={{ fontSize: '0.7rem', color: '#64748b' }}>m/s²</span></div>
        </div>
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '0.35rem 0.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#d97706' }}>TRỤC Z</div>
          <div style={{ fontSize: '1rem', fontWeight: '800', color: '#0c4a6e' }}>{(Number.isFinite(currentZ) ? currentZ.toFixed(2) : '—')} <span style={{ fontSize: '0.7rem', color: '#64748b' }}>m/s²</span></div>
        </div>
      </div>

      {/* Waveform Chart */}
      <div style={{ height: '95px', width: '100%', marginTop: 'auto' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="2 2" stroke="#f1f5f9" />
            <XAxis dataKey="time" hide />
            <YAxis domain={[-12, 12]} tick={{ fontSize: 9, fill: '#94a3b8' }} ticks={[-10, 0, 10]} />
            <Tooltip
              contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '8px', border: '1px solid #bae6fd', fontSize: '11px', padding: '4px 8px' }}
            />
            <Line type="monotone" dataKey="X" stroke="#0284c7" strokeWidth={1.75} dot={false} isAnimationActive={false} />
            <Line type="monotone" dataKey="Y" stroke="#10b981" strokeWidth={1.75} dot={false} isAnimationActive={false} />
            <Line type="monotone" dataKey="Z" stroke="#f59e0b" strokeWidth={1.75} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Meta */}
      <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.5rem', fontSize: '0.75rem', color: '#94a3b8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>I2C Bus: Wire (0x68)</span>
        <span>Ngưỡng ngã: &gt; 45°</span>
      </div>
    </div>
  );
}

