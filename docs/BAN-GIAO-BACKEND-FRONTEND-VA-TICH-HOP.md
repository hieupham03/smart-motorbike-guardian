# Bàn giao phần còn lại — Smart Motorbike Guardian

Cập nhật 12/10/2026. Mục tiêu: bài tập lớn IoT trên breadboard đạt chất lượng A/A+, chứng minh đủ các tầng bằng dữ liệu thật và điều khiển hai chiều. Không yêu cầu kiến trúc sản phẩm thương mại. Tài liệu này phân công và quy định nghiệm thu; không xác nhận backend/frontend đã được sửa.

## 1. Mốc hardware/firmware bàn giao

Hai node đã nạp firmware v2. Log xác nhận UART 39 byte, heartbeat, mất UART/phục hồi, Hall nhận chuyển động, MPU thật, chặn LOCK khi quay hoặc dữ liệu cũ, ARM/ALARM/DISARM. Người phụ trách hardware xác nhận MQTT hoạt động và buổi thử còn lại ổn; các ca không có log riêng được ghi là xác nhận người dùng, không phải đo độc lập.

Chốt baseline demo trong nhà, không gọi GPS định vị hoàn thành. Còn mở: GPS fix ngoài trời và stale sau fix; hiệu chỉnh Hall/điều tra spike; đo điện áp ADC nếu rubric bắt buộc; lưu bằng chứng chi tiết relay/reset và chạy lâu nếu chưa có. Chủ phần embedded xử lý các mục này, không giao app tạo tọa độ hay điện áp thay thế.

Code chuẩn: firmware/node_a_gateway/ và firmware/node_b_sensor/. node_a/ và node_b/ là mirror. Không thay hợp đồng MQTT hoặc đổi firmware chỉ để app dễ nhận; nếu cần thay, thống nhất cả hai phía trước. Xem NGHIEM-THU-HARDWARE-FIRMWARE.md và HUONG-DAN-HARDWARE-FIRMWARE-V2-GPS.md.

## 2. Hợp đồng MQTT hiện tại

Broker demo: broker.emqx.io, TCP 1883; web dùng WSS 8084, path /mqtt. Device UUID hiện tại: 550e8400-e29b-41d4-a716-446655440001. Dùng UUID làm định danh chính. Firmware còn nghe alias dev-550e8400-0001 cho tương thích; backend nên gửi một topic UUID, không gửi lặp qua alias.

Prefix: guardian/<device_uuid>/.

| Topic cuối | Nội dung |
|---|---|
| telemetry | Khoảng 1 giây/bản tin khi mạng hoạt động |
| alert | Sự kiện MOTION_WHILE_ARMED hoặc FALL_DETECTED; details có đơn vị m/s2 hoặc deg |
| status | online khi kết nối; offline qua LWT; retained |
| heartbeat | Khoảng 15 giây; status, heap, uptime |
| cmd/<command> | Lệnh JSON xuống thiết bị; không retain |
| cmd/ack | Phản hồi thực thi hoặc từ chối; không ACK lại ACK |

Telemetry ví dụ minh họa (không phải kết quả đo):

```json
{"device_id":"550e8400-e29b-41d4-a716-446655440001","ts":123,"state":"PARKED","data_source":"HARDWARE","sensor_connected":true,"imu_valid":true,"speed_valid":true,"gps_valid":false,"gps_age_ms":4294967295,"speed_kmh":0,"accel_x":0.3,"accel_y":-0.2,"accel_z":9.8}
```

- ts và uptime là giây từ lúc boot, không phải epoch/GPS UTC. Backend ghi received_at bằng đồng hồ server; không trừ uptime với epoch để đo latency.
- speed_kmh: km/h; accel_x/y/z: m/s2. Các trường số có thể không xuất hiện khi invalid/stale; không đổi thiếu dữ liệu thành 0.
- sensor_connected mô tả freshness Node B, không phải online của gateway trên broker.
- gps_age_ms: mili giây; 4294967295 là sentinel chưa có tuổi hợp lệ. Firmware coi GPS quá 5 giây là stale, không phát lat/lon khi gps_valid=false.
- Khi gps_valid=true, latitude/longitude là độ thập phân. Kiểm tra finite và khoảng [-90,90]/[-180,180]; không dùng kiểm tra truthy vì tọa độ bằng 0 có thể hợp lệ.
- Không có battery_v vì chưa đo ADC. Backend/DB/UI phải hỗ trợ null và hiển thị chưa đo.
- PARKED là trạng thái bảo vệ tắt/mở khóa, không chứng minh xe đứng yên. Các state: PARKED, ARMED, ALARM, THEFT_LOCK. Tốc độ và state là hai thông tin riêng.

| Type trong payload | Topic cuối |
|---|---|
| ARM | cmd/arm |
| DISARM | cmd/disarm |
| LOCK_ENGINE | cmd/lock_engine |
| UNLOCK_ENGINE | cmd/unlock_engine |
| SIREN_ON | cmd/siren_on |
| SIREN_OFF | cmd/siren_off |
| REBOOT | cmd/reboot |

```json
{"cmd_id":"demo-arm-01","type":"ARM"}
```

cmd_id không rỗng, tối đa 39 ký tự, chỉ chữ/số/dấu -/_. ACK ví dụ:

```json
{"cmd_id":"demo-arm-01","result":"EXECUTED","reason_if_failed":null,"ts":124}
```

REJECTED có thể kèm NO_SENSOR_DATA, SENSOR_STALE, SPEED_INVALID, SPEED_NOT_ZERO, QUEUE_FULL hoặc UNSUPPORTED_COMMAND. Backend xác minh ACK thuộc đúng device của command bằng topic; ACK không có device_id trong payload. Không coi MQTT publish thành công là EXECUTED. EXECUTED chứng minh firmware đã thực thi GPIO, không có feedback tiếp điểm vật lý.

Firmware chống lặp bằng cache 8 kết quả RAM; gửi lại ID trong cache trả kết quả cũ, không chạy lại. Reset/xóa khỏi cache làm mất bảo đảm này. ACK trùng không được làm trạng thái cuối dao động. Không retry mù lệnh nguy hiểm sau timeout/reset.

## 3. Backend — việc bắt buộc trước demo

| Ưu tiên | Công việc và điểm bắt đầu | Tiêu chí xong |
|---|---|---|
| P0 | CommandService: bỏ tự fallback simulator khi publish lỗi | HARDWARE không kết nối phải trả trạng thái lỗi/chờ phù hợp; không sinh ACK mô phỏng |
| P0 | CommandService/MqttSubscriberService: lifecycle lệnh, ACK đúng device, timeout | API gửi lệnh trả PENDING; chỉ ACK đúng device/ID đổi EXECUTED/REJECTED; timeout hữu hạn; ACK lặp không đảo trạng thái cuối |
| P0 | MqttSubscriberService/TelemetryService/DTO/entity | Giữ validity, data_source, gps_age_ms, received_at xuyên suốt MQTT → DB → API; số đo thiếu lưu null, không fallback 12.6V |
| P0 | State và online/offline | Telemetry cập nhật securityState; xử lý status/LWT, lastSeen và timeout; sensor stale riêng với gateway offline |
| P0 | AuthService và security config/controllers | Đăng ký không tự chọn ADMIN; Owner/Viewer đúng quyền; kiểm tra ownership REST telemetry/simulator; ACCESS/REFRESH dùng đúng mục đích |
| P1 | Alert ingestion | Dedupe theo device+alert_id; lưu reason/severity/details và received_at; offline backlog không giả làm thời điểm sự kiện mới |

Khi triển khai timeout command, đề xuất demo 10 giây và ghi cấu hình rõ. Chốt cách xử lý ACK đến muộn (lưu làm bằng chứng và reconcile trạng thái thực tế), không bỏ mất nó hoặc tự phát lệnh đối nghịch. Khóa từ xa vẫn có interlock firmware; không bỏ interlock để demo dễ thành công.

Kiểm tra trực tiếp code hiện tại trước sửa: bản được rà soát có fallback simulator trong CommandService, default 12.6 trong MqttSubscriberService, handleStatus chưa xử lý và processCommandAck chưa dùng device topic. Các thành viên có branch mới phải xác minh lại thay vì mặc định lỗi còn nguyên.

## 4. Database và API

- Migration có version cho metadata GPS/validity/source/time; xác định nullable cho số đo chưa có. Không chỉ sửa DB thủ công trên một laptop.
- Giữ last_valid_location và thời điểm nhận fix gần nhất riêng với gps_valid hiện tại. Một lần NO_FIX không ghi đè last fix bằng 0,0.
- API phân biệt current valid position, last-known position và chưa từng có vị trí; lưu/hiển thị thời điểm nhận để người dùng biết độ cũ. Nếu chưa có timestamp GPS UTC, không đặt tên trường như thể là GPS UTC.
- Thống nhất seed; dữ liệu seed/simulator được nhận diện, không ghi đè thiết bị HARDWARE. Lịch sử lọc đúng device/time, có giới hạn/pagination phù hợp.
- Kiểm tra schema/DTO frontend đồng bộ; ghi một payload API mẫu trong docs/evidence/ khi nghiệm thu.

## 5. Frontend — việc bắt buộc

| Phần | Hành vi cần đạt |
|---|---|
| QuickControlPanel | Hiển thị đã gửi/PENDING; cập nhật theo command status, không thông báo thực thi ngay khi HTTP thành công |
| Lịch sử lệnh | Hiển thị ID, thiết bị, type, status, reason, thời gian; REJECTED và TIMEOUT rõ |
| Dashboard | Nhãn HARDWARE/SIMULATED; online gateway và cảm biến mất kết nối tách riêng; số đo invalid hiển thị không có dữ liệu |
| GPS/map | FIX/STALE/NO_FIX; chưa có fix không đặt marker giả; last-known có nhãn cũ và thời gian |
| Battery | Chưa đo hiển thị chưa hỗ trợ/null; bỏ fallback 12.6 ở dashboard/device/analytics |
| Quyền | Viewer không điều khiển; backend vẫn chặn request dù người dùng tự gọi API |

Polling khoảng 1 giây có thể đủ cho demo; đo latency thực tế trước khi cam kết. Không cần đổi toàn bộ sang WebSocket. Nếu dùng WebSocket, kiểm tra quyền subscribe theo thiết bị.

## 6. Cloud/MQTT và chạy hệ thống

- Một cấu hình broker thống nhất firmware/backend/web, device UUID và môi trường demo. Không thay broker ở một tầng riêng lẻ.
- Nêu chính xác: firmware hiện MQTT TCP 1883, không phải TLS. Web WSS không làm kết nối firmware tự trở thành TLS.
- Broker công cộng phục vụ thử; không chứng minh đã có ACL/ownership broker. Quyền app/backend chỉ bảo vệ đường API. Nếu rubric yêu cầu bảo mật broker, cấu hình broker có tài khoản/ACL và kiểm thử quyền.
- Nếu môn bắt buộc hosting backend/cloud từ xa, triển khai backend/DB theo yêu cầu; broker từ xa không có nghĩa toàn bộ hệ thống đã cloud-hosted. Nếu cho phép Docker local, ghi đúng mô hình triển khai.
- Có hướng dẫn dựng DB/backend/frontend từ máy mới, file env mẫu không chứa secret, health check và lệnh khởi động. Giữ kiến trúc hiện có, không thêm Kubernetes/microservices.

## 7. Nghiệm thu chung trước chốt demo

Mỗi ca lưu bước, expected, actual, PASS/FAIL, người thử, thời gian và đường dẫn log/ảnh tại docs/evidence/. Dữ liệu mô phỏng chỉ kiểm tra phần mềm, không thay bằng chứng GPS thật.

| Ca | Bằng chứng bắt buộc |
|---|---|
| Hall/MPU → app | Cùng device: log node, MQTT, row DB, API và UI thay đổi theo tác động thật |
| Remote command | API PENDING → MQTT command → log thực thi → ACK → DB/UI kết quả |
| LOCK đang quay/stale | UI báo từ chối đúng reason; không báo thành công |
| Broker lỗi | Không fallback simulator; lệnh thất bại/timeout đúng; phục hồi có dữ liệu mới |
| Owner/Viewer | Owner điều khiển được; Viewer và user khác bị backend chặn |
| GPS NO_FIX | Không marker giả, không coi tọa độ seed là HARDWARE |
| GPS FIX/STALE | Sau embedded thử ngoài trời: MQTT → DB/API/map giữ đúng validity và last-known |
| State/offline | ALARM/DISARM phản ánh đúng; mất node cảm biến và mất gateway hiển thị khác nhau |
| Lịch sử | Lọc đúng device/time, source rõ, ACK/alert trùng không tạo kết quả sai |
| Latency/ổn định | Đo khoảng 20 lần bằng cùng đồng hồ/video; min/median/max; log buổi chạy 30-60 phút |

Không tính millis ESP32 trừ epoch server thành latency. Có thể dùng video đồng thời thao tác và UI cho môn học. Không báo DONE/100% khi actual trống.

## 8. Thứ tự làm và trách nhiệm

1. Backend + DB sửa P0 và chốt DTO/API; frontend cùng thống nhất tên trường.
2. Frontend sửa command status, validity, GPS và battery placeholder.
3. Người phụ trách triển khai chốt cấu hình chạy/broker và yêu cầu hosting của giảng viên.
4. Embedded cung cấp log/hardware, xử lý các mục còn mở; cả nhóm chạy bảng nghiệm thu đầu-cuối.
5. Người làm báo cáo cập nhật sơ đồ tầng/triển khai, ảnh mạch, kết quả đo, giới hạn; bỏ tuyên bố TLS, pin thật, không mất dữ liệu hoặc GPS hoàn tất nếu chưa có bằng chứng.

Phân công tên thật khi nhóm nhận tài liệu. Không tự gửi tin nhắn, push/merge hay sửa code thành viên từ tài liệu này. Kết quả bàn giao cần một cấu hình demo có thể tái chạy và các ca cốt lõi có bằng chứng, không cần thêm tính năng để đủ tên công nghệ.
