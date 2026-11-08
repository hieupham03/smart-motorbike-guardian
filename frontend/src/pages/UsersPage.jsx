import React, { useEffect, useState } from "react";
import { Users, UserPlus } from "lucide-react";
import { useDevice } from "../context/DeviceContext";
import { api } from "../services/api";
import { roleLabel, canUseDeveloperTools } from "../services/presentation";
import { useAuth } from "../context/AuthContext";
import InviteViewerModal from "../components/devices/InviteViewerModal";
export default function UsersPage() {
  const { selectedDevice: device } = useDevice(),
    { role } = useAuth();
  const [users, setUsers] = useState([]),
    [open, setOpen] = useState(false),
    [message, setMessage] = useState(null);
  const allowed = canUseDeveloperTools(role, device?.currentUserRole);
  async function load() {
    if (!device || !allowed) return;
    try {
      setUsers((await api.getDeviceUsers(device.deviceId)).data || []);
    } catch {
      setMessage("Chưa tải được danh sách người theo dõi.");
    }
  }
  useEffect(() => {
    setUsers([]);
    void load();
  }, [device?.deviceId, allowed]);
  if (!device || !allowed)
    return (
      <div className="empty-state">
        <h1>Chia sẻ theo dõi</h1>
        <p>
          Chọn xe bạn có quyền quản lý để xem hoặc thay đổi người được chia sẻ.
        </p>
      </div>
    );
  async function remove(user) {
    if (!window.confirm(`Gỡ quyền theo dõi xe của ${user.email}?`)) return;
    try {
      await api.removeDeviceUser(device.deviceId, user.userId);
      setMessage("Đã gỡ quyền theo dõi.");
      await load();
    } catch {
      setMessage("Chưa gỡ được quyền. Vui lòng thử lại.");
    }
  }
  return (
    <div className="user-dashboard">
      <div className="page-heading">
        <div>
          <h1>
            <Users size={25} aria-hidden="true" /> Chia sẻ theo dõi
          </h1>
          <p>Cho người thân theo dõi xe {device.name} và nhận cảnh báo.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setOpen(true)}>
          <UserPlus size={18} aria-hidden="true" />
          Thêm người theo dõi
        </button>
      </div>
      {message && (
        <p role="status" className="notice notice-info">
          {message}
        </p>
      )}
      <section className="glass-card user-section">
        <h2>Người có quyền truy cập</h2>
        {!users.length ? (
          <p className="muted">Chưa có người được chia sẻ.</p>
        ) : (
          users.map((user) => (
            <div className="section-heading" key={user.userId}>
              <div>
                <strong>{user.fullName}</strong>
                <p className="muted">
                  {user.email} · {roleLabel(user.role)}
                </p>
              </div>
              {user.role === "VIEWER" && (
                <button
                  className="btn btn-secondary"
                  onClick={() => void remove(user)}
                >
                  Gỡ quyền
                </button>
              )}
            </div>
          ))
        )}
      </section>
      <section className="glass-card user-section">
        <h2>Quyền được chia sẻ</h2>
        <p className="muted">
          Người theo dõi được xem tình trạng, vị trí và xác nhận đã xem cảnh
          báo. Chủ xe quản lý chia sẻ và điều khiển thiết bị. Chỉ chia sẻ quyền
          điều khiển cho người bạn tin tưởng.
        </p>
      </section>
      <InviteViewerModal
        isOpen={open}
        onClose={() => setOpen(false)}
        deviceId={device.deviceId}
        onSuccess={() => void load()}
      />
    </div>
  );
}
