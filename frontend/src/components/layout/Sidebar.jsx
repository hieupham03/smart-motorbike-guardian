import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Bike,
  MapPin,
  LineChart,
  AlertTriangle,
  History,
  Users,
  Shield,
  Settings,
  Wrench,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useDevice } from "../../context/DeviceContext";
import { canUseDeveloperTools } from "../../services/presentation";

export default function Sidebar() {
  const { role } = useAuth();
  const { selectedDevice } = useDevice();
  const items = [
    ["/", "Tổng quan", LayoutDashboard],
    ["/devices", "Xe của tôi", Bike],
    ["/map", "Vị trí xe", MapPin],
    ["/alerts", "Cảnh báo", AlertTriangle],
    ["/analytics", "Lịch sử hoạt động", LineChart],
    ["/commands", "Lịch sử điều khiển", History],
    ...(role !== "VIEWER" ? [["/users", "Chia sẻ theo dõi", Users]] : []),
    ["/profile", "Tài khoản", Settings],
  ];
  return (
    <aside className="sidebar" aria-label="Điều hướng chính">
      <div className="sidebar-brand">
        <Shield size={26} aria-hidden="true" />
        <div>
          <strong>Guardian</strong>
          <span>Đồng hành cùng xe của bạn</span>
        </div>
      </div>
      <p className="nav-caption">THEO DÕI & BẢO VỆ</p>
      <nav className="sidebar-nav">
        {items.map(([to, label, Icon]) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
          >
            <Icon size={20} aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-tools">
        {role === "ADMIN" && (
          <NavLink className="nav-item" to="/admin">
            <Shield size={19} aria-hidden="true" />
            Quản trị hệ thống
          </NavLink>
        )}
        {canUseDeveloperTools(role, selectedDevice?.currentUserRole) && (
          <NavLink className="nav-item dev-nav-link" to="/developer">
            <Wrench size={19} aria-hidden="true" />
            Chẩn đoán & thử nghiệm
          </NavLink>
        )}
        <p>Thông tin mới giúp bạn theo dõi xe rõ hơn.</p>
      </div>
    </aside>
  );
}
