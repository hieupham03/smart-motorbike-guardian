# 04 — GPS, lệnh và cảnh báo

Status: ready-for-agent
Progress: open
Type: task
Scope: mobile, integration
Blocked by: 03

## Expected behavior

- Map phân biệt FIX/STALE/NO_FIX và không tạo tọa độ giả.
- Owner/Admin gửi các lệnh firmware hỗ trợ; Viewer bị chặn ở UI và backend vẫn là nguồn quyền cuối.
- Không tự retry mutation điều khiển; hiển thị PENDING/EXECUTED/REJECTED/TIMEOUT và late ACK.
- Cảnh báo có lọc, acknowledge và resolve đúng quyền.

## Acceptance checks

- Unit/component test GPS, quyền và lifecycle lệnh.
- Kiểm tra tay với simulator; hardware để `ready-for-human` nếu chưa có board.
