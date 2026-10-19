# 06 — Push notification end-to-end

Status: resolved
Progress: complete
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

## Kết quả triển khai

- Migration V3 tạo `push_tokens` và `push_deliveries`, có unique key chống gửi lặp theo event/token.
- API JWT đăng ký và hủy token theo user + installation; token được chuyển chủ an toàn khi đổi tài khoản.
- Gửi push cho alert mới, thiết bị chuyển offline và trạng thái lệnh terminal sau commit.
- Lưu Expo ticket, poll receipt, ghi lỗi và vô hiệu hóa token khi `DeviceNotRegistered`.
- Mobile đăng ký quyền/token, hủy trước logout, xử lý foreground/background/cold start và chỉ deep-link khi user vẫn còn quyền với device.

## Bằng chứng tự động

- Backend migration + integration test dùng `PushTransport` mock, không gọi Expo thật.
- Mobile `npm run typecheck`, `npm run lint`: PASS.
- Mobile `npm test -- --detectOpenHandles`: PASS, 8 suites/28 tests.

## Chưa xác minh (`ready-for-human`)

- Nhận push thật cần EAS development/production build, project ID và cấu hình FCM/APNs hợp lệ; Expo Go không phải môi trường nghiệm thu.
- Cần kiểm tra foreground, background, app bị kill, tap notification và logout/đổi tài khoản trên điện thoại thật.
