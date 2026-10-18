# Kế hoạch triển khai ứng dụng mobile — Smart Motorbike Guardian

## 1. Mục tiêu

Xây dựng ứng dụng mobile lấy dữ liệu và điều khiển thiết bị thông qua backend hiện có của Smart Motorbike Guardian. Ứng dụng cần đáp ứng đầy đủ luồng IoT của đồ án:

```text
ESP32 / NEO-6M
      ↓ MQTT
Spring Boot Backend
      ├── REST API ───────────→ Mobile app
      ├── STOMP WebSocket ────→ Mobile app khi đang mở
      └── Push service ───────→ FCM/APNs khi app chạy nền
```

Mobile không kết nối trực tiếp tới MQTT broker. Mọi dữ liệu và lệnh điều khiển phải đi qua backend để bảo đảm JWT, phân quyền, audit log và vòng đời lệnh.

Ứng dụng được xây dựng cho mục tiêu bài tập lớn IoT trên breadboard/testbed. Không xem đây là sản phẩm bảo vệ phương tiện thương mại hoặc hệ thống an toàn đã được chứng nhận.

## 2. Hướng công nghệ đề xuất

Nên sử dụng **React Native + Expo + TypeScript**, ưu tiên hoàn thiện Android trước. Lựa chọn này phù hợp vì frontend hiện tại đã dùng React và backend đã cung cấp REST API cùng STOMP WebSocket.

Không nên sao chép trực tiếp component từ frontend web vì các thành phần dùng DOM, Leaflet và Recharts không chạy trên React Native. Có thể tái sử dụng kiểu dữ liệu, enum, validation, quy tắc refresh token, reducer realtime và các test case về race condition.

| Thành phần | Công nghệ đề xuất |
|---|---|
| Mobile framework | React Native + Expo Development Build |
| Ngôn ngữ | TypeScript với strict mode |
| Điều hướng | Expo Router |
| REST API | Axios hoặc typed `fetch` client |
| REST cache | TanStack Query |
| State realtime | Reducer typed hoặc Zustand |
| WebSocket | `@stomp/stompjs` |
| Token storage | `expo-secure-store` |
| Form và validation | React Hook Form + Zod |
| Bản đồ | `react-native-maps` |
| Biểu đồ | Victory Native hoặc thư viện React Native chart được kiểm thử trước |
| Quét QR | `expo-camera` |
| Push notification | `expo-notifications` + Expo Push Service |
| Lưu dữ liệu không nhạy cảm | AsyncStorage |
| Unit/component test | Jest + React Native Testing Library |
| End-to-end test | Maestro |
| Build và phân phối | EAS Build, Android internal distribution |

Token không được lưu bằng AsyncStorage. Access token và refresh token cần được lưu bằng `expo-secure-store`, sử dụng vùng lưu trữ an toàn của Android/iOS.

## 3. Phạm vi chức năng

### 3.1. P0 — bắt buộc cho bản demo

- Đăng nhập và đăng ký tài khoản.
- Tự động refresh access token.
- Khôi phục phiên khi mở lại ứng dụng.
- Danh sách xe/thiết bị mà người dùng có quyền truy cập.
- Chọn và xem chi tiết thiết bị.
- Dashboard realtime gồm:
  - Trạng thái online/offline của gateway.
  - Trạng thái bảo vệ `PARKED`, `ARMED`, `ALARM`, `THEFT_LOCK`.
  - Tốc độ.
  - Gia tốc MPU6050.
  - Trạng thái sensor.
  - Trạng thái và độ mới dữ liệu GPS.
- Bản đồ GPS:
  - Hiển thị vị trí hợp lệ hiện tại hoặc vị trí hợp lệ gần nhất.
  - Phân biệt `FIX`, `STALE`, `NO_FIX`.
  - Không đặt marker giả khi chưa từng có GPS fix.
- Các lệnh điều khiển:
  - `ARM`.
  - `DISARM`.
  - `LOCK_ENGINE`.
  - `UNLOCK_ENGINE`.
  - `SIREN_ON`.
  - `SIREN_OFF`.
  - `REBOOT`.
- Hiển thị đúng vòng đời lệnh:
  - `PENDING → EXECUTED`.
  - `PENDING → REJECTED`.
  - `PENDING → TIMEOUT`.
- Danh sách cảnh báo realtime.
- Xác nhận đã xem và đánh dấu đã xử lý cảnh báo.
- Phân quyền Owner/Viewer; Viewer không được điều khiển thiết bị.

### 3.2. P1 — bản đầy đủ

- Quét QR claim token để onboard thiết bị.
- Lịch sử telemetry theo khoảng thời gian.
- Biểu đồ tốc độ và gia tốc.
- Lịch sử lệnh.
- Xuất và chia sẻ file CSV.
- Quản lý Viewer của thiết bị.
- Cập nhật cấu hình/ngưỡng thiết bị được backend hỗ trợ.
- Đổi mật khẩu và xem thông tin tài khoản.
- Push notification khi:
  - Phát hiện chuyển động trong trạng thái ARMED.
  - Phát hiện ngã.
  - Thiết bị chuyển offline.
  - Lệnh quan trọng bị rejected hoặc timeout.
- Deep link từ notification tới đúng cảnh báo hoặc thiết bị.

### 3.3. P2 — mở rộng sau khi hoàn thiện luồng chính

- Giao diện quản trị Admin đầy đủ.
- Sinh trắc học để mở lại ứng dụng.
- Geofence.
- Theo dõi hành trình.
- Dark mode và đa ngôn ngữ.
- Widget hoặc Live Activity.
- Thao tác nhanh từ notification.

Simulator chỉ nên xuất hiện trong Developer/Admin mode và không được để lẫn với luồng thiết bị thật trong bản demo chính thức.

## 4. Kiến trúc source đề xuất

Tạo ứng dụng mobile độc lập trong thư mục `mobile/`:

```text
mobile/
├── app/
│   ├── (auth)/
│   ├── (tabs)/
│   ├── devices/
│   ├── alerts/
│   └── settings/
├── src/
│   ├── api/
│   │   ├── client.ts
│   │   ├── auth.api.ts
│   │   ├── devices.api.ts
│   │   ├── telemetry.api.ts
│   │   └── alerts.api.ts
│   ├── realtime/
│   │   ├── stompClient.ts
│   │   ├── eventTypes.ts
│   │   └── realtimeReducer.ts
│   ├── auth/
│   ├── features/
│   │   ├── dashboard/
│   │   ├── devices/
│   │   ├── map/
│   │   ├── commands/
│   │   ├── alerts/
│   │   └── analytics/
│   ├── storage/
│   ├── components/
│   ├── hooks/
│   ├── types/
│   └── config/
├── app.config.ts
├── eas.json
└── package.json
```

Các lớp trách nhiệm chính:

- `api/`: gọi REST API, refresh token, ánh xạ lỗi và timeout.
- `realtime/`: kết nối STOMP, parse event và merge dữ liệu realtime.
- `features/`: mã nguồn theo từng chức năng nghiệp vụ.
- `storage/`: SecureStore và AsyncStorage, không để màn hình gọi storage trực tiếp.
- `types/`: kiểu dữ liệu thống nhất với DTO của backend.
- `config/`: URL và cấu hình theo môi trường.

## 5. Tích hợp backend

### 5.1. REST API

Backend hiện có các nhóm endpoint chính:

- `/api/auth/*`.
- `/api/users/me`.
- `/api/devices/*`.
- `/api/devices/{id}/telemetry/*`.
- `/api/devices/{id}/command`.
- `/api/alerts/*`.
- `/api/admin/*`.

API client mobile cần thực hiện:

1. Gắn `Authorization: Bearer <accessToken>` cho request yêu cầu xác thực.
2. Khi nhận `401`, chỉ cho phép một refresh request chạy tại cùng thời điểm.
3. Cho các request đang chờ sử dụng lại token mới.
4. Nếu refresh thất bại với `401/403`, xóa token và chuyển về màn hình đăng nhập.
5. Không xóa refresh token khi chỉ xảy ra lỗi mạng tạm thời.
6. Phân biệt rõ lỗi mất mạng, timeout, `400`, `401`, `403` và `5xx`.
7. Hủy request không còn cần thiết khi người dùng đổi thiết bị hoặc rời màn hình.

Nên sử dụng tài liệu OpenAPI tại `/api-docs` làm hợp đồng và nguồn sinh type/client nếu phù hợp.

### 5.2. Realtime WebSocket

Ứng dụng kết nối theo hợp đồng:

```text
wss://<backend-domain>/ws
Authorization: Bearer <access-token>
SUBSCRIBE /user/queue/events
```

Các event cần xử lý:

- `DEVICE`.
- `TELEMETRY`.
- `ALERT`.
- `COMMAND`.
- `ACCESS_REMOVED`.

Khi kết nối lại:

1. Refresh token nếu token sắp hết hạn.
2. Kết nối lại WebSocket với access token mới.
3. Gọi REST lấy snapshot thiết bị, cảnh báo, telemetry mới nhất và lịch sử lệnh.
4. Merge snapshot với event realtime theo version/timestamp.
5. Không để response REST cũ ghi đè event WebSocket mới hơn.

Khi socket không hoạt động, ứng dụng có thể dùng REST để khôi phục snapshot theo chu kỳ. Timer dùng để tính độ cũ dữ liệu trên giao diện không được gọi API mỗi giây.

### 5.3. Push notification

Không dựa vào WebSocket để nhận cảnh báo khi ứng dụng chạy nền hoặc đã bị hệ điều hành dừng. Cần dùng push notification cho trường hợp này.

Backend hiện cần bổ sung API quản lý push token, ví dụ:

```text
POST   /api/mobile/push-tokens
DELETE /api/mobile/push-tokens/{token}
```

Dữ liệu đề xuất:

```text
user_push_tokens
- id
- user_id
- expo_push_token
- platform
- device_name
- active
- created_at
- last_seen_at
```

Khi alert đã được lưu thành công, backend gửi push tới các user đang có quyền với thiết bị. Backend cần xử lý receipt và vô hiệu hóa token không còn đăng ký.

## 6. Kế hoạch triển khai

### Giai đoạn 0 — chốt hợp đồng, 2–3 ngày

- Chạy backend bằng H2 hoặc PostgreSQL.
- Kiểm tra Swagger/OpenAPI.
- Lưu response mẫu cho từng endpoint.
- Liệt kê enum và schema event realtime.
- Chốt Android-first.
- Xác định URL cho dev và staging.
- Tạo checklist feature parity với frontend web.

**Đầu ra:** API contract và danh sách màn hình được chốt.

### Giai đoạn 1 — nền tảng ứng dụng, 3–4 ngày

- Khởi tạo Expo TypeScript.
- Thiết lập navigation.
- Tạo theme, component cơ bản và error boundary.
- Cấu hình môi trường `development`, `staging`, `production`.
- Xây dựng API client, SecureStore và refresh token.
- Hoàn thiện login, register, profile và logout cục bộ.

**Đầu ra:** đăng nhập được và giữ phiên qua lần mở ứng dụng tiếp theo.

### Giai đoạn 2 — thiết bị và dashboard REST, 4–5 ngày

- Danh sách thiết bị.
- Chọn thiết bị.
- Chi tiết thiết bị.
- Latest telemetry.
- Trạng thái GPS, sensor và offline.
- Pull-to-refresh.
- Loading, empty và error state.

**Đầu ra:** ứng dụng hoạt động được bằng REST ngay cả khi WebSocket chưa kết nối.

### Giai đoạn 3 — realtime và bản đồ, 5–7 ngày

- STOMP client.
- Refresh token trước khi reconnect.
- Realtime reducer.
- REST snapshot sau reconnect.
- Dashboard live.
- Bản đồ GPS.
- Biểu đồ giới hạn số điểm hiển thị, ví dụ tối đa 300 mẫu.

**Đầu ra:** telemetry, trạng thái thiết bị và GPS cập nhật realtime.

### Giai đoạn 4 — điều khiển và cảnh báo, 5–7 ngày

- Các lệnh ARM, DISARM, LOCK, UNLOCK, SIREN và REBOOT.
- Hiển thị vòng đời lệnh.
- Confirm dialog cho lệnh nguy hiểm.
- Yêu cầu nhập lại mật khẩu cho `LOCK_ENGINE` theo hợp đồng backend.
- Danh sách và chi tiết cảnh báo.
- Acknowledge và resolve.
- Phân quyền Owner/Viewer.
- Xử lý `ACCESS_REMOVED` và xóa cache thiết bị bị thu hồi quyền.

**Đầu ra:** đường điều khiển hai chiều và phân quyền hoàn chỉnh.

### Giai đoạn 5 — tính năng đầy đủ, 5–7 ngày

- QR onboarding.
- Lịch sử telemetry.
- Bộ lọc thời gian.
- Xuất và chia sẻ CSV.
- Quản lý Viewer.
- Push token API và push notification.
- Deep link.
- Admin screen nếu rubric yêu cầu.

### Giai đoạn 6 — hardening, 5–7 ngày

- Unit test auth, reducer và API client.
- Integration test REST + WebSocket.
- E2E Android bằng Maestro.
- Kiểm tra mạng chậm, mất mạng và chuyển Wi-Fi/4G.
- Kiểm tra token hết hạn trong lúc xem dashboard.
- Kiểm tra ứng dụng ở foreground, background và terminated.
- Tối ưu biểu đồ và render telemetry.
- Tạo APK internal test.

### Giai đoạn 7 — nghiệm thu với hardware thật

- Hall/MPU → MQTT → backend → mobile.
- ARM/DISARM và ACK thật.
- LOCK khi bánh đang quay hoặc dữ liệu sensor stale.
- Relay/interlock vật lý.
- Mất nguồn Node A → trạng thái offline.
- GPS ngoài trời `FIX → STALE`.
- Ít nhất 20 phép đo latency.
- Chạy liên tục 30–60 phút.

Không dùng dữ liệu simulator để thay cho bằng chứng nghiệm thu phần cứng.

### Ước lượng tổng thể

- Một người thực hiện: khoảng 5–7 tuần.
- Hai người chia mobile và backend/push: khoảng 3–4 tuần.
- MVP Android chưa có push: khoảng 2–3 tuần.

## 7. Lưu ý về dữ liệu và trạng thái

- `null` nghĩa là chưa đo hoặc không hợp lệ; không được chuyển thành `0`.
- Không hiển thị điện áp pin giả khi hardware chưa đo ADC.
- `sensorConnected` mô tả độ mới của Node B, không đồng nghĩa gateway đang online.
- `PARKED` là trạng thái bảo vệ, không chứng minh bánh xe đang đứng yên.
- Tọa độ bằng `0` có thể hợp lệ; không kiểm tra latitude/longitude bằng truthy.
- Khi `NO_FIX`, chỉ hiển thị last known location nếu đã từng có fix và phải ghi rõ đây là vị trí cũ.
- Phân biệt thời gian server nhận dữ liệu với uptime firmware.
- Dữ liệu alert từ buffer firmware có thể đến muộn.

## 8. Lưu ý về điều khiển

HTTP trả thành công và MQTT publish thành công không có nghĩa thiết bị đã thực thi lệnh. Ứng dụng phải giữ trạng thái `PENDING` cho đến khi nhận ACK hoặc timeout.

Không tự động retry các lệnh nguy hiểm như LOCK, UNLOCK, SIREN hoặc REBOOT sau timeout. Thiết bị có thể đã thực thi nhưng ACK bị mất.

Security state phải lấy từ telemetry, không suy diễn từ ACK của lệnh ARM/DISARM. ACK chứng minh firmware đã xử lý lệnh, không phải bằng chứng độc lập rằng relay/tiếp điểm vật lý hoạt động đúng.

## 9. Bảo mật

- Không log JWT, refresh token, mật khẩu hoặc claim token.
- Không lưu token trong AsyncStorage.
- Chỉ dùng HTTPS/WSS ở staging và release.
- Google Maps key phải được giới hạn theo Android package/iOS bundle ID.
- Không nhúng MQTT credential trong ứng dụng.
- Ẩn simulator khỏi bản release.
- Biometric chỉ bảo vệ việc mở lại phiên, không thay thế xác thực backend cho lệnh nguy hiểm.
- Kiểm tra lại quyền ở backend; không chỉ ẩn nút trên giao diện.
- Không hiển thị dữ liệu thiết bị sau khi nhận `ACCESS_REMOVED`.

## 10. Môi trường và kết nối

`localhost:8080` trên điện thoại là chính điện thoại, không phải máy tính chạy backend. Khi test trên thiết bị thật cần dùng một trong các phương án:

- IP LAN của máy backend.
- Backend staging có HTTPS.
- Tunnel phù hợp cho môi trường phát triển.

Backend WebSocket hiện giới hạn origin. Cần kiểm tra handshake từ React Native development build và bổ sung origin chính xác nếu kết nối bị từ chối. Không mở origin bằng `*` ở production.

HTTP cleartext có thể bị Android/iOS chặn hoặc yêu cầu cấu hình riêng. Nên dùng HTTPS cho staging thay vì nới lỏng bảo mật của bản release.

## 11. Hiệu năng và khả năng phục hồi

- Dashboard chỉ giữ tối đa khoảng 300 mẫu telemetry.
- Analytics dùng phân trang và giới hạn tối đa theo API, hiện là 5.000 mẫu mỗi trang/truy vấn.
- Chỉ render chart của thiết bị đang được chọn.
- Batch update nếu biểu đồ bị giật.
- Hủy subscription và timer khi logout hoặc đổi tài khoản.
- Khi app trở lại foreground, luôn gọi REST lấy snapshot trước hoặc song song với reconnect.
- Có trạng thái riêng cho `CONNECTED`, `CONNECTING`, `DISCONNECTED` và `ERROR`.
- Không xóa phiên chỉ vì mạng tạm thời bị mất.

## 12. Kế hoạch kiểm thử

### Kiểm thử tự động

- Login và refresh token single-flight.
- Refresh token hết hạn hoặc bị từ chối.
- Không logout khi chỉ mất mạng tạm thời.
- Merge REST snapshot với event WebSocket.
- Event mới không bị response cũ ghi đè.
- Cách ly dữ liệu giữa các thiết bị.
- Xóa cache khi nhận `ACCESS_REMOVED`.
- GPS age, `FIX`, `STALE`, `NO_FIX`.
- Quyền Owner/Viewer trên giao diện.
- Lifecycle lệnh và duplicate/late ACK.
- Deep link từ push notification.

### Kiểm thử thủ công

- Mất mạng khi đang xem dashboard.
- Chuyển từ Wi-Fi sang 4G.
- App chạy nền và quay lại foreground.
- Token hết hạn trong khi WebSocket đang kết nối.
- App bị force stop rồi mở lại.
- Thiết bị chuyển offline/online.
- GPS chưa fix, có fix rồi stale.
- Owner thu hồi quyền Viewer khi Viewer đang mở app.

### Kiểm thử hardware

Kết quả compile, test bằng simulator hoặc broker test chỉ được ghi nhận là bằng chứng phần mềm. GPS fix, relay, interlock và end-to-end phải có log, video hoặc phép đo từ phần cứng thật.

## 13. Tiêu chí hoàn thành

Ứng dụng chỉ được coi là hoàn thành khi:

- Tất cả chức năng P0 và P1 cần cho rubric có test.
- Viewer không gửi được lệnh ở cả UI và API.
- Token hết hạn không gây mất dữ liệu hoặc vòng lặp refresh.
- WebSocket reconnect và REST snapshot không làm state quay ngược.
- App chạy nền nhận được alert bằng push notification.
- Không hiển thị vị trí, tốc độ, pin hoặc sensor value giả.
- APK cài và chạy được trên ít nhất hai thiết bị Android.
- Có log/video chứng minh đường dữ liệu và điều khiển với hardware thật.
- Phân biệt rõ kết quả phần mềm và nghiệm thu phần cứng.

## 14. Tài liệu liên quan

- [Realtime backend/frontend](REALTIME-BACKEND-FRONTEND.md).
- [Bàn giao backend, frontend và tích hợp](BAN-GIAO-BACKEND-FRONTEND-VA-TICH-HOP.md).
- [Hướng dẫn hardware/firmware V2 GPS](HUONG-DAN-HARDWARE-FIRMWARE-V2-GPS.md).
- [Nghiệm thu hardware/firmware](NGHIEM-THU-HARDWARE-FIRMWARE.md).
- [Project specification](PROJECT_SPECIFICATION.md).
- [Expo SecureStore và authentication](https://docs.expo.dev/guides/authentication/).
- [Expo push notification](https://docs.expo.dev/push-notifications/what-you-need-to-know/).
- [Expo Push Service](https://docs.expo.dev/push-notifications/sending-notifications/).
- [Expo react-native-maps](https://docs.expo.dev/versions/latest/sdk/map-view/).

