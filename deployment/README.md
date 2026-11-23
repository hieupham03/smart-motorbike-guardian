# Triển khai

## Demo tại trường: không cần Docker

Ưu tiên [bộ chuẩn bị demo](../docs/CHUAN-BI-DEMO-TAI-TRUONG.md). Sau build, Prepare cấu hình riêng và nạp Node A, dùng `deployment/start-classroom-demo.bat -WebOnly`: backend/H2 **8082**, broker xác thực **1883**, web HTTPS/WSS **5173**. Bỏ `-WebOnly` để chạy cả Expo **8081**, hoặc mở `start-mobile-client.bat` sau khi backend đã chạy.

HTTPS dùng OpenSSL trên laptop, chứng chỉ tự ký và private key nằm trong `.local/classroom-demo/tls/`. Kiểm fingerprint trước khi chấp nhận chứng chỉ, không tự cài CA vào máy khác. HTTP nội bộ, MQTT TCP và Expo Go LAN không được gọi là mã hóa toàn hệ thống. Script `start-classroom-https.bat -LanIp <IPv4>` mở thêm web HTTPS **5443** nếu cần.

Classroom lưu DPAPI/database riêng tại `.local/classroom-demo/`; database `.local/mobile-demo/` cũ không bị thay thế. Mạch mới cần Owner kích hoạt bằng mã Admin xem được. Mỗi thiết bị có mật khẩu MQTT riêng, khác tài khoản dịch vụ backend. Xem [xác thực/vòng đời](../docs/BAO-MAT-MQTT-VA-VONG-DOI.md).

## Docker Compose

Từ gốc repository, copy `.env.example` thành `deployment/.env`, đặt mật khẩu PostgreSQL/JWT và mật khẩu tài khoản mẫu nếu bật seed. Chạy:

```powershell
docker compose --env-file deployment/.env -f deployment/docker-compose.yml up --build -d
```

Web cổng 3000, API cổng 8080, PostgreSQL cổng 5432. Schema được Flyway nâng cấp khi backend khởi động; không dùng xóa volume để nâng cấp. Tài khoản mẫu chỉ được tạo nếu `DEMO_SEED_ENABLED=true` và có `DEMO_PASSWORD` hợp lệ.

Broker mặc định là `broker.emqx.io:1883`. Muốn dùng broker cục bộ:

```powershell
docker compose --env-file deployment/.env -f deployment/docker-compose.yml --profile local-broker up --build -d
```

Đặt `MQTT_BROKER_URL=tcp://mosquitto:1883` cho backend trong Docker; Node A dùng IP LAN của máy chạy broker. Không dùng tên `mosquitto` làm địa chỉ trên ESP32. Cấu hình Mosquitto hiện phục vụ mạng thử nghiệm, không có TLS/ACL theo thiết bị.

Các file `start-backend.bat`, `start-database.bat`, `start-frontend.bat` gọi cùng Compose và dùng `deployment/.env`.

Để dùng broker xác thực trong backend với Docker, điền riêng `MQTT_PASSWORD` cho dịch vụ và `DEMO_DEVICE_MQTT_PASSWORD` cho board trong file local, đặt `MQTT_PUBLIC_HOST` là IP LAN rồi chạy:

```powershell
docker compose --env-file deployment/.env -f deployment/docker-compose.yml -f deployment/docker-compose.classroom.yml up --build -d
```

Không bật profile Mosquitto `local-broker` đồng thời vì cùng cổng 1883. Override này không tự cấp chứng chỉ HTTPS cho Nginx; bộ chạy Windows HTTPS ở trên là cấu hình đã chuẩn bị cho buổi demo.

## Bộ chạy thử trên Windows

Sau khi đã build backend và `npm ci` trong `frontend/mobile/`, chạy `deployment/start-mobile-demo.bat`. Script `deployment/scripts/start-mobile-demo.ps1` tự tìm JDK/Node và địa chỉ LAN, tạo bí mật riêng bằng Windows DPAPI ở `.local/mobile-demo/`, mở backend H2 file cổng 8082 và Expo cổng 8081. `-Check` chỉ kiểm môi trường.

```powershell
.\deployment\start-mobile-demo.bat -Check
.\deployment\start-mobile-demo.bat
```

Ctrl+C dừng đúng Java child mà launcher đã mở; không dừng dịch vụ khác chỉ vì trùng cổng. Dữ liệu H2 được giữ sau khi dừng. Khi chuyển máy hoặc đổi mạng, kiểm tra API từ điện thoại trước khi đăng nhập. Bộ chạy này tắt remote push mặc định; xem [mobile](../frontend/mobile/README.md) khi cấu hình push thật.
