# Thuật ngữ dùng chung

- **Device UUID:** định danh trên topic MQTT; backend chuyển sang deviceId nội bộ trong REST/WebSocket.
- **HARDWARE / SIMULATED / LEGACY:** board thật theo nguồn thiết bị đã cấu hình / simulator được chọn rõ / bản ghi cũ chưa xác minh metadata. Payload test phần mềm mang contract HARDWARE không phải bằng chứng hardware.
- **Gateway online:** Node A còn kết nối/lastSeen mới. Khác **sensorConnected:** dữ liệu Node B còn mới qua UART.
- **receivedAt:** đồng hồ server khi nhận; **deviceUptimeS:** thời gian từ boot của firmware. Không cùng hệ thời gian.
- **FIX / STALE / NO_FIX:** vị trí còn hợp lệ / chỉ còn fix cuối đã cũ / chưa từng nhận fix. GPS không thay Hall trong interlock.
- **PENDING / EXECUTED / REJECTED / TIMEOUT:** backend nhận yêu cầu / có ACK thực thi / từ chối hoặc không publish được, có reason / hết thời gian chờ. Publish MQTT không phải thực thi.
- **PARKED:** bảo vệ tắt; không tự chứng minh xe đứng yên hoặc relay đã cấp nguồn.
- **WebSocket realtime:** đẩy sự kiện sau MQTT ingestion và DB commit. Không thay đổi chu kỳ lấy mẫu/publish firmware hay bảo đảm không mất gói.
