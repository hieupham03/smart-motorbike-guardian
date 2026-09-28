import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useDevice } from '../../context/DeviceContext';
import { Shield, Bell, User, LogOut, ChevronDown, Radio, Bike, KeyRound } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function Navbar() {
  const { user, role, logout, quickLogin } = useAuth();
  const { devices, selectedDevice, selectDeviceById, unreadAlertsCount } = useDevice();
  const navigate = useNavigate();

  return (
    <header className="glass-card" style={{
      borderRadius: '0',
      borderLeft: 'none',
      borderRight: 'none',
      borderTop: 'none',
      padding: '0.75rem 1.75rem',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'rgba(255, 255, 255, 0.92)',
      backdropFilter: 'blur(16px)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        
        {/* Left: Brand Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', color: 'inherit' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
          }}>
            <Shield size={20} />
          </div>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0c4a6e', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '6px' }}>
              Motorbike Guardian
              <span style={{ fontSize: '0.65rem', background: '#e0f2fe', color: '#0284c7', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>IoT v1.0</span>
            </div>
            <div style={{ fontSize: '0.725rem', color: '#64748b' }}>Hệ thống Giám sát & An ninh Xe máy</div>
          </div>
        </Link>

        {/* Center: Device Switcher */}
        {devices.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: '9999px',
              padding: '0.3rem 0.75rem'
            }}>
              <Bike size={15} color="#0284c7" />
              <select
                value={selectedDevice?.deviceId || ''}
                onChange={(e) => selectDeviceById(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontSize: '0.825rem',
                  fontWeight: '600',
                  color: '#0369a1',
                  cursor: 'pointer'
                }}
              >
                {devices.map(d => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.name} {d.licensePlate ? `(${d.licensePlate})` : ''} - [{d.securityState}]
                  </option>
                ))}
              </select>
            </div>

            {/* Gateway Online/Offline Indicator */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '0.725rem',
              fontWeight: '700',
              color: selectedDevice?.lifecycleState === 'ACTIVE' ? '#15803d' : '#64748b',
              background: selectedDevice?.lifecycleState === 'ACTIVE' ? '#dcfce7' : '#f1f5f9',
              padding: '3px 8px',
              borderRadius: '9999px'
            }}>
              <span style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: selectedDevice?.lifecycleState === 'ACTIVE' ? '#22c55e' : '#94a3b8',
                display: 'inline-block'
              }} />
              {selectedDevice?.lifecycleState === 'ACTIVE' ? 'Node Online (2s)' : (selectedDevice?.lifecycleState || 'Offline')}
            </div>
          </div>
        )}

        {/* Right: Quick Role Switcher + Alerts + Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          
          {/* Demo Quick Role Switcher Buttons */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '2px'
          }} title="Chuyển đổi nhanh vai trò để demo phân quyền RBAC">
            <button
              onClick={() => quickLogin('owner')}
              className={`btn btn-sm ${role === 'OWNER' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.725rem', padding: '3px 7px' }}
            >
              Chủ xe (Owner)
            </button>
            <button
              onClick={() => quickLogin('viewer')}
              className={`btn btn-sm ${role === 'VIEWER' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.725rem', padding: '3px 7px' }}
            >
              Người thân (Viewer)
            </button>
            <button
              onClick={() => quickLogin('admin')}
              className={`btn btn-sm ${role === 'ADMIN' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.725rem', padding: '3px 7px' }}
            >
              Quản trị (Admin)
            </button>
          </div>

          {/* Alerts Notification Bell */}
          <Link to="/alerts" style={{ position: 'relative', color: '#475569', textDecoration: 'none' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}>
              <Bell size={18} />
              {unreadAlertsCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  backgroundColor: '#ef4444',
                  color: '#fff',
                  fontSize: '0.7rem',
                  fontWeight: '700',
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(239, 68, 68, 0.4)'
                }}>
                  {unreadAlertsCount}
                </span>
              )}
            </div>
          </Link>

          {/* User Profile Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: '#e0f2fe',
              color: '#0284c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '700',
              fontSize: '0.9rem'
            }}>
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div style={{ display: 'none', md: 'block' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0f172a' }}>{user?.fullName}</div>
              <div style={{ fontSize: '0.7rem', color: '#0284c7', fontWeight: '600' }}>
                {role === 'ADMIN' ? '🛡️ Quản trị viên' : role === 'OWNER' ? '🔑 Chủ sở hữu' : '👁️ Người theo dõi'}
              </div>
            </div>

            <button
              onClick={logout}
              title="Đăng xuất"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '8px'
              }}
            >
              <LogOut size={18} />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
