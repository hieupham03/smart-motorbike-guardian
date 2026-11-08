# Test mobile trên lớp bằng một lần mở

**Chạy đồng thời web, mobile và hai node thật:** làm theo [hướng dẫn hai cửa sổ và kịch bản phần cứng](CHAY-WEB-MOBILE-VOI-PHAN-CUNG-THAT.md). Web phải trỏ cùng backend 8082 của launcher.

Từ thư mục dự án, **bấm đúp `deployment/start-mobile-demo.bat`**, hoặc trong PowerShell:

```powershell
cd D:\Firmware-IoT
.\deployment\start-mobile-demo.bat
```

Không cần dán các biến môi trường hay tự mở backend ở terminal khác. Nếu đang chạy backend/Expo bằng cách cũ, nhấn Ctrl+C ở hai terminal đó trước để tránh trùng cổng.

## Chuẩn bị một lần ở nhà

1. Có backend JAR đã build trong `backend/target/` và dependencies mobile (`npm ci` trong `frontend/mobile/`). Launcher dùng bản JAR đó; sau sửa backend, build lại bằng `mvn package` trước khi demo.
2. Cài Expo Go tương thích SDK 58 trên điện thoại. iPhone có thể yêu cầu đăng nhập cùng tài khoản Expo trên máy tính và Expo Go.
3. Cho laptop/điện thoại cùng Wi-Fi. Hai node cần vào Wi-Fi có Internet để dùng broker `broker.emqx.io:1883` hiện tại. Nếu dùng hotspot, cấu hình Wi-Fi của node cho hotspot **trước buổi học**; không cần mua thêm module.
4. Chạy launcher, đặt mật khẩu **ít nhất 8 ký tự ở lần đầu**. Mật khẩu/JWT lưu mã hóa bằng Windows user hiện tại, không đưa vào Git.
5. Lần đầu Windows hỏi quyền mạng cho Java/Node, cho phép ở mạng riêng. Trên điện thoại mở địa chỉ health launcher in ra; phải truy cập được trước khi quét QR. Backend dùng 8082, Metro dùng 8081.
6. Quét QR bằng Expo Go. Đăng nhập `owner@guardian.iot` với mật khẩu vừa đặt. Thử Hall, phiên bánh xe, reset và cảnh báo trước khi mang lên lớp.

## Mỗi lần test trên lớp

1. Cấp nguồn hai node, nối laptop và điện thoại vào cùng mạng đã chuẩn bị.
2. Bấm đúp `deployment/start-mobile-demo.bat`, chờ backend OK và QR.
3. Quét QR/mở lại app; nếu cần đăng nhập, dùng tài khoản và mật khẩu cũ.
4. Chọn đúng thiết bị HARDWARE, xác nhận gateway/sensor mới rồi thử tính năng.
5. Kết thúc bằng **Ctrl+C** trong cửa sổ launcher. Launcher dừng Java do chính nó mở; dữ liệu và tài khoản demo vẫn còn. Nên dùng Ctrl+C thay vì đóng cưỡng bức cửa sổ.

Launcher tự chọn IP của card mạng vật lý có gateway (bỏ VPN/VMware), truyền URL API/WS cho app và IP QR cho Metro. Đổi Wi-Fi thì khởi động lại launcher rồi quét QR mới; không phải sửa `.env` mỗi lần. Đây là chế độ chạy source qua Expo Go; cần giữ laptop chạy trong lúc thử.

## Dữ liệu và giới hạn

- DB riêng nằm `.local/mobile-demo/guardian.mv.db`; không dùng/xóa PostgreSQL của nhóm, không mất lịch sử sau khi tắt như H2 RAM. Phiên quay bánh trên firmware vẫn là RAM và bắt đầu lại khi node reboot.
- Đây là DB demo riêng; tài khoản/lịch sử từ DB nhóm không tự được sao chép sang. Cùng UUID Node A thì dữ liệu MQTT thật vẫn đi vào thiết bị HARDWARE seed tương ứng.
- Cấu hình mã hóa nằm `.local/mobile-demo/settings.json`; không chia sẻ file này, không sửa/xóa riêng để đổi mật khẩu vì mật khẩu trong DB cũ vẫn giữ nguyên. Cần đổi mật khẩu thì dùng chức năng đổi mật khẩu của hệ thống; launcher không tự reset tài khoản.
- Log lỗi ở `.local/mobile-demo/backend.log` và `backend-error.log`. Thư mục `.local/` được Git bỏ qua.
- Launcher **tắt remote push**. Cảnh báo vẫn hiển thị trong app đang mở qua backend/realtime; remote push Android cần native/development build và FCM. [Expo SDK 58 Notifications](https://docs.expo.dev/versions/v58.0.0/sdk/notifications/).
- App nhận diện Expo Go và không import `expo-notifications` trong môi trường này. Nếu gặp lỗi cũ `Cannot find native module 'ExpoTopicSubscriptionModule'`, dừng launcher bằng Ctrl+C, đóng app trên điện thoại rồi chạy `start-mobile-demo.bat -ClearCache` và quét lại QR. Đây là sửa phần mềm ngày 26/10/2026; cần mở lại trên điện thoại để xác nhận.
- Broker đang là dịch vụ công cộng trên Internet. Mạng lớp chặn kết nối giữa thiết bị hoặc chặn MQTT có thể làm demo lỗi; ưu tiên mạng/hotspot đã thử trước. Expo tunnel riêng không tự làm API backend LAN truy cập được từ điện thoại.
- APK preview sau này sẽ bỏ bước quét QR/Metro, nhưng vẫn cần backend truy cập được. Chưa có APK/điện thoại thật được nghiệm thu bởi launcher này.

Kiểm tra điều kiện mà không chạy dịch vụ:

```powershell
.\deployment\start-mobile-demo.bat -Check
```

Chỉ định IP/cổng nếu tự nhận diện không phù hợp:

```powershell
.\deployment\start-mobile-demo.bat -LanIp 192.168.16.102 -Port 8082 -MetroPort 8081
```

IP trên chỉ là ví dụ, dùng IPv4 của card Wi-Fi thực tế. Nếu cổng bận, launcher dừng và báo; không tự tắt dịch vụ khác. [Cách Expo mở app bằng QR](https://docs.expo.dev/get-started/start-developing/). Chi tiết native build/push: [hướng dẫn đầy đủ](HUONG-DAN-CAI-DAT-VA-CHAY-MOBILE.md).

## Kiểm tra phần mềm của launcher

Đã chạy preflight chọn đúng Wi-Fi trên máy có Radmin/VMware. Thử backend thực hai lần với DB file riêng: đăng nhập Owner, sửa metadata và xác nhận dữ liệu vẫn còn sau khởi động lại. Bài thử host tắt MQTT, thay bước Metro bằng kiểm tra API/URL; chưa xác nhận QR hoặc điện thoại thật. DB demo dùng `WRITE_DELAY=0` để ghi ngay các thay đổi đã commit. Kết quả cục bộ tại `build/mobile-launcher-smoke-result.json`; không tính là nghiệm thu breadboard.
