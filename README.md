# Smart Motorbike Guardian

Bài tập lớn IoT trên breadboard: ESP32-S3 đọc Hall/MPU6050/NEO-6M; ESP32 gateway điều khiển relay/buzzer và MQTT; Spring Boot + PostgreSQL + WebSocket + React giám sát/điều khiển hai chiều.

## Chạy hệ thống

1. Đấu và nạp theo [hướng dẫn hardware/firmware](docs/HUONG-DAN-HARDWARE-FIRMWARE-V2-GPS.md).
2. Copy `deployment/.env.example` thành `deployment/.env`, đặt mật khẩu DB, JWT secret và mật khẩu demo nếu bật seed.
3. Từ `deployment/`: `docker compose up --build -d`.
4. Web: `http://localhost:3000`; health: `http://localhost:8080/api/health`.

Chi tiết local Java/Maven/Node/H2: [hướng dẫn realtime](docs/REALTIME-BACKEND-FRONTEND.md). Các script start-*.bat dùng cùng compose, không tự xóa DB. Firmware/backend phải cùng broker/UUID; MQTT1883 không phải TLS.

## Cấu trúc

| Thư mục | Vai trò |
|---|---|
| firmware/ | Sketch chuẩn Node A, Node B, GPS bringup độc lập |
| node_a/, node_b/ | Mirror tương thích, luôn đồng bộ firmware |
| backend/, frontend/ | Spring Boot và web React/WebSocket |
| backend/src/main/resources/db/migration/ | Schema Flyway duy nhất |
| deployment/ | Compose/env mẫu/broker local tùy chọn |
| hardware/ | Đấu dây và diagram Wokwi hai node |
| tests/ | Host UART/Hall và software/browser integration |
| docs/ | Đặc tả, nghiệm thu, bàn giao, cấu trúc slide |
| docs/archive/ | Báo cáo/mô phỏng cũ, không dùng làm bằng chứng hiện trạng |

Đọc [trạng thái hoàn thiện](docs/HOAN-THIEN-VA-NGHIEM-THU.md), [đặc tả](docs/PROJECT_SPECIFICATION.md), [nghiệm thu hardware](docs/NGHIEM-THU-HARDWARE-FIRMWARE.md) và [bàn giao](docs/BAN-GIAO-BACKEND-FRONTEND-VA-TICH-HOP.md).

## Kiểm tra

- Backend: `cd backend`, `mvn test`.
- Frontend: `cd frontend`, `npm ci`, `npm test`, `npm run build`.
- Firmware: [UART/Hall và build](tests/firmware/README.md).
- Browser: [software integration checks](tests/integration/README.md).

PASS phần mềm không thay PASS breadboard. Người dùng báo GPS fix ngoài trời, chưa có log tọa độ trong repo; cần thử GPS xuyên suốt hệ thống. Hiệu chỉnh Hall, nguồn motor, relay/reset và chạy lâu cần quan sát thật. Mobile chưa có source; thành viên mobile dùng chung API/realtime. Chưa đo ADC thì điện áp HARDWARE phải null.
