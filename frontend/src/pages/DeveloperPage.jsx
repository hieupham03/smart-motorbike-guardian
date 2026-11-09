import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Wrench, RefreshCw } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useDevice } from "../context/DeviceContext";
import { canUseDeveloperTools } from "../services/presentation";
import AccelLiveChart from "../components/dashboard/AccelLiveChart";
import BatteryIndicator from "../components/dashboard/BatteryIndicator";
import VirtualTestbedSimulator from "../components/dashboard/VirtualTestbedSimulator";
import QuickControlPanel from "../components/dashboard/QuickControlPanel";
import WheelSessionCard from "../components/dashboard/WheelSessionCard";
import DeviceConfigModal from "../components/devices/DeviceConfigModal";
import DeviceConnectionTools from "../components/devices/DeviceConnectionTools";

export default function DeveloperPage() {
  const { role } = useAuth();
  const {
    selectedDevice: device,
    telemetry,
    telemetryHistory,
    realtimeStatus,
    commands,
    wheelSession,
    fetchDevices,
    fetchAlerts,
  } = useDevice();
  const [configOpen, setConfigOpen] = useState(false);
  if (!canUseDeveloperTools(role, device?.currentUserRole))
    return (
      <div className="empty-state">
        <h1>Khu vực chẩn đoán</h1>
        <p>
          Cần quyền chủ xe hoặc quản trị viên để mở công cụ thử nghiệm cho xe đã
          chọn.
        </p>
        <Link to="/">Về tổng quan</Link>
      </div>
    );
  return (
    <div className="user-dashboard">
      <div className="page-heading">
        <div>
          <p className="eyebrow">DÀNH CHO DEV / KIỂM THỬ</p>
          <h1>
            <Wrench size={27} aria-hidden="true" /> Chẩn đoán & thử nghiệm
          </h1>
          <p>
            Thông tin kỹ thuật được giữ ở đây để đối chiếu và kiểm tra tích hợp.
          </p>
        </div>
        <button
          className="btn btn-secondary"
          onClick={() => {
            void fetchDevices();
            void fetchAlerts();
          }}
        >
          <RefreshCw size={17} aria-hidden="true" />
          Lấy lại dữ liệu
        </button>
      </div>
      <p className="notice notice-warning">
        Công cụ điều khiển có thể tác động tới thiết bị thật. Bộ giả lập chỉ
        hoạt động với thiết bị SIMULATED và quyền chủ xe/quản trị.
      </p>
      <section className="glass-card user-section">
        <h2>Kết nối & giao thức</h2>
        <dl className="diagnostic-grid">
          {Object.entries({
            WebSocket: realtimeStatus,
            deviceId: device?.deviceId,
            deviceUuid: device?.deviceUuid,
            source: device?.dataSource,
            firmware: device?.firmwareVersion,
            hardware: device?.hwVersion,
            lifecycle: device?.lifecycleState,
            security: device?.securityState,
            sensorConnected: device?.sensorConnected,
            speedValid: device?.speedValid,
            imuValid: device?.imuValid,
            gpsValid: device?.gpsValid,
            gpsAgeMs: device?.gpsAgeMs,
            "UART payload": "39 B + wheel sample 13 B",
            "UART framing": "0xAA / type / length / payload / XOR",
            "UART baud": "115200",
            lastTelemetryAt: device?.lastTelemetryAt,
          }).map(([key, value]) => (
            <div key={key}>
              <dt>{key}</dt>
              <dd>{value == null ? "null" : String(value)}</dd>
            </div>
          ))}
        </dl>
      </section>
      <div className="overview-grid">
        <AccelLiveChart
          telemetryHistory={telemetryHistory}
          currentX={device?.imuValid ? telemetry?.accelX : null}
          currentY={device?.imuValid ? telemetry?.accelY : null}
          currentZ={device?.imuValid ? telemetry?.accelZ : null}
          simulatedTiltThreshold={device?.dataSource === "SIMULATED" ? device?.fallThresholdDeg : null}
        />
        <BatteryIndicator
          voltage={device?.lastBatteryV}
          lowThreshold={device?.batteryLowThresholdV || 11.5}
        />
      </div>
      <QuickControlPanel developer />
      <DeviceConnectionTools key={device?.deviceId} device={device} admin={role === 'ADMIN'} onRefresh={fetchDevices} />
      <WheelSessionCard developer />
      {device?.dataSource === "SIMULATED" && (
        <button
          className="btn btn-secondary"
          onClick={() => setConfigOpen(true)}
        >
          Cấu hình ngưỡng mô phỏng
        </button>
      )}
      <VirtualTestbedSimulator />
      <details className="glass-card user-section">
        <summary>Dữ liệu nhận gần nhất & kết quả lệnh gốc</summary>
        <pre className="diagnostic-json">
          {JSON.stringify(
            { telemetry, wheelSession, commands: commands.slice(0, 20) },
            null,
            2,
          )}
        </pre>
      </details>
      <DeviceConfigModal
        isOpen={configOpen}
        onClose={() => setConfigOpen(false)}
        device={device}
        onSuccess={() => void fetchDevices()}
        developer
      />
    </div>
  );
}
