# Smart Motorbike Guardian (IoT & Embedded System)

Backend/frontend đã triển khai WebSocket realtime ngày 13/10/2026. Xem [hướng dẫn chạy và hợp đồng dữ liệu](docs/REALTIME-BACKEND-FRONTEND.md), [kết quả kiểm thử phần mềm](docs/evidence/realtime/README.md). Nghiệm thu với board/GPS/relay thật vẫn cần bằng chứng testbed.

Mobile Expo/React Native được triển khai theo từng task/nhánh. Bắt đầu tại [tổng quan triển khai mobile](docs/MOBILE-APP-IMPLEMENTATION.md), [hướng dẫn cài đặt và chạy](docs/HUONG-DAN-CAI-DAT-VA-CHAY-MOBILE.md), [checklist test trực tiếp](docs/NGHIEM-THU-MOBILE-TRUC-TIEP.md) và [bàn giao](docs/BAN-GIAO-MOBILE-APP.md).

Hệ thống giám sát, cảnh báo chống trộm và điều khiển an toàn xe máy thông minh thời gian thực (Dual-Node Real-time IoT Architecture).

##  Cấu trúc thư mục dự án (Repository Structure)

Cấu trúc thư mục được tổ chức chuẩn hóa theo yêu cầu đề bài đồ án:

```
├── .env.example             # Mẫu cấu hình biến môi trường
├── README.md                # Tài liệu tổng quan dự án
├── firmware/                # Mã nguồn nhúng cho các bo ESP32
│   ├── node_a_gateway/      # Node A Gateway (ESP32-WROOM-32D, FreeRTOS, Relay, Buzzer)
│   └── node_b_sensor/       # Node B Sensor (ESP32-S3, MPU-6050 I2C, Hall Sensor)
├── backend/                 # Backend tiếp nhận, xử lý telemetry và quản trị
├── frontend/                # Giao diện Web dashboard
├── mobile/                  # Ứng dụng Expo React Native Android/iOS
├── database/                # Schema, migration và dữ liệu khởi tạo
├── deployment/              # Cấu hình Docker, MQTT broker và hướng dẫn triển khai
├── hardware/                # Sơ đồ nối dây, danh sách linh kiện và mạch thử nghiệm
├── tests/                   # Kịch bản kiểm thử chức năng và phi chức năng
└── docs/                    # Báo cáo đồ án, tài liệu thiết kế và slide thuyết trình
```
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
