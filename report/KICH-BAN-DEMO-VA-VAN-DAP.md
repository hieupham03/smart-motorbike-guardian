# Kịch bản báo cáo, demo và vấn đáp

Dùng cùng [PowerPoint](slides/Smart-Motorbike-Guardian.pptx) hoặc [PDF](slides/Smart-Motorbike-Guardian.pdf). Bám đề bài mục 8.3–8.4: khoảng 10 phút trình bày, 5–7 phút demo trực tiếp và 5 phút vấn đáp. Video chỉ dự phòng, không thay demo trực tiếp.

## 1. Người trình bày và thời lượng

- **Người 1 — bạn:** slide 1–6, khoảng 5 phút: mở đầu, bài toán, kiến trúc, hardware và firmware.
- **Người 2:** slide 7–12, khoảng 4 phút 50 giây: MQTT, backend, bảo mật, web/mobile, kiểm thử và kết luận.
- **Cả bốn thành viên:** tham gia vấn đáp; phân công thuyết trình hai người không miễn trách nhiệm hiểu hệ thống của hai người còn lại.
- Điền tên/MSV và xác nhận phân công thật trước buổi trình bày. Không suy từ ký hiệu TV1–TV4 thành tỷ lệ đóng góp hoặc tác giả code.

| Slide | Nội dung | Người | Thời gian |
|---|---|---|---|
| 01 | SMART MOTORBIKE GUARDIAN | 1 | 00:00–00:20 |
| 02 | Ba tình huống cần người dùng nhận biết | 1 | 00:20–01:15 |
| 03 | Một hệ thống IoT, hai chiều hoạt động | 1 | 01:15–02:00 |
| 04 | Hai node tách công việc cảm biến và kết nối | 1 | 02:00–03:00 |
| 05 | FreeRTOS giữ các tác vụ phối hợp rõ ràng | 1 | 03:00–04:05 |
| 06 | Thiết bị quyết định đầu ra và từ chối lệnh sai điều kiện | 1 | 04:05–05:00 |
| 07 | MQTT nối dữ liệu lên và lệnh xuống | 2 | 05:00–06:00 |
| 08 | Backend quản lý dữ liệu và vòng đời thiết bị | 2 | 06:00–06:55 |
| 09 | Ba lớp kiểm tra trước một thao tác điều khiển | 2 | 06:55–08:00 |
| 10 | Web và mobile dùng chung dữ liệu, quyền và kết quả lệnh | 2 | 08:00–09:00 |
| 11 | Kiểm chứng theo tầng, demo bằng mạch thật | 2 | 09:00–09:30 |
| 12 | Một mô hình nhỏ, đủ vòng dữ liệu và điều khiển | 2 | 09:30–09:50 |
| — | Dự phòng | Cả hai | 09:50–10:00 |

Các mốc là ngân sách tập nói, không phải phép đo. Bấm giờ ít nhất một lần; nếu quá 10 phút, rút ví dụ phụ thay vì đọc nhanh hoặc bỏ phần kết quả.

## 2. Lời nói từng slide

### Slide 01 — SMART MOTORBIKE GUARDIAN

**Người 1 · 20 giây.**

**Hình trên slide:** Tên đề tài; ba mục tiêu; bảng tên nhóm để điền trước buổi báo cáo.

**Lời nói để tập:**

Kính chào thầy và các bạn. Nhóm em trình bày Smart Motorbike Guardian, nguyên mẫu IoT bảo vệ và giám sát xe máy trên breadboard. Phần đầu em trình bày bài toán, kiến trúc, phần cứng và firmware. Bạn tiếp theo trình bày kết nối, backend, ứng dụng và kết quả kiểm thử. Sau đó nhóm demo trực tiếp trên mô hình.

**Câu chuyển:** Trước hết, nhóm giải quyết ba tình huống nào của người sử dụng?

### Slide 02 — Ba tình huống cần người dùng nhận biết

**Người 1 · 55 giây.**

**Hình trên slide:** Ba thẻ bối cảnh: xe bị tác động khi đỗ; dấu hiệu nghiêng/ngã; thông tin xe bị cũ. Nguồn Bộ Công an và WHO ở chân slide.

**Lời nói để tập:**

Khi để xe ở dãy trọ hoặc bãi xe, chủ xe không luôn đứng cạnh. Một vụ án Bộ Công an công bố năm 2025 ghi nhận trộm xe tại chung cư, dãy trọ và nhà hàng. Đây là căn cứ cho nhu cầu phát hiện xe bị tác động và gửi cảnh báo. Với tình huống thứ hai, WHO nêu người đi xe máy thuộc nhóm dễ bị tổn thương và chăm sóc sau va chạm cần kịp thời. Nhóm tiếp cận ở mức mô hình: nhận biết dấu hiệu nghiêng kéo dài và báo để người theo dõi kiểm tra, không kết luận chắc chắn có tai nạn. Tình huống thứ ba được ghi nhận khi thử mô hình: GPS có thể mất fix và mạng có thể gián đoạn. Ứng dụng cần cho biết dữ liệu còn mới hay chỉ là thông tin lần cuối. Các mục tiêu của nhóm gắn với ba nhu cầu này, không phải chỉ ghép nhiều cảm biến.

**Câu chuyển:** Giải pháp được tổ chức thành một đường dữ liệu và điều khiển như sau.

### Slide 03 — Một hệ thống IoT, hai chiều hoạt động

**Người 1 · 45 giây.**

**Hình trên slide:** Sơ đồ editable cảm biến → Node B → Node A → broker → backend → web/mobile; DB nối backend; đầu ra nối Node A.

**Lời nói để tập:**

Hall, MPU và GPS tạo dữ liệu ở Node B. Node B gửi dữ liệu cho Node A qua UART. Node A xử lý đầu ra tại chỗ và gửi dữ liệu lên MQTT broker qua Wi-Fi. Backend nhận, kiểm tra, lưu vào cơ sở dữ liệu rồi cập nhật web và mobile. Chiều ngược lại bắt đầu từ người có quyền trên ứng dụng, qua backend và MQTT xuống Node A. Thiết bị trả kết quả để ứng dụng biết lệnh đã thực hiện hay bị từ chối. Cách chia này có đủ cảm nhận, kết nối, xử lý tại biên, dịch vụ dữ liệu và ứng dụng. Đây là ánh xạ các thành phần của mô hình IoT, không phải yêu cầu phải có năm máy chủ khác nhau.

**Câu chuyển:** Tại phía thiết bị, nhóm tách thành hai node để phân công trách nhiệm.

### Slide 04 — Hai node tách công việc cảm biến và kết nối

**Người 1 · 60 giây.**

**Hình trên slide:** Hình mạch có GPS (hình minh họa) và hai thẻ trách nhiệm; bảng chân chính.

**Lời nói để tập:**

Node B là ESP32-S3 N16R8, đọc cảm biến Hall để xác định tốc độ bánh, MPU-6050 để theo dõi gia tốc và nghiêng, và NEO-6M để lấy tọa độ. Node A là ESP32 gateway, phụ trách Wi-Fi, MQTT, máy trạng thái bảo vệ và relay/còi. Hai node nối UART chéo TX-RX và chung GND. Chia hai node không phải điều kiện bắt buộc để làm được chức năng; một ESP32 vẫn có thể đảm nhiệm. Nhóm chọn tách để việc đọc cảm biến ít phụ thuộc quá trình nối mạng và dễ kiểm từng khối trên testbed. Bánh mô hình có đường kính 6,5 cm. Relay chỉ đóng/ngắt nguồn motor, không điều chỉnh tốc độ liên tục. Hình trên là sơ đồ minh họa đấu nối; mô hình đang đặt trước thầy mới là thiết bị thực tế.

**Câu chuyển:** Firmware phối hợp các tác vụ bằng FreeRTOS thay vì gom vào một vòng lặp dài.

### Slide 05 — FreeRTOS giữ các tác vụ phối hợp rõ ràng

**Người 1 · 65 giây.**

**Hình trên slide:** Hai cột task Node B và Node A; queue chuyển mẫu, mutex bảo vệ snapshot, heartbeat phát hiện liên kết mất.

**Lời nói để tập:**

FreeRTOS là hệ điều hành thời gian thực cho vi điều khiển. Bộ lập lịch phân chia CPU cho các task theo mức ưu tiên và trạng thái chờ; task dùng vTaskDelay hoặc chờ queue để nhường CPU. Ở Node B, task cảm biến lấy mẫu khoảng 50 ms, task xử lý tính sự kiện, task GPS đọc UART độc lập và task truyền thông trao đổi với Node A. Queue chuyển bản sao mẫu theo thứ tự; mutex bảo vệ dữ liệu dùng chung khi task khác đọc. Ngắt Hall chỉ ghi nhận xung, không làm xử lý mạng trong ISR. Node A có task UART, điều khiển và MQTT. Vì vậy, GPS chưa có fix không chặn đọc Hall/MPU, và reconnect mạng không được phép giữ khóa dữ liệu quá lâu. Heartbeat UART gửi định kỳ một giây; quá ba giây không nhận thì liên kết bị đánh dấu mất. Đây là cơ chế phát hiện hoạt động, không chứng minh mọi cảm biến đều đúng.

**Câu chuyển:** Từ dữ liệu đã thu, Node A quyết định bảo vệ theo trạng thái và điều kiện.

### Slide 06 — Thiết bị quyết định đầu ra và từ chối lệnh sai điều kiện

**Người 1 · 55 giây.**

**Hình trên slide:** PARKED → ARMED → ALARM → THEFT_LOCK; nút điều kiện bánh dừng/dữ liệu mới; ba quy tắc cảm biến.

**Lời nói để tập:**

Khi chưa bật bảo vệ, xe ở PARKED. Bật bảo vệ chỉ được chấp nhận khi bánh đã dừng và dữ liệu cảm biến còn mới; khi đó Node A sang ARMED và ngắt nhánh motor theo cấu hình mô hình. Bánh quay hoặc rung đủ điều kiện tạo ALARM và còi báo. Việc khóa tiếp theo vẫn chịu điều kiện bánh dừng, không cắt motor chỉ vì một số tốc độ đang cao. Cảnh báo quá tốc độ là cảnh báo cho người dùng, không phải tính năng điều tốc motor. Các quy tắc có thời gian duy trì, chống dội và khoảng chờ để hạn chế lặp cảnh báo. Khả năng xử lý này ở thiết bị vẫn hoạt động khi phần mạng bị gián đoạn. Em xin chuyển cho bạn tiếp theo để trình bày phần kết nối, server và ứng dụng.

**Câu chuyển:** Người 2: Từ kết quả tại Node A, dữ liệu và lệnh được trao đổi qua MQTT.

### Slide 07 — MQTT nối dữ liệu lên và lệnh xuống

**Người 2 · 60 giây.**

**Hình trên slide:** Hai làn topic telemetry/alert/status và cmd/ack; ví dụ payload ngắn, cmd_id.

**Lời nói để tập:**

Wi-Fi cung cấp đường kết nối mạng cho Node A. MQTT là giao thức trao đổi bản tin qua broker: thiết bị publish dữ liệu, backend subscribe các topic cần thiết. Nhóm tách telemetry, cảnh báo, trạng thái, lệnh và ACK theo UUID thiết bị. Telemetry mang đơn vị rõ như km/h và m/s², cùng các cờ dữ liệu hợp lệ. Một lệnh được gắn cmd_id; Node A thực hiện hoặc từ chối rồi ACK cùng mã đó. Backend giữ lịch sử PENDING, EXECUTED, REJECTED hoặc TIMEOUT. Backend gửi lệnh không retained để tránh thiết bị nối lại nhận lệnh cũ từ retained message. Thời gian millis của firmware là uptime; backend ghi thời điểm nhận để truy vấn lịch sử, không nhầm uptime thành giờ UTC. MQTT tự nó không đồng nghĩa đã có bảo mật: thông tin đăng nhập và quyền topic của thiết bị phải được kiểm riêng.

**Câu chuyển:** Backend không chỉ nhận số liệu mà còn quản lý thiết bị trong toàn bộ vòng đời.

### Slide 08 — Backend quản lý dữ liệu và vòng đời thiết bị

**Người 2 · 55 giây.**

**Hình trên slide:** Dải vòng đời thực hiện theo trạng thái hiện có; ba cột dữ liệu, thiết bị, lịch sử. Ghi rõ activate/revoke không phải relay lock.

**Lời nói để tập:**

Backend Spring Boot cung cấp API, nhận dữ liệu MQTT, lưu dữ liệu bằng cơ sở dữ liệu và cập nhật realtime bằng STOMP. Phần quản lý thiết bị có kích hoạt bằng mã claim, gán chủ sở hữu, chia sẻ quyền xem, theo dõi online/offline và ngừng sử dụng. Phiên bản phần cứng và firmware được theo dõi trong hồ sơ thiết bị. Lịch sử telemetry khác thống kê phiên quay bánh: telemetry được lưu trong DB, còn phiên bánh ở RAM của thiết bị sẽ mất khi khởi động lại. Một điểm cần phân biệt là trạng thái vòng đời thiết bị với trạng thái chống trộm. Ngừng sử dụng hoặc thu hồi quyền kết nối là quản lý truy cập hệ thống; khóa relay là hành động đầu ra trên mô hình. Khi demo nhóm phải chứng minh từng cơ chế đúng ở tầng tương ứng.

**Câu chuyển:** Các thao tác này được giới hạn bằng quyền của người dùng và danh tính thiết bị.

### Slide 09 — Ba lớp kiểm tra trước một thao tác điều khiển

**Người 2 · 65 giây.**

**Hình trên slide:** Ứng dụng → backend user/token/ownership → thiết bị credential/topic → firmware điều kiện; ma trận Owner/Viewer/Admin.

**Lời nói để tập:**

Người dùng đăng nhập bằng tài khoản; mật khẩu được băm BCrypt và API sử dụng token JWT. Owner có quyền điều khiển xe thuộc phạm vi của mình, Viewer chỉ xem, Admin quản trị theo chức năng được cấp. Backend kiểm quyền ở API và kênh realtime, không chỉ ẩn nút trên giao diện. Danh tính thiết bị khác danh tính người dùng: claim token dùng cho kích hoạt không tự trở thành mật khẩu MQTT của board. Thông tin xác thực riêng và quyền topic cần giới hạn đúng thiết bị. Cuối cùng, dù người gửi có quyền, firmware vẫn kiểm dữ liệu mới và bánh dừng trước lệnh cần an toàn. Thu hồi quyền của người dùng, thu hồi thông tin kết nối thiết bị và ngắt relay là ba việc khác nhau. Nhóm sẽ demo cả lệnh thành công và thao tác bị chặn để thể hiện hai phía của quy tắc.

**Câu chuyển:** Cùng một backend cung cấp dữ liệu và kết quả đó cho cả web lẫn mobile.

### Slide 10 — Web và mobile dùng chung dữ liệu, quyền và kết quả lệnh

**Người 2 · 60 giây.**

**Hình trên slide:** Ảnh web dashboard và mobile control từ test có kiểm soát; nhãn ảnh UI kiểm thử.

**Lời nói để tập:**

Web và mobile cùng dùng REST để lấy trạng thái và STOMP để nhận cập nhật. Người dùng xem tình trạng xe, dữ liệu, cảnh báo, lịch sử và kết quả lệnh. Khi gửi yêu cầu, ứng dụng hiển thị chờ xử lý, chỉ báo đã thực hiện khi nhận kết quả tương ứng. Nếu bánh đang quay mà bật bảo vệ, giao diện phải nêu đúng lý do thay vì một lỗi chung. Ngưỡng cảnh báo tốc độ được chỉnh trên ứng dụng và gửi xuống thiết bị; thay đổi ở một giao diện phải được phản ánh ở giao diện còn lại. Bản đồ hiển thị vị trí GPS hợp lệ hoặc vị trí hợp lệ gần nhất kèm trạng thái cũ. Ảnh trên là giao diện chạy với dữ liệu kiểm thử có kiểm soát; phần demo sau đây sẽ dùng cảm biến thật. Remote push khi khóa màn hình là một ca native riêng, không đồng nhất với cảnh báo realtime đang mở trong app.

**Câu chuyển:** Kết quả kiểm thử được chia theo đúng môi trường để tránh đánh đồng phần mềm với mạch.

### Slide 11 — Kiểm chứng theo tầng, demo bằng mạch thật

**Người 2 · 30 giây.**

**Hình trên slide:** Ba thẻ hồi quy backend/web/mobile và chuỗi demo; nêu firmware build khác mạch thật.

**Lời nói để tập:**

Bộ hồi quy có 36 test backend, 23 test web và 45 test mobile đạt, trong đó 9 ca kiểm broker MQTT thật. Mạch đã chạy qua luồng kích hoạt, telemetry lên cơ sở dữ liệu và web, lệnh có ACK và cảnh báo bánh quay; người vận hành xác nhận còi thật kêu. Kiểm thử giao diện bằng fixture được ghi riêng, không thay phép thử mạch. Nhóm demo dữ liệu thật, cấu hình, offline, phân quyền và thu hồi kết nối.

**Câu chuyển:** Em xin chốt kết quả và trách nhiệm của các thành viên trước phần demo.

### Slide 12 — Một mô hình nhỏ, đủ vòng dữ liệu và điều khiển

**Người 2 · 20 giây.**

**Hình trên slide:** Bốn phần trách nhiệm và ba giới hạn; chuyển sang demo trực tiếp.

**Lời nói để tập:**

Đóng góp của nhóm là tích hợp thiết bị, mạng, backend và ứng dụng thành một vòng IoT có quản lý và phản hồi. Bốn thành viên phụ trách các phần kỹ thuật đã phân công và cùng tham gia vấn đáp. Mô hình còn giới hạn Wi-Fi, thử nghiệm trên breadboard và nhận biết dấu hiệu ngã theo ngưỡng. Nhóm xin bắt đầu demo trực tiếp.

**Câu chuyển:** Chuyển sang trình duyệt và mô hình; thực hiện kịch bản demo 10 bước.

### Nguồn cho bài toán và hình ảnh

- [Bộ Công an: Triệt phá đường dây trộm cắp xe máy (03/09/2025)](https://www.bocongan.gov.vn/bai-viet/triet-pha-duong-day-trom-cap-va-tieu-thu-xe-may-mo-to-trom-cap-xuyen-quoc-gia-1756880668): căn cứ cho tình huống xe đỗ tại chung cư, dãy trọ và nhà hàng.
- [WHO: Road traffic injuries (20/07/2026)](https://www.who.int/news-room/fact-sheets/detail/road-traffic-injuries): người đi xe máy thuộc nhóm dễ bị tổn thương; chăm sóc sau va chạm cần kịp thời. Không dùng nguồn này để tuyên bố mô hình đã giảm tai nạn.
- Ảnh UI lấy từ bộ test có kiểm soát của dự án. Hình mạch lấy từ [hardware/](../hardware/README.md) và là minh họa, không phải ảnh prototype. AI hỗ trợ biên tập và dựng bố cục; nhóm kiểm tra và chịu trách nhiệm nội dung. Đối chiếu quy định AUR.99 của giảng viên cho cách ghi nhận cuối.

## 3. Chuẩn bị trước khi vào lớp

1. Kiểm tra đúng hai firmware và cùng backend/broker. Nạp từ `firmware/node_a_gateway/` và `firmware/node_b_sensor/`; không mở lại mirror cũ. Giữ bản source đã chốt trên laptop và URL/tag nộp bài.
2. Chạy bộ launcher theo [hướng dẫn với mạch thật](CHAY-WEB-MOBILE-VOI-PHAN-CUNG-THAT.md). Đăng nhập thử, mở health, xác nhận Node A MQTT và Node B UART còn mới. Không đợi tới lượt demo mới cài package hoặc tải image.
3. Chuẩn bị ba phiên trình duyệt riêng cho Owner, Viewer, Admin. Dùng cửa sổ thường/riêng tư hoặc profile riêng để không thay token của nhau. Chọn cùng thiết bị được cấp quyền ở Owner và Viewer.
4. Chuẩn bị một mã kích hoạt hợp lệ cho thiết bị chưa có chủ sở hữu. Mã claim chỉ dùng một lần; không xóa xe đang hoạt động hoặc DB chính để tạo màn hình demo. Nếu dùng thiết bị quản lý mô phỏng cho riêng bước onboarding, phải nêu rõ; phần telemetry và đầu ra vẫn dùng board thật.
5. Dùng tên xe/dữ liệu mẫu. Không chiếu mã claim, mật khẩu MQTT, JWT hoặc cấu hình Wi-Fi thật lên máy chiếu. Giữ ảnh mạch thật đã loại thông tin nhạy cảm và video dự phòng ở laptop.
6. Để nhánh motor OFF khi thay dây hoặc di chuyển; đặt mô hình vững, chung GND, dùng đúng nguồn đã kiểm. Không tháo dây nguồn sát nhau khi đang trình bày. Chuẩn bị cáp USB, adapter đang dùng, nam châm và dụng cụ sẵn có; không yêu cầu mua thêm linh kiện.
7. Kiểm tra mạng tại lớp. ESP32 phải tới được broker, laptop phải nhận dữ liệu và điện thoại tới được backend. Nếu lớp chặn broker ngoài, dùng cấu hình broker cục bộ đã thử trước; không tự đổi cấu hình trong lượt demo.
8. Nếu có GPS FIX, giữ vị trí hợp lệ và tuổi dữ liệu để đối chiếu. Nếu trong phòng NO_FIX, nói rõ và demo Hall/MPU; không thay bằng tọa độ mô phỏng rồi gọi là GPS thật.
9. Chỉ dùng ca thu hồi/decommission ở cuối; thao tác có thể khiến các lệnh sau không chạy được. Đừng decommission vĩnh viễn xe chính trong lượt tập khi chưa có kế hoạch khôi phục testbed.

## 4. Demo trực tiếp đủ 10 bước đề bài

Ngân sách khoảng **6 phút 40 giây**, gồm 6 phút thao tác và 40 giây dự phòng chờ mạng/chuyển màn hình. TV1 thao tác mạch, TV2 đối chiếu backend/broker, TV3 thao tác web và dẫn lời, TV4 đối chiếu mobile/Viewer và ghi kết quả. Cố định một UUID cho luồng thật; mỗi lệnh có cmd_id để đối chiếu. Không đọc hết bảng thành tiếng.

| Bước theo mục 8.4 | Thao tác và lời dẫn ngắn | Kết quả phải cho thấy | Ngân sách |
|---|---|---|---|
| 1. Đăng nhập các vai trò | Mở lần lượt Owner, Viewer, Admin đã đăng nhập. “Cùng hệ thống nhưng phạm vi thao tác khác nhau.” | Tên vai trò và danh sách xe theo quyền; không lộ token/mật khẩu | 25 s |
| 2. Đăng ký/kích hoạt | Owner vào Danh sách xe → Kích hoạt thiết bị trên xe; nhập mã local hợp lệ, tên mẫu. | Thiết bị được gán Owner; mã đã dùng không kích hoạt lại được. Nêu đúng nguồn HARDWARE/SIMULATED | 35 s |
| 3. Thiết bị gửi cảm biến | Chọn xe HARDWARE đang nối hai node; TV1 quay bánh thật bằng tay khi motor OFF. | Serial B có mẫu thay đổi, A còn fresh; không phát dữ liệu simulator vào UUID thật | 25 s |
| 4. Dashboard realtime | Cho thấy tốc độ/phiên tăng trên web, mobile nếu đang mở; đối chiếu một bản ghi backend/DB. | Cùng UUID, giá trị/tuổi dữ liệu phù hợp; không tải lại trang để tạo hiệu ứng realtime | 20 s |
| 5. Lệnh và phản hồi | Web Bật còi, mobile Tắt còi hoặc ngược lại. | Còi thật đổi; lệnh có cmd_id và kết quả EXECUTED/ACK. PENDING chưa phải thành công | 35 s |
| 6. Đổi cấu hình | Đổi ngưỡng cảnh báo tốc độ từ giao diện, đợi thiết bị xác nhận; mở giao diện còn lại. | Ngưỡng mới áp dụng cho thiết bị và hai UI thống nhất. Không chỉ lưu một con số trên web | 35 s |
| 7. Phát hiện offline | Ngắt riêng Wi-Fi/đường mạng của gateway theo cách đã tập, giữ node còn nguồn. Chờ timeout cấu hình. | Backend/app đánh dấu offline, dữ liệu cũ không được coi là mới. Nối lại và quan sát phục hồi; thời gian chờ thực có thể dài hơn ngân sách nên bắt đầu sớm hoặc tăng demo tới 7 phút | 55 s |
| 8. Kích hoạt cảnh báo | Đợi bánh dừng >4 s, bật bảo vệ; TV1 quay bánh tay đủ điều kiện. | Node A ALARM, còi, cảnh báo có loại/thời điểm và lịch sử. Tắt bảo vệ sau khi quan sát; coi chừng motor được cấp lại | 45 s |
| 9. Thao tác trái quyền | Từ Viewer thử điều khiển bằng giao diện hoặc API đã chuẩn bị. | Backend từ chối; không chỉ nút bị ẩn. Owner vẫn dùng được cùng chức năng | 30 s |
| 10. Thu hồi/ngừng sử dụng | Ở cuối demo, thu hồi credential hoặc decommission thiết bị dành cho ca này. Thử gửi/kết nối lại bằng credential cũ. | Chứng minh quyền kết nối cũ bị từ chối ở tầng đang bảo vệ. Backend bỏ bản tin của thiết bị bị thu hồi chưa tự chứng minh broker đã từ chối kết nối | 55 s |

**Giới hạn cần chốt trước buổi:** bước 10 phải dùng cơ chế xác thực/thu hồi thật đã được cấu hình. Không trình bày nút “Khóa motor” là thu hồi thiết bị, không gọi trạng thái FAULT trong DB là broker đã khóa tài khoản. Nếu mới có chặn ingestion thì ghi đúng phần còn thiếu và hoàn tất trước khi tuyên bố đáp ứng mục 8.4(10).

**Nếu thao tác lệch dự kiến:** dừng ở kết quả thực tế, đối chiếu lệnh/log, không bấm liên tục tạo nhiều lệnh hoặc đổi sang simulator mà không nói. Dùng PDF/video khi lỗi trình chiếu; video không thay yêu cầu vận hành board. Khi mạng lỗi, chỉ tiếp tục demo local/broker đã được tập và giải thích phạm vi mất Internet.

## 5. Những ca cần tập ngoài lượt 5–7 phút

- ARM/LOCK khi bánh đang quay: REJECTED với lý do bánh chưa dừng; motor không được ngắt do lệnh đó. Dừng bánh đủ thời gian rồi thử lại.
- GPS mất fix/stale và phục hồi: vị trí cũ có nhãn đúng; NO_FIX không làm Hall/MPU dừng.
- Reset Node A sau đổi ngưỡng: kiểm ngưỡng lưu NVS còn giữ. Phiên thống kê bánh là RAM nên reset mất phiên là hành vi đã thiết kế.
- Mất mạng nhưng liên kết hai node còn hoạt động: cảm biến/đầu ra tại chỗ tiếp tục; nối mạng lại thấy telemetry mới. Buffer RAM không bảo đảm giữ mọi bản tin khi mất điện.
- Cảnh báo MPU: đặt MPU nghiêng trên 50° nhẹ nhàng và giữ hơn 2 giây theo hướng dẫn, không làm ngã hoặc chập breadboard. Phân biệt dấu hiệu ngã với chẩn đoán tai nạn.
- Đối chiếu số xung/quãng đường: 10 vòng với bánh 6,5 cm và 1 xung/vòng xấp xỉ 2,042 m. Đây là công thức dự kiến; cần ghi số đo thực tế trước khi gọi là độ chính xác đạt.

## 6. Vấn đáp: câu trả lời phải nắm

Mỗi câu trả lời bắt đầu bằng quyết định của nhóm, chỉ một file/sơ đồ/bằng chứng và nêu giới hạn. Không học thuộc câu dài khi không hiểu code. Mỗi người vẫn phải nắm sơ đồ tổng thể và đường dữ liệu hai chiều.

| Thành viên / mảng cần nắm | Câu hỏi thường gặp | Ý trả lời trọng tâm |
|---|---|---|
| TV1 — hardware/firmware | Vì sao hai node, không dùng một ESP32? | Tách đọc cảm biến khỏi mạng/đầu ra để dễ phối hợp và kiểm thử; một board vẫn có thể làm, đổi lại thêm UART/nguồn/đồng bộ |
| TV1 | FreeRTOS là gì và dùng ở đâu? | Scheduler, task, ưu tiên và blocking; Sensor/GPS/Processing/UART ở B, UART/Control/MQTT ở A; queue chuyển mẫu, mutex bảo vệ snapshot, ISR chỉ ghi xung |
| TV1 | Heartbeat có chứng minh cảm biến đúng không? | Không. Heartbeat cho biết node/liên kết còn hoạt động; speed_valid, imu_valid, gps_valid và tuổi mẫu kiểm chất lượng riêng |
| TV1 | Hall tính tốc độ và ngừng thế nào? | Chu vi π×0,065 m, số xung/vòng; từ chu kỳ xung suy tốc độ; timeout không xung đưa về dừng. Không phân biệt được dây Hall đứt với bánh đứng yên |
| TV1 | Relay có giới hạn vận tốc được không? | Relay chỉ đóng/ngắt; hệ thống hiện cảnh báo quá ngưỡng. Điều tốc cần driver/PWM và đánh giá riêng, không gọi relay là điều tốc |
| TV2 — backend/data | Gửi lệnh thành công nghĩa là gì? | HTTP tạo PENDING; firmware ACK cùng cmd_id thành EXECUTED/REJECTED; hết hạn thành TIMEOUT. ACK GPIO khác đo tiếp điểm relay thật |
| TV2 | DB lưu gì, phiên bánh có lưu không? | User/device/ownership, telemetry theo thời gian, alert, command, audit và push; wheel session là snapshot RAM, không bịa bảng lịch sử phiên |
| TV2 | Thu hồi thiết bị có chặn broker không? | Chỉ khẳng định tầng đã thực hiện và thử. Chặn dữ liệu backend khác revokecredential/ACL/disconnectMQTT; cần ca reconnect bằng thông tin cũ |
| TV2 | Timestamp firmware có phải UTC không? | millis là uptime. Backend ghi thời điểm nhận; so sánh độ trễ phải nêu đồng hồ và điểm đo, không trừ hai clock chưa đồng bộ |
| TV3 — kết nối/tích hợp/web | Wi-Fi khác MQTT thế nào? | Wi-Fi cho kết nối mạng; MQTT là giao thức pub/sub qua broker. REST lấy snapshot, STOMP cập nhật app; không dùng Wi-Fi và MQTT như hai công nghệ thay thế nhau |
| TV3 | Nếu đã có MQTT sao còn backend? | Backend quản lý danh tính, quyền, vòng đời, kiểm dữ liệu, lưu/truy vấn và điều phối command/ACK; broker chuyển bản tin, không tự làm đủ nghiệp vụ |
| TV3 | Có phải kiến trúc năm tầng chuẩn không? | Ánh xạ cảm nhận, mạng, xử lý/edge, dịch vụ và ứng dụng; cách triển khai không cần đúng năm máy hoặc năm process |
| TV3 | Người dùng gọi API trực tiếp thì sao? | Backend vẫn kiểm JWT và ownership/role; ẩn nút chỉ hỗ trợ UX, không phải ranh giới bảo mật |
| TV4 — mobile/kiểm thử | Web và mobile đồng bộ thế nào? | Chung API và sự kiện backend; lấy snapshot khi mở/reconnect, dùng realtime cho cập nhật; không đọc trực tiếp cảm biến riêng |
| TV4 | Expo Go có push nền hoàn chỉnh chưa? | Cảnh báo trong app khác remote push. Native build/token/permission/FCM/APNs và thử điện thoại là ca riêng; chỉ khẳng định khi có actual |
| TV4 | Bản đồ có tọa độ có chắc GPS đang hoạt động không? | Có thể là điểm gần nhất; phải xét gps_valid và tuổi mẫu, nguồn HARDWARE; nền bản đồ Internet khác khả năng thu vệ tinh |
| TV4 | Test phần mềm đã đủ nghiệm thu chưa? | Không. Host/browser/emulator/CI kiểm các tầng phần mềm; cần board, mạng lớp, điện thoại và đầu ra thật cho ca demo tương ứng |

## 7. Khi thầy hỏi về kết quả và hạn chế

- **“Điểm nổi bật là gì?”** Vòng cảm biến–mạng–quản lý–ứng dụng có chiều điều khiển/ACK, dữ liệu có độ mới, quyền theo thiết bị và xử lý tại biên. Không tuyên bố phát minh công nghệ chống trộm/GPS mới.
- **“AI ở đâu?”** Hiện quy tắc theo ngưỡng/thời gian, chưa triển khai mô hình học máy. AI và OTA là nâng cao trong đề bài, không thay yêu cầu bắt buộc.
- **“Bao nhiêu phần trăm chính xác?”** Chỉ nêu số liệu đã đo cùng phương pháp/mẫu thử. Không lấy số test PASS để suy thành tỷ lệ phát hiện tai nạn hoặc độ tin cậy ngoài thực tế.
- **“Nếu đem gắn xe thật?”** Cần nguồn/EMI/cơ khí bền, mạng di động, bảo mật và thử nghiệm an toàn; mô hình học phần chưa được kiểm định cho xe thương mại.
- **“Nhóm dùng AI thế nào?”** Khai rõ phần hỗ trợ code/biên tập/hình, chỉ nguồn và footnote, tự giải thích cơ chế và kết quả; không dùng AI làm căn cứ cho số liệu đo hay ảnh prototype thật.

## 8. Phiếu tập demo

Ghi kết quả vào file riêng tại máy chạy hoặc phụ lục evidence đã loại bí mật; không điền sẵn PASS từ kịch bản.

| Bước | Expected | Actual của lượt tập | Bằng chứng | Người kiểm |
|---|---|---|---|---|
| 1 | Theo mục 4 | Chưa ghi | — | — |
| 2 | Theo mục 4 | Chưa ghi | — | — |
| 3 | Theo mục 4 | Chưa ghi | — | — |
| 4 | Theo mục 4 | Chưa ghi | — | — |
| 5 | Theo mục 4 | Chưa ghi | — | — |
| 6 | Theo mục 4 | Chưa ghi | — | — |
| 7 | Theo mục 4 | Chưa ghi | — | — |
| 8 | Theo mục 4 | Chưa ghi | — | — |
| 9 | Theo mục 4 | Chưa ghi | — | — |
| 10 | Theo mục 4 | Chưa ghi | — | — |

Đối chiếu bản source chạy thực tế, firmware đã nạp, UUID, mạng/broker và kết quả của cùng lượt tập. Khi tất cả bước có Actual thì nhóm mới chốt đã tập đủ kịch bản.
