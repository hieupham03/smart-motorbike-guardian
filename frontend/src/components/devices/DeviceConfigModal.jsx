import React, { useState, useEffect, useRef } from "react";
import { Settings2, X } from "lucide-react";
import { api } from "../../services/api";

export default function DeviceConfigModal({
  isOpen,
  onClose,
  device,
  onSuccess,
  developer = false,
}) {
  const [name, setName] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [speedThresholdKmh, setSpeedThresholdKmh] = useState(80);
  const [batteryLowThresholdV, setBatteryLowThresholdV] = useState(11.5);
  const [tiltThresholdDeg, setTiltThresholdDeg] = useState(45);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const editing = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      editing.current = null;
      return;
    }
    // A live device update must not overwrite text being edited in the dialog.
    if (device && editing.current !== device.deviceId) {
      editing.current = device.deviceId;
      setName(device.name || "");
      setLicensePlate(device.licensePlate || "");
      setVehicleModel(device.vehicleModel || "");
      setSpeedThresholdKmh(device.speedThresholdKmh || 80);
      setBatteryLowThresholdV(device.batteryLowThresholdV || 11.5);
      setTiltThresholdDeg(device.tiltThresholdDeg || 45);
    }
  }, [device, isOpen]);

  if (!isOpen || !device) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.updateConfig(device.deviceId, {
        name,
        licensePlate,
        vehicleModel,
        ...(developer && device.dataSource === "SIMULATED"
          ? {
              speedThresholdKmh: Number(speedThresholdKmh),
              batteryLowThresholdV: Number(batteryLowThresholdV),
              tiltThresholdDeg: Number(tiltThresholdDeg),
            }
          : {}),
      });

      if (res.success) {
        onSuccess(res.data);
        onClose();
      }
    } catch (err) {
      setError(err.message || "Lỗi khi cập nhật cấu hình");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <div
            style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "#0284c7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
              }}
            >
              <Settings2 size={20} />
            </div>
            <div>
              <h3
                style={{
                  fontSize: "1.1rem",
                  fontWeight: "800",
                  color: "#0c4a6e",
                }}
              >
                Thông tin xe
              </h3>
              <p style={{ fontSize: "0.75rem", color: "#64748b" }}>
                {device.name}
              </p>
            </div>
          </div>
          <button
            aria-label="Đóng thông tin xe"
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "#64748b",
            }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label" htmlFor="vehicle-name">
                Tên xe:
              </label>
              <input
                id="vehicle-name"
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Biển số:</label>
                <input
                  type="text"
                  className="form-input"
                  value={licensePlate}
                  onChange={(e) => setLicensePlate(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Dòng xe:</label>
                <input
                  type="text"
                  className="form-input"
                  value={vehicleModel}
                  onChange={(e) => setVehicleModel(e.target.value)}
                />
              </div>
            </div>

            {developer && (
              <div
                style={{
                  borderTop: "1px solid #e2e8f0",
                  paddingTop: "1rem",
                  marginTop: "0.5rem",
                }}
              >
                <div
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: "800",
                    color: "#0369a1",
                    marginBottom: "0.75rem",
                  }}
                >
                  NGƯỠNG MÔ PHỎNG
                </div>
                {device.dataSource !== "SIMULATED" && (
                  <p style={{ fontSize: "0.8rem", marginBottom: "0.75rem" }}>
                    Với thiết bị thật, đổi ngưỡng tốc độ tại mục Thống kê phiên.
                    Các ngưỡng mô phỏng dưới đây không cập nhật xuống thiết bị.
                  </p>
                )}

                <div className="form-group">
                  <label className="form-label">
                    Ngưỡng cảnh báo quá tốc độ (km/h):
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    min="20"
                    max="150"
                    disabled={device.dataSource !== "SIMULATED"}
                    value={speedThresholdKmh}
                    onChange={(e) => setSpeedThresholdKmh(e.target.value)}
                    required
                  />
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Ngưỡng ắc quy yếu (V):</label>
                    <input
                      type="number"
                      step="0.1"
                      className="form-input"
                      min="10.0"
                      max="12.5"
                      disabled={device.dataSource !== "SIMULATED"}
                      value={batteryLowThresholdV}
                      onChange={(e) => setBatteryLowThresholdV(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      Ngưỡng góc nghiêng / ngã (°):
                    </label>
                    <input
                      type="number"
                      className="form-input"
                      min="30"
                      max="80"
                      disabled={device.dataSource !== "SIMULATED"}
                      value={tiltThresholdDeg}
                      onChange={(e) => setTiltThresholdDeg(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div
                style={{
                  color: "#ef4444",
                  fontSize: "0.825rem",
                  marginTop: "0.5rem",
                  fontWeight: "600",
                }}
              >
                {error}
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Huỷ
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? "Đang lưu..." : "Lưu Thay Đổi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
