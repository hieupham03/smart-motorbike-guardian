import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useDevice } from '../../context/DeviceContext';
import { ShieldCheck, ShieldOff, Lock, Unlock, Volume2, RotateCcw, AlertCircle, CheckCircle2 } from 'lucide-react';
import StepUpConfirmModal from './StepUpConfirmModal';

export default function QuickControlPanel() {
  const { role } = useAuth();
  const { selectedDevice, sendDeviceCommand, isArming } = useDevice();
  const [isLockModalOpen, setIsLockModalOpen] = useState(false);
  const [commandFeedback, setCommandFeedback] = useState(null);

  const isViewer = role === 'VIEWER';
  const currentState = selectedDevice?.securityState || 'PARKED';
  const speed = selectedDevice?.lastSpeedKmh || 0;

  const handleCommand = async (type, payload = null, password = null) => {
    try {
      setCommandFeedback({ type: 'info', message: `Đang gửi lệnh ${type} xuống thiết bị qua MQTT...` });
      const res = await sendDeviceCommand(type, payload, password);
      
      if (res?.success) {
        const cmdData = res.data;
        if (cmdData?.status === 'REJECTED') {
          setCommandFeedback({
            type: 'error',
            message: `Lệnh ${type} bị từ chối bởi Gateway Node! Lý do: ${cmdData.reasonIfFailed || 'Vi phạm ràng buộc an toàn'}`
          });
        } else {
          setCommandFeedback({
            type: 'success',
            message: `Lệnh ${type} đã thực thi thành công (ACK EXECUTED)!`
          });
        }
      }
    } catch (err) {
      setCommandFeedback({
        type: 'error',
        message: err.message || 'Lỗi gửi lệnh điều khiển'
      });
    }

    setTimeout(() => {
      setCommandFeedback(null);
    }, 5000);
  };

  return (
    <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0c4a6e' }}>
            BẢNG ĐIỀU KHIỂN TÁC VỤ (ACTUATOR CONTROL)
          </h3>
          <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Gửi lệnh bảo mật hai chiều qua MQTT Broker xuống Gateway ESP32
          </p>
        </div>
        {isViewer && (
          <span className="badge badge-medium" title="Bạn chỉ có quyền xem trạng thái">
            Chỉ xem (Viewer Mode)
          </span>
        )}
      </div>

      {/* Action Buttons Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.85rem' }}>
        
        {/* Arm Button */}
        <button
          className="btn btn-secondary"
          onClick={() => handleCommand('ARM')}
          disabled={isViewer || isArming || currentState === 'ARMED'}
          style={{
            flexDirection: 'column',
            padding: '1rem 0.5rem',
            background: currentState === 'ARMED' ? '#dcfce7' : '#ffffff',
            borderColor: currentState === 'ARMED' ? '#86efac' : '#bae6fd',
            color: currentState === 'ARMED' ? '#15803d' : '#0369a1',
            opacity: isViewer ? 0.6 : 1
          }}
        >
          <ShieldCheck size={26} color={currentState === 'ARMED' ? '#16a34a' : '#0284c7'} />
          <span style={{ marginTop: '6px', fontWeight: '700' }}>Bật Canh Giữ</span>
          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>ARM SYSTEM</span>
        </button>

        {/* Disarm Button */}
        <button
          className="btn btn-secondary"
          onClick={() => handleCommand('DISARM')}
          disabled={isViewer || isArming || currentState === 'PARKED'}
          style={{
            flexDirection: 'column',
            padding: '1rem 0.5rem',
            background: currentState === 'PARKED' ? '#f0f9ff' : '#ffffff',
            borderColor: currentState === 'PARKED' ? '#7dd3fc' : '#bae6fd',
            color: currentState === 'PARKED' ? '#0284c7' : '#475569',
            opacity: isViewer ? 0.6 : 1
          }}
        >
          <ShieldOff size={26} color="#64748b" />
          <span style={{ marginTop: '6px', fontWeight: '700' }}>Tắt Canh Giữ</span>
          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>DISARM</span>
        </button>

        {/* Lock Engine Button (Opens Step-up modal) */}
        <button
          className="btn btn-danger"
          onClick={() => setIsLockModalOpen(true)}
          disabled={isViewer || isArming || currentState === 'THEFT_LOCK'}
          style={{
            flexDirection: 'column',
            padding: '1rem 0.5rem',
            opacity: isViewer ? 0.6 : 1
          }}
        >
          <Lock size={26} />
          <span style={{ marginTop: '6px', fontWeight: '700' }}>Khoá Động Cơ</span>
          <span style={{ fontSize: '0.7rem', color: '#fecaca' }}>LOCK ENGINE</span>
        </button>

        {/* Unlock Engine Button */}
        <button
          className="btn btn-success"
          onClick={() => handleCommand('UNLOCK_ENGINE')}
          disabled={isViewer || isArming || currentState !== 'THEFT_LOCK'}
          style={{
            flexDirection: 'column',
            padding: '1rem 0.5rem',
            opacity: (isViewer || currentState !== 'THEFT_LOCK') ? 0.6 : 1
          }}
        >
          <Unlock size={26} />
          <span style={{ marginTop: '6px', fontWeight: '700' }}>Mở Khoá Xe</span>
          <span style={{ fontSize: '0.7rem', color: '#dcfce7' }}>UNLOCK RELAY</span>
        </button>

        {/* Siren Alert Button */}
        <button
          className="btn btn-secondary"
          onClick={() => handleCommand(currentState === 'ALARM' ? 'SIREN_OFF' : 'SIREN_ON')}
          disabled={isViewer || isArming}
          style={{
            flexDirection: 'column',
            padding: '1rem 0.5rem',
            background: currentState === 'ALARM' ? '#fee2e2' : '#ffffff',
            borderColor: currentState === 'ALARM' ? '#fca5a5' : '#bae6fd',
            color: currentState === 'ALARM' ? '#dc2626' : '#0369a1',
            opacity: isViewer ? 0.6 : 1
          }}
        >
          <Volume2 size={26} color={currentState === 'ALARM' ? '#ef4444' : '#0284c7'} />
          <span style={{ marginTop: '6px', fontWeight: '700' }}>
            {currentState === 'ALARM' ? 'Tắt Còi Hú' : 'Bật Còi Báo Động'}
          </span>
          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>SIREN BUZZER</span>
        </button>

        {/* Reboot Gateway Button */}
        <button
          className="btn btn-secondary"
          onClick={() => handleCommand('REBOOT')}
          disabled={isViewer || isArming}
          style={{
            flexDirection: 'column',
            padding: '1rem 0.5rem',
            opacity: isViewer ? 0.6 : 1
          }}
        >
          <RotateCcw size={26} color="#64748b" />
          <span style={{ marginTop: '6px', fontWeight: '700' }}>Khởi Động Lại</span>
          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>REBOOT NODE</span>
        </button>

      </div>

      {/* Realtime Command Feedback Alert Banner */}
      {commandFeedback && (
        <div style={{
          marginTop: '1.25rem',
          padding: '0.85rem 1rem',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontSize: '0.875rem',
          fontWeight: '600',
          background: commandFeedback.type === 'error' ? '#fef2f2' : commandFeedback.type === 'success' ? '#f0fdf4' : '#f0f9ff',
          border: `1px solid ${commandFeedback.type === 'error' ? '#fecaca' : commandFeedback.type === 'success' ? '#bbf7d0' : '#bae6fd'}`,
          color: commandFeedback.type === 'error' ? '#991b1b' : commandFeedback.type === 'success' ? '#166534' : '#0369a1'
        }}>
          {commandFeedback.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
          <span>{commandFeedback.message}</span>
        </div>
      )}

      {/* Step-up Confirmation Modal */}
      <StepUpConfirmModal
        isOpen={isLockModalOpen}
        onClose={() => setIsLockModalOpen(false)}
        onConfirm={(password) => handleCommand('LOCK_ENGINE', null, password)}
        currentSpeed={speed}
      />
    </div>
  );
}
