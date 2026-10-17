# Cấu trúc slide thuyết trình — Smart Motorbike Guardian

## Quy ước chung

- Thời lượng tối đa 10 phút, chưa có demo trực tiếp. 9 slide chính: 9 phút 10 giây; dự phòng 50 giây cho chuyển người nói.
- Trọng tâm: kiến trúc IoT đủ tầng, luồng dữ liệu/điều khiển, lựa chọn kỹ thuật và bằng chứng kiểm thử trên breadboard.
- Mỗi slide một thông điệp, khoảng 3–4 ý ngắn. Chi tiết nằm trong lời nói, không chép báo cáo lên slide.
- Ảnh minh họa ưu tiên mạch/giao diện/log thật. Sơ đồ tự vẽ phải đúng cấu hình đang chạy. Ảnh mockup phải ghi rõ mockup.
- Trước khi xuất slide, cập nhật trạng thái từng phần với thành viên phụ trách. Mobile đang dự kiến phát triển; GPS chưa có bằng chứng fix ngoài trời. Không dùng hình giả làm kết quả thực nghiệm.
- Có thể chuẩn bị ảnh tại docs/evidence/slides/; không chèn mật khẩu, token hoặc tọa độ riêng tư không cần thiết.

## Slide 1 — Bài toán và mục tiêu (40 giây)

**Tiêu đề:** Smart Motorbike Guardian — Hệ thống IoT giám sát và cảnh báo cho mô hình xe máy.

**Nội dung trên slide:**

- Theo dõi chuyển động, rung/nghiêng và vị trí khi GPS có fix.
- Cảnh báo và điều khiển mô hình từ xa.
- Phạm vi: bài tập lớn IoT trên breadboard, không phải sản phẩm chống trộm xe thương mại.
- Tên môn, nhóm, thành viên và giảng viên.

**Ảnh cần chèn:** Một ảnh tổng thể testbed thật, rõ hai board và cảm biến; đặt bên phải. Nếu chưa có ảnh đẹp, chụp trên nền gọn, ghi chú tên mô hình. Tránh dùng ảnh xe thật khiến người xem hiểu đã lắp lên xe.

**Lời nói gợi ý:** Nêu nhu cầu giám sát, sau đó giới thiệu nhóm xây dựng nguyên mẫu để chứng minh dữ liệu đi qua đủ tầng IoT và có chiều điều khiển ngược lại.

## Slide 2 — Kiến trúc tổng thể các tầng IoT (1 phút 30 giây)

**Thông điệp:** Hệ thống có đầy đủ thiết bị, truyền thông, xử lý/lưu trữ và ứng dụng.

**Nội dung trên slide:**

- Thiết bị: Hall, MPU6050, NEO-6M; ESP32-S3 Node B; ESP32 Node A; relay/buzzer.
- Truyền thông: UART giữa hai node; Wi-Fi/MQTT tới broker.
- Dịch vụ: backend Spring Boot, PostgreSQL.
- Ứng dụng: web và mobile dùng chung backend.

**Ảnh cần chèn:** Sơ đồ khối chiếm phần lớn slide, dùng mũi tên hai chiều:

```text
Hall / MPU / GPS → Node B → UART → Node A → MQTT broker → Backend → PostgreSQL
                                   ↓                     ↕
                              Relay / Buzzer         Web / Mobile
```

Vẽ thêm mũi tên điều khiển: Web/Mobile → Backend → Broker → Node A → cơ cấu chấp hành; ACK quay về qua Broker → Backend → ứng dụng. Mobile tô nét đứt/ghi đang phát triển nếu chưa hoàn thành. Gắn nhãn nơi chạy thực tế: breadboard, broker từ xa, laptop/server backend/DB.

**Lời nói gợi ý:** Đi theo đường dữ liệu lên một lần, đường lệnh xuống một lần. Giải thích tách Node B lấy mẫu và Node A quản lý mạng/điều khiển. Broker từ xa không đồng nghĩa backend/DB đã triển khai trên cloud; ghi đúng nơi chạy.

## Slide 3 — Hardware và phân công hai node (1 phút)

**Nội dung trên slide:**

- Node B ESP32-S3 N16R8: Hall đo xung, MPU đo gia tốc, GPS đọc NMEA.
- Node A ESP32 gateway: kết nối Wi-Fi/MQTT, điều khiển relay và buzzer.
- UART 115200 baud, chung GND; GPS UART riêng 9600 baud.
- Relay dùng cấu hình mức kích phù hợp; motor thử dùng nguồn đúng định mức.

**Ảnh cần chèn:** Ảnh breadboard thật có các nhãn A/B/Hall/MPU/GPS/relay. Một ảnh cận antenna GPS ở góc nhỏ nếu ảnh tổng thể không rõ. Có thể dùng hình pinout giản lược bên cạnh, không nhồi toàn bộ bảng dây.

**Lời nói gợi ý:** Mỗi cảm biến trả lời một nhu cầu. Hall đo chuyển động bánh; MPU phục vụ rung/nghiêng; GPS phục vụ vị trí. Chỉ nói điện áp breakout đã xác minh, không suy luận VCC từ tên NEO-6M.

## Slide 4 — Firmware và xử lý tại thiết bị (1 phút 10 giây)

**Nội dung trên slide:**

- FreeRTOS chia task GPS, lấy mẫu, xử lý và UART; queue/mutex trao đổi dữ liệu.
- GPS đọc liên tục, không chặn Hall/MPU khi NO_FIX.
- Dữ liệu có cờ hợp lệ và kiểm tra tuổi; thiếu MPU không tạo số đo giả.
- Node A có ControlTask quản lý state và đầu ra.

**Ảnh cần chèn:** Sơ đồ task tự vẽ dựa trên code:

```text
Node B: GPS UART → GpsTask → GPS snapshot
        Hall/MPU → SensorTask → Queue → ProcessingTask → Telemetry/Event
        Telemetry + GPS/Event ↔ UARTTask ↔ Node A
Node A: UART nhận → Snapshot/Event
        MQTT/Serial → Command queue → ControlTask → Relay/Buzzer → ACK
```

Ghi nhịp chính nếu cần: SensorTask khoảng 50 ms, telemetry UART khoảng 500 ms, MQTT khoảng 1 giây. Không gọi nhịp cấu hình là độ trễ đo được.

**Lời nói gợi ý:** Giải thích tại sao chia task, queue và mutex; nhấn GPS chưa fix không làm hệ thống đứng chờ. Không cần chiếu cả trang code.

## Slide 5 — Truyền thông và điều khiển có phản hồi (1 phút 10 giây)

**Nội dung trên slide:**

- UART có framing, length và checksum XOR; payload telemetry v2 39 byte.
- MQTT tách telemetry, alert, command, ACK, status/heartbeat.
- Lệnh mang cmd_id; ACK sau thực thi hoặc từ chối; cache chống lặp có giới hạn.
- LOCK bị từ chối khi đang quay hoặc dữ liệu cảm biến quá hạn.

**Ảnh cần chèn:** Sơ đồ tuần tự ngắn: App → Backend → MQTT → Node A → GPIO → ACK → Backend → App. Kèm hai trích đoạn log thật, cắt gọn:

```text
result=REJECTED reason=SPEED_NOT_ZERO
result=REJECTED reason=SENSOR_STALE
```

Nếu muốn minh họa payload, chỉ dùng một command và ACK cùng ID; ưu tiên ảnh capture thử MQTT thực tế. Ghi rõ minh họa nếu dùng JSON tự soạn.

**Lời nói gợi ý:** Gửi thành công không đồng nghĩa thực thi thành công. ACK chứng minh firmware thực thi đầu ra GPIO; hệ thống chưa có cảm biến phản hồi tiếp điểm relay. Không tuyên bố exactly-once; cache chỉ 8 kết quả RAM.

## Slide 6 — Backend, database và triển khai (1 phút)

**Nội dung trên slide:**

- Backend nhận MQTT, cung cấp API và quản lý lệnh/cảnh báo.
- PostgreSQL lưu telemetry, lịch sử lệnh/cảnh báo và quan hệ quyền thiết bị.
- Phân quyền Owner/Viewer; trạng thái PENDING/EXECUTED/REJECTED/timeout theo bản triển khai thực tế.
- Nêu nơi chạy broker/backend/DB và cấu hình dựng hệ thống.

**Ảnh cần chèn:** ERD giản lược lấy đúng schema: User — Device/Ownership — Telemetry/Command/Alert (tên quan hệ đối chiếu code). Bên cạnh một sơ đồ triển khai laptop/server + broker; không dùng logo cloud để ám chỉ hosting chưa làm.

**Lời nói gợi ý:** Backend nối thiết bị với ứng dụng và lưu lịch sử; DB giúp truy xuất lại thay vì chỉ nhìn số đo tức thời. Người phụ trách phải xác nhận lỗi trong tài liệu bàn giao đã sửa trước khi đưa thành kết quả. Nếu chưa sửa, ghi phần cần hoàn thiện.

## Slide 7 — Web và mobile app (1 phút)

**Nội dung trên slide:**

- Dashboard: số đo, trạng thái kết nối và bảo vệ.
- Cảnh báo/lịch sử lệnh; điều khiển và xem kết quả ACK.
- Bản đồ phân biệt GPS hiện tại, last-known và chưa có fix.
- Web/mobile dùng chung API, phân quyền và database.

**Ảnh cần chèn:** Ảnh web dashboard thật và 1–2 màn hình mobile thật nếu đã chạy. Nếu app chưa hoàn thành, dùng wireframe có nhãn “Thiết kế dự kiến — đang phát triển”, kèm sơ đồ Web/Mobile → cùng Backend. Không hiển thị marker seed như GPS thật.

**Lời nói gợi ý:** Mobile bổ sung cách truy cập thuận tiện; không xây thêm backend riêng. Nêu chính xác chức năng đã chạy của từng giao diện, không hứa tính năng chưa triển khai như kết quả.

## Slide 8 — Kết quả kiểm thử và giới hạn (1 phút)

**Nội dung trên slide:** Bảng gọn, chia bằng chứng và mục chưa hoàn tất:

| Hạng mục | Trạng thái để đối chiếu trước xuất slide |
|---|---|
| UART mất/phục hồi, chặn LOCK khi stale/quay | Có log kiểm chứng |
| MPU ARM → ALARM → DISARM | Có log kiểm chứng |
| MQTT và các ca remote | Người dùng xác nhận ổn; bổ sung capture riêng |
| GPS | Nhận NMEA; fix ngoài trời còn chờ bằng chứng |
| Hall/điện áp | Hall cần hiệu chỉnh; chưa đo ADC |
| Chạy lâu/latency/end-to-end app | Chỉ ghi số liệu khi đã đo |

**Ảnh cần chèn:** Một ảnh log/capture đáng tin nhất và ảnh mạch trong lúc thử. Nếu đã có latency, thêm biểu đồ nhỏ min/median/max, ghi số lượt và phương pháp đo. Nếu chưa đo, bỏ biểu đồ; không tự sinh số liệu.

**Lời nói gợi ý:** Nêu ca thử lỗi có giá trị: rút UART vẫn từ chối khóa dù speed cũ bằng 0. Nêu giới hạn: Hall không phát hiện dây đứt, buffer RAM mất khi reset, GPS indoor chưa fix; không khẳng định không mất dữ liệu.

## Slide 9 — Kết luận và hướng hoàn thiện (40 giây)

**Nội dung trên slide:**

- Nguyên mẫu có đường cảm biến → thiết bị → MQTT và chiều điều khiển xuống.
- Kết quả web/mobile/DB chỉ bổ sung khi đã nghiệm thu đầu-cuối.
- Hoàn thiện còn lại: GPS thực địa, hiệu chỉnh Hall, đồng bộ app/backend và bằng chứng thử.
- Phân công nhóm bằng tên thật: embedded, backend/DB/triển khai, web, mobile, báo cáo/slide; một người có thể kiêm nhiều phần.

**Ảnh cần chèn:** Sơ đồ tổng thể thu nhỏ và bảng phân công 4–5 dòng. Không cần thêm ảnh trang trí.

**Lời nói gợi ý:** Kết luận bằng điều nhóm đã chứng minh và bước hoàn thiện cụ thể. Dừng đúng giờ, mời câu hỏi.

## Danh sách hình cần các thành viên chuẩn bị

| Người phụ trách | Hình/bằng chứng cần cung cấp | Dùng ở slide |
|---|---|---|
| Hardware/firmware | Ảnh tổng thể mạch, nhãn linh kiện, cận GPS; log UART/interlock/MPU và MQTT ACK | 1, 3, 5, 8 |
| Người làm slide + embedded | Sơ đồ tầng IoT, task FreeRTOS, sequence command/ACK | 2, 4, 5 |
| Backend/DB/triển khai | ERD đúng schema, sơ đồ nơi chạy, bản ghi/API cùng device | 6, 8 |
| Web | Dashboard, cảnh báo, lịch sử lệnh, GPS trạng thái đúng | 7 |
| Mobile | Màn hình thật hoặc wireframe ghi rõ dự kiến, chức năng và trạng thái triển khai | 7 |
| Cả nhóm | Bảng kiểm thử, log chạy lâu, số liệu latency nếu có, tên/phân công | 8, 9 |

## Kiểm tra trước buổi trình bày

- Diễn tập tổng thời gian dưới 9 phút 30 giây; có câu chuyển giữa người nói.
- Dùng một UUID và cấu hình thống nhất trong các ảnh; che secret, cắt bỏ vùng màn hình thừa.
- Không gọi PARKED là bánh chắc chắn đứng yên; không gọi MQTT 1883 là TLS.
- Không ghi pin 12.6V là đo thật, GPS 0,0 là fix, mobile mockup là app hoàn thành.
- Nội dung lấy từ tài liệu nghiệm thu và bàn giao, cập nhật theo kết quả nhóm thực tế.
- Có thể thêm slide phụ ngoài 10 phút: pinout, payload UART/MQTT, ngưỡng MPU, chi phí BOM, test chi tiết để trả lời vấn đáp; không đọc chúng trong bài chính.
