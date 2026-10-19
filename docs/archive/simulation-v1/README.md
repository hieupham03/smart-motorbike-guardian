# HƯỚNG DẪN MÔ PHỎNG TOÀN DIỆN TRÊN WOKWI (WOKWI SIMULATOR)
**Dự án:** Smart Motorbike Guardian — Hệ thống IoT Giám sát & An ninh Xe máy
**Mục đích:** Bộ giả lập chuẩn hóa giúp mọi thành viên trong nhóm có thể chạy thử, hiểu kiến trúc phần cứng và kiểm thử liên thông với Web Dashboard ngay trên trình duyệt mà không cần mạch thật.

---

## 1. CÁC FILE TRONG BỘ GIẢ LẬP
Thư mục `simulation/` bao gồm đầy đủ 3 tệp tin cần thiết:
1. **`diagram.json`**: Sơ đồ đấu nối phần cứng trực quan (ESP32 DevKit, MPU-6050, Nút Hall Pulse, Module Relay 5V, Đèn tải Motor DC, Còi Buzzer, Đèn LED trạng thái).
2. **`sketch.ino`**: Mã nguồn firmware tích hợp All-in-One với thuật toán ngã xe, bù trọng lực động, ràng buộc an toàn S-07, kết nối Wi-Fi & MQTT.
3. **`libraries.txt`**: Khai báo thư viện cần thiết (`PubSubClient`).

---

## 2. HƯỚNG DẪN CHẠY MÔ PHỎNG (TRONG 30 GIÂY)

1. Truy cập trang web: **[https://wokwi.com](https://wokwi.com)** $\rightarrow$ Chọn **ESP32** (Start from scratch).
2. Nhấp vào tab **`diagram.json`** ở thanh phía trên $\rightarrow$ Xóa hết và dán toàn bộ nội dung từ file [`simulation/diagram.json`](diagram.json).
3. Nhấp vào tab **`sketch.ino`** $\rightarrow$ Xóa hết và dán toàn bộ nội dung từ file [`simulation/sketch.ino`](sketch.ino).
4. Nhấp vào nút mũi tên nhỏ cạnh tên tab chọn **New File** $\rightarrow$ Đặt tên là **`libraries.txt`** $\rightarrow$ Nhập vào chữ:
   ```
   PubSubClient
   ```
5. Nhấp nút tròn màu xanh **Play ▶** (hoặc bấm `F1`) ở góc trên màn hình.

---

## 3. BẢNG 5 KỊCH BẢN KIỂM THỬ DÀNH CHO THÀNH VIÊN NHÓM

| Kịch bản | Thao tác thực hiện | Hiện tượng quan sát được | Ý nghĩa kỹ thuật |
|---|---|---|---|
| **Test 1: Đo vận tốc bánh xe** | Nhấp chuột liên tục vào nút xanh **`Hall Pulse`**. | Cột `Vận tốc` trên Serial Monitor tăng lên (ví dụ: `25.4 km/h`). Đồng hồ tốc độ trên Web Dashboard quay theo. | Kiểm thử ngắt phần cứng ISR đo chu vi bánh xe từ cảm biến Hall KY-003. |
| **Test 2: Ràng buộc an toàn S-07** | Nhấp nút Hall cho xe chạy $> 10\text{ km/h}$, sau đó vào Web Dashboard bấm **KHOÁ ĐỘNG CƠ**. | ESP32 in ra: `[TỪ CHỐI AN TOÀN S-07] Tốc độ xe > 0! Nghiêm cấm ngắt nguồn!`. Relay **KHÔNG** nhảy, Motor vẫn chạy. | Chứng minh tính năng an toàn sinh mạng cốt lõi: Không ngắt nguồn khi xe đang lưu thông. |
| **Test 3: Khoá xe khi đã dừng hẳn** | Ngừng bấm nút Hall cho xe về `0.0 km/h`, sau đó vào Web bấm **KHOÁ ĐỘNG CƠ**. | ESP32 in ra: `Relay đã NGẮT NGUỒN Motor DC!`. Rơ-le nhảy tách, đèn LED xanh lá tắt lịm, xe chuyển trạng thái `THEFT_LOCK`. | Ngắt nguồn động cơ chống trộm khi xe đỗ cố định. |
| **Test 4: Phát hiện ngã xe thông minh** | Nhấp chuột vào module **MPU-6050**, kéo thanh trượt góc nghiêng $> 50^\circ$. | Nếu xe đang dừng ($v \le 2\text{ km/h}$) hoặc nghiêng quá $2\text{s}$, hệ thống kích hoạt `FALL_DETECTED`, còi hú và đẩy cảnh báo đỏ lên Web. | Phân biệt ôm cua an toàn ($v > 5\text{ km/h}$, nghiêng tạm thời) với ngã xe thật. |
| **Test 5: Canh giữ chống trộm (ARMED)** | Trên Web Dashboard bấm nút **BẬT CANH GIỮ (ARM)**, sau đó chỉnh gia tốc MPU-6050 rung lắc. | Hệ thống lọc debounce 3 mẫu liên tiếp vượt $3.5\text{ m/s}^2 \rightarrow$ Phát hiện trộm (`MOTION_WHILE_ARMED`), còi hú to. | Bộ lọc rung lắc chống báo nhầm do gió giật, kèm cooldown 4 giây chống spam mạng. |

---

## 4. KẾT NỐI LIÊN THÔNG VỚI WEB DASHBOARD & BACKEND

Bộ mô phỏng Wokwi sử dụng mạng Wi-Fi ảo **`Wokwi-GUEST`** và đẩy dữ liệu trực tiếp tới MQTT Broker công cộng:
- **Broker:** `broker.emqx.io:1883`
- **Device UUID:** `550e8400-e29b-41d4-a716-446655440001`
- Khi Backend (`start-backend.bat`) và Frontend (`start-frontend.bat`) đang chạy trên máy tính của bạn, trang Web **`http://localhost:5173`** sẽ nhận tín hiệu thời gian thực từ Wokwi y hệt như đang cắm mạch thật 100%!
