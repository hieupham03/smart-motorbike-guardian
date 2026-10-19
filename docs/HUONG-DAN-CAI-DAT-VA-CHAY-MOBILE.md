# Hướng dẫn cài đặt, chạy và build mobile

## 1. Yêu cầu

- Node.js 20+, npm; Java 17/Maven cho backend; Docker Desktop nếu dùng PostgreSQL compose.
- Android Studio/SDK hoặc điện thoại Android/iOS cùng mạng LAN. Push cần EAS development build.
- Không commit `.env`, keystore, `google-services.json`, `GoogleService-Info.plist`, Expo/FCM/APNs token.

## 2. Chạy backend

### Cách nhanh bằng H2

```powershell
$env:JWT_SECRET = [Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(48))
$env:SPRING_PROFILES_ACTIVE = 'h2'
$env:MQTT_ENABLED = 'false'
Set-Location backend
mvn spring-boot:run
```

`MQTT_ENABLED=false` chỉ phù hợp kiểm thử phần mềm. Muốn test board thật phải bật MQTT và dùng cùng broker/cấu hình với Node A.

### PostgreSQL bằng Docker

Copy `deployment/.env.example` thành `deployment/.env`, điền secret cục bộ rồi chạy:

```powershell
Set-Location deployment
docker compose up --build -d
```

Kiểm tra `http://<IP-MAY-TINH>:8080/api/health`. Flyway tự chạy đến V3. `EXPO_ACCESS_TOKEN` chỉ cần khi Expo push access security đã bật.

## 3. Chạy mobile

```powershell
Set-Location mobile
npm ci
Copy-Item .env.example .env
```

Sửa `.env`:

```dotenv
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.10:8080
EXPO_PUBLIC_WS_URL=ws://192.168.1.10:8080/ws
EXPO_PUBLIC_EAS_PROJECT_ID=<EAS_PROJECT_ID_PUBLIC>
```

Dùng IPv4 LAN của máy chạy backend, không dùng `localhost` trên điện thoại. Mở port 8080 trên firewall cho mạng riêng và bảo đảm điện thoại/máy tính cùng mạng.

```powershell
npm start
# Hoặc web smoke test
npm run web
```

Camera/map có thể smoke test trong Expo client tương thích, nhưng remote push từ Expo SDK hiện tại phải dùng development build.

## 4. Development build và release

Đăng nhập EAS và liên kết project (thao tác tài khoản do người bàn giao thực hiện):

```powershell
npx eas-cli login
npx eas-cli init
npx eas-cli build --profile development --platform android
```

Thiết lập FCM/APNs theo tài khoản Expo, không đưa credential vào Git. Build preview APK:

```powershell
npx eas-cli build --profile preview --platform android
```

Production:

```powershell
npx eas-cli build --profile production --platform android
npx eas-cli build --profile production --platform ios
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

- `Network Error`: kiểm tra IP LAN, port 8080, firewall, HTTP cleartext của build và backend health.
- REST được nhưng realtime lỗi: kiểm tra `EXPO_PUBLIC_WS_URL`, `/ws`, JWT còn hạn và proxy upgrade WebSocket.
- Không có push token: dùng máy thật + development build, quyền notification, EAS project ID và FCM/APNs.
- Map web chỉ là placeholder theo thiết kế; nghiệm thu marker bằng native app.
- Lệnh TIMEOUT: không retry mù; xem command history, MQTT và ACK firmware.
