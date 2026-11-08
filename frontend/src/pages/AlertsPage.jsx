import React, { useState } from "react";
import {
  alertStatusLabel,
  severityLabel,
  alertDescription,
  reasonLabel,
} from "../services/presentation";
import { useDevice } from "../context/DeviceContext";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { alertReasonLabel } from "../services/alertLabels";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  ShieldCheck,
  Filter,
  AlertOctagon,
} from "lucide-react";

export default function AlertsPage() {
  const { alerts, devices, fetchAlerts, fetchDevices } = useDevice();
  const { role } = useAuth();
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [feedback, setFeedback] = useState(null);

  const canResolve = (alert) =>
    ["OWNER", "ADMIN"].includes(
      devices.find((d) => d.deviceId === alert.deviceId)?.currentUserRole,
    );

  const handleAcknowledge = async (alertId) => {
    try {
      await api.acknowledgeAlert(alertId);
      setFeedback("Đã xác nhận cảnh báo");
      await fetchAlerts();
    } catch (err) {
      setFeedback(`Lỗi: ${err.message}`);
    }
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleResolve = async (alertId) => {
    const action = prompt(
      "Nhập hành động đã xử lý sự cố này (Ví dụ: Đã kiểm tra xe an toàn / Đã khoá cổ xe):",
      "Đã kiểm tra xe an toàn",
    );
    if (!action) return;

    try {
      await api.resolveAlert(alertId, action);
      setFeedback("Đã đánh dấu xử lý hoàn tất cảnh báo");
      await fetchAlerts();
      await fetchDevices();
    } catch (err) {
      setFeedback(`Lỗi: ${err.message}`);
    }
    setTimeout(() => setFeedback(null), 3000);
  };

  const filteredAlerts = alerts.filter((a) => {
    if (filterStatus === "ALL") return true;
    return a.status === filterStatus;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
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
            <AlertTriangle size={26} color="#ef4444" /> Cảnh báo của bạn
          </h1>
          <p className="page-subtitle">
            Những thông báo từ xe cần bạn kiểm tra và theo dõi.
          </p>
        </div>

        {/* Filter */}
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            background: "#ffffff",
            border: "1px solid #bae6fd",
            padding: "3px",
            borderRadius: "10px",
          }}
        >
          {["ALL", "OPEN", "ACKNOWLEDGED", "RESOLVED"].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`btn btn-sm ${filterStatus === s ? "btn-primary" : "btn-secondary"}`}
              style={{ border: "none", boxShadow: "none" }}
            >
              {s === "ALL"
                ? "Tất cả"
                : s === "OPEN"
                  ? "Chưa xử lý"
                  : s === "ACKNOWLEDGED"
                    ? "Đã xem"
                    : "Đã giải quyết"}
            </button>
          ))}
        </div>
      </div>

      {feedback && (
        <div
          style={{
            padding: "0.75rem 1rem",
            borderRadius: "10px",
            background: "#f0fdf4",
            color: "#166534",
            border: "1px solid #bbf7d0",
            fontWeight: "600",
          }}
        >
          ✓ {feedback}
        </div>
      )}

      {/* Alerts List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {filteredAlerts.length === 0 ? (
          <div
            className="glass-card"
            style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}
          >
            <ShieldCheck
              size={48}
              color="#10b981"
              style={{ margin: "0 auto 1rem" }}
            />
            <h3
              style={{
                fontSize: "1.2rem",
                color: "#0f172a",
                fontWeight: "700",
              }}
            >
              Không có cảnh báo phù hợp
            </h3>
            <p style={{ fontSize: "0.875rem", marginTop: "0.25rem" }}>
              Chưa có thông báo trong bộ lọc này. Hãy kiểm tra thêm trạng thái
              kết nối của xe.
            </p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isCritical =
              alert.severity === "CRITICAL" || alert.severity === "HIGH";
            const isOpen = alert.status === "OPEN";

            return (
              <div
                key={alert.alertId}
                className="glass-card"
                style={{
                  borderLeft: `6px solid ${isCritical ? "#ef4444" : "#f59e0b"}`,
                  padding: "1.25rem 1.5rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "1rem",
                }}
              >
                <div style={{ flex: 1, minWidth: "280px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.65rem",
                      marginBottom: "0.35rem",
                    }}
                  >
                    <span
                      className={`badge badge-${alert.severity.toLowerCase()}`}
                    >
                      {severityLabel(alert.severity)}
                    </span>
                    <span
                      style={{
                        fontSize: "1.05rem",
                        fontWeight: "800",
                        color: "#0c4a6e",
                      }}
                    >
                      {alertReasonLabel(alert.reason)}
                    </span>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: "#64748b",
                        background: "#f1f5f9",
                        padding: "2px 8px",
                        borderRadius: "4px",
                      }}
                    >
                      Xe: {alert.deviceName || alert.deviceId}
                    </span>
                  </div>

                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: "#334155",
                      marginTop: "0.25rem",
                    }}
                  >
                    {alertDescription(alert.reason)}
                  </p>

                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "#64748b",
                      marginTop: "0.5rem",
                      display: "flex",
                      gap: "1.25rem",
                    }}
                  >
                    <span>
                      Thời gian nhận cảnh báo:{" "}
                      <strong>
                        {new Date(alert.createdAt).toLocaleString()}
                      </strong>
                    </span>
                    {alert.actionTaken && (
                      <span>
                        Nội dung xử lý:{" "}
                        <strong>{reasonLabel(alert.actionTaken)}</strong>
                      </span>
                    )}
                    {alert.resolvedByEmail && (
                      <span>
                        Xử lý bởi: <strong>{alert.resolvedByEmail}</strong>
                      </span>
                    )}
                  </div>
                </div>

                {/* Status Badge & Actions */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                  }}
                >
                  <span className={`badge badge-${alert.status.toLowerCase()}`}>
                    {alertStatusLabel(alert.status)}
                  </span>

                  {isOpen && (
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleAcknowledge(alert.alertId)}
                    >
                      Xác nhận đã xem
                    </button>
                  )}

                  {alert.status !== "RESOLVED" && canResolve(alert) && (
                    <button
                      className="btn btn-sm btn-success"
                      onClick={() => handleResolve(alert.alertId)}
                    >
                      <CheckCircle size={15} /> Xử lý hoàn tất
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
