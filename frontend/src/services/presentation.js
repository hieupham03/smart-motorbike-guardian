// Presentation only: API values and firmware states remain unchanged.
export const securityLabel = (value) =>
  ({
    PARKED: "Bảo vệ đang tắt",
    ARMED: "Đang bảo vệ",
    ALARM: "Đang báo động",
    THEFT_LOCK: "Đã khóa động cơ",
  })[value] || "Chưa rõ trạng thái";
export const lifecycleLabel = (value) =>
  ({
    ACTIVE: "Đã kết nối",
    OFFLINE: "Mất kết nối",
    REGISTERED: "Chưa kích hoạt",
    PROVISIONED: "Đang thiết lập",
    FAULT: "Cần kiểm tra",
    MAINTENANCE: "Đang bảo trì",
    DECOMMISSIONED: "Đã ngừng sử dụng",
  })[value] || "Chưa rõ kết nối";
export const roleLabel = (value) =>
  ({ OWNER: "Chủ xe", VIEWER: "Người theo dõi", ADMIN: "Quản trị viên" })[
    value
  ] || "Chưa có quyền";
export const sourceLabel = (value) =>
  ({
    HARDWARE: "Thiết bị thật",
    SIMULATED: "Dữ liệu mô phỏng",
    LEGACY: "Nguồn dữ liệu cũ",
  })[value] || "Chưa rõ nguồn dữ liệu";
export const commandLabel = (value) =>
  ({
    ARM: "Bật bảo vệ",
    DISARM: "Tắt bảo vệ",
    LOCK_ENGINE: "Khóa động cơ",
    UNLOCK_ENGINE: "Mở khóa động cơ",
    SIREN_ON: "Bật còi",
    SIREN_OFF: "Tắt còi",
    REBOOT: "Khởi động lại thiết bị",
    RESET_WHEEL_SESSION: "Bắt đầu phiên mới",
    CONFIG_THRESHOLDS: "Đổi ngưỡng cảnh báo tốc độ",
  })[value] || "Yêu cầu điều khiển";
export const commandStatusLabel = (value) =>
  ({
    PENDING: "Đang chờ thiết bị",
    EXECUTED: "Đã thực hiện",
    REJECTED: "Không thể thực hiện",
    TIMEOUT: "Chưa nhận được phản hồi",
  })[value] || "Chưa rõ kết quả";
export const alertStatusLabel = (value) =>
  ({ OPEN: "Chưa xem", ACKNOWLEDGED: "Đã xem", RESOLVED: "Đã xử lý" })[value] ||
  "Chưa rõ trạng thái";
export const severityLabel = (value) =>
  ({
    CRITICAL: "Cần kiểm tra ngay",
    HIGH: "Quan trọng",
    MEDIUM: "Cần chú ý",
    LOW: "Thông tin",
  })[value] || "Thông báo";
export const alertDescription = (value) =>
  ({
    MOTION_WHILE_ARMED: "Xe ghi nhận rung lắc khi đang bật bảo vệ.",
    WHEEL_MOVEMENT_WHILE_ARMED:
      "Bánh xe có chuyển động khi đang bật bảo vệ. Hãy kiểm tra xe.",
    FALL_DETECTED:
      "Thiết bị ghi nhận dấu hiệu nghiêng hoặc ngã. Hãy kiểm tra tình trạng thực tế; đây chưa phải xác nhận tai nạn.",
    SPEED_LIMIT_EXCEEDED:
      "Tốc độ đã vượt ngưỡng cảnh báo được cài trên thiết bị. Chức năng này không tự giảm tốc hoặc khóa xe.",
  })[value] || "Thiết bị gửi thông báo cần bạn kiểm tra.";
export const reasonLabel = (value) =>
  ({
    SPEED_NOT_ZERO:
      "Bánh xe đang quay hoặc chưa dừng đủ lâu. Hãy để bánh dừng hẳn ít nhất 4 giây rồi thử lại.",
    SENSOR_STALE:
      "Chưa nhận được dữ liệu mới từ xe. Kiểm tra kết nối trước khi thử lại.",
    NO_SENSOR_DATA: "Thiết bị chưa gửi dữ liệu cảm biến.",
    SPEED_INVALID: "Chưa xác định được tốc độ. Hãy chờ dữ liệu mới.",
    WHEEL_DATA_STALE: "Thông tin bánh xe chưa được cập nhật.",
    DEVICE_OFFLINE: "Thiết bị đang mất kết nối.",
    MQTT_UNAVAILABLE:
      "Kết nối điều khiển đang gián đoạn nên chưa gửi được yêu cầu. Hãy chờ kết nối khôi phục rồi thử lại.",
    ACK_TIMEOUT:
      "Chưa xác định được yêu cầu đã thực hiện hay chưa. Hãy kiểm tra trạng thái xe và kết nối trước khi gửi lại.",
    QUEUE_FULL: "Thiết bị đang bận. Vui lòng thử lại sau.",
    UNSUPPORTED_COMMAND: "Thiết bị chưa hỗ trợ yêu cầu này.",
    INVALID_SPEED_LIMIT: "Ngưỡng cảnh báo phải là số từ 1 đến 120 km/h.",
    CONFIG_STORAGE_FAILED: "Thiết bị chưa lưu được ngưỡng mới. Ngưỡng cũ vẫn được giữ; vui lòng thử lại.",
    WARNING_ONLY: "Đã gửi cảnh báo",
    LOGGED: "Đã ghi nhận sự kiện",
  })[value] ||
  (value && /[à-ỹ]/i.test(value)
    ? value
    : value
      ? "Yêu cầu chưa được xác nhận. Hãy kiểm tra thiết bị hoặc thử lại sau."
      : "");
export function commandFeedback(command) {
  if (!command) return "";
  if (command.type === "ARM" && command.status === "REJECTED" &&
      command.reasonIfFailed === "SPEED_NOT_ZERO" && !command.lateAckAt) {
    return "Chưa thể bật bảo vệ: bánh xe đang quay hoặc chưa dừng đủ lâu. Hãy để bánh dừng hẳn ít nhất 4 giây rồi bật lại.";
  }
  let message = `${commandLabel(command.type)}: ${commandStatusLabel(command.status)}`;
  if (command.lateAckAt) {
    // A late ACK explains the outcome without rewriting the recorded TIMEOUT.
    message += command.lateAckResult
      ? ` · Phản hồi muộn từ xe: ${commandStatusLabel(command.lateAckResult)}`
      : " · Thiết bị phản hồi sau thời gian chờ";
    if (command.lateAckReason) message += ` · ${reasonLabel(command.lateAckReason)}`;
    return `${message} · Hãy kiểm tra trạng thái hiện tại của xe.`;
  }
  return message + (command.reasonIfFailed ? ` · ${reasonLabel(command.reasonIfFailed)}` : "");
}
export const canUseDeveloperTools = (accountRole, deviceRole) =>
  accountRole === "ADMIN" || deviceRole === "OWNER" || deviceRole === "ADMIN";
