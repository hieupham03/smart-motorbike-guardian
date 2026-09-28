import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { ShieldAlert, Users, Bike, FileText, Lock, Unlock, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AdminPage() {
  const { role } = useAuth();
  const [tab, setTab] = useState('users'); // users, devices, audit
  const [users, setUsers] = useState([]);
  const [devices, setDevices] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      if (tab === 'users') {
        const res = await api.getAdminUsers();
        if (res.success) setUsers(res.data);
      } else if (tab === 'devices') {
        const res = await api.getAdminDevices();
        if (res.success) setDevices(res.data);
      } else if (tab === 'audit') {
        const res = await api.getAuditLogs();
        if (res.success) setAuditLogs(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role === 'ADMIN') {
      loadData();
    }
  }, [tab, role]);

  const handleToggleUserStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await api.updateUserStatus(userId, newStatus);
      setFeedback(`Đã chuyển trạng thái người dùng thành ${newStatus}`);
      await loadData();
    } catch (err) {
      setFeedback(`Lỗi: ${err.message}`);
    }
    setTimeout(() => setFeedback(null), 3000);
  };

  if (role !== 'ADMIN') {
    return (
      <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: '#dc2626' }}>
        <ShieldAlert size={48} style={{ margin: '0 auto 1rem' }} />
        <h3 style={{ fontSize: '1.25rem', fontWeight: '800' }}>403 - KHÔNG CÓ QUYỀN TRUY CẬP</h3>
        <p style={{ marginTop: '0.5rem', color: '#64748b' }}>
          Trang này chỉ dành riêng cho Quản trị viên hệ thống (Admin). Vui lòng đăng nhập tài khoản Admin.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      <div>
        <h1 className="page-title">
          <ShieldAlert size={26} color="#0284c7" /> Cổng Quản Trị Hệ Thống (Admin Portal)
        </h1>
        <p className="page-subtitle">
          Quản lý toàn diện tài khoản người dùng, thiết bị phần cứng và Nhật ký kiểm toán (Audit Trail)
        </p>
      </div>

      {feedback && (
        <div style={{ padding: '0.75rem 1rem', borderRadius: '10px', background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', fontWeight: '600' }}>
          ✓ {feedback}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid #bae6fd', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setTab('users')}
          className={`btn ${tab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Users size={18} /> Quản lý Người Dùng ({users.length})
        </button>
        <button
          onClick={() => setTab('devices')}
          className={`btn ${tab === 'devices' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Bike size={18} /> Quản lý Thiết Bị ({devices.length})
        </button>
        <button
          onClick={() => setTab('audit')}
          className={`btn ${tab === 'audit' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <FileText size={18} /> Nhật Ký Kiểm Toán (Audit Log)
        </button>
      </div>

      {/* Tab 1: Users */}
      {tab === 'users' && (
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Họ Tên</th>
                  <th>Email</th>
                  <th>Vai Trò</th>
                  <th>Trạng Thái</th>
                  <th>Ngày Tạo</th>
                  <th style={{ textAlign: 'right' }}>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.userId}>
                    <td style={{ fontWeight: '700' }}>{u.fullName}</td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`badge ${u.role === 'ADMIN' ? 'badge-alarm' : u.role === 'OWNER' ? 'badge-armed' : 'badge-low'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: u.status === 'ACTIVE' ? '#10b981' : '#ef4444', fontWeight: '700' }}>
                        ● {u.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem' }}>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}</td>
                    <td style={{ textAlign: 'right' }}>
                      {u.role !== 'ADMIN' && (
                        <button
                          className={`btn btn-sm ${u.status === 'ACTIVE' ? 'btn-danger' : 'btn-success'}`}
                          onClick={() => handleToggleUserStatus(u.userId, u.status)}
                        >
                          {u.status === 'ACTIVE' ? <Lock size={14} /> : <Unlock size={14} />}
                          {u.status === 'ACTIVE' ? 'Khoá' : 'Mở khoá'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Devices */}
      {tab === 'devices' && (
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tên Thiết Bị</th>
                  <th>UUID</th>
                  <th>Biển Số</th>
                  <th>Lifecycle</th>
                  <th>An Ninh</th>
                  <th>Firmware</th>
                </tr>
              </thead>
              <tbody>
                {devices.map(d => (
                  <tr key={d.deviceId}>
                    <td style={{ fontWeight: '700' }}>{d.name}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#0369a1' }}>{d.deviceUuid}</td>
                    <td>{d.licensePlate || 'N/A'}</td>
                    <td>
                      <span className={`badge badge-${d.lifecycleState.toLowerCase()}`}>{d.lifecycleState}</span>
                    </td>
                    <td>
                      <span className={`badge badge-${d.securityState.toLowerCase().replace('_', '-')}`}>{d.securityState}</span>
                    </td>
                    <td>{d.firmwareVersion} ({d.hwVersion})</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Audit Logs */}
      {tab === 'audit' && (
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Thời Gian (UTC)</th>
                  <th>Người Thực Hiện</th>
                  <th>Hành Động (Action)</th>
                  <th>Kết Quả</th>
                  <th>Chi Tiết</th>
                  <th>IP Nguồn</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map(l => (
                  <tr key={l.logId}>
                    <td style={{ fontSize: '0.8rem' }}>{l.createdAt ? new Date(l.createdAt).toLocaleString() : 'N/A'}</td>
                    <td style={{ fontWeight: '600' }}>{l.userName || l.userEmail || 'System'}</td>
                    <td>
                      <span style={{ fontWeight: '700', color: '#0369a1' }}>{l.action}</span>
                    </td>
                    <td>
                      <span className={`badge ${l.result === 'SUCCESS' ? 'badge-armed' : 'badge-alarm'}`}>
                        {l.result}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.825rem', color: '#475569' }}>{l.details}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{l.sourceIp || '127.0.0.1'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
