# Kiểm tra firmware

Chạy từ gốc repository với C++ compiler:

```powershell
New-Item -ItemType Directory -Path build -Force | Out-Null
g++ -std=c++11 -Itests/firmware/stubs -Ifirmware/node_a_gateway tests/firmware/uart_protocol_test.cpp -o build/uart_protocol_test.exe
./build/uart_protocol_test.exe
g++ -std=c++11 -Ifirmware/node_b_sensor tests/firmware/wheel_speed_test.cpp -o build/wheel_speed_test.exe
./build/wheel_speed_test.exe
g++ -std=c++11 -Ifirmware/node_a_gateway tests/firmware/wheel_activity_test.cpp -o build/wheel_activity_test.exe
./build/wheel_activity_test.exe
```

Test dùng module UART/Hall/wheel activity thật. UART được thay bằng host stub để kiểm framing/checksum/timeout/độ dài; Hall kiểm xung đầu, dừng/tiếp tục và freshness; wheel activity kiểm phiên, reset, reboot/wrap, bảo vệ bánh, ngưỡng tốc độ động và hysteresis/dwell. Không mô phỏng toàn bộ FreeRTOS/GPIO hoặc xác nhận motor/còi/GPS RF.

## Biên dịch Arduino

Đã dùng ESP32 core 2.0.17, TinyGPSPlus 1.0.3, PubSubClient và ArduinoJson 7.4.3. Tạo `firmware/node_a_gateway/network_config.h` từ file mẫu cạnh đó; chỉ điền Wi-Fi riêng tại máy người chạy, không commit.

```powershell
arduino-cli compile --fqbn esp32:esp32:esp32 --build-path build/node_a firmware/node_a_gateway
arduino-cli compile --fqbn 'esp32:esp32:esp32s3:FlashSize=16M,PSRAM=opi,CDCOnBoot=cdc' --build-path build/node_b firmware/node_b_sensor
arduino-cli compile --fqbn 'esp32:esp32:esp32s3:FlashSize=16M,PSRAM=opi,CDCOnBoot=cdc' --build-path build/gps_bringup firmware/gps_bringup
```

Chỉ dùng hai thư mục chuẩn trong `firmware/`, không có mirror ở gốc. Bánh đường kính 6,5 cm, một xung/vòng cho tốc độ tham chiếu khoảng 0,735 km/h ở một vòng/giây; phép kiểm host không đo sai số bánh thật. Xem [hướng dẫn đấu nối/nạp](../../docs/HUONG-DAN-HARDWARE-FIRMWARE-V2-GPS.md).
