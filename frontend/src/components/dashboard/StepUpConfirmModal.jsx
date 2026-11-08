import React, { useEffect, useRef, useState } from "react";
import { X, Lock } from "lucide-react";
import { reasonLabel } from "../../services/presentation";
export default function StepUpConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  currentSpeed = null,
}) {
  const [password, setPassword] = useState(""),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(false);
  const dialog = useRef(null),
    input = useRef(null);
  useEffect(() => {
    if (!isOpen) return;
    setPassword("");
    setError("");
    const previous = document.activeElement;
    input.current?.focus();
    return () => previous?.focus();
  }, [isOpen]);
  if (!isOpen) return null;
  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await onConfirm(password);
      setPassword("");
      onClose();
    } catch (e) {
      setError(reasonLabel(e.message));
    } finally {
      setLoading(false);
    }
  };
  function keys(e) {
    if (e.key === "Escape" && !loading) {
      onClose();
      return;
    }
    if (e.key !== "Tab") return;
    const controls = [
      ...dialog.current.querySelectorAll(
        "button:not(:disabled),input:not(:disabled)",
      ),
    ];
    const first = controls[0],
      last = controls.at(-1);
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last?.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first?.focus();
    }
  }
  return (
    <div className="modal-overlay">
      <div
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="lock-title"
        aria-describedby="lock-description"
        className="modal-content"
        style={{ maxWidth: 460 }}
        onKeyDown={keys}
      >
        <div className="modal-header">
          <h2 id="lock-title">
            <Lock size={20} aria-hidden="true" /> Xác nhận khóa động cơ
          </h2>
          <button
            className="icon-button"
            aria-label="Đóng xác nhận"
            disabled={loading}
            onClick={onClose}
          >
            <X size={21} aria-hidden="true" />
          </button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            <p id="lock-description" className="muted">
              Chỉ khóa khi xe đã dừng. Nhập mật khẩu để xác nhận yêu cầu của
              bạn.
            </p>
            <p className="notice notice-warning">
              {currentSpeed == null
                ? "Chưa có tốc độ mới. Thiết bị sẽ kiểm tra lại trước khi xử lý."
                : currentSpeed > 0
                  ? `Tốc độ gần nhất: ${currentSpeed.toFixed(1)} km/h. Yêu cầu có thể bị từ chối khi bánh chưa dừng đủ lâu.`
                  : "Tốc độ gần nhất: 0 km/h. Thiết bị vẫn cần xác nhận bánh đã dừng đủ lâu."}
            </p>
            <label className="form-label" htmlFor="lock-password">
              Mật khẩu
            </label>
            <input
              ref={input}
              id="lock-password"
              className="form-input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
            {error && (
              <p role="alert" className="notice notice-danger">
                {error}
              </p>
            )}
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              disabled={loading}
              onClick={onClose}
            >
              Hủy
            </button>
            <button className="btn btn-danger" disabled={loading || !password}>
              {loading ? "Đang gửi yêu cầu…" : "Xác nhận khóa động cơ"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
