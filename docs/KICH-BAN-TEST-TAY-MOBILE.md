# Kịch bản test tay mobile app

Tài liệu này sắp xếp các ca trong [NGHIEM-THU-MOBILE-TRUC-TIEP.md](NGHIEM-THU-MOBILE-TRUC-TIEP.md) thành một phiên test có thứ tự. Mọi ca mặc định là `CHƯA CHẠY`; chỉ đổi thành `PASS` khi đã quan sát đúng kết quả và có bằng chứng.

## 1. Phạm vi và môi trường

### Phiên A — Smoke test trên Expo Go

Dùng để kiểm tra giao diện, điều hướng, validation, camera, bản đồ và các API cơ bản. Expo Go không dùng để nghiệm thu remote push notification.

### Phiên B — Tích hợp backend và simulator

Dùng backend đang chạy, database và dữ liệu `SIMULATED` để kiểm tra auth, phân quyền, REST, STOMP, lệnh, cảnh báo, lịch sử và CSV mà không cần board.

### Phiên C — Development build và phần cứng

Dùng development build trên điện thoại thật, MQTT và hai node ESP32 để kiểm tra push, GPS NEO-6M, Hall/MPU, relay/còi và đường dữ liệu end-to-end.

Không dùng kết quả simulator để tuyên bố GPS fix, relay hoặc cảm biến thật đã hoạt động.

## 2. Chuẩn bị

Ghi các thông tin sau trước khi chạy:

| Mục | Giá trị thực tế |
|---|---|
| Ngày/giờ, người test | |
| Commit mobile/backend/firmware | |
| Thiết bị, phiên bản Android/iOS | |
| Kiểu chạy: Expo Go/development build | |
| API URL và WebSocket URL | |
| Backend profile, DB, MQTT broker | |
| Device ID SIMULATED/HARDWARE | |

Dữ liệu test cần có:

- Một tài khoản `OWNER`, một `VIEWER`, một `ADMIN`; không ghi mật khẩu vào tài liệu hoặc ảnh.
- Một Viewer chưa được chia sẻ thiết bị và một Viewer đã được chia sẻ.
- Một claim token chưa dùng; giữ token ngoài evidence công khai.
- Một thiết bị simulator có thể tạo telemetry, alert và ACK.
- Khi test phần cứng: Node A, Node B, NEO-6M và tải testbed đã đấu theo `HUONG-DAN-HARDWARE-FIRMWARE-V2-GPS.md`.

Với emulator Android, backend chạy trên máy host thường được truy cập qua `http://10.0.2.2:8080`; với điện thoại thật, dùng IPv4 LAN của máy chạy backend. Kiểm tra `/api/health` trước khi test.

Lưu ảnh, video và log vào `docs/evidence/mobile/<yyyy-mm-dd>/`. Không lưu JWT, claim token, Wi-Fi password, Expo token hoặc secret.

## 3. Kịch bản A — Smoke test giao diện

### A01 — Khởi động và màn hình đăng nhập

**Bước thực hiện**

1. Mở app từ trạng thái đã logout.
2. Quan sát logo, tiêu đề, hai trường Email/Mật khẩu và nút Đăng nhập.
3. Chạm liên kết Đăng ký rồi quay lại Đăng nhập.
4. Tắt/mở bàn phím và cuộn màn hình.

**Kết quả mong đợi**

- Không có màn hình đỏ, crash hoặc chữ bị cắt.
- Điều hướng Login ↔ Register đúng; nút Back hoạt động hợp lý.
- Trường đang nhập không bị bàn phím che.

### A02 — Validation đăng nhập

| Dữ liệu | Kết quả mong đợi |
|---|---|
| Email trống, mật khẩu trống | Hiện lỗi bắt buộc; không gọi API |
| `abc` / mật khẩu bất kỳ | Báo email không hợp lệ |
| Email có chữ hoa và khoảng trắng | Giá trị gửi đi được trim và chuyển về chữ thường |
| Tài khoản/mật khẩu sai | Hiện lỗi API, app không crash và vẫn ở Login |

### A03 — Validation đăng ký

| Dữ liệu | Kết quả mong đợi |
|---|---|
| Họ tên dưới 2 ký tự | Báo họ tên quá ngắn |
| Email sai định dạng | Báo email không hợp lệ |
| Mật khẩu dưới 6 ký tự | Báo mật khẩu quá ngắn |
| Xác nhận khác mật khẩu | Báo xác nhận không khớp |

### A04 — Trạng thái mất mạng

1. Tắt mạng emulator/điện thoại.
2. Thử đăng nhập hoặc kéo để refresh.
3. Bật mạng lại và thực hiện lại thao tác.

**Kết quả mong đợi:** app hiện lỗi mạng có thể hiểu được, không treo; sau khi có mạng, thao tác chạy lại bình thường.

## 4. Kịch bản B — Backend và simulator

### B01 — Đăng ký, đăng nhập và phục hồi phiên

1. Đăng ký một Owner mới bằng email chưa tồn tại.
2. Xác nhận app chuyển vào khu vực đã đăng nhập và profile đúng.
3. Đóng hoàn toàn app rồi mở lại.
4. Vào Thiết bị → Tài khoản → Đăng xuất.

**Kết quả mong đợi**

- Tài khoản mới có vai trò `OWNER`.
- Phiên được phục hồi sau khi mở lại app.
- Đăng xuất xóa phiên và chuyển về Login; Back không mở lại màn hình có dữ liệu.

### B02 — Onboard thiết bị

1. Vào Thiết bị → Thêm thiết bị.
2. Bỏ trống claim token hoặc tên xe rồi bấm Kích hoạt.
3. Nhập claim token hợp lệ, tên xe, biển số và dòng xe; kích hoạt.
4. Thử dùng lại cùng token.
5. Nếu thiết bị có camera, quét lần lượt QR token thuần, JSON có `claimToken` và URL có query `claimToken`.

**Kết quả mong đợi**

- Token và tên xe là bắt buộc.
- Token hợp lệ tạo thiết bị và đưa thiết bị vào danh sách của Owner.
- Token đã dùng bị backend từ chối, không tạo bản ghi trùng.
- Từ chối quyền camera không chặn cách nhập token thủ công.

### B03 — Danh sách và chọn thiết bị

1. Mở tab Thiết bị.
2. Kiểm tra tên, biển số, model, UUID, nguồn dữ liệu, trạng thái và vai trò.
3. Chọn lần lượt hai thiết bị rồi chuyển sang Tổng quan, Bản đồ và Điều khiển.

**Kết quả mong đợi:** thiết bị đang chọn được đánh dấu; các tab cùng hiển thị một thiết bị, không trộn dữ liệu giữa hai device ID.

### B04 — Dashboard realtime và reconnect

1. Chọn thiết bị simulator đang phát telemetry.
2. Quan sát trạng thái WebSocket, tốc độ, gia tốc, GPS, security state và data source.
3. Thay đổi telemetry trên simulator.
4. Tắt mạng 10–15 giây, tiếp tục tạo telemetry, sau đó bật mạng lại và kéo refresh.

**Kết quả mong đợi**

- Trạng thái chuyển sang `CONNECTED` khi STOMP kết nối.
- Telemetry mới cập nhật đúng thiết bị; giá trị không hợp lệ hiển thị dấu gạch thay vì số giả.
- Sau reconnect, snapshot mới nhất được phục hồi và không bị dữ liệu cũ ghi đè.

### B05 — GPS NO_FIX, FIX và STALE

| Tình huống | Kết quả mong đợi |
|---|---|
| Chưa từng có tọa độ hợp lệ | `NO_FIX`, không marker, không tọa độ mặc định `0,0` |
| Có `gpsValid=true` và tọa độ hợp lệ | `FIX`, marker và sáu chữ số thập phân đúng dữ liệu |
| Ngừng cập nhật GPS quá cửa sổ 5 giây | `STALE`, vẫn ghi rõ đây là vị trí cuối, không tuyên bố vị trí hiện tại |

### B06 — Phân quyền Viewer

1. Owner vào Quản lý cấu hình & Viewer, thêm tài khoản Viewer.
2. Đăng xuất Owner, đăng nhập Viewer.
3. Mở Dashboard, Map, Alerts, Control và trang quản lý thiết bị.

**Kết quả mong đợi**

- Viewer xem dữ liệu và có thể đánh dấu cảnh báo đã xem.
- Nút điều khiển bị khóa; Viewer không sửa cấu hình, thêm người dùng hoặc resolve alert.
- Nếu gọi API trái quyền trực tiếp, backend vẫn trả 403.

### B07 — Cấu hình và chia sẻ Viewer

1. Đăng nhập Owner, sửa tên xe/biển số/model và ba ngưỡng bằng số hợp lệ.
2. Nhập giá trị âm hoặc không phải số.
3. Thêm Viewer đã tồn tại, kiểm tra danh sách, sau đó gỡ quyền.

**Kết quả mong đợi**

- Dữ liệu hợp lệ được lưu và hiện lại sau refresh.
- Ngưỡng âm/không phải số bị chặn.
- Viewer được thêm/gỡ đúng; sau khi gỡ không còn xem được thiết bị.
- Ghi chú rõ ngưỡng hiện chỉ được lưu/dùng ở backend, chưa đồng bộ xuống firmware.

### B08 — Lệnh điều khiển và ACK

1. Với Owner và thiết bị `ACTIVE`, chọn ARM rồi Hủy tại hộp xác nhận.
2. Gửi ARM, sau đó DISARM; quan sát lịch sử lệnh.
3. Lần lượt thử SIREN_ON/OFF, UNLOCK_ENGINE và REBOOT trên simulator.
4. Mô phỏng không gửi ACK; sau timeout mới gửi ACK muộn.

**Kết quả mong đợi**

- Hủy không tạo lệnh.
- Lệnh đi từ `PENDING` sang `EXECUTED` hoặc `REJECTED` theo ACK đúng `cmdId`.
- Không ACK dẫn tới `TIMEOUT`; ACK muộn chỉ được ghi là late ACK, không đổi TIMEOUT thành EXECUTED.
- MQTT publish thành công không được hiển thị như bằng chứng firmware đã thực thi.

### B09 — LOCK_ENGINE

1. Chọn Khóa động cơ.
2. Để trống mật khẩu xác nhận; nút gửi phải bị khóa.
3. Nhập sai mật khẩu và gửi.
4. Nhập đúng mật khẩu, dùng simulator lần lượt trả `SPEED_NOT_ZERO`, `SENSOR_STALE` và `EXECUTED`.

**Kết quả mong đợi:** mật khẩu được yêu cầu; lỗi backend/firmware được hiển thị; chỉ trường hợp hợp lệ mới có trạng thái EXECUTED.

### B10 — Cảnh báo

1. Tạo một alert thường và một alert `CRITICAL` cho hai thiết bị.
2. Bật/tắt bộ lọc theo thiết bị đã chọn.
3. Dùng Viewer chọn Đã xem.
4. Dùng Owner chọn Đánh dấu xử lý, thử nội dung rỗng rồi nhập nội dung hợp lệ.

**Kết quả mong đợi**

- Danh sách và bộ lọc đúng device ID; cảnh báo critical có phân biệt trực quan.
- Viewer chuyển `OPEN` sang acknowledged nhưng không có quyền resolve.
- Owner phải nhập `actionTaken` và chuyển cảnh báo sang `RESOLVED`.

### B11 — Lịch sử và CSV

1. Vào Thiết bị → Lịch sử/CSV.
2. Chọn lần lượt `1h`, `24h`, `7d`.
3. Kiểm tra biểu đồ tốc độ/pin, danh sách telemetry và lệnh gần đây.
4. Chọn Xuất/chia sẻ CSV và mở file bằng trình đọc khác.

**Kết quả mong đợi:** khoảng thời gian thay đổi đúng; null không biến thành 0; tối đa 5.000 mẫu mỗi truy vấn; CSV mở được, đúng thiết bị và thời gian, không chứa credential.

### B12 — Tài khoản và Admin

1. Đổi mật khẩu với mật khẩu cũ sai, mật khẩu mới ngắn và xác nhận không khớp.
2. Đổi bằng dữ liệu hợp lệ, logout và login bằng mật khẩu mới.
3. Đăng nhập Admin, mở Quản trị, kiểm tra tổng số user/device/audit.
4. Khóa một user khác, kiểm tra user đó không đăng nhập được; sau đó mở khóa.
5. Xác nhận non-admin không thấy hoặc không truy cập được chức năng Admin.

**Kết quả mong đợi:** validation đúng; đổi mật khẩu thành công; Admin không tự khóa chính mình trên UI; thao tác khóa/mở được ghi audit; backend bảo vệ endpoint Admin.

## 5. Kịch bản C — Development build, push và phần cứng

### C01 — Push notification

Chỉ chạy bằng development/production build có EAS project và FCM/APNs hợp lệ.

1. Cho phép notification và đăng nhập.
2. Tạo alert khi app foreground, background và đã bị kill.
3. Chạm notification ở background/cold start.
4. Gỡ quyền Viewer rồi chạm lại notification cũ.
5. Logout tài khoản A, login B và tạo sự kiện chỉ thuộc A.

**Kết quả mong đợi:** mỗi sự kiện chỉ có một notification; tap mở đúng thiết bị/màn hình còn quyền; notification cũ không làm lộ thiết bị đã mất quyền; B không nhận dữ liệu của A.

### C02 — GPS NEO-6M end-to-end

1. Đặt antenna ngoài trời, chờ log Node B có GPS FIX thật.
2. Đối chiếu tọa độ Node B → UART Node A → MQTT → backend → app.
3. Ngừng dữ liệu GPS hoặc đưa vào vùng mất tín hiệu, chờ quá 5 giây.

**Kết quả mong đợi:** tọa độ hợp lý và cùng giá trị trong toàn đường truyền; app chuyển FIX → STALE, giữ last-known có nhãn stale; Hall/MPU vẫn tiếp tục chạy.

### C03 — Hall/MPU và cảnh báo end-to-end

1. Xoay bánh và tác động nghiêng/rung có kiểm soát trên testbed.
2. Quay đồng thời Serial Node B, Serial Node A, MQTT/backend log và màn hình app.

**Kết quả mong đợi:** sự kiện vật lý tạo dữ liệu cảm biến, đi qua UART/MQTT, lưu backend và cập nhật đúng app; không dùng dữ liệu seed/simulator làm bằng chứng.

### C04 — Relay/còi và interlock

1. Dùng tải testbed an toàn; không thử trên xe thật.
2. Khi bánh đang quay, gửi LOCK_ENGINE.
3. Dừng bánh trên 4 giây, bảo đảm sensor còn mới, gửi lại lệnh.
4. Rút UART B→A, chờ stale rồi gửi LOCK_ENGINE.
5. Gửi SIREN_ON/OFF.

**Kết quả mong đợi:** đang quay bị `SPEED_NOT_ZERO`; sensor stale bị từ chối; chỉ điều kiện an toàn mới EXECUTED. Quay video/đồng hồ đo để chứng minh relay/còi thực sự đổi trạng thái—ACK một mình chưa đủ.

### C05 — Gateway offline và phục hồi

1. Khi app đang nhận telemetry, tắt Node A hoặc ngắt MQTT.
2. Chờ LWT/timeout, quan sát app và push.
3. Bật lại Node A và chờ telemetry mới.

**Kết quả mong đợi:** app báo gateway offline đúng thời điểm; không tiếp tục trình bày dữ liệu cũ như realtime; trạng thái phục hồi sau telemetry mới.

## 6. Mẫu ghi kết quả từng ca

```text
ID:
Trạng thái: PASS | FAIL | BLOCKED | CHƯA CHẠY
Thời gian/người test:
Thiết bị và kiểu build:
Commit mobile/backend/firmware:
Dữ liệu test (không ghi secret):
Expected:
Actual:
Evidence (ảnh/video/log):
Issue/ghi chú:
```

## 7. Tiêu chí kết thúc phiên

- Smoke test: A01–A04 không còn lỗi crash/blocker.
- Nghiệm thu phần mềm: B01–B12 PASS; lỗi quyền phải được backend chặn, không chỉ ẩn nút trên UI.
- Nghiệm thu push: C01 PASS trên development/production build, không dùng Expo Go.
- Nghiệm thu phần cứng: C02–C05 có video/log đồng thời; báo cáo rõ kết quả chưa chạy hoặc thất bại.
- Nếu có FAIL, ghi bước tái hiện ngắn nhất, Actual, ảnh/log và commit; không đổi thành PASS chỉ vì chạy lại không gặp lỗi.
