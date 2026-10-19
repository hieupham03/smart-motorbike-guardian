# 06 — Push notification end-to-end

Status: ready-for-agent
Progress: open
Type: task
Scope: backend, mobile, integration
Branch: `task/mobile-06-push-notifications`
Blocked by: 02, 04

## Expected behavior

- Backend có API đăng ký/hủy push token theo user, migration và kiểm tra quyền.
- Token được hủy/đổi đúng khi logout hoặc đổi tài khoản.
- Alert/offline/command terminal phát push sau commit, có chống gửi lặp và xử lý receipt lỗi.
- Mobile xử lý foreground/background/cold start và deep link có xác minh quyền.

## Acceptance checks

- Backend integration tests không gọi dịch vụ push thật.
- Mobile unit tests cho registration lifecycle và notification routing.
- Nhận push trên thiết bị thật là `ready-for-human` nếu chưa có credential/device.
