# Kiểm thử tích hợp phần mềm

Cài dependencies bằng `npm ci` trong `frontend/` và `frontend/mobile/`. Playwright là dev dependency đã có trong lockfile web. Cài browser bằng `npx playwright install chromium` trong `frontend/` nếu không dùng Edge trên Windows.

Tạo các build trước khi chạy:

```powershell
cd frontend
npm run build
cd mobile
npx expo export --platform web --output-dir dist
cd ../..
```

| Script, chạy từ gốc repo | Phạm vi |
|---|---|
| `node tests/integration/speed-limit-ui.cjs` | Web/mobile: nhập ngưỡng, chờ ACK, ngưỡng thiết bị báo về, lỗi và quyền |
| `node tests/integration/gps-map-ui.cjs` | Bản đồ web/mobile export với vị trí và trạng thái fixture |
| `node tests/integration/user-dev-ui-smoke.cjs` | Giao diện người dùng/khu vực dev, quyền và màn hình nhỏ |
| `node tests/integration/mobile-native-config-check.cjs` | Kiểm cấu hình development/production; không dựng APK |
| `node tests/integration/mobile-integrated-acceptance.cjs` | Spring Boot/H2 thật + MQTT/push emulator cục bộ; cần `mvn package` trong backend |
| `node tests/integration/gps-map-provider-probe.cjs` | Kiểm truy cập nhà cung cấp bản đồ; có gọi mạng ngoài |
| `node tests/integration/device-connection-ui.cjs` | 38 ca fixture web/mobile về cấp khóa, reactivate, Admin/provision, Viewer, che khóa và browser storage |

UI fixtures không đăng nhập tài khoản thật và không gửi lệnh tới mạch. Phép tích hợp backend dùng cổng/DB riêng và emulator, không dùng broker công cộng để điều khiển board. Kết quả được lưu trong `docs/evidence/` và phải ghi đúng nhãn fixture/emulator. Native phone, GPS RF, relay/motor và độ trễ vật lý cần kiểm riêng.

Đặt `PLAYWRIGHT_EXECUTABLE_PATH` nếu dùng browser ở đường dẫn riêng. Có thể đặt `GUARDIAN_JAVA` để chọn Java khi chạy tích hợp backend.

Script cấp kết nối dùng build tách riêng để không thay bản đang demo. Build web bằng `npm run build -- --outDir ../build/device-connection-web-ui` trong frontend; export mobile bằng `npx expo export --platform web --output-dir ../../build/device-connection-mobile-ui` trong frontend/mobile, với API/WS fixture tại localhost. Script chặn mọi host ngoài localhost/127.0.0.1 và không gửi lệnh đến mạch.

Phép đo mạch thật là quy trình riêng: [công cụ đo và lưu minh chứng](../../docs/DO-LUONG-VA-LUU-MINH-CHUNG.md), [phiên 30 phút đã ghi](../../docs/evidence/classroom-hardware/README.md). Không chạy ca reset phiên hoặc thu hồi trên board khi người vận hành chưa chuẩn bị.
