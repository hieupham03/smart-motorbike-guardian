# Minh chứng demo với mạch thật

[Kết quả ca thật](validation.json) · [Tổng hợp 30 phút](summary.json) · [Dữ liệu quan sát allowlist](observations.jsonl).

Hai node chạy trên bàn thử: Node A ESP32, Node B ESP32-S3 N16R8, Hall và MPU thật. Người vận hành xác nhận quay bánh tay và nghe còi; agent quan sát UART, MQTT, API/database và web. Nguồn motor được giữ tắt trong các ca nạp và cấp lại nguồn. GPS là NO_FIX, không chèn tọa độ giả.

## Kết quả trọng tâm

- Kích hoạt mạch qua web, credential MQTT riêng, telemetry lưu vào DB và cập nhật giao diện.
- ARM được thực thi; quay bánh gây cảnh báo WHEEL_MOVEMENT_WHILE_ARMED và còi nghe được theo xác nhận người vận hành; DISARM về PARKED.
- Đổi ngưỡng 2 → 3,5 km/h có ACK/readback; sau tắt/cấp lại nguồn cả hai node vẫn giữ 3,5. Kết thúc đã đưa ngưỡng về 2.
- Viewer xem được xe (200) nhưng gửi lệnh trực tiếp bị từ chối (403). Cảnh báo được xác nhận và xử lý.
- Thu hồi làm mất quyền MQTT, không chỉ đổi nhãn DB: UART Node A vẫn mới, Serial có rc=4 từ chối khóa cũ, không có telemetry mới trong 10 giây. Log cũng có rc=-2 ở một lần retry vận chuyển, không bị loại khỏi kết quả.
- Cấp khóa mới bằng reactivate và nạp cấu hình local khôi phục mạch. Không phục hồi khóa cũ hoặc tự bật lại thiết bị bị decommission.
- Trình duyệt nhận sự kiện mạch qua HTTPS/WSS; kết nối TLS 1.3 được kiểm chứng chỉ pin riêng. Chứng chỉ tự ký, không phải CA công khai; MQTT TCP vẫn là giới hạn của LAN thử nghiệm.

## Phương pháp và số liệu

`tests/manual/measure-demo.cjs` lấy Device/latest telemetry mỗi khoảng 1 giây bằng đồng hồ đơn điệu của client; có 1.788 poll thành công, 0 lỗi HTTP trong khoảng 30 phút. Quan sát được 1.743 reading khác nhau có uptime; không thấy uptime giảm, mẫu đứng yên quá 5 giây hoặc sensorConnected=false. Poll latest không thể thấy mọi gói MQTT, nên không tính tỷ lệ mất gói từ hai số này.

Năm RESET_WHEEL_SESSION được gửi riêng, không tác động relay/còi. Từ request tới lần đọc kết quả cuối: 297,14; 308,69; 310,19; 561,83; 578,43 ms (sắp tăng dần). Trung vị 310,19 ms; issuedAt→ackAt tại backend nằm trong 208–407 ms. Có độ trễ polling và chỉ 5 mẫu, không suy thành độ trễ cạnh xung Hall đến màn hình hoặc bảo đảm trên mọi mạng.

Ca offline được kiểm khi thiết bị đã OFFLINE ở đầu lần xác minh, nên các timestamp chỉ chứng minh trạng thái và phục hồi, không được gọi là độ trễ phát hiện mất nguồn. Lần quan sát ban đầu hết cửa sổ trước khi người vận hành rút nguồn; không chuyển lần chờ đó thành dữ liệu đo.

[Ảnh dashboard nhận dữ liệu thật](../../bao-cao-final/technical/assets/screens/web-dashboard.png) chụp trong ca cảnh báo. Video trình duyệt ở `.local/evidence/demo-readiness/browser-video/` là dự phòng màn hình, không có toàn mạch trong khung hình. **Chưa có ảnh prototype thật hoặc kiểm điện thoại native**; không suy chúng từ screenshot/browser viewport.

Raw JSONL chỉ chứa các trường đã chọn: timestamp, ID reading/command, uptime, giá trị Hall và cờ hợp lệ. Không chứa email, mật khẩu, JWT, mã claim, SSID, biển số hay tọa độ. SHA256 raw được ghi trong validation.json. Log serial đầy đủ và cấu hình riêng chỉ giữ local, không xuất bản.
