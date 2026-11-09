# Smart Motorbike Guardian v1.1.0

Bản mã nguồn chuẩn bị cho demo và bảo vệ học phần IoT trên breadboard. Node A dùng firmware v1.1.0; Node B giữ v1.0.0. Tag v1.0.0 trước đó được giữ nguyên. Bản phát hành mã nguồn không thay kết quả vấn đáp hoặc xác nhận của giảng viên.

## Nội dung bàn giao

- Hai node, FreeRTOS/UART/heartbeat, Hall/MPU/GPS, relay/còi, máy trạng thái và điều kiện từ chối lệnh.
- Backend Spring Boot, H2/PostgreSQL/Flyway, MQTT/REST/STOMP, người dùng, ownership, lịch sử và audit.
- Broker classroom có credential riêng từng UUID, BCrypt, ACL và ngắt phiên khi thu hồi; kích hoạt lại cấp khóa mới. Node A không tự kết nối ẩn danh khi thiếu cấu hình riêng.
- Web React và mobile Expo dùng chung dữ liệu/quyền/lệnh; các công cụ cấp khóa và provision chỉ nằm trong khu dev theo quyền. Web classroom có HTTPS/WSS với chứng chỉ local tự ký.
- Phiên bánh RAM, bảo vệ theo Hall và ngưỡng tốc độ chỉnh từ ứng dụng, lưu NVS. Không có PWM điều tốc hoặc chức năng tự cắt motor khi vượt tốc độ.
- Bộ chạy tại trường, kịch bản 10 bước demo, 12 slide/10 phút, lời thoại hai người và câu hỏi cho cả bốn thành viên.
- Báo cáo Word/PDF/Markdown theo cấu trúc đề bài, 14 sơ đồ Visual Paradigm gốc, số liệu và raw observations được kiểm riêng tư.

## Kiểm chứng

| Phép kiểm | Kết quả và phạm vi |
|---|---|
| Backend | 36 tests PASS, gồm 9 ca MQTT broker thật trên localhost: auth, ACL, telemetry/DB, revoke/decommission, rotation, bootstrap/onboarding và reactivate |
| Web | 23 tests và production build PASS |
| Mobile | 45 tests/12 suites, TypeScript, lint và web export PASS; chưa xác nhận native trên điện thoại trong lượt này |
| UI cấp kết nối | 38 ca web/mobile web PASS với fixture: xác nhận, che khóa, không lưu khóa vào browser storage, quyền Viewer, admin/provision và màn hình nhỏ |
| Công cụ đo | 10 selftests PASS; không quy số poll thành mất gói, không trừ đồng hồ firmware/server để tự tạo độ trễ |
| Mạch thật | Kích hoạt từ web, Node A có auth, telemetry vào DB và lên web; ARM/ACK → quay bánh → cảnh báo; người vận hành xác nhận còi thật; DISARM về PARKED |
| Cấu hình/quyền | Web đổi 2 → 3,5 km/h có ACK/readback; Viewer GET 200 và yêu cầu điều khiển trực tiếp 403; cảnh báo ACKNOWLEDGED → RESOLVED |
| Chạy mạch 30 phút | 1.788 poll thành công, 0 lỗi HTTP, 1.743 bản ghi mới quan sát; không thấy uptime giảm hoặc dữ liệu đứng yên quá 5 giây. Không suy thành tỷ lệ mất gói MQTT hoặc độ tin cậy dài hạn |
| Độ trễ lệnh | 5/5 RESET_WHEEL_SESSION EXECUTED; client quan sát kết quả trong 297–578 ms, trung vị 310,19 ms; không phải sensor-to-dashboard latency |
| Mất nguồn/NVS | Hai node mất nguồn → OFFLINE; cấp lại → ACTIVE, cảm biến mới; ngưỡng 3,5 km/h vẫn giữ. Không tuyên bố độ trễ phát hiện offline từ ca đã bắt đầu quan sát sau khi OFFLINE |
| Thu hồi thật | Telemetry không đổi trong 10 giây, UART vẫn mới; Serial Node A có mã MQTT rc=4 từ chối khóa cũ. Có một lần lỗi vận chuyển rc=-2 trong các lần thử lại, được giữ trong evidence |
| Khôi phục thật | Reactivate sinh khóa khác; cập nhật cấu hình riêng/nạp Node A phục hồi kết nối. Trạng thái cuối PARKED, ngưỡng đã trả về 2 km/h; nguồn motor vẫn tắt theo xác nhận người vận hành |
| HTTPS/WSS | TLS 1.3 với certificate pin riêng, đăng nhập qua HTTPS và nhận sự kiện mạch thật qua WSS; chứng chỉ local chưa có CA công khai |
| Firmware | Node A biên dịch và nạp COM6 thành công; Node B đang hoạt động trên COM11. UART/MPU được quan sát trong phiên; không nhận compiler PASS thành xác nhận tiếp điểm relay |
| Tài liệu | Báo cáo có 24 trang chính và phụ lục kỹ thuật; 12 slide, Speaker Notes và 14 sơ đồ native đã kiểm xuất/bố cục |

[Raw/summary mạch thật](evidence/classroom-hardware/README.md), [kiểm broker](evidence/mqtt-security/README.md), [công cụ đo](DO-LUONG-VA-LUU-MINH-CHUNG.md). [GitHub Actions](https://github.com/hieupham03/smart-motorbike-guardian/actions/workflows/verify.yml) kiểm lại đúng commit/tag; kiểm local không tự thay trạng thái CI.

## Chạy bản demo

Làm theo [chuẩn bị tại trường](CHUAN-BI-DEMO-TAI-TRUONG.md). Source chuẩn ở `firmware/`, mobile ở `frontend/mobile/`, bộ chạy ở `deployment/`. Có cold baseline classroom chưa claim để tập lại; script giữ bản sao dữ liệu hiện tại và từ chối ghi DB đang mở. Không dùng baseline để tự tạo kết quả thử.

## Giới hạn và đầu vào của nhóm

- GPS trong phiên này là NO_FIX; chưa xác nhận tọa độ thật qua toàn hệ thống. Điện áp pin chưa có ADC. Native push, OTA và AI không nằm trong phần đã nghiệm thu.
- MQTT TCP và Expo Go HTTP chỉ dùng trong LAN riêng; HTTPS của web không mã hóa thay hai kênh này. Chứng chỉ tự ký cần kiểm fingerprint trước khi chấp nhận.
- Chưa đo riêng tiếp điểm relay, dòng tiêu thụ, độ chính xác Hall/ngã hoặc độ ổn định dài hạn. Mô hình không phải sản phẩm an toàn/chống trộm thương mại.
- Ảnh dashboard mới có dữ liệu mạch thật; các ảnh UI fixture được ghi nhãn. **Ảnh chụp toàn prototype vẫn cần nhóm cung cấp**; không dùng hình minh họa/AI làm ảnh mạch thật.
- Danh tính nhóm tiếp tục để trống theo yêu cầu người phụ trách. Nhóm tự điền và chuẩn bị vấn đáp cả bốn người; đối chiếu đủ bốn tài khoản GitHub, không tạo commit giả. Repository public; nếu chuyển private phải cấp quyền giảng viên.
- Báo cáo có nguồn và footnote AI. Toàn văn AUR.99 chưa được cung cấp nên không tự chứng nhận đã tuân thủ mọi yêu cầu ngoài nội dung PDF.
- Web dependency audit trước đó không còn cảnh báo; mobile còn low/moderate ở cây Expo/Jest/tooling, không còn high/critical trong lần kiểm đã ghi. Không ép downgrade SDK bằng audit fix --force.

Lịch sử 12 nhánh đã được làm sạch giá trị Wi-Fi sau khi người phụ trách đồng ý, bảo toàn quá trình và tác giả. Mật khẩu từng lộ vẫn cần đổi tại nguồn; Git không thu hồi clone/fork/cache đã tải. Các thành viên nên clone mới, không đẩy lại lịch sử cũ. Bí mật/binary firmware chứa cấu hình riêng được giữ ngoài Git và gói source.
