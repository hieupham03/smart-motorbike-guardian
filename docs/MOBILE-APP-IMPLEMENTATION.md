# Triển khai mobile app

Cập nhật: 18/10/2026. Đây là ứng dụng phục vụ prototype IoT trên testbed, không phải sản phẩm bảo vệ xe thương mại.

## Kiến trúc đã chốt

```text
ESP32 Node B → UART → ESP32 Node A → MQTT → Spring Boot → PostgreSQL
                                                  ├→ REST snapshot/lệnh
                                                  ├→ STOMP /user/queue/events
                                                  └→ Expo Push Service
                                                            ↓
                                             Expo React Native mobile
```

Mobile không kết nối MQTT trực tiếp. JWT access/refresh được giữ trong SecureStore; dữ liệu server nằm trong TanStack Query. REST phục hồi snapshot, STOMP cập nhật realtime, push dùng để báo khi app không ở foreground.

## Công nghệ

- Expo SDK 58, React Native 0.88, React 19.3, TypeScript 6 và Expo Router `src/app`.
- Axios client có refresh single-flight và chỉ replay một lần; Zod/React Hook Form cho biểu mẫu.
- STOMP.js cho WebSocket có heartbeat/reconnect; SecureStore và AsyncStorage cho session/chọn thiết bị/installation ID.
- Expo Camera, Maps, Notifications, FileSystem và Sharing.
- Backend Spring Boot 3.2, Java 17, JPA/Flyway V1–V3, PostgreSQL/H2 và Expo Push REST.

## Phạm vi chức năng

- Auth: đăng ký Owner/Viewer, đăng nhập, giữ/refresh phiên, profile, đổi mật khẩu và logout.
- Device: danh sách/quyền, dashboard, nguồn HARDWARE/SIMULATED, freshness và dữ liệu null đúng nghĩa.
- GPS: FIX/STALE/NO_FIX, giữ last-known; tọa độ 0 hợp lệ, không tạo marker giả.
- Control: ARM/DISARM/LOCK/UNLOCK/SIREN/REBOOT; LOCK cần step-up; hiển thị PENDING/ACK/TIMEOUT/late ACK.
- Alert: danh sách/filter, acknowledge, resolve theo quyền.
- Management: QR/manual onboarding, metadata/ngưỡng backend, quản lý Viewer.
- History: telemetry 1h/24h/7d, biểu đồ tối đa 40 điểm, API tối đa 5.000 mẫu, lịch sử 100 lệnh và CSV.
- Admin: user/device/audit, khóa/mở tài khoản.
- Push: alert/offline/command terminal, đăng ký/hủy token, dedupe, ticket/receipt và deep link có kiểm tra quyền.

## Nhật ký task và nhánh

Các nhánh xếp tầng theo dependency; mỗi nhánh có đúng một commit tính năng chính và đã push lên `origin`.

| Task | Nhánh | Commit | Kết quả |
|---|---|---|---|
| 01 Scaffold | `task/mobile-01-scaffold` | `cc40b3b` | Expo skeleton, cấu hình, task map, gitignore |
| 02 Auth/API | `task/mobile-02-auth-api` | `1614752` | session bảo mật, API client, auth UI |
| 03 Realtime | `task/mobile-03-realtime-dashboard` | `a8f13e5` | devices, dashboard, STOMP/state merge |
| 04 Control | `task/mobile-04-control-alerts` | `2b6864f` | GPS, command, alert, phân quyền |
| 05 Management | `task/mobile-05-management-history` | `cd1e5a5` | onboarding, config/viewer, history/CSV/admin |
| 06 Push | `task/mobile-06-push-notifications` | `084e287` | backend/mobile Expo push end-to-end ở mức phần mềm |
| 07 Release | `task/mobile-07-release-handoff` | xem `git log` | kiểm thử, tài liệu và bàn giao |

Chi tiết tiêu chí/kết quả từng task: [tasks/mobile-app/map.md](tasks/mobile-app/map.md).

## Quyết định và giới hạn

- Cấu hình ngưỡng hiện chỉ được backend lưu/xử lý; firmware chưa nhận `CONFIG_THRESHOLDS`.
- HTTP 200 khi gửi lệnh chỉ là PENDING, không phải bằng chứng relay/GPIO đã tác động.
- Web export/unit test không chứng minh camera, bản đồ native, share sheet hay push thật.
- Push thật cần EAS project, FCM/APNs và development/production build; không nghiệm thu bằng Expo Go.
- GPS, relay, interlock, MQTT qua board và latency vật lý phải nghiệm thu theo tài liệu test trực tiếp.
