# Cảnh báo bánh quay, thống kê phiên và cảnh báo tốc độ

Triển khai 20–21/10/2026 trên bản local. Giữ nguyên phần cứng và relay HIGH; không kéo bản backend/mobile mới từ GitHub. Người dùng chọn thống kê RAM theo phiên, không lưu lịch sử phiên vào database.

## 1. Hành vi mới

| Tính năng | Điều kiện và kết quả |
|---|---|
| Bánh quay khi canh giữ | Trong ARMED, ít nhất 3 xung Hall hợp lệ trong cửa sổ 3 giây → `WHEEL_MOVEMENT_WHILE_ARMED`, chuyển ALARM. Một sự kiện Hall mỗi lần canh giữ; không phụ thuộc MPU/GPS. |
| Phiên quay bánh | Đếm xung từ mẫu đầu tiên Node A quan sát của phiên; tính số vòng/quãng đường, tốc độ lớn nhất và thời gian có xung ước lượng. Reset bằng Serial `r` trên Node A hoặc nút trên web. |
| Vượt tốc độ | Tốc độ hợp lệ lớn hơn 2 km/h ít nhất 2 giây mẫu liên tục → `SPEED_LIMIT_EXCEEDED`. Chỉ cảnh báo, không đổi state hoặc đóng/ngắt relay. |

**ARM đã thay đổi:** chỉ nhận khi dữ liệu Hall/counter còn mới, tốc độ hợp lệ và bánh không có xung ít nhất 4 giây. Khi nhận ARM, Node A ngắt motor để motor không tự gây cảnh báo. DISARM/UNLOCK cấp motor trở lại. Vẫn giữ cấu hình cấp motor sau boot `RELAY_POWER_ON_AT_BOOT=true`.

Overspeed gửi một lần trong mỗi đợt vượt ngưỡng. Phải giảm xuống ≤1,5 km/h liên tục 2 giây mẫu để phục hồi và cho phép cảnh báo đợt mới. Mất dữ liệu hoặc mẫu không hợp lệ không được tính vào thời gian xác nhận. Reset thống kê không xóa trạng thái phát hiện để tránh gửi lặp.

## 2. Tham số và cách tính

Trong `firmware/node_a_gateway/guardian_config.h`:

```cpp
constexpr float WHEEL_CIRCUMFERENCE_M=0.20420352f;
constexpr uint32_t WHEEL_PULSES_PER_REV=1;
constexpr uint32_t WHEEL_GUARD_MIN_PULSES=3, WHEEL_GUARD_WINDOW_MS=3000;
constexpr float OVERSPEED_LIMIT_KMH=2.0f, OVERSPEED_HYSTERESIS_KMH=0.5f;
constexpr uint32_t OVERSPEED_HOLD_MS=2000, OVERSPEED_CLEAR_MS=2000;
```

- Bánh 6,5 cm có chu vi `pi × 0,065 ≈ 0,20420352 m`; giữ giả định 1 xung/vòng. Đổi số nam châm thì sửa `WHEEL_PULSES_PER_REV` trong config của cả hai node chuẩn.
- `quãng đường = số xung × chu vi / số xung mỗi vòng`. 10 xung ≈2,042 m, 100 xung ≈20,420 m.
- Đây là quãng đường quy đổi từ bánh quay, không phải quãng đường GPS. Mô hình nằm yên trên bàn vẫn đếm.
- Thời gian có xung là tổng các khoảng lấy mẫu có tăng bộ đếm, bỏ khoảng gián đoạn dài; không phải thời gian chuyển động đo chính xác.
- Nếu motor không đạt 2 km/h, đặt ngưỡng thử thấp hơn tốc độ đo được; ngưỡng phải lớn hơn hysteresis và lớn hơn 0. Không tăng điện áp quá định mức motor để đạt ngưỡng. Nạp lại Node A sau khi đổi ngưỡng.

## 3. Hợp đồng tích hợp

```text
Hall → ISR Node B → UART counter → WheelActivityMonitor Node A
                                  ├→ ALARM khi canh giữ
                                  ├→ MQTT alert → DB → WebSocket → web
                                  └→ MQTT wheel_session → RAM backend → REST/WebSocket → web
```

- Telemetry UART v2 vẫn **39 byte**. Thêm `MSG_WHEEL_SAMPLE=0x06`, payload **13 byte**: version=1, boot_id, pulse_count, timestamp. Node B gửi mỗi 500 ms cùng chu kỳ telemetry. Header/parser ở hai node chuẩn được đồng bộ.
- Bộ đếm tích lũy bù được xung qua gói bỏ lỡ. Khoảng gián đoạn dài vẫn có thể bù quãng đường, nhưng không coi toàn bộ xung cũ là một đợt dắt xe mới. Mẫu cũ/counter nhảy bất hợp lý bị từ chối.
- Node B đổi boot ID khi khởi động lại; Node A tự mở phiên mới. Node A khởi động lại cũng mở phiên mới. Xung trước mẫu counter đầu tiên được quan sát không thuộc phiên mới.
- Topic `guardian/<device_uuid>/wheel_session`, QoS0, không retain/offline buffer. Gồm session_id/sequence, pulse_count, revolutions, distance_m, max_speed_kmh, moving_ms, elapsed_ms, fresh, overspeed_active và tham số quy đổi.
- REST `GET /api/devices/<device_id>/wheel-session` kiểm tra quyền đọc. WebSocket `WHEEL_SESSION` trên `/user/queue/events` chỉ tới người có quyền.
- Backend giữ snapshot mới nhất trong RAM; khởi động lại backend thì chờ bản tin Node A mới để phục hồi. Không thêm migration, không chạm migration push của thành viên khác.
- Alert lưu theo luồng `/alert` sẵn có; overspeed mang `action_taken=WARNING_ONLY`.

Reset từ MQTT: publish retain OFF vào `guardian/<device_uuid>/cmd/reset_wheel_session`:

```json
{"cmd_id":"wheel-reset-01","type":"RESET_WHEEL_SESSION"}
```

Mỗi lần reset thật dùng cmd_id mới. Lệnh trùng trong cửa sổ cache chỉ nhận lại ACK cũ. Owner/Admin gửi được, Viewer chỉ xem. HTTP nhận lệnh là PENDING; ACK EXECUTED mới xác nhận Node A reset. Counter cũ/thiếu → REJECTED/WHEEL_DATA_STALE. Phiên không áp dụng cho SIMULATED.

## 4. Nạp và thử mạch

1. Nạp `firmware/node_b_sensor/node_b_sensor.ino` cho S3, sau đó `firmware/node_a_gateway/node_a_gateway.ino` cho Node A. Phải nạp cả hai; không dùng sketch `gps_bringup` khi chạy hệ thống.
2. Serial Node A 115200: chờ telemetry/heartbeat mới, xem `[WHEEL SESSION]` mỗi khoảng 3 giây. Đếm bắt đầu sau mẫu counter đầu tiên, không tính thời gian Node B quay trước khi Node A nhận mẫu đầu.
3. Cho bánh quay: pulses/distance tăng, max không giảm trong phiên. Quay chậm 10 vòng, nếu 1 xung/vòng thì quãng đường tăng khoảng 2,042 m.
4. Gõ `r` trên Node A khi dữ liệu mới: đổi ID phiên, pulses/distance về 0 rồi tiếp tục cộng. Gửi lại cùng cmd_id MQTT không được reset thêm lần nữa.
5. Thử quá tốc độ trong PARKED: vượt ngưỡng đủ lâu có `[OVERSPEED] ... WARNING ONLY` và alert `SPEED_LIMIT_EXCEEDED`; relay/state phải giữ nguyên. Không đạt ngưỡng thì chỉnh ngưỡng thử, không dùng relay để điều tốc.
6. Thử canh giữ: tắt nhánh motor bằng công tắc nguồn hiện có, giữ USB hai node. Đợi bánh dừng trên 4 giây, gõ `a`: ARMED và relay ngắt. Bật lại nguồn nhánh motor thì bánh vẫn không tự chạy qua relay đang ngắt.
7. Giữ MPU yên, quay bánh tay ít nhất 3 vòng trong 3 giây (1 xung/vòng). Mong đợi `[WHEEL GUARD]`, ALARM và `WHEEL_MOVEMENT_WHILE_ARMED`. Không cần GPS FIX. `d`/`u` về PARKED và cấp motor trở lại.
8. ARM khi bánh đang quay phải REJECTED/SPEED_NOT_ZERO, relay không đổi. Mất UART/counter cũ thì ARM/reset phiên bị từ chối, không coi thiếu dữ liệu là đứng yên.

## 5. Web và bàn giao mobile

- Chạy backend/web local như README, cùng broker/device UUID với Node A. Chọn HARDWARE, xem khung **PHIÊN QUAY BÁNH** và ngưỡng do firmware gửi, không dùng ngưỡng simulator 80 km/h.
- Owner/Admin bấm **Bắt đầu phiên mới**: PENDING → ACK terminal → snapshot mới. Viewer bị chặn cả UI và backend. Dữ liệu cũ giữ thống kê cuối và khóa reset; reload phục hồi snapshot nếu backend còn chạy.
- Trang cảnh báo có nhãn **Bánh quay khi đang canh giữ**, **Vượt ngưỡng tốc độ**. Lưu log/ảnh/video thật sau khi thử.
- Mobile mới chưa kéo về local. Thành viên mobile dùng REST/sự kiện/lệnh mục 3; push dùng luồng alert khi tích hợp bản mobile. Chưa coi native app/push đã thử thật.

## 6. Trạng thái nghiệm thu

[Bằng chứng phần mềm](evidence/wheel-features-2026-10-20/README.md) và [trạng thái công việc](CAI-DAT-NGUONG-TOC-DO-WEB-MOBILE.md). Chưa nạp board hoặc đo lại mạch trong phiên tự động. Cần actual cho xung/vòng, ARM/relay, overspeed, reset và chuỗi MQTT→DB→web trước khi chốt ba tính năng đạt trên hardware.
