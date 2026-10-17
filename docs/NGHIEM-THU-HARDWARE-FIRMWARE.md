# Chot hardware/firmware breadboard

## Cập nhật18/10/2026

Người dùng xác nhận GPS đã fix ngoài trời, mấtfix khi vào nhà; chưa có log tọa độ trong repo. Nghiệm thu GPS quaUART/MQTT/DB/map vẫn mở. Firmware mới sửa spike Hall xungđầu và hết hạn IMU, hosttest/build đạt, cần nạp lại Node B và thử mạch. Xem [bản tích hợp](HOAN-THIEN-VA-NGHIEM-THU.md).

## Mốc chốt và bàn giao 12/10/2026

Chốt baseline hardware/firmware cho demo trong nhà. Người phụ trách xác nhận "mọi thứ đã ổn" sau hướng dẫn thử MQTT command/ACK, relay/buzzer và phục hồi mạng. Đây là xác nhận tổng quát của người dùng; các hàng Actual bên dưới chưa có log riêng không được tự nâng thành PASS đo độc lập. Các ca UART/MPU đã có log được giữ nguyên kết quả.

GPS fix ngoài trời, hiệu chỉnh Hall, ADC nếu rubric bắt buộc và bằng chứng chạy lâu/reset còn mở đến khi có kết quả cụ thể. Baseline đã chốt không đồng nghĩa mọi tính năng đạt 100%.

Bàn giao công việc backend/frontend/database/cloud và tiêu chí nghiệm thu chung tại [BAN-GIAO-BACKEND-FRONTEND-VA-TICH-HOP.md](./BAN-GIAO-BACKEND-FRONTEND-VA-TICH-HOP.md). Giữ code hiện tại làm mốc; không tự thay hợp đồng firmware để che dữ liệu thiếu ở app.

Phạm vi: hai node, Hall, MPU, GPS, relay/buzzer, UART và MQTT. Không bao gồm sửa backend/frontend. Không gọi hoàn thành 100% trước khi các ca bắt buộc có actual và bằng chứng.

## Bằng chứng đã có trong phiên thử

| Ca | Kết quả | Bằng chứng |
|---|---|---|
| UART v2 và heartbeat | PASS | Node A size=39/fresh=1; Node B CONNECTED |
| Hall nhận quay và dừng | PASS chức năng | Speed thay đổi rồi về 0; độ chính xác chưa hiệu chỉnh |
| LOCK khi quay | PASS logic | 23:02:42 REJECTED SPEED_NOT_ZERO |
| LOCK khi đứng yên | PASS logic | 23:03:04 EXECUTED THEFT_LOCK; chưa xác nhận tiếp điểm |
| Mất UART và phục hồi | PASS | 23:07:52 SENSOR_STALE/fresh=0; 23:08:10 fresh=1 |
| MPU/ARM/ALARM/DISARM | PASS logic | MPU REAL; 23:08:30 ARMED; 23:08:49 ALARM; 23:08:52 PARKED |
| MQTT | Người dùng xác nhận OK | Chưa lưu payload/capture trong repo |
| GPS UART/parser | PASS nhận dữ liệu | chars tăng, checksum_errors=0, NO_FIX |
| GPS định vị | CHƯA THỬ ĐẠT | Thử trong phòng chưa có fix; không coi 0,0 là vị trí |

Các giờ trên lấy từ log người dùng, không có ngày đo độc lập. Lưu log gốc tại docs/evidence/ khi có; bảng này chỉ tóm tắt bằng chứng trong hội thoại.

## Checklist hoàn thành trong buổi thử

MQTT web đã kết nối cùng broker. Subscribe guardian/550e8400-e29b-41d4-a716-446655440001/#. Publish QoS0, RETAIN OFF. Topic và type phải khớp, cmd_id mới cho mỗi phép thử; ngoại lệ ca chống lặp dùng lại ID.

| Ca | Thao tác | Expected | Actual |
|---|---|---|---|
| Remote ARM | cmd/arm: {"cmd_id":"hw-arm-01","type":"ARM"} | cmd/ack cùng ID, EXECUTED; telemetry ARMED | Chờ thử |
| Remote DISARM | cmd/disarm: {"cmd_id":"hw-disarm-01","type":"DISARM"} | ACK EXECUTED; PARKED | Chờ thử |
| Remote LOCK khi quay | cmd/lock_engine: {"cmd_id":"hw-lock-moving-01","type":"LOCK_ENGINE"} | REJECTED/SPEED_NOT_ZERO | Chờ thử |
| Remote LOCK khi dừng >4s | cmd/lock_engine: {"cmd_id":"hw-lock-stop-01","type":"LOCK_ENGINE"} | EXECUTED/THEFT_LOCK; đo COM-NO ngắt | Chờ thử |
| Remote UNLOCK | cmd/unlock_engine: {"cmd_id":"hw-unlock-01","type":"UNLOCK_ENGINE"} | EXECUTED/PARKED; COM-NO cấp tải | Chờ thử |
| Chống lặp | Gửi lại ngay hw-lock-stop-01 sau UNLOCK, chưa có 8 ID mới | ACK kết quả cũ; không khóa lại, vẫn PARKED | Chờ thử |
| Buzzer | cmd/siren_on và cmd/siren_off, ID mới, type SIREN_ON/SIREN_OFF | Bật/tắt còi, không tự khóa do còi thủ công | Chờ thử |
| Reset/nguồn | Reset Node A, quan sát đầu ra lúc boot rồi gửi u | Motor tắt theo cấu hình boot; u bật; đo thực tế | Chờ thử |
| Mất Wi-Fi/phục hồi | Ngắt AP 1 phút, giữ hai node chạy, bật lại | UART/MPU/GPS tiếp tục; MQTT nối lại, telemetry mới | Chờ thử |
| Chạy lâu | 30-60 phút, thao tác vài lần, ghi heap/reset | Không reset bất ngờ; ghi số lỗi, heap đầu/cuối | Chờ thử |
| Hall hiệu chỉnh | Đo chu vi bánh, đếm nam châm/xung; quay đều | Sửa config cả hai bản; đối chiếu tốc độ, điều tra spike 62.22 | Chờ đo |
| GPS fix/stale | Ngoài trời lấy fix, đối chiếu map; dừng GPS TX >5s rồi nối lại | FIX/tọa độ thật; gps_valid=false khi stale; phục hồi | Chờ ngoài trời |

Prefix đầy đủ khi publish: guardian/550e8400-e29b-41d4-a716-446655440001/ + topic cmd/... ở bảng. Serial command không thay bằng chứng remote ACK. ACK chứng minh thực thi GPIO, không chứng minh tiếp điểm relay nếu chưa đo.

## Giới hạn chốt

- NO_FIX không chặn Hall/MPU/UART/MQTT. Có thể hoàn thành thử hệ thống trong phòng, nhưng GPS định vị vẫn mở đến khi có bằng chứng.
- Hall không phân biệt dây đứt với đứng yên. Timeout 4 giây là heuristic breadboard, không xác nhận an toàn xe thật.
- Alert buffer RAM có giới hạn, mất khi reset; MQTT publish QoS0 không bảo đảm backend đã nhận.
- Chưa đo điện áp ADC. Nếu yêu cầu FR-01 bắt buộc, cần bổ sung; nếu được phép giảm phạm vi, ghi rõ chưa hỗ trợ. Không dùng 12.6V mặc định làm số đo.
- Giữ một cấu hình demo; không thêm PCB/OTA/cloud phức tạp để hoàn thành buổi thử.
