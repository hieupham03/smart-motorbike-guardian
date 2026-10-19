# 04 — GPS, lệnh và cảnh báo

Status: ready-for-agent
Progress: resolved
Type: task
Scope: mobile, integration
Branch: `task/mobile-04-control-alerts`
Blocked by: 03

## Expected behavior

- Map phân biệt FIX/STALE/NO_FIX và không tạo tọa độ giả.
- Owner/Admin gửi các lệnh firmware hỗ trợ; Viewer bị chặn ở UI và backend vẫn là nguồn quyền cuối.
- Không tự retry mutation điều khiển; hiển thị PENDING/EXECUTED/REJECTED/TIMEOUT và late ACK.
- Cảnh báo có lọc, acknowledge và resolve đúng quyền.

## Acceptance checks

- Unit/component test GPS, quyền và lifecycle lệnh.
- Kiểm tra tay với simulator; hardware để `ready-for-human` nếu chưa có board.

## Evidence

- `npm run typecheck`: PASS ngày 18/10/2026.
- `npm run lint`: PASS, không warning/error ngày 18/10/2026.
- `npm test`: PASS 5 suites/21 tests; có test GPS NO_FIX/FIX/STALE, tọa độ 0, bounds, quyền Viewer/Owner/Admin và merge lifecycle command/alert.
- `npx expo export --platform web`: PASS sau khi thêm các route map/control/alerts; web dùng placeholder, Android/iOS dùng `react-native-maps`.
- Lệnh điều khiển không có retry chung; LOCK yêu cầu mật khẩu; UI chỉ ghi PENDING cho tới event ACK/TIMEOUT.
- Chưa xác minh marker trên development build, ACK firmware, relay, interlock hoặc cảnh báo board thật. Các bước này được bàn giao cho kiểm tra trực tiếp.
