# Hardware/Firmware v2 GPS — hướng dẫn nạp và thử breadboard

Cập nhật 08/10/2026 cho Node A ESP32-WROOM và Node B ESP32-S3 N16R8. Đây là cấu hình testbed môn học. Firmware v2 đã có đường GPS Node B → UART → Node A → MQTT; chưa có kết quả đo mạch thật trong phiên sửa code.

## 1. File sử dụng và thư viện

- Node A: `firmware/node_a_gateway/node_a_gateway.ino`.
- Node B: `firmware/node_b_sensor/node_b_sensor.ino`.
- `node_a/` và `node_b/` là mirror, đã đồng bộ cả sketch/header/config. Chọn một bộ để nạp.
- Node B cần **TinyGPSPlus**; Node A cần **PubSubClient** và **ArduinoJson**. Phiên này dùng ESP32 core 2.0.17, TinyGPSPlus 1.0.3, ArduinoJson 7.4.3; ArduinoJson 7 có thể cảnh báo API StaticJsonDocument tương thích cũ.
- Chỉnh `guardian_config.h` để đổi chân GPS, timeout, chu vi bánh, số nam châm và mức kích relay.
- Wi-Fi Node A nằm trong `network_config.h` đã được gitignore. Trên máy mới, copy `network_config.example.h` thành `network_config.h` rồi điền Wi-Fi. Những credential cũ đã được chuyển sang file local, không bị in ra hướng dẫn.

## 2. Đấu dây theo bản firmware mới

Tắt nguồn khi đổi dây. Đối chiếu tên GPIO in trên header, không dùng số thứ tự chân. ESP32-S3 N16R8 có flash 16 MB/PSRAM 8 MB; tránh GPIO dành cho flash/PSRAM, GPS ở GPIO6/7 để tách UART giữa hai node.

| Thiết bị/tín hiệu | Nối đến | Ghi chú |
|---|---|---|
| Node B GPIO17 TX1 | Node A GPIO16 RX2 | UART nội bộ 115200 |
| Node A GPIO17 TX2 | Node B GPIO18 RX1 | UART nội bộ 115200 |
| Node A GND | Node B GND | Chung tham chiếu UART |
| MPU SDA/SCL | Node B GPIO8/GPIO9 | I2C, ưu tiên nguồn 3.3 V phù hợp breakout |
| Hall S | Node B GPIO4 | FALLING, INPUT_PULLUP; xác minh output không lên 5 V |
| GPS TX | Node B GPIO6 RX2 | GPS phát NMEA, mặc định thử 9600 baud |
| GPS RX | Để hở khi thử lần đầu | GPIO7 là TX2 đã cấu hình nhưng chưa cần nối |
| GPS GND | Node B GND | Chung tham chiếu |
| GPS VCC | Nguồn theo breakout cụ thể | NEO-6M-0-001 là tên receiver, không đủ để khẳng định breakout nhận 5 V |
| Relay IN | Node A GPIO23 | Jumper chọn LOW để khớp RELAY_ACTIVE_LOW=true |
| Relay VCC/GND | Nguồn đúng module/GND điều khiển | Kiểm tra module nhận điều khiển 3.3 V |
| Relay COM/NO | Nối tiếp nguồn motor DC testbed | Đo mức logic khi chưa nối motor trước |
| LED trạng thái | GPIO2 onboard Node A | LED ngoài GPIO19 trong sơ đồ cũ không được firmware này điều khiển |
| Buzzer điều khiển | Node A GPIO18 | Với buzzer 5 V hai chân: dùng transistor/driver, không cấp tải trực tiếp từ GPIO |

GPS module trần dùng điện áp theo datasheet; breakout có regulator có thể có yêu cầu khác. Chỉ cấp 5 V khi tài liệu/nhãn board xác nhận. GPIO ESP32 là logic 3.3 V; đầu ra GPS/Hall/I2C phải phù hợp. Multimeter cho biết mức DC nhưng không chứng minh đầy đủ biên độ tín hiệu UART; dùng thông số board hoặc đo oscilloscope nếu có.

Motor dùng nguồn riêng đúng định mức motor (motor TT 3–6 V không cấp 12 V). Với tải motor, dùng diode chống xung ngược phù hợp. Không nối chập nguồn ngoài với 5 V USB. Không tuyên bố cách ly quang chỉ vì relay có optocoupler; nối GND/jumper có thể làm mất cách ly.

**Relay chọn HIGH/LOW:** mặc định đặt jumper LOW; `true` → cấp motor bằng LOW, cắt motor bằng HIGH khi dùng COM-NO. Nếu chọn HIGH, đổi RELAY_ACTIVE_LOW=false trên Node A và xác minh thực tế. Khởi động mặc định motor tắt (`RELAY_POWER_ON_AT_BOOT=false`); nhấn `u`, `d` hoặc `a` để cấp motor. Trạng thái PARKED là trạng thái an ninh, không phải xác nhận tiếp điểm đang cấp motor. Mức chân lúc reset/boot vẫn phải đo trên module thật.

## 3. GPS hoạt động như thế nào

```text
NEO-6M TX (NMEA ASCII)
  → UART2 Node B GPIO6
  → GpsTask + TinyGPSPlus (checksum, tọa độ)
  → GPS snapshot có mutex (last fix + tuổi dữ liệu)
  → UARTTask ghép GPS với speed/accel, gửi mỗi 500 ms
  → Node A nhận TelemetryData v2
  → kiểm tra sensor freshness và cộng thời gian giữ snapshot
  → MQTT telemetry mỗi 1 giây
```

GpsTask đọc byte mỗi khoảng 10 ms, không chờ GPS có fix. Hall/MPU vẫn chạy 50 ms. Có tọa độ mới hợp lệ thì lưu lat/lon và lastFix. Trước lần fix đầu: NO_FIX; sau fix nhưng quá 5 giây không có cập nhật hợp lệ: STALE. Giữ tọa độ cuối trong RAM, nhưng Node A chỉ publish lat/lon khi gps_valid=true. `isValid` một mình không đủ: firmware còn kiểm tra tuổi dữ liệu. Mất fix có thể mất tối đa khoảng timeout này mới được phản ánh, không phải phát hiện tức thì.

Payload UART v2 **39 byte**: speed + ax/ay/az + timestamp + lat/lon + gps_age_ms + wheel_idle_ms + gps_valid/imu_valid/speed_valid. Nạp cả hai node; node chạy header cũ 20 byte không tương thích. UART frame vẫn start/type/len/payload/XOR; version v2 hiện là quy ước build/size, chưa thêm byte version vào frame.

MQTT giữ tên speed_kmh, accel_x/y/z, latitude, longitude tương thích backend hiện tại; thêm gps_valid, gps_age_ms, sensor_connected, imu_valid, speed_valid và data_source. `ts` vẫn là uptime, không phải GPS UTC. Backend hiện chưa xử lý đầy đủ metadata, state và offline: giao việc đó cho người làm backend/app. Firmware ngừng gửi battery_v cố định, nhưng backend vẫn có default pin 12.6 V; app chưa phải bằng chứng đo pin thật.

## 4. Những sửa chữa firmware và lý do

| Sửa | Trước đây | Bản v2 |
|---|---|---|
| ACK | cmd/# nhận lại cmd/ack và ACK tiếp | Bỏ qua /ack, parse JSON, kiểm tra type khớp topic |
| Thực thi | Callback đổi state/ACK trước khi relay chạy | Callback đưa lệnh vào queue; ControlTask thực thi rồi mới tạo ACK |
| Lệnh trùng | UUID và alias có thể thực thi cùng cmd_id hai lần | Cache 8 kết quả RAM; gửi lại ACK mà không chạy lại trong cửa sổ cache |
| Điều khiển | Nhiều task/Serial cùng đổi state và UART TX | ControlTask sở hữu state/relay/buzzer; UART task sở hữu UART TX |
| LOCK/REBOOT | Dữ liệu thiếu/mutex lỗi coi như 0 | Từ chối NO_SENSOR_DATA/SENSOR_STALE/SPEED_INVALID/SPEED_NOT_ZERO |
| Hall | Đếm 200 ms tạo các cửa sổ 0 khi quay chậm | Đo khoảng xung, giữ ước lượng và yêu cầu không có xung 4 giây trước khi khóa |
| MPU | Thiếu cảm biến sinh fallback trông như số thật | Gắn imu_valid=false, không phát cảnh báo từ mẫu lỗi, retry I2C |
| Vibration | Static tilt bị tính thành rung; counter giảm dần | Dùng độ lệch độ lớn gia tốc; counter reset để đúng 3 mẫu liên tiếp; chỉ motion khi ARMED |
| Tilt | Xử lý az âm không đúng | atan2(hypot(ax,ay), az); đặt board thẳng Z khoảng +g khi lắp |
| MQTT | Buffer có thể thiếu sau thêm GPS | Buffer 768 byte, kiểm tra serialize/publish; RAM alert chỉ xóa sau publish thành công |
| Siren | Bật còi kéo state ALARM rồi tự khóa | Còi thủ công là cờ riêng, không tự kích hoạt khóa sau 15 giây |

Hall không tự kiểm tra dây đã đứt. Timeout 4 giây là heuristic testbed, không đảm bảo đứng yên ở mọi tốc độ rất thấp. GPS không thay Hall cho interlock. ACK EXECUTED chứng minh firmware đã xuất GPIO, chưa có cảm biến phản hồi để chứng minh tiếp điểm vật lý đã đổi. Cache/RAM mất khi reset và sau 8 cmd_id mới, không phải lưu trữ bền vững. PubSubClient publish ở đây QoS0; giá trị true chưa chứng minh backend đã nhận.

## 5. Bắt đầu thử GPS hôm nay

1. Chốt nguồn breakout, nối GPS TX→GPIO6 và GND; GPS RX/PPS để hở.
2. Cài TinyGPSPlus. Có thể nạp `firmware/gps_bringup/gps_bringup.ino` riêng để xem NMEA; khi dùng sketch này Node B chưa chạy Hall/MPU/UART nội bộ. Sau thử phải nạp lại firmware Node B.
3. Board chọn ESP32S3 Dev Module, Flash Size 16 MB, PSRAM OPI PSRAM. USB CDC On Boot enabled nếu dùng USB native; nếu dùng USB-UART thì chọn đúng cổng và cấu hình Serial tương ứng. Serial Monitor 115200.
4. Đặt antenna ngoài trời thoáng, mặt gốm hướng trời, chờ fix. NMEA có byte chưa đồng nghĩa đã định vị.
5. Nạp Node B v2, xem `[GPS FIX] lat=... lon=... age=...`. `chars=0` → kiểm tra dây/baud/nguồn; chars tăng nhưng NO_FIX → parser/checksum/antenna/điều kiện thu.
6. Nạp Node A v2, mở log MQTT và kiểm tra topic guardian/<device_id>/telemetry có lat/lon thật.
7. Đưa GPS vào nơi tín hiệu kém hoặc dừng TX: sau timeout gps_valid=false, lat/lon không publish như vị trí mới; Hall/MPU vẫn chạy. Dừng TX chỉ kiểm tra mất dữ liệu, khác mất fix vô tuyến.

## 6. Test firmware sau nạp

Serial Node A: `a` ARM, `d` DISARM, `k` LOCK, `u` UNLOCK, `b` SIREN_ON, `s` SIREN_OFF. `2` giờ chỉ bật còi thủ công, không ép trạng thái ALARM.

| Thử | Mong đợi |
|---|---|
| Chỉ Node A chạy, nhấn k | NO_SENSOR_DATA/SENSOR_STALE, không thao tác khóa |
| Hai node chạy, xoay bánh liên tục, nhấn k | SPEED_NOT_ZERO |
| Dừng bánh trên 4 giây, telemetry/heartbeat còn mới, nhấn k | EXECUTED; đo relay ngắt COM-NO |
| Rút UART B→A, chờ trên 1.5 giây, nhấn k | SENSOR_STALE |
| Gửi cùng cmd_id trên UUID/alias | Một lần thao tác, ACK lặp cùng kết quả; không vòng ACK |
| Rút MPU rồi cắm lại | imu_valid=false rồi phục hồi; không sinh dữ liệu giả |
| GPS fix/mất cập nhật | FIX rồi STALE, không tọa độ 0,0 giả |
| Tắt mạng rồi bật lại | Task Hall/MPU/GPS/UART không phụ thuộc mạng; alert RAM có giới hạn |

Chỉ đánh dấu PASS khi có log và quan sát breadboard. Không nạp tự động qua CLI trong phiên sửa code; chưa chọn cổng serial hay vận hành motor từ xa.

## 7. Nguồn kỹ thuật

- [u-blox NEO-6 datasheet](https://content.u-blox.com/sites/default/files/products/documents/NEO-6_DataSheet_%28GPS.G6-HW-09005%29.pdf): receiver; điện áp breakout cần xác minh riêng.
- [TinyGPSPlus API](https://github.com/mikalhart/TinyGPSPlus/blob/master/src/TinyGPS%2B%2B.h): encode/isValid/isUpdated/age.
- [PubSubClient](https://github.com/knolleary/pubsubclient): buffer và publish.

## 8. Kết quả kiểm tra trên máy ngày 08/10/2026

| Kiểm tra | Kết quả |
|---|---|
| Node A, esp32:esp32:esp32, core 2.0.17 | Build PASS; flash 749525 byte, static RAM 56608 byte |
| Node B, esp32s3, FlashSize=16M, PSRAM=opi, CDCOnBoot=cdc | Build PASS; flash 301525 byte, static RAM 20448 byte |
| GPS bringup, cùng cấu hình S3 | Build PASS; flash 279877 byte, static RAM 19412 byte |
| Host test UART v2 | PASS: roundtrip payload GPS, checksum sai, timeout gói thiếu, phục hồi, giới hạn length, null/empty payload |
| Mirror sketch Node A/Node B | SHA256 giống nhau giữa firmware/ và node_a/, node_b/ |
| git diff --check | PASS |

Static RAM ở bảng không bao gồm toàn bộ heap/task stack cấp phát lúc chạy. Chưa chạy test phần cứng, chưa nạp board, chưa đo GPS fix/relay/latency. Đây không phải xác nhận nghiệm thu end-to-end với app.

`hardware/diagram.json` là sơ đồ mô phỏng Wokwi hai node trước GPS, đã sửa LED ngoài về GPIO2; chưa có mô hình GPS/driver buzzer vật lý. Khi đấu mạch thật dùng bảng pinout trong hướng dẫn này. `diagram.json` ở root và `simulation/` là mô phỏng một node cũ, không đại diện bản firmware v2.
