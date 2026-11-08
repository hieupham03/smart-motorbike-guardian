import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  ShieldOff,
  Lock,
  Unlock,
  Volume2,
  VolumeX,
  RotateCcw,
} from "lucide-react";
import { useDevice } from "../../context/DeviceContext";
import {
  commandLabel,
  commandFeedback,
  reasonLabel,
} from "../../services/presentation";
import StepUpConfirmModal from "./StepUpConfirmModal";

export default function QuickControlPanel({ developer = false }) {
  const {
    selectedDevice: device,
    sendDeviceCommand,
    isArming,
    commands,
  } = useDevice();
  const [lockOpen, setLockOpen] = useState(false);
  const [commandId, setCommandId] = useState(null);
  const [error, setError] = useState(null);
  const active = commands.find((c) => c.cmdId === commandId);
  const pending = isArming || commands.some((c) => c.status === "PENDING");
  const allowed = ["OWNER", "ADMIN"].includes(device?.currentUserRole);
  const ready = device?.lifecycleState === "ACTIVE";
  useEffect(() => {
    setCommandId(null);
    setError(null);
    setLockOpen(false);
  }, [device?.deviceId, device?.currentUserRole]);
  const send = async (type, password) => {
    if (!allowed || !ready || pending) return;
    setError(null);
    try {
      const result = await sendDeviceCommand(type, null, password);
      if (result?.data) setCommandId(result.data.cmdId);
    } catch (e) {
      setError(reasonLabel(e.message));
      throw e;
    }
  };
  const request = (type) => {
    if (type === "LOCK_ENGINE") {
      setLockOpen(true);
      return;
    }
    if (
      ["REBOOT", "SIREN_ON"].includes(type) &&
      !window.confirm(`${commandLabel(type)} cho ${device?.name}?`)
    )
      return;
    void send(type).catch(() => {});
  };
  const actions = [
    ["ARM", ShieldCheck],
    ["DISARM", ShieldOff],
    ["LOCK_ENGINE", Lock],
    ["UNLOCK_ENGINE", Unlock],
    ["SIREN_ON", Volume2],
    ["SIREN_OFF", VolumeX],
    ...(developer ? [["REBOOT", RotateCcw]] : []),
  ];
  return (
    <section className="glass-card user-section">
      <div className="section-heading">
        <h2>Điều khiển xe</h2>
        {!allowed && (
          <span className="status-pill status-pill--neutral">
            Chỉ được theo dõi
          </span>
        )}
      </div>
      <p className="muted">
        Bật bảo vệ sau khi bánh xe đã dừng. Thiết bị sẽ kiểm tra điều kiện trước
        khi thực hiện.
      </p>
      {allowed && !ready && (
        <p className="notice notice-warning">
          Thiết bị chưa kết nối. Bạn có thể điều khiển khi kết nối được khôi
          phục.
        </p>
      )}
      <div className="control-actions">
        {actions.map(([type, Icon]) => (
          <button
            key={type}
            className={`control-action${type === "LOCK_ENGINE" ? " control-action--danger" : ""}`}
            onClick={() => request(type)}
            disabled={
              !allowed ||
              !ready ||
              pending ||
              (type === "ARM" && device.securityState === "ARMED") ||
              (type === "DISARM" && device.securityState === "PARKED") ||
              (type === "LOCK_ENGINE" && device.securityState === "THEFT_LOCK")
            }
          >
            <Icon size={23} aria-hidden="true" />
            <span>{commandLabel(type)}</span>
          </button>
        ))}
      </div>
      {pending && !active && (
        <p role="status" className="notice notice-info">
          Đang gửi yêu cầu, vui lòng chờ thiết bị phản hồi.
        </p>
      )}
      {active && (
        <p
          role="status"
          className={`notice ${active.status === "EXECUTED" ? "notice-success" : active.status === "PENDING" ? "notice-info" : "notice-warning"}`}
        >
          {commandFeedback(active)}
        </p>
      )}
      {error && (
        <p role="alert" className="notice notice-danger">
          {error}
        </p>
      )}
      <StepUpConfirmModal
        isOpen={lockOpen}
        onClose={() => setLockOpen(false)}
        onConfirm={(password) => send("LOCK_ENGINE", password)}
        currentSpeed={device?.speedValid ? device.lastSpeedKmh : null}
      />
    </section>
  );
}
