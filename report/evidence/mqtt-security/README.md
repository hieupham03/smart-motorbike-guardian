# Kiểm thử xác thực và thu hồi MQTT

Môi trường: Spring Boot/H2, broker Moquette của ứng dụng và các client Eclipse Paho thật trên localhost, cổng TCP cấp tạm cho từng lần chạy. Dữ liệu/credential được tạo riêng cho test. Đây là kiểm thử phần mềm qua giao thức thực, không phải kết quả thao tác Node A hoặc mạng Wi-Fi tại lớp.

Source: `backend/src/test/java/com/guardian/EmbeddedMqttSecurityIntegrationTest.java`.

| Ca kiểm thử | Kết quả |
|---|---|
| Anonymous, sai mật khẩu và giả client ID của thiết bị | PASS — CONNECT bị từ chối |
| Thiết bị có quyền gửi telemetry tới DB; gửi/subscribe ngoài topic của mình | PASS — dữ liệu đúng được lưu, topic trái quyền bị chặn |
| Thu hồi khi client đang nối | PASS — ngắt phiên, hash bị xóa, mật khẩu cũ không reconnect |
| Decommission | PASS — ngắt phiên, từ chối reconnect và cấp lại credential |
| Đổi credential | PASS — Viewer bị chặn, Owner nhận một lần no-store, mật khẩu cũ mất hiệu lực |
| Mã kích hoạt hết hạn và đổi mật khẩu tài khoản không đăng nhập | PASS — yêu cầu bị từ chối, API đổi mật khẩu trả 401 |
| Provision → onboarding → MQTT | PASS — trước onboarding không CONNECT; sau claim gửi được telemetry; claim không dùng lại |
| Bootstrap classroom và quyền đã thu hồi | PASS — Node A chờ claim, không có ownership sẵn; khởi tạo không phục hồi credential bị thu hồi |
| Kích hoạt lại kết nối | PASS — chỉ Owner/Admin, giữ ownership, mật khẩu mới nối được, mật khẩu cũ bị từ chối; decommission vẫn vĩnh viễn |

`validation.json` lưu tổng hợp và hash các báo cáo Surefire. Báo cáo raw nằm trong build output local; không xuất bản log chứa thông tin chạy riêng. Phương pháp và giới hạn sử dụng được giải thích trong [hướng dẫn bảo mật MQTT](../../BAO-MAT-MQTT-VA-VONG-DOI.md).
