import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Bike,
  MapPin,
  LineChart,
  AlertTriangle,
  Terminal,
  Users,
  ShieldAlert,
  UserCheck,
  Settings
} from 'lucide-react';

export default function Sidebar() {
  const { role } = useAuth();

  const navItems = [
    { to: '/', label: 'Tổng quan Realtime', icon: LayoutDashboard },
    { to: '/devices', label: 'Quản lý Thiết bị', icon: Bike },
    { to: '/map', label: 'Bản đồ & Định vị', icon: MapPin },
    { to: '/analytics', label: 'Lịch sử & Xuất CSV', icon: LineChart },
    { to: '/alerts', label: 'Trung tâm Cảnh báo', icon: AlertTriangle },
    { to: '/commands', label: 'Lịch sử Lệnh', icon: Terminal },
    { to: '/users', label: 'Người dùng & Viewer', icon: Users, hideForViewer: true },
    ...(role === 'ADMIN' ? [{ to: '/admin', label: 'Cổng Quản trị Admin', icon: ShieldAlert }] : []),
    { to: '/profile', label: 'Tài khoản & Bảo mật', icon: Settings },
  ];

  return (
    <aside style={{
      width: '260px',
      background: 'rgba(255, 255, 255, 0.78)',
      backdropFilter: 'blur(16px)',
      borderRight: '1px solid var(--border-card)',
      display: 'flex',
      flexDirection: 'column',
      padding: '1.25rem 0.85rem'
    }}>
      <div style={{ padding: '0 0.75rem 1.25rem', fontSize: '0.75rem', fontWeight: 800, color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        MENU ĐIỀU KHIỂN
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1 }}>
        {navItems.map((item) => {
          if (item.hideForViewer && role === 'VIEWER') return null;
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.7rem 1rem',
                borderRadius: '12px',
                fontSize: '0.885rem',
                fontWeight: isActive ? '700' : '600',
                textDecoration: 'none',
                color: isActive ? '#0284c7' : '#475569',
                background: isActive ? '#e0f2fe' : 'transparent',
                border: isActive ? '1px solid #bae6fd' : '1px solid transparent',
                transition: 'all 0.15s ease'
              })}
            >
              <Icon size={19} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Embedded Hardware & UART Protocol Info Box */}
      <div style={{
        marginTop: 'auto',
        background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
        border: '1px solid #bae6fd',
        borderRadius: '14px',
        padding: '0.85rem'
      }}>
        <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#0369a1', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0284c7', display: 'inline-block' }} />
          KIẾN TRÚC ĐA NODE
        </div>
        <div style={{ fontSize: '0.7rem', color: '#0c4a6e', marginTop: '4px', lineHeight: '1.4' }}>
          • Sensor: Hall, IMU, ADC<br/>
          • UART: 115200 0xAA..0x55<br/>
          • Gateway: ESP32 + SafetyTask
        </div>
      </div>
    </aside>
  );
}
