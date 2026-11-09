# Smart Motorbike Guardian v1.0.0

Bản mã nguồn bàn giao cho bài tập lớn IoT và ứng dụng trên breadboard. Cấu trúc, cấu hình mẫu, mã nguồn và tài liệu được kiểm tra trước khi gắn tag `v1.0.0`. Bản bàn giao không kèm credential, database runtime hoặc APK native đã nghiệm thu.

## Nội dung bàn giao

- Firmware hai node: FreeRTOS, UART/heartbeat, Hall/MPU/GPS, trạng thái bảo vệ, relay/còi và kiểm tra điều kiện trước thực thi lệnh.
- Backend Spring Boot, PostgreSQL/Flyway, MQTT, REST/STOMP, Owner/Viewer/Admin, command/ACK/timeout và lịch sử.
- Web React và mobile Expo/React Native dùng chung hợp đồng dữ liệu; khu vực dev/simulator tách khỏi luồng người dùng.
- Phiên quay bánh trong RAM, chống trộm theo Hall, cảnh báo tốc độ và cấu hình ngưỡng từ ứng dụng, lưu NVS trên Node A.
- Hướng dẫn cài/chạy, sơ đồ/linh kiện, báo cáo và slide hiện hành, kiểm thử và quy tắc phát hành.

Repository dùng một nguồn firmware tại `firmware/`, mobile ở `frontend/mobile/`, bộ chạy ở `deployment/`. Các bộ báo cáo/slide cũ, mirror firmware và công cụ biên tập nội bộ được lưu riêng ngoài phạm vi xuất bản. Quá trình làm việc và danh tính tác giả trong lịch sử nhóm được bảo toàn khi chuẩn bị bản làm sạch.

## Kiểm chứng

| Kiểm tra cục bộ trên cấu trúc phát hành | Kết quả |
|---|---|
| Backend H2/Flyway/API/MQTT/ACK/quyền/ngưỡng | 27 tests PASS và đóng gói executable JAR |
| Web | 23 tests PASS, production build PASS |
| Mobile | 45 tests PASS, TypeScript/lint và web export PASS |
| Cài dependencies từ bản export source sạch | Web và mobile `npm ci`, kiểm thử/build tương ứng PASS |
| UI fixtures | 34 ca giao diện, 14 ca ngưỡng, 8 ca bản đồ PASS |
| Backend thật + mobile export + MQTT/push emulator local | 15 checks PASS; không tác động broker/mạch thật |
| Firmware host | UART, Hall speed và wheel activity PASS |
| Arduino ESP32 core 2.0.17 | Hai sketch biên dịch PASS từ bản export source với cấu hình Wi-Fi mẫu; chưa nạp firmware trong lượt kiểm tra này |
| Compose và launcher | `docker compose config --quiet` và launcher `-Check` PASS; chưa build/chạy Docker image trong lượt này |
| Xuất bản | Cấu trúc/link/env mẫu PASS. Đã làm sạch giá trị Wi-Fi khỏi 12 nhánh GitHub; giữ đủ 38 commit gốc và metadata công việc. Quét lại toàn bộ lịch sử nhánh bằng Gitleaks không còn phát hiện bí mật |

Quy trình [GitHub Actions](https://github.com/hieupham03/smart-motorbike-guardian/actions/workflows/verify.yml) chạy lại từ checkout sạch sau push và tag. Chỉ kết quả của đúng commit đang xét mới xác nhận CI từ xa. Bộ kiểm này không đồng nghĩa điện thoại, GPS RF hoặc relay/motor đã được nghiệm thu.

Web được cập nhật Vite/plugin/React Router để loại cảnh báo dependency đã phát hiện; `npm audit` web trả 0. Mobile đã áp dụng bản vá tương thích, không còn mức high/critical trong lần quét; còn 31 cảnh báo low/moderate ở cây phụ thuộc Expo/Jest/tooling. Không ép hạ Expo SDK hoặc đổi dependency lớn bằng `audit fix --force`; tiếp tục theo dõi bản vá tương thích trước triển khai ngoài phạm vi môn học.

## Phạm vi nghiệm thu

- Người vận hành đã xác nhận GPS định vị ngoài trời và đã thử thành công phát hiện bánh quay khi bật bảo vệ. Đây là xác nhận người dùng trong quá trình làm việc, không phải chiến dịch đo độ chính xác hay độ tin cậy cho xe thật.
- Kiểm thử browser/mobile export sử dụng fixture hoặc backend/emulator cục bộ. Không có kết quả xác nhận native push trên điện thoại thật trong tag này.
- Sau khi nạp Node A, còn cần chạy ca đổi ngưỡng từ web/mobile và giữ ngưỡng sau mất điện trên mạch thật theo [hướng dẫn](CAI-DAT-NGUONG-TOC-DO-WEB-MOBILE.md).
- Bản đồ cần kết nối nhà cung cấp; định vị GPS phụ thuộc thu vệ tinh. Điện áp pin chưa có ADC nên không bịa dữ liệu battery.
- Mô hình dùng Wi-Fi/broker thử nghiệm, chưa có modem di động, cấp nguồn xe thương mại hay chứng nhận an toàn. Cảnh báo nghiêng/ngã chưa phải xác nhận tai nạn; cảnh báo tốc độ không điều khiển tốc độ motor.

## Nhận bản và chạy

Clone repository, checkout `v1.0.0`, rồi làm theo [README](../README.md). Các biến nhạy cảm được tạo/điền tại máy chạy. Khi cập nhật từ bố cục cũ, dừng bộ chạy hiện tại, cài dependencies tại `frontend/mobile/` và dùng `deployment/start-mobile-demo.bat`.

Mật khẩu Wi-Fi từng xuất hiện trong lịch sử public phải được đổi tại nguồn. Làm sạch Git không thu hồi được các bản clone, fork, tham chiếu pull request hoặc bản lưu đã tải trước đó. Lịch sử các nhánh đã được cập nhật sau khi người phụ trách xác nhận; mã commit thay đổi, tác giả và trình tự công việc được giữ lại. Thành viên nên clone mới, sau đó áp dụng riêng phần công việc chưa push; không merge hoặc push lại lịch sử cũ. Không tự thay đổi tag đã công bố.

Mỗi thành viên phải dùng tài khoản GitHub riêng để commit/push công việc thực tế; việc tạo release không thay thế yêu cầu này. GitHub contributors trong lần kiểm tra hiện ghi nhận `Djicz` và `hieupham03`; nhóm cần đối chiếu đủ tài khoản của bốn người, kể cả trường hợp email commit chưa liên kết tài khoản. Không tạo đóng góp giả hoặc đổi tác giả lịch sử để bù phần này.

Repository hiện public. Nếu nhóm chuyển private, cấp quyền cho tài khoản giảng viên trước bàn giao theo [quy tắc repository](REPOSITORY-POLICY.md). Thư mục hardware hiện có hình minh họa; ảnh chụp breadboard thật còn cần nhóm bổ sung sau khi kiểm tra dữ liệu cá nhân.

Việc đáp ứng các điều kiện giới hạn điểm được đối chiếu riêng tại [bảng điều kiện đồ án](DOI-CHIEU-DIEU-KIEN-DO-AN.md). Bản phát hành mã nguồn không thay thế buổi demo hoặc vấn đáp cá nhân.
