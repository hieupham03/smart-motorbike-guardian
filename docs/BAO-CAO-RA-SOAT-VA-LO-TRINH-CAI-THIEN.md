# Rà soát thực trạng và lộ trình cải thiện đồ án

**Dự án:** Smart Motorbike Guardian
**Phạm vi đánh giá:** đồ án môn IoT và Ứng dụng, nguyên mẫu chạy trên breadboard/testbed; không đánh giá như sản phẩm chống trộm thương mại.
**Cách đọc:** nội dung dựa trên mã nguồn và tài liệu đang có trong repository. Các chức năng cần xác nhận bằng thử nghiệm phần cứng được đánh dấu là chưa thể kết luận chỉ từ code.

## 1. Nhận định tổng thể

Đồ án có lợi thế là đã hình thành gần đủ các tầng của một hệ thống IoT: cảm biến và cơ cấu chấp hành, hai vi điều khiển, UART, MQTT, backend, cơ sở dữ liệu, giao diện và hướng dẫn đấu nối. Phạm vi này phù hợp để thể hiện kiến thức của môn học và có tiềm năng đạt điểm cao nếu nhóm chứng minh được luồng đầu-cuối bằng demo và số liệu kiểm thử.

Tuy nhiên, repository hiện nên được trình bày là **prototype đang tích hợp**, không phải hệ thống đã kiểm chứng hoàn chỉnh. Một số nội dung báo cáo khẳng định dữ liệu thật, TLS, bộ đệm không mất bản tin hoặc kết quả kiểm thử, trong khi triển khai hiện tại chưa chứng minh được các điều đó. Với đồ án môn học, không cần biến dự án thành sản phẩm thương mại; điều quan trọng hơn là thu hẹp phạm vi, làm đúng các chức năng cốt lõi, giải thích trung thực giới hạn và đưa ra bằng chứng đo được.

Không thể bảo đảm một mức điểm A/A+ khi chưa có rubric chính thức của giảng viên. Lộ trình dưới đây ưu tiên những việc dễ trình diễn, bám yêu cầu học phần và cải thiện rõ chất lượng kỹ thuật trong thời gian sinh viên có thể thực hiện.

## 2. Thứ tự ưu tiên đề xuất

| Mức | Việc cần làm | Vì sao đáng ưu tiên |
|---|---|---|
| **P0 — trước khi demo/nộp** | Chốt một cấu hình chạy duy nhất; xác minh firmware Node A ↔ Node B ↔ MQTT ↔ backend ↔ database ↔ dashboard bằng một luồng thực; sửa các khẳng định tài liệu không khớp code; không điều khiển motor/relay tải nguy hiểm trong lúc người đứng gần. | Tính đúng đắn và khả năng bảo vệ trực tiếp quan trọng hơn việc thêm nhiều tính năng. |
| **P1 — giá trị cao cho điểm** | Hoàn thiện GPS NEO-6M, hiển thị trạng thái fix/hết hạn; viết test case và lưu kết quả; xử lý lỗi UART/MQTT; siết các lỗ hổng phân quyền dễ khai thác. | Tạo được điểm nhấn phần cứng, thể hiện đủ tầng IoT, kiểm thử và hiểu bảo mật. |
| **P2 — nếu còn thời gian** | Tối ưu biểu đồ/truy vấn, bổ sung báo cáo benchmark, nâng cấp TLS/ACL ở broker local, làm dashboard đẹp và demo script. | Tăng độ chỉn chu nhưng không nên làm trước khi chức năng cốt lõi chạy ổn. |
| **Không cần cho mục tiêu môn học** | Kubernetes, cloud nhiều dịch vụ, InfluxDB nếu chưa có nhu cầu, OTA, mTLS, thiết kế sản xuất chịu rung/nhiệt/nhiễu, mobile app riêng. | Tốn thời gian, thêm rủi ro tích hợp và khó đem lại điểm tương ứng nếu rubric không yêu cầu. |

## 3. Các điểm cải thiện theo tầng

### 3.1. Phần cứng và testbed

**Hiện trạng quan sát được**

- Tài liệu nêu ESP32-WROOM làm gateway, ESP32-S3 làm sensor node, MPU6050, Hall, relay và buzzer; hiện đã có thêm module GPS NEO-6M-0-001 cần tích hợp.
- Sơ đồ đấu dây ghi LED ngoài ở GPIO19 trong khi firmware Node A điều khiển GPIO2. Sơ đồ cần phân biệt rõ LED onboard GPIO2 và LED ngoài nếu thật sự lắp cả hai.
- Nội dung về relay ghi module kích mức thấp. Trạng thái GPIO khi khởi động, reset và mất nguồn cần được kiểm tra trên chính module đang dùng; không suy luận trạng thái an toàn chỉ từ tên chân.

**Đề xuất vừa tầm**

1. Chụp ảnh testbed thật, ghi rõ model board/module, chân nối và điện áp đo được. Cập nhật sơ đồ đúng với bản firmware dùng khi bảo vệ.
2. Dùng nguồn USB riêng cho ESP32 và motor DC testbed; nối mass tham chiếu khi mạch cần chung GND. Không đấu relay vào mạch đánh lửa/ắc quy xe thật; thử cơ cấu chấp hành bằng tải testbed điện áp thấp và có người giám sát.
3. Kiểm tra điện áp đầu ra GPIO/UART và nguồn của module trước khi cắm. Với module GPS, xác minh đó là module trần hay breakout có regulator; hướng dẫn chi tiết nằm trong [quy trình tích hợp NEO-6M](./NEO-6M-001-TICH-HOP.md).
4. Nếu dùng motor, ưu tiên motor DC nhỏ ở breadboard, diode bảo vệ tải cảm nếu mạch cần, và relay có transistor/driver phù hợp. Không cấp dòng motor trực tiếp từ GPIO.
5. Dán nhãn TX/RX/GND và các rail nguồn; tránh dây chồng chéo để demo dễ giải thích và dễ tìm lỗi.

**Bằng chứng nên chuẩn bị:** ảnh toàn cảnh, ảnh cận cảnh chân GPS/ UART, bảng pinout cuối cùng, video ngắn cho thấy cảm biến thay đổi làm dữ liệu dashboard thay đổi.

### 3.2. Firmware và giao tiếp giữa hai node

**Hiện trạng quan sát được**

- Hai node có FreeRTOS task/queue, khung UART có start byte, type, length và XOR checksum; đây là nội dung tốt để trình bày.
- `parse_byte()` trong [uart_protocol.h](../node_a/uart_protocol.h) lưu trạng thái parser bằng biến `static`. Các nơi gọi parser dùng UART riêng, nhưng parser sẽ không tái sử dụng an toàn cho nhiều luồng UART trên cùng một chương trình nếu sau này mở rộng.
- Gói telemetry UART hiện không mang vị trí GPS. Các bản sao firmware trong `node_a/`, `node_b/` và `firmware/` đang giống nhau; thay đổi phải được đồng bộ và kiểm tra lại.
- Node B sinh gia tốc fallback khi MPU6050 chưa tìm thấy. Nếu giữ fallback để demo, cần hiện trạng thái **SIMULATED/FALLBACK** rõ ràng, không gọi đó là dữ liệu thật.
- Node A có kiểm tra tốc độ trước khi cắt relay, nhưng cần xử lý thêm trường hợp số đo cũ hoặc Node B mất heartbeat. Trong phạm vi breadboard, có thể trình bày như một interlock demo; không khẳng định là bảo vệ an toàn cho xe thật.

**Đề xuất vừa tầm**

1. Giữ giao thức UART đơn giản; thêm GPS vào cùng telemetry thay vì thêm giao thức/kênh phức tạp. Tăng version hoặc ghi rõ hai phía phải dùng chung kích thước struct.
2. Dùng `gps_valid` cùng thời điểm cập nhật/fix age; khi mất fix thì giữ last-known position nhưng phải đánh dấu dữ liệu cũ, không biến tọa độ cũ thành vị trí hiện tại.
3. Ở mỗi gói tin, kiểm tra `type`, `len`, checksum và phạm vi dữ liệu trước khi dùng; ghi log lỗi checksum/length có bộ đếm thay vì bỏ qua không dấu vết.
4. Thêm kiểm tra freshness của telemetry: nếu heartbeat/mẫu tốc độ quá cũ hoặc sensor node mất kết nối thì từ chối lệnh cắt relay và trả ACK có lý do cụ thể. Thử trên motor DC bàn, không thử trên xe.
5. Nếu `send_frame()` hoặc publish MQTT thất bại, ghi nhận kết quả và không báo thành công. Phân biệt “đã nhận lệnh”, “đã thực thi”, “đã ACK”.
6. Kiểm tra tràn hàng đợi: đếm số lần `xQueueSend()` thất bại cho event/telemetry và in thống kê định kỳ.
7. Đồng bộ mọi thay đổi firmware qua các thư mục mirror hoặc chọn một đường dẫn canonical, ghi rõ thư mục nào được nạp vào board.

**Bằng chứng nên chuẩn bị:** log UART hợp lệ/lỗi checksum, heartbeat mất rồi phục hồi, GPS có fix/mất fix, lệnh bị chặn khi tốc độ lớn hơn ngưỡng hoặc mẫu cảm biến stale.

### 3.3. Backend, API và phân quyền

**Hiện trạng quan sát được**

- Spring Boot tách controller/service/repository, có JWT, BCrypt, ownership và audit log.
- Luồng đăng ký nhận role từ request rồi dùng làm role của tài khoản. Endpoint simulator đang `permitAll`; các API mô phỏng có thể thay đổi trạng thái/tạo cảnh báo mà không kiểm tra người gọi sở hữu thiết bị. Đây là rủi ro dễ kiểm tra và nên ưu tiên hơn các biện pháp bảo mật nâng cao.
- Endpoint ghi telemetry REST là fallback nhưng hiện không yêu cầu xác thực thiết bị hoặc ownership. Đối với bài tập, nên khóa endpoint này hoặc ghi rõ là endpoint demo có bảo vệ.
- `LOCK_ENGINE` yêu cầu nhập lại mật khẩu, nhưng đây là step-up re-authentication, không phải 2FA. Đây là quyết định thuật ngữ đúng trong tài liệu.
- Có thể xác nhận lịch sử telemetry, nhưng khi truy vấn không có kết quả lại trả về 50 mẫu gần nhất; UI có thể vô tình hiển thị dữ liệu ngoài khoảng thời gian người dùng chọn.

**Đề xuất vừa tầm**

1. Không cho người dùng tự chọn ADMIN khi đăng ký công khai. Gán mặc định OWNER/VIEWER theo luồng hợp lý; tạo tài khoản Admin bằng seed hoặc cấu hình phát triển.
2. Bắt buộc JWT và kiểm tra quyền sở hữu cho các thao tác simulator; hoặc chỉ bật simulator trong profile demo/dev và không đưa lên cấu hình chạy mặc định.
3. Bảo vệ endpoint ghi telemetry bằng API key đơn giản riêng cho demo hoặc tắt endpoint nếu MQTT là đường telemetry chính. Không cần xây hệ provisioning công nghiệp.
4. Kiểm tra các giá trị số: tốc độ không âm và có giới hạn, vĩ độ [-90, 90], kinh độ [-180, 180], enum hợp lệ, payload có kích thước giới hạn.
5. Chỉnh kết quả telemetry theo đúng filter khoảng thời gian; thêm giới hạn số bản ghi mặc định và phân trang khi cần.
6. Không trả thông báo lỗi nội bộ/stack trace cho client. Ghi log phía server và trả thông báo API an toàn.
7. Thêm test tập trung vào 4 tình huống: đăng ký không thể thành ADMIN; người không có quyền bị từ chối; GPS sai phạm vi bị từ chối; lệnh LOCK bị từ chối khi tốc độ/sensor state không an toàn.

**Bằng chứng nên chuẩn bị:** curl/Postman request và status code cho đúng/sai quyền; record audit log; test lệnh và ACK; ảnh/capture API docs nếu dùng Swagger.

### 3.4. MQTT, broker và lớp cloud

**Hiện trạng quan sát được**

- Repository cấu hình broker Mosquitto local trong Compose nhưng cũng có script/firmware trỏ tới broker EMQX công cộng. Cấu hình local cho phép anonymous; cấu hình chạy hiện tại không chứng minh có TLS/ACL.
- Một broker công cộng có thể dùng cho demo lớp học nếu giảng viên cho phép, nhưng không nên coi đó là cloud deployment được bảo mật. Topic và credential công khai có thể bị người khác publish/subscribe.
- Tên trạng thái trên dashboard có chữ “MQTT TLS”, trong khi luồng firmware hiện dùng TCP port 1883.

**Đề xuất vừa tầm**

1. Chọn **một broker cho buổi demo**: khuyến nghị Mosquitto local bằng Docker Compose để kiểm soát và ít phụ thuộc Internet, hoặc broker lớp học được cấp riêng. Ghi rõ lựa chọn trong README.
2. Dùng namespace topic demo riêng của nhóm; không gửi tọa độ hay credential thật lên broker công cộng. Xóa thông tin Wi-Fi thật khỏi source, đổi mật khẩu đã lộ và dùng file cấu hình local không commit.
3. Nếu còn thời gian, bật username/password riêng cho backend và thiết bị, tạo ACL tối thiểu theo topic. TLS là điểm cộng nếu cấu hình được, nhưng không nên tuyên bố TLS khi chưa triển khai.
4. Sửa giao diện “MQTT TLS” thành trạng thái kết nối/thời gian cập nhật thực tế, hoặc hiển thị giao thức đang chạy chính xác.
5. Kiểm tra kết nối lại, LWT/offline, QoS và trùng lệnh ở mức đủ cho demo. Ghi rõ giới hạn: buffer RAM không tồn tại sau mất điện.

**Đối với tiêu chí “cloud”:** nếu rubric yêu cầu tầng cloud, hãy giải thích broker MQTT là tầng messaging/cloud service của kiến trúc; backend/database có thể chạy local bằng Docker trong demo, miễn sơ đồ phân định rõ lớp logic và nơi triển khai. Không cần triển khai Kubernetes hoặc thuê cloud để chứng minh kiến trúc, trừ khi đề bài/giảng viên yêu cầu.

### 3.5. Database và dữ liệu

**Hiện trạng quan sát được**

- PostgreSQL có schema cho user, device, ownership, command, alert, telemetry và audit log; đây là mô hình phù hợp để thể hiện dữ liệu thiết bị và lịch sử.
- SQL seed và `DataInitializer` cùng có trách nhiệm tạo dữ liệu mẫu, khiến nguồn dữ liệu khởi tạo và danh sách mẫu có thể khác nhau theo cách chạy.
- Có nhiều Compose với cấu hình/cổng khác nhau (5432/5433), gây nhầm giữa môi trường local và môi trường full-stack.
- Device seed có tọa độ mẫu; dashboard có thể hiển thị chúng trước khi GPS thật có fix.

**Đề xuất vừa tầm**

1. Chọn một Compose làm đường chạy chính; các phương án khác đặt tên rõ (`local-db`, `full-stack`) hoặc bỏ khỏi hướng dẫn quick start.
2. Chọn một cơ chế seed chính: SQL seed hoặc `DataInitializer`; đánh dấu dữ liệu sample là demo và không dùng tọa độ mẫu làm bằng chứng GPS thật.
3. Thêm migration/schema có version nếu đủ thời gian; ít nhất ghi rõ `ddl-auto=update` chỉ phục vụ demo/dev, không là chiến lược migration production.
4. Kiểm tra lưu telemetry có tọa độ null/last-known, trạng thái GPS, thời điểm nhận dữ liệu và truy vấn lịch sử có giới hạn.
5. Thống nhất cổng, tên database, user và mật khẩu trong Compose, application config và script khởi động.

### 3.6. Frontend và trải nghiệm demo

**Hiện trạng quan sát được**

- React/Vite có dashboard, map, biểu đồ, thiết bị, cảnh báo và lịch sử lệnh. Build production hiện thành công.
- Dashboard tải telemetry định kỳ; phần hiển thị vị trí dùng last latitude/longitude của device, chưa thể hiện rõ dữ liệu GPS có fix mới hay chỉ là tọa độ seed/last-known.
- Giao diện có phần simulator; nếu trình diễn dữ liệu thật và dữ liệu mô phỏng lẫn nhau, người chấm khó phân biệt nguồn.
- Bundle chính lớn hơn ngưỡng khuyến nghị của Vite; đây là tối ưu phụ, không phải blocker của prototype.

**Đề xuất vừa tầm**

1. Hiển thị nhãn nguồn dữ liệu rõ: `HARDWARE`, `SIMULATED`, `LAST KNOWN` và dấu thời gian cập nhật cuối. Không ghi “realtime” nếu dữ liệu đang là mẫu cũ.
2. Trên bản đồ thêm trạng thái GPS: chưa có fix, đang có fix, stale/mất tín hiệu; hiển thị số vệ tinh/độ chính xác nếu đã đọc và kiểm chứng.
3. Để simulator chỉ hiện trong demo profile hoặc có badge nổi bật. Trước mỗi lượt trình diễn xác nhận đang ở chế độ phần cứng hay mô phỏng.
4. Ưu tiên tải telemetry mới/delta hoặc giới hạn cửa sổ hiển thị trước khi tối ưu sâu. Chỉ tách bundle/lazy-load nếu UI đã ổn định và còn thời gian.
5. Kiểm tra trải nghiệm không có device, API lỗi, GPS chưa fix, broker ngắt và user Viewer.

### 3.7. Kiểm thử, báo cáo và thuyết trình

**Hiện trạng quan sát được**

- Trong repository chưa thấy bộ test tự động đáng kể ở backend/frontend; `tests/` chưa có kịch bản chạy được.
- Báo cáo còn placeholder tên nhóm/MSSV/tài khoản, và một số bảng kết quả còn chờ đo. Tài liệu vận hành khẳng định một số tính năng vượt quá bằng chứng trong code.

**Đề xuất vừa tầm**

1. Viết bảng test manual có cột: ID, điều kiện ban đầu, bước làm, expected, actual, pass/fail, ảnh/log. Một bảng 8–12 test chạy lại được có giá trị hơn danh sách dài chưa chạy.
2. Tối thiểu kiểm tra: cảm biến Hall, MPU6050, UART bình thường/checksum sai, lệnh và ACK, mất Wi-Fi rồi phục hồi, GPS fix/mất fix, phân quyền Owner/Viewer, simulator bị chặn khi chưa xác thực.
3. Đo độ trễ bằng timestamp ở các điểm có thể quan sát; ghi rõ thời điểm đo, số lần thử, min/median/max hoặc trung bình và giới hạn. Không ghi “đáp ứng <2s” nếu chưa đo.
4. Điền thông tin nhóm, URL repository và kết quả test; thay câu khẳng định tuyệt đối bằng trạng thái triển khai/giới hạn đúng sự thật.
5. Chuẩn bị demo 5–7 phút: sơ đồ tầng → cảm biến thật → UART/MQTT log → database/API → dashboard/map → một alert/command → test lỗi/permission.
6. Chuẩn bị một video dự phòng và ảnh/log; GPS cần không gian thoáng và có thể mất vài phút mới có fix.

## 4. Lộ trình triển khai theo cổng kiểm soát

### Gate A — Chạy ổn định một đường end-to-end

- Chốt broker, Compose, database port, firmware được nạp và tài khoản demo.
- Xác nhận Hall/MPU có thể đọc hoặc ghi nhãn fallback rõ ràng.
- Xác nhận telemetry đi qua UART → MQTT → backend → PostgreSQL → dashboard.
- Xác nhận command đi từ app → backend → MQTT → gateway → ACK → trạng thái UI.

**Chỉ sang gate tiếp theo khi:** nhóm tự chạy lại được luồng trên ít nhất vài lần mà không phải sửa tay dữ liệu database.

### Gate B — GPS và trạng thái dữ liệu

- Làm theo từng bước trong [quy trình tích hợp NEO-6M-0-001](./NEO-6M-001-TICH-HOP.md).
- Đọc tọa độ qua UART riêng trước; sau đó mới đưa vào khung UART giữa node.
- Kiểm tra vị trí thực tại ngoài trời, mất fix và last-known behavior.

### Gate C — Quyền, lỗi và độ tin cậy

- Chặn cấp role ADMIN qua đăng ký công khai và khóa endpoint mô phỏng/ghi telemetry trái phép.
- Thêm freshness check cho sensor data trước thao tác relay.
- Chạy bảng test thủ công và lưu evidence.

### Gate D — Chốt tài liệu và bảo vệ

- Đồng bộ sơ đồ, pinout, README, báo cáo và nội dung trên giao diện.
- Không ghi TLS, GPS thật, retry, offline durability hoặc kết quả đo nếu nhóm chưa xác minh.
- Chuẩn bị demo chính, demo dự phòng và câu trả lời về giới hạn.

## 5. Tiêu chí “đủ tốt để bảo vệ đồ án”

Nhóm có cơ sở vững để bảo vệ khi trả lời được bằng demo/log cho các câu sau:

1. Mỗi tầng làm nhiệm vụ gì, payload đi qua các tầng ra sao?
2. Nếu UART checksum sai, GPS mất fix, Wi-Fi mất kết nối hoặc broker không có thì hệ thống phản ứng thế nào?
3. Làm sao chứng minh dữ liệu trên map đến từ GPS thật chứ không phải seed/simulator?
4. Ai có thể điều khiển thiết bị, và request không có quyền bị chặn ở đâu?
5. Lệnh nguy hiểm được xử lý ở firmware như thế nào; giới hạn an toàn của testbed là gì?
6. Nhóm đã chạy test nào, kết quả đo nào có log/chụp màn hình chứng minh?

Một câu trả lời thành thật kiểu “tính năng này hiện chưa triển khai; đây là ranh giới hiện tại và đây là bước tiếp theo” tốt hơn khẳng định tính năng đã hoàn tất nhưng không demo được.

## 6. Các điểm cần sửa đồng bộ trong tài liệu

- Không gọi kết nối MQTT port 1883 là TLS.
- Không gọi mọi giá trị dashboard là dữ liệu cảm biến thật nếu có fallback, seed hoặc simulator.
- Mô tả ring buffer là buffer RAM chỉ lưu loại bản tin đang được enqueue; không khẳng định không mất dữ liệu qua mất điện hoặc mọi loại telemetry.
- Cập nhật LED pin theo firmware (GPIO2 hiện tại) hoặc thay code/sơ đồ để chúng thống nhất.
- Phân biệt tọa độ seed/demo, GPS fix hiện tại và last-known location.
- Hoàn thành thông tin nhóm, test result, ảnh thực nghiệm và giới hạn sản phẩm trước khi nộp.

## 7. Tài liệu tham chiếu nội bộ

- [Mô tả yêu cầu dự án](./PROJECT_SPECIFICATION.md)
- [Báo cáo đồ án hiện tại](../BAO-CAO-DO-AN-IoT-Motorbike-Guardian.md)
- [Sơ đồ đấu nối phần cứng hiện tại](../SO-DO-DAU-NOI-PHAN-CUNG.md)
- [Tổng hợp thay đổi và hướng dẫn vận hành](../TONG-HOP-THAY-DOI-VA-HUONG-DAN-VAN-HANH.md)
- [Quy trình tích hợp NEO-6M-0-001](./NEO-6M-001-TICH-HOP.md)

## 8. Bổ sung ngày 08/10/2026: hướng tới A/A+ trong phạm vi bài tập lớn

Module NEO-6M-0-001 mới về ngày 08/10/2026; GPS đang ở giai đoạn bắt đầu tích hợp. Không coi việc chưa có GPS end-to-end hôm nay là lỗi tiến độ hoặc là tính năng đã hoàn thành.

### 8.1. Mục tiêu đánh giá và phạm vi chốt

Mục tiêu chính là chứng minh đầy đủ cấu trúc IoT và mối liên hệ giữa các tầng trên breadboard. Các mức dưới đây là mục tiêu chất lượng nội bộ, không phải thang điểm chính thức; điểm A/A+ còn phụ thuộc rubric, demo và vấn đáp của giảng viên.

- **Nền tảng hướng A:** có luồng dữ liệu thật qua mọi tầng; điều khiển có ACK thật; lưu và tra cứu lịch sử; phân quyền cơ bản hoạt động; sơ đồ khớp mạch; test có kết quả và bằng chứng.
- **Phần nâng cao hướng A+:** GPS thật xuyên suốt các tầng, có fix/stale; demo một tình huống lỗi và phục hồi; số liệu đo độ trễ/độ ổn định; giải thích được thiết kế FreeRTOS/UART/MQTT và giới hạn thuật toán. Chọn 2-3 điểm nhấn làm chắc.
- **Giới hạn phù hợp:** 1 testbed hai node, 1 backend Spring Boot, 1 PostgreSQL, 1 dashboard web. Không cần PCB, app mobile riêng, AI, Kubernetes, microservices hay chứng nhận an toàn xe thật.
- **ADC pin:** nếu FR-01 bắt buộc đo điện áp thì bổ sung đo nguồn thử bằng ADC và mạch chia áp phù hợp. Nếu được phép giảm phạm vi, ghi rõ điện áp đang mô phỏng, không dùng số cố định làm bằng chứng đo thật.

### 8.2. Ma trận chứng minh các tầng IoT khi bảo vệ

| Tầng | Nội dung cần chứng minh | Bằng chứng tối thiểu |
|---|---|---|
| Vật lý | Hall/MPU/GPS là nguồn số đo; relay/buzzer là cơ cấu chấp hành | Ảnh breadboard và thao tác thật làm số đo/đầu ra thay đổi |
| Thiết bị/edge | Node B lấy mẫu và xử lý; Node A quản lý mạng/điều khiển; có queue/mutex | Sơ đồ task, chu kỳ, log từng node và giải thích quyền sở hữu dữ liệu |
| Truyền thông nội bộ | UART có framing, kiểm tra length/checksum, phục hồi sau lỗi | Một frame hợp lệ, một frame lỗi, log heartbeat mất/phục hồi |
| Mạng/messaging | MQTT telemetry, alert, command, ACK và status | Capture topic/payload, cùng device ID và cmd_id ở hai phía |
| Xử lý dịch vụ | Backend nhận dữ liệu, kiểm tra quyền, quản lý lệnh/cảnh báo | API response, log ingestion và kiểm tra Owner/Viewer |
| Lưu trữ | PostgreSQL lưu telemetry, lệnh, alert, ownership | ERD, bản ghi tương ứng với payload vừa gửi, truy vấn lịch sử |
| Ứng dụng | Dashboard/map hiển thị số đo và trạng thái đúng | Screenshot/video có thời điểm cập nhật, nguồn dữ liệu, GPS fix/stale |

Sơ đồ tầng logic và sơ đồ nơi triển khai phải riêng biệt: broker trên Internet là dịch vụ messaging từ xa; backend/database chạy laptop là xử lý/lưu trữ local. Không gọi toàn bộ hệ thống là cloud-hosted chỉ vì dùng broker công cộng. Nếu giảng viên yêu cầu backend/cloud triển khai từ xa, cần demo một backend trên server hoặc dịch vụ được cấp; không cần hệ thống phân tán. Nếu yêu cầu chỉ là kiến trúc đủ tầng, Docker local vẫn chứng minh được các tầng xử lý và lưu trữ, nhưng không thay cho yêu cầu hosting từ xa.

### 8.3. Tối ưu từng phần theo giá trị cho môn học

| Phần | Làm trước để hoàn thiện luồng | Nâng cao nếu còn thời gian | Chưa cần |
|---|---|---|---|
| Hardware | Chốt pinout; dây có nhãn; nguồn motor đúng định mức; đo relay HIGH/LOW với COM-NO; cố định hướng MPU; GPS thử ngoài trời | Đế testbed gọn, bảng BOM/chi phí thực tế, ảnh các đầu nối | PCB riêng, enclosure sản phẩm |
| Firmware | Loại topic ACK khỏi callback lệnh; một nơi điều khiển relay; mẫu tốc độ có freshness; lỗi MPU được đánh dấu; GPS đọc liên tục | Đếm lỗi UART/queue/publish; cmd_id chống lặp; theo dõi heap và nhịp task | Sensor fusion/AI nếu chưa có dữ liệu đánh giá |
| App | PENDING khác EXECUTED; nguồn HARDWARE/SIMULATED rõ; GPS FIX/STALE; không có tọa độ thì không đặt marker giả | Truy vấn cửa sổ dữ liệu ngắn; dùng WebSocket sau khi bảo vệ quyền subscribe; trang trạng thái kết nối | Làm lại toàn bộ UI, app native |
| Backend | Chặn đăng ký ADMIN; JWT/ownership cho simulator và REST telemetry; ACK đúng device; đồng bộ state thật; timeout lệnh | Test tập trung cho quyền/lệnh/GPS; kiểm tra token ACCESS/REFRESH; cấu hình ngưỡng có ACK | Microservices, hệ provisioning phức tạp |
| Cloud/MQTT | Một broker thống nhất; payload thống nhất; không tự mô phỏng khi hardware publish lỗi; online/offline thật | Broker có tài khoản và ACL; TLS nếu rubric hoặc phần nâng cao yêu cầu | mTLS/HA nhiều vùng |
| Database | Một cơ chế seed chính; tách mẫu demo; GPS metadata và last fix time; lịch sử đúng filter | Giới hạn bản ghi, index có sẵn, schema có version | Thêm InfluxDB/Timescale chỉ để đủ tên công nghệ |
| Kiểm thử/báo cáo | 10-12 ca manual có actual/pass-fail/log; báo cáo đúng trạng thái triển khai | Khoảng 20 lượt đo latency, thử liên tục 30-60 phút ban đầu rồi kéo dài theo yêu cầu | Coverage cao cho mọi getter/UI |

Không cần chuyển ngay toàn bộ frontend sang WebSocket. Polling có thể đủ cho đồ án nếu chu kỳ và độ trễ được đo, mô tả đúng. Nếu giữ mục tiêu dưới 2 giây thì chu kỳ MQTT 3 giây hiện tại cần điều chỉnh; thử telemetry khoảng 1 giây và polling khoảng 1 giây, rồi đo lại. Không coi chu kỳ cấu hình là kết quả latency thực tế.

### 8.4. Các sửa chữa tối thiểu trước khi chứng minh luồng lệnh thật

1. **Vòng ACK:** Node A subscribe cmd/# bao gồm cmd/ack, trong khi callback phát ACK cho cả bản tin không nhận ra. Bỏ qua chính xác topic ACK hoặc subscribe danh sách topic lệnh riêng; không ACK lại ACK. Đây là lỗi của luồng hiện tại, không phải yêu cầu chuyên nghiệp hóa.
2. **Trùng lệnh:** backend đang publish cùng cmd_id qua UUID và alias; Node A nghe cả hai. Chọn UUID làm topic chính; nếu vẫn hỗ trợ alias thì chống lặp bằng cmd_id. ACK lặp không được làm trạng thái cuối đổi qua lại.
3. **Báo thành công:** chỉ hiển thị EXECUTED khi có ACK từ thiết bị sau thao tác đầu ra; kiểm tra xQueueSend thành công. Broker/thiết bị lỗi phải thể hiện PENDING/TIMEOUT/FAILED phù hợp. Simulation là chế độ được chọn rõ, không tự thay hardware khi mạng lỗi.
4. **Tốc độ Hall:** với chu vi 0,5 m, một xung/vòng và cửa sổ 200 ms, bước đo khoảng 9 km/h. Cửa sổ không có xung có thể xuất hiện khi bánh vẫn quay chậm. Thử đo thời gian giữa xung hoặc cửa sổ dài hơn, giữ thông tin last pulse và xác nhận đứng yên qua một khoảng thời gian đã thử trên testbed. Dây Hall bị đứt không tự phân biệt được với bánh đứng yên chỉ bằng cách đếm xung; ghi rõ giới hạn này. Không dùng GPS thay Hall cho interlock relay.
5. **Mẫu cũ/lỗi:** khi chưa nhận telemetry, mutex thất bại hoặc sensor stale, từ chối cắt relay; không mặc định bằng 0. Kiểm tra lại ngay tại task thực thi. Đo quy ước relay trước khi chốt code.
6. **Đồng bộ state:** telemetry hiện lưu state vào reading nhưng chưa đồng bộ device.securityState; handleStatus chưa xử lý LWT. Cập nhật trạng thái được thiết bị báo về và chuyển OFFLINE theo lastSeen/timeout phù hợp. Revoke ở DB chưa đồng nghĩa broker đã ngắt thiết bị.
7. **Hợp đồng mô phỏng:** thống nhất speed_kmh, battery_v, accel_x/y/z hoặc accel array và state dạng chuỗi với backend; phiên bản Wokwi hiện dùng các tên trường khác. Đánh dấu mô phỏng và không dùng kết quả Wokwi để chứng minh UART hai node thật.

### 8.5. Demo và bộ bằng chứng gọn

Demo khoảng 7 phút: giới thiệu từng tầng (1 phút); Hall/MPU thật đến dashboard và DB (2 phút); lệnh ARM/relay và ACK cùng cmd_id (1 phút); GPS thật và last-known (1 phút); rút UART hoặc mất mạng, trạng thái lỗi/phục hồi (1 phút); Viewer bị chặn và giới hạn dự án (1 phút). Chuẩn bị log/video ngoài trời cho GPS nếu phòng bảo vệ không bắt được vệ tinh; công khai đó là bằng chứng ghi trước.

Checklist nghiệm thu nội bộ: Hall quay/chậm/dừng; MPU rung/nghiêng; UART hợp lệ/lỗi checksum; ARM/DISARM và ACK không lặp; LOCK bị chặn khi đang quay hoặc stale; broker lỗi không báo EXECUTED; Owner/Viewer đúng quyền; GPS fix end-to-end; GPS no-fix giữ last-known; restart phục hồi; lịch sử đúng filter; chạy liên tục và ghi số lỗi/reset. Mỗi ca có điều kiện, bước làm, expected, actual, pass/fail và đường dẫn bằng chứng.

Đo latency bằng cùng đồng hồ hoặc ghi rõ cách đồng bộ; không lấy millis của ESP32 trừ trực tiếp epoch của server. Có thể quay video đồng thời thao tác và dashboard để đo thô cho môn học. Ghi min/median/max và số lượt; không ghi DONE 100% trước khi thực hiện test.

### 8.6. Thứ tự triển khai từ hôm nay

- **Bước 1:** GPS độc lập, kiểm tra NMEA/fix ngoài trời; lưu log. Có thể làm ngay, chưa cần đợi sửa toàn bộ app.
- **Bước 2:** sửa lỗi ACK/relay và bỏ hardware fallback sang simulation để có nền end-to-end đáng tin.
- **Bước 3:** đưa GPS qua UART/MQTT, mở rộng metadata ở backend/DB/DTO và hiển thị fix/stale.
- **Bước 4:** kiểm tra quyền cơ bản, lịch sử, offline và chạy bảng nghiệm thu.
- **Bước 5:** chốt sơ đồ các tầng, cấu hình chạy, số liệu đo và báo cáo. Chỉ thêm tính năng nâng cao sau khi luồng chính đã có bằng chứng.

## 9. Cập nhật triển khai hardware/firmware ngày 08/10/2026

Phạm vi công việc hiện tại là hardware/firmware theo phân công của người làm embedded. Đã bắt đầu triển khai GPS Node B→UART v2→Node A→MQTT, sửa xử lý ACK/queue/relay/freshness/Hall/MPU và cập nhật hướng dẫn breadboard. Các nhận định về firmware cũ ở phần trước là lịch sử rà soát; xem [hướng dẫn v2](./HUONG-DAN-HARDWARE-FIRMWARE-V2-GPS.md) để biết thay đổi và kiểm thử cần thực hiện.

Backend/app/cloud chưa được sửa trong đợt này: tự mô phỏng khi publish thất bại, UI coi PENDING là EXECUTED, đồng bộ state/offline và xử lý gps_valid/gps_age_ms vẫn cần người phụ trách tương ứng hoàn thiện. Kết quả hardware chỉ được xác nhận sau khi nạp và lưu bằng chứng testbed.
