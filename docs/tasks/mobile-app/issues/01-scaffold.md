# 01 — Scaffold và chuẩn hóa dự án mobile

Status: ready-for-agent
Progress: resolved
Type: task
Scope: mobile, documentation
Branch: `task/mobile-01-scaffold`
Blocked by: none

## Expected behavior

- Có dự án Expo/TypeScript trong `mobile/`, dùng Expo Router và Continuous Native Generation.
- Có cấu hình development/preview/production, application ID và custom scheme.
- `.gitignore` loại trừ dependency, native output, credential và file môi trường local.
- Có lệnh lint, typecheck, test và doctor.
- Có map/ticket theo dõi các phần triển khai tiếp theo.

## Acceptance checks

- `npm run typecheck`.
- `npm run lint`.
- `npx expo-doctor`.
- `git diff --check`.

## Evidence

- `npm run typecheck`: PASS ngày 18/10/2026.
- `npm run lint`: PASS ngày 18/10/2026.
- `npx expo-doctor`: PASS 20/20 checks ngày 18/10/2026.
- `git diff --check`: PASS; Git chỉ cảnh báo line ending LF/CRLF của `.gitignore`, không có whitespace error.
- Chưa build APK hoặc chạy trên điện thoại; đây mới là bằng chứng scaffold/host.
