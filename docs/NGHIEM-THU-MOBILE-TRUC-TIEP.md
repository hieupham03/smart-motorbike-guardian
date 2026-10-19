# Checklist nghiệm thu mobile trực tiếp

Điền Actual, trạng thái `PASS`/`FAIL`/`CHƯA CHẠY`, người thử, thời gian và link ảnh/log. Không đổi mục chưa chạy thành PASS.

## Chuẩn bị

- Ghi commit app/backend, model máy, OS, kiểu build, IP backend, DB/broker và device ID.
- Có Owner, Viewer, Admin riêng; một thiết bị SIMULATED và một HARDWARE nếu test board.
- Đồng bộ giờ máy tính/điện thoại. Lưu evidence dưới `docs/evidence/mobile/<yyyy-mm-dd>/`, không lưu token/secret.

| ID | Ca kiểm thử | Thao tác/Expected | Trạng thái |
|---|---|---|---|
| M01 | Login/session | Login, kill/mở app; phiên phục hồi, profile đúng | CHƯA CHẠY |
| M02 | Refresh/logout | Để access token hết hạn; chỉ một refresh. Logout về login và push token bị hủy | CHƯA CHẠY |
| M03 | Quyền Viewer | Viewer xem dashboard/ack alert nhưng không control/config/resolve | CHƯA CHẠY |
| M04 | Realtime/reconnect | Telemetry đổi UI; tắt/bật mạng; snapshot và STOMP phục hồi không rollback dữ liệu mới | CHƯA CHẠY |
| M05 | GPS NO_FIX | Không marker giả; hiển thị NO_FIX | CHƯA CHẠY |
| M06 | GPS FIX→STALE | Fix thật hiện đúng; ngừng dữ liệu >5 s chuyển stale/last-known | CHƯA CHẠY |
| M07 | Lệnh ACK | Gửi ARM/DISARM: PENDING → EXECUTED/REJECTED theo ACK đúng device/cmd | CHƯA CHẠY |
| M08 | Timeout/late ACK | Ngắt ACK: TIMEOUT; ACK muộn được ghi riêng, không đảo trạng thái | CHƯA CHẠY |
| M09 | LOCK interlock | Nhập lại mật khẩu; xe quay/stale bị firmware từ chối, relay không tác động sai | CHƯA CHẠY |
| M10 | Alert | Alert MQTT tạo một bản ghi; Viewer ack; Owner resolve kèm actionTaken | CHƯA CHẠY |
| M11 | QR onboarding | Cho quyền camera, scan QR hợp lệ; token dùng lại bị từ chối; manual fallback hoạt động | CHƯA CHẠY |
| M12 | Config/Viewer | Owner sửa metadata/ngưỡng, thêm/gỡ Viewer; ghi nhận đây là config backend | CHƯA CHẠY |
| M13 | History/CSV | Chọn 1h/24h/7d, biểu đồ đúng null; CSV tải/chia sẻ, tối đa 5.000 mẫu | CHƯA CHẠY |
| M14 | Admin | Admin thấy user/device/audit, khóa/mở user; non-admin bị 403/UI chặn | CHƯA CHẠY |
| M15 | Push foreground | Alert/offline/command terminal hiện notification một lần | CHƯA CHẠY |
| M16 | Push background | Nhận và tap mở đúng device/màn hình | CHƯA CHẠY |
| M17 | Push cold start | Kill app, nhận/tap; app mở đúng sau khi xác minh ownership | CHƯA CHẠY |
| M18 | Thu hồi quyền | Gỡ Viewer rồi tap push cũ; app không mở dữ liệu device đã mất quyền | CHƯA CHẠY |
| M19 | Đổi tài khoản | Logout A/login B; token không tiếp tục nhận dữ liệu của A | CHƯA CHẠY |
| M20 | Offline gateway | Ngắt Node A/LWT hoặc chờ timeout; UI + push offline, phục hồi khi telemetry mới | CHƯA CHẠY |

## Bằng chứng hardware bắt buộc

- Video/log cùng thời điểm: tác động Hall/MPU/GPS → UART → MQTT → DB/API → app.
- Remote command: request PENDING → MQTT → log firmware → ACK → DB/app; với relay cần quay rõ tải/đồng hồ đo.
- GPS ngoài trời: cold start đến FIX, tọa độ hợp lý, sau đó stale. Không dùng dữ liệu seed/simulator.
- Ít nhất 20 mẫu latency bằng cùng đồng hồ/video, báo min/median/max; soak test 30–60 phút.

Tham chiếu wiring và kiểm tra board: [HUONG-DAN-HARDWARE-FIRMWARE-V2-GPS.md](HUONG-DAN-HARDWARE-FIRMWARE-V2-GPS.md).

## Mẫu ghi kết quả

```text
ID:
Commit mobile/backend/firmware:
Môi trường và thiết bị:
Thời gian/người thử:
Expected:
Actual:
PASS | FAIL | CHƯA CHẠY:
Evidence:
Issue/ghi chú:
```
