# Hướng dẫn phần cứng và firmware (Node A, Node B, GPS NEO-6M)

Cấu hình testbed cho **Node A (ESP32-WROOM-32)** và **Node B (ESP32-S3 N16R8)** với cảm biến Hall, MPU-6050, GPS NEO-6M, relay và còi báo động. Chi tiết thuật toán Hall/tốc độ xem [BA-TINH-NANG-HALL-VA-TOC-DO.md](BA-TINH-NANG-HALL-VA-TOC-DO.md) và kết quả kiểm chứng xem [RELEASE.md](RELEASE.md).

## 1. File sử dụng và thư viện

- Node A: `firmware/node_a_gateway/node_a_gateway.ino`.
- Node B: `firmware/node_b_sensor/node_b_sensor.ino`.
- Node B cần thư viện **TinyGPSPlus**; Node A cần **PubSubClient** và **ArduinoJson** (ESP32 core 2.0.17, TinyGPSPlus 1.0.3, ArduinoJson 7.x).
- Chỉnh `guardian_config.h` để đổi chân GPS, timeout, chu vi bánh, số nam châm và mức kích relay.
- Cấu hình bánh xe: đường kính `0,065 m`, chu vi `0,20420352 m`, `1` xung Hall/vòng. Nếu số xung/vòng khác `1`, sửa `WHEEL_PULSES_PER_REV` trước khi nạp.
- Wi-Fi và thông tin MQTT của Node A nằm trong `firmware/node_a_gateway/network_config.h` (được Git bỏ qua). Trên máy mới, sao chép `network_config.example.h` thành `network_config.h` rồi điền Wi-Fi và broker tương ứng.

## 2. Đấu dây phần cứng

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
| Relay IN | Node A GPIO23 | Jumper chọn HIGH để khớp RELAY_ACTIVE_LOW=false |
| Relay VCC/GND | Nguồn đúng module/GND điều khiển | Kiểm tra module nhận điều khiển 3.3 V |
| Relay COM/NO | Nối tiếp nguồn motor DC testbed | Đo mức logic khi chưa nối motor trước |
| LED trạng thái | GPIO2 onboard Node A | LED ngoài GPIO19 trong sơ đồ cũ không được firmware này điều khiển |
| Buzzer điều khiển | Node A GPIO18 | Với buzzer 5 V hai chân: dùng transistor/driver, không cấp tải trực tiếp từ GPIO |

GPS module trần dùng điện áp theo datasheet; breakout có regulator có thể có yêu cầu khác. Chỉ cấp 5 V khi tài liệu/nhãn board xác nhận. GPIO ESP32 là logic 3.3 V; đầu ra GPS/Hall/I2C phải phù hợp. Multimeter cho biết mức DC nhưng không chứng minh đầy đủ biên độ tín hiệu UART; dùng thông số board hoặc đo oscilloscope nếu có.

Motor dùng nguồn riêng đúng định mức motor (motor TT 3–6 V không cấp 12 V). Với tải motor, dùng diode chống xung ngược phù hợp. Không nối chập nguồn ngoài với 5 V USB. Không tuyên bố cách ly quang chỉ vì relay có optocoupler; nối GND/jumper có thể làm mất cách ly.

**Relay hiện dùng HIGH:** config local Node A là `RELAY_ACTIVE_LOW=false`; HIGH cấp motor qua COM-NO, LOW ngắt. `RELAY_POWER_ON_AT_BOOT=true` cấp motor sau khởi tạo. Bản Hall mới yêu cầu ARM khi bánh dừng, sau đó ngắt motor để canh giữ; DISARM/UNLOCK cấp lại. Khi đổi module LOW phải đổi jumper và `RELAY_ACTIVE_LOW=true`. PARKED là trạng thái an ninh, không xác nhận tiếp điểm đang cấp motor. Xác nhận vận hành trước đó không thay nghiệm thu hành vi ARM mới hoặc phép đo lúc reset/boot.

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

MQTT sử dụng các trường `speed_kmh`, `accel_x/y/z`, `latitude`, `longitude`, cùng metadata `gps_valid`, `gps_age_ms`, `sensor_connected`, `imu_valid`, `speed_valid` và `data_source`. `ts` là uptime của thiết bị, không phải GPS UTC. Khi chưa gắn mạch chia áp ADC, điện áp thiết bị `HARDWARE` để `null`.

Log GPS trạng thái `NO_FIX` trong nhà được lưu tại [evidence/gps/README.md](evidence/gps/README.md).

## 4. Cơ chế xử lý an toàn trong firmware

| Cơ chế | Thiết kế |
|---|---|
| ACK | Bỏ qua topic `/ack` khi lắng nghe `cmd/#`, parse JSON, kiểm tra `type` khớp topic |
| Thực thi lệnh | Callback đưa lệnh vào queue; `ControlTask` thực thi rồi mới tạo ACK |
| Chống lặp lệnh | Cache 8 kết quả gần nhất trong RAM; trả lại ACK mà không thực thi lại cùng `cmd_id` |
| Đồng bộ task | `ControlTask` sở hữu trạng thái/relay/buzzer; `UARTTask` sở hữu UART TX |
| Interlock `LOCK`/`ARM`/`REBOOT` | Từ chối với `NO_SENSOR_DATA` / `SENSOR_STALE` / `SPEED_INVALID` / `SPEED_NOT_ZERO` |
| Hall | Đo chu kỳ giữa các xung và yêu cầu không có xung ít nhất 4 giây trước khi khóa/canh giữ |
| MPU-6050 | Gắn `imu_valid=false` khi cảm biến lỗi, không sinh dữ liệu giả, tự động retry I2C |
| Rung lắc | Tính độ lệch độ lớn gia tốc, yêu cầu 3 mẫu liên tiếp vượt ngưỡng khi `ARMED` |
| Góc nghiêng | `atan2(hypot(ax,ay), az)`; đặt board thẳng trục Z hướng +g khi lắp |
| MQTT buffer | Buffer 768 byte, kiểm tra serialize/publish; chỉ xóa cảnh báo RAM sau khi publish thành công |
| Còi thủ công | Tách cờ riêng, không kéo trạng thái sang `ALARM` hoặc tự kích hoạt khóa sau 15 giây |

Hall không tự kiểm tra dây đã đứt. Timeout 4 giây là heuristic testbed, không đảm bảo đứng yên ở mọi tốc độ rất thấp. GPS không thay Hall cho interlock. ACK EXECUTED chứng minh firmware đã xuất GPIO, chưa có cảm biến phản hồi để chứng minh tiếp điểm vật lý đã đổi. Cache/RAM mất khi reset và sau 8 cmd_id mới, không phải lưu trữ bền vững. PubSubClient publish ở đây QoS0; giá trị true chưa chứng minh backend đã nhận.

## 5. Quy trình nạp và kiểm tra GPS

1. Chốt nguồn breakout, nối GPS TX→GPIO6 và GND; GPS RX/PPS để hở.
2. Cài TinyGPSPlus. Có thể nạp `firmware/gps_bringup/gps_bringup.ino` riêng để xem NMEA; khi dùng sketch này Node B chưa chạy Hall/MPU/UART nội bộ. Sau thử phải nạp lại firmware Node B.
3. Board chọn ESP32S3 Dev Module, Flash Size 16 MB, PSRAM OPI PSRAM. USB CDC On Boot enabled nếu dùng USB native; nếu dùng USB-UART thì chọn đúng cổng và cấu hình Serial tương ứng. Serial Monitor 115200.
4. Đặt antenna ngoài trời thoáng, mặt gốm hướng trời, chờ fix. NMEA có byte chưa đồng nghĩa đã định vị.
5. Nạp Node B, xem `[GPS FIX] lat=... lon=... age=...`. `chars=0` → kiểm tra dây/baud/nguồn; chars tăng nhưng NO_FIX → parser/checksum/antenna/điều kiện thu.
6. Nạp Node A, mở log MQTT và kiểm tra topic `guardian/<device_id>/telemetry` có lat/lon thật.
7. Đưa GPS vào nơi tín hiệu kém hoặc dừng TX: sau timeout `gps_valid=false`, lat/lon không publish như vị trí mới; Hall/MPU vẫn chạy.

## 6. Test firmware sau nạp

Serial Node A: `a` ARM (bánh dừng, ngắt motor), `d` DISARM, `k` LOCK, `u` UNLOCK, `b` SIREN_ON, `s` SIREN_OFF, `r` reset phiên quay bánh. `2` chỉ bật còi thủ công, không ép trạng thái ALARM.

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

- [u-blox NEO-6 datasheet](https://content.u-blox.com/sites/default/files/products/documents/NEO-6_DataSheet_%28GPS.G6-HW-09005%29.pdf): thông số receiver NEO-6M.
- [TinyGPSPlus API](https://github.com/mikalhart/TinyGPSPlus/blob/master/src/TinyGPS%2B%2B.h): encode/isValid/isUpdated/age.
- [PubSubClient](https://github.com/knolleary/pubsubclient): buffer và publish MQTT.

`hardware/diagram.json` là sơ đồ mô phỏng Wokwi hai node minh họa; khi đấu mạch thật dùng bảng pinout trong hướng dẫn này và [SO-DO-DAU-NOI-PHAN-CUNG.md](../hardware/SO-DO-DAU-NOI-PHAN-CUNG.md).
