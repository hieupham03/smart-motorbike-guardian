import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Lock, Mail, ArrowRight, UserCheck, KeyRound, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const { login, quickLogin } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Đăng nhập không thành công');
    } finally {
      setLoading(false);
    }
  };

  const handleQuick = async (role) => {
    setError('');
    setLoading(true);
    try {
      await quickLogin(role);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Đăng nhập nhanh thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #bae6fd 100%)'
    }}>
      <div className="glass-card" style={{
        maxWidth: '460px',
        width: '100%',
        padding: '2.5rem',
        borderRadius: '24px',
        background: 'rgba(255, 255, 255, 0.95)',
        boxShadow: '0 20px 40px -10px rgba(2, 132, 199, 0.2)'
      }}>
        
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 8px 20px rgba(2, 132, 199, 0.35)',
            marginBottom: '1rem'
          }}>
            <Shield size={32} />
          </div>
          <h2 style={{ fontSize: '1.65rem', fontWeight: '800', color: '#0c4a6e', letterSpacing: '-0.03em' }}>
            Motorbike Guardian
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.25rem' }}>
            Hệ thống IoT Giám Sát &amp; Bảo Vệ Xe Máy Đa Node
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Địa chỉ Email:</label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                className="form-input"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Mật khẩu:</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div style={{
              background: '#fef2f2',
              color: '#991b1b',
              padding: '0.75rem',
              borderRadius: '8px',
              fontSize: '0.825rem',
              fontWeight: '600',
              marginBottom: '1rem',
              border: '1px solid #fecaca'
            }}>
              {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Đang xác thực...' : 'Đăng Nhập'}
            <ArrowRight size={18} />
          </button>
        </form>

        {/* Demo Fast Login Switcher */}
        <div style={{ marginTop: '1.75rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#0369a1', textTransform: 'uppercase', marginBottom: '0.75rem', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
            <Sparkles size={14} /> ĐĂNG NHẬP NHANH DEMO (1-CLICK)
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-sm btn-secondary"
              onClick={() => handleQuick('owner')}
              style={{ fontSize: '0.75rem', padding: '0.6rem 0.25rem' }}
            >
              Chủ xe (Owner)
            </button>
            <button
              type="button"
              className="btn btn-sm btn-secondary"
              onClick={() => handleQuick('viewer')}
              style={{ fontSize: '0.75rem', padding: '0.6rem 0.25rem' }}
            >
              Người thân (Viewer)
            </button>
            <button
              type="button"
              className="btn btn-sm btn-secondary"
              onClick={() => handleQuick('admin')}
              style={{ fontSize: '0.75rem', padding: '0.6rem 0.25rem' }}
            >
              Quản trị (Admin)
            </button>
          </div>
        </div>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: '#64748b' }}>
          Chưa có tài khoản?{' '}
          <Link to="/register" style={{ color: '#0284c7', fontWeight: '700', textDecoration: 'none' }}>
            Đăng ký ngay
          </Link>
        </div>

      </div>
    </div>
  );
}
