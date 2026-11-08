# Tổng hợp tính năng và kịch bản test hiện tại

Cập nhật 26/10/2026 theo source local. Phạm vi: mô hình IoT breadboard hai node, backend, web và mobile. Đây là danh sách **hành vi cần kiểm tra**, không phải khẳng định toàn bộ hardware/mobile đã PASS.

Người dùng đã xác nhận mở được app và đăng nhập. Chưa có kết quả mới được gửi cho các ca hardware → mobile bên dưới. Kiểm tra phần mềm đã ghi nhận: mobile 43 tests/lint/typecheck và Android JS bundle ngày 26/10; backend 24 tests và 15 ca app web/backend/MQTT emulator ngày 25/10. Emulator không thay bằng chứng board thật.

## 1. Bảo vệ dùng để làm gì?

**Bật bảo vệ / ARM là canh giữ xe khi đỗ.** Node A chỉ nhận khi dữ liệu cảm biến còn mới, tốc độ hợp lệ, bánh đã không có xung ít nhất 4 giây và dữ liệu counter Hall còn mới. Khi ARM được thực thi, relay ngắt motor. Sau đó rung lắc MPU hoặc bánh quay đủ ngưỡng sẽ tạo cảnh báo; trong ARMED sự kiện có thể chuyển hệ thống sang ALARM, còi/LED báo động.

**Khóa động cơ / LOCK_ENGINE** là yêu cầu khóa tải riêng: cần nhập lại mật khẩu trên app và firmware vẫn kiểm tra điều kiện dừng/dữ liệu mới. Khóa thành công chuyển THEFT_LOCK. **Cảnh báo quá tốc độ** là chức năng khác: chỉ báo, không tự cắt motor.

| Trạng thái | Ý nghĩa trên mô hình | Điều cần nhớ khi test |
|---|---|---|
| PARKED | Chưa bật canh giữ | Bánh vẫn có thể quay; PARKED không chứng minh tốc độ bằng 0 |
| ARMED | Đã bật bảo vệ, motor bị ngắt | Theo dõi rung lắc và quay bánh; cần tác động thủ công để thử Hall khi motor đã bị cắt |
| ALARM | Đang báo động | Còi/LED báo; sau ≥15 giây, nếu điều kiện khóa an toàn hợp lệ thì tự chuyển THEFT_LOCK |
| THEFT_LOCK | Motor bị khóa/ngắt | Mở khóa bằng UNLOCK_ENGINE hoặc DISARM; SIREN_OFF không tự mở khóa trạng thái này |

DISARM và UNLOCK_ENGINE về PARKED, bỏ còi thủ công và cấp motor trở lại. SIREN_OFF từ ALARM trở về ARMED, không phải DISARM. Còi trong THEFT_LOCK được điều khiển theo trạng thái nên có thể vẫn báo dù gửi SIREN_OFF.

Đây là logic mô hình học phần, không phải hệ thống chống trộm đã nghiệm thu cho xe thật. Thuật toán MPU phát hiện ngã theo ngưỡng/thời gian; không khẳng định phân loại tai nạn chính xác trong mọi tình huống.

## 2. Toàn bộ nhóm tính năng hiện có

| Nhóm | Tính năng trong source | Cách thử hiện tại |
|---|---|---|
| Tài khoản | Đăng ký Owner/Viewer, đăng nhập, phục hồi phiên, refresh token, logout, đổi mật khẩu | Có backend, chưa cần board |
| Phân quyền | Owner/Admin điều khiển/cấu hình/reset/xử lý cảnh báo; Viewer xem và xác nhận đã xem | Dùng tài khoản và quyền trên từng thiết bị |
| Thiết bị | Danh sách/chọn xe, xem chi tiết, sửa tên/biển số/model, thêm/gỡ Viewer | Có backend; hardware không cần cho metadata |
| Onboarding | Quét QR claim token hoặc nhập thủ công để nhận thiết bị | Cần thiết bị chưa được claim và token hợp lệ; QR native cần camera |
| Telemetry | Dashboard tốc độ Hall, gia tốc MPU, trạng thái gateway/sensor/GPS, nguồn dữ liệu | HARDWARE cần cả hai node; SIMULATED là dữ liệu thử riêng |
| Hall | Tốc độ, nhận biết dừng, xung/vòng và quy đổi quãng đường | Node B + Hall; gửi UART sang Node A |
| Phiên quay bánh | Số xung, số vòng, quãng đường, max speed, thời gian phiên/thời gian có xung; reset qua ACK | Đúng firmware mới trên cả hai node |
| Bảo vệ | ARM/DISARM; phát hiện rung hoặc bánh quay khi ARMED | Hai node, Hall/MPU, relay/còi nếu kiểm tra tải thực |
| Khóa motor | LOCK_ENGINE/UNLOCK_ENGINE, xác nhận mật khẩu và interlock firmware | Hai node và mạch relay/motor |
| Còi và reboot | SIREN_ON/SIREN_OFF, khởi động lại Node A có kiểm tra điều kiện dừng | Node A; cần còi thật nếu xác nhận âm thanh |
| Cảnh báo MPU | Rung lắc khi ARMED; nghiêng/ngã theo ngưỡng và thời gian | MPU thật; thử nhẹ trên mô hình, không cần gây va đập |
| Cảnh báo tốc độ | Vượt ngưỡng firmware, giữ thời gian, hysteresis và hạn chế gửi lặp | Hall thật; mặc định >2 km/h trong ≥2 giây |
| GPS | NEO-6M thật, FIX/NO_FIX/STALE, giữ vị trí hợp lệ cuối, bản đồ | Node B/GPS; FIX thật cần nơi thu được vệ tinh, bản đồ cần runtime/config tương ứng |
| Lệnh hai chiều | REST → MQTT → firmware → ACK → DB/realtime; PENDING/EXECUTED/REJECTED/TIMEOUT, nhận diện ACK muộn | Lệnh vật lý phải đối chiếu cả tải và ACK |
| Cảnh báo trong app/web | Danh sách, mức độ, lọc xe, Đã xem, Đánh dấu xử lý và ghi nội dung | Cảnh báo thật cần sự kiện từ board; dữ liệu có sẵn chỉ chứng minh màn hình |
| Lịch sử | Lịch sử telemetry/lệnh, khoảng 1h/24h/7d, biểu đồ, xuất/chia sẻ CSV | Cần dữ liệu trong DB đang dùng; API giới hạn 5.000 mẫu/truy vấn |
| Quản trị | Admin xem user/device/audit, khóa/mở tài khoản khác | Không cần board; không khóa tài khoản duy nhất đang dùng demo |
| Realtime và phục hồi | STOMP, snapshot sau reconnect, REST fallback foreground 5 giây, stale, tách gateway online/sensor mới | Có backend; mất mạng/board thử ở các ca riêng |
| Tầng firmware | FreeRTOS, UART checksum/parser/heartbeat, GPS task riêng, MQTT/đường điều khiển hai chiều | Host test/biên dịch khác với thử board vật lý |
| Lưu dữ liệu | Telemetry/alert/command/user lưu DB; launcher dùng H2 file riêng; triển khai nhóm có PostgreSQL/Flyway | H2 file không phải cloud DB; lịch sử phiên bánh không có bảng lưu riêng |
| Push hệ thống | Backend token/ticket/receipt và luồng notification native | Có source, nhưng launcher tắt và Expo Go bỏ qua SDK; cần native build/EAS/FCM/APNs để thử |

**Chưa có trên hardware:** điều tốc/PWM tự giới hạn tốc độ, geofence, cảm biến pin/ADC đã hiệu chuẩn, ngưỡng từ app được áp xuống firmware. Điện áp HARDWARE chưa đo phải là null/chưa đo; cảnh báo pin từ SIMULATED không chứng minh đã đo pin thật. Dashboard có map không đồng nghĩa đã có geofence.

## 3. Chuẩn bị đúng trước khi thử

1. Nếu chỉ thử tài khoản/giao diện/metadata/lịch sử có sẵn, không cần bật board. Muốn dữ liệu/điều khiển thật, bật cả Node A và Node B, giữ UART/GND và mạch cảm biến đúng sơ đồ; cấp nguồn tải motor/còi khi kiểm tra tải đó.
2. Dùng firmware `firmware/node_b_sensor/node_b_sensor.ino` và `firmware/node_a_gateway/node_a_gateway.ino`, đã có MSG_WHEEL_SAMPLE; không dùng sketch gps_bringup khi chạy hệ thống. Nếu đã nạp đúng bản này thì không cần nạp lại chỉ để mở app.
3. Chạy `deployment/start-mobile-demo.bat`; sau lỗi cache cũ dùng `start-mobile-demo.bat -ClearCache`. Giữ cửa sổ chạy. Laptop/điện thoại cùng LAN; Node A và backend truy cập cùng broker. Chi tiết: [chạy trên lớp](CHAY-MOBILE-TREN-LOP.md).
4. Đăng nhập Owner, chọn **HARDWARE** có deviceUuid khớp Node A. Phải thấy gateway online, sensor mới và phiên bánh có dữ liệu trước khi thử các lệnh.
5. Chọn thiết bị SIMULATED chỉ khi muốn thử phần mô phỏng; luôn ghi rõ nguồn trong Actual/video. Metadata của HARDWARE không phải kênh cấu hình ngưỡng firmware.
6. Cấu hình hiện tại cấp motor sau boot, ARM cắt motor, DISARM/UNLOCK cấp lại. Chuẩn bị khoảng trống cho bánh trước thao tác điều khiển/reboot. Dừng motor bằng cách điều khiển nguồn tải phù hợp, không giữ bánh bằng tay khi motor đang được cấp điện.

## 4. Kịch bản test phần cứng với mobile

Các dòng dưới đây chưa được đánh PASS chỉ từ việc đăng nhập thành công. Ca A01–A16 ưu tiên để chốt demo; A17–A19 là kiểm tra phục hồi bổ sung.

| ID | Thao tác | Kết quả mong đợi / dấu hiệu đánh giá |
|---|---|---|
| A01 | Bật hai node, chọn HARDWARE đúng UUID | Gateway online, sensor mới, phiên bánh nhận dữ liệu. Chưa có GPS FIX vẫn được thử phần còn lại |
| A02 | Giữ bánh đứng yên ≥4 giây, rồi quay cho nam châm qua Hall nhiều lần | Tốc độ thay đổi khi đã đủ chu kỳ hợp lệ; dừng đủ thời gian thì về 0; một xung đơn không được tạo tốc độ giả |
| A03 | Bắt đầu phiên mới, chờ ACK rồi quay chậm 10 vòng | Với 1 xung/vòng, tăng khoảng 10 xung và 2,042 m; đối chiếu gia tăng sau mốc reset, không lấy xung trước phiên |
| A04 | Bấm Bắt đầu phiên mới khi sensor/phiên còn mới | Lệnh PENDING → ACK EXECUTED, session mới; số xung/quãng đường/max speed về 0 rồi tiếp tục tăng khi quay. Không tự hiển thị thành công trước ACK |
| A05 | Trong PARKED, duy trì tốc độ >2 km/h ≥2 giây dữ liệu hợp lệ | Cảnh báo vượt tốc độ/nhãn trong phiên và danh sách cảnh báo; motor không tự ngắt vì overspeed |
| A06 | Giảm tốc ≤1,5 km/h ≥2 giây; sau đó vượt ngưỡng lại | Hết trạng thái vượt ngưỡng rồi có thể cảnh báo đợt mới; giữ vượt ngưỡng liên tục không tạo spam mỗi bản tin |
| A07 | Dừng motor, giữ hai node chạy, chờ bánh không có xung ≥4 giây; bấm Bật bảo vệ | ACK EXECUTED, ARMED, relay ngắt motor. ARM khi quay/stale phải bị từ chối, không bỏ qua interlock |
| A08 | Trong ARMED, quay bánh thủ công tạo ≥3 xung Hall trong cửa sổ 3 giây | Cảnh báo bánh quay khi canh giữ, ALARM, còi/LED báo nếu đã đấu; chuyển động này không cần GPS FIX |
| A09 | Sau A08, cho bánh dừng, giữ dữ liệu mới và đợi ≥15 giây kể từ ALARM | Tự chuyển THEFT_LOCK khi lock guard hợp lệ; nếu sensor stale hoặc còn quay thì chưa được chuyển chỉ vì hết thời gian |
| A10 | Bấm Tắt bảo vệ hoặc Mở khóa động cơ | ACK EXECUTED, PARKED, tải motor được cấp lại; kiểm tra tải thật ngoài việc nhìn state |
| A11 | ARM lại khi đã dừng; rung cụm MPU đủ để vượt ngưỡng liên tiếp | Có cảnh báo rung và ALARM. Không yêu cầu rung nhẹ bất kỳ cũng báo: firmware có debounce 3 mẫu, cooldown |
| A12 | DISARM để về PARKED, nghiêng MPU >50° liên tục trên 2 giây; đưa về thẳng sau thử | Có FALL_DETECTED. Khi tốc độ hợp lệ ≤2 km/h, nhánh xác nhận có thể nhận sau ≥0,5 giây nghiêng. Trong PARKED, alert ngã không có nghĩa tự bật canh giữ |
| A13 | Đang quay bánh: gửi Khóa động cơ, nhập lại mật khẩu đúng | REJECTED/SPEED_NOT_ZERO; relay không được ngắt do lệnh khóa này. Nếu UI/backend chặn trước thì ghi đúng tầng chặn, không tính là đã thấy ACK firmware |
| A14 | Dừng đủ thời gian, sensor mới; gửi Khóa động cơ rồi Mở khóa động cơ | LOCK → THEFT_LOCK/ngắt tải; UNLOCK → PARKED/cấp tải. Mật khẩu sai phải bị từ chối trước khi thực thi |
| A15 | Trong PARKED, bấm Bật còi rồi Tắt còi | Còi thủ công bật/tắt, không cần đổi state sang ALARM. Trong ALARM/THEFT_LOCK phải đối chiếu quy tắc trạng thái ở mục 1 |
| A16 | Kiểm tra GPS trong nhà; sau đó ở nơi thu được vệ tinh, rồi đưa vào vùng mất tín hiệu | Chưa từng FIX: NO_FIX, không marker 0,0. FIX thật: tọa độ hợp lý; mất fix: stale/last-known, không báo vị trí cuối là vị trí mới |
| A17 | Tắt nguồn Node B, giữ Node A chạy; thử ARM/LOCK/reset nếu giao diện cho gửi | Sensor/phiên trở thành stale; reset bị khóa hoặc bị từ chối; ARM/LOCK không dùng tốc độ cũ để quyết định. Bật lại Node B phải phục hồi; boot Node B mở phiên mới |
| A18 | Tắt Node A, giữ backend/app chạy; sau đó bật lại | Gateway chuyển offline qua LWT hoặc timeout mặc định khoảng 45 giây cộng nhịp kiểm tra; có thể sớm hơn nếu LWT. Không nhầm với hạn 5 giây sensor/UI. Khi trở lại phải nhận dữ liệu mới |
| A19 | Khi bánh đã dừng và dữ liệu mới, gửi Khởi động lại | Có ACK trước restart; Node A khởi động lại, phiên bánh mới. Cấu hình boot hiện tại có thể cấp motor trở lại; thử reboot cuối cùng khi đã chuẩn bị tải |

Các ngưỡng trên đối chiếu [tài liệu Hall](BA-TINH-NANG-HALL-VA-TOC-DO.md), `guardian_config.h`, `wheel_activity.h` và ControlTask/ProcessingTask hiện tại. Bánh 6,5 cm, chu vi 0,20420352 m, giả định 1 xung/vòng. Nếu motor không đạt ngưỡng thì ghi tốc độ đo được; không tăng nguồn quá định mức để cố kích hoạt cảnh báo.

## 5. Kịch bản app/backend, không bắt buộc bật board

Một số ca dùng lại dữ liệu đã tạo ở phần A. Để xác nhận backend/frontend/mobile cùng hệ thống, phải trỏ chúng tới **cùng backend/DB và cùng thiết bị**, không so app dùng H2 cổng 8082 với web đang dùng DB khác rồi kết luận realtime lỗi.

| ID | Thao tác | Mong đợi / điều kiện |
|---|---|---|
| B01 | Login Owner, đóng/mở app, logout và login lại | Đúng tài khoản, phiên phục hồi hợp lệ, logout về login. Người dùng mới xác nhận bước login, chưa xác nhận toàn bộ ca |
| B02 | Đăng nhập Viewer có quyền xe | Xem dữ liệu/cảnh báo, Đã xem; không được control/reset/config/resolve. Khi dùng DB demo mới, Viewer seed có cùng mật khẩu thiết lập ban đầu |
| B03 | Khi telemetry vẫn cập nhật, sửa tên/biển số/model và chờ vài giây trước lưu | Nội dung đang nhập không bị ghi đè; lưu HARDWARE thành công mà không gửi threshold. Ngưỡng phần cứng chỉ đọc |
| B04 | Owner thêm Viewer, gỡ rồi cấp lại; kiểm tra trên phiên Viewer khác | Nhìn thấy thiết bị khi có quyền, mất dữ liệu/quyền khi bị gỡ, được cấp lại thì thấy lại; có backend và tài khoản Viewer hợp lệ |
| B05 | Mở cảnh báo đã tạo ở phần A, lọc xe, bấm Đã xem và Đánh dấu xử lý | Đúng xe/nguồn/mức độ/thời gian; cập nhật ACKNOWLEDGED/RESOLVED theo backend và lưu nội dung. Xử lý bản ghi không đồng nghĩa tắt còi/relay trên board |
| B06 | Xem lịch sử 1h/24h/7d, xuất/chia sẻ CSV | Dữ liệu khớp DB đang dùng, không tạo giá trị pin/GPS giả khi null. Tối đa 5.000 mẫu/truy vấn. Wheel session RAM không có lịch sử phiên riêng trong DB |
| B07 | Tạo tài khoản thử và đổi mật khẩu | Kiểm tra login bằng mật khẩu mới/cũ đúng kỳ vọng. Nếu đổi mật khẩu user demo, lần sau đăng nhập dùng mật khẩu mới; seed không reset user cũ |
| B08 | Onboard thiết bị chưa claim bằng QR hoặc token thủ công | Tên xe và token hợp lệ tạo ownership; token dùng lại bị từ chối. Không claim lại xe HARDWARE đã sở hữu chỉ để thử camera |
| B09 | Login Admin, xem user/device/audit; khóa rồi mở một tài khoản thử khác | Chỉ Admin được truy cập; trạng thái user/audit cập nhật. Không khóa tài khoản duy nhất phục vụ buổi demo |
| B10 | Tắt/bật Wi-Fi điện thoại rồi mở lại app | Hiển thị mất kết nối/stale phù hợp; mạng trở lại lấy snapshot và realtime mới, không tự gửi lại lệnh điều khiển |
| B11 | Chặn riêng WebSocket nhưng giữ REST hoạt động bằng môi trường kiểm thử phù hợp | App foreground vẫn cập nhật bằng polling khoảng 5 giây; tắt Wi-Fi hoàn toàn không kiểm tra được REST fallback này |
| B12 | Làm mất đường ACK khi backend vẫn cho phép gửi; theo dõi lệnh, rồi cho ACK muộn | Mặc định khoảng 10 giây không ACK → TIMEOUT, không tự giả EXECUTED; ACK muộn ghi riêng. Cần môi trường kiểm soát ACK; chỉ để thiết bị offline rồi thấy nút bị khóa không bao phủ ca này |
| B13 | Mở web và mobile cùng backend, tác động Hall/alert hoặc sửa metadata | Cùng dữ liệu/trạng thái/ID lệnh; web không tự đồng bộ nếu nó đang trỏ vào một backend khác |
| B14 | Dừng launcher bằng Ctrl+C rồi mở lại | Tài khoản/metadata/lịch sử đã commit trong H2 file còn; IP LAN tự nhận lại. Phiên bánh phụ thuộc RAM node và snapshot mới từ MQTT, không phải DB H2 |

**Push foreground/background/cold start và tap notification:** hoãn khỏi lượt Expo Go hiện tại. Chạy khi có native build và EAS/FCM/APNs đúng cấu hình; kiểm tra thêm logout/thu hồi quyền/tap push cũ. Tham chiếu M15–M19 trong [checklist mobile](NGHIEM-THU-MOBILE-TRUC-TIEP.md). Không báo điện thoại đã nhận push chỉ vì thấy alert trong tab Cảnh báo.

## 6. Thứ tự nên làm ngay

1. A01–A04: online, Hall, số liệu phiên và reset.
2. A05–A06: quá tốc độ và hết vượt ngưỡng.
3. A07–A10: bật bảo vệ → quay bánh → ALARM → tự khóa khi đủ điều kiện → mở khóa.
4. A11–A15: MPU, khóa khi đang quay/dừng, còi.
5. B03, B05, B06: metadata, xử lý cảnh báo, lịch sử/CSV.
6. A17–A19 và B10/B14: mất node, reconnect, restart, dữ liệu còn sau mở lại.
7. GPS FIX thật và các ca quyền/onboard/admin/push thực hiện riêng khi có điều kiện.

Nếu chỉ có khoảng 5 phút để thử với nhóm: A01 → A02/A03 → A04 → A07/A08 → A10 → B05/B06. Đây là kịch bản test ngắn hiện tại, không thay kịch bản slide/thuyết trình 10 phút.

## 7. Ghi kết quả thật

Giữ phân biệt: **đã có source**, **đã test phần mềm**, **người dùng xác nhận**, **đã có video/log board thật**. Không đổi ca chưa làm thành PASS.

| ID | Actual | PASS/FAIL/CHƯA CHẠY | Evidence/thời gian/người thử |
|---|---|---|---|
| Login trong B01 | Người dùng xác nhận đăng nhập mobile được ngày 26/10/2026; chưa ghi model/OS và chưa thử hết phục hồi phiên/logout | Đã xác nhận riêng bước login; B01 chưa đóng toàn bộ | Hội thoại; chưa có video/log |
| A01–A19 | Chưa nhận kết quả mới cho luồng board → mobile | CHƯA CHẠY theo hồ sơ này | Điền khi thử |
| B02–B14 | Chưa nhận kết quả manual trên điện thoại cho các ca tương ứng | CHƯA CHẠY theo hồ sơ này | Không thay bằng kết quả emulator |

Mỗi ca nên ghi: model điện thoại/OS, build Expo Go/native, phiên bản code/firmware đã nạp, deviceUuid, thời điểm, thao tác, Actual và ảnh/video. Lệnh cần cùng cmd_id giữa app/backend/MQTT/firmware nếu đối chiếu log. Che mật khẩu/token trước khi chia sẻ. Video nên thấy bánh/motor và màn hình điện thoại cùng lúc; thao tác ngã chỉ nghiêng module, không gây va đập vào board/breadboard.

Tài liệu liên quan: [chạy mobile](HUONG-DAN-CAI-DAT-VA-CHAY-MOBILE.md), [chạy trên lớp](CHAY-MOBILE-TREN-LOP.md), [đấu nối](../hardware/SO-DO-DAU-NOI-PHAN-CUNG.md), [nghiệm thu mobile](NGHIEM-THU-MOBILE-TRUC-TIEP.md), [nghiệm thu hardware/firmware](NGHIEM-THU-HARDWARE-FIRMWARE.md).
