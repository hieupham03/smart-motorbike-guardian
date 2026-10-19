# Kế hoạch triển khai ứng dụng mobile — Smart Motorbike Guardian

Ngày cập nhật: 18/10/2026. Bản kế hoạch chỉnh sửa sau review.

Cơ sở đối chiếu: nhánh `feature`, commit `62dbff2f3a8f4a63cf53de0b7d5408b0c578b1a3` của repository [smart-motorbike-guardian](https://github.com/hieupham03/smart-motorbike-guardian/tree/62dbff2f3a8f4a63cf53de0b7d5408b0c578b1a3). Những mô tả “hiện có” bên dưới áp dụng cho commit này; cần kiểm tra thay đổi hợp đồng khi bắt đầu triển khai.

Đây là kế hoạch triển khai, không phải xác nhận đã chạy mobile, đã nhận push hoặc đã nghiệm thu phần cứng. Các thời lượng là ước lượng ngày làm việc, chưa phải cam kết tiến độ.

## 1. Mục tiêu

Xây dựng ứng dụng mobile lấy dữ liệu và điều khiển thiết bị thông qua backend hiện có của Smart Motorbike Guardian. Ứng dụng cần đáp ứng đầy đủ luồng IoT của đồ án:

```text
Hall / MPU6050 / NEO-6M → Node B → UART → Node A
      ↓ MQTT
Spring Boot Backend
      ├── REST API ───────────→ Mobile app
      ├── STOMP WebSocket ────→ Mobile app khi đang mở
      └── Push service (cần bổ sung) → Expo Push Service → FCM/APNs
```

Mobile không kết nối trực tiếp tới MQTT broker. Mọi dữ liệu và lệnh điều khiển phải đi qua backend để bảo đảm JWT, phân quyền, audit log và vòng đời lệnh.

Ứng dụng được xây dựng cho mục tiêu bài tập lớn IoT trên breadboard/testbed. Không xem đây là sản phẩm bảo vệ phương tiện thương mại hoặc hệ thống an toàn đã được chứng nhận.

## 2. Hướng công nghệ đề xuất

Nên sử dụng **React Native + Expo + TypeScript**, ưu tiên hoàn thiện Android trước. Lựa chọn này phù hợp vì frontend hiện tại đã dùng React và backend đã cung cấp REST API cùng STOMP WebSocket.

Không nên sao chép trực tiếp component từ frontend web vì các thành phần dùng DOM, Leaflet và Recharts không chạy trên React Native. Có thể chuyển đổi hợp đồng DTO/enum, quy tắc validation, refresh token, reducer realtime và các test case về race condition. Frontend hiện dùng JavaScript/JSX; cần khai báo type TypeScript và thay các API trình duyệt như localStorage, window, atob và cơ chế tải file DOM. Không coi mã web là thư viện dùng chung có thể import trực tiếp.

| Thành phần | Công nghệ đề xuất |
|---|---|
| Mobile framework | React Native + Expo Development Build |
| Ngôn ngữ | TypeScript với strict mode |
| Điều hướng | Expo Router |
| REST API | Axios với client typed, timeout và cancellation thống nhất |
| REST cache | TanStack Query |
| State realtime | Reducer typed dùng để cập nhật TanStack Query cache; không tạo bản sao server state trong Zustand |
| WebSocket | `@stomp/stompjs` |
| Token storage | `expo-secure-store` |
| Form và validation | React Hook Form + Zod |
| Bản đồ | `react-native-maps` |
| Biểu đồ | Chốt sau spike trên Development Build; thử Victory Native hoặc thư viện tương thích Expo SDK đã chọn |
| Quét QR | `expo-camera` |
| Push notification | `expo-notifications` + Expo Push Service |
| Lưu tùy chọn giao diện không nhạy cảm | AsyncStorage |
| Xuất/chia sẻ CSV | expo-file-system + expo-sharing, qua adapter được kiểm thử trên Android |
| Unit/component test | Jest + React Native Testing Library |
| End-to-end test | Maestro |
| Build và phân phối | EAS Build, Android internal distribution |

Token không được lưu bằng AsyncStorage. Access token và refresh token cần được lưu bằng `expo-secure-store`, sử dụng vùng lưu trữ an toàn của Android/iOS.

## 3. Phạm vi chức năng

### 3.1. P0 — bản demo IoT hoàn chỉnh (mốc M3)

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
- Xác nhận đã xem cảnh báo; chỉ Owner/Admin được đánh dấu đã xử lý.
- Phân quyền Owner/Viewer; Viewer không được điều khiển thiết bị.

### 3.2. P1 — bản đầy đủ

- Quét QR claim token để onboard thiết bị.
- Lịch sử telemetry theo khoảng thời gian.
- Biểu đồ tốc độ và gia tốc.
- Màn hình lịch sử lệnh đầy đủ. P0 vẫn cần truy vấn lệnh gần đây để khôi phục trạng thái sau reconnect hoặc mất response gửi lệnh.
- Xuất và chia sẻ file CSV.
- Quản lý Viewer của thiết bị.
- Cập nhật thông tin và ngưỡng lưu tại backend. Không tuyên bố ngưỡng đã áp dụng trên board; CONFIG_THRESHOLDS chưa được firmware hiện tại hỗ trợ.
- Đổi mật khẩu và xem thông tin tài khoản.
- Push notification khi:
  - Phát hiện chuyển động trong trạng thái ARMED.
  - Phát hiện ngã.
  - Thiết bị chuyển offline.
  - Lệnh quan trọng bị rejected hoặc timeout.
- Deep link từ notification tới đúng cảnh báo hoặc thiết bị.

### 3.3. MVP thu gọn — demo hai chiều sớm (mốc M2)

MVP là tập con của P0: đăng nhập/giữ phiên, danh sách thiết bị, dashboard và GPS, realtime, ARM/DISARM với ACK/timeout, danh sách cảnh báo và chặn Viewer điều khiển. Có snapshot phục hồi, xử lý thu hồi quyền và kiểm thử phần cứng cho luồng đã triển khai. Có thể dùng tài khoản/thiết bị được chuẩn bị trước để không phụ thuộc onboarding.

Các lệnh còn lại, đăng ký trên mobile, acknowledge/resolve đầy đủ và kiểm thử toàn bộ P0 được hoàn thành ở M3. MVP chưa có push nên chỉ nhận cảnh báo trực tiếp khi app đang hoạt động; giới hạn này phải ghi trong demo.

### 3.4. P2 — mở rộng sau khi hoàn thiện luồng chính

- Giao diện quản trị Admin đầy đủ.
- Sinh trắc học để mở lại ứng dụng.
- Geofence.
- Theo dõi hành trình.
- Dark mode và đa ngôn ngữ.
- Widget hoặc Live Activity.
- Thao tác nhanh từ notification.

Simulator chỉ nên xuất hiện trong Developer/Admin mode và không được để lẫn với luồng thiết bị thật trong bản demo chính thức.

### 3.5. Ma trận quyền theo thiết bị

| Thao tác | Owner | Viewer | Admin |
|---|---|---|---|
| Xem thiết bị, telemetry, GPS, cảnh báo, lịch sử lệnh | Có | Có | Có |
| Acknowledge: xác nhận cảnh báo đã xem | Có | Có | Có |
| Resolve: đánh dấu cảnh báo đã xử lý | Có | Không | Có |
| Gửi lệnh điều khiển | Có | Không | Có |
| Cập nhật cấu hình, mời/gỡ Viewer | Có | Không | Có |

Owner/Viewer phải lấy từ `DeviceDto.currentUserRole`, không suy ra chỉ từ role tài khoản. Backend là nơi quyết định quyền cuối cùng. Khi trả 403 vì mất quyền thiết bị, làm mới danh sách quyền và xóa dữ liệu liên quan; không coi mọi 403 là refresh token hết hạn.

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
│   ├── notifications/
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
- `notifications/`: đăng ký token, nhận thông báo, xử lý notification response và deep link.

### 4.1. Nguồn dữ liệu thống nhất

- TanStack Query cache giữ server state: thiết bị, latest telemetry, cảnh báo, lệnh và lịch sử. Màn hình đọc cùng cache này.
- Realtime reducer là hàm typed thuần xử lý quy tắc merge và cập nhật cache; không giữ thêm một bản server state độc lập trong Context/Zustand.
- State cục bộ chỉ giữ bộ lọc, thiết bị đang chọn, form và trạng thái kết nối. Bộ đệm biểu đồ live tối đa 300 mẫu/thiết bị được định nghĩa rõ trong cache; analytics có cache lịch sử riêng.
- Query key tối thiểu phân biệt tài khoản, thiết bị và tham số truy vấn; dùng `deviceId` cho API/cache, không tráo với `deviceUuid` phục vụ định danh phần cứng.
- Mọi snapshot/event đi qua lớp merge thống nhất. Không để kết quả refetch tự ghi đè cache mà bỏ qua kiểm tra phiên và event đã nhận trong lúc request chạy.
- Mỗi phiên đăng nhập có một session generation. Callback thuộc generation cũ phải bị bỏ qua sau logout/đổi tài khoản, kể cả request không hủy được.
- Khi logout: hủy request, socket, timer, xóa toàn bộ cache tài khoản và token. ACCESS_REMOVED phải hủy request và xóa mọi cache của thiết bị, kể cả history/analytics.

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

Nên sử dụng tài liệu OpenAPI tại `/api-docs` làm hợp đồng và nguồn sinh type/client nếu phù hợp. Phản hồi JSON nghiệp vụ có envelope `ApiResponse`; CSV là byte/file, không parse như JSON.

Quy tắc auth bắt buộc:

- Dùng chung một single-flight refresh cho REST, STOMP reconnect và khôi phục foreground. Request refresh dùng client riêng để tránh vòng lặp interceptor.
- Mỗi request chỉ được replay sau refresh tối đa một lần khi nhận 401 xác thực. Không áp dụng retry chung cho mutation điều khiển.
- Refresh trả cả access token và refresh token mới: thay cặp token, cập nhật phiên đang dùng; callback refresh của phiên cũ không được ghi token trở lại sau logout.
- `expiresIn` hiện được backend truyền từ cấu hình mili giây; không mặc định đơn vị giây. JWT `exp` dùng epoch giây. Chốt hai đơn vị trong API contract.
- Logout hiện là xóa phiên cục bộ; chưa có endpoint thu hồi JWT. Không mô tả refresh token mới là đã vô hiệu hóa refresh token cũ hoặc đổi mật khẩu là đã thu hồi toàn bộ phiên.
- Khi offline, giữ phiên nhưng hiển thị dữ liệu đã cũ; không cho rằng quyền và trạng thái thiết bị vẫn còn được xác minh trực tuyến.

### 5.1.1. Bảng đối chiếu khả năng backend

| Chức năng | Hợp đồng hiện có | Giới hạn / phần phải làm |
|---|---|---|
| Login/register/refresh | POST /api/auth/login, /register, /refresh | Mobile xây client, SecureStore và single-flight |
| Profile/đổi mật khẩu | GET /api/users/me; POST /api/auth/change-password | Không có logout/revoke token server trong controller auth hiện tại |
| Danh sách/chi tiết thiết bị | GET /api/devices; GET /api/devices/{id} | Phân quyền qua currentUserRole |
| Latest/history telemetry | GET /api/devices/{id}/telemetry/latest và /telemetry | Epoch giây, page từ 0, size 1–5.000 |
| Gửi/khôi phục lệnh | POST /api/devices/{id}/command; GET /commands | Tối đa 100 lệnh gần nhất; chưa có idempotency key phía client |
| Cảnh báo | GET /api/alerts?device_id=...&status=...; POST /{id}/acknowledge, /resolve | Chưa có endpoint GET chi tiết alert riêng; danh sách chưa phân trang |
| Onboard | POST /api/devices/onboard | QR cần chốt payload; có nhập claim token thủ công |
| Viewer | GET/POST /api/devices/{id}/users; DELETE /users/{userId} | Mời tài khoản đã tồn tại; không phải gửi email mời |
| Cấu hình | PATCH /api/devices/{id}/config | Chỉ lưu DB; chưa có luồng áp dụng ngưỡng xuống firmware |
| CSV | GET /api/devices/{id}/telemetry/export | Hiện tối đa 5.000 mẫu gần nhất trong khoảng |
| Push | Chưa có luồng quản lý token/gửi push trong source đã review | Cần backend + mobile + cấu hình dịch vụ push |

Màn hình chi tiết cảnh báo ban đầu tìm theo `alertId` trong danh sách có quyền của thiết bị. Nếu cần truy vấn trực tiếp, bổ sung GET chi tiết có kiểm tra quyền thay vì mobile gọi một endpoint chưa tồn tại.

### 5.2. Realtime WebSocket

Kết nối native WebSocket tới `wss://<backend-domain>/ws`, không dùng SockJS mặc định. JWT phải nằm trong STOMP CONNECT frame:

```ts
connectHeaders: { Authorization: `Bearer ${accessToken}` }
// Sau CONNECTED: subscribe('/user/queue/events', handler)
```

Không đặt JWT trong URL; không dùng STOMP SEND để điều khiển. Lệnh phải qua REST.

Event backend hiện có:

```ts
type RealtimeEvent = {
  type: 'DEVICE' | 'TELEMETRY' | 'ALERT' | 'COMMAND' | 'ACCESS_REMOVED';
  deviceId: string;
  data: unknown; // Parse/validate theo discriminator type trước khi cập nhật cache.
  sentAt: string; // ISO timestamp lúc gửi, không phải version của entity.
};
```

Backend chưa cung cấp version tăng dần hay cơ chế replay event. Không mặc định `sentAt` giải quyết được mọi race condition.

#### 5.2.1. Kết nối và gia hạn

1. Dùng single-flight auth để lấy access token còn hạn, rồi CONNECT và SUBSCRIBE.
2. Sau subscribe, lấy snapshot REST cho thiết bị có quyền, cảnh báo và dữ liệu cần thiết của thiết bị đang chọn; buffer/merge event trong lúc snapshot chạy.
3. Chủ động refresh và nối lại trước JWT `exp`, đề xuất 30 giây. Chỉ đổi token trong REST client không cập nhật được quyền của socket đã CONNECT.
4. Backend hiện chặn MESSAGE outbound sau khi token hết hạn mà không chủ động đóng socket ở nhánh xử lý này. Socket CONNECTED không bảo đảm đang nhận dữ liệu hợp lệ.
5. Khi foreground: kiểm tra token ngay, tái xác minh danh sách thiết bị/quyền, reconnect nếu cần và phục hồi snapshot. Không phụ thuộc timer đã bị trì hoãn trong background.
6. Chỉ có một socket hoạt động cho mỗi phiên app. Reconnect có backoff và jitter, giới hạn tối đa đề xuất 30 giây; baseline heartbeat 10 giây, connection timeout 8 giây.
7. Khi socket lỗi, polling REST đề xuất mỗi 5 giây, chỉ foreground và có mạng; dừng khi socket phục hồi. Timer UI tính tuổi dữ liệu không gọi API mỗi giây.
8. Không đánh đồng socket lỗi với gateway offline. Không nhận telemetry có thể do cảm biến/ngateway mất dữ liệu; trước khi kết luận socket hỏng cần kiểm tra token/kết nối/snapshot.

#### 5.2.2. Quy tắc merge và thu hồi quyền

| Dữ liệu | Quy tắc |
|---|---|
| Thiết bị | Ghi nhận revision cục bộ lúc bắt đầu REST; snapshot không ghi đè thiết bị đã có event mới trong lúc request chạy |
| Telemetry | Dedupe readingId, sắp theo receivedAt/ts; latest là mẫu mới nhất; live buffer tối đa 300 mẫu |
| Command | Merge cmdId; terminal status không bị PENDING ghi đè; không xóa lateAck khi response cũ thiếu trường |
| Alert | Merge alertId; giữ cập nhật realtime nhận sau lúc snapshot bắt đầu, không để RESOLVED bị snapshot cũ đảo về OPEN |
| ACCESS_REMOVED | Hủy request, xóa mọi cache thiết bị, điều hướng khỏi màn hình và chặn callback cũ phục hồi dữ liệu |
| Phiên cũ | Bỏ qua response/event mang session generation cũ sau logout/đổi tài khoản |

Revision cục bộ chỉ bảo vệ race trong app, không phải version server và không cung cấp tổng thứ tự toàn hệ thống. Sau reconnect vẫn phải đối soát REST. Khi được cấp lại quyền, xác nhận bằng snapshot quyền mới và bắt đầu access generation mới; không giữ cờ revoked vĩnh viễn.

Khi app mất mạng lúc Viewer bị thu hồi quyền, ACCESS_REMOVED có thể bị bỏ lỡ. Lần reconnect/foreground phải thay danh sách quyền bằng kết quả authoritative mới và xóa thiết bị không còn trong danh sách. Không khôi phục dữ liệu cũ trước bước xác minh này.

### 5.3. Push notification — phần cần bổ sung

WebSocket dùng cho foreground. Cảnh báo khi app không hoạt động dùng `expo-notifications` + Expo Push Service, chuyển tiếp qua FCM/APNs. Android triển khai trước; iOS là đầu việc riêng nếu được đưa vào phạm vi.

#### 5.3.1. Hợp đồng đề xuất, chưa phải API hiện có

```text
POST   /api/mobile/push-tokens
DELETE /api/mobile/push-tokens/{registrationId}
```

Đăng ký có xác thực: backend lấy user từ JWT, không tin userId do client gửi. Body đề xuất có expoPushToken, installationId, platform, environment và appVersion. API trả registrationId; chỉ chủ đăng ký được xóa. Upsert và unique constraint tránh tạo nhiều bản ghi cho cùng token/installation trong cùng môi trường.

```text
user_push_tokens
- id, user_id, installation_id, expo_push_token
- platform, environment, app_version
- active, created_at, last_seen_at
```

Phải hỗ trợ một user nhiều điện thoại và một điện thoại đổi tài khoản. Đăng xuất trực tuyến hủy đăng ký trước khi xóa phiên; nếu offline thì dọn phiên cục bộ ngay, đánh dấu hủy đăng ký cần đồng bộ và không hiển thị nội dung nhạy cảm trong push. Cần kiểm thử liên kết lại token khi đăng nhập tài khoản khác; không hứa đã hủy token trên server khi đang mất mạng.

#### 5.3.2. Nguồn sự kiện và gửi push

| Loại push | Nguồn cần tích hợp | Quy tắc |
|---|---|---|
| Chuyển động/ngã | AlertService sau lưu alert | Mapping reason theo firmware, không đoán theo chuỗi mô tả |
| Offline | DevicePresenceService khi chuyển sang OFFLINE | Chỉ phát khi chuyển trạng thái, không gửi lại mỗi lượt scheduler |
| Rejected/timeout | Luồng CommandService/CommandTimeoutService | Lọc lệnh quan trọng, có cmdId và kết quả |

- Phát job sau transaction commit, gửi ngoài transaction nhận MQTT; không để lỗi Expo làm rollback telemetry/alert.
- Với phạm vi đồ án, dùng hàng đợi hữu hạn và retry có giới hạn, không tạo thêm một hệ thống dịch vụ lớn. Nếu chưa có outbox bền vững, ghi rõ job push có thể mất khi backend restart; REST vẫn là dữ liệu authoritative.
- Kiểm tra quyền người nhận tại thời điểm gửi; chống trùng theo event/entity, người nhận và loại thông báo; có cooldown offline để tránh spam khi kết nối chập chờn.
- Phân biệt ticket nhận gửi với receipt; vô hiệu token khi provider xác nhận không còn đăng ký, xử lý retry cho lỗi tạm thời.
- Payload tối thiểu: eventId, type, deviceId, alertId hoặc cmdId. Không chứa JWT, claim token hoặc mật khẩu; hạn chế tọa độ/thông tin xe trên màn hình khóa.
- Dùng notification hiển thị kèm data cho cảnh báo người dùng; không phụ thuộc JavaScript chạy nền để tạo toàn bộ cảnh báo.

#### 5.3.3. Cấu hình mobile và deep link

- Chốt Expo project, package ID, FCM credentials và Android notification channel. Dùng Development Build; không dùng Expo Go để nghiệm thu remote push Android.
- Xin quyền notification đúng ngữ cảnh; từ chối quyền không được chặn dashboard/điều khiển foreground.
- Xử lý foreground listener, notification response và thông báo mở app từ trạng thái terminated. Khi startup cần kiểm tra initial/last notification response, không chỉ listener.
- Chạm notification: đợi khôi phục auth, gọi REST xác minh quyền, lấy dữ liệu mới rồi điều hướng; chống xử lý trùng eventId. Nếu đã mất quyền, không hiển thị dữ liệu thiết bị.
- Phân biệt background, terminated thông thường và Force stop từ Android Settings. Force stop cần người dùng mở lại app để notification hoạt động trở lại; không đưa nhận push lúc Force stop thành tiêu chí bắt buộc.
- Ghi nhận push có thể chậm hoặc không được giao; danh sách cảnh báo backend và snapshot phục hồi là cơ chế đối soát.

## 6. Kế hoạch triển khai và đầu ra nghiệm thu

Ước lượng cho một người làm full-time, theo ngày làm việc. Chưa có ngày bắt đầu cố định; lịch được chốt sau M0. Các ngày hardware phụ thuộc board, mạng, GPS ngoài trời và khả năng truy cập thiết bị.

| Mốc | Thời lượng | Công việc | Đầu ra và điều kiện qua mốc |
|---|---|---|---|
| M0 — chốt hợp đồng và spike | 2–3 ngày | Chạy backend; snapshot OpenAPI/DTO/event; kiểm tra STOMP từ Android build; thử map/chart; chốt QR và quyền; kiểm tra đường MQTT hardware | Có response mẫu, bảng enum/đơn vị/nullability; build cài được; xác định backend URL và blocker |
| M1 — auth và dashboard REST | 5–7 ngày | Navigation, theme, API client, SecureStore; login/restore/logout; danh sách/chi tiết/latest telemetry; GPS map; loading/error/offline | Giữ phiên qua restart; phân quyền theo device; GPS null/0 đúng; dashboard hoạt động khi chưa có socket |
| M2 — MVP IoT hai chiều | 5–7 ngày | STOMP, gia hạn, merge snapshot; ARM/DISARM và ACK/timeout; cảnh báo; ACCESS_REMOVED; thử phần cứng sớm | Có bằng chứng Hall/MPU/GPS và ARM/DISARM thật trong phạm vi đã chạy; Viewer bị chặn; reconnect không đảo state |
| M3 — hoàn thiện P0 | 5–7 ngày | Các lệnh còn lại; step-up LOCK; late ACK; acknowledge/resolve; đăng ký; kiểm thử lỗi mạng và interlock theo phạm vi hardware | Tất cả P0 có kiểm thử; không auto retry lệnh; mất response HTTP được xử lý; APK P0 cho người kiểm thử |
| M4 — P1 và backend push | 7–10 ngày | Onboarding; history/CSV; Viewer/config DB; profile/đổi mật khẩu; push registration/sender/receipt/deep link; phân trang alert nếu cần | Các P1 đã chọn có bằng chứng; ghi rõ giới hạn CSV/ngưỡng; push background/terminated được kiểm tra trên thiết bị |
| M5 — ổn định và nghiệm thu tổng thể | 5–7 ngày | E2E Android, regression, đo latency, chạy bền, kiểm tra 2 điện thoại, hoàn thiện tài liệu/video | Đạt mục 13, có báo cáo lỗi còn lại, APK và hướng dẫn tái hiện |

### 6.1. Ước lượng tổng thể

- MVP M0–M2: 12–17 ngày làm việc, khoảng 2,5–3,5 tuần; nếu cần học thêm native/push hoặc hardware chưa sẵn sàng phải cộng dự phòng.
- P0 M0–M3: 17–24 ngày làm việc, khoảng 3,5–5 tuần.
- P0 + P1 đã chọn + nghiệm thu: 29–41 ngày làm việc, khoảng 6–8,5 tuần trước dự phòng; nên dành thêm 15–20% cho tích hợp/hardware.
- Hai người có thể chia mobile và backend/push, song song sau M0. Lập lịch theo đường phụ thuộc và năng lực thực tế, không mặc định thời gian giảm một nửa; backend push phải sẵn sàng trước nghiệm thu M4.
- Ưu tiên M2/M3 nếu thời hạn môn học ngắn. Chốt danh sách P1 theo rubric tại M0; không coi toàn bộ P1 là bắt buộc nếu chưa thống nhất phạm vi.

### 6.2. Nghiệm thu hardware xuyên suốt

Thử dữ liệu thật từ M2, thử lệnh/interlock ở M3; M5 là nghiệm thu lại toàn bộ, không phải lần đầu kết nối board. Kiểm tra tối thiểu:

- Hall/MPU → Node B → UART → Node A → MQTT → backend → mobile.
- ARM/DISARM và ACK thật; LOCK khi bánh quay hoặc sensor stale; relay/interlock vật lý theo thiết kế testbed.
- Mất nguồn/Wi-Fi Node A, offline rồi online; GPS ngoài trời FIX → STALE; không có fix thì không marker.
- Ít nhất 20 mẫu latency cho mỗi luồng được báo cáo; ghi số mẫu, điều kiện mạng, min/median/p95/max. Với ít mẫu, p95 chỉ là mô tả thử nghiệm, không phải cam kết hiệu năng.
- Đo riêng backend nhận MQTT → UI cập nhật và gửi REST → ACK được quan sát. Muốn đo tác động vật lý → UI phải có video/đồng hồ đồng bộ; không trừ uptime firmware với epoch.
- Chạy liên tục 30–60 phút, ghi nhận mất kết nối, stale, memory/render và lệnh chưa kết thúc.

Không dùng simulator thay bằng chứng hardware. Mục chưa có board hoặc chưa đo phải ghi “chưa nghiệm thu” cùng lý do.

## 7. Lưu ý về dữ liệu và trạng thái

- `null` nghĩa là chưa đo hoặc không hợp lệ; không được chuyển thành `0`.
- Không hiển thị điện áp pin giả khi hardware chưa đo ADC.
- `sensorConnected` mô tả độ mới của Node B, không đồng nghĩa gateway đang online.
- `PARKED` là trạng thái bảo vệ, không chứng minh bánh xe đang đứng yên.
- Tọa độ bằng `0` có thể hợp lệ; không kiểm tra latitude/longitude bằng truthy.
- Khi `NO_FIX`, chỉ hiển thị last known location nếu đã từng có fix và phải ghi rõ đây là vị trí cũ.
- Phân biệt thời gian server nhận dữ liệu với uptime firmware.
- Dữ liệu alert từ buffer firmware có thể đến muộn; createdAt là lúc backend ghi nhận, không mặc định là thời điểm sự cố vật lý.
- DTO dùng camelCase; một số query như `device_id` dùng snake_case. Khai báo adapter theo API thực tế.
- `ts`, `from`, `to`: epoch giây; `receivedAt`: ISO timestamp; `gpsAgeMs`: mili giây; `deviceUptimeS`: giây từ lúc firmware chạy. Tốc độ km/h; đơn vị gia tốc phải xác nhận từ hợp đồng firmware ở M0, không tự gắn nhãn g hoặc m/s².

### 7.1. Trạng thái độ mới và GPS

FIX/STALE/NO_FIX là trạng thái trình bày suy ra từ dữ liệu, không phải enum GPS có sẵn trong DTO.

- Lấy elapsedMs từ mốc nhận telemetry và thời gian trôi qua. Theo baseline hiện tại, freshness telemetry là 5.000 ms; hiệu chỉnh lệch đồng hồ điện thoại/server khi cần và dùng monotonic elapsed trong phiên.
- FIX khi thiết bị ACTIVE, telemetry còn mới, gpsValid=true, gpsAgeMs hợp lệ và gpsAgeMs + elapsedMs <= 5.000; tọa độ finite trong latitude [-90,90], longitude [-180,180].
- STALE khi không còn đạt FIX nhưng đã có lastLatitude/lastLongitude hợp lệ. Giữ marker vị trí cuối, ghi rõ thời gian nhận cuối và vị trí đã cũ.
- NO_FIX khi chưa có vị trí hợp lệ được biết từ backend; không tạo marker mặc định.
- Gateway online theo lifecycle/presence; sensor fresh theo telemetry/valid flags. Baseline backend offline sau khoảng 45 giây không lastSeen hoặc theo LWT; UI không đổi online/offline chỉ từ gpsValid.
- Cờ valid trong mẫu lịch sử mô tả mẫu tại lúc nhận. Không dùng mẫu lịch sử cũ làm giá trị live hợp lệ.

### 7.2. Lịch sử và xuất dữ liệu

- Page bắt đầu từ 0; page 0 chứa mẫu gần nhất trong khoảng. Mỗi page trả theo thời gian tăng, nên khi tải nhiều page cần merge/dedupe/sắp xếp lại.
- Chốt from/to trong một lần tải nhiều trang để giảm dịch chuyển dữ liệu; API offset hiện không có snapshot cursor. Phát hiện/ghi nhận giới hạn nếu cần xuất dữ liệu đầy đủ trong lúc ingest liên tục.
- UI analytics chọn size vừa nhu cầu; không mặc định mọi màn hình đều tải 5.000 điểm. Live chart giữ 300 mẫu, analytics downsample khi cần và không sửa dữ liệu gốc.
- CSV hiện tối đa 5.000 mẫu gần nhất trong khoảng, khoảng 83 phút nếu có một mẫu/giây. Hiển thị giới hạn trước khi xuất, không ghi “toàn bộ khoảng thời gian” khi có thể bị cắt.
- Nếu rubric yêu cầu CSV đầy đủ, bổ sung export backend có giới hạn/streaming/phân trang phù hợp rồi kiểm thử; đây là đầu việc mới.
- Command history hiện chỉ 100 lệnh gần nhất. Alerts chưa phân trang; khi dữ liệu lớn cần bổ sung phân trang server thay vì chỉ cắt danh sách tại mobile.
- CSV tải vào file tạm nội bộ rồi chia sẻ qua native share sheet; không dùng document.createElement hoặc blob URL của trình duyệt. Dọn file tạm theo chính sách ứng dụng.

## 8. Lưu ý về điều khiển

HTTP trả thành công và MQTT publish thành công không có nghĩa thiết bị đã thực thi lệnh. Ứng dụng phải giữ trạng thái `PENDING` cho đến khi nhận ACK hoặc timeout.

Không tự động retry bất kỳ lệnh điều khiển nào sau lỗi mạng/timeout, bao gồm ARM/DISARM. Thiết bị có thể đã thực thi nhưng ACK hoặc response HTTP bị mất. Không lưu hàng đợi lệnh offline rồi tự phát khi có mạng trở lại.

- Response REST có thể tới sau event COMMAND đã EXECUTED/REJECTED; merge theo cmdId và không đảo về PENDING.
- Backend chờ ACK khoảng 10 giây theo cấu hình, kiểm tra theo scheduler; UI dùng kết quả server, không tự ghi TIMEOUT authoritative chỉ vì timer cục bộ hết hạn.
- ACK tới muộn: giữ status=TIMEOUT theo backend, hiển thị lateAckResult/lateAckReason/lateAckAt bổ sung. Ví dụ: “Quá thời gian chờ; sau đó thiết bị báo đã thực thi”.
- MQTT lỗi có thể tạo REJECTED với reasonIfFailed=MQTT_UNAVAILABLE; timeout có ACK_TIMEOUT. Hiển thị lý do thay vì một thông báo lỗi chung.
- Mất response POST: đánh dấu “chưa xác định kết quả gửi”, đối soát GET commands; không tự gắn một lệnh gần giống vào thao tác nếu thiếu định danh chắc chắn. Request hiện chưa có client idempotency key, nên không thể bảo đảm retry không tạo lệnh mới.
- Tắt retry mutation và không để interceptor replay do lỗi mạng/5xx. Chỉ replay tối đa một lần sau 401 xác thực khi request bị từ chối trước xử lý.
- Chặn nhấn liên tiếp trong lúc submit, có xác nhận theo lệnh. LOCK_ENGINE phải gửi confirmationPassword theo DTO, không lưu mật khẩu vào cache/history/log.
- Lifecycle FAULT/DECOMMISSIONED không cho gửi lệnh. Ghi rõ dữ liệu sensor stale; backend/firmware vẫn kiểm tra interlock độc lập với UI.

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

Backend WebSocket hiện giới hạn origin. Cần kiểm tra handshake từ React Native development build và bổ sung origin chính xác nếu kết nối bị từ chối. Không mở origin bằng `*` ở production. Origin là cơ chế handshake phụ thuộc client; native client có thể không gửi Origin, nên xác minh handshake thực tế trước khi thêm cấu hình. Phân quyền vẫn dựa JWT và ownership, không dựa Origin.

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

### 11.1. Build và môi trường

- Chốt một Expo SDK cùng tập phiên bản native tương thích tại M0, lưu lockfile. Map/chart/push phải chạy trong cùng Development Build trước khi triển khai sâu.
- Khai báo rõ API_BASE_URL và WS_URL; mobile không có Vite proxy `/api` như web. Release không dùng URL LAN/dev và không ghi secret vào EXPO_PUBLIC_*.
- Cấu hình map key theo nền tảng và thông tin ký Android cần thiết; kiểm tra key của development build và APK release đều đúng giới hạn.
- Tạo APK kiểm thử từ M1/M2, không đợi hết dự án mới build. Kiểm tra cả release để phát hiện khác biệt native/deep link.

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
- Deep link từ push notification, cold start, event trùng và notification trỏ tới thiết bị đã mất quyền.
- expiresIn mili giây, exp/from/to/ts giây; tọa độ 0 và null.
- REST trả sau event ACK; TIMEOUT có late ACK; mất response POST không phát lệnh lần hai.
- Logout/đổi tài khoản giữa refresh/snapshot; callback cũ không khôi phục token/cache.
- ACCESS_REMOVED trong lúc history refetch; mất event thu hồi khi offline rồi reconnect; cấp lại quyền.
- Viewer được acknowledge nhưng không resolve; Owner theo device dù role tài khoản khác.
- History nhiều page, trùng readingId, CSV vượt 5.000 mẫu và màn hình thông báo giới hạn.
- Token push đổi tài khoản, nhiều thiết bị, hủy đăng ký và receipt token không còn hợp lệ.

### Kiểm thử thủ công

- Mất mạng khi đang xem dashboard.
- Chuyển từ Wi-Fi sang 4G.
- App chạy nền và quay lại foreground.
- Token hết hạn trong khi WebSocket đang kết nối.
- App terminated rồi mở từ notification; Android Force stop rồi mở thủ công và kiểm tra đăng ký/phục hồi, không yêu cầu nhận push trong lúc Force stop.
- Thiết bị chuyển offline/online.
- GPS chưa fix, có fix rồi stale.
- Owner thu hồi quyền Viewer khi Viewer đang mở app và khi Viewer offline.
- Android từ chối quyền notification/camera; có thông báo và đường nhập claim token thủ công.
- App foreground lâu hơn TTL access token, qua nhiều lần refresh/reconnect mà không mất realtime.
- App đổi tài khoản khi request/socket cũ chưa hoàn tất; không lộ dữ liệu tài khoản trước.
- Push offline/rejected/timeout đúng nguồn sự kiện, không gửi lặp mỗi vòng scheduler.

### Cách ghi kết quả

Mỗi test quan trọng lưu: mã test, build/commit, môi trường, dữ liệu đầu vào, bước chạy, kết quả mong đợi/thực tế, bằng chứng và trạng thái PASS/FAIL/CHƯA CHẠY. Không đánh dấu pass chỉ vì đã viết test hoặc có trong checklist.

### Kiểm thử hardware

Kết quả compile, test bằng simulator hoặc broker test chỉ được ghi nhận là bằng chứng phần mềm. GPS fix, relay, interlock và end-to-end phải có log, video hoặc phép đo từ phần cứng thật.

## 13. Tiêu chí hoàn thành theo phiên bản

### 13.1. MVP M2

- Hoàn thành phạm vi MVP tại mục 3.3 và ghi rõ chưa có push/các tính năng ngoài phạm vi.
- Có luồng dữ liệu thật và ARM/DISARM với ACK/timeout được ghi bằng chứng; Viewer không điều khiển ở UI/API.
- Không hiển thị số đo/vị trí giả; reconnect/refresh/thu hồi quyền đúng trong phạm vi triển khai.
- Có APK cài được và hướng dẫn demo. Hardware chưa kiểm tra phải ghi rõ, không tuyên bố đã hoàn thành nghiệm thu IoT nếu thiếu bằng chứng.

### 13.2. Bản P0 M3

- Tất cả P0 có test và không còn lỗi chặn demo.
- Phân quyền acknowledge/resolve/command đúng theo thiết bị, kể cả khi API bị gọi trực tiếp.
- Token hết hạn khi socket đang mở vẫn được gia hạn/reconnect; snapshot không đảo state và request phiên cũ không khôi phục dữ liệu.
- Lifecycle lệnh, late ACK và mất response HTTP được xử lý; không có retry/queue lệnh tự động ngoài ý muốn.
- Có bằng chứng hardware cho các lệnh/interlock đã đưa vào P0; phần chưa kiểm tra được nêu cụ thể.

### 13.3. Bản đầy đủ M5

- Đạt P0 và tất cả P1 được chốt theo rubric tại M0; có danh sách P1 hoãn nếu có.
- Push trên Android được kiểm tra foreground/background/terminated phù hợp điều kiện hệ điều hành; deep link xác minh quyền. Force stop được kiểm tra phục hồi sau mở lại.
- UI không tuyên bố cấu hình đã áp dụng lên firmware khi chỉ lưu backend; CSV/lịch sử ghi rõ giới hạn hiện tại.
- APK chạy trên ít nhất hai thiết bị Android; có regression trên release build.
- Có log/video hardware, tối thiểu 20 mẫu đo cho mỗi luồng latency báo cáo và phiên chạy 30–60 phút.
- Có hướng dẫn cài/build, cấu hình môi trường, demo, kết quả test và danh sách giới hạn còn lại. Không đưa credential vào tài liệu/bằng chứng.

## 14. Tài liệu liên quan

- [Realtime backend/frontend](https://github.com/hieupham03/smart-motorbike-guardian/blob/62dbff2f3a8f4a63cf53de0b7d5408b0c578b1a3/docs/REALTIME-BACKEND-FRONTEND.md).
- [Bàn giao backend, frontend và tích hợp](https://github.com/hieupham03/smart-motorbike-guardian/blob/62dbff2f3a8f4a63cf53de0b7d5408b0c578b1a3/docs/BAN-GIAO-BACKEND-FRONTEND-VA-TICH-HOP.md).
- [Hướng dẫn hardware/firmware V2 GPS](https://github.com/hieupham03/smart-motorbike-guardian/blob/62dbff2f3a8f4a63cf53de0b7d5408b0c578b1a3/docs/HUONG-DAN-HARDWARE-FIRMWARE-V2-GPS.md).
- [Nghiệm thu hardware/firmware](https://github.com/hieupham03/smart-motorbike-guardian/blob/62dbff2f3a8f4a63cf53de0b7d5408b0c578b1a3/docs/NGHIEM-THU-HARDWARE-FIRMWARE.md).
- [Project specification](https://github.com/hieupham03/smart-motorbike-guardian/blob/62dbff2f3a8f4a63cf53de0b7d5408b0c578b1a3/docs/PROJECT_SPECIFICATION.md).
- [Expo SecureStore và authentication](https://docs.expo.dev/guides/authentication/).
- [Expo push notification](https://docs.expo.dev/push-notifications/what-you-need-to-know/).
- [Expo Push Service](https://docs.expo.dev/push-notifications/sending-notifications/).
- [Expo react-native-maps](https://docs.expo.dev/versions/latest/sdk/map-view/).


- [Expo Notifications: Development Build và API](https://docs.expo.dev/versions/latest/sdk/notifications/).
- [Expo Sharing](https://docs.expo.dev/versions/latest/sdk/sharing/).

## 15. Checklist quyết định tại M0

- [ ] Chốt P1 theo rubric và người chịu trách nhiệm mobile/backend push/hardware.
- [ ] Kiểm tra thay đổi source sau commit cơ sở; lưu API/event mẫu mới nếu hợp đồng đổi.
- [ ] Chốt Expo SDK, build Android, bản đồ/biểu đồ và đường HTTPS/WSS.
- [ ] Chốt DTO/enum, đơn vị gia tốc, timestamp, error envelope và payload QR.
- [ ] Chốt ma trận quyền, quy tắc auth/reconnect/merge và ownership của cache.
- [ ] Chốt giới hạn CSV/history/alert và có cần sửa backend để phân trang/export đầy đủ.
- [ ] Chốt push credentials, sự kiện, registration lifecycle và phạm vi iOS nếu có.
- [ ] Xác nhận hardware sẵn sàng cho M2 và thống nhất cách ghi bằng chứng/latency.

## 16. Nhật ký chỉnh sửa ngày 18/10/2026

| Nội dung sửa | Lý do |
|---|---|
| Ghi commit cơ sở và phân biệt hiện có/đề xuất | Tránh coi kế hoạch là bằng chứng hệ thống đã hoàn thành |
| Chốt cache thống nhất và session/access generation | Tránh hai nguồn state, rò dữ liệu phiên cũ và request hồi sinh thiết bị bị thu hồi |
| Bổ sung gia hạn socket trước exp, STOMP CONNECT header | Socket hết hạn có thể vẫn kết nối nhưng backend ngừng đẩy dữ liệu |
| Cụ thể hóa merge theo entity và revision cục bộ | Backend chưa có version/replay event để dựa hoàn toàn vào timestamp |
| Thêm ma trận Owner/Viewer/Admin | Viewer được acknowledge nhưng không resolve; quyền theo thiết bị |
| Tách cấu hình DB khỏi cấu hình firmware | PATCH config chưa gửi xuống board, CONFIG_THRESHOLDS bị từ chối |
| Bổ sung late ACK, mất response HTTP, tắt retry/queue lệnh | Tránh gửi lệnh hai lần và hiển thị kết quả chắc chắn khi thực tế chưa rõ |
| Tách nguồn push alert/offline/command, token lifecycle và cold start | Hook lưu alert không bao phủ offline/command; cần xử lý đổi tài khoản |
| Làm rõ epoch giây, expiresIn mili giây, GPS freshness và giới hạn CSV | Tránh sai đơn vị và xuất thiếu dữ liệu mà vẫn báo đầy đủ |
| Chia MVP/P0/P1 thành M0–M5, thử hardware từ M2 | Tiến độ cũ chưa khớp tổng ngày và dồn nghiệm thu phần cứng về cuối |
| Tiêu chí hoàn thành theo phiên bản, có trạng thái chưa chạy | Không buộc MVP đạt toàn bộ P1 hoặc suy diễn đã nghiệm thu từ simulator |
