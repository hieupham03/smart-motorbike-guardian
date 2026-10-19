# Mobile app implementation map

Status: ready-for-agent
Progress: claimed
Scope: mobile, backend, integration, documentation
Branch: `feature-mobile-app`
Started: 18/10/2026

Mục tiêu: triển khai ứng dụng React Native/Expo theo `docs/KE-HOACH-TRIEN-KHAI-MOBILE-APP.md`, giữ mobile chỉ giao tiếp với backend qua REST/STOMP/push, có kiểm thử phần mềm và hướng dẫn nghiệm thu trực tiếp.

## Task map

| ID | Task | Phạm vi | Phụ thuộc | Trạng thái |
|---|---|---|---|---|
| 01 | [Scaffold và chuẩn hóa dự án](issues/01-scaffold.md) | mobile, docs | Không | Hoàn thành |
| 02 | [API client và xác thực](issues/02-auth-api.md) | mobile | 01 | Đang thực hiện |
| 03 | [Thiết bị, realtime và dashboard](issues/03-realtime-dashboard.md) | mobile, integration | 02 | Chưa bắt đầu |
| 04 | [GPS, lệnh và cảnh báo](issues/04-control-alerts.md) | mobile, integration | 03 | Chưa bắt đầu |
| 05 | [Tính năng quản lý và lịch sử](issues/05-management-history.md) | mobile | 04 | Chưa bắt đầu |
| 06 | [Push notification end-to-end](issues/06-push-notifications.md) | backend, mobile | 02, 04 | Chưa bắt đầu |
| 07 | [Kiểm thử, tài liệu và bàn giao](issues/07-release-handoff.md) | integration, documentation | 01–06 | Chưa bắt đầu |

## Quy tắc bằng chứng

- Mỗi task có commit riêng và được push lên `origin/feature-mobile-app` sau khi kiểm tra.
- Chỉ ghi PASS cho lệnh test đã chạy thực tế.
- Build/typecheck/simulator là bằng chứng phần mềm, không phải nghiệm thu breadboard, relay hoặc GPS thật.
- Kiểm tra cần thiết bị vật lý được đánh dấu `ready-for-human` trong tài liệu bàn giao.
- Không commit `.env`, signing key, Maps key, FCM/APNs credential hoặc token người dùng.

## Comments

- Nhánh dự kiến `feature/mobile-app` không thể tạo vì repository đã có ref `feature`; sử dụng `feature-mobile-app`.
- Expo scaffold chốt SDK 58, React Native 0.88 và TypeScript 6; phiên bản cụ thể được khóa trong `mobile/package-lock.json`.
