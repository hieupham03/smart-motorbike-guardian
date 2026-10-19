# 05 — Tính năng quản lý và lịch sử

Status: resolved
Progress: complete
Type: task
Scope: mobile
Branch: `task/mobile-05-management-history`
Blocked by: 04

## Expected behavior

- QR/manual onboarding, quản lý Viewer và cấu hình metadata/ngưỡng backend.
- Lịch sử telemetry/lệnh, biểu đồ gọn và export/chia sẻ CSV.
- Giao diện profile và chức năng admin cần thiết.
- UI ghi rõ giới hạn 5.000 mẫu và cấu hình chưa được firmware áp dụng.

## Acceptance checks

- Typecheck, lint, test và kiểm tra navigation/deep link liên quan.

## Kết quả triển khai

- Onboarding bằng QR hoặc nhập claim token thủ công; chấp nhận token thuần, JSON và URL query.
- Quản lý metadata, ngưỡng backend, danh sách Viewer, cấp và gỡ quyền theo vai trò.
- Lịch sử telemetry 1 giờ/24 giờ/7 ngày, biểu đồ rút mẫu, lịch sử lệnh và xuất/chia sẻ CSV có JWT.
- Profile có đổi mật khẩu, đăng xuất; màn hình ADMIN có người dùng, thiết bị, audit log và khóa/mở tài khoản.
- UI ghi rõ giới hạn 5.000 mẫu và ngưỡng chưa được đồng bộ xuống firmware.

## Bằng chứng tự động

- `npm run typecheck`: PASS.
- `npm run lint`: PASS, không warning/error.
- `npm test`: PASS, 7 suites/26 tests.
- `npx expo export --platform web --output-dir .tmp-web-export`: PASS; artifact tạm đã xóa.

## Chưa xác minh trên phần cứng (`ready-for-human`)

- Cấp quyền camera và quét QR trên Android/iOS thật.
- Onboard với claim token backend thật; quản lý Viewer/config với nhiều vai trò thật.
- Chia sẻ file CSV qua share sheet Android/iOS.
- Điều hướng và nhập liệu trên màn hình điện thoại thật.

Không xem web export hoặc unit test là bằng chứng cho các mục trên.
