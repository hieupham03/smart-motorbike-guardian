# Quy trình tích hợp GPS NEO-6M-0-001 vào Smart Motorbike Guardian

**Mục tiêu:** thêm vị trí GPS vào telemetry của hệ thống hai node hiện có và hiển thị tọa độ trên dashboard/map. Hướng dẫn hướng tới demo breadboard; không yêu cầu cloud sản xuất hay đấu nối xe thật.

## 1. Luồng dữ liệu cần đạt

```text
NEO-6M UART/NMEA
    → ESP32-S3 Node B (parse, kiểm tra fix và độ mới)
    → UART framing Node B ↔ ESP32-WROOM Node A
    → MQTT telemetry từ Node A
    → MqttSubscriberService / TelemetryService
    → PostgreSQL (telemetry_readings + devices.last_latitude/longitude)
    → Dashboard / bản đồ
```

Backend đã đọc các trường `latitude` và `longitude` trong telemetry MQTT; `TelemetryService` cập nhật vị trí gần nhất của device và ghi tọa độ của reading. Vì vậy, phần cần sửa chính nằm ở Node B, hợp đồng UART dùng chung, Node A và phần hiển thị trạng thái/freshness ở frontend.

## 2. Trước khi đấu dây: xác định chính xác board/module

`NEO-6M-0-001` là tên biến thể receiver u-blox; module bán trên thị trường có thể là **module trần** hoặc được hàn trên **breakout board**. Chân `VCC` trên breakout không mặc định có cùng yêu cầu điện áp với chân nguồn của module trần.

1. Chụp ảnh mặt trên/dưới module và đọc nhãn chân: `VCC`, `GND`, `TX`, `RX`, `PPS`, `V_BCKP` (tên có thể khác).
2. Xác định có regulator/level shifting trên breakout hay không bằng tài liệu của đúng nhà bán/board hoặc sơ đồ PCB. Không chỉ dựa vào hình dáng module.
3. Nếu là module trần, cấp nguồn theo datasheet NEO-6 (nguồn module khoảng 2.7–3.6 V); không đưa 5 V vào chân nguồn module trần.
4. Nếu là breakout ghi rõ hỗ trợ 5 V, cấp theo thông số của breakout. Kiểm tra điện áp chân TX của GPS bằng datasheet/đồng hồ trước khi nối vào ESP32-S3: GPIO ESP32 là logic 3.3 V, không chịu được tín hiệu 5 V.
5. Nếu chưa xác định được mạch breakout hoặc mức logic, **chưa nối nguồn/tín hiệu**; chụp ảnh rõ hai mặt và tra đúng pinout trước.

> Để giảm rủi ro, không nối `GPS RX` ở bước đầu. Chỉ cấp nguồn và nối `GPS TX → ESP32 RX` cùng GND để đọc NMEA một chiều.

## 3. Pinout đề xuất trên Node B

Trong firmware Node B hiện tại:

- UART1 GPIO17 (TX) và GPIO18 (RX) đang dành cho đường UART giữa Node B và Node A.
- I2C MPU6050 dùng GPIO8 (SDA), GPIO9 (SCL).
- Hall sensor dùng GPIO4.

Do đó **không dùng lại các chân trên cho GPS**. Có thể thử UART2 trên một cặp chân đang trống, ví dụ:

| GPS breakout | ESP32-S3 Node B | Ghi chú |
|---|---|---|
| `VCC` | Nguồn theo đúng phiên bản module/board | Xem mục 2; không mặc định là 5 V. |
| `GND` | `GND` | Bắt buộc nối mass chung. |
| `TX` | `GPIO6` (GPS UART RX phía ESP32) | NMEA đi từ GPS sang ESP32. |
| `RX` | `GPIO7` (GPS UART TX phía ESP32), **để hở ban đầu** | Chỉ nối nếu cần cấu hình module; mức logic phải phù hợp. |
| `PPS` | Để hở | Không cần cho demo vị trí cơ bản. |

GPIO6/7 chỉ là **gợi ý**: đối chiếu sơ đồ đúng model ESP32-S3 đang dùng, kiểm tra không bị board/peripheral khác chiếm. Không chọn chân USB, chân strap, chân flash/PSRAM hoặc pin không được đưa ra header. GPS UART mặc định thường là 9600 baud, 8-N-1; xác nhận thực tế từ dòng NMEA/board trước khi cố định cấu hình.

## 4. Pha 1 — Kiểm tra GPS độc lập, chưa đụng giao thức hai node

### 4.1. Lắp trên breadboard

1. Tắt nguồn cả hai ESP32.
2. Lắp GPS trên breadboard, kiểm tra đúng hàng chân để không chập VCC-GND.
3. Nối GPS TX vào GPIO6 của Node B; nối GND chung; cấp nguồn đúng theo mục 2.
4. Chưa nối GPS TX vào GPIO17/18: đó là UART Node B ↔ Node A.
5. Dùng Serial Monitor để quan sát log; trên ESP32-S3 giữ cổng USB/Serial debug đang dùng cho IDE.

### 4.2. Thử UART thô

Tạo sketch thử nhỏ hoặc nhánh thử trong firmware để khởi tạo UART thứ hai. Ví dụ cấu hình để **chỉ đọc**:

```cpp
#include <HardwareSerial.h>

HardwareSerial GpsSerial(2);
constexpr int GPS_RX_PIN = 6;
constexpr int GPS_TX_PIN = 7;  // chưa nối vào GPS RX ở lần thử đầu
constexpr uint32_t GPS_BAUD = 9600;

void setup() {
    Serial.begin(115200);
    GpsSerial.begin(GPS_BAUD, SERIAL_8N1, GPS_RX_PIN, GPS_TX_PIN);
}

void loop() {
    while (GpsSerial.available() > 0) {
        Serial.write(GpsSerial.read());
    }
}
```

Nếu board/core không hỗ trợ `HardwareSerial(2)` theo cách này, kiểm tra phiên bản Arduino-ESP32 và sơ đồ board; không chuyển GPS sang UART1 đang dùng cho Node A. Mục tiêu của pha này là thấy các dòng NMEA dạng `$G...` liên tục, không phải đã có tọa độ hợp lệ.

### 4.3. Thử điều kiện bắt vệ tinh

- Đặt antenna mặt gốm hướng lên trời, ở ngoài trời thoáng; tránh mái tôn, cửa kính phủ kim loại, dây nguồn motor và nguồn nhiễu.
- Cold start có thể mất vài phút; đợi đủ lâu và quan sát chỉ báo fix/số vệ tinh thay vì kết luận hỏng sau vài giây.
- Trong nhà, NMEA vẫn có thể xuất hiện nhưng chưa chắc có vị trí fix. Không dùng dòng tọa độ cũ/sample để kết luận GPS đã định vị.
- Lưu log Serial, ghi thời gian khởi động đến fix lần đầu và điều kiện thử.

**Gate 1 đạt khi:** đọc được chuỗi NMEA ổn định; parser độc lập nhận tọa độ hợp lệ ngoài trời; trạng thái no-fix không trả về tọa độ rác (0,0).

## 5. Pha 2 — Parse NMEA và giữ trạng thái GPS có freshness

Khuyến nghị dùng thư viện **TinyGPSPlus** qua Library Manager của Arduino IDE. Thư viện giải mã NMEA thành latitude, longitude, date/time, altitude, speed/course và các metadata; nó không tự đảm bảo fix hợp lệ — firmware vẫn phải kiểm tra trạng thái và tuổi dữ liệu.

Thiết kế trạng thái tối thiểu:

- `gps_valid`: đã có tọa độ hợp lệ và dữ liệu chưa quá cũ.
- `latitude`, `longitude`: vị trí lần fix hợp lệ gần nhất.
- `gps_age_ms` hoặc `last_fix_ms`: tuổi của tọa độ để phát hiện stale.
- Tùy chọn: số vệ tinh và HDOP để minh họa chất lượng fix, nếu parser/module có cung cấp.

Nguyên tắc xử lý:

1. Liên tục đọc byte GPS và đưa từng byte vào parser; tránh `delay()` dài hoặc đọc theo dòng chặn làm đói task cảm biến/UART.
2. Chỉ cập nhật tọa độ khi parser báo location valid, tọa độ nằm trong phạm vi latitude [-90, 90], longitude [-180, 180] và dữ liệu vừa được cập nhật.
3. Khi chưa có fix/mất fix, giữ vị trí hợp lệ cuối cùng trong RAM nhưng đặt `gps_valid=false`/cập nhật freshness. Không ghi đè bằng (0,0).
4. GPS phát bản tin chậm hơn MPU/Hall; nên giữ GPS state riêng có mutex hoặc snapshot nhất quán thay vì buộc mọi mẫu cảm biến 50 ms chờ GPS.
5. Log rõ `GPS_NO_FIX`, `GPS_FIX`, `GPS_STALE`, số vệ tinh/HDOP nếu có. Tránh in toàn bộ NMEA liên tục trong bản demo cuối vì log có thể làm nhiễu quan sát.
6. Đặt tốc độ UART theo output module thực tế. Nếu không thấy ký tự NMEA, thử baud cấu hình khác theo hướng dẫn board, kiểm tra chéo TX/RX, GND và nguồn trước khi sửa parser.

**Gate 2 đạt khi:** đặt antenna ngoài trời cho tọa độ hợp lý; che/đưa vào trong nhà khiến trạng thái chuyển sang no-fix/stale mà firmware không phát tọa độ giả.

## 6. Pha 3 — Mở rộng hợp đồng UART Node B ↔ Node A

### 6.1. Cập nhật kiểu dữ liệu

`TelemetryData` đang mang speed, acceleration và timestamp trong [uart_protocol.h](../firmware/node_b_sensor/uart_protocol.h). Thêm vị trí và cờ fix, ví dụ:

```cpp
struct TelemetryData {
    float speed;
    float ax, ay, az;
    uint32_t timestamp;
    float latitude;
    float longitude;
    uint8_t gps_valid;
};
```

Đây là minh họa hợp đồng, cần cập nhật **cả hai** `uart_protocol.h` cùng lúc. Với `#pragma pack(1)`, payload thay đổi kích thước; hai node lệch version sẽ không còn tương thích. Không gửi `double` chỉ để tăng vẻ chính xác nếu backend/map đang dùng độ chính xác GPS phổ thông; `float` đủ cho demo.

### 6.2. Chuyển dữ liệu qua các task

1. Bổ sung GPS snapshot vào `latestTelemetry` của Node B, cập nhật dưới cùng mutex hoặc một cơ chế snapshot rõ ràng.
2. Khi Node B gửi `MSG_TELEMETRY`, copy snapshot có GPS và `gps_valid` vào payload.
3. Node A kiểm tra `rxPacket.len == sizeof(TelemetryData)` như hiện tại; sau đó copy vị trí và cờ validity vào shared telemetry.
4. Đồng bộ header trong `firmware/node_a_gateway/`, `firmware/node_b_sensor/`, `node_a/` và `node_b/`. Các mirror hiện giống nhau; sau sửa cần so sánh để không nạp nhầm bản cũ.
5. Không gọi tọa độ last-known là fix hiện tại: cờ validity/freshness phải đi cùng payload.

### 6.3. Kiểm tra UART

- Xác nhận telemetry vẫn được giải mã sau khi payload tăng kích thước.
- Ghi `sizeof(TelemetryData)` trên cả hai node và xác nhận hai giá trị bằng nhau.
- Thử checksum đúng/sai, gói thiếu byte và restart một node.
- Đảm bảo `MAX_PAYLOAD_LEN` vẫn lớn hơn payload mới (hiện đang là 128 bytes).
- Ghi version giao thức trong báo cáo/changelog nếu nhóm không có trường version trong frame.

**Gate 3 đạt khi:** cả hai node dùng cùng struct, UART vẫn truyền speed/accel bình thường và GPS fix đi tới Node A; gói lỗi không làm parser ghi vượt buffer.

## 7. Pha 4 — Đưa GPS lên MQTT và lưu ở backend

Node A hiện tạo telemetry JSON mỗi 3 giây. Chỉ thêm `latitude` và `longitude` khi `gps_valid` còn mới; có thể thêm `gps_valid`, `gps_age_ms`, `satellites`/`hdop` nếu nhóm muốn hiển thị chất lượng fix.

Ví dụ payload minh họa:

```json
{
  "device_id": "550e8400-e29b-41d4-a716-446655440001",
  "ts": 123456,
  "speed_kmh": 0,
  "state": "PARKED",
  "latitude": 21.0285,
  "longitude": 105.8544,
  "gps_valid": true,
  "gps_age_ms": 800
}
```

Quy tắc:

1. Giá trị `ts` hiện tại trong firmware được tạo từ `millis()/1000`, tức **uptime**, không phải Unix epoch. Backend hiện thay timestamp nhỏ bằng thời gian server nhận. Giữ hành vi này hoặc chuyển rõ ràng sang epoch; không gắn uptime thành “GPS UTC”.
2. `TelemetryService` đã nhận `latitude`/`longitude`, cập nhật last location của device và ghi reading. Kiểm tra lại DB sau khi publish để xác nhận đúng device UUID đã map vào thiết bị.
3. Nếu `gps_valid=false`, không publish tọa độ rỗng/0,0 như vị trí mới. Có thể bỏ hai trường tọa độ trong JSON để backend giữ last-known; publish cờ `gps_valid=false` để UI biết fix hiện tại không còn.
4. Tọa độ seed trong database hiện là dữ liệu mẫu; cần xóa/thay hoặc gắn nhãn DEMO trước khi tuyên bố tọa độ hiển thị là GPS thật.
5. Không bắt buộc thêm bảng GPS riêng. `telemetry_readings.latitude/longitude` đã có sẵn và đủ cho quy mô đồ án.

**Gate 4 đạt khi:** log MQTT có tọa độ hợp lệ; một reading mới trong PostgreSQL mang cùng tọa độ; `devices.last_latitude/longitude` cập nhật; khi mất fix, DB không bị ghi đè thành 0,0.

## 8. Pha 5 — Hiển thị trên dashboard và bản đồ

Dashboard hiện vẽ bản đồ từ `selectedDevice.lastLatitude`/`lastLongitude`; việc đó cho phép hiển thị vị trí cuối cùng đã lưu nhưng chưa chứng minh độ mới của vị trí.

Tối thiểu nên làm:

1. Giữ marker tại last-known location hợp lệ.
2. Hiển thị badge trạng thái `GPS FIX`, `NO FIX` hoặc `LAST KNOWN / STALE`, kèm thời gian cập nhật cuối.
3. Phân biệt tọa độ khởi tạo/seed với tọa độ GPS nhận từ hardware. Nếu chưa có fix sau khi cài DB mẫu, không trình bày marker seed như vị trí thực của board.
4. Kiểm tra bản đồ cập nhật sau khi backend nhận telemetry mới; hiện frontend polling device list/history nên có thể trễ theo chu kỳ polling, không cần gọi là “instant”.
5. Có trạng thái lỗi/không có tọa độ thay cho nhảy về tọa độ mặc định.

**Gate 5 đạt khi:** vị trí thực thay đổi trên bản đồ sau fix mới, còn mất GPS hiển thị last-known/stale thay vì vị trí giả.

## 9. Bảng test nghiệm thu NEO-6M

| ID | Thao tác | Kết quả mong đợi | Evidence cần lưu |
|---|---|---|---|
| GPS-01 | Khởi động ngoài trời, quan sát UART thô | Nhận NMEA ổn định ở baud đã xác nhận | Ảnh đấu dây + log Serial |
| GPS-02 | Chờ receiver có fix | Parser báo valid, tọa độ nằm trong phạm vi địa lý hợp lệ | Log fix, thời gian từ boot đến fix |
| GPS-03 | Chạy toàn luồng end-to-end | Tọa độ Node B → UART → MQTT → DB → dashboard | MQTT payload, DB row, ảnh map |
| GPS-04 | Đưa receiver vào nơi không có tầm nhìn trời/ngắt antenna theo cách an toàn | No-fix/stale; tọa độ cũ không bị thay bằng 0,0 | Log trạng thái + DB trước/sau |
| GPS-05 | Khởi động lại receiver/node | Sau khi có fix lại, luồng phục hồi; cảm biến khác vẫn chạy | Log UART/telemetry |
| GPS-06 | Gửi payload tọa độ ngoài phạm vi trong test backend | Backend từ chối hoặc không lưu tọa độ bất hợp lệ | API/log/test result |

Ghi kết quả thực tế, không chỉ chép expected. GPS cần thử ngoài trời; chạy test trong phòng không đủ để kết luận receiver hỏng.

## 10. Thứ tự làm việc khuyến nghị

1. **Xác định model breakout/điện áp và pinout.**
2. **Đọc NMEA bằng UART độc lập** trên Node B.
3. **Parse và kiểm tra fix/freshness**; hoàn tất GPS-01/GPS-02.
4. **Mở rộng `TelemetryData`** và đồng bộ cả hai node/header mirror.
5. **Chuyển qua MQTT**, xác nhận JSON rồi kiểm tra DB.
6. **Cập nhật dashboard** để thể hiện fix/no-fix/last-known.
7. **Chạy lại test GPS-01 đến GPS-06**, cập nhật sơ đồ phần cứng và báo cáo.

Đừng làm đồng thời cả parser, UART frame, backend và UI ngay từ đầu. Chốt từng gate để khi lỗi xuất hiện biết nó nằm ở nguồn/antenna, UART GPS, parser, UART liên node, MQTT, backend hay bản đồ.

## 11. Lỗi thường gặp và cách khoanh vùng

| Triệu chứng | Kiểm tra theo thứ tự |
|---|---|
| Không thấy byte nào | Nguồn/GND, TX GPS sang RX ESP32, đúng GPIO UART2, baud, cáp/jumper và pinout. |
| Ký tự rác | Baud/parity/stop bit, mức logic và dây dài/nhiễu. |
| Có NMEA nhưng chưa có tọa độ | Ra ngoài trời, mặt antenna hướng lên, chờ fix; kiểm tra parser cập nhật byte đều. |
| Tọa độ luôn (0,0) | Chỉ đọc khi location valid; kiểm tra không thay giá trị null bằng 0 trong firmware/backend/UI. |
| Node A báo sai kích thước frame | Header hai node chưa đồng bộ hoặc một board đang chạy firmware build cũ. |
| MQTT có tọa độ nhưng DB/map không đổi | Device ID/UUID trong topic, field JSON, mapping UUID-device ID, device DTO và chu kỳ refresh UI. |
| Tọa độ cũ vẫn xuất hiện | Có thể là last-known/seed. Hiển thị freshness; đừng xóa vị trí cũ nếu không muốn mất last-known, nhưng phải đánh dấu stale. |

## 12. Nguồn tham khảo

- [u-blox NEO-6 Data Sheet](https://content.u-blox.com/sites/default/files/products/documents/NEO-6_DataSheet_%28GPS.G6-HW-09005%29.pdf) — thông số receiver; breakout board vẫn phải kiểm tra riêng.
- [TinyGPSPlus trên GitHub](https://github.com/mikalhart/TinyGPSPlus) — parser NMEA cho Arduino; xử lý validity/freshness vẫn thuộc firmware dự án.
- [Firmware Node B hiện tại](../firmware/node_b_sensor/node_b_sensor.ino)
- [Firmware Node A hiện tại](../firmware/node_a_gateway/node_a_gateway.ino)
- [Giao thức UART hiện tại](../firmware/node_b_sensor/uart_protocol.h)
- [Schema database hiện tại](../database/schema.sql)

## 13. Bổ sung ngày 08/10/2026: checklist ngày đầu và hợp đồng GPS hoàn chỉnh

### 13.1. Mục tiêu hôm nay

Module mới về hôm nay: mục tiêu vừa sức là xác nhận nguồn/pinout, thấy NMEA và có một fix thật ngoài trời. Chưa cần sửa đồng thời firmware hai node, DB và app.

| Bước | Thực hiện | Điều kiện hoàn tất |
|---|---|---|
| 1 | Ghi model breakout, ảnh hai mặt, điện áp cấp và GPIO thực tế | Không nhầm điện áp module trần với breakout |
| 2 | Sketch UART đọc riêng; GPS TX sang Node B RX; GPS RX/PPS để hở | Thấy dòng NMEA có đầu $G... |
| 3 | Parse bằng TinyGPSPlus, log tọa độ/age và số byte đã nhận | Phân biệt có byte, có câu hợp lệ và có vị trí hợp lệ |
| 4 | Thử ngoài trời; ghi thời gian boot đến fix và điều kiện thử | Tọa độ hợp lý, không phải seed |
| 5 | Đưa vào nơi tín hiệu kém hoặc ngắt dữ liệu GPS có kiểm soát | Chuyển stale theo timeout; không tạo tọa độ giả |

Ngắt đường TX GPS kiểm tra mất dữ liệu UART, không thay thế thử mất fix vô tuyến khi UART vẫn phát NMEA. Trước khi thay dây, tắt nguồn rồi khởi động lại theo kịch bản thử phù hợp. Không yêu cầu GPS di chuyển vài mét phải luôn thấy marker đổi rõ: độ nhiễu vị trí có thể che chuyển động nhỏ.

### 13.2. Freshness qua toàn bộ đường truyền

**Thiếu sót cần bổ sung ở bước backend:** hiện MqttSubscriberService và TelemetryDto chỉ nhận tọa độ; chưa xử lý gps_valid/gps_age_ms. Chỉ publish thêm hai trường này không làm frontend tự có trạng thái fix/stale.

Hợp đồng tối thiểu đề xuất:

| Trường | Ý nghĩa | Nơi cần cập nhật |
|---|---|---|
| latitude, longitude | Tọa độ lần fix hợp lệ gần nhất | GPS snapshot, UART, MQTT, DTO, reading/device |
| gps_valid | Vị trí còn mới theo chính sách timeout của dự án | UART, MQTT, ingestion, DB/DTO, app |
| gps_age_ms | Tuổi vị trí khi tạo snapshot/publish | UART, MQTT, ingestion/DTO; lưu khi cần tra cứu |
| last_gps_fix_at | Thời điểm vị trí hợp lệ cuối cùng theo quy ước server | Device/DTO; UI tính stale kể cả khi gateway mất mạng |
| data_source | HARDWARE hoặc SIMULATED/DEMO | Backend/DTO và app nếu cùng hệ thống chứa nhiều nguồn |

satellites và hdop là phần nâng cao tùy chọn. Không bắt buộc tạo bảng GPS riêng; thêm cột vào telemetry/device nếu cần lịch sử trạng thái. Khi gps_valid=false, không cập nhật last_gps_fix_at và không ghi tọa độ seed như fix mới. Reading giữ last-known phải đi kèm trạng thái không còn fix.

Chọn timeout khởi đầu, ví dụ 5 giây nếu GPS đã xác nhận phát vị trí khoảng mỗi giây; đây là tham số thử nghiệm, không phải tiêu chuẩn receiver. Node A cộng thời gian đã giữ snapshot vào gps_age_ms khi publish; khi UART Node B stale thì gps_valid cũng phải false. Frontend tính thêm thời gian từ lúc nhận để marker không giữ nhãn FIX mãi khi cả gateway mất mạng.

TinyGPSPlus cung cấp isValid/isUpdated/age; isValid đơn lẻ không chứng minh vị trí còn mới hoặc receiver hiện vẫn có fix. Tách biến đã từng có vị trí khỏi biến vị trí hiện còn mới; nếu muốn báo mất fix ngay khi NMEA vẫn tới, cần theo dõi chỉ báo fix của câu NMEA thay vì chỉ chờ age vượt ngưỡng. Xem [API trong mã nguồn TinyGPSPlus](https://github.com/mikalhart/TinyGPSPlus/blob/master/src/TinyGPS%2B%2B.h). Đọc cờ isUpdated trước khi truy cập giá trị vì accessor có thể xóa cờ updated.

### 13.3. UART và MQTT sau khi thêm GPS

Struct ở mục 6.1 chỉ là minh họa; nên thêm uint32_t gps_age_ms nếu cần chuyển freshness. Với packing 1, payload cũ 20 byte; thêm hai float và uint8_t gps_valid là 29 byte; thêm uint32_t gps_age_ms là 33 byte. Đặt static_assert theo struct đã chọn và ghi sizeof ở cả hai node. Không thay struct trên một node rồi để node còn lại chạy bản cũ.

Node B nên có một task GPS đọc byte và giữ snapshot; SensorTask không chờ fix. Không cho nhiều task cùng đọc GpsSerial. GPS chỉ cung cấp vị trí, không thay tốc độ Hall trong điều khiển relay. GPS không có fix vẫn phải cho Hall/MPU/UART hoạt động bình thường.

Node A hiện dùng PubSubClient nhưng chưa thấy setBufferSize. Khi thêm tọa độ/metadata, kiểm tra giới hạn packet của phiên bản thư viện thực tế, tính cả topic và overhead; có thể chọn buffer 512 hoặc 768 byte sau khi tính payload. Kiểm tra kết quả setBufferSize, snprintf và publish; buffer JSON lớn không đồng nghĩa MQTT packet đủ lớn. Không tuyên bố QoS 1 chỉ vì helper có tham số qos nếu đường publish thực tế không dùng mức đó.

### 13.4. Bổ sung nghiệm thu sau tích hợp

| ID | Thử nghiệm | Kết quả cần quan sát |
|---|---|---|
| GPS-07 | Node B đã fix, sau đó UART B-A không còn telemetry | Node A/app chuyển stale, không coi tọa độ cũ là mới |
| GPS-08 | Tọa độ không có hoặc bằng 0 ở một trục | UI kiểm tra validity/range; không dùng toán tử OR để thay tọa độ hợp lệ bằng vị trí mặc định |
| GPS-09 | GPS chưa fix nhưng Hall/MPU vẫn hoạt động | Không chặn task, có số đo khác và heartbeat bình thường |
| GPS-10 | JSON đầy đủ GPS và metadata | Publish thành công, DB/DTO/app có cùng dữ liệu, không cắt cụt |
| GPS-11 | Tắt gateway sau khi app hiển thị FIX | App chuyển offline/stale theo thời gian, last-known giữ nguyên |

Thêm cột Actual, Pass/Fail, thời điểm và file evidence khi nhóm thực hiện. Không đánh dấu đạt trước khi đo. Ngày đầu chỉ cần GPS-01/GPS-02 và thử freshness độc lập; các ca còn lại thực hiện khi đã ghép đủ tầng.

## 14. Firmware GPS v2 đã bắt đầu triển khai ngày 08/10/2026

Đã thêm GpsTask/TinyGPSPlus trên Node B và GPS qua UART v2 39 byte đến Node A/MQTT. Chân RX GPS GPIO6, TX GPIO7 (RX module để hở ban đầu), 9600 baud. ESP32-S3 là N16R8; relay chọn được HIGH/LOW, cấu hình mặc định LOW. Hai node phải nạp cùng firmware v2. Các đoạn struct và hiện trạng ở phần trước là kế hoạch/bản cũ, không phải cấu hình mới nhất.

Xem [hướng dẫn hardware/firmware v2](./HUONG-DAN-HARDWARE-FIRMWARE-V2-GPS.md) để biết đấu dây, chọn board, log, lệnh Serial và bảng test. Metadata GPS đã có trong MQTT nhưng backend/app chưa sửa ở bước này. Chưa xác nhận fix và tiếp điểm relay bằng mạch thật.
