# 02 — API client và xác thực

Status: ready-for-agent
Progress: claimed
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
