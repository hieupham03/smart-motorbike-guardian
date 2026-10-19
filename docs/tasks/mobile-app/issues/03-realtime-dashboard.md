# 03 — Thiết bị, realtime và dashboard

Status: ready-for-agent
Progress: resolved
Type: task
Scope: mobile, integration
Branch: `task/mobile-03-realtime-dashboard`
Blocked by: 02

## Expected behavior

- Danh sách/chọn thiết bị và latest telemetry qua REST.
- STOMP kết nối bằng ACCESS token, subscribe `/user/queue/events` và reconnect trước khi token hết hạn.
- Snapshot phục hồi sau reconnect không ghi đè event mới; cache tách theo tài khoản/thiết bị.
- Dashboard phân biệt gateway online, sensor freshness, dữ liệu null và trạng thái bảo vệ.

## Acceptance checks

- Unit test reducer/merge, session generation, device isolation và `ACCESS_REMOVED`.
- Test với backend H2/simulator chỉ được ghi là phần mềm.

## Evidence

- `npm run typecheck`: PASS ngày 18/10/2026.
- `npm run lint`: PASS, không warning/error ngày 18/10/2026.
- `npm test`: PASS 3 suites/12 tests. Sáu test realtime kiểm tra buffer 300 mẫu, command không quay về PENDING, giữ late ACK, GPS freshness, snapshot race và revoked device.
- Dashboard dùng REST snapshot + STOMP cache, phân biệt gateway/sensor/GPS và giữ giá trị thiếu ở dạng `—`/`Chưa đo`.
- Chưa kết nối WebSocket từ điện thoại tới backend LAN và chưa nhận telemetry board thật; các mục đó là test tay/hardware.
