# Phân công 4 thành viên theo nội dung kỹ thuật IoT

Cập nhật 26/10/2026 cho Smart Motorbike Guardian. Bản này thay phương án chia đơn thuần hardware / backend / web / mobile. Mỗi người phụ trách một khối IoT có nội dung thiết kế, công việc kỹ thuật, phép thử và phần báo cáo rõ ràng.

**TV1 là bạn, tiếp tục phụ trách hardware/firmware đã chốt. TV3 nhận phần xử lý dữ liệu IoT ở backend và web giám sát. Công việc ghép báo cáo là việc chung, không dùng để thay phần kỹ thuật của bất kỳ ai.**

Đây là phân công trách nhiệm từ hiện tại, không phải khẳng định ai đã viết toàn bộ code phần đó trước đây. Tên tác giả/tỷ lệ đóng góp cuối cùng ghi theo việc thực tế và xác nhận của nhóm.

## 1. Bốn khối IoT và phạm vi phụ trách

| Thành viên | Khối IoT phụ trách | Công việc kỹ thuật chính | Giao diện hỗ trợ |
|---|---|---|---|
| **TV1 — bạn** | **Thiết bị cảm nhận, xử lý tại biên và chấp hành** | Phần cứng/nguồn; firmware Node B và Node A; Hall/MPU/GPS; FreeRTOS/UART; state machine; interlock; relay/còi | Serial/log và quan sát tải thật |
| **TV2** | **Truyền thông IoT, hạ tầng server và lưu trữ** | Wi-Fi/MQTT phía broker/server; topic/payload; nhận/lưu dữ liệu; schema/ERD/Flyway; H2/PostgreSQL; Docker và môi trường triển khai | API/health/log và công cụ kiểm tra MQTT |
| **TV3** | **Xử lý dữ liệu IoT, realtime và giám sát** | Kiểm tra tính hợp lệ/độ mới; online/offline; GPS last-known; wheel session; phân phối sự kiện realtime; quản lý cảnh báo và web giám sát | Web React |
| **TV4** | **Điều khiển IoT hai chiều, quyền truy cập và thông báo** | Luồng command/ACK/timeout; quyền trên thiết bị; xác nhận lệnh; push server/client; tích hợp và kiểm thử trên điện thoại | Mobile Expo/React Native |

Bốn tuyến trách nhiệm để giải thích khi bảo vệ:

- TV1: **đại lượng vật lý → mẫu đo/sự kiện → đầu ra chấp hành**.
- TV2: **bản tin thiết bị → MQTT → server/database**, cùng môi trường triển khai.
- TV3: **dữ liệu đã nhận → đánh giá độ mới/sự kiện → trạng thái giám sát realtime**.
- TV4: **người dùng → yêu cầu điều khiển → thiết bị → ACK/thông báo quay về**.

Không cần di chuyển file hay viết lại kiến trúc để chia người. Backend hiện có nhiều chức năng, được chia trách nhiệm giữa TV2/TV3/TV4 theo luồng; frontend/mobile là nơi thể hiện kết quả IoT của các phần đó.

## 2. TV1 — thiết bị, firmware và chấp hành

**Phần việc**

1. Chốt board/module, nguồn, bảng chân và sơ đồ đấu nối; ảnh testbed phải là mạch thật của nhóm.
2. Phụ trách firmware hai node: FreeRTOS, task/queue/mutex, UART framing/checksum/heartbeat và GPS task độc lập.
3. Giải thích và kiểm chứng Hall: xung/vòng, chu vi bánh 6,5 cm, tốc độ/dừng; MPU: rung/nghiêng, debounce/cooldown; GPS: FIX/NO_FIX/STALE.
4. Phụ trách quyết định tại thiết bị: PARKED/ARMED/ALARM/THEFT_LOCK, điều kiện ARM/LOCK/REBOOT, cảnh báo quá tốc độ, relay/còi và ACK firmware.
5. Bàn giao payload/đơn vị/ý nghĩa trường cho TV2; giữ đồng bộ canonical firmware và mirror. Hỗ trợ TV3/TV4 đối chiếu tình huống vật lý với dữ liệu/ACK.

**Kết quả bàn giao:** bảng linh kiện/nguồn/pinout; sơ đồ hai node, task và state machine; bảng UART (telemetry 39 B, wheel sample 13 B); mô tả thuật toán; bảng thử và ảnh/log của Hall/MPU/GPS/relay.

**Câu hỏi phải tự trả lời:** số đo từ đâu ra; vì sao cần task riêng; biết tốc độ cũ bằng cách nào; tại sao lệnh bị từ chối; ACK firmware khác quan sát tải thật thế nào.

## 3. TV2 — MQTT, server, database và triển khai

**Phần việc**

1. Chốt broker và kết nối MQTT, topic telemetry/alert/status/command/ACK/wheel_session, ánh xạ deviceUuid và cấu hình môi trường.
2. Phụ trách đường nhận/giải mã/chuyển dữ liệu vào các service; phối hợp TV1 để không sai trường, đơn vị và nguồn HARDWARE/SIMULATED.
3. Phụ trách database/schema/migration, mô hình quan hệ, lưu và truy vấn telemetry/alert/command; phân biệt dữ liệu lưu DB với snapshot RAM.
4. Chuẩn hóa môi trường chạy backend/DB/broker, Docker và health check; bàn giao URL dùng chung cho các ứng dụng.
5. Kiểm tra các tình huống kết nối/lưu trữ: broker gián đoạn, bản tin lỗi, khởi động lại backend/DB, dữ liệu còn hay mất và cách xác minh.

**Ranh giới:** TV2 chịu đường nhận/lưu và hạ tầng. Luật độ mới, trạng thái giám sát và event realtime thuộc TV3. Nghiệp vụ gửi lệnh/ACK, quyền điều khiển và push thuộc TV4. Các API dùng chung phối hợp theo chức năng, không một người ôm toàn bộ backend.

**Kết quả bàn giao:** sơ đồ mạng/triển khai; bảng topic/payload; sequence nhận/lưu; ERD và mô tả migration; cấu hình chạy đã che secret; kết quả thử MQTT/DB.

**Câu hỏi phải tự trả lời:** MQTT phục vụ việc gì; khác REST/STOMP ở đâu; dữ liệu lưu ở đâu; khi nào dùng H2/PostgreSQL; broker từ xa có đồng nghĩa backend/DB đã lên cloud không.

## 4. TV3 — xử lý dữ liệu IoT, cảnh báo, realtime và web

**Phần việc kỹ thuật IoT**

1. Chốt ý nghĩa dữ liệu hợp lệ, null và stale; phân biệt gateway online với sensorConnected, GPS FIX với last-known. Phối hợp TV1/TV2 về timestamp và thời gian hết hạn.
2. Phụ trách trạng thái giám sát ở server: dữ liệu sensor quá hạn, gateway offline/phục hồi, giữ vị trí GPS cuối nhưng không coi là vị trí mới.
3. Phụ trách snapshot wheel session: thứ tự bản tin, phiên mới/reset, freshness; web hiển thị số xung/vòng/quãng đường/max speed theo dữ liệu thiết bị.
4. Phụ trách tiếp nhận và quản lý sự kiện/cảnh báo tại tầng xử lý: nguồn, mức độ, trạng thái đã xem/đã xử lý, thông tin thời điểm. Phân biệt cập nhật bản ghi cảnh báo với lệnh tắt còi trên board.
5. Phụ trách REST snapshot/STOMP realtime cho giám sát, chống snapshot cũ ghi đè event mới, phục hồi sau reconnect và kiểm thử cập nhật đồng bộ.
6. Hoàn thiện web React cho các nội dung trên: dashboard, bản đồ, cảnh báo, lịch sử/CSV và các màn hình đang có.

**Ranh giới:** thuật toán phát hiện rung/ngã/Hall hiện chạy trong firmware do TV1 phụ trách. TV3 chịu cách server tiếp nhận, đánh giá độ mới, phân phối và trình bày sự kiện; không viết báo cáo như thể server đang tính lại thuật toán MPU. TV4 dùng contract realtime do TV3 thống nhất để cập nhật mobile.

**Kết quả bàn giao:** sơ đồ xử lý telemetry/event; bảng freshness/online/offline; sequence snapshot + realtime; mô tả wheel session và alert; ảnh web có nhãn nguồn; kết quả thử dữ liệu cũ, reconnect, thứ tự bản tin và mất node.

**Câu hỏi phải tự trả lời:** vì sao có tọa độ mà GPS vẫn stale; vì sao gateway online nhưng sensor mất; xử lý snapshot cũ thế nào; cảnh báo trùng/phiên cũ ảnh hưởng giao diện ra sao; thay đổi status cảnh báo có tắt còi không.

Đây là phần xử lý dữ liệu và vận hành realtime của hệ thống IoT; thiết kế web là một đầu ra của phần việc này.

## 5. TV4 — điều khiển hai chiều, quyền thiết bị, thông báo và mobile

**Phần việc kỹ thuật IoT**

1. Phụ trách đường điều khiển phía dịch vụ/ứng dụng: nhận yêu cầu, kiểm tra quyền, tạo cmd_id, lưu PENDING và chuyển lệnh qua bộ truyền MQTT của TV2.
2. Phụ trách xử lý ACK/REJECTED/TIMEOUT/ACK muộn và cách phản hồi cho người dùng; phối hợp TV1 về reason/interlock và TV3 về event cập nhật.
3. Phụ trách quyền Owner/Viewer/Admin và ownership cho xem dữ liệu/điều khiển; LOCK cần xác nhận mật khẩu; kiểm thử gọi API không đủ quyền và thu hồi quyền.
4. Phụ trách thông báo: đăng ký/hủy token, push server sau commit, ticket/receipt và mobile routing/permission; phối hợp TV2 về hạ tầng/secret. Native push chưa thử thì ghi chưa nghiệm thu.
5. Phụ trách mobile: phiên đăng nhập, dashboard/GPS, control/ACK, wheel session/reset, alert, QR/CSV và những chức năng hiện có; dùng chung backend.
6. Kiểm thử trên điện thoại thật: đúng model/OS/build, mất mạng/đổi tài khoản, native module/Expo Go và phân biệt cảnh báo trong app với remote push.

**Ranh giới:** TV4 không tự thay điều kiện an toàn trong firmware hoặc đổi topic một phía. TV1 chốt quyết định tại thiết bị, TV2 chốt giao thức truyền, TV3 chốt contract cập nhật realtime. ACK hiện chứng minh firmware xử lý đầu ra, không tự chứng minh tiếp điểm relay hoặc motor đã dừng.

**Kết quả bàn giao:** sequence command/ACK; bảng trạng thái/reason; ma trận quyền thiết bị; luồng push; sơ đồ điều hướng và ảnh mobile; kết quả thử lệnh hợp lệ/bị chặn/timeout và quyền truy cập trên điện thoại.

**Câu hỏi phải tự trả lời:** gửi lệnh thành công khác thực thi ra sao; mất ACK xử lý thế nào; Viewer có thể gọi API khóa không; thông báo khi app đang mở khác push background ra sao.

## 6. Phân công trong source và cách tránh chồng chéo

| Phạm vi | Đầu mối | Thành phần liên quan hiện tại |
|---|---|---|
| Thiết bị/firmware | TV1 | hardware/, firmware/, node_a/, node_b/, tests/firmware/ |
| Nhận MQTT, DB, triển khai | TV2 | MqttSubscriberService, đường nhận/lưu telemetry, entity/repository/migration, database/, deployment/ |
| Tính hợp lệ dữ liệu và event giám sát | TV3 | DevicePresenceService, WheelSessionService, RealtimeService, AlertService, các API giám sát và frontend/ |
| Command/quyền/push/mobile | TV4 | CommandService, CommandDispatchService, CommandTimeoutService, auth/quyền thiết bị, PushNotificationService/transport và mobile/ |

Bảng trên là ranh giới trách nhiệm chức năng, không có nghĩa các lớp hoàn toàn độc lập. Với file chung như MqttSubscriberService, TelemetryService hoặc DeviceService: thống nhất người sửa và hợp đồng trước; tránh hai người đồng thời sửa cùng nhánh xử lý. Không đổi tên tác giả lịch sử hoặc tái chia commit chỉ để làm đẹp bảng phân công.

Ghép và định dạng báo cáo là việc hỗ trợ sau khi bốn phần đã có nội dung. Mỗi người chuẩn hóa phần mình theo cùng mẫu; có thể luân phiên người ghép, còn từng tác giả duyệt lại nội dung sau ghép.

## 7. Mỗi người phải có bốn ca kiểm thử sát IoT

Các ca dưới đây là phần việc cần thực hiện/đối chiếu, không phải kết quả đã PASS. Dùng kết quả phần mềm hiện có làm baseline và bổ sung Actual khi thử thực tế.

| Người | Bốn ca chịu trách nhiệm chính | Bằng chứng cần nộp |
|---|---|---|
| TV1 | Hall quay/dừng; MPU rung/nghiêng; GPS FIX/STALE; relay/interlock | Điều kiện đo/thao tác, log UART/firmware, ảnh/video tải/cảm biến |
| TV2 | Nhận đúng topic/payload; bản tin lỗi không làm sai dữ liệu; broker ngắt/phục hồi; DB khởi động lại và dữ liệu đã lưu | Log MQTT/server, bản ghi DB/API và cấu hình môi trường |
| TV3 | Sensor stale khi Node B mất; GPS last-known khi fix hết hạn; snapshot/realtime không rollback dữ liệu mới; wheel session/alert cập nhật đúng | Mốc thời gian, snapshot/event, ảnh web và Actual |
| TV4 | Lệnh hợp lệ có ACK; khóa khi quay/stale bị chặn; TIMEOUT/ACK muộn; Viewer/thu hồi quyền không điều khiển được | Cùng cmd_id qua các tầng, kết quả API/app và log firmware khi có board |

Ngoài bốn ca chính: TV3 kiểm tra các chức năng web, TV4 kiểm tra các chức năng mobile và push native khi đủ môi trường. Cả bốn cùng chạy một kịch bản end-to-end; người có module ở đoạn nào hỗ trợ xác minh đoạn đó.

Một bài thử mô phỏng/backend không thay nghiệm thu cảm biến/relay/điện thoại. Nếu cần đo độ trễ hoặc chạy lâu, cả nhóm thống nhất mốc đo rồi chia nhau ghi và phân tích; không để một người tự chứng nhận toàn hệ thống.

## 8. Chia nội dung báo cáo theo bốn khối IoT

Tên/số chương là đề xuất, điều chỉnh theo mẫu giảng viên nếu có.

| Phần báo cáo | Người viết chính | Nội dung |
|---|---|---|
| 1. Bài toán, mục tiêu và phạm vi | Cả nhóm | Bài toán bảo vệ/giám sát xe trên breadboard, yêu cầu, phạm vi và đóng góp thực tế |
| 2. Kiến trúc IoT tổng thể | TV2 tổng hợp, cả nhóm xác nhận | Thiết bị → mạng → xử lý/lưu → ứng dụng và chiều điều khiển; vị trí triển khai |
| 3. Thiết bị cảm nhận, xử lý tại biên và chấp hành | **TV1 — bạn** | Hardware/nguồn, hai node, FreeRTOS/UART, thuật toán cảm biến, state/interlock, kết quả thử |
| 4. Truyền thông IoT, hạ tầng và lưu trữ | **TV2** | MQTT/topic/payload, tiếp nhận/lưu, ERD/Flyway, server/DB/broker/deployment, kết quả thử |
| 5. Xử lý dữ liệu thời gian thực và giám sát | **TV3** | Chất lượng/freshness, online/offline, GPS last-known, wheel session, event/realtime, cảnh báo, web và kết quả thử |
| 6. Điều khiển IoT hai chiều và ứng dụng di động | **TV4** | Command/ACK, timeout/quyền, thông báo, mobile, kết quả thử điều khiển/điện thoại |
| 7. Tích hợp và đánh giá | Mỗi người viết kết quả phần mình | Cấu hình chung, bốn nhóm ca thử, kịch bản E2E, số đo có thật và giới hạn |
| 8. Kết luận, hướng phát triển | Cả nhóm | Những gì đã làm/đã nghiệm thu, phần đang chờ và kế hoạch vừa sức |
| Phụ lục/tài liệu tham khảo | Mỗi người cung cấp phần mình | Pinout/UART của TV1; topic/ERD của TV2; event/freshness của TV3; command/quyền của TV4 |

Mỗi phần kỹ thuật cần đủ: **mục đích → thiết kế/sơ đồ → triển khai → kiểm thử/Actual → giới hạn**. Không yêu cầu bốn phần có số trang bằng nhau; yêu cầu cả bốn có nội dung IoT và bằng chứng rõ.

## 9. Bàn giao để viết báo cáo và trả lời phản biện

Mỗi người gửi:

1. Nội dung kỹ thuật do mình hiểu và giải thích được, mô tả lý do thiết kế và giao tiếp với phần kế bên.
2. Ít nhất một sơ đồ chính cùng bảng thông số/contract liên quan.
3. Bảng Expected/Actual của bốn ca chính và chức năng bổ sung mình phụ trách; che secret trước khi chia sẻ.
4. Ảnh/log có thời gian, phiên bản code/firmware, nguồn thật/giả lập và môi trường thử.
5. Giới hạn/còn thiếu, nguồn docs/datasheet đã dùng và các câu hỏi phản biện ở mục 2–5.

Mức 25% mỗi người chỉ là mục tiêu cân bằng công việc dự kiến. Tỷ lệ đóng góp trong bản nộp điền theo việc thực tế được cả nhóm xác nhận. Việc đang có source không tự chứng minh một thành viên đã triển khai hoặc đã kiểm thử chức năng đó.

## 10. Thứ tự thực hiện phù hợp với lịch hiện tại

- Trước buổi 28/10: mỗi người hiểu khối IoT của mình, cùng rà soát sơ đồ/khẳng định trên slide; chưa cần ép nộp bản báo cáo định dạng cuối vì buổi này chưa yêu cầu báo cáo/source/demo.
- Sau khi chốt đề cương: bốn người viết bốn phần kỹ thuật song song, thống nhất contract và mẫu kết quả; ghép báo cáo là việc chung.
- Khi tích hợp: dùng cùng backend/DB và deviceUuid, chạy [kịch bản test](TONG-HOP-TINH-NANG-VA-KICH-BAN-TEST.md), chốt Actual trước khi viết kết luận.
- Trước nộp: TV1↔TV2 đối chiếu thiết bị/MQTT; TV2↔TV3 đối chiếu nhận/lưu/xử lý; TV3↔TV4 đối chiếu event/giám sát/điều khiển; cả nhóm duyệt kết luận và tỷ lệ đóng góp.

Tài liệu bắt đầu: [hardware/firmware](HUONG-DAN-HARDWARE-FIRMWARE-V2-GPS.md), [Hall và tốc độ](BA-TINH-NANG-HALL-VA-TOC-DO.md), [backend/realtime](REALTIME-BACKEND-FRONTEND.md), [tích hợp mobile](CAI-DAT-NGUONG-TOC-DO-WEB-MOBILE.md), [checklist mobile](NGHIEM-THU-MOBILE-TRUC-TIEP.md), [thuyết trình](CAU-TRUC-SLIDE-THUYET-TRINH-15-PHUT.md).

Đối chiếu source và evidence hiện tại khi viết: báo cáo cũ có thể còn thông số hoặc trạng thái không còn đúng. Không gọi H2 trên laptop là cloud DB, không coi alert trong app là push hệ thống, không coi ACK là đo tải vật lý, và không biến ca chưa chạy thành PASS.
