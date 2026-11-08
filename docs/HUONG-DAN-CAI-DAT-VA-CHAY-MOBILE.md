# Hướng dẫn cài đặt, chạy và build mobile

Cập nhật 25/10/2026, Expo SDK 58. Xem [tích hợp đã hoàn thành và giới hạn kiểm chứng](CAI-DAT-NGUONG-TOC-DO-WEB-MOBILE.md). Đã có bằng chứng phần mềm; các bước APK/điện thoại/push thật bên dưới chưa được nghiệm thu trong phiên này.

**Test trên lớp:** dùng [launcher một lần mở](CHAY-MOBILE-TREN-LOP.md): chạy `deployment/start-mobile-demo.bat` ở gốc repo. Tự mở backend cổng 8082 + QR Expo Go, tự nhận IP LAN, giữ tài khoản/DB demo sau khi tắt; chỉ đặt mật khẩu lần đầu. Các bước bên dưới là cách chạy thủ công và cấu hình native nâng cao.

**Đã đăng nhập, thử gì tiếp:** [toàn bộ tính năng và kịch bản test hiện tại](TONG-HOP-TINH-NANG-VA-KICH-BAN-TEST.md), gồm ý nghĩa Bật bảo vệ, thứ tự test trên board và ca app không cần hardware.

**Chạy cả web và mobile cùng phần cứng thật:** [hướng dẫn từng bước](CHAY-WEB-MOBILE-VOI-PHAN-CUNG-THAT.md), dùng một backend 8082 và web 5173, kèm dấu hiệu kiểm tra UART/MQTT và đầu ra thực tế.

## 1. Yêu cầu

- Node.js 22.13+ thuộc nhánh 22 hoặc 24.3+ thuộc nhánh 24, npm (theo engine React Native 0.88); Java 17+/Maven cho backend; Docker Desktop nếu dùng PostgreSQL compose.
- Android Studio/SDK hoặc điện thoại Android/iOS cùng mạng LAN. Push cần EAS development build.
- Không commit `.env`, keystore, `google-services.json`, `GoogleService-Info.plist`, Expo/FCM/APNs token.

## 2. Chạy backend

### Cách nhanh bằng H2

```powershell
$taskRng = [Security.Cryptography.RandomNumberGenerator]::Create()
$taskSecretBytes = New-Object byte[] 48
$taskRng.GetBytes($taskSecretBytes)
$taskRng.Dispose()
$env:JWT_SECRET = [Convert]::ToBase64String($taskSecretBytes)
$taskDemoPassword = Read-Host 'Mat khau demo local, toi thieu 8 ky tu' -AsSecureString
$env:DEMO_PASSWORD = [System.Net.NetworkCredential]::new('', $taskDemoPassword).Password
$env:DEMO_SEED_ENABLED = 'true'
$env:SPRING_PROFILES_ACTIVE = 'h2'
$env:MQTT_ENABLED = 'false'
$env:EXPO_PUSH_ENABLED = 'false'
Set-Location backend
mvn spring-boot:run
```

Đoạn trên dùng được với PowerShell 5.1+. H2 trong RAM mất dữ liệu khi tắt backend, không thay DB nhóm. Trong DB mới, đăng nhập `owner@guardian.iot`, `viewer@guardian.iot` hoặc `admin@guardian.iot` với mật khẩu vừa nhập; seed chỉ chạy khi bảng user còn trống. HARDWARE chưa nhận board sẽ offline, dữ liệu SIMULATED không phải kết quả board.

`MQTT_ENABLED=false` chỉ phù hợp kiểm thử phần mềm. Muốn test board thật phải bật MQTT và dùng cùng broker/cấu hình với Node A, khởi động lại backend. Muốn push thật phải bật `EXPO_PUSH_ENABLED=true` cùng cấu hình EAS/FCM/APNs. Ưu tiên dùng backend/PostgreSQL hiện tại nếu nhóm đã vận hành; không reset volume chỉ để thử mobile.

### PostgreSQL bằng Docker

Copy `.env.example` thành `deployment/.env`, điền secret cục bộ rồi chạy:

```powershell
Set-Location deployment
docker compose up --build -d
```

Trên **trình duyệt điện thoại**, mở `http://<IP-MAY-TINH>:8080/api/health`; phải nhận HTTP 200 trước khi thử app. Flyway tự chạy đến V3. `EXPO_ACCESS_TOKEN` chỉ cần khi Expo push access security đã bật. Mobile gọi backend REST/STOMP, không kết nối trực tiếp MQTT broker.

## 3. Chạy mobile

```powershell
Set-Location mobile
npm ci
Copy-Item .env.example .env
```

Chỉ copy nếu chưa có `.env`, giữ cấu hình local đã có. Sửa `.env`:

```dotenv
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.10:8080
EXPO_PUBLIC_WS_URL=ws://192.168.1.10:8080/ws
EXPO_PUBLIC_EAS_PROJECT_ID=<EAS_PROJECT_ID_PUBLIC>
APP_ALLOW_HTTP=true
ANDROID_MAPS_API_KEY=
GOOGLE_SERVICES_JSON=
```

Dùng IPv4 LAN của máy chạy backend (`ipconfig`); `192.168.1.10` chỉ là ví dụ, không dùng `localhost` trên điện thoại. Mở port 8080 trên firewall cho mạng riêng và bảo đảm điện thoại/máy tính cùng mạng. Sau đổi URL dừng Metro và chạy lại; preview APK cần build lại. Web ở origin khác cần bổ sung `CORS_ALLOWED_ORIGINS` của backend.

```powershell
npm start
# Hoặc web smoke test
npm run web
```

Camera/map có thể smoke test trong Expo client tương thích, nhưng remote push phải dùng development/native build. Web không đăng ký notification native; bản mobile web hiển thị bản đồ OpenStreetMap nhúng khi có tọa độ. Chọn HARDWARE có UUID trùng Node A; Tổng quan có bảng Phiên quay bánh, ngưỡng cảnh báo lấy từ firmware, hiện là 2 km/h.

## 4. Development build và release

Đăng nhập EAS và liên kết project (thao tác tài khoản do người bàn giao thực hiện):

```powershell
npx eas-cli@latest login
npx eas-cli@latest init
```

Trước build:

1. Điền EAS project ID. Trên EAS project, cấu hình Environment variables cho môi trường **development** hoặc **preview** đúng profile: URL API, URL WS, EAS ID. Không mặc định coi `.env` local (bị Git bỏ qua) đã có trên cloud build. `eas.json` đã chọn environment tương ứng.
2. Bản đồ Android: bật Maps SDK for Android, đặt `ANDROID_MAPS_API_KEY`. Giới hạn key theo package `com.guardian.smartmotorbike` và SHA-1 chứng thư ký của APK. App config đưa key vào `react-native-maps` plugin. [Hướng dẫn SDK 58](https://docs.expo.dev/versions/v58.0.0/sdk/map-view/).
3. Push Android: đăng ký Firebase Android app đúng package, lấy **google-services.json** cấu hình client. Đặt `GOOGLE_SERVICES_JSON` tới file local nếu build local, hoặc biến EAS kiểu **File** khi cloud build. **FCM V1 service account private key là file khác**: upload bằng `npx eas-cli@latest credentials` → Android → Google Service Account → Push Notifications (FCM V1). Không commit hai file này. [Hướng dẫn FCM](https://docs.expo.dev/push-notifications/fcm-credentials/).
4. Native config thay đổi cần rebuild APK; development/preview cho phép HTTP LAN, production tắt cleartext và cần HTTPS/WSS. iOS cần cấu hình ký/APNs bằng tài khoản phù hợp. Không cần đưa app lên store để demo.

Build development APK, cài theo link EAS, chạy Metro rồi mở bằng development client:

```powershell
npx eas-cli@latest build --profile development --platform android
npx expo start --dev-client
```

[Development builds chính thức](https://docs.expo.dev/develop/development-builds/introduction/). Cho phép notification, đăng nhập Owner; đăng ký token tự động. Backend phải bật push; không đặt server token trong `EXPO_PUBLIC_*`. Expo Go không dùng để chốt nghiệm thu remote push.

Build preview APK demo độc lập Metro:

```powershell
npx eas-cli@latest build --profile preview --platform android
```

Production:

```powershell
npx eas-cli@latest build --profile production --platform android
npx eas-cli@latest build --profile production --platform ios
```

Trước build/release:

```powershell
npm run typecheck
npm run lint
npm test
npm run doctor
npx expo export --platform web --output-dir .tmp-web-export
```

Xóa artifact `.tmp-web-export` sau smoke test. APK/AAB/native generated folders được `.gitignore` loại trừ.

## 5. Sự cố thường gặp

- `Cannot find native module 'ExpoTopicSubscriptionModule'`: đã sửa ngày 26/10/2026 bằng cách không nạp notification SDK trong Expo Go. Dừng launcher, đóng app trên điện thoại, chạy lại `start-mobile-demo.bat -ClearCache` rồi quét QR. Nếu dùng APK native cũ và cần push, rebuild APK với package native hiện tại; xóa cache không bổ sung module native cho APK.

- `Network Error`: kiểm tra IP LAN, port 8080, firewall, HTTP cleartext của build và backend health.
- REST được nhưng realtime lỗi: kiểm tra `EXPO_PUBLIC_WS_URL`, `/ws`, JWT còn hạn và proxy upgrade WebSocket.
- Không có push token: dùng máy thật + development build, quyền notification, EAS project ID và FCM/APNs.
- Push không đến: kiểm tra backend push enabled và ticket/receipt. HTTP mock PASS chưa chứng minh delivery qua Expo.
- Mục **Vị trí** trên mobile web hiển thị bản đồ OpenStreetMap nhúng khi đã có tọa độ của xe; có thể phóng/thu và chọn **Mở bản đồ lớn**. Bản Android/iOS dùng bản đồ native sẵn có. Nền bản đồ cần Internet; không cần cấp quyền vị trí điện thoại vì tọa độ lấy từ GPS trên xe.
- Chưa từng nhận tọa độ: màn hình chờ vị trí, không tự đặt xe ở 0,0. Khi đã có tọa độ rồi mất fix, bản đồ vẫn giữ **Vị trí cuối đã biết**, kèm lời nhắc đây không phải vị trí hiện tại. Đưa GPS ra chỗ thoáng và giữ kết nối Node B → Node A → backend để nhận vị trí mới.
- Native map trống: kiểm tra Maps SDK/key, package và SHA-1 đúng chứng thư của APK đã cài.
- Lệnh TIMEOUT: không retry mù; xem command history, MQTT và ACK firmware.
- HARDWARE không sửa ngưỡng: đúng thiết kế, chỉnh firmware rồi nạp board; app hiển thị ngưỡng của wheel_session.

Sau cài đặt, thực hiện [checklist điện thoại](NGHIEM-THU-MOBILE-TRUC-TIEP.md) và lưu Actual/ảnh/log. [Bài thử runtime backend thực](evidence/mobile/2026-10-25-integrated/README.md) dùng MQTT emulator, không thay kiểm tra điện thoại và breadboard.
