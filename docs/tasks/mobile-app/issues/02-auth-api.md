# 02 — API client và xác thực

Status: ready-for-agent
Progress: resolved
Type: task
Scope: mobile
Blocked by: 01

## Expected behavior

- API client typed dùng base URL theo môi trường, parse `ApiResponse` và phân loại lỗi.
- Access/refresh token lưu bằng SecureStore.
- Refresh single-flight; request chỉ replay một lần; callback phiên cũ không phục hồi token sau logout.
- Có login, register, khôi phục phiên, profile và đổi mật khẩu.

## Acceptance checks

- Unit test token store, refresh đồng thời, refresh lỗi mạng và refresh bị từ chối.
- Typecheck, lint và test mobile.

## Evidence

- `npm run typecheck`: PASS ngày 18/10/2026.
- `npm run lint`: PASS, không warning/error ngày 18/10/2026.
- `npm test`: PASS 2 suites/6 tests; gồm expiry mili giây, hydrate, stale generation, refresh single-flight, lỗi mạng giữ phiên và refresh 401 xóa phiên.
- `npx expo export --platform web`: PASS bundle smoke; output tạm đã xóa sau kiểm tra.
- Chưa đăng nhập trên thiết bị thật hoặc backend chạy qua LAN; kiểm tra đó thuộc task bàn giao/test tay.
- `npm audit --omit=dev` còn 49 cảnh báo transitive trong Expo/Metro/Jest/toolchain. Công cụ chỉ đưa ra fix ép hạ Expo xuống 44 hoặc các breaking change không tương thích; không chạy `npm audit fix --force`. Cần theo dõi bản vá SDK 58 và chạy lại audit trước release.
