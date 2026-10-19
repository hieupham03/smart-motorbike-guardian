# Đặc tả hiện tại — Smart Motorbike Guardian

Cập nhật 18/10/2026. Phạm vi bài tập lớn IoT trên breadboard, hướng A/A+ bằng đủ tầng, hành vi đúng và bằng chứng đo. Đặc tả v1 lưu tại archive/PROJECT_SPECIFICATION-v1.md; không áp dụng tuyên bố chuẩn công nghiệp/an toàn tuyệt đối.

## Kiến trúc

Hall/MPU6050/NEO-6M → ESP32-S3 Node B → UART → ESP32 Node A → MQTT → Spring Boot → PostgreSQL → REST/STOMP → web React. Lệnh đi từ ứng dụng qua backend/MQTT xuống Node A, ACK quay về. Mobile do thành viên khác phát triển, chưa có source trong repo. Broker từ xa không đồng nghĩa backend/DB đã cloud-hosted.

## Hardware

- Node A: UART RX16/TX17, relay23, buzzer18 qua driver phù hợp, LED2.
- Node B S3 N16R8: UART RX18/TX17, MPU SDA8/SCL9, Hall4, GPS RX6/TX7.
- Nối chéo UART, chung GND; GPS RX/PPS để hở khi chỉ đọc NMEA. Logic3.3V, VCC theo breakout thật.
- Hiện dùng USB laptop cho hai node, nguồn motor riêng. Không nối chung dương MB102 với USB; motor TT3–6V không cấp thẳng12V. MB102 chưa được chứng minh đủ tải khi hạ12V, cần kiểm tra nóng/sụt áp.
- Chi tiết: ../hardware/SO-DO-DAU-NOI-PHAN-CUNG.md.

## Firmware và UART

Node B: SensorTask50ms, ProcessingTask, GpsTask không chờ fix, UARTTask telemetry500ms/heartbeat1s. Node A: UART nhận, MQTTTask, ControlTask sở hữu state/đầu ra. Queue/mutex trao đổi snapshot. MPU lỗi không tạo số đo fallback.

Frame: start0xAA + type + length + payload + XOR(type,length,payload); payload tối đa128, parser có timeout/resync. Telemetry v2 packed39byte: speed/ax/ay/az16B, timestamp4B, lat/lon8B, gps_age_ms/wheel_idle_ms8B, gps_valid/imu_valid/speed_valid3B. Hai node phải cùng header; chưa có byte version riêng trong frame.

Hall dùng khoảng xung; xung đầu hoặc xung đầu sau dừng chưa đủ tính tốc độ nên speed_valid=false. Không xung4s coi đứng yên theo heuristic, không phân biệt dây đứt. IMU/speed đều hết hạn theo mẫu nguồn dù UART vẫn truyền lại. Chu vi bánh và số nam châm phải hiệu chỉnh trên mạch.

MPU ±4g; góc nghiêng atan2(hypot(ax,ay),az), lắp Z hướng+g. Rung dùng độ lệch độ lớn gia tốc, 3mẫu vượt3.5m/s2 khi ARMED; nghiêng>50° có điều kiện thời gian/tốc độ trong code. Chưa chứng minh nhận diện tai nạn thật.

GPS TinyGPSPlus9600baud, lưu fix cuối RAM, timeout5s. NO_FIX không chặn task khác; mất fix có thể cần đến timeout mới phản ánh. Sketch gps_bringup chỉ thử độc lập, sau thử cần nạp Node B đầy đủ.

## Điều khiển

PARKED=bảo vệ tắt, không xác nhận motor đang bật; ARMED=bật bảo vệ; ALARM=cảnh báo; THEFT_LOCK=đã ra lệnh cắt. Boot motorOFF. UNLOCK/ARM/DISARM cấp đầu ra theo code. LOCK/REBOOT yêu cầu mẫu mới, speed_valid, tốc độ≤0.5km/h và idle≥4s; không có feedback tiếp điểm vật lý.

Command có cmd_id, queue rồi ControlTask thực thi trước ACK. Cache8 kết quả RAM chống lặp trong giới hạn, mất khi reset. Không ACK lại ACK. Còi thủ công không tự kích hoạt timer khóa ALARM.

## Hợp đồng dịch vụ

- guardian/<UUID>/: telemetry1s, alert sự kiện, status/LWT retained, heartbeat15s, cmd/<type>, cmd/ack. Chi tiết trong BAN-GIAO-BACKEND-FRONTEND-VA-TICH-HOP.md.
- Firmware MQTT1883 TCP, publishQoS0; buffer30alert RAM không bảo đảm giữ qua mất điện/giao nhận cuối.
- Backend commitPENDING trước publish, ACK đúng device/ID mới đổi kết quả; timeout10s, lưu lateACK; không fallback simulator cho hardware.
- HARDWARE/SIMULATED/LEGACY riêng; simulator bị chặn trước khi ghi lên hardware. Số đo thiếu/invalid=null, chưa ADC không gán12.6V.
- receivedAt=giờserver, deviceUptimeS=uptimefirmware; GPS có validity/age và last-known. Gatewayoffline khác sensorstale.
- ACCESS/REFRESH tách, Owner điều khiển, Viewer đọc, STOMP chỉ userqueue. H2console tắt mặc định.
- Ngưỡng HARDWARE chỉnh trong firmware, chưa CONFIG_THRESHOLDS từ xa; web chỉ sửa thông tin, ngưỡng simulator chỉnh riêng.

## Database và triển khai

PostgreSQL15, FlywayV1/V2 là nguồn schema duy nhất. Không chạy SQLseed cũ; DataInitializer seed có cấu hình. Secret qua env. Một compose tại deployment/. Local Java17+/Maven, Node20+ theo REALTIME-BACKEND-FRONTEND.md.

## Tiêu chí nghiệm thu

1. Test backend/frontend/UART/Hall và build3sketch đạt; migration PostgreSQL thật.
2. Board → MQTT → DB → WebSocket → UI và lệnh → ACK/state/relay có bằng chứng cùng thiết bị.
3. Mất UART/mạng, GPS FIX/STALE/phục hồi và phân quyền có actual/log.
4. Hiệu chỉnh Hall, kiểm tra nguồn/reset, chạy30–60phút, đo khoảng20lượt latency; không lấy uptime trừ epoch.
5. ADC nếu rubric bắt buộc; nếu giảm scope phải ghi rõ. Mobile chỉ nghiệm thu khi có app thật.
6. Báo cáo/slide10phút khớp bản chạy. Trạng thái cụ thể: HOAN-THIEN-VA-NGHIEM-THU.md; không gán100% khi actual thiếu.
