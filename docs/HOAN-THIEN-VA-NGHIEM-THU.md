# Bản tích hợp và các việc nghiệm thu còn lại

Cập nhật 18/10/2026, dựa trên test bf1d866 + firmware v2. Mục tiêu bài tập lớn breadboard A/A+. PASS phần mềm không đồng nghĩa hoàn thành 100% toàn hệ thống.

## Đã sửa

- Service simulator từ chối HARDWARE trước khi ghi; Owner gọi REST trực tiếp cũng bị chặn.
- Reducer giữ thiết bị mới khi snapshot REST cũ trả về; removal có version, snapshot mới có quyền được phục hồi.
- Backend phát DEVICE sau commit khi onboard/invite/config/revoke/decommission; Viewer được cấp lại quyền thấy thiết bị offline.
- UNLOCK dùng được khi PARKED sau boot; quyền Owner/Admin và chờ PENDING vẫn áp dụng.
- Ngưỡng HARDWARE chỉnh trong firmware; web không gửi hoặc báo áp dụng ngưỡng xuống board. SIMULATED vẫn cấu hình riêng.
- H2 console tắt mặc định, không cho remote; nhãn điện áp chỉ nói cảnh báo.
- Hall không tính tốc độ từ một xung, re-prime sau dừng; speed_valid=false khi thiếu chu kỳ. IMU cũng hết hạn theo timestamp mẫu gốc.
- Node B và mirror đồng bộ; UART/MQTT không đổi. GPS bringup dễ đọc giữ riêng.

## Kiểm tra trong phiên

| Kiểm tra | Kết quả |
|---|---|
| Backend | 19 test PASS: 18 integration + 1 migration, gồm guardhardware và membershipoffline qua STOMP |
| Frontend | 14 test PASS, production build PASS; thêm2 regression snapshot/regrant |
| Host UART/Hall | PASS checksum/timeout/bounds, first pulse/stop/resume/freshness/wrap |
| Node B S3 N16R8 | Build PASS; xem log build cuối trong phiên |
| PostgreSQL 15 container riêng + backend host | DBUP, Flyway V1/V2; API ghi/đọc reading SIMULATED 12 km/h |
| Edge headless | UI_SMOKE_PASS, 0 page errors; một phép đo local 208 ms, không phải latency hardware |

Log local: build/ và backend/target/surefire-reports/. Không commit secret/cache. Evidence13/10 trong evidence/realtime/ giữ nguyên nhãn lịch sử. Không điều khiển board qua publicbroker trong phiên kiểm thử. PostgreSQL thử riêng, không thay DB của nhóm.

## Còn mở, cần bằng chứng thực tế

| Phụ trách | Việc | Điều kiện đóng |
|---|---|---|
| Embedded | Nạp Node B mới, thử Hall quay/dừng/resume | Đo chu vi/sốnamchâm, speed_valid và interlock đúng |
| Embedded | GPSfix/last-known toàn hệ thống | Người dùng báo fix ngoài trời; cần log tọa độ, mấtfix/phục hồi và DB/map thật |
| Embedded | Nguồn/relay/buzzer/reset | Đo/quan sát đầu ra và motor khởi động; MB10212V chưa chứng minh đủ tải |
| Cả nhóm | Board→MQTT→DB→WebSocket→web và commandACK thật | CùngUUID/reading/cmd_id có actual/log/video |
| Cả nhóm | Chạy30–60phút, mấtmạng, latency20lượt | Thời gian, reset/lỗi và min/median/max có phương pháp |
| Nhóm/giảng viên | ADC và cloudhosting | Nếu rubric bắt buộc thì bổ sung; giảmscope phải ghi rõ |
| Mobile | App dùng chung API/auth/realtime | Chưa có source trong repo; cần app thật và test |
| Báo cáo/slide | Ảnhmạch, kếtquả thực, phâncông, bài nói10phút | Không lấy archive/mockup làm kết quả |

## Dọn repo và gộp nhánh

firmware/ là nguồn chuẩn, node_a/node_b giữ mirror tương thích. Báo cáo/đặc tả/mô phỏng cũ đưa docs/archive/. Xóa testdiff và diagramroot trùng. Một compose deployment/, schemaFlyway, seedenv; scriptstart không xóa container/in mật khẩu. WorkspaceIDE giữlocal.

Chỉ gộp code đã kiểm tra vào main, giữ lịch sử, không forcepush. Nhánh test chỉ xóa sau khi tip nằm trong main và pushmain thành công. Các mục vật lý/mobile chưa hoàn tất vẫn mở sau merge.
