# Kết quả kiểm thử tích hợp Mobile

Kiểm thử tích hợp phần mềm cho ứng dụng mobile (web export) với backend Spring Boot và MQTT emulator cục bộ; không phải ảnh chụp điện thoại thật hoặc dữ liệu breadboard vật lý.

- [integration-results.json](integration-results.json): **15 kiểm tra PASS**, `physicalBoard=false`, `nativePhone=false`, một request tới push HTTP mock, không có browser JS error.
- [mobile-web-emulator.png](mobile-web-emulator.png): ảnh app Expo web hiển thị dữ liệu MQTT giả lập, có nhãn nguồn kiểm thử.
- [native-config-check.json](native-config-check.json): config LAN HTTP/production, EAS và Maps plugin PASS; chạy plugin trong RAM xác nhận cờ HTTP/Maps key trong Android manifest, không phải native build.
- Backend Surefire: 24 tests, 0 failures/errors/skipped; 21 realtime, 2 push, 1 migration. Log ở `backend/target/surefire-reports/` (ignored).
- Mobile Jest: 10 suites / 40 tests PASS; typecheck và lint PASS. Expo Doctor 1.21.5: 20/20 checks PASS.
- Web export và Android Hermes bundle PASS. Artifact trong `build/mobile-web-integrated-20261025/` và `build/mobile-android-integrated-20261025/` (ignored). Chưa tạo/cài APK.

Runtime dùng Spring Boot thực, Flyway V1/V2/V3 và H2 trong RAM, JWT thực; MQTT localhost:18885 giả lập Node A, push HTTP localhost:18886, API localhost:18085, app web localhost:15175. Tất cả độc lập với public broker và DB nhóm. Script tự tạo password/secret ngẫu nhiên trong RAM; không lưu token vào evidence và dừng các tiến trình nó mở.

Máy kiểm tra dùng Windows, Node 22.20.0, Java 24 chạy target Java 17 và Edge headless. Lệnh chạy lại từ gốc repo, sau khi `npm ci` tại `mobile/` và `frontend/`, có Maven/Java/Edge:

```powershell
Set-Location backend
mvn clean package
Set-Location ../mobile
npm run typecheck
npm run lint
npm test
npm run doctor
$env:EXPO_PUBLIC_API_BASE_URL = 'http://127.0.0.1:18085'
$env:EXPO_PUBLIC_WS_URL = 'ws://127.0.0.1:18085/ws'
$env:APP_ALLOW_HTTP = 'true'
npx expo export --platform web --output-dir ../build/mobile-web-integrated-20261025
npx expo export --platform android --output-dir ../build/mobile-android-integrated-20261025
Set-Location ..
node tests/integration/mobile-native-config-check.cjs
node tests/integration/mobile-integrated-acceptance.cjs
```

Script runtime hiện dùng đường dẫn Edge Windows; sửa `executablePath` nếu máy đặt Edge nơi khác. Có thể đặt `GUARDIAN_JAVA` tới Java 17+ thực tế. Đảm bảo bốn port trên đang trống.

Để thử trên điện thoại sau đó, đổi lại URL LAN trong `.env` và khởi động/export/build lại; địa chỉ 127.0.0.1 ở trên chỉ dành cho bài thử cùng máy. Không dùng các tọa độ thử trong ảnh làm bằng chứng GPS FIX ngoài trời.
