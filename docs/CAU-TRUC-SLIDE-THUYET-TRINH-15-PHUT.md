# Kịch bản thuyết trình 15 phút — hai người

**Smart Motorbike Guardian · Buổi trình bày 28/10/2026 · Bản v4, cập nhật 27/10/2026.**

Giữ cấu trúc 14 slide, phần mở đầu giải thích bài toán bằng tình huống quen thuộc. Bài nói đi theo mạch: **nhu cầu → kiến trúc IoT → thiết bị thu thập/xử lý → kết nối/server → ứng dụng → vòng điều khiển → kiểm chứng**. Buổi này không có demo trực tiếp hoặc phần trình bày mã nguồn.

Thời lượng mục tiêu **14:30**, dự phòng **00:30**, tổng 15:00. Thời gian từng slide đã tính cả câu chuyển. Đây là ngân sách tập nói, không phải phép đo tốc độ nói thực tế; hai người cần bấm giờ ít nhất một lượt.

Bộ trình chiếu: [PowerPoint v4 — hai người](slides/Smart-Motorbike-Guardian.pptx) · [PDF dự phòng](slides/Smart-Motorbike-Guardian.pdf). Lời thoại, người nói và hướng dẫn chỉ sơ đồ có sẵn trong **Speaker Notes**.

## 1. Chia phần và điểm chuyển người

| Người trình bày | Slide | Thời gian | Trách nhiệm |
|---|---|---|---|
| **Người 1 — bạn** | 1–9 | **00:00–07:35** (07:35) | Mở đầu, kiến trúc tổng thể, hardware và firmware; chốt cách thiết bị tạo dữ liệu và phản ứng tại chỗ. |
| **Người 2 — thành viên còn lại** | 10–14 | **07:35–14:30** (06:55) | MQTT, backend/database, web/mobile, tích hợp hai chiều, kiểm chứng và kết luận. |

**Chỉ đổi người một lần, sau slide 9, ở mốc 07:35.** Người 1 trình bày trọn phần thiết bị, gồm cả trạng thái bảo vệ và GPS. Người 2 không giảng lại firmware mà nối tiếp từ giao diện Node A–MQTT sang server, ứng dụng và vòng tích hợp.

**Người 1 nói cuối slide 9:**

> Em xin chuyển phần trình bày cho bạn tiếp theo để giải thích cách dữ liệu lên server, tới ứng dụng và cách lệnh điều khiển quay lại thiết bị.

**Người 2 nhận phần, bắt đầu slide 10:**

> Cảm ơn bạn. Em sẽ tiếp tục từ điểm Node A đã có dữ liệu và cần kết nối với phần server, ứng dụng.

Phân chia này phục vụ buổi thuyết trình hai người, không thay bảng phân công kỹ thuật/báo cáo cho bốn thành viên và không xác định lại tác giả code.

## 2. Những điểm IoT cần để người nghe nhớ

- Đủ đường đi IoT: cảm biến → thiết bị biên → mạng → xử lý/lưu trữ → ứng dụng, có chiều điều khiển quay lại.
- Xử lý tại thiết bị: đọc nhiều cảm biến đồng thời, phát hiện sự kiện và điều khiển theo trạng thái.
- Dữ liệu có chất lượng: biết node còn liên lạc, mẫu còn mới và GPS có định vị hợp lệ hay chỉ còn vị trí cũ.
- Điều khiển có phản hồi: backend kiểm tra quyền, thiết bị kiểm tra điều kiện, ACK trả kết quả cho người dùng.
- Một backend phục vụ web và mobile, có lịch sử để xem lại thay vì chỉ hiện giá trị tức thời.

Nêu các ý này qua sơ đồ và ví dụ ở đúng phần tương ứng; không cần thêm một slide chỉ đọc danh sách công nghệ. Đây là giá trị tích hợp của bài tập lớn, không phải tuyên bố tính mới của công nghệ.

| Khối/chức năng IoT | Giải thích ở đâu | Người phụ trách |
|---|---|---|
| Cảm nhận và cơ cấu chấp hành | Slide 5: Hall, MPU, GPS, relay/motor, còi | Người 1 |
| Xử lý tại biên | Slide 6–8: task, sự kiện và máy trạng thái | Người 1 |
| Giao tiếp và chất lượng dữ liệu | Slide 6, 9: UART/heartbeat, GPS hợp lệ và độ mới | Người 1 |
| Kết nối mạng hai chiều | Slide 10: Wi-Fi, MQTT, broker, lệnh và ACK | Người 2 |
| Xử lý/lưu trữ và cung cấp dữ liệu | Slide 11: backend, database, REST/STOMP | Người 2 |
| Ứng dụng và vòng tích hợp | Slide 11–12: web/mobile, giám sát và điều khiển | Người 2 |
| Kiểm chứng và giới hạn | Slide 13–14: bằng chứng, ca toàn luồng và hướng hoàn thiện | Người 2 |

Năm khối trên slide 4 là cách chia thành phần triển khai để giải thích hệ thống. Không gọi đó là mô hình năm tầng chuẩn duy nhất của IoT; khi cần có thể quy chiếu về cảm nhận, mạng và ứng dụng.

## 3. Lịch trình 15 phút

| Slide | Nội dung | Người nói | Khoảng thời gian | Thời lượng |
|---|---|---|---|---|
| 01 | SMART MOTORBIKE GUARDIAN | Người 1 | 00:00–00:20 | 20 giây |
| 02 | Bài toán: bảo vệ xe và theo dõi khi có sự cố | Người 1 | 00:20–01:20 | 60 giây |
| 03 | Giải pháp: theo dõi và cảnh báo qua điện thoại | Người 1 | 01:20–01:55 | 35 giây |
| 04 | Kiến trúc tổng thể của hệ thống | Người 1 | 01:55–03:00 | 65 giây |
| 05 | Hai node, hai trách nhiệm rõ ràng | Người 1 | 03:00–03:55 | 55 giây |
| 06 | Firmware: xử lý tại biên và phối hợp nhiều tác vụ | Người 1 | 03:55–05:05 | 70 giây |
| 07 | Bảo vệ theo trạng thái, không chỉ bật hoặc tắt relay | Người 1 | 05:05–06:05 | 60 giây |
| 08 | Từ chuyển động đến sự kiện có điều kiện | Người 1 | 06:05–06:50 | 45 giây |
| 09 | GPS: tọa độ còn lưu chưa chắc là vị trí hiện tại | Người 1 | 06:50–07:35 | 45 giây |
| 10 | Kết nối hai chiều: dữ liệu lên, lệnh xuống | Người 2 | 07:35–09:15 | 100 giây |
| 11 | Server xử lý, lưu trữ và cập nhật web/mobile | Người 2 | 09:15–11:00 | 105 giây |
| 12 | Một kịch bản sử dụng, hai chiều dữ liệu | Người 2 | 11:00–12:20 | 80 giây |
| 13 | Kiểm chứng theo từng tầng | Người 2 | 12:20–13:35 | 75 giây |
| 14 | Một mô hình nhỏ. Một vòng IoT hoàn chỉnh. | Người 2 | 13:35–14:30 | 55 giây |
| — | Dự phòng chuyển người/chậm nhịp | Cả hai | 14:30–15:00 | 30 giây |

## 4. Kịch bản chi tiết từng slide

**Cách dùng:** đọc phần “Lời thoại” và “Câu chuyển” khi tập. Các mục “Mục tiêu”, “Chỉ sơ đồ” và “Ghi chú dự phòng” giúp chuẩn bị, không đọc thành tiếng. Có thể diễn đạt tự nhiên nhưng giữ nguyên ý và giới hạn. Nội dung trong slide là từ khóa; lời nói giải thích mối liên hệ.

### Slide 01 — SMART MOTORBIKE GUARDIAN

**Người nói:** Người 1 — bạn. **Thời gian:** 00:00–00:20 (20 giây).

**Mục tiêu:** Giới thiệu đề tài và báo trước hai phần trình bày.

**Thông điệp:** Mô hình bảo vệ, giám sát và cảnh báo cho xe máy.

**Nội dung hiển thị trên slide:**

- Theo dõi tình trạng xe
- Cảnh báo khi xe bị tác động
- Điều khiển từ xa trên mô hình

**Ảnh / sơ đồ cần chèn:** Hình xe máy cách điệu bằng vector, ba nhãn Hall / MPU / GPS. Đây là hình minh họa, không phải ảnh đã lắp hệ thống lên xe thật.

**Chỉ sơ đồ / nhịp trình bày:** Nhìn khán giả khi chào; chỉ tên đề tài, không đọc tên các cảm biến trên hình.

**Lời thoại để tập nói:**

Kính chào thầy cô và các bạn. Nhóm em xin trình bày Smart Motorbike Guardian, mô hình giám sát và cảnh báo xe máy. Em sẽ trình bày bài toán, kiến trúc và phần thiết bị; bạn tiếp theo trình bày kết nối, server và ứng dụng. Nhóm thử nghiệm trên breadboard với motor mô hình.

**Câu chuyển:** Trước hết, nhu cầu của người sử dụng xuất phát từ đâu?

**Ghi chú dự phòng — không đọc hết trong lượt chính:** Nếu cần rút thời gian, giữ lời chào, tên đề tài và hai phần; không giới thiệu danh sách công nghệ.


### Slide 02 — Bài toán: bảo vệ xe và theo dõi khi có sự cố

**Người nói:** Người 1 — bạn. **Thời gian:** 00:20–01:20 (60 giây).

**Mục tiêu:** Nêu đủ bài toán bảo vệ/chống trộm, giám sát và cảnh báo sự cố; mỗi nhu cầu gắn một trường hợp thực tế.

**Thông điệp:** Chống trộm khi đỗ • Giám sát khi sử dụng • Cảnh báo dấu hiệu ngã, va chạm

**Nội dung hiển thị trên slide:**

- BẢO VỆ, CHỐNG TRỘM: phát hiện tác động hoặc dắt xe khi chủ xe vắng mặt.
- GIÁM SÁT: theo dõi tình trạng, tốc độ và vị trí khi GPS hợp lệ.
- CẢNH BÁO TAI NẠN: ghi nhận dấu hiệu ngã hoặc va chạm, gửi thông tin để kiểm tra.

**Ảnh / sơ đồ cần chèn:** Ba thẻ tương ứng ba bối cảnh: xe đỗ tại sân trọ/bãi xe có người tác động; xe đang được sử dụng cần theo dõi tình trạng/tốc độ/vị trí; xe ngã hoặc va chạm cần gửi thông tin sự cố. Có thể dùng icon xe đỗ, điện thoại và xe nghiêng; không dùng ảnh tai nạn gây sốc. Thẻ thứ ba là nhu cầu cảnh báo tai nạn, lời nói giải thích hệ thống nhận biết dấu hiệu nghi ngờ.

**Chỉ sơ đồ / nhịp trình bày:** Chỉ từng thẻ theo thứ tự xe đang đỗ → xe đang được sử dụng → xe gặp sự cố. Dành khoảng 15 giây cho mỗi tình huống, phần còn lại để chốt nhu cầu và chuyển slide.

**Phát biểu bài toán:** Thiết kế một hệ thống IoT hỗ trợ bảo vệ, chống trộm cho xe khi đỗ; giám sát tình trạng, tốc độ và vị trí khi sử dụng; đồng thời ghi nhận dấu hiệu ngã hoặc va chạm và gửi cảnh báo tới người theo dõi được cấp quyền.

**Ba trường hợp thực tế — để hiểu và chuẩn bị trả lời, không đọc nguyên bảng:**

| Bối cảnh | Vấn đề xảy ra | Nhu cầu cần giải quyết | Phạm vi hiện tại |
|---|---|---|---|
| Xe đỗ ở sân trọ, trước cửa nhà hoặc bãi xe; chủ xe đi học/đi làm. | Có người rung lắc, tác động hoặc dắt xe khỏi chỗ đỗ khi chủ xe không quan sát. | Phát hiện bất thường khi bật bảo vệ; báo tại chỗ và đưa sự kiện lên ứng dụng để chủ xe kiểm tra. | Rung hoặc quay bánh chỉ là dấu hiệu tác động; không khẳng định mọi tác động đều là hành vi trộm. |
| Xe đang được sử dụng, hoặc chủ xe cho người thân mượn và chia sẻ quyền theo dõi. | Người theo dõi không ở cạnh xe, cần biết tình trạng, tốc độ hoặc vị trí; có thể có cảnh báo vượt ngưỡng tốc độ. | Xem thông tin từ xa trên web/mobile, có trạng thái kết nối và độ mới để tránh hiểu nhầm dữ liệu cũ. | Vị trí phụ thuộc GPS có fix; quyền truy cập phải được cấp. Cảnh báo tốc độ không tự điều tốc hoặc cắt motor. |
| Người đi xe bị ngã hoặc va chạm tại đường vắng; có thể chưa kịp chủ động báo tin. | Người được cấp quyền theo dõi chưa biết có sự cố; cần một tín hiệu để kiểm tra tình hình. | Ghi nhận dấu hiệu ngã/tác động, tạo sự kiện cảnh báo và gửi thông tin lên hệ thống; vị trí hợp lệ nếu có giúp tham khảo nơi xảy ra sự cố. | Hiện phát hiện theo ngưỡng gia tốc/độ nghiêng/thời gian, chưa xác nhận tai nạn hoặc tình trạng con người. Chưa tự gọi cứu hộ, gửi SMS hay thông báo người thân ngoài hệ thống; push nền cần nghiệm thu riêng. |

**Lời thoại để tập nói:**

Bài toán của nhóm có ba tình huống. Thứ nhất, khi xe đỗ ở sân trọ hoặc bãi xe, chủ xe đi học và không đứng cạnh. Nếu có người tác động hoặc dắt xe khỏi chỗ đỗ, nhu cầu là phát hiện bất thường, báo tại chỗ và gửi cảnh báo để chủ xe biết. Đây là phần bảo vệ, hỗ trợ chống trộm.

Thứ hai, khi xe được sử dụng, chủ xe hoặc người được cấp quyền muốn kiểm tra tình trạng, tốc độ và vị trí khi GPS hợp lệ. Chẳng hạn, chủ xe cho người thân mượn xe và muốn theo dõi từ xa.

Thứ ba, nếu người đi xe bị ngã hoặc va chạm ở nơi ít người, họ có thể không kịp chủ động báo tin. Khi đó, nhu cầu là ghi nhận dấu hiệu sự cố và gửi cảnh báo để người theo dõi có cơ sở kiểm tra. Mô hình hiện nhận biết dấu hiệu ngã hoặc tác động theo ngưỡng; đó là cảnh báo nghi ngờ, chưa phải kết luận chắc chắn có tai nạn.

Vì vậy, đề tài kết hợp bảo vệ xe, giám sát và cảnh báo sự cố cho người sử dụng.

**Câu chuyển:** Từ ba tình huống này, nhóm xây dựng các chức năng theo dõi, cảnh báo và điều khiển như sau.

**Ghi chú dự phòng — không đọc hết trong lượt chính:** Bài toán là bảo vệ tài sản và giám sát sự cố của xe/người sử dụng. Cụm “cảnh báo tai nạn” mô tả mục tiêu; khả năng hiện tại là cảnh báo dấu hiệu nghi ngờ ngã/va chạm trên mô hình. Không suy ra xe đỗ bị đổ là người lái gặp tai nạn. Ba tình huống chi tiết bên dưới dùng để hiểu và trả lời, không đọc nguyên bảng trong một phút.


### Slide 03 — Giải pháp: theo dõi và cảnh báo qua điện thoại

**Người nói:** Người 1 — bạn. **Thời gian:** 01:20–01:55 (35 giây).

**Mục tiêu:** Ba nhu cầu tương ứng ba nhóm chức năng và một phạm vi thử nghiệm rõ.

**Thông điệp:** Đưa thông tin từ mô hình xe đến web và ứng dụng mobile.

**Nội dung hiển thị trên slide:**

- THEO DÕI: xem tình trạng, tốc độ và vị trí khi có GPS.
- CẢNH BÁO: tác động khi canh giữ, dấu hiệu ngã/va chạm và vượt ngưỡng tốc độ.
- ĐIỀU KHIỂN: bật/tắt bảo vệ và khóa/mở motor mô hình.

**Ảnh / sơ đồ cần chèn:** Ba khối chức năng dễ hiểu: Theo dõi / Cảnh báo / Điều khiển. Dải dưới ghi phạm vi breadboard và motor DC mô hình. Chưa đưa ACK, freshness, state machine hay ngưỡng 2 km/h vào phần giới thiệu; các nội dung này giải thích ở slide kỹ thuật sau.

**Chỉ sơ đồ / nhịp trình bày:** Mỗi thẻ chỉ giải thích một câu; chỉ dải breadboard ở cuối.

**Lời thoại để tập nói:**

Từ các nhu cầu trên, giải pháp có ba nhóm chức năng. Theo dõi giúp người dùng xem tình trạng, tốc độ và vị trí khi GPS hợp lệ. Cảnh báo gồm tác động bất thường khi canh giữ, dấu hiệu ngã hoặc va chạm, và vượt ngưỡng tốc độ; sự kiện được đưa lên ứng dụng để người dùng kiểm tra. Điều khiển cho phép bật, tắt bảo vệ hoặc khóa, mở motor mô hình từ xa. Nhóm dùng breadboard và motor nhỏ để thể hiện cách các tầng IoT phối hợp cho những chức năng này.

**Câu chuyển:** Để ba nhóm chức năng này làm việc cùng nhau, hệ thống được tổ chức như sau.

**Ghi chú dự phòng — không đọc hết trong lượt chính:** Chưa giải thích ACK, tên trạng thái hay từng ngưỡng; để các slide kỹ thuật sau làm việc đó.


### Slide 04 — Kiến trúc tổng thể của hệ thống

**Người nói:** Người 1 — bạn. **Thời gian:** 01:55–03:00 (65 giây).

**Mục tiêu:** Sơ đồ tổng thể là trục chính của bài; chỉ rõ cả đường dữ liệu và đường điều khiển.

**Thông điệp:** Cảm biến thu thập → truyền dữ liệu → server xử lý → web/mobile hiển thị.

**Nội dung hiển thị trên slide:**

- Cảm nhận: Hall / MPU6050 / NEO-6M
- Thiết bị biên: Node B ↔ UART ↔ Node A
- Kết nối: Wi-Fi / MQTT broker
- Dịch vụ: Spring Boot / database
- Ứng dụng: React web / Expo mobile

**Ảnh / sơ đồ cần chèn:** Sơ đồ năm cột tự vẽ, mũi tên dữ liệu màu teal và vòng lệnh/ACK màu cam. Nhánh relay/còi nằm ở Node A. Chú thích đúng vị trí chạy: broker từ xa; backend và H2 của bản test trên laptop; PostgreSQL là cấu hình triển khai của repo.

**Chỉ sơ đồ / nhịp trình bày:** Chỉ năm khối từ trái sang phải, sau đó đi theo mũi tên cam quay về Node A. Dừng nhẹ ở server và ứng dụng.

**Lời thoại để tập nói:**

Trên sơ đồ, nhóm chia hệ thống thành năm khối chức năng để dễ theo dõi. Đầu tiên là cảm nhận: Hall ghi nhận bánh quay, MPU đo gia tốc và độ nghiêng, GPS cung cấp vị trí khi định vị được. Tiếp theo là thiết bị biên: Node B đọc và xử lý cảm biến; Node A làm gateway, nối mạng và điều khiển relay, còi. Hai node trao đổi UART.

Khối kết nối sử dụng Wi-Fi và MQTT để đưa bản tin qua broker tới backend. Backend tiếp nhận dữ liệu, tổ chức lưu trữ trong database và cung cấp cho web, mobile. Người dùng xem thông tin ở khối ứng dụng. Khi gửi lệnh, yêu cầu đi theo chiều ngược lại xuống thiết bị và kết quả xử lý quay về.

Điểm nhóm muốn nhấn mạnh là một vòng IoT có cả giám sát lẫn điều khiển, cùng phản hồi giữa các tầng. Trong bản test hiện tại, broker ở xa, còn backend và H2 chạy trên laptop; PostgreSQL là cấu hình triển khai riêng trong repo.

**Câu chuyển:** Sau bức tranh tổng thể, em đi vào hai node và các thành phần phần cứng.

**Ghi chú dự phòng — không đọc hết trong lượt chính:** Nếu bị hỏi mô hình ba hay năm tầng, giải thích đây là năm khối triển khai của nhóm; có thể quy về cảm nhận, mạng và ứng dụng, không khẳng định đây là một chuẩn phân tầng duy nhất.


### Slide 05 — Hai node, hai trách nhiệm rõ ràng

**Người nói:** Người 1 — bạn. **Thời gian:** 03:00–03:55 (55 giây).

**Mục tiêu:** Vai trò của từng linh kiện trong chuỗi cảm nhận → tính toán → chấp hành.

**Thông điệp:** Node B tập trung cảm biến; Node A tập trung kết nối và đầu ra.

**Nội dung hiển thị trên slide:**

- NODE B • ESP32-S3 N16R8: Hall, MPU6050, NEO-6M
- NODE A • ESP32 gateway: Wi-Fi/MQTT, relay, buzzer
- UART hai chiều • GND tham chiếu chung

**Ảnh / sơ đồ cần chèn:** Sơ đồ phần cứng bằng các khối có tên thật, đường Hall/I2C/UART GPS vào Node B, UART sang Node A, relay ra motor mô hình. Nếu nhóm có ảnh testbed đẹp, có thể thay vùng sơ đồ bằng ảnh thật và giữ nhãn hai node; không bắt buộc để thuyết trình lần này.

**Chỉ sơ đồ / nhịp trình bày:** Chỉ Hall/MPU/GPS vào Node B, UART nối hai node, rồi relay/motor và còi ở Node A.

**Lời thoại để tập nói:**

Ở Node B, nhóm dùng ESP32-S3 N16R8 để đọc ba nguồn dữ liệu. Hall tạo xung khi bánh quay, phục vụ tính tốc độ, quãng đường quy đổi và nhận biết bánh bị tác động. MPU6050 dùng I2C để đo gia tốc và độ nghiêng. GPS NEO-6M nối qua một UART riêng để cung cấp tọa độ.

Node A đảm nhiệm Wi-Fi, MQTT và các đầu ra. Relay đóng ngắt nguồn motor mô hình, còn buzzer phát cảnh báo tại chỗ. UART giữa hai node có cả chiều dữ liệu và heartbeat; hai board cần GND tham chiếu chung.

Nhóm chọn hai node để tách phần cảm biến khỏi phần gateway và thực hành giao tiếp liên thiết bị. Với mô hình nhỏ, một node vẫn có thể đáp ứng; lựa chọn hai node giúp nhóm thể hiện rõ trách nhiệm và kiểm soát mất liên lạc.

**Câu chuyển:** Phần cứng tạo ra nhiều luồng tín hiệu cùng lúc, nên firmware cần tổ chức xử lý đồng thời.

**Ghi chú dự phòng — không đọc hết trong lượt chính:** Bánh có đường kính 6,5 cm, chu vi khoảng 0,204 m và một xung mỗi vòng. Chỉ nói công thức hoặc bảng GPIO khi được hỏi.


### Slide 06 — Firmware: xử lý tại biên và phối hợp nhiều tác vụ

**Người nói:** Người 1 — bạn. **Thời gian:** 03:55–05:05 (70 giây).

**Mục tiêu:** Giải thích xử lý tại biên và lý do tách task, không đọc danh sách API FreeRTOS.

**Thông điệp:** Đọc cảm biến, tạo sự kiện và truyền dữ liệu được tổ chức độc lập.

**Nội dung hiển thị trên slide:**

- Task riêng: Sensor / Processing / GPS / UART
- Queue, mutex và snapshot trao đổi dữ liệu
- UART: framing, length, checksum, heartbeat

**Ảnh / sơ đồ cần chèn:** Hai làn task: Node B gồm Sensor → Queue → Processing → UART và nhánh GPS → snapshot; Node A gồm nhận UART / MQTT → ControlTask → relay/còi. Thẻ nhỏ: telemetry 39 B, wheel sample 13 B. Các con số là kích thước giao thức, không phải đo latency.

**Chỉ sơ đồ / nhịp trình bày:** Đi theo Sensor → Processing → UART; chỉ nhánh GPS riêng; cuối cùng chỉ ControlTask bên Node A.

**Lời thoại để tập nói:**

Trên Node B, firmware dùng FreeRTOS để chia công việc thành các tác vụ riêng. Sensor đọc Hall và MPU theo chu kỳ. Processing nhận mẫu để tính toán, cập nhật dữ liệu và nhận biết sự kiện. UART gửi thông tin sang Node A, đồng thời nhận heartbeat và trạng thái từ gateway. GPS có một task riêng để liên tục đọc bản tin định vị.

Các task trao đổi mẫu qua queue; dữ liệu dùng chung được bảo vệ bằng mutex. Có thể hiểu queue là nơi chuyển mẫu theo thứ tự, còn mutex giúp tránh hai tác vụ sửa cùng một dữ liệu không kiểm soát. Cách tổ chức này giúp việc chờ tín hiệu GPS không chặn đọc Hall hoặc MPU.

Đó là xử lý tại biên: tín hiệu được chuyển thành tốc độ và sự kiện ngay trên thiết bị, trước khi gửi lên server. Node A tiếp nhận dữ liệu và điều phối đầu ra qua ControlTask. Khung UART có độ dài, checksum và heartbeat để kiểm tra bản tin và nhận biết mất liên lạc. Hai kích thước gói ở dưới là chi tiết giao thức, không phải số đo độ trễ.

**Câu chuyển:** Nhưng nhận được sự kiện chưa có nghĩa cứ bật hoặc tắt relay; firmware còn xét trạng thái hiện tại.

**Ghi chú dự phòng — không đọc hết trong lượt chính:** Telemetry payload 39 byte; wheel sample 13 byte. Checksum XOR hỗ trợ phát hiện một số lỗi truyền, không phải cơ chế mã hóa hay bảo mật.


### Slide 07 — Bảo vệ theo trạng thái, không chỉ bật hoặc tắt relay

**Người nói:** Người 1 — bạn. **Thời gian:** 05:05–06:05 (60 giây).

**Mục tiêu:** Cho thấy thiết bị tự quyết định theo trạng thái và điều kiện dữ liệu.

**Thông điệp:** ARM cần bánh đã dừng và dữ liệu còn mới.

**Nội dung hiển thị trên slide:**

- PARKED → ARMED → ALARM → THEFT_LOCK
- ARM: dữ liệu mới, bánh không có xung ≥4 giây
- DISARM / UNLOCK đưa hệ thống về PARKED

**Ảnh / sơ đồ cần chèn:** Sơ đồ bốn trạng thái với điều kiện trên mũi tên. Chuyển ALARM → THEFT_LOCK ghi ≥15 giây + điều kiện khóa hợp lệ. Vòng quay về PARKED ghi DISARM/UNLOCK. Ghi chú: PARKED không có nghĩa bánh đang đứng yên.

**Chỉ sơ đồ / nhịp trình bày:** Chỉ bốn trạng thái theo thứ tự; giải thích điều kiện ARM một lần; chỉ đường quay về PARKED.

**Lời thoại để tập nói:**

Nhóm dùng bốn trạng thái để tách rõ thiết bị đang ở chế độ nào. PARKED là bảo vệ đang tắt, không phải khẳng định bánh đang đứng yên. Khi người dùng bật ARM, thiết bị kiểm tra dữ liệu còn mới, tốc độ hợp lệ và bánh đã không có xung ít nhất bốn giây. Nếu đạt điều kiện, nó chuyển sang ARMED, ngắt motor mô hình để canh giữ.

Trong ARMED, rung lắc hoặc quay bánh đủ ngưỡng sẽ đưa thiết bị sang ALARM và bật cảnh báo. Sau ít nhất mười lăm giây, chuyển sang THEFT_LOCK vẫn phải qua điều kiện khóa, gồm dữ liệu mới và bánh dừng. DISARM hoặc UNLOCK đưa thiết bị về PARKED.

Điểm chính là quyết định đầu ra nằm ở firmware và có điều kiện kiểm tra. Ứng dụng có thể yêu cầu, nhưng thiết bị phải đánh giá tình trạng thực tế trước khi xử lý.

**Câu chuyển:** Để có các sự kiện đầu vào cho logic này, nhóm kết hợp tín hiệu Hall và MPU.

**Ghi chú dự phòng — không đọc hết trong lượt chính:** Không diễn giải đây là cơ chế an toàn đã chứng nhận cho xe thật. Các thao tác khóa đang áp dụng trên motor mô hình.


### Slide 08 — Từ chuyển động đến sự kiện có điều kiện

**Người nói:** Người 1 — bạn. **Thời gian:** 06:05–06:50 (45 giây).

**Mục tiêu:** Nêu giá trị của cảm biến và xử lý theo thời gian; hạn chế sa vào số ngưỡng.

**Thông điệp:** Lọc theo số xung, ngưỡng và thời gian để hạn chế báo lặp.

**Nội dung hiển thị trên slide:**

- Canh giữ: ≥3 xung Hall trong 3 giây khi ARMED
- Quá tốc độ: >2 km/h trong ≥2 giây → chỉ cảnh báo
- MPU: rung liên tiếp hoặc nghiêng kéo dài → sự kiện

**Ảnh / sơ đồ cần chèn:** Ba thẻ Hall canh giữ / cảnh báo tốc độ / rung-nghiêng. Nhấn mạnh lớn 2 km/h là ngưỡng demo. Dải phụ ghi thống kê phiên: xung • vòng • quãng đường • max speed, lưu RAM theo phiên.

**Chỉ sơ đồ / nhịp trình bày:** Chỉ ba thẻ: tác động bánh, tốc độ, rung/nghiêng. Chỉ dải thống kê phiên ở cuối.

**Lời thoại để tập nói:**

Từ xung Hall, nhóm khai thác được nhiều thông tin trên cùng một cảm biến. Khi đang canh giữ, bánh quay đủ số xung trong một khoảng thời gian sẽ được xem là tác động cần cảnh báo. Khi hoạt động bình thường, chu kỳ xung được quy đổi thành tốc độ; số xung tích lũy dùng cho thống kê phiên như số vòng và quãng đường.

Nhóm có thêm cảnh báo khi tốc độ vượt ngưỡng đủ lâu; chức năng này chỉ cảnh báo, không tự cắt motor. Với MPU, firmware xét ngưỡng cùng số mẫu hoặc thời gian nghiêng để giảm phản ứng với tác động thoáng qua. Đây là các quy tắc xử lý tín hiệu cho mô hình, chưa phải thuật toán AI xác nhận tai nạn.

**Câu chuyển:** Nguồn dữ liệu còn lại là GPS; ở đây cần phân biệt có tọa độ với có vị trí hiện tại hợp lệ.

**Ghi chú dự phòng — không đọc hết trong lượt chính:** Nếu được hỏi: Hall canh giữ ≥3 xung/3 giây; tốc độ demo >2 km/h trong ≥2 giây; nghiêng >50° có điều kiện thời gian. Phiên bánh lưu RAM, không phải lịch sử phiên bền vững trong DB.


### Slide 09 — GPS: tọa độ còn lưu chưa chắc là vị trí hiện tại

**Người nói:** Người 1 — bạn. **Thời gian:** 06:50–07:35 (45 giây).

**Mục tiêu:** Chốt phần thiết bị bằng chất lượng dữ liệu, rồi bàn giao cho người 2.

**Thông điệp:** Phân biệt NO_FIX, FIX và STALE trước khi hiển thị.

**Nội dung hiển thị trên slide:**

- NO_FIX: chưa có vị trí hợp lệ
- FIX: có vị trí hợp lệ và còn mới
- STALE: giữ vị trí cuối, ghi rõ dữ liệu cũ

**Ảnh / sơ đồ cần chèn:** Ba trạng thái định vị và một bản đồ lưới trừu tượng có pin, ghi minh họa nguyên lý. Không chèn tọa độ tự tạo hoặc ảnh bản đồ giả làm bằng chứng GPS ngoài trời.

**Chỉ sơ đồ / nhịp trình bày:** Chỉ NO_FIX → FIX → STALE. Cuối câu chuyển, quay sang người 2 và nhường phần nói; chỉ bấm slide 10 khi người 2 bắt đầu.

**Lời thoại để tập nói:**

Với GPS, nhóm không chỉ gửi hai số tọa độ mà còn xét dữ liệu có hợp lệ và còn mới hay không. NO_FIX nghĩa là chưa có vị trí hợp lệ; FIX là có vị trí còn mới; STALE là chỉ còn vị trí hợp lệ trước đó. Khi mất định vị, giao diện cần ghi rõ vị trí cuối, tránh hiểu nhầm đó là vị trí hiện tại.

GPS trong nhà có thể mất fix, nhưng Hall và MPU vẫn tiếp tục làm việc nhờ task riêng. Qua phần vừa rồi, thiết bị đã thu thập, xử lý và tạo được dữ liệu có trạng thái rõ ràng.

**Câu chuyển:** Em xin chuyển phần trình bày cho bạn tiếp theo để giải thích cách dữ liệu lên server, tới ứng dụng và cách lệnh điều khiển quay lại thiết bị.

**Ghi chú dự phòng — không đọc hết trong lượt chính:** Module từng FIX ngoài trời theo xác nhận người dùng; hồ sơ hiện chưa có log tọa độ FIX đầy đủ. Không dùng sơ đồ bản đồ làm bằng chứng phép đo.


### Slide 10 — Kết nối hai chiều: dữ liệu lên, lệnh xuống

**Người nói:** Người 2 — thành viên còn lại. **Thời gian:** 07:35–09:15 (100 giây).

**Mục tiêu:** Tiếp lời người 1; giải thích mạng IoT và phân biệt tiếp nhận lệnh với thực thi.

**Thông điệp:** MQTT nối thiết bị với backend; ACK cho biết kết quả xử lý lệnh.

**Nội dung hiển thị trên slide:**

- Node A ↔ Wi-Fi / MQTT broker ↔ backend
- Ứng dụng gửi REST; backend kiểm tra quyền và phát lệnh xuống thiết bị
- Thiết bị kiểm tra điều kiện; ACK cập nhật PENDING / EXECUTED / REJECTED / TIMEOUT

**Ảnh / sơ đồ cần chèn:** Chuỗi bốn chủ thể App / Backend / MQTT / Node A với mũi tên lệnh xuống và ACK trở về; bốn nhãn PENDING, EXECUTED, REJECTED, TIMEOUT. Ví dụ khóa khi bánh quay là tình huống thiết kế, không gắn nhãn đã demo hardware.

**Chỉ sơ đồ / nhịp trình bày:** Mở bằng câu nhận phần. Chỉ Node A → MQTT → backend ở chiều lên, sau đó đi từ app về Node A và ngược lại qua ACK.

**Lời thoại để tập nói:**

Cảm ơn bạn. Em sẽ tiếp tục từ điểm Node A đã có dữ liệu và cần kết nối với phần server, ứng dụng. Node A dùng Wi-Fi để trao đổi bản tin MQTT qua broker. Có thể hình dung broker là điểm trung chuyển: thiết bị gửi dữ liệu theo topic, backend đăng ký nhận các topic cần xử lý. Chiều ngược lại, backend phát lệnh và Node A đăng ký nhận lệnh dành cho thiết bị. Nhờ vậy, phần thiết bị và phần server có thể trao đổi mà không cần ứng dụng điện thoại kết nối trực tiếp tới board.

Với một thao tác điều khiển, chẳng hạn bật bảo vệ, app gửi yêu cầu REST tới backend. Backend kiểm tra người dùng có quyền với thiết bị hay không, ghi nhận lệnh với mã định danh và chuyển xuống MQTT. Lúc này, trạng thái mới là PENDING, nghĩa là đang chờ kết quả.

Node A kiểm tra điều kiện tại thiết bị rồi gửi ACK về. Thực hiện được thì cập nhật EXECUTED; không đủ điều kiện thì REJECTED kèm lý do. Hết thời gian chờ mà không có phản hồi thì TIMEOUT. Do đó, giao diện không nên báo thành công ngay khi người dùng bấm nút. Điểm nổi bật ở chiều điều khiển là có kết quả quay về từ firmware. ACK cho biết firmware đã xử lý đầu ra, còn xác minh tiếp điểm relay thực sự đóng hay mở vẫn cần quan sát hoặc cảm biến phản hồi riêng.

**Câu chuyển:** Sau khi nhận bản tin, server tổ chức dữ liệu và cung cấp cho hai ứng dụng như thế nào?

**Ghi chú dự phòng — không đọc hết trong lượt chính:** Nếu cần rút thời gian, bỏ ví dụ chi tiết mã lệnh; giữ publish/subscribe, kiểm tra quyền và phân biệt bốn kết quả. ACK không phải bằng chứng độc lập motor đã dừng.


### Slide 11 — Server xử lý, lưu trữ và cập nhật web/mobile

**Người nói:** Người 2 — thành viên còn lại. **Thời gian:** 09:15–11:00 (105 giây).

**Mục tiêu:** Server là tầng xử lý, lưu trữ và phân phối; web/mobile là hai cách truy cập cùng hệ thống.

**Thông điệp:** Một backend nhận dữ liệu MQTT, lưu lịch sử và phục vụ cả hai ứng dụng.

**Nội dung hiển thị trên slide:**

- MQTT → Spring Boot: tiếp nhận dữ liệu, sự kiện và trạng thái thiết bị
- Database: lưu dữ liệu lịch sử, cảnh báo và lệnh để tra cứu
- REST lấy dữ liệu ban đầu; STOMP đưa cập nhật tới web/mobile
- Phân quyền dùng chung: Owner / Viewer / Admin

**Ảnh / sơ đồ cần chèn:** Giữ hai ảnh giao diện có nhãn kiểm thử phần mềm. Bên trái là ba bước Tiếp nhận → Lưu trữ → Cập nhật. Nêu MQTT → Spring Boot, database và REST/STOMP. Đây là phần hệ thống/server, không dành toàn bộ thời gian đọc danh sách màn hình. Ảnh mobile là bản web test với MQTT giả lập, không phải ảnh điện thoại thật.

**Chỉ sơ đồ / nhịp trình bày:** Chỉ ba bước ở cột trái trước khi chỉ hai ảnh. Nhấn REST lấy ban đầu, STOMP cập nhật sau đó; chỉ caption nguồn ảnh khi nói giới hạn.

**Lời thoại để tập nói:**

Backend Spring Boot là điểm tập trung dữ liệu của hệ thống. Nó tiếp nhận telemetry, cảnh báo và trạng thái từ MQTT, gắn với thiết bị tương ứng, rồi phục vụ nhu cầu theo dõi và tra cứu. Database lưu các thông tin cần xem lại như dữ liệu cảm biến, cảnh báo và quá trình gửi lệnh. Như vậy, người dùng có thể xem lịch sử thay vì chỉ nhìn được một giá trị tức thời. Thống kê phiên bánh hiện lưu trong RAM ở thiết bị là một loại dữ liệu khác, không nên hiểu là đã có lịch sử mọi phiên trong database.

Cả web React và mobile Expo React Native đều dùng backend này. Khi mở màn hình, REST lấy dữ liệu ban đầu và lịch sử; sau đó STOMP qua WebSocket chuyển các cập nhật tới giao diện. Mỗi bản cập nhật cần gắn đúng thiết bị và được diễn giải theo độ mới. Có số liệu cũ trên màn hình không đồng nghĩa thiết bị đang trực tuyến.

Về quyền sử dụng, Owner và Admin có thể gửi lệnh theo phạm vi quyền; Viewer chủ yếu theo dõi và xác nhận đã xem cảnh báo. Quyền được kiểm tra ở backend, không chỉ bằng việc ẩn nút trên giao diện.

Điểm nổi bật là hai ứng dụng cùng khai thác một nguồn dữ liệu, cùng lịch sử và kết quả lệnh. Hai ảnh ở đây là giao diện từ bài thử phần mềm có MQTT giả lập. Cảnh báo hiển thị trong app cũng cần phân biệt với push khi app ở nền; push native còn cần nghiệm thu riêng.

**Câu chuyển:** Để thấy các tầng phối hợp ra sao, em nối chúng lại bằng một tình huống sử dụng.

**Ghi chú dự phòng — không đọc hết trong lượt chính:** PostgreSQL là cấu hình triển khai; H2 là DB bản test trên laptop. Nếu bị hỏi realtime có trễ bao nhiêu, trả lời chưa có phép đo toàn luồng đáng tin để công bố.


### Slide 12 — Một kịch bản sử dụng, hai chiều dữ liệu

**Người nói:** Người 2 — thành viên còn lại. **Thời gian:** 11:00–12:20 (80 giây).

**Mục tiêu:** Dùng một ví dụ xuyên suốt để tổng hợp kiến trúc; không biến thành demo hay lặp ngưỡng cảm biến.

**Thông điệp:** Một tác động vật lý được biến thành sự kiện, thông tin cho người dùng và phản hồi xử lý.

**Nội dung hiển thị trên slide:**

- Đỗ xe và ARM khi đủ điều kiện
- Bánh quay → sự kiện → ALARM → app
- Chủ xe kiểm tra rồi DISARM / UNLOCK

**Ảnh / sơ đồ cần chèn:** Storyboard bốn bước tự vẽ bằng icon: đỗ xe / ARM, quay bánh / Hall, còi và cảnh báo, chủ xe mở app. Ghi rõ kịch bản hoạt động thiết kế, không phải demo trực tiếp.

**Chỉ sơ đồ / nhịp trình bày:** Chỉ lần lượt bốn bước. Ở mỗi bước gọi tên tầng tham gia, dừng ở bước cuối để nhắc chiều lệnh/ACK.

**Lời thoại để tập nói:**

Giả sử chủ xe đã đỗ và muốn bật bảo vệ. Lệnh từ mobile đi qua backend và MQTT tới Node A. Khi điều kiện tại thiết bị hợp lệ, firmware chuyển sang ARMED và trả kết quả cho giao diện. Đó là chiều điều khiển từ người dùng xuống thiết bị.

Tiếp theo, nếu bánh xe bị quay đủ điều kiện, Hall trên Node B tạo dữ liệu, firmware xử lý thành sự kiện và chuyển sang Node A. Node A thực hiện cảnh báo tại chỗ, đồng thời đưa thông tin lên MQTT. Backend tiếp nhận, lưu cảnh báo và cập nhật cho ứng dụng. Người dùng từ xa có thể biết thiết bị vừa phát hiện tác động. Đây là chiều dữ liệu từ hiện trường lên người dùng.

Sau khi kiểm tra, người dùng có thể tắt bảo vệ hoặc mở khóa theo quyền; yêu cầu lại đi xuống và có kết quả quay về. Tình huống này cho thấy các tầng liên kết thành một vòng xử lý: cảm nhận, xử lý tại biên, truyền tin, lưu trữ, hiển thị và tác động trở lại. Hình này mô tả kịch bản thiết kế; buổi hôm nay nhóm trình bày nguyên lý, chưa thực hiện demo trực tiếp.

**Câu chuyển:** Để đánh giá vòng xử lý này, nhóm kiểm chứng riêng từng tầng rồi mới chốt toàn hệ thống.

**Ghi chú dự phòng — không đọc hết trong lượt chính:** Nếu mất mạng, không hứa ứng dụng vẫn điều khiển từ xa được. Logic tại thiết bị và đường truyền app/server là hai phạm vi phụ thuộc khác nhau.


### Slide 13 — Kiểm chứng theo từng tầng

**Người nói:** Người 2 — thành viên còn lại. **Thời gian:** 12:20–13:35 (75 giây).

**Mục tiêu:** Đưa bằng chứng vừa đủ và cho thấy hiểu cách đánh giá hệ thống IoT.

**Thông điệp:** Kết quả phần mềm và nghiệm thu mạch thật được ghi riêng.

**Nội dung hiển thị trên slide:**

- 43 test mobile • 24 test backend
- 15 ca tích hợp app web + backend + MQTT giả lập
- Mobile login: người dùng đã xác nhận
- Còn chốt: board → mobile, GPS, độ trễ và push native

**Ảnh / sơ đồ cần chèn:** Ba cột Đã kiểm tra phần mềm / Đã được người dùng xác nhận / Cần nghiệm thu tiếp. Ghi mốc 25–26/10/2026 và nhãn MQTT giả lập. Không tạo biểu đồ latency hoặc tỷ lệ chính xác khi chưa đo.

**Chỉ sơ đồ / nhịp trình bày:** Chỉ cột phần mềm, xác nhận đăng nhập, rồi nhóm phép thử toàn luồng. Không đọc chi tiết framework test.

**Lời thoại để tập nói:**

Nhóm chia việc kiểm chứng thành phần mềm và thiết bị thực. Theo kết quả đã lưu ngày hai mươi lăm và hai mươi sáu tháng mười, có bốn mươi ba test mobile, hai mươi bốn test backend và mười lăm ca tích hợp với MQTT giả lập. Các ca này giúp kiểm tra luồng dữ liệu và xử lý lệnh trong môi trường phần mềm. Người dùng cũng đã xác nhận đăng nhập mobile thành công.

Tuy nhiên, các kết quả đó chưa thay cho nghiệm thu xuyên suốt từ board thật đến điện thoại. Để đánh giá đầy đủ hệ thống IoT, cần kiểm tra thêm khi bánh quay, cảm biến tạo sự kiện, gateway gửi dữ liệu, giao diện cập nhật và lệnh quay về đúng thiết bị. Cũng cần thử tình huống mất kết nối, dữ liệu cũ và GPS mất fix.

Những phép đo như độ trễ toàn luồng hoặc độ ổn định khi chạy lâu chỉ nên đưa số khi đã đo. Phần tiếp theo của nhóm là hoàn thiện bằng chứng cho các ca thực tế và push native. Cách đánh giá này tập trung vào sự phối hợp giữa các tầng, thay vì chỉ đếm số màn hình hay chức năng.

**Câu chuyển:** Từ kiến trúc và phạm vi kiểm chứng đó, nhóm rút ra những điểm chính sau.

**Ghi chú dự phòng — không đọc hết trong lượt chính:** Các con số là kết quả lịch sử đã lưu, không phải bộ test vừa chạy lại trong ngày chỉnh slide. Không công bố tỉ lệ phát hiện/độ trễ khi chưa có phép đo.


### Slide 14 — Một mô hình nhỏ. Một vòng IoT hoàn chỉnh.

**Người nói:** Người 2 — thành viên còn lại. **Thời gian:** 13:35–14:30 (55 giây).

**Mục tiêu:** Kết lại giá trị về hệ thống IoT và hướng hoàn thiện phù hợp bài tập lớn.

**Thông điệp:** Thu thập → truyền → xử lý / lưu → hiển thị → điều khiển / phản hồi.

**Nội dung hiển thị trên slide:**

- Cảm biến, thiết bị biên, mạng, dịch vụ và ứng dụng phối hợp thành một hệ thống
- Xử lý tại biên, dữ liệu có độ mới và điều khiển có phản hồi
- Hoàn thiện bằng chứng toàn luồng và triển khai theo yêu cầu môn học

**Ảnh / sơ đồ cần chèn:** Vòng IoT sáu điểm tự vẽ, nền tối đồng bộ trang bìa. Dòng cuối: Cảm ơn thầy cô và các bạn. Không chèn QR demo hoặc mở màn hình chạy thật.

**Chỉ sơ đồ / nhịp trình bày:** Chỉ vòng IoT theo chiều kim đồng hồ; nêu ba điểm ngắn rồi nhìn khán giả để kết thúc.

**Lời thoại để tập nói:**

Qua Smart Motorbike Guardian, nhóm muốn thể hiện ba điểm. Thứ nhất là cấu trúc IoT đầy đủ: dữ liệu được tạo ra từ cảm biến, xử lý trên thiết bị, truyền qua mạng, lưu và cung cấp cho ứng dụng; người dùng có thể tác động ngược lại bằng lệnh điều khiển.

Thứ hai là sự phối hợp giữa các phần: firmware có logic trạng thái, dữ liệu cần được đánh giá độ mới và kết quả lệnh phải phản hồi về giao diện. Thứ ba là một backend phục vụ cả web và mobile, giúp theo dõi và tra cứu thống nhất.

Trong phạm vi bài tập lớn, nhóm ưu tiên các luồng này hoạt động đúng và có bằng chứng kiểm tra rõ ràng. Hướng hoàn thiện là nghiệm thu toàn luồng trên mạch thật, push native và môi trường triển khai theo yêu cầu môn học. Nhóm em xin cảm ơn thầy cô và các bạn.

**Câu chuyển:** Nhóm xin nhận câu hỏi từ thầy cô và các bạn.

**Ghi chú dự phòng — không đọc hết trong lượt chính:** Không mở thêm demo hoặc source ở cuối. Người phụ trách phần nào trả lời trước phần đó; người còn lại bổ sung khi cần.

## 5. Tập phối hợp hai người

1. Người 1 tập slide 1–9 đến hết câu chuyển trong **07:35**. Mốc kiểm tra: hết slide 4 ở **03:00**, hết slide 6 ở **05:05**, hết slide 9 ở **07:35**.
2. Người 2 tập slide 10–14 trong **06:55**. Mốc kiểm tra chung: hết slide 11 ở **11:00**, hết slide 12 ở **12:20**, kết thúc ở **14:30**.
3. Hai người tập liền một lượt: người 1 kết slide 9 rồi nhường lời; người 2 nhận phần và chuyển slide 10. Người bấm slide đi theo người đang nói, không chuyển sớm khi người 1 còn giải thích GPS.
4. Nếu chậm, rút ví dụ phụ và lời chú thích ở slide 5–8 hoặc slide 10–11; giữ sơ đồ kiến trúc, vai trò server/database, hai chiều dữ liệu/lệnh và kết luận. Phần ghi chú dự phòng không thuộc lời nói chính.
5. Giữ thuật ngữ nhất quán: Node B cảm biến, Node A gateway/đầu ra; MQTT giữa thiết bị và backend; REST/STOMP giữa backend và ứng dụng. Cả hai dùng cùng bản v4.

## 6. Ảnh minh họa và phạm vi kết quả

- Slide 1–10, 12 và 14 dùng hình/sơ đồ vector tự vẽ trong PowerPoint; có thể sửa từng khối, đường nối và chữ.
- Slide 11 dùng [ảnh dashboard bài thử phần mềm](evidence/wheel-features-2026-10-20/wheel-dashboard-fixture.png) và [ảnh mobile web với MQTT emulator](evidence/mobile/2026-10-25-integrated/mobile-web-emulator.png). Caption trên slide ghi đúng nguồn giả lập; không gọi là ảnh điện thoại hoặc board thật.
- Nếu có ảnh mạch thật rõ, có thể thay vùng sơ đồ slide 5 bằng ảnh đó, giữ nhãn Node A/Node B/Hall/MPU/GPS/relay. Hiện không dùng ảnh mạch lấy trên mạng để giả làm mạch nhóm.
- Không sử dụng số liệu thống kê mất trộm, độ chính xác, latency hoặc thời gian chạy ổn định chưa có nguồn/đo.
- Không gọi broker từ xa là backend/DB đã lên cloud; phân biệt H2 file bản test với PostgreSQL cấu hình triển khai.
- Kết quả phần mềm là mốc đã ghi 25–26/10/2026, không phải phép nghiệm thu mới trong lần sửa slide. GPS FIX ngoài trời do người dùng xác nhận; hồ sơ log FIX và toàn luồng còn cần bổ sung.

## 7. Câu hỏi và người trả lời chính

| Câu hỏi | Người trả lời | Trả lời ngắn, đúng phạm vi |
|---|---|---|
| Vì sao đây là hệ thống IoT? | Người 1 mở, người 2 bổ sung | Có cảm nhận, xử lý tại biên, kết nối mạng, backend/lưu trữ, ứng dụng và chiều điều khiển phản hồi. Dùng sơ đồ slide 4 hoặc vòng slide 14. |
| Vì sao hai node? Một node có làm được không? | Người 1 | Một node có thể đáp ứng mô hình nhỏ. Nhóm tách cảm biến khỏi gateway/đầu ra để thực hành giao tiếp liên node và phát hiện mất liên lạc; không khẳng định hai node luôn tốt hơn. |
| Vì sao dùng FreeRTOS? | Người 1 | Nhiều việc cần tiến hành đồng thời. Task GPS không chặn Hall/MPU; queue chuyển mẫu, mutex bảo vệ dữ liệu chung. |
| GPS trong nhà mất fix thì sao? | Người 1 | Phân biệt NO_FIX/STALE, giữ vị trí hợp lệ cuối có ghi độ mới; Hall/MPU vẫn hoạt động. Không tạo marker 0,0 thay thế. |
| Quá tốc độ có tự khóa motor không? | Người 1 | Không. Overspeed chỉ cảnh báo. Khóa là logic khác, phải qua điều kiện bánh dừng và dữ liệu còn mới. |
| Có phải phát hiện tai nạn bằng AI? | Người 1 | Không. Hiện dùng ngưỡng gia tốc/nghiêng và thời gian, cần thêm thử nghiệm báo nhầm. |
| Vì sao dùng MQTT? | Người 2 | Dùng publish/subscribe để trao đổi dữ liệu, sự kiện và lệnh giữa Node A và backend qua broker; ứng dụng dùng API backend thay vì nối trực tiếp board. Không khẳng định MQTT bảo đảm mọi bản tin đã thực thi. |
| REST và STOMP khác vai trò thế nào? | Người 2 | REST lấy snapshot/lịch sử và gửi yêu cầu; STOMP qua WebSocket đưa cập nhật từ server đến giao diện. Không đưa ra latency chưa đo. |
| ACK có chứng minh motor thực sự dừng không? | Người 2, người 1 bổ sung | ACK cho biết firmware đã xử lý/thay đổi đầu ra hoặc từ chối. Chưa có cảm biến phản hồi tiếp điểm relay; nghiệm thu tải cần quan sát/đo thực tế. |
| Backend/DB đã ở cloud chưa? | Người 2 | Broker hiện từ xa. Bản test dùng backend/H2 trên laptop; repo có cấu hình PostgreSQL/deployment. Chỉ gọi cloud-hosted khi thực sự triển khai backend/DB ở đó. |
| Mất Internet thì sao? | Người 1 phần thiết bị; người 2 phần mạng/app | Logic cục bộ không cần gọi server cho từng quyết định. Giám sát và điều khiển từ xa phụ thuộc kết nối; chưa có cơ chế đồng bộ bù toàn bộ lịch sử offline để cam kết. |
| Web và mobile có hai database không? | Người 2 | Cùng backend và nguồn dữ liệu. Quyền kiểm tra ở backend; ảnh hai giao diện không tự chứng minh chúng đã được nghiệm thu với board thật. |

## 8. Checklist trước buổi thuyết trình

- Mở PPTX trên máy sẽ trình chiếu, kiểm tra font và chế độ 16:9. PDF để dự phòng.
- Điền tên nhóm/thành viên/môn học nếu muốn; hiện deck không bịa tên giảng viên hoặc thành viên.
- Hai người mở cùng bản v4, tập câu bàn giao 9 → 10 và chốt ai bấm chuyển slide.
- Tập có bấm giờ; chỉ lời thoại và câu chuyển là phần nói chính. Tự thay cách xưng hô phù hợp nhóm.
- Nếu có kết quả hardware mới trước 28/10, cập nhật slide 13 bằng Actual có bằng chứng; giữ nhãn giả lập cho ảnh cũ.

Nguồn đối chiếu: [tính năng/kịch bản test](TONG-HOP-TINH-NANG-VA-KICH-BAN-TEST.md), [Hall và tốc độ](BA-TINH-NANG-HALL-VA-TOC-DO.md), [evidence tích hợp](evidence/mobile/2026-10-25-integrated/README.md), [sửa Expo Go và kết quả 43 tests](../frontend/mobile/README.md).
