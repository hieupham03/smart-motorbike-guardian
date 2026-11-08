import React, { useEffect, useState } from "react";
import { Download } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { useDevice } from "../context/DeviceContext";
import { api } from "../services/api";
import { securityLabel, sourceLabel } from "../services/presentation";
export default function TelemetryAnalyticsPage() {
  const { selectedDevice: device, telemetry } = useDevice();
  const [data, setData] = useState([]),
    [range, setRange] = useState("24h"),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(null),
    [exporting, setExporting] = useState(false);
  const times = () => {
    const to = Math.floor(Date.now() / 1000);
    return {
      to,
      from: to - (range === "1h" ? 3600 : range === "7d" ? 604800 : 86400),
    };
  };
  useEffect(() => {
    let active = true;
    setData([]);
    setError(null);
    if (!device) return;
    setLoading(true);
    const to = Math.floor(Date.now() / 1000),
      from = to - (range === "1h" ? 3600 : range === "7d" ? 604800 : 86400);
    api
      .getTelemetryHistory(device.deviceId, from, to)
      .then((res) => {
        if (active) setData(res.data || []);
      })
      .catch(() => {
        if (active)
          setError(
            "Chưa tải được lịch sử. Kiểm tra mạng rồi chọn lại khoảng thời gian.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [device?.deviceId, range]);
  useEffect(() => {
    if (!telemetry || telemetry.deviceId !== device?.deviceId) return;
    setData((old) =>
      [...old.filter((d) => d.readingId !== telemetry.readingId), telemetry]
        .sort((a, b) => a.ts - b.ts)
        .slice(-5000),
    );
  }, [telemetry, device?.deviceId]);
  if (!device)
    return <div className="empty-state">Chọn xe trước khi xem lịch sử.</div>;
  const speeds = data
    .filter((d) => d.speedValid && Number.isFinite(d.speedKmh))
    .map((d) => d.speedKmh);
  const chart = data.map((d) => ({
    time: new Date((d.ts || 0) * 1000).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    speed: d.speedValid ? d.speedKmh : null,
  }));
  const exportData = async () => {
    setExporting(true);
    setError(null);
    try {
      const { from, to } = times();
      await api.exportTelemetryCsv(device.deviceId, from, to);
    } catch {
      setError("Chưa tải được bảng dữ liệu. Vui lòng thử lại.");
    } finally {
      setExporting(false);
    }
  };
  return (
    <div className="user-dashboard">
      <div className="page-heading">
        <div>
          <h1>Lịch sử hoạt động</h1>
          <p>
            {device.name} · Tối đa 5.000 bản ghi trong khoảng thời gian đã chọn.
          </p>
        </div>
        <button
          className="btn btn-primary"
          disabled={exporting}
          onClick={() => void exportData()}
        >
          <Download size={18} aria-hidden="true" />
          {exporting ? "Đang chuẩn bị…" : "Tải bảng dữ liệu"}
        </button>
      </div>
      <div
        className="section-heading"
        role="group"
        aria-label="Khoảng thời gian"
      >
        {[
          ["1h", "1 giờ"],
          ["24h", "24 giờ"],
          ["7d", "7 ngày"],
        ].map(([value, label]) => (
          <button
            key={value}
            aria-pressed={value === range}
            className={`btn ${value === range ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setRange(value)}
          >
            {label}
          </button>
        ))}
      </div>
      {device.dataSource !== "HARDWARE" && (
        <p className="notice notice-warning">
          {sourceLabel(device.dataSource)}
        </p>
      )}
      {error && (
        <p role="alert" className="notice notice-danger">
          {error}
        </p>
      )}
      <div className="overview-grid">
        {[
          [
            "Tốc độ cao nhất",
            speeds.length
              ? `${Math.max(...speeds).toFixed(1)} km/h`
              : "Chưa có dữ liệu",
          ],
          [
            "Tốc độ trung bình",
            speeds.length
              ? `${(speeds.reduce((a, b) => a + b, 0) / speeds.length).toFixed(1)} km/h`
              : "Chưa có dữ liệu",
          ],
          ["Số bản ghi", data.length.toLocaleString("vi-VN")],
        ].map(([label, value]) => (
          <div className="metric-card" key={label}>
            <span>{label}</span>
            <strong className="metric-card__text">{value}</strong>
          </div>
        ))}
      </div>
      <section className="glass-card user-section">
        <h2>Diễn biến tốc độ</h2>
        {loading ? (
          <p role="status">Đang tải lịch sử…</p>
        ) : !data.length ? (
          <p className="muted">Chưa có dữ liệu trong khoảng thời gian này.</p>
        ) : (
          <div style={{ height: 300, width: "100%", minWidth: 0 }}>
            <ResponsiveContainer>
              <LineChart data={chart} accessibilityLayer>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="time" />
                <YAxis unit=" km/h" />
                <Tooltip />
                <Legend />
                <Line
                  isAnimationActive={false}
                  type="monotone"
                  dataKey="speed"
                  name="Tốc độ"
                  stroke="#0369a1"
                  dot={false}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>
      <section className="glass-card user-section">
        <h2>Cập nhật gần đây</h2>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Thời gian</th>
                <th>Tốc độ</th>
                <th>Bảo vệ</th>
              </tr>
            </thead>
            <tbody>
              {[...data]
                .reverse()
                .slice(0, 30)
                .map((d) => (
                  <tr key={d.readingId}>
                    <td>
                      {new Date(d.receivedAt || d.ts * 1000).toLocaleString(
                        "vi-VN",
                      )}
                    </td>
                    <td>
                      {d.speedValid && Number.isFinite(d.speedKmh)
                        ? `${d.speedKmh.toFixed(1)} km/h`
                        : "Chưa có dữ liệu"}
                    </td>
                    <td>{securityLabel(d.state)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
