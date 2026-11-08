# Triển khai

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

## Bộ chạy thử trên Windows

Sau khi đã build backend và `npm ci` trong `frontend/mobile/`, chạy `deployment/start-mobile-demo.bat`. Script `deployment/scripts/start-mobile-demo.ps1` tự tìm JDK/Node và địa chỉ LAN, tạo bí mật riêng bằng Windows DPAPI ở `.local/mobile-demo/`, mở backend H2 file cổng 8082 và Expo cổng 8081. `-Check` chỉ kiểm môi trường.

```powershell
.\deployment\start-mobile-demo.bat -Check
.\deployment\start-mobile-demo.bat
```

Ctrl+C dừng đúng Java child mà launcher đã mở; không dừng dịch vụ khác chỉ vì trùng cổng. Dữ liệu H2 được giữ sau khi dừng. Khi chuyển máy hoặc đổi mạng, kiểm tra API từ điện thoại trước khi đăng nhập. Bộ chạy này tắt remote push mặc định; xem [mobile](../frontend/mobile/README.md) khi cấu hình push thật.
