# Smart Motorbike Guardian (IoT & Embedded System)

Hệ thống giám sát, cảnh báo chống trộm và điều khiển an toàn xe máy thông minh thời gian thực (Dual-Node Real-time IoT Architecture).

## 📁 Cấu trúc thư mục dự án (Repository Structure)

Cấu trúc thư mục được tổ chức chuẩn hóa theo yêu cầu đề bài đồ án:

```
├── .env.example             # Mẫu cấu hình biến môi trường
├── README.md                # Tài liệu tổng quan dự án
├── firmware/                # Mã nguồn nhúng cho các bo ESP32
│   ├── node_a_gateway/      # Node A Gateway (ESP32-WROOM-32D, FreeRTOS, Relay, Buzzer)
│   └── node_b_sensor/       # Node B Sensor (ESP32-S3, MPU-6050 I2C, Hall Sensor)
├── backend/                 # Backend tiếp nhận, xử lý telemetry và quản trị
├── frontend/                # Giao diện Web / Mobile dashboard
├── database/                # Schema, migration và dữ liệu khởi tạo
├── deployment/              # Cấu hình Docker, MQTT broker và hướng dẫn triển khai
├── hardware/                # Sơ đồ nối dây, danh sách linh kiện và mạch thử nghiệm
├── tests/                   # Kịch bản kiểm thử chức năng và phi chức năng
└── docs/                    # Báo cáo đồ án, tài liệu thiết kế và slide thuyết trình
```
