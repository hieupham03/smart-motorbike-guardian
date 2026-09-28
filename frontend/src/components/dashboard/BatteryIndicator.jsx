import React from 'react';
import { Zap, BatteryCharging, AlertCircle } from 'lucide-react';

export default function BatteryIndicator({ voltage = 12.6, lowThreshold = 11.5 }) {
  // Mapping voltage (10.5V -> 0%, 13.0V -> 100%)
  const percentage = Math.min(100, Math.max(0, Math.round(((voltage - 10.5) / 2.5) * 100)));
  const isLow = voltage < lowThreshold;

  let statusColor = '#10b981'; // Green
  let statusText = 'BÌNH THƯỜNG';
  let badgeClass = 'badge-armed';

  if (percentage < 20 || isLow) {
    statusColor = '#ef4444';
    statusText = 'YẾU / CẦN SẠC';
    badgeClass = 'badge-critical';
  } else if (percentage < 50) {
    statusColor = '#f59e0b';
    statusText = 'TRUNG BÌNH';
    badgeClass = 'badge-medium';
  }

  return (
    <div className="glass-card dashboard-card" style={{ padding: '1.25rem 1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.825rem', fontWeight: '700', color: '#0369a1', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Zap size={18} color="#0284c7" /> ĐIỆN ÁP ẮC QUY (LM2596 ADC)
        </span>
        <span className={`badge ${badgeClass}`}>
          {statusText}
        </span>
      </div>

      {/* Main Battery Graphic & Numerical Stats */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.75rem', margin: '0.5rem 0' }}>
        {/* Battery Visual Pillar */}
        <div style={{
          width: '54px',
          height: '110px',
          border: '3px solid #334155',
          borderRadius: '10px',
          padding: '3px',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          background: '#f8fafc',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)'
        }}>
          {/* Top Battery Terminal / Anode */}
          <div style={{
            position: 'absolute',
            top: '-8px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '20px',
            height: '5px',
            background: '#334155',
            borderRadius: '3px 3px 0 0'
          }} />

          {/* Liquid Fill Level */}
          <div style={{
            width: '100%',
            height: `${percentage}%`,
            background: `linear-gradient(to top, ${statusColor}, ${statusColor}cc)`,
            borderRadius: '5px',
            transition: 'height 0.4s cubic-bezier(0.16, 1, 0.3, 1), background 0.3s ease'
          }} />
        </div>

        {/* Numeric Values */}
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <span style={{ fontSize: '2.4rem', fontWeight: '900', color: statusColor, lineHeight: 1, letterSpacing: '-0.03em' }}>
              {voltage.toFixed(2)}
            </span>
            <span style={{ fontSize: '1rem', fontWeight: '800', color: '#64748b' }}>V</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
            <span style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a' }}>{percentage}%</span>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600' }}>Dung lượng</span>
          </div>

          <div style={{ fontSize: '0.725rem', color: isLow ? '#ef4444' : '#64748b', marginTop: '4px', fontWeight: '600' }}>
            Ngưỡng ngắt: &lt; {lowThreshold.toFixed(1)}V
          </div>
        </div>
      </div>

      {/* Footer Meta */}
      <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.5rem', fontSize: '0.75rem', color: '#94a3b8', display: 'flex', justifyContent: 'space-between' }}>
        <span>ADC1_CH6 (GPIO34)</span>
        <span>Phân áp LM2596</span>
      </div>
    </div>
  );
}

