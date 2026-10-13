# Backend/frontend realtime — 13/10/2026

Đã triển khai theo hợp đồng firmware v2 trong `BAN-GIAO-BACKEND-FRONTEND-VA-TICH-HOP.md`. Giữ Spring Boot + PostgreSQL/H2 + React hiện có, không đổi firmware, UART hoặc topic phần cứng.

## Luồng đang dùng

```text
Hall / MPU / NEO-6M → Node B → UART → Node A
  → guardian/<UUID>/telemetry, alert, status, heartbeat, cmd/ack
  → MQTT Paho backend → transaction DB commit
  → STOMP WebSocket /ws → /user/queue/events
  → DeviceContext → dashboard, biểu đồ, bản đồ, cảnh báo, lịch sử lệnh

REST command → DB PENDING commit → MQTT cmd/<type> (UUID duy nhất, retain=false)
  → ACK đúng device + cmd_id → DB EXECUTED/REJECTED → WebSocket
```

Backend đẩy từng sự kiện ngay sau commit, không gom theo timer/polling. **“Ngay” được tính từ lúc backend nhận MQTT**; firmware hiện gửi telemetry khoảng 1 giây/lần. Thời gian từ tác động vật lý tới app còn phụ thuộc lấy mẫu/UART/chu kỳ MQTT/mạng, cần đo trên breadboard.

Frontend dùng REST cho snapshot ban đầu và sau reconnect. Khi WebSocket hoạt động không polling dashboard/lịch sử lệnh. Khi socket lỗi, snapshot REST phục hồi mỗi 5 giây; socket retry mỗi 2 giây, timeout kết nối 8 giây, heartbeat 10 giây. Timer 1 giây trong UI chỉ tính độ cũ, không gọi API.

## Quyền và dữ liệu

- STOMP CONNECT yêu cầu JWT **ACCESS**, kiểm tra tài khoản ACTIVE; không đặt token trong URL/log/session attributes. Token hết hạn ngừng nhận dữ liệu; frontend gia hạn và nối lại trước hạn.
- Chỉ được SUBSCRIBE `/user/queue/events`. Backend gửi tới người đang có ownership và ADMIN; không phát topic cảnh báo công khai. Chặn SEND trực tiếp vào broker. Lệnh đi qua REST kiểm tra Owner theo từng thiết bị, kể cả tài khoản có role tổng quát khác.
- Viewer không điều khiển/simulator/ghi telemetry; người ngoài không đọc telemetry thiết bị. REST telemetry chỉ hỗ trợ thiết bị SIMULATED. Đăng ký không tự chọn ADMIN; ACCESS không dùng để refresh và REFRESH không dùng cho REST/WebSocket.
- Khi thu hồi membership, backend gửi ACCESS_REMOVED và frontend xóa cache của thiết bị. Mỗi lần phát sự kiện backend lấy lại danh sách người có quyền.
- `dataSource`: HARDWARE, SIMULATED; dữ liệu lịch sử chưa có metadata được migration gắn LEGACY. MQTT hardware không tự chuyển thành simulation khi lỗi. Simulator chỉ thao tác thiết bị đã cấu hình SIMULATED.
- `ts` trong API là giây epoch của lúc server nhận; `receivedAt` là ISO timestamp cùng thời điểm. Uptime firmware được lưu riêng ở `deviceUptimeS`. Không lấy uptime trừ epoch để đo latency.
- Giữ `sensorConnected`, `imuValid`, `speedValid`, `gpsValid`, `gpsAgeMs` qua DB/DTO. Giá trị thiếu/invalid lưu null. Không dùng pin 12,6 V, tốc độ/gia tốc hay tọa độ mặc định thay số đo.
- Vị trí mới chỉ hợp lệ khi cờ valid, tuổi ≤ 5.000 ms và lat/lon finite trong giới hạn. Tọa độ 0 hợp lệ. `lastLatitude/lastLongitude/lastLocationReceivedAt` giữ fix cuối, không ghi đè khi NO_FIX. UI phân biệt FIX, STALE, NO_FIX; chưa fix không marker.
- Backend và UI tính thêm thời gian sau khi nhận để GPS/sensor không giữ nhãn valid khi ngừng dữ liệu. Gateway offline qua LWT hoặc không lastSeen trong 45 giây; sensor stale sau 5 giây không telemetry là trạng thái riêng. Thời gian hiển thị dùng đồng hồ server/browser; nên giữ đồng hồ hai máy đúng giờ.
- Alert chống lặp bằng `(device_id, source_alert_id)`, lưu source, details, uptime. `receivedAt`/`createdAt` là lúc server nhận, không phải thời điểm vật lý xảy ra; alert từ buffer firmware có thể đến muộn.

## Lệnh và lịch sử

HTTP gửi lệnh trả **PENDING**. MQTT publish thành công không phải EXECUTED. Chỉ ACK đúng thiết bị/ID và result hợp lệ mới kết thúc; ACK trùng không đảo kết quả. Broker không sẵn sàng trả kết quả REJECTED/MQTT_UNAVAILABLE qua WebSocket, không ACK mô phỏng.

Không có ACK sau 10 giây → TIMEOUT/ACK_TIMEOUT. ACK tới muộn được lưu `lateAckResult/lateAckReason/lateAckAt`; giữ TIMEOUT để thể hiện sự không chắc chắn lúc chờ. Không tự gửi lại lệnh hoặc lệnh đối nghịch. Security state lấy từ telemetry, không đoán từ ACK bật/tắt còi. GPIO/tiếp điểm vẫn cần xác minh vật lý.

Các lệnh hỗ trợ ARM, DISARM, LOCK_ENGINE, UNLOCK_ENGINE, SIREN_ON, SIREN_OFF, REBOOT. CONFIG_THRESHOLDS bị từ chối vì firmware hiện chưa hỗ trợ. LOCK cần mật khẩu xác nhận và vẫn qua interlock firmware.

History: `GET /api/devices/<id>/telemetry?from=<epoch>&to=<epoch>&page=0&size=5000`. Page 0 lấy các mẫu gần nhất trong khoảng; mỗi page trả theo thứ tự thời gian tăng, `size` 1–5.000. Không trả mẫu ngoài khoảng khi truy vấn rỗng. Dashboard giữ tối đa 300 mẫu; lịch sử lệnh 100 bản ghi. Analytics/CSV mặc định tối đa 5.000 mẫu gần nhất và ghi rõ giới hạn.

## Chạy từ máy mới

Yêu cầu Java 17/Maven, Node 20+; PostgreSQL 15 hoặc profile H2. Broker mặc định `tcp://broker.emqx.io:1883`, đúng baseline firmware. Web chỉ kết nối WebSocket tới backend; không cần trình duyệt subscribe trực tiếp broker.

### Docker + PostgreSQL

1. Copy `deployment/.env.example` thành `deployment/.env`; điền POSTGRES_PASSWORD, JWT_SECRET tối thiểu 32 ký tự ngẫu nhiên, DEMO_PASSWORD tối thiểu 8 ký tự. Không commit `.env`.
2. Trong `deployment/`: `docker compose up --build -d`.
3. Mở `http://localhost:3000`; API `http://localhost:8080/api/health`. DB `UP`, MQTT `CONNECTED` là kiểm tra kết nối backend, không chứng minh node đã gửi số đo.
4. Bật DEMO_SEED_ENABLED cho DB demo mới để tạo owner@guardian.iot, viewer@guardian.iot, admin@guardian.iot với mật khẩu DEMO_PASSWORD tự đặt. UI yêu cầu nhập mật khẩu; đã bỏ mật khẩu cứng/đổi vai trò bằng một click.

Mosquitto local giữ dưới profile `local-broker` để không dựng một broker khác với Node A mặc định. Muốn dùng broker riêng phải cấu hình đồng bộ firmware/backend, credential/ACL và bật profile rõ ràng.

Flyway là nguồn migration: V1 tạo schema; V2 thêm metadata/null/late ACK/dedupe. DB cũ được baseline ở version 1 rồi chạy V2; giữ reading cũ dưới nhãn LEGACY và xóa các snapshot mặc định không có bằng chứng. Bản V1 cũ có default để nâng cấp tương thích; **schema cuối sau V2 đã bỏ default số đo**. Không chạy seed SQL cũ song song; compose đã bỏ mount schema/seed và dùng DataInitializer có cấu hình.

Seed mới: thiết bị UUID `550e8400-e29b-41d4-a716-446655440001` là HARDWARE/OFFLINE, không seed số đo/vị trí/alert. `...0002` là SIMULATED riêng. DB có user sẵn không được seed lại. Với DB cũ, không tự suy diễn thiết bị ...0002 là simulator; đổi nguồn chỉ khi chủ dữ liệu xác nhận đó là thiết bị demo.

### Local không Docker

Terminal PowerShell thứ nhất, từ repo:

```powershell
$env:JWT_SECRET = [Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(48))
$demoPassword = Read-Host 'Dat mat khau demo' -AsSecureString
$env:DEMO_PASSWORD = [System.Net.NetworkCredential]::new('', $demoPassword).Password
$env:DEMO_SEED_ENABLED = 'true'
$env:SPRING_PROFILES_ACTIVE = 'h2'
$env:MQTT_BROKER_URL = 'tcp://broker.emqx.io:1883'
Set-Location backend
mvn spring-boot:run
```

H2 chỉ lưu trong RAM, tắt app sẽ mất dữ liệu. Với PostgreSQL local, bỏ profile H2 và đặt SPRING_DATASOURCE_URL/USERNAME/PASSWORD phù hợp (mặc định port 5433). Giữ JWT_SECRET ổn định giữa các lần khởi động nếu muốn phiên đăng nhập còn hiệu lực.

Terminal thứ hai: `cd frontend`, `npm ci`, `npm run dev`. Mở `http://localhost:5173`. Vite proxy mặc định backend 8080; đổi `BACKEND_URL` nếu dùng port khác. Nginx Docker đã cấu hình upgrade `/ws` cả khi không có dấu `/` cuối.

Health: `GET /api/health` trả status/database/mqtt, không credential. MQTT_ENABLED=false chỉ cho kiểm thử phần mềm; muốn dữ liệu board thật phải bật MQTT và broker đúng với Node A.

## Kiểm thử và phần còn cần nghiệm thu

Backend: `cd backend; mvn test`. Frontend: `cd frontend; npm ci; npm test; npm run build`. Kết quả thực tế và ảnh: [evidence/realtime/README.md](evidence/realtime/README.md).

Các kiểm thử tự động dùng H2, broker MQTT TCP local tối giản và payload tạo bằng phần mềm. Đã chạy giao diện bằng Edge headless với simulator; không gửi lệnh tới board qua public broker trong phiên này. Chưa kiểm thử Docker/PostgreSQL đang chạy hoặc hosting cloud trong phiên này.

Nghiệm thu hardware còn cần: tác động Hall/MPU và quay video/log cùng MQTT/DB/UI; ARM/DISARM và ACK thật; LOCK khi quay/stale; LWT/ngắt Wi-Fi/phục hồi; GPS ngoài trời FIX→STALE; ít nhất 20 phép đo latency và buổi chạy 30–60 phút. Không dùng số đo local phần mềm thay kết quả testbed.

Tham khảo cách xác thực STOMP bằng token và interceptor trong [Spring Framework](https://docs.spring.io/spring-framework/reference/6.2/web/websocket/stomp/authentication-token-based.html), reconnect/heartbeat trong [STOMP.js](https://stomp-js.github.io/api-docs/latest/classes/Client.html).
