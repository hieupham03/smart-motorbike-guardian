# Đối chiếu các điều kiện giới hạn điểm

Dự án có đủ các thành phần kỹ thuật cốt lõi của mô hình IoT. Chưa thể tuyên bố vượt toàn bộ điều kiện đánh giá chỉ từ mã nguồn và kiểm thử tự động: demo với thiết bị thật, nộp bài, vấn đáp và liêm chính học thuật còn phụ thuộc việc nhóm thực hiện trước giảng viên.

| Điều kiện cần đáp ứng | Căn cứ hiện có | Kết luận trong phạm vi đã kiểm |
|---|---|---|
| Có thiết bị vật lý hoạt động | Hai node, Hall, MPU, GPS, relay/motor/còi; người vận hành đã xác nhận mạch hoạt động và thử thành công bảo vệ theo bánh quay | Có cơ sở đáp ứng; cần vận hành lại và lưu ảnh/video của phiên bản nộp |
| Có backend quản lý, không chỉ đọc và hiển thị cảm biến | Spring Boot tiếp nhận MQTT, lưu telemetry/cảnh báo/lệnh và quản lý thiết bị | Đáp ứng về triển khai; kiểm thử backend đã qua |
| Tự xây chức năng quản lý người dùng và thiết bị | Auth/User/Device/Admin controller, ownership, onboarding, chia sẻ quyền, thu hồi và ngừng sử dụng; UI web/mobile riêng | Đáp ứng; không chỉ ghép dashboard có sẵn |
| Có xác thực và phân quyền | JWT access/refresh, BCrypt, Owner/Viewer/Admin; kiểm thử chặn Viewer sửa dữ liệu và người ngoài đọc thiết bị | Đáp ứng yêu cầu có xác thực/phân quyền; không đồng nghĩa toàn hệ thống đã được kiểm định bảo mật |
| Nộp mã nguồn chạy được | Đủ cấu trúc môn học; backend 27, web 23, mobile 45 tests qua; hai sketch biên dịch; hướng dẫn cài/chạy và CI | Có bằng chứng chạy phần mềm; nhóm phải nộp đúng URL/tag và chạy lại theo cấu hình máy demo |
| Demo được dữ liệu đầu cuối | Người dùng đã thử bảo vệ với mạch; kiểm thử phần mềm kiểm luồng backend/mobile/MQTT emulator | Cần chốt demo thiết bị thật → MQTT → backend → DB → ứng dụng, cùng luồng lệnh/ACK quay lại thiết bị; emulator không thay thế ca này |
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
- Dùng [hồ sơ phát hành](RELEASE.md) cho số liệu kiểm thử mới nhất. Một số con số và đường dẫn thao tác trong báo cáo được chốt trước lần tổ chức repository; cần rà thống nhất bản báo cáo cuối trước nộp.

Hướng dẫn thao tác chi tiết: [chạy web/mobile với mạch thật](CHAY-WEB-MOBILE-VOI-PHAN-CUNG-THAT.md). Kiểm thử và giới hạn được ghi trong [hồ sơ phát hành](RELEASE.md); nguồn yêu cầu nằm trong [đề bài](assignment/DE-BAI-IOT.pdf).
