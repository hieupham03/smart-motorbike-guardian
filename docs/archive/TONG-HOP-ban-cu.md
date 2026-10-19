# TỔNG HỢP CÁC THAY ĐỔI & HƯỚNG DẪN VẬN HÀNH HỆ THỐNG
**Dự án:** Smart Motorbike Guardian — Hệ thống IoT Giám sát & An ninh Xe máy Hai lớp (ESP32 Dual-Node, Spring Boot, React, PostgreSQL)
**Thời gian cập nhật:** 10/2026

---

## 1. TỔNG QUAN HIỆN TRẠNG HỆ THỐNG

Hệ thống đã hoàn tất tích hợp và đồng bộ khép kín từ **Phần cứng Cảm biến vật lý (Node A & Node B)** $\rightarrow$ **MQTT Broker (EMQX)** $\rightarrow$ **Backend (Spring Boot 3.2.4)** $\rightarrow$ **Cơ sở dữ liệu (PostgreSQL 15)** $\rightarrow$ **Frontend Dashboard (React 18 + Vite)**:

- **100% Dữ liệu thực tế:** Đã ngắt hoàn toàn bộ giả lập ảo (`VirtualDeviceSimulatorService`). Toàn bộ góc nghiêng, gia tốc MPU6050, vận tốc bánh xe và cảnh báo an ninh hiển thị trên Web đều là tín hiệu đọc trực tiếp từ vi điều khiển thật.
- **Điều khiển hai chiều (Downlink/Uplink):** Bảng điều khiển tác vụ (Actuator Control) trên Web đã liên thông 2 chiều với ESP32 Node A qua giao thức MQTT với cơ chế phản hồi xác nhận (Command ACK).
- **Bộ đệm ngoại tuyến (Offline Ring Buffer):** Mạch ESP32 tích hợp bộ đệm 30 bản tin sự cố bảo vệ bằng FreeRTOS Mutex, đảm bảo không rơi rớt cảnh báo khi xe đi vào vùng mất sóng (đáp ứng tiêu chí NFR-05).

---

## 2. CHI TIẾT CÁC THAY ĐỔI KỸ THUẬT THEO TỪNG THÀNH PHẦN

### 2.1. Cơ sở dữ liệu (PostgreSQL 15 & Database Seed)
* **File:** `database/seed.sql` & container `guardian-postgres-db` (Port `5433:5432`)
* **Thay đổi:**
  - Sửa chuỗi hash BCrypt chuẩn (`$2a$10$...`) cho tài khoản `owner@guardian.iot` và `admin@guardian.iot`.
  - Mật khẩu đăng nhập mặc định: **`Password@123`**.
  - Liên kết quyền sở hữu xe mẫu Honda SH 150i ABS (`dev-550e8400-0001` / `550e8400-e29b-41d4-a716-446655440001`) cho chủ xe `usr-owner-001`.

### 2.2. Backend (Spring Boot 3.2.4)
* **Thư mục:** `backend/` & Docker container `guardian-backend` (Port `8088:8080`)
* **Thay đổi:**
  - **Đổi port ánh xạ bên ngoài:** `8088:8080` (tránh xung đột với tiến trình nền trên Windows chiếm cổng 8080).
  - **Tắt bộ giả lập:** Trong `VirtualDeviceSimulatorService.java`, đặt `simulationEnabled = false` để ngừng tạo dữ liệu ngẫu nhiên đè lên dữ liệu cảm biến thật.
  - **Chuẩn hóa Telemetry & Alert:** Trong `TelemetryService.java` và `AlertService.java`, hỗ trợ tra cứu thiết bị bằng cả `deviceId` (`dev-...`) lẫn `deviceUuid` (`550e84...`); chuẩn hóa timestamp Epoch thời gian thực.
  - **Bộ điều khiển lệnh (Command Service):** Cập nhật `CommandService.java` đẩy lệnh MQTT đồng thời tới cả 2 định dạng topic (UUID và dev-id); xử lý chuyển trạng thái xe khi nhận ACK: `ARM`, `DISARM`, `LOCK_ENGINE`, `UNLOCK_ENGINE`, `SIREN_ON`, `SIREN_OFF`.
  - **Docker Image:** Đã biên dịch lại mã nguồn và đóng gói bản build mới nhất vào image `guardian-backend:latest`.

### 2.3. Frontend Web Dashboard (React 18 + Vite)
* **Thư mục:** `frontend/` (Port `5173`)
* **Thay đổi:**
  - **Proxy cấu hình:** Cập nhật `frontend/vite.config.js` trỏ proxy `/api` và `/ws` chính xác về `http://localhost:8088`.
  - **Đồ thị MPU6050 (`AccelLiveChart.jsx`):** Đổi đơn vị hiển thị thành $\text{m/s}^2$ và thang đo Y-axis $[-12, 12]\ \text{m/s}^2$ để hiển thị trọn vẹn gia tốc trọng trường Trái Đất ($g \approx 9.8\ \text{m/s}^2$) mà không bị chạm trần đồ thị.
  - **Sắp xếp dòng dữ liệu (`DashboardPage.jsx`):** Tự động sắp xếp telemetry theo dòng thời gian tăng dần; các đồng hồ đo vận tốc và điện áp luôn lấy điểm dữ liệu mới nhất từ cảm biến vi điều khiển.
  - **Điều khiển tác vụ (`QuickControlPanel.jsx` & `DeviceContext.jsx`):** Thêm độ trễ phản hồi 600ms chờ ACK từ ESP32 trước khi làm mới giao diện, giúp nút bấm và nhãn trạng thái đổi màu tức thì.

### 2.4. Firmware Vi điều khiển (Node A Gateway & Node B Sensor)
* **Thư mục:** `firmware/node_a_gateway/` và `firmware/node_b_sensor/` (đồng bộ với `node_a/` và `node_b/`)
* **Thay đổi:**
  - **Đồng bộ UUID xe:** Gán `DEVICE_ID` = `"550e8400-e29b-41d4-a716-446655440001"`.
  - **Bộ đệm Offline Ring Buffer (NFR-05):** Cài đặt mảng vòng 30 phần tử trong RAM bảo vệ bằng Semaphore Mutex, tự động lưu gói tin khi mất kết nối mạng và xả bù (`flush_offline_messages`) ngay khi nối lại WiFi/MQTT.
  - **Lắng nghe song song 2 topic lệnh:**
    + `guardian/550e8400-e29b-41d4-a716-446655440001/cmd/#`
    + `guardian/dev-550e8400-0001/cmd/#`
  - **Hỗ trợ đủ 7 lệnh điều khiển thực tế:**
    1. `DISARM`: Chuyển sang `PARKED`, tắt còi báo động.
    2. `ARM`: Kích hoạt trạng thái canh giữ `ARMED`.
    3. `LOCK_ENGINE`: Kiểm tra ràng buộc an toàn (tốc độ $\le 0.5\ \text{km/h}$), ngắt rơ-le (GPIO23) và truyền UART lệnh ngắt xuống Node B.
    4. `UNLOCK_ENGINE`: Đóng lại rơ-le xe, chuyển về `PARKED`.
    5. `SIREN_ON`: Kích hoạt còi hú báo động (GPIO18).
    6. `SIREN_OFF`: Tắt còi hú.
    7. `REBOOT`: Gửi phản hồi ACK rồi gọi `ESP.restart()`.

---

## 3. CẤU TRÚC THƯ MỤC DỰ ÁN SAU KHI DỌN DẸP

```
Firmware-IoT/
│
├── 📜 start-database.bat              # Script 1: Khởi động PostgreSQL 15 & pgAdmin qua Docker
├── 📜 start-backend.bat               # Script 2: Khởi động Spring Boot Backend (Port 8088)
├── 📜 start-frontend.bat              # Script 3: Khởi động React Web Dashboard (Port 5173)
├── 📜 TONG-HOP-THAY-DOI-VA-HUONG-DAN-VAN-HANH.md # File báo cáo tổng hợp này
├── 📜 BAO-CAO-DO-AN-IoT-Motorbike-Guardian.md    # Thuyết minh kỹ thuật đồ án chi tiết
│
├── 📁 database/                       # Quản lý Cơ sở dữ liệu
│   ├── docker-compose.yml             # Cấu hình container Postgres (5433) & pgAdmin (5050)
│   ├── schema.sql                     # Khởi tạo 6 bảng chính
│   └── seed.sql                       # Dữ liệu ban đầu (User, Devices, Role)
│
├── 📁 backend/                        # Mã nguồn Spring Boot Backend (Java 17)
│   ├── Dockerfile                     # Multi-stage build image Docker
│   ├── pom.xml                        # Maven dependencies
│   └── src/main/java/com/guardian/    # Controllers, Services, DTOs, Entities, Mqtt
│
├── 📁 frontend/                       # Mã nguồn Giao diện Web (React 18 + Vite)
│   ├── vite.config.js                 # Cấu hình Proxy chuyển tiếp API tới port 8088
│   ├── package.json                   # Thư viện React, Lucide, Recharts, Leaflet
│   └── src/                           # Components, Pages, Context, Services
│
├── 📁 firmware/                       # Mã nguồn vi điều khiển ESP32
│   ├── 📁 node_a_gateway/             # Node A: ESP32-WROOM (WiFi, MQTT, UART Gateway)
│   │   ├── node_a_gateway.ino         # File sketch chính của Node A
│   │   └── uart_protocol.h            # Header định dạng gói tin UART Framing
│   └── 📁 node_b_sensor/              # Node B: ESP32-S3 (MPU6050, Hall, ADC, Relay)
│       ├── node_b_sensor.ino          # File sketch chính của Node B
│       └── uart_protocol.h            # Header định dạng gói tin UART Framing
│
├── 📁 node_a/ & 📁 node_b/            # Thư mục phụ đồng bộ cho Arduino IDE mở trực tiếp
└── 📁 docs/ & 📁 hardware/            # Tài liệu thiết kế & sơ đồ nguyên lý phần cứng
```

---

## 4. HƯỚNG DẪN VẬN HÀNH NHANH (QUICK START)

### Bước 1: Khởi động Cơ sở dữ liệu
Nhấp đúp chuột chạy:
```cmd
start-database.bat
```
*(Chạy PostgreSQL tại cổng `5433` và pgAdmin tại cổng `5050`)*

### Bước 2: Khởi động Backend
Nhấp đúp chuột chạy:
```cmd
start-backend.bat
```
*(Backend kết nối trực tiếp PostgreSQL và MQTT Broker công cộng `broker.emqx.io:1883` tại cổng `8088`)*

### Bước 3: Khởi động Frontend
Nhấp đúp chuột chạy:
```cmd
start-frontend.bat
```
*(Web Dashboard sẽ mở tại địa chỉ `http://localhost:5173`)*

### Bước 4: Đăng nhập & Vận hành
1. Mở trình duyệt truy cập: **`http://localhost:5173`**
2. Đăng nhập với tài khoản Chủ xe:
   - **Email:** `owner@guardian.iot`
   - **Mật khẩu:** `Password@123`
3. Nạp code Node A ([firmware/node_a_gateway/node_a_gateway.ino](file:///d:/Firmware-IoT/firmware/node_a_gateway/node_a_gateway.ino)) và Node B qua Arduino IDE.
4. Trải nghiệm hệ thống:
   - Lắc nhẹ mạch để thấy MPU6050 cập nhật đồ thị thời gian thực và sinh cảnh báo rung lắc (`MOTION_WHILE_ARMED`).
   - Bấm các nút tác vụ trên **BẢNG ĐIỀU KHIỂN TÁC VỤ** để bật/tắt còi, ngắt/mở relay nguồn xe trực tiếp từ trình duyệt.

---

## 5. PHÂN TÍCH CHUYÊN SÂU & GIẢI QUYẾT TRIỆT ĐỂ CÁC VẤN ĐỀ THỰC TẾ (CRITICAL FIXES & UPGRADES)

Dưới đây là bảng phân tích kỹ thuật và giải pháp chi tiết giải quyết toàn diện 6 điểm yếu thiết kế và định hướng 3 tính năng nâng cao:

### 5.1. Khắc phục triệt để 6 điểm yếu thiết kế

#### 1. Lỗi góc nghiêng $45^\circ$ báo nhầm khi ôm cua (Cornering vs. Real Fall)
- **Vấn đề thực tế:** Xe máy khi vào cua tốc độ cao có thể nghiêng $30^\circ - 45^\circ$ một cách hoàn toàn bình thường do lực ly tâm cân bằng với trọng lực. Nếu chỉ đặt ngưỡng nghiêng đơn lẻ $> 45^\circ$, xe đang chạy bình thường sẽ liên tục kích hoạt báo động ngã xe giả (False Positive).
- **Giải pháp tối ưu đã cài đặt trong firmware Node B:**
  Áp dụng **Thuật toán nhận diện ngã xe đa biến (Multi-condition Fall Detection)**:
  1. *Ngưỡng góc nghiêng:* Nâng lên $\theta_{\text{fall}} > 50.0^\circ$.
  2. *Điều kiện tai nạn thực tế (Xe dừng khựng):* Góc nghiêng $> 50^\circ$ **KÈM THEO** vận tốc tụt về $v \le 2.0\ \text{km/h}$ (xe bị dừng đột ngột sau va chạm) duy trì trong $500\text{ms}$.
  3. *Điều kiện đổ xe tại chỗ / bất động:* Góc nghiêng $> 50^\circ$ **DUY TRÌ LIÊN TỤC** $> 2.0\text{ giây}$ (khi ôm cua thì thời gian nghiêng cực đại chỉ kéo dài $0.5 - 1.5\text{s}$ rồi trả thẳng lái).
  4. Nếu xe nghiêng trong lúc $v > 5.0\ \text{km/h}$ và thời gian $< 2.0\text{s}$, hệ thống nhận diện là **Ôm cua an toàn (Cornering)** và tuyệt đối không báo động.

#### 2. Debounce & Cooldown cho Dynamic Acceleration
- **Vấn đề thực tế:** Nếu chỉ 1 mẫu đơn lẻ vượt ngưỡng $a_{\text{dynamic}} > 3.5\ \text{m/s}^2$ đã kích hoạt alarm ngay, hệ thống sẽ bị báo động giả liên tục bởi các tác động môi trường vô hại (gió giật mạnh, xe tải chạy ngang rung mặt đất, chó mèo chạm vào xe). Đồng thời, nếu rung lắc kéo dài sẽ sinh ra hàng chục bản tin cảnh báo/giây làm tắc nghẽn mạng (Spam Alert).
- **Giải pháp tối ưu đã cài đặt trong firmware Node B:**
  1. *Bộ lọc Debounce tích luỹ:* Yêu cầu tối thiểu **3 mẫu liên tiếp** ($3 \times 50\text{ms} = 150\text{ms}$) đều phải vượt ngưỡng $3.5\ \text{m/s}^2$ mới xác nhận rung lắc hợp lệ.
  2. *Bộ đếm Cooldown:* Sau khi phát tín hiệu cảnh báo, đặt thời gian làm nguội **4.0 giây**. Trong suốt 4 giây này, mọi dao động thứ cấp sẽ không kích hoạt thêm sự kiện cảnh báo trùng lặp, triệt tiêu hoàn toàn hiện tượng flood bản tin MQTT.

#### 3. Chuẩn hóa thuật ngữ bảo mật: "Step-up Re-authentication" thay vì "2FA"
- **Vấn đề học thuật:** Tính năng yêu cầu nhập lại mật khẩu khi bấm `LOCK_ENGINE` sử dụng cùng một yếu tố xác thực (Knowledge Factor: Mật khẩu người dùng đã đăng nhập). Nếu gọi là "Xác thực 2 lớp / 2FA", sinh viên sẽ bị giảng viên phản biện bắt bẻ ngay lập tức vì hiểu sai khái niệm Two-Factor Authentication (cần 2 yếu tố độc lập: Biết - Sở hữu - Sinh trắc).
- **Giải pháp:**
  - Chuẩn hóa tên gọi chính xác trên Giao diện Web, Modal và Báo cáo thuyết minh: **"Xác thực bước nâng cao (Step-up Re-authentication)"**.
  - Cơ chế này có giá trị thực tế cao: Bảo vệ người dùng khỏi việc cấn túi màn hình điện thoại hoặc người khác mượn máy bấm nhầm lệnh nguy hiểm.
  - Định hướng nâng cấp lên True 2FA: Tích hợp mã OTP 6 số qua Telegram Bot hoặc TOTP Authenticator (Google Authenticator / Authy).

#### 4. Áp dụng ràng buộc an toàn S-07 cho lệnh REBOOT
- **Vấn đề an toàn:** Khi vi điều khiển Gateway ESP32 nhận lệnh `REBOOT` và thực hiện khởi động lại (`ESP.restart()`), các chân GPIO (bao gồm GPIO23 điều khiển relay ngắt nguồn) sẽ bị thả nổi (High-Z) hoặc đưa về trạng thái mặc định trong vài trăm mili-giây. Điều này có thể khiến rơ-le ngắt nguồn đột ngột tương đương với lệnh `LOCK_ENGINE`, gây nguy hiểm đến tính mạng người lái xe nếu xe đang chạy trên đường.
- **Giải pháp đã cài đặt trong firmware Node A:**
  - Cài đặt chốt an toàn S-07 cho cả `LOCK_ENGINE` và `REBOOT`:
    ```cpp
    if (spd <= 0.5f) {
        // Tốc độ = 0 km/h: An toàn, cho phép restart
        ESP.restart();
    } else {
        // Xe đang lăn bánh: Từ chối ngay lập tức tại biên phần cứng!
        isExecuted = false;
        reasonIfFailed = "SPEED_NOT_ZERO";
    }
    ```

#### 5. Xử lý trường hợp GPS mất tín hiệu (No Fix / Tầng hầm / Trong nhà)
- **Vấn đề thực tế:** Trong bãi gửi xe tầng hầm, nhà ga hoặc ngõ hẹp, sóng vệ tinh GPS không thể xuyên qua bê tông, dẫn đến việc module NEO-6M mất fix toạ độ.
- **Giải pháp:**
  - *Cơ chế Vị trí cuối cùng đã biết (Last Known Location):* Khi GPS mất tín hiệu hoặc trả về dữ liệu null/0.0, Backend và Database duy trì toạ độ hợp lệ gần nhất ghi nhận trước khi xe vào hầm (`device.last_latitude`, `device.last_longitude`).
  - *Giao diện Web minh bạch:* Cung cấp nhãn trạng thái trực quan:
    + Khi có sóng: `● 3D FIX (6+ Vệ tinh, Độ chính xác ±2.5m)`.
    + Khi mất sóng: `⚠️ Mất sóng GPS / Hầm xe — Đang hiển thị vị trí cuối (Last Known Location)`.

#### 6. Làm rõ chính sách Circular Ring Buffer 30 slots khi đầy
- **Chính sách:** Sử dụng mô hình **Circular FIFO with Overwrite-Oldest (Ghi đè bản ghi cũ nhất)**.
- **Phân tích Đánh đổi Kỹ thuật (Trade-off):**
  - Trong tình huống mất mạng kéo dài (xe gửi trong hầm nhiều giờ không có Wi-Fi), nếu bộ nhớ đệm 30 slots đầy:
    + *Nếu từ chối bản tin mới (Reject Newest):* Hệ thống sẽ chỉ giữ lại các rung lắc lúc mới vào hầm, nhưng nếu kẻ gian bẻ khoá hoặc dắt xe đi ở phút cuối cùng thì dữ liệu quan trọng nhất lại bị vứt bỏ!
    + *Chọn ghi đè bản tin cũ nhất (Overwrite Oldest):* Luôn bảo toàn 30 sự kiện gần nhất với thời điểm hiện tại, giúp chủ xe và công an nắm bắt được chính xác diễn biến và hành vi cuối cùng của phương tiện ngay khi xe ra khỏi hầm có mạng trở lại.
  - Dung lượng 30 slots là sự cân bằng tối ưu giữa việc bảo toàn dữ liệu sự cố và tiết kiệm dung lượng RAM tĩnh trên ESP32.

---

### 5.2. Đánh giá tính khả thi 3 tính năng nâng cao đề xuất

1. **Hàng rào địa lý (Geofencing):**
   - *Hiện trạng:* Frontend đã vẽ vòng tròn an ninh Geofence $R = 80\text{m}$ quanh vị trí xe.
   - *Logic mở rộng:* Backend kiểm tra công thức Haversine giữa toạ độ hiện tại và toạ độ lúc xe chuyển sang trạng thái `ARMED`. Nếu khoảng cách $> 80\text{m}$ mà xe vẫn đang ở chế độ `ARMED` $\rightarrow$ Tự động kích hoạt còi báo động và đẩy thông báo khẩn cấp "Xe bị dắt ra khỏi khu vực gửi".
2. **Lịch sử chuyến đi (Trip Log):**
   - *Cơ sở dữ liệu:* Bảng `telemetry_reading` đã lưu đầy đủ `timestamp`, `speed`, `latitude`, `longitude`.
   - *Logic phân đoạn:* Một chuyến đi bắt đầu khi $v > 3.0\ \text{km/h}$ liên tục trong $> 30\text{s}$ và kết thúc khi $v = 0$ duy trì $> 3\text{ phút}$.
3. **Cơ chế Cooldown báo động:**
   - Đã cài đặt hoàn chỉnh ở cả cấp độ Firmware (Node B giữ còi/sự kiện 4s - 5s) và Backend Alert Service, đảm bảo tính ổn định và chống nghẽn đường truyền.
