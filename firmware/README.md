# Firmware hai node

- `node_a_gateway/`: ESP32-WROOM-32, gateway Wi-Fi/MQTT, máy trạng thái, relay/còi, xử lý thống kê và cảnh báo bánh.
- `node_b_sensor/`: ESP32-S3 N16R8, đọc Hall/MPU-6050 và UART GPS NEO-6M; gửi telemetry/bộ đếm bánh cho Node A.
- `gps_bringup/`: sketch kiểm tra GPS độc lập. Sau khi kiểm tra, nạp lại firmware Node B đầy đủ.

Mở đúng `.ino` trong thư mục tương ứng cùng các header bên cạnh. Tạo `node_a_gateway/network_config.h` từ file `.example.h`, điền Wi-Fi local và giữ file thật ngoài Git. Cấu hình GPIO/relay được mô tả trong [hardware](../hardware/README.md).

[Kiểm thử và biên dịch](../tests/firmware/README.md) · [Hướng dẫn firmware/GPS](../docs/HUONG-DAN-HARDWARE-FIRMWARE-V2-GPS.md) · [Ngưỡng tốc độ trên web/mobile](../docs/CAI-DAT-NGUONG-TOC-DO-WEB-MOBILE.md).
