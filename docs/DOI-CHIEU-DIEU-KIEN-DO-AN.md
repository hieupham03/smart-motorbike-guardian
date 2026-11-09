# Đối chiếu các điều kiện giới hạn điểm

Dự án có đủ các thành phần kỹ thuật cốt lõi của mô hình IoT. Chưa thể tuyên bố vượt toàn bộ điều kiện đánh giá chỉ từ mã nguồn và kiểm thử tự động: demo với thiết bị thật, nộp bài, vấn đáp và liêm chính học thuật còn phụ thuộc việc nhóm thực hiện trước giảng viên.

| Điều kiện cần đáp ứng | Căn cứ hiện có | Kết luận trong phạm vi đã kiểm |
|---|---|---|
| Có thiết bị vật lý hoạt động | Hai node thật, UART mới, Hall/MPU, cảnh báo bánh quay và còi; quan sát liên tục 30 phút | Đã thử mạch của bản chuẩn bị demo; còn cần ảnh prototype thật |
| Có backend quản lý, không chỉ đọc và hiển thị cảm biến | Spring Boot tiếp nhận MQTT, lưu telemetry/cảnh báo/lệnh và quản lý thiết bị | Đáp ứng về triển khai; kiểm thử backend đã qua |
| Tự xây chức năng quản lý người dùng và thiết bị | Auth/User/Device/Admin controller, ownership, onboarding, chia sẻ quyền, thu hồi và ngừng sử dụng; UI web/mobile riêng | Đáp ứng; không chỉ ghép dashboard có sẵn |
| Có xác thực và phân quyền | JWT access/refresh, BCrypt, Owner/Viewer/Admin; kiểm thử chặn Viewer sửa dữ liệu và người ngoài đọc thiết bị | Đáp ứng yêu cầu có xác thực/phân quyền; không đồng nghĩa toàn hệ thống đã được kiểm định bảo mật |
| Nộp mã nguồn chạy được | Đủ cấu trúc môn học; backend 36, web 23, mobile 45 tests qua; có build và bộ chạy | Có bằng chứng chạy phần mềm và mạch; nhóm nộp đúng URL/tag, không kèm cấu hình riêng |
| Demo được dữ liệu đầu cuối | Kích hoạt bằng web, Node A có auth, telemetry vào DB/ứng dụng, ARM/ACK/cảnh báo và khôi phục | Luồng web/mạch thật đã được thử; xem evidence classroom. Native phone chưa thử trong lượt này |
| Mỗi thành viên tham gia vấn đáp | Có tài liệu kiến trúc và phân công; chưa có kết quả vấn đáp của bốn người | Chưa thể xác nhận bằng repository; từng người phải tham gia và giải thích phần việc thực tế |
| Trích dẫn và tuân thủ liêm chính học thuật | Báo cáo có tài liệu tham khảo và chú thích hỗ trợ AI/hình ảnh | Có nền tảng; cần đối chiếu từng nội dung vay mượn, giấy phép và yêu cầu AUR.99 đầy đủ của giảng viên trước khi kết luận |

## Phiên demo cần chốt

1. Chọn đúng thiết bị HARDWARE, quay bánh thật và cho thấy tốc độ đổi trên ứng dụng. Đối chiếu UART, MQTT và bản ghi backend/DB của cùng thiết bị.
2. Dừng bánh, bật bảo vệ từ ứng dụng; cho thấy kết quả thực thi và relay ngắt. Quay bánh tay để nhận cảnh báo và nghe còi. Tắt bảo vệ và quan sát phục hồi.
3. Khi bánh đang quay, yêu cầu bật bảo vệ hoặc khóa phải bị từ chối với lý do phù hợp. Không trình bày một yêu cầu đã gửi là lệnh đã thực hiện.
4. Đăng nhập Viewer để xem dữ liệu; thử thao tác điều khiển và chứng minh bị chặn. Kiểm tra cả API, không chỉ việc ẩn nút.
5. Lưu video, ảnh và log cần thiết; không để lộ mật khẩu/token/dữ liệu cá nhân. Nếu GPS chưa có fix, nói rõ và vẫn demo luồng Hall. Ca vị trí thật cần FIX qua toàn hệ thống riêng.

Để vượt điều kiện tối thiểu về luồng đầu cuối, một luồng cảm biến thật chạy xuyên hệ thống cùng phản hồi điều khiển rõ ràng là bằng chứng trọng tâm. GPS, native push hoặc mọi tính năng nâng cao không tự động là điều kiện bắt buộc trong tám câu giới hạn điểm này; đối chiếu thêm các mục chấm chi tiết của đề bài.

## Phần nhóm tự xác nhận

- Tất cả thành viên dùng tài khoản riêng và giải thích được đóng góp thực tế; không tạo commit giả để chia đều số lượng.
- Nộp đúng bản phát hành, không dùng lại clone lịch sử cũ sau khi làm sạch bí mật.
- Kiểm tra trích dẫn cho hình/sơ đồ, tài liệu, thuật toán và mã tham khảo. Có footnote AI chưa đủ để tự khẳng định đã tuân thủ toàn bộ AUR.99 khi chưa đối chiếu văn bản quy định đầy đủ.
- Dùng [hồ sơ phát hành](RELEASE.md) và [raw/summary mạch thật](evidence/classroom-hardware/README.md) để đối chiếu số liệu. Word/PDF/Markdown và slide đã đồng bộ; danh tính nhóm tiếp tục để trống theo yêu cầu người phụ trách.

## Đối chiếu toàn bộ PDF, ngoài tám điều kiện giới hạn điểm

| Mục đề bài | Triển khai và bằng chứng hiện có | Phạm vi còn cần nhóm chốt |
|---|---|---|
| 4.1 Phân tích bài toán | Báo cáo đủ bối cảnh, người dùng, mục tiêu gắn vấn đề, yêu cầu/ràng buộc và nguồn thứ cấp | Nhóm hiểu và bảo vệ được lựa chọn, không đọc nguyên slide |
| 4.2 Thiết bị | Hai ESP32, Hall/MPU/GPS, đầu ra, UART, ID, cấu hình/lệnh, heartbeat/reconnect; Hall/MPU và còi đã thử | GPS trong phiên là NO_FIX; không thay tọa độ giả |
| 4.3 Giao thức | MQTT, UART, topic/payload/đơn vị, ACK, online/offline, timeout/duplicate và offline buffer có giới hạn | Không gọi publish QoS0 thành bảo đảm đã lưu DB |
| 4.4a Người dùng | Tạo tài khoản, phiên, hồ sơ/mật khẩu, ACTIVE/LOCKED và ba vai trò | Mật khẩu demo local không phải credential thiết bị |
| 4.4b Vòng đời | Provision/claim có hạn, ownership, active/offline, metadata hw/fw, revoke, reactivate bằng khóa mới và decommission | Decommission vĩnh viễn dùng ca kiểm riêng; chọn revoke trên board duy nhất khi demo |
| 4.4c Dữ liệu | Validate, lịch sử theo thời gian, biểu đồ/thống kê, CSV, DB và realtime | Phiên bánh RAM khác lịch sử DB; không có ADC pin |
| 4.4d–e Cảnh báo/điều khiển | Hall alert/còi thật, ACK/RESOLVED, cấu hình NVS và phản hồi/lịch sử lệnh | ACK GPIO không thay phép đo tiếp điểm relay |
| 4.5 Bảo mật | BCrypt/JWT, ownership, audit, credential/ACL từng UUID, broker từ chối khóa cũ thực tế; HTTPS/WSS web, ít nhất hai ca bảo mật | MQTT TCP/Expo Go HTTP chỉ trong LAN riêng; chưa mã hóa toàn bộ các kênh |
| 4.6 Giao diện | Web đầy đủ và mobile dùng chung API; dev tách riêng, quyền được kiểm backend | Điện thoại native được người phụ trách hoãn thử |
| 6 Thiết kế | 14 sơ đồ native VP, ERD, hai sequence, vòng đời, API/topic/payload, ma trận quyền và đe dọa | Sơ đồ không thay xác minh điện áp/chân breakout thật |
| 7.1 Chức năng | 36/23/45 tests, 38 UI fixtures và phiên mạch thật: kích hoạt, dữ liệu, lệnh, cấu hình, offline, cảnh báo, sai quyền và thu hồi | Trước lớp chạy lại 10 bước với cấu hình/mạng dùng hôm đó |
| 7.2 Đánh giá | Raw 30 phút và 5 phép đo lệnh, phương pháp/nhận xét/giới hạn rõ | Không tuyên bố độ chính xác ngã, mất gói hoặc tuổi thọ từ các số này |
| 8.1 Source | Đúng cây thư mục, cấu hình mẫu, lịch sử thật, CI và tag/release bất biến | Nhóm đối chiếu đủ tài khoản bốn người; ảnh prototype thật còn thiếu |
| 8.2 Báo cáo | Đủ cấu trúc, 24 trang chính + phụ lục, Word/PDF/Markdown, ảnh UI, hình/sơ đồ, phép đo và link GitHub | Danh tính để trống theo yêu cầu; bổ sung ảnh mạch thật trước nộp |
| 8.3–8.4 Trình bày/demo | 12 slide/10 phút, Speaker Notes, hai người nói và 10 bước demo 5–7 phút; video màn hình dự phòng | Video chưa có toàn mạch trong khung; không thay live demo hoặc vấn đáp bốn người |
| 9–10 Điều kiện/đạo đức | Phân biệt ảnh thật/fixture/AI, nguồn và footnote, không dùng tuyên bố an toàn thương mại | AUR.99 đầy đủ chưa được cung cấp; nhóm chịu trách nhiệm trích dẫn/hiểu phần đã dùng |

Hướng dẫn thao tác chi tiết: [chạy web/mobile với mạch thật](CHAY-WEB-MOBILE-VOI-PHAN-CUNG-THAT.md). Kiểm thử và giới hạn được ghi trong [hồ sơ phát hành](RELEASE.md); nguồn yêu cầu nằm trong [đề bài](assignment/DE-BAI-IOT.pdf).
