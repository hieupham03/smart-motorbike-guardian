# ĐẶC TẢ KỸ THUẬT HỆ THỐNG (SYSTEM SPECIFICATION)
## DỰ ÁN: SMART MOTORBIKE GUARDIAN (IoT & REAL-TIME EMBEDDED SYSTEM)

> **Tên đề tài:** Hệ thống giám sát, cảnh báo chống trộm và điều khiển an toàn xe máy thông minh thời gian thực  
> **Kiến trúc:** Dual-Node Real-time Embedded System + FreeRTOS + MQTT IoT Cloud  
> **Phiên bản tài liệu:** v1.0.0  
> **Ngày cập nhật:** Tháng 09/2026  

---

## 📑 MỤC LỤC
1. [TỔNG QUAN HỆ THỐNG & BỐI CẢNH DỰ ÁN](#1-tổng-quan-hệ-thống--bối-cảnh-dự-án)
2. [KIẾN TRÚC TỔNG THỂ VÀ MÔ HÌNH PHÂN TẦNG](#2-kiến-trúc-tổng-thể-và-mô-hình-phân-tầng)
3. [ĐẶC TẢ PHẦN CỨNG & KẾT NỐI VẬT LÝ](#3-đặc-tả-phần-cứng--kết-nối-vật-lý)
4. [ĐẶC TẢ GIAO THỨC TRUYỀN THÔNG UART NHỊ PHÂN](#4-đặc-tả-giao-thức-truyền-thông-uart-nhị-phân)
5. [ĐẶC TẢ THIẾT KẾ NHÚNG FREERTOS & STATE MACHINE](#5-đặc-tả-thiết-kế-nhúng-freertos--state-machine)
6. [ĐẶC TẢ GIAO THỨC MQTT & CLOUD INTEGRATION](#6-đặc-tả-giao-thức-mqtt--cloud-integration)
7. [ĐẶC TẢ CƠ SỞ DỮ LIỆU & QUẢN TRỊ HỆ THỐNG](#7-đặc-tả-cơ-sở-dữ-liệu--quản-trị-hệ-thống)
8. [MA TRẬN TIẾN ĐỘ THỰC HIỆN (TASK-LIST A - G & DOD)](#8-ma-trận-tiến-độ-thực-hiện-task-list-a---g--dod)
9. [KẾ HOẠCH KIỂM THỬ VÀ TIÊU CHÍ ĐÁNH GIÁ](#9-kế-hoạch-kiểm-thử-và-tiêu-chí-đánh-giá)

---

# 1. TỔNG QUAN HỆ THỐNG & BỐI CẢNH DỰ ÁN

### 1.1. Đặt vấn đề
Xe máy là phương tiện di chuyển chủ yếu tại Việt Nam, tuy nhiên các thiết bị định vị/chống trộm truyền thống trên thị trường gặp phải nhiều hạn chế nghiêm trọng:
* **Nguy cơ mất an toàn khi can thiệp động cơ**: Nhiều thiết bị cho phép bấm nút tắt máy từ xa ngay cả khi xe đang chạy ở tốc độ cao trên quốc lộ, làm bó bánh, mất trợ lực lái, gây tai nạn chết người cho người điều khiển.
* **Treo hệ thống cục bộ khi mạng di động lag**: Thiết bị một vi điều khiển (Single-node) xử lý cả cảm biến và Wi-Fi/4G thường bị đơ chu kỳ lấy mẫu khi mạng bị ngắt quãng.
* **Báo động giả tràn lan**: Cảm biến rung thô sơ dễ bị kích hoạt bởi tiếng còi xe hoặc rung động môi trường nhẹ.

### 1.2. Mục tiêu giải pháp
Xây dựng hệ thống IoT hoàn chỉnh đạt chuẩn công nghiệp:
1. **Kiến trúc phân tầng 2 vi điều khiển (Dual-Node)**: Tách biệt hoàn toàn tầng đọc cảm biến thời gian thực (Node B) và tầng Gateway kết nối mạng/điều khiển an toàn (Node A).
2. **Ràng buộc an toàn tuyệt đối (Safety Invariant)**: Chỉ cho phép ngắt rơ-le đánh lửa/động cơ khi vận tốc xe $v \le 0.5\text{ km/h}$.
3. **Phát hiện sự cố tức thời**: Lọc động học gia tốc 3 trục để nhận diện rung lắc bẻ khóa, té ngã, va chạm và báo động tức thì dưới $300\text{ms}$.
4. **Quản trị toàn diện**: Đồng bộ dữ liệu lên MQTT Broker, lưu trữ Time-series Database và cung cấp giao diện Dashboard phân quyền.

---

# 2. KIẾN TRÚC TỔNG THỂ VÀ MÔ HÌNH PHÂN TẦNG

Hệ thống được thiết kế theo mô hình 5 lớp chuẩn IoT:

```
+-------------------------------------------------------------------------+
| LỚP 5: GIAO DIỆN & ỨNG DỤNG (Web Dashboard, Mobile Web, RBAC)           |
+-------------------------------------------------------------------------+
                                    ▲
                                    │ HTTPS / REST API & WebSockets (WSS)
                                    ▼
+-------------------------------------------------------------------------+
| LỚP 4: BACKEND & CƠ SỞ DỮ LIỆU (Node.js/FastAPI + PostgreSQL/Timescale)  |
| - MQTT Ingestion Engine  - Alert Push Service  - Device Lifecycle Mgmt  |
+-------------------------------------------------------------------------+
                                    ▲
                                    │ MQTT v3.1.1 (TCP/TLS + LWT)
                                    ▼
+-------------------------------------------------------------------------+
| LỚP 3: GATEWAY & SAFETY CONTROLLER (Node A - ESP32-WROOM-32D)           |
| - State Machine (PARKED/ARMED/ALARM/THEFT_LOCK)                         |
| - Safety Invariant Enforcer (Speed <= 0.5 km/h)                         |
| - Peripheral Control: Relay 5V, Buzzer, LED Onboard                     |
+-------------------------------------------------------------------------+
                                    ▲
                                    │ Non-blocking UART 115200 (Frame + XOR)
                                    ▼
+-------------------------------------------------------------------------+
| LỚP 2: SENSOR & EDGE COMPUTING (Node B - ESP32-S3)                      |
| - 20Hz Sampling Rate (FreeRTOS vTaskDelayUntil)                         |
| - Vector Dynamic Acceleration Processing: sqrt(ax^2 + ay^2 + (az-g)^2)   |
| - Wheel Speed Calculation from Hall Pulse Interrupts                    |
+-------------------------------------------------------------------------+
                                    ▲
                                    │ GPIO Interrupt / I2C Bus (100kHz)
                                    ▼
+-------------------------------------------------------------------------+
| LỚP 1: CẢM BIẾN & CƠ CẤU CHẤP HÀNH VẬT LÝ                              |
| - MPU-6050 (6-DoF IMU)      - Cảm biến Hall KY-003 + Nam châm          |
| - Động cơ DC TT + Bánh xe   - Module Relay 5V + Còi Active Buzzer 5V   |
+-------------------------------------------------------------------------+
```

---

# 3. ĐẶC TẢ PHẦN CỨNG & KẾT NỐI VẬT LÝ

### 3.1. Bảng phân bổ linh kiện (Bill of Materials - BOM)
| STT | Tên linh kiện | Chipset / Module | Thông số kỹ thuật | Vai trò trong hệ thống |
| :---: | :--- | :--- | :--- | :--- |
| 1 | **Node A (Gateway)** | ESP32-WROOM-32D | Dual-Core 240MHz, 520KB SRAM, Wi-Fi 2.4GHz | Quản lý an toàn, MQTT, điều khiển rơ-le, còi |
| 2 | **Node B (Sensor)** | ESP32-S3 DevKit | Dual-Core LX7 240MHz, 512KB SRAM, Vector ISA | Đọc cảm biến tần số cao, tính toán động học |
| 3 | **Cảm biến IMU** | MPU-6050 | 6-DoF ($\pm 4g$, I2C $100\text{kHz}$) | Đo gia tốc rung lắc, va chạm, nghiêng đổ xe |
| 4 | **Cảm biến vận tốc** | KY-003 | Cảm biến Hall hiệu ứng từ tính, Active LOW | Bắt xung nam châm quay trên bánh xe |
| 5 | **Cơ cấu chấp hành** | Module Relay 5V | Cách ly quang Optocoupler, tải 10A/250VAC | Cắt nguồn động lực mô phỏng CDI xe máy |
| 6 | **Cảnh báo âm thanh**| Active Buzzer 5V | $85\text{dB}$, điều khiển Digital Direct | Phát âm báo động theo nhịp trạng thái |
| 7 | **Hệ thống tải giả** | Động cơ DC TT | Điện áp 3-6V, tỉ số truyền 1:48 + Bánh xe | Mô phỏng chuyển động của xe và đĩa từ |
| 8 | **Module nguồn** | MB-102 | Ngõ vào 6.5-12V, ngõ ra 5V/3.3V DC (700mA) | Cấp nguồn động lực tách biệt |

### 3.2. Sơ đồ ma trận chân kết nối (Pinout Matrix)
```
NODE A (ESP32 Gateway)                 NODE B (ESP32-S3 Sensor Node)
----------------------                 -----------------------------
GPIO 16 (RX2) <----------------------- TX1 (GPIO 17) [UART 115200]
GPIO 17 (TX2) -----------------------> RX1 (GPIO 18) [UART 115200]
GPIO 23 ------> [Relay 5V IN]
GPIO 18 ------> [Buzzer 5V (+)]
GPIO 2  ------> [LED Onboard]
                                       GPIO 8  (SDA) <-> MPU-6050 SDA
                                       GPIO 9  (SCL) --> MPU-6050 SCL
                                       GPIO 4  (INT) <-- KY-003 OUT
GND ---------------------------------- GND (Nối chung toàn bộ hệ thống)
```

> **Nguyên tắc an toàn nguồn điện**: Khi cắm cáp USB máy tính để nạp code và debug, dây nguồn $5\text{V}$ giữa module MB-102 và cổng $5\text{V}$ trên vi điều khiển phải được ngắt rời; **chỉ duy nhất dây mass (GND) được nối chung** để tránh dòng ngược gây sụt áp hoặc cháy cổng USB.

---

# 4. ĐẶC TẢ GIAO THỨC TRUYỀN THÔNG UART NHỊ PHÂN

Giao thức được hiện thực tại file header dùng chung [`uart_protocol.h`](file:///d:/Firmware-IoT/firmware/node_a_gateway/uart_protocol.h).

### 4.1. Cấu trúc khung truyền (Frame Structure)
| Byte Offset | Trường | Kích thước | Giá trị | Mô tả |
| :---: | :--- | :---: | :---: | :--- |
| 0 | `START_BYTE` | 1 Byte | `0xAA` | Byte đồng bộ bắt đầu khung |
| 1 | `MSG_TYPE` | 1 Byte | `0x01` - `0x05` | Mã định danh loại bản tin |
| 2 | `PAYLOAD_LEN` | 1 Byte | $0 - 128$ | Độ dài dữ liệu thực tế |
| $3 \dots (N+2)$ | `DATA` | $N$ Bytes | Byte array | Payload dữ liệu nhị phân |
| $N+3$ | `CHECKSUM` | 1 Byte | $\text{XOR}$ | Checksum toàn vẹn |

$$\text{Checksum} = \text{MSG\_TYPE} \oplus \text{PAYLOAD\_LEN} \oplus \text{DATA}[0] \oplus \dots \oplus \text{DATA}[N-1]$$

### 4.2. Danh mục 5 loại bản tin chuẩn
1. **`MSG_TELEMETRY (0x01)`** ($16\text{ bytes}$):
   - `float speed` (4B): Tốc độ xe ($km/h$).
   - `float ax, ay, az` (12B): Gia tốc 3 trục ($m/s^2$).
   - `uint32_t timestamp` (4B): Mốc thời gian lấy mẫu ($ms$).
2. **`MSG_ACCEL_EVENT (0x02)`** ($9\text{ bytes}$):
   - `uint8_t event_type` (1B): Loại sự kiện (1: Rung chấn, 2: Nghiêng xe, 3: Va chạm).
   - `float value` (4B): Cường độ gia tốc cực đại ($m/s^2$).
   - `uint32_t timestamp` (4B): Thời gian xảy ra.
3. **`MSG_CMD_RELAY (0x03)`** ($2\text{ bytes}$):
   - `uint8_t state` (1B): `0` = Ngắt rơ-le (Power Cut), `1` = Cấp nguồn (Power On).
   - `uint8_t seq` (1B): Sequence ID chống lặp gói.
4. **`MSG_HEARTBEAT (0x04)`** ($6\text{ bytes}$):
   - `uint8_t state` (1B): Trạng thái xe hiện tại (`PARKED`, `ARMED`, `ALARM`, `THEFT_LOCK`).
   - `uint8_t seq` (1B): Số thứ tự nhịp tim tăng dần.
   - `uint32_t uptime` (4B): Thời gian hoạt động ($ms$).
5. **`MSG_NACK (0x05)`** ($2\text{ bytes}$):
   - `uint8_t err_code` (1B): `0x01` (Sai Checksum), `0x02` (Sai độ dài), `0x03` (Timeout), `0x04` (Sai Type).
   - `uint8_t bad_type` (1B): Loại gói tin gây lỗi.

---

# 5. ĐẶC TẢ THIẾT KẾ NHÚNG FREERTOS & STATE MACHINE

### 5.1. Phân bổ Task và Core trên Node B (Sensor Node - ESP32-S3)
* **`SensorTask` (Core 1, Priority 3, Chu kỳ 50ms / 20Hz)**:
  - Sử dụng `vTaskDelayUntil()` đảm bảo tần số lấy mẫu chuẩn xác.
  - Tính tốc độ từ ngắt Hall: $v = \frac{\Delta \text{pulse}}{\text{PULSES\_PER\_REV}} \times \text{CIRCUMFERENCE} \times \frac{1}{\Delta t} \times 3.6$.
  - Đọc I2C từ MPU-6050 (hệ số tỉ lệ $\frac{9.80665}{8192}$). Tự động quét lại I2C mỗi $3\text{s}$ nếu bị tuột dây.
  - Đóng gói struct đẩy vào `sensorQueue`.
* **`ProcessingTask` (Core 1, Priority 2, Hướng sự kiện - Event Driven)**:
  - Nhận dữ liệu từ `sensorQueue` (block vô hạn không tốn CPU).
  - Cập nhật `latestTelemetry` được bảo vệ bằng `telemMutex`.
  - Tính toán độ biến thiên vector gia tốc động:
    $$\Delta a = \sqrt{a_x^2 + a_y^2 + (a_z - 9.81)^2}$$
  - Nếu $\Delta a > 3.5\text{ m/s}^2$ $\rightarrow$ đẩy ngay gói tin khẩn cấp vào `eventQueue`.
* **`UARTTxRxTask` (Core 0, Priority 2)**:
  - Tách riêng I/O trên Core 0.
  - Ưu tiên bắn ngay lập tức các gói tin trong `eventQueue`.
  - Bắn định kỳ `MSG_TELEMETRY` ($500\text{ms}$) và `MSG_HEARTBEAT` ($1000\text{ms}$).
  - Bắt lỗi timeout mất kết nối Gateway sau $3\text{s}$.

### 5.2. Phân bổ Task và Máy trạng thái trên Node A (Gateway - ESP32-WROOM-32D)
* **Máy trạng thái 4 mức (FSM)**:
  ```
  [ STATE_PARKED ] <----------------------- (Lệnh DISARM) <----------------------+
         │                                                                       │
         │ (Lệnh ARM)                                                            │
         ▼                                                                       │
  [ STATE_ARMED ] ──────(Phát hiện rung lắc / Accel Event)──────> [ STATE_ALARM ]
                                                                       │
                                      +--------------------------------+
                                      │ (Sau 15s báo động)
                                      ▼
                      [ KIỂM TRA TỐC ĐỘ: v <= 0.5 km/h? ]
                                      │
                         ┌────────────┴────────────┐
                         │ YES                     │ NO (v > 0.5 km/h)
                         ▼                         ▼
               [ STATE_THEFT_LOCK ]      [ HOÃN NGẮT NGUỒN ]
               (Relay ngắt nguồn động cơ)  (Chờ đến khi v = 0)
  ```
* **Luật bất biến an toàn (Safety Invariant)**:
  > **Quy tắc**: Tuyệt đối không xuất tín hiệu ngắt Relay khi vận tốc $v > 0.5\text{ km/h}$ trong mọi trường hợp (kể cả khi nhận lệnh ngắt từ Cloud hoặc báo động hết giờ).
* **Phân bổ Task**:
  - `UARTRxTask` (Core 0, Priority 3): Đọc UART non-blocking, giải mã gói tin, cập nhật `sharedTelemetry` (Mutex).
  - `SafetyTask` (Core 1, Priority 3, Chu kỳ 100ms): Duyệt FSM và thực thi quy tắc an toàn.
  - `ControlTask` (Core 1, Priority 2): Nhận lệnh từ `controlQueue` xuất GPIO Relay, băm nhịp còi Buzzer và LED.
  - `MQTTTask` (Core 0, Priority 2, Stack 6144B): Quản lý Wi-Fi, MQTT Reconnect, LWT, gửi Telemetry/Alert, nhận Command.

---

# 6. ĐẶC TẢ GIAO THỨC MQTT & CLOUD INTEGRATION

### 6.1. Cấu trúc Topic MQTT chuẩn
Mã định danh thiết bị duy nhất: `DEVICE_ID = "550e8400-e29b-41d4-a716-446655440000"`

| Topic MQTT | Hướng truyền | QoS | Retain | Chu kỳ / Điều kiện kích hoạt |
| :--- | :---: | :---: | :---: | :--- |
| `guardian/<DEVICE_ID>/status` | ESP32 $\rightarrow$ Broker | 1 | `true` | Khi kết nối (Online) / Khi mất mạng đột ngột (LWT Offline) |
| `guardian/<DEVICE_ID>/telemetry` | ESP32 $\rightarrow$ Broker | 0 | `false`| Định kỳ mỗi $3\text{ giây}$ |
| `guardian/<DEVICE_ID>/alert` | ESP32 $\rightarrow$ Broker | 1 | `false`| Tức thời khi có sự kiện va chạm / rung lắc |
| `guardian/<DEVICE_ID>/heartbeat` | ESP32 $\rightarrow$ Broker | 0 | `false`| Định kỳ mỗi $15\text{ giây}$ |
| `guardian/<DEVICE_ID>/cmd/#` | Broker $\rightarrow$ ESP32 | 1 | `false`| Khi người dùng bấm nút trên Dashboard |
| `guardian/<DEVICE_ID>/cmd/ack` | ESP32 $\rightarrow$ Broker | 1 | `false`| Ngay sau khi ESP32 xử lý xong lệnh |

### 6.2. Cấu trúc định dạng Payload JSON
* **Telemetry**:
  ```json
  {
    "device_id": "550e8400-e29b-41d4-a716-446655440000",
    "ts": 1727220000,
    "speed_kmh": 28.50,
    "state": "PARKED",
    "accel": [0.12, -0.05, 9.82]
  }
  ```
* **Alert**:
  ```json
  {
    "device_id": "550e8400-e29b-41d4-a716-446655440000",
    "ts": 1727220015,
    "alert_id": "a1727220015",
    "reason": "IMPACT_OR_THEFT",
    "severity": "HIGH",
    "val": 5.42
  }
  ```
* **Command & ACK**:
  - Gửi lệnh: `{"cmd_id": "c_101", "cmd": "LOCK_ENGINE"}`
  - Phản hồi chấp nhận: `{"cmd_id": "c_101", "result": "EXECUTED", "ts": 1727220016, "reason_if_failed": null}`
  - Phản hồi từ chối an toàn: `{"cmd_id": "c_101", "result": "REJECTED", "ts": 1727220016, "reason_if_failed": "SPEED_NOT_ZERO"}`

---

# 7. ĐẶC TẢ CƠ SỞ DỮ LIỆU & QUẢN TRỊ HỆ THỐNG

### 7.1. Sơ đồ thực thể quan hệ (ERD) & Các bảng chính
Cơ sở dữ liệu: **PostgreSQL 15+ / TimescaleDB** ([`database/schema.sql`](file:///d:/Firmware-IoT/database/schema.sql))

```
 [ USERS ] (1) ──has──< (N) [ DEVICES ] (1) ──records──< (N) [ TELEMETRY ] (Time-series)
     │                           │
     │                           ├──has──< (N) [ ALERTS ]
     │                           │
     └──issued──< (N) [ COMMAND_HISTORY ]
```

1. **`users`**: `id (UUID)`, `username`, `email`, `password_hash` (bcrypt), `role` (`ADMIN`, `OPERATOR`, `VIEWER`), `is_active`.
2. **`devices`**: `id (UUID)`, `device_uid` (UNIQUE), `name`, `owner_id (FK)`, `license_plate`, `status` (`REGISTERED` $\rightarrow$ `PROVISIONED` $\rightarrow$ `ACTIVE` $\rightarrow$ `OFFLINE` $\rightarrow$ `DECOMMISSIONED`), `hardware_ver`, `firmware_ver`, `last_heartbeat`.
3. **`telemetry`**: `id (BIGSERIAL)`, `device_id (FK)`, `timestamp`, `speed_kmh`, `accel_x/y/z`, `vibration_level`, `theft_detected`, `relay_state`.
4. **`alerts`**: `id (UUID)`, `device_id (FK)`, `alert_type`, `severity` (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), `message`, `is_acknowledged`, `acknowledged_by`.
5. **`command_history`**: `id (UUID)`, `device_id (FK)`, `issued_by (FK)`, `command_type`, `status` (`EXECUTED`, `REJECTED_SAFETY`), `execution_result`.

---

# 8. MA TRẬN TIẾN ĐỘ THỰC HIỆN (TASK-LIST A - G & DOD)

| Giai đoạn | Tên Task | Nội dung thực hiện | Tiêu chí hoàn thành (DoD) | Trạng thái |
| :---: | :--- | :--- | :--- | :---: |
| **A** | Giao thức UART | Định nghĩa 5 struct bản tin, send_frame tính XOR checksum, FSM Parser timeout 50ms, Heartbeat 3s | 2 Node gửi nhận ổn định, tự khôi phục sau lỗi ngắt dây | **DONE (100%)** |
| **B** | Khung FreeRTOS | Phân chia Task đa nhiệm trên 2 Core, Queue + Mutex, Soak test theo dõi Free Heap RAM | Khung task chạy ổn định $\ge 30$ phút, không leak bộ nhớ | **DONE (100%)** |
| **C** | Tích hợp ngoại vi | Lắp MPU-6050 (I2C), Cảm biến Hall (Interrupt 10ms debounce), Relay 5V, Còi Buzzer | Từng khối phần cứng hoạt động chính xác độc lập | **DONE (100%)** |
| **D** | Ghép luồng Sensor | Node B đọc đồng thời Hall + MPU, lọc gia tốc động $\Delta a > 3.5$, gửi UART | Node B chạy hoàn toàn tự động, phát hiện rung chấn chính xác | **DONE (100%)** |
| **E** | Gateway State Machine | State Machine 4 mức, Ràng buộc an toàn chỉ ngắt rơ-le khi $v \le 0.5\text{ km/h}$, nháy LED/Còi | Vượt qua 7 bài test an toàn cục bộ | **DONE (100%)** |
| **F** | Fail-safe & Stress Test | Rút dây UART giữa chừng, giả lập lỗi sensor, kiểm tra bảo vệ tính mạng | Hệ thống sống sót qua mọi kịch bản lỗi, không bao giờ ngắt nhầm | **DONE (100%)** |
| **G** | Wi-Fi & MQTT Gateway | Tích hợp Wi-Fi reconnect, MQTT PubSubClient, LWT, gửi Telemetry/Alert, nhận Command & ACK | Kết nối Broker thành công, test qua MQTTX Web hoàn hảo | **DONE (100%)** |

---

# 9. KẾ HOẠCH KIỂM THỬ VÀ TIÊU CHÍ ĐÁNH GIÁ

### 9.1. Kiểm thử chức năng (Functional Testing)
1. **Kiểm thử phân quyền RBAC**: Tài khoản `VIEWER` chỉ xem được dashboard, khi cố tình gửi lệnh khóa xe sẽ bị API từ chối (`403 Forbidden`).
2. **Kiểm thử luồng Telemetry**: Khi quay bánh xe, chỉ số vận tốc và biểu đồ gia tốc trên Dashboard cập nhật mượt mà với chu kỳ $3\text{s}$.
3. **Kiểm thử rung lắc chống trộm**: Ở chế độ `ARMED`, khi gõ nhẹ vào MPU-6050, còi hú dồn dập, LED nháy nhanh và bản tin Alert lập tức xuất hiện trên màn hình.
4. **Kiểm thử Safety Invariant**: Gửi lệnh `LOCK_ENGINE` khi bánh xe đang quay $\rightarrow$ Hệ thống từ chối ngắt rơ-le, trả về mã lỗi `"SPEED_NOT_ZERO"`. Chỉ khi dừng bánh xe mới cho phép ngắt nguồn.
5. **Kiểm thử phát hiện Offline (LWT)**: Rút cáp nguồn của Node A $\rightarrow$ Trong vòng $5 - 10\text{s}$ Broker tự động phát bản tin `offline` lên topic status.

### 9.2. Tiêu chí phi chức năng (Non-Functional Benchmarks)
* **Độ trễ truyền cảnh báo (Alert Latency)**: $< 300\text{ms}$ từ thời điểm va chạm đến khi Broker nhận tin.
* **Thời gian phản hồi lệnh (Command Round-trip Time)**: $< 500\text{ms}$ từ lúc bấm nút đến khi nhận ACK.
* **Độ ổn định bộ nhớ (Memory Stability)**: Đo `esp_get_free_heap_size()` trong 24 giờ liên tục, dung lượng RAM khả dụng không bị suy giảm (Zero Memory Leak).
* **Tỷ lệ mất gói tin (Packet Loss Rate)**: $< 0.1\%$ trên đường truyền UART nội bộ.
