import React, { useState } from "react";
import {
  lifecycleLabel,
  securityLabel,
  roleLabel,
  sourceLabel,
} from "../services/presentation";
import { useDevice } from "../context/DeviceContext";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import OnboardModal from "../components/devices/OnboardModal";
import DeviceConfigModal from "../components/devices/DeviceConfigModal";
import InviteViewerModal from "../components/devices/InviteViewerModal";
import {
  Bike,
  Plus,
  Settings2,
  UserPlus,
  ShieldAlert,
  Trash2,
  PowerOff,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export default function DevicesPage() {
  const { devices, selectedDevice, setSelectedDevice, fetchDevices } =
    useDevice();
  const { role } = useAuth();
  const [isOnboardOpen, setIsOnboardOpen] = useState(false);
  const [configDevice, setConfigDevice] = useState(null);
  const [inviteDeviceId, setInviteDeviceId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const isViewer = role === "VIEWER";

  const handleRevoke = async (deviceId, name) => {
    if (
      !window.confirm(
        `Ngừng nhận dữ liệu và điều khiển thiết bị của xe [${name}]? Việc này không tự ngắt nguồn hoặc dừng xe.`,
      )
    ) {
      return;
    }
    try {
      await api.revokeDevice(deviceId);
      setFeedback({
        type: "success",
        message: `Đã thu hồi quyền kết nối của [${name}] thành công`,
      });
      await fetchDevices();
    } catch (err) {
      setFeedback({ type: "error", message: err.message });
    }
  };

  const handleDecommission = async (deviceId, name) => {
    if (
      !window.confirm(
        `CẢNH BÁO: Bạn có chắc muốn NGỪNG SỬ DỤNG VĨNH VIỄN (Decommission) thiết bị [${name}]? Thao tác này không thể hoàn tác.`,
      )
    ) {
      return;
    }
    try {
      await api.decommissionDevice(deviceId);
      setFeedback({
        type: "success",
        message: `Đã ngừng sử dụng thiết bị [${name}]`,
      });
      await fetchDevices();
    } catch (err) {
      setFeedback({ type: "error", message: err.message });
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Page Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <h1 className="page-title">
            <Bike size={26} color="#0284c7" /> Xe của tôi
          </h1>
          <p className="page-subtitle">
            Thêm xe, cập nhật thông tin và chia sẻ quyền theo dõi với người
            thân.
          </p>
        </div>

        {!isViewer && (
          <button
            className="btn btn-primary"
            onClick={() => setIsOnboardOpen(true)}
          >
            <Plus size={18} /> Thêm xe
          </button>
        )}
      </div>

      {feedback && (
        <div
          style={{
            padding: "0.85rem 1rem",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            gap: "0.65rem",
            fontSize: "0.875rem",
            fontWeight: "600",
            background: feedback.type === "error" ? "#fef2f2" : "#f0fdf4",
            color: feedback.type === "error" ? "#991b1b" : "#166534",
            border: `1px solid ${feedback.type === "error" ? "#fecaca" : "#bbf7d0"}`,
          }}
        >
          {feedback.type === "error" ? (
            <AlertCircle size={20} />
          ) : (
            <CheckCircle2 size={20} />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Devices Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fill, minmax(min(100%, 320px), 1fr))",
          gap: "1.25rem",
        }}
      >
        {devices.map((device) => {
          const isSelected = selectedDevice?.deviceId === device.deviceId;
          const isOwner =
            device.currentUserRole === "OWNER" || role === "ADMIN";

          return (
            <div
              key={device.deviceId}
              className="glass-card"
              style={{
                borderColor: isSelected ? "#0284c7" : "var(--border-card)",
                boxShadow: isSelected
                  ? "0 0 0 2px rgba(2, 132, 199, 0.35)"
                  : "var(--shadow-md)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                {/* Header */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "0.75rem",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "1.15rem",
                        fontWeight: "800",
                        color: "#0c4a6e",
                      }}
                    >
                      {device.name}
                    </div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "#64748b",
                        fontFamily: "monospace",
                      }}
                    >
                      {sourceLabel(device.dataSource)}
                    </div>
                  </div>
                  <span
                    className={`badge badge-${device.lifecycleState.toLowerCase()}`}
                  >
                    {lifecycleLabel(device.lifecycleState)}
                  </span>
                </div>

                {/* Details list */}
                <div
                  style={{
                    background: "#f8fafc",
                    padding: "0.85rem",
                    borderRadius: "10px",
                    fontSize: "0.825rem",
                    color: "#334155",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.35rem",
                    marginBottom: "1rem",
                  }}
                >
                  <div>
                    Biển số:{" "}
                    <strong>{device.licensePlate || "Chưa cập nhật"}</strong>
                  </div>
                  <div>
                    Dòng xe:{" "}
                    <strong>
                      {device.vehicleModel || "Chưa thêm dòng xe"}
                    </strong>
                  </div>
                  <div>
                    Trạng thái an ninh:{" "}
                    <strong>{securityLabel(device.securityState)}</strong>
                  </div>
                  <div>
                    Tốc độ gần nhất:{" "}
                    <strong>
                      {device.speedValid
                        ? (device.lastSpeedKmh?.toFixed(1) ?? "—")
                        : "—"}{" "}
                      km/h
                    </strong>
                  </div>

                  <div>
                    Vai trò của bạn:{" "}
                    <strong style={{ color: "#0284c7" }}>
                      {roleLabel(device.currentUserRole)}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "0.5rem",
                  borderTop: "1px solid #f1f5f9",
                  paddingTop: "0.85rem",
                }}
              >
                <button
                  className={`btn btn-sm ${isSelected ? "btn-primary" : "btn-secondary"}`}
                  onClick={() => setSelectedDevice(device)}
                  style={{ flex: 1 }}
                >
                  {isSelected ? "Đang xem" : "Xem tình trạng"}
                </button>

                {isOwner && (
                  <>
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => setConfigDevice(device)}
                      aria-label="Sửa thông tin xe"
                      title="Sửa thông tin xe"
                    >
                      <Settings2 size={16} />
                    </button>
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => setInviteDeviceId(device.deviceId)}
                      aria-label="Chia sẻ theo dõi"
                      title="Chia sẻ theo dõi"
                    >
                      <UserPlus size={16} />
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleRevoke(device.deviceId, device.name)}
                      aria-label="Ngừng nhận dữ liệu thiết bị"
                      title="Ngừng nhận dữ liệu thiết bị"
                    >
                      <PowerOff size={16} />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modals */}
      <OnboardModal
        isOpen={isOnboardOpen}
        onClose={() => setIsOnboardOpen(false)}
        onSuccess={(newDev) => {
          fetchDevices();
          setFeedback({
            type: "success",
            message: `Kích hoạt thành công thiết bị [${newDev.name}]`,
          });
        }}
      />

      <DeviceConfigModal
        isOpen={!!configDevice}
        device={configDevice}
        onClose={() => setConfigDevice(null)}
        onSuccess={(updated) => {
          fetchDevices();
          setFeedback({
            type: "success",
            message: `Cập nhật cấu hình cho [${updated.name}] thành công`,
          });
        }}
      />

      <InviteViewerModal
        isOpen={!!inviteDeviceId}
        deviceId={inviteDeviceId}
        onClose={() => setInviteDeviceId(null)}
        onSuccess={() => {
          setFeedback({
            type: "success",
            message: "Đã cấp quyền truy cập thành công cho người dùng",
          });
        }}
      />
    </div>
  );
}
