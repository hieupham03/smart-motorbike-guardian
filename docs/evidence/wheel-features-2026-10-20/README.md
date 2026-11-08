# Kiểm tra ba tính năng Hall/tốc độ — 20–21/10/2026

SOFTWARE ONLY. Folder mang ngày bắt đầu triển khai, tài liệu hoàn thiện 21/10. Không phải bằng chứng nạp board hoặc đo relay/motor/cảm biến vật lý.

| Kiểm tra | Kết quả |
|---|---|
| Backend Maven | 22 tests PASS: 21 integration + 1 migration; thêm snapshot/auth/order/validation, alert theo contract, reset command và WebSocket |
| Frontend | 17 tests PASS; thêm 3 ca snapshot/reset/sequence wrap/revocation |
| Frontend production build | PASS; còn warning bundle chunk >500 kB |
| Host wheel activity | PASS: session/reset/reboot/wrap, guard/window/gap recovery, overspeed dwell/hysteresis/stale |
| Host speed/UART | PASS; telemetry 39 byte và counter extension 13 byte roundtrip |
| Node A ESP32/core 2.0.17 | Build PASS: flash 753613 B, static RAM 56672 B |
| Node B S3 N16R8/OPI/CDC | Build PASS: flash 301777 B, static RAM 20456 B |
| Browser Edge headless | 6 checks PASS; REST/STOMP fixtures, reset PENDING→ACK→snapshot, chặn snapshot cũ, Viewer/stale; 0 page errors |

Browser dùng API/WebSocket fixture, không kết nối broker hay điều khiển board. Metadata HARDWARE trong fixture chỉ kiểm tra nhánh UI, không phải dữ liệu cảm biến đã thu. Screenshot có banner fixture; không dùng làm ảnh nghiệm thu hardware.

- [Browser results](wheel-ui-smoke.json)
- [Screenshot có nhãn fixture](wheel-dashboard-fixture.png)
- Script `tests/integration/wheel-ui-smoke.cjs`; web local `127.0.0.1:15174` hoặc `GUARDIAN_WHEEL_WEB_URL`.
- Log backend/build ở `build/` và `backend/target/surefire-reports/`, được ignore; không lưu credential.

Chưa thử thật: nạp hai node, xác nhận xung/vòng, ARM/relay/motor, alert MQTT→DB→web, reset/stale trên breadboard. Không pull backend/mobile mới; không thêm migration/lịch sử phiên.
