import React from "react";
import {
  commandLabel,
  commandStatusLabel,
  reasonLabel,
} from "../services/presentation";
import { useDevice } from "../context/DeviceContext";
import {
  Terminal,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

export default function CommandHistoryPage() {
  const { selectedDevice, commands } = useDevice();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <h1 className="page-title">
          <Terminal size={26} color="#0284c7" /> Lịch sử điều khiển
        </h1>
        <p className="page-subtitle">
          Xem yêu cầu đã gửi và phản hồi từ thiết bị trên xe.
        </p>
      </div>

      <div className="glass-card" style={{ padding: "1.5rem" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1rem",
          }}
        >
          <h3 style={{ fontSize: "1rem", fontWeight: "800", color: "#0c4a6e" }}>
            DANH SÁCH LỆNH CỦA THIẾT BỊ: {selectedDevice?.name}
          </h3>
          <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
            {commands.length} bản ghi
          </span>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Loại Lệnh</th>
                <th>Người Gửi</th>
                <th>Trạng Thái</th>
                <th>Lý Do Từ Chối (Nếu có)</th>
                <th>Thời Gian Gửi</th>
                <th>Thời gian phản hồi</th>
              </tr>
            </thead>
            <tbody>
              {commands.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      textAlign: "center",
                      padding: "2rem",
                      color: "#64748b",
                    }}
                  >
                    Chưa có lệnh nào được gửi tới thiết bị này.
                  </td>
                </tr>
              ) : (
                commands.map((cmd) => {
                  const isSuccess = cmd.status === "EXECUTED";
                  const isRejected = ["REJECTED", "TIMEOUT"].includes(
                    cmd.status,
                  );
                  const isPending = cmd.status === "PENDING";

                  return (
                    <tr key={cmd.cmdId}>
                      <td>
                        <span style={{ fontWeight: "800", color: "#0f172a" }}>
                          {commandLabel(cmd.type)}
                        </span>
                      </td>
                      <td>
                        {cmd.issuedByName || cmd.issuedByEmail || "Hệ thống"}
                      </td>
                      <td>
                        <span
                          className={`badge ${isSuccess ? "badge-armed" : isRejected ? "badge-alarm" : "badge-medium"}`}
                        >
                          {commandStatusLabel(cmd.status)}
                        </span>
                      </td>
                      <td
                        style={{
                          color: isRejected ? "#dc2626" : "#64748b",
                          fontWeight: isRejected ? "700" : "normal",
                        }}
                      >
                        {reasonLabel(cmd.reasonIfFailed) || "—"}
                        {cmd.lateAckAt && (
                          <div>
                            Thiết bị phản hồi sau thời gian chờ:{" "}
                            {commandStatusLabel(cmd.lateAckResult)} ·{" "}
                            {reasonLabel(cmd.lateAckReason)}
                          </div>
                        )}
                      </td>
                      <td style={{ fontSize: "0.8rem" }}>
                        {cmd.issuedAt
                          ? new Date(cmd.issuedAt).toLocaleString()
                          : "N/A"}
                      </td>
                      <td style={{ fontSize: "0.8rem" }}>
                        {cmd.ackAt
                          ? new Date(cmd.ackAt).toLocaleString()
                          : isPending
                            ? "Đang chờ..."
                            : "Chưa có phản hồi"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
