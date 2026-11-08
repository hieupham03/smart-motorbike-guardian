import React, { useState } from "react";
import { QrCode, Bike, X, CheckCircle } from "lucide-react";
import { api } from "../../services/api";

export default function OnboardModal({ isOpen, onClose, onSuccess }) {
  const [claimToken, setClaimToken] = useState("");
  const [name, setName] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.onboardDevice({
        claimToken,
        name,
        licensePlate,
        vehicleModel,
      });

      if (res.success) {
        onSuccess(res.data);
        onClose();
      }
    } catch (err) {
      setError(err.message || "Lỗi khi kích hoạt thiết bị");
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
              <QrCode size={20} />
            </div>
            <div>
              <h3
                style={{
                  fontSize: "1.1rem",
                  fontWeight: "800",
                  color: "#0c4a6e",
                }}
              >
                Kích hoạt thiết bị trên xe
              </h3>
              <p style={{ fontSize: "0.75rem", color: "#64748b" }}>
                Nhập mã kích hoạt đi kèm thiết bị trên xe
              </p>
            </div>
          </div>
          <button
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
              <label className="form-label" htmlFor="vehicle-activation">
                Mã kích hoạt đi kèm thiết bị:
              </label>
              <input
                id="vehicle-activation"
                type="text"
                className="form-input"
                placeholder="Nhập mã kích hoạt"
                value={claimToken}
                onChange={(e) => setClaimToken(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="new-vehicle-name">
                Tên xe:
              </label>
              <input
                id="new-vehicle-name"
                type="text"
                className="form-input"
                placeholder="Ví dụ: VinFast Theon S 2024"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Biển số xe (Tuỳ chọn):</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ví dụ: 30A1-999.99"
                value={licensePlate}
                onChange={(e) => setLicensePlate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Dòng xe / Năm sản xuất:</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ví dụ: Honda SH 150i ABS 2024"
                value={vehicleModel}
                onChange={(e) => setVehicleModel(e.target.value)}
              />
            </div>

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
              Đóng
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? "Đang kích hoạt..." : "Kích hoạt Thiết Bị"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
