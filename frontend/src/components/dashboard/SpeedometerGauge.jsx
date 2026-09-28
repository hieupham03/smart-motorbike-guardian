import React from 'react';
import { Gauge, Activity } from 'lucide-react';

export default function SpeedometerGauge({ speed = 0, maxSpeed = 120 }) {
  const clampedSpeed = Math.min(Math.max(speed, 0), maxSpeed);
  const percentage = clampedSpeed / maxSpeed;
  
  // Angle for speedometer needle: sweeps 180 degrees from -90deg (0 km/h) to +90deg (maxSpeed)
  const needleAngle = -90 + percentage * 180;

  // Status text & color
  const isMoving = clampedSpeed > 0;
  const isOverSpeed = clampedSpeed > 80;

  return (
    <div className="glass-card dashboard-card" style={{ padding: '1.25rem 1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.825rem', fontWeight: '700', color: '#0369a1', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Gauge size={18} color="#0284c7" /> TỐC ĐỘ XE (HALL SENSOR)
        </span>
        <span className={`badge ${isOverSpeed ? 'badge-critical' : isMoving ? 'badge-armed' : 'badge-offline'}`}>
          {isOverSpeed ? 'VƯỢT TỐC' : isMoving ? 'ĐANG CHẠY' : 'ĐANG DỪNG'}
        </span>
      </div>

      {/* Main Gauge Graphic */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '0.5rem 0' }}>
        <div style={{ position: 'relative', width: '220px', height: '125px' }}>
          <svg width="220" height="125" viewBox="0 0 220 125" style={{ overflow: 'visible' }}>
            <defs>
              <linearGradient id="speedArcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="60%" stopColor="#0284c7" />
                <stop offset="100%" stopColor="#ef4444" />
              </linearGradient>
              <filter id="needleShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.3" />
              </filter>
            </defs>

            {/* Background Track Arc (Radius: 85, Center: 110, 115) */}
            <path
              d="M 25 115 A 85 85 0 0 1 195 115"
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="12"
              strokeLinecap="round"
            />

            {/* Active Color Arc (Circumference of half circle = PI * 85 ~= 267) */}
            <path
              d="M 25 115 A 85 85 0 0 1 195 115"
              fill="none"
              stroke="url(#speedArcGrad)"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray="267"
              strokeDashoffset={267 - percentage * 267}
              style={{ transition: 'stroke-dashoffset 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}
            />

            {/* Minor Ticks */}
            {[0, 0.25, 0.5, 0.75, 1].map((p, i) => {
              const tickAngle = (-180 + p * 180) * (Math.PI / 180);
              const x1 = 110 + 72 * Math.cos(tickAngle);
              const y1 = 115 + 72 * Math.sin(tickAngle);
              const x2 = 110 + 64 * Math.cos(tickAngle);
              const y2 = 115 + 64 * Math.sin(tickAngle);
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#94a3b8"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              );
            })}

            {/* Needle Pivot & Pointer */}
            <g transform={`translate(110, 115) rotate(${needleAngle})`} style={{ transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }} filter="url(#needleShadow)">
              <line x1="0" y1="0" x2="0" y2="-76" stroke="#0f172a" strokeWidth="3.5" strokeLinecap="round" />
              <line x1="0" y1="0" x2="0" y2="-65" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" />
              <circle cx="0" cy="0" r="8" fill="#0f172a" />
              <circle cx="0" cy="0" r="4" fill="#38bdf8" />
            </g>
          </svg>
        </div>

        {/* Digital Speed Display - Perfectly positioned below the arc */}
        <div style={{ textAlign: 'center', marginTop: '-10px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: '4px' }}>
            <span style={{ fontSize: '2.4rem', fontWeight: '900', color: isOverSpeed ? '#ef4444' : '#0c4a6e', lineHeight: 1, letterSpacing: '-0.03em' }}>
              {clampedSpeed.toFixed(1)}
            </span>
            <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#64748b' }}>km/h</span>
          </div>
        </div>
      </div>

      {/* Footer Meta */}
      <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#64748b' }}>
        <span>0 km/h</span>
        <span style={{ fontWeight: '600', color: '#0369a1' }}>Max: {maxSpeed} km/h</span>
        <span>{maxSpeed} km/h</span>
      </div>
    </div>
  );
}

