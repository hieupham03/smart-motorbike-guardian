# 03 — Thiết bị, realtime và dashboard

Status: ready-for-agent
Progress: open
Type: task
Scope: mobile, integration
Blocked by: 02

## Expected behavior

- Danh sách/chọn thiết bị và latest telemetry qua REST.
- STOMP kết nối bằng ACCESS token, subscribe `/user/queue/events` và reconnect trước khi token hết hạn.
- Snapshot phục hồi sau reconnect không ghi đè event mới; cache tách theo tài khoản/thiết bị.
- Dashboard phân biệt gateway online, sensor freshness, dữ liệu null và trạng thái bảo vệ.

## Acceptance checks

- Unit test reducer/merge, session generation, device isolation và `ACCESS_REMOVED`.
- Test với backend H2/simulator chỉ được ghi là phần mềm.
