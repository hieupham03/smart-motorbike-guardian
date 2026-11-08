# Mobile — Smart Motorbike Guardian

Expo SDK 58 / React Native. Dùng cùng backend với web; không kết nối trực tiếp tới broker bằng tài khoản người dùng.

## Expo Go

Từ gốc repo, cài bằng `cd frontend/mobile` và `npm ci`. Đặt URL API/WS có thể truy cập từ điện thoại trong `.env` local, theo `.env.example` cùng thư mục, rồi chạy `npm start`. Backend phải hoạt động; trên điện thoại thật không dùng localhost của máy tính.

Hoặc dùng `deployment/start-mobile-demo.bat` từ gốc repo để chạy backend và Expo Go cùng cấu hình LAN. Web có thể dùng cùng backend cổng 8082.

Expo Go dùng kiểm tra màn hình, API và realtime. Remote notification được bỏ qua trong môi trường này; không coi cảnh báo đang hiển thị trong app là push native đã được xác minh.

## Development build và APK preview

Đã có `expo-dev-client` và profile `development`, `preview` trong `eas.json`. Khi triển khai native, liên kết EAS project, đặt URL backend và cấu hình Maps/FCM cần thiết qua biến môi trường local/EAS; không commit file credential.

```powershell
npx eas-cli@latest build --platform android --profile development
npx expo start --dev-client --lan
```

Development build phục vụ kiểm thử và sửa ứng dụng. Profile `preview` tạo APK cài nội bộ có JavaScript bundle; không cần Metro để mở giao diện, nhưng các chức năng online vẫn cần backend truy cập được.

Remote push cần quyền thông báo, EAS project ID, FCM/APNs và backend bật `EXPO_PUSH_ENABLED=true`. Chưa có APK/native push đã nghiệm thu trong repository này. Xem [checklist điện thoại](../../docs/NGHIEM-THU-MOBILE-TRUC-TIEP.md) trước khi kết luận đạt.

## Kiểm tra

```powershell
npm run typecheck
npm run lint
npm test -- --watch=false
npx expo export --platform web --output-dir dist
```

Browser test của repository sử dụng bản `frontend/mobile/dist` với fixture hoặc backend/emulator cục bộ; không tự điều khiển mạch thật. Xem [kiểm thử](../../tests/README.md).
