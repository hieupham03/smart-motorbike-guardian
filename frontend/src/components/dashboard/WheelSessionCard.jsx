import React, { useEffect, useState } from "react";
import { useDevice } from "../../context/DeviceContext";
import { commandFeedback, reasonLabel } from "../../services/presentation";
import SpeedLimitSettings from "./SpeedLimitSettings";
const number = (v, d = 0) =>
  Number(v).toLocaleString("vi-VN", { maximumFractionDigits: d });
export default function WheelSessionCard({ developer = false }) {
  const {
    selectedDevice: device,
    wheelSession: session,
    sendDeviceCommand,
    isArming,
    commands,
  } = useDevice();
  const [id, setId] = useState(null),
    [error, setError] = useState(null);
  useEffect(() => {
    setId(null);
    setError(null);
  }, [device?.deviceId]);
  if (device?.dataSource !== "HARDWARE") return null;
  const age = session ? Date.now() - Date.parse(session.receivedAt) : Infinity;
  const fresh = !!(
    session?.fresh &&
    device.sensorConnected &&
    age >= -1000 &&
    age <= 5000
  );
  const canReset = ["OWNER", "ADMIN"].includes(device.currentUserRole) && fresh;
  const command = commands.find((c) => c.cmdId === id),
    pending = isArming || commands.some((c) => c.status === "PENDING");
  async function reset() {
    if (
      !window.confirm(
        "Bắt đầu phiên mới? Thống kê của phiên hiện tại sẽ bắt đầu lại từ 0.",
      )
    )
      return;
    setError(null);
    try {
      const r = await sendDeviceCommand("RESET_WHEEL_SESSION");
      if (r?.data) setId(r.data.cmdId);
    } catch (e) {
      setError(reasonLabel(e.message));
    }
  }
  const cells = session
    ? [
        ["Quãng đường quy đổi", `${number(session.distanceM, 2)} m`],
        ["Tốc độ cao nhất", `${number(session.maxSpeedKmh, 1)} km/h`],
        ["Thời gian phiên", `${number(session.elapsedMs / 1000)} giây`],
        ...(developer
          ? [
              ["Số xung Hall", number(session.pulseCount)],
              ["Số vòng", number(session.revolutions, 2)],
              ["Thời gian có xung", `${number(session.movingMs / 1000)} s`],
            ]
          : []),
      ]
    : [];
  return (
    <section className="glass-card user-section" aria-label="Thống kê phiên">
      <div className="section-heading">
        <h2>Thống kê phiên</h2>
        <button
          className="btn btn-secondary"
          onClick={reset}
          disabled={!canReset || pending}
        >
          Bắt đầu phiên mới
        </button>
      </div>
      <p className="muted">
        Quãng đường ước tính theo vòng bánh, không phải hành trình trên bản đồ.
      </p>
      {!session ? (
        <p role="status">Đang chờ thông tin từ xe.</p>
      ) : (
        <>
          <p
            className={`notice ${!fresh ? "notice-warning" : session.overspeedActive ? "notice-danger" : "notice-info"}`}
            role="status"
          >
            {!fresh
              ? "Chưa có cập nhật mới. Đang giữ thống kê lần cuối."
              : session.overspeedActive
                ? "Xe đang vượt ngưỡng tốc độ cảnh báo."
                : "Thống kê đang được cập nhật."}
          </p>
          <div className="session-metrics">
            {cells.map(([label, value]) => (
              <div key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
          <p className="muted">
            Cảnh báo tốc độ: {number(session.speedLimitKmh, 1)} km/h. Chức năng
            này không tự giảm tốc hoặc khóa xe.
          </p>
        </>
      )}
      <SpeedLimitSettings key={device.deviceId} />
      {command && (
        <p role="status" className="notice notice-info">
          {commandFeedback(command)}
        </p>
      )}
      {error && (
        <p role="alert" className="notice notice-danger">
          {error}
        </p>
      )}
      <p className="fine-print">
        Phiên bắt đầu lại khi thiết bị khởi động lại hoặc khi bạn chọn bắt đầu
        phiên mới.
      </p>
    </section>
  );
}
