import React from "react";
import { Link } from "react-router-dom";
import {
  Bike,
  ShieldCheck,
  MapPin,
  AlertTriangle,
  ArrowRight,
  Clock,
  Activity,
} from "lucide-react";
import { useDevice } from "../context/DeviceContext";
import QuickControlPanel from "../components/dashboard/QuickControlPanel";
import WheelSessionCard from "../components/dashboard/WheelSessionCard";
import LiveGpsMap from "../components/map/LiveGpsMap";
import { alertReasonLabel } from "../services/alertLabels";
import {
  securityLabel,
  lifecycleLabel,
  sourceLabel,
  severityLabel,
} from "../services/presentation";

export default function DashboardPage() {
  const {
    selectedDevice: device,
    alerts,
    loading,
    error,
    wheelSession,
  } = useDevice();
  if (loading && !device)
    return (
      <div className="empty-state" role="status">
        Đang tải thông tin xe…
      </div>
    );
  if (!device)
    return (
      <div className="empty-state glass-card">
        <Bike size={42} aria-hidden="true" />
        <h1>Thêm xe đầu tiên của bạn</h1>
        <p>Kết nối thiết bị trên xe hoặc nhờ chủ xe chia sẻ quyền theo dõi.</p>
        <Link to="/devices" className="btn btn-primary">
          Quản lý xe
        </Link>
      </div>
    );
  const openAlerts = alerts.filter(
    (a) => a.status === "OPEN" && a.deviceId === device.deviceId,
  );
  const speed =
    device.speedValid && Number.isFinite(device.lastSpeedKmh)
      ? device.lastSpeedKmh
      : null;
  const state = device.securityState;
  return (
    <div className="user-dashboard">
      <div className="page-heading">
        <div>
          <p className="eyebrow">XE CỦA BẠN</p>
          <h1>Theo dõi xe, an tâm hơn</h1>
          <p>Tình trạng và những cập nhật gần nhất, ngay tại đây.</p>
        </div>
        <Link className="btn btn-secondary" to="/devices">
          <Bike size={18} aria-hidden="true" /> Xe của tôi
        </Link>
      </div>
      {error && (
        <p className="notice notice-warning" role="alert">
          Chưa cập nhật được một số thông tin. Kiểm tra mạng rồi thử lại.
        </p>
      )}
      {device.dataSource !== "HARDWARE" && (
        <p className="notice notice-warning" role="status">
          {sourceLabel(device.dataSource)} · Các số liệu này không xác nhận tình
          trạng xe ngoài thực tế.
        </p>
      )}
      <section
        className={`vehicle-hero vehicle-hero--${state?.toLowerCase() || "unknown"}`}
        aria-label="Tình trạng xe"
      >
        <div className="vehicle-hero__info">
          <div className="vehicle-avatar">
            <Bike size={36} aria-hidden="true" />
          </div>
          <div>
            <p className="eyebrow">
              {device.licensePlate || "Chưa thêm biển số"}
            </p>
            <h2>{device.name}</h2>
            <p>{device.vehicleModel || "Thiết bị giám sát xe"}</p>
          </div>
        </div>
        <div className="vehicle-hero__status">
          <span
            className={`status-pill status-pill--${state === "ALARM" ? "danger" : state === "ARMED" ? "success" : "neutral"}`}
          >
            <ShieldCheck size={17} aria-hidden="true" />
            {securityLabel(state)}
          </span>
          <span className="muted">
            {state === "PARKED"
              ? "Bật bảo vệ sau khi đỗ xe để nhận cảnh báo tác động."
              : state === "ARMED"
                ? "Xe đang được canh giữ. Bạn sẽ thấy cảnh báo khi có tác động."
                : state === "THEFT_LOCK"
                  ? "Kiểm tra tình trạng xe trước khi mở khóa."
                  : "Kiểm tra thông báo và tình trạng xe."}
          </span>
        </div>
      </section>
      <div className="overview-grid">
        <section className="metric-card">
          <Activity size={21} aria-hidden="true" />
          <span>Tốc độ gần nhất</span>
          <strong>
            {speed == null ? "—" : speed.toFixed(1)} <small>km/h</small>
          </strong>
          <p>
            {speed == null
              ? "Chưa có dữ liệu tốc độ mới."
              : wheelSession?.overspeedActive
                ? "Đang vượt ngưỡng cảnh báo."
                : "Cập nhật từ cảm biến trên xe."}
          </p>
        </section>
        <section className="metric-card">
          <ShieldCheck size={21} aria-hidden="true" />
          <span>Kết nối thiết bị</span>
          <strong className="metric-card__text">
            {lifecycleLabel(device.lifecycleState)}
          </strong>
          <p>
            {device.sensorConnected
              ? "Đang nhận thông tin mới từ xe."
              : "Thông tin cảm biến chưa được cập nhật."}
          </p>
        </section>
        <section className="metric-card">
          <AlertTriangle size={21} aria-hidden="true" />
          <span>Cảnh báo chưa xem</span>
          <strong>{openAlerts.length}</strong>
          <Link to="/alerts">
            Xem các cảnh báo <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </section>
      </div>
      <p className="last-updated">
        <Clock size={15} aria-hidden="true" />
        Cập nhật từ xe:{" "}
        {device.lastTelemetryAt
          ? new Date(device.lastTelemetryAt).toLocaleString("vi-VN")
          : "Chưa nhận được dữ liệu"}
      </p>
      <div className="dashboard-columns">
        <div className="dashboard-column">
          <QuickControlPanel />
          <WheelSessionCard />
        </div>
        <div className="dashboard-column">
          <LiveGpsMap
            gpsValid={device.gpsValid}
            lastLocationReceivedAt={device.lastLocationReceivedAt}
            latitude={device.lastLatitude}
            longitude={device.lastLongitude}
            deviceName={device.name}
            licensePlate={device.licensePlate}
            speed={speed}
            securityState={state}
            height="310px"
          />
          <section className="glass-card user-section">
            <div className="section-heading">
              <h2>Cần bạn chú ý</h2>
              <Link to="/alerts">Xem tất cả</Link>
            </div>
            {openAlerts.length ? (
              openAlerts.slice(0, 3).map((alert) => (
                <Link
                  className="alert-preview"
                  to="/alerts"
                  key={alert.alertId}
                >
                  <AlertTriangle size={20} aria-hidden="true" />
                  <div>
                    <strong>{alertReasonLabel(alert.reason)}</strong>
                    <p>
                      {severityLabel(alert.severity)} ·{" "}
                      {new Date(alert.createdAt).toLocaleString("vi-VN")}
                    </p>
                  </div>
                  <ArrowRight size={17} aria-hidden="true" />
                </Link>
              ))
            ) : (
              <p className="muted">
                Chưa có cảnh báo mới. Tình trạng kết nối và dữ liệu được hiển
                thị riêng phía trên.
              </p>
            )}
          </section>
        </div>
      </div>
      <p className="prototype-note">
        Thiết bị thử nghiệm trên mô hình. Luôn kiểm tra tình trạng xe thực tế
        khi có cảnh báo.
      </p>
    </div>
  );
}
