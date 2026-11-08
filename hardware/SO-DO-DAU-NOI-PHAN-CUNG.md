# Đấu nối breadboard — firmware v2

Tắt nguồn trước khi đổi dây. Đối chiếu số GPIO in trên board, không dùng số thứ tự chân header. Hướng dẫn nạp/test: [hardware/firmware v2](../docs/HUONG-DAN-HARDWARE-FIRMWARE-V2-GPS.md).

Cập nhật 20/10/2026: người phụ trách xác nhận S3/MPU đã hoạt động lại và relay/motor/nguồn đã ổn. Đây là xác nhận vận hành của người dùng, không phải số đo điện áp/dòng hoặc kết quả chạy lâu mới.

**Bổ sung 21/10:** đã thêm cảnh báo bánh quay khi ARMED, phiên RAM và cảnh báo quá tốc độ. Không đổi chân/thêm linh kiện; cần nạp lại cả hai node. Xem [cách dùng và thử ba tính năng](../docs/BA-TINH-NANG-HALL-VA-TOC-DO.md).

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

Bánh xe đường kính **6,5 cm**, chu vi tính theo `pi × 0,065 ≈ 0,20420352 m`. Config của hai node dùng `WHEEL_CIRCUMFERENCE_M` tương ứng. Giữ `WHEEL_PULSES_PER_REV=1` theo cấu hình hiện tại; nếu có nhiều nam châm/xung mỗi vòng thì phải đổi tham số này. Đường kính đã biết chưa thay việc đối chiếu tốc độ thực tế sau nạp.

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

Jumper chọn **HIGH** khớp `RELAY_ACTIVE_LOW=false` trên Node A. `RELAY_POWER_ON_AT_BOOT=true` cấp motor sau khởi tạo. **ARM chỉ nhận khi bánh đã dừng và dữ liệu mới, sau đó ngắt motor để canh giữ**; LOCK cũng ngắt khi thỏa interlock. UNLOCK/DISARM cấp motor trở lại. PARKED là trạng thái an ninh, không xác nhận tiếp điểm đang cấp motor. Config relay trong Node B không điều khiển relay Node A. Cảnh báo quá tốc độ chỉ gửi sự kiện, không đóng/ngắt relay.

Không cấp thẳng12V cho motorTT3–6V, cảm biến hoặc chân5V board. Chỉ dùng adapter12V ở jackMB102 nếu đúng giới hạn/cực tính của module. Hạ12V bằng ổn áp tuyến tính có thể nóng, sụt áp/ngắt nhiệt; sơ đồ không xác nhận MB102 đủ dòng motor. Nếu không có dụng cụ đo, giữ nguyên cấu hình đã chạy và chưa đánh dấu kiểm chứng nguồn.

Đường dương5V MB102 KHÔNG nối với chân5V hai node đang dùng USB. GND chung để điều khiển; dây hồi motor đi riêng về GND nguồn, không qua boardESP32. Nếu chuyển board sang nguồn ngoài phải ngắt đường5V ngoài trước khi cắm USB, trừ khi mạch chống cấp ngược đã được xác minh.

## Buzzer, LED, tụ và diode

- LED onboard Node A GPIO2. Không thêm LEDGPIO19 theo sơ đồ cũ.
- GPIO18 Node A điều khiển buzzer. Buzzer5V hai chân dùng transistor/driver; không lấy dòng tải trực tiếp từGPIO.
- Tụ gốm104 có thể đặt sát hai cực motor. Tụ hóa470–1000µF từ10V trở lên đặt trên nhánh5V, đúng cực; không đặt tụ10V trên nhánh12V.
- Diode phù hợp dòng motor quay một chiều: vạch cathode về motor(+), anode về motor(−). Không áp dụng cách này cho motor đảo chiều.
- Tụ không thay nguồn đủ dòng. Kiểm tra sụt áp/reset khi khởi động motor và relay trước khi chốt demo.

hardware/diagram.json chỉ là Wokwi hai node trướcGPS, chưa mô phỏng đầy đủ nguồn/driver. Nó không thay ảnh mạch thật hoặc phép đo nguồn.
