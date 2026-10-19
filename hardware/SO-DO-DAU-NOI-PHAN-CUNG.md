# Đấu nối breadboard — firmware v2

Tắt nguồn trước khi đổi dây. Đối chiếu số GPIO in trên board, không dùng số thứ tự chân header. Hướng dẫn nạp/test: [hardware/firmware v2](../docs/HUONG-DAN-HARDWARE-FIRMWARE-V2-GPS.md).

## UART và cảm biến

| Từ | Đến | Ghi chú |
|---|---|---|
| Node A GPIO17 TX | Node B GPIO18 RX | UART115200 |
| Node B GPIO17 TX | Node A GPIO16 RX | UART115200 |
| GND Node A | GND Node B | Chung tham chiếu |
| MPU SDA/SCL | Node B GPIO8/GPIO9 | I2C, breakout phù hợp3.3V |
| MPU VCC/GND | Node B3V3/GND | Chỉ khi breakout hỗ trợ |
| Hall OUT | Node B GPIO4 | FALLING/INPUT_PULLUP, tín hiệu không vượt3.3V |
| Hall VCC/GND | Nguồn phù hợp/GND | Không mặc định OUT5V an toàn cho ESP32 |
| GPS TX | Node B GPIO6 RX2 |9600baud |
| GPS VCC/GND | Nguồn breakout/GND | Chỉ cấp5V nếu breakout hỗ trợ, tên receiver chưa đủ |
| GPS RX/PPS | Để hở | GPIO7 đã cấu hình TX2 nhưng chưa cần dùng |

## Relay, motor và nguồn hiện tại

Hai node dùng hai cáp USB laptop. Nhánh motor dùng adapter qua MB102 theo đúng định mức đã xác minh; không dùng MB102 cấp chung cả hệ thống.

```text
USB laptop → Node A
USB laptop → Node B

Adapter → jack DC MB102 → đầu ra đã chọn 5V → COM relay
                                                  NO → Motor (+)
                               GND MB102 ←─────────── Motor (−)
```

| Chân relay | Nối đến |
|---|---|
| VCC | Nguồn5V đúng module; nếu lấy MB102 phải tính thêm dòng cuộn relay |
| GND | GND điều khiển Node A; MB102 nối chung GND trong cấu hình này |
| IN | GPIO23 Node A, module phải nhận logic3.3V |
| COM | Dương nguồn motor đúng điện áp |
| NO | Motor (+) |
| NC | Để trống |

Jumper chọn LOW khớp RELAY_ACTIVE_LOW=true. Boot mặc định motorOFF; UNLOCK/ARM/DISARM có thể cấp lại theo code. PARKED không xác nhận tiếp điểm đang cấp motor.

Không cấp thẳng12V cho motorTT3–6V, cảm biến hoặc chân5V board. Chỉ dùng adapter12V ở jackMB102 nếu đúng giới hạn/cực tính của module. Hạ12V bằng ổn áp tuyến tính có thể nóng, sụt áp/ngắt nhiệt; sơ đồ không xác nhận MB102 đủ dòng motor. Nếu không có dụng cụ đo, giữ nguyên cấu hình đã chạy và chưa đánh dấu kiểm chứng nguồn.

Đường dương5V MB102 KHÔNG nối với chân5V hai node đang dùng USB. GND chung để điều khiển; dây hồi motor đi riêng về GND nguồn, không qua boardESP32. Nếu chuyển board sang nguồn ngoài phải ngắt đường5V ngoài trước khi cắm USB, trừ khi mạch chống cấp ngược đã được xác minh.

## Buzzer, LED, tụ và diode

- LED onboard Node A GPIO2. Không thêm LEDGPIO19 theo sơ đồ cũ.
- GPIO18 Node A điều khiển buzzer. Buzzer5V hai chân dùng transistor/driver; không lấy dòng tải trực tiếp từGPIO.
- Tụ gốm104 có thể đặt sát hai cực motor. Tụ hóa470–1000µF từ10V trở lên đặt trên nhánh5V, đúng cực; không đặt tụ10V trên nhánh12V.
- Diode phù hợp dòng motor quay một chiều: vạch cathode về motor(+), anode về motor(−). Không áp dụng cách này cho motor đảo chiều.
- Tụ không thay nguồn đủ dòng. Kiểm tra sụt áp/reset khi khởi động motor và relay trước khi chốt demo.

hardware/diagram.json chỉ là Wokwi hai node trướcGPS, chưa mô phỏng đầy đủ nguồn/driver. Nó không thay ảnh mạch thật hoặc phép đo nguồn.
