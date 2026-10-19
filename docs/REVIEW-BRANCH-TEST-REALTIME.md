# Review branch test — frontend/backend/realtime

> Cập nhật18/10/2026: các finding simulator/snapshot/regrant đã sửa và có regression test trong bản tích hợp. Phần dưới là lịch sử reviewbf1d866; xem [trạng thái hiện tại](HOAN-THIEN-VA-NGHIEM-THU.md).

Ngày review: 16/10/2026. Commit test: bf1d866070184b5a39123281a3274bd082d9a45d. Mốc so sánh: origin/feature a068558; git diff origin/feature...HEAD trong bản review. Branch test có một commit mới, thay đổi 87 file. Đã fetch lại và xác nhận origin/test vẫn ở commit này.

Bản review được checkout bằng Git worktree tại D:/Firmware-IoT-review-test, tách khỏi workspace D:/Firmware-IoT đang ở feature. Không merge, push hay sửa code ứng dụng trong lần review. Có tạo probe tạm để tái hiện lỗi, sau đó đã xóa source probe. Không gửi lệnh tới board/broker công cộng.

## Đánh giá tổng thể

Bản cập nhật tiến bộ rõ so với feature và đáp ứng phần lớn tài liệu bàn giao: có realtime thực sự từ backend sau DB commit, bảo vệ WebSocket theo user, command lifecycle đầy đủ hơn, dữ liệu thiếu không tự biến thành số đo, migration và test có ý nghĩa. Phù hợp quy mô bài tập lớn; không cần làm lại kiến trúc.

Nên sửa lỗi nguồn simulator trước khi dùng làm bản tích hợp chính; hai lỗi đồng bộ danh sách/quyền cần sửa trước khi demo nhiều tài khoản/reconnect. Test hiện tại đều pass nhưng chưa bao phủ các ca này.

## Standards — 1 vấn đề đáng sửa

### P1: API simulator vẫn ghi được số đo giả lên thiết bị HARDWARE

- Vị trí: backend/src/main/java/com/guardian/service/VirtualDeviceSimulatorService.java:138 (simulateVehicleAction), :145 (SET_SPEED), :189 (SET_BATTERY); controller VirtualDeviceController.java:27 chỉ kiểm tra ownership.
- Method không kiểm tra dataSource=SIMULATED trước khi sửa và save Device. publishSnapshot về sau có bị TelemetryService loại vì sai source, nhưng các lần save trước đã commit.
- Một Owner của thiết bị HARDWARE gọi POST /api/simulator/action với deviceId của mình, action=SET_BATTERY và value=13.37 sẽ làm lastBatteryV thành 13.37, dataSource vẫn HARDWARE. SET_SPEED cũng có thể sửa số đo và securityState khi đang ARMED.
- UI ẩn simulator với HARDWARE không đủ: gọi REST trực tiếp vẫn được.
- Vi phạm quy ước phân biệt dữ liệu thật/mô phỏng trong docs/agents/domain.md, docs/GLOSSARY.md và cam kết simulator chỉ thao tác SIMULATED tại docs/REALTIME-BACKEND-FRONTEND.md.
- Chặn source ngay sau load device, trước mọi mutation; bảo vệ ở service để các caller khác không bỏ qua. Thêm test Owner của HARDWARE bị từ chối, Device và reading không đổi; SIMULATED vẫn dùng được.

Probe REST/H2 thực tế đã chạy: `REVIEW_PROBE status=200 OK source=HARDWARE battery=13.37`. Probe chỉ dùng dữ liệu test local. Method đã có từ trước nhưng phần cô lập source mới chưa bao phủ đường này; đây là lỗ hổng còn sót, không phải toàn bộ lỗi mới phát sinh.

Không đề xuất cải tổ kiến trúc chỉ vì các code smell nhỏ. Secret đã chuyển sang cấu hình môi trường; bằng chứng phần mềm được mô tả tách biệt với thử hardware là điểm tốt.

## Spec — 2 lỗi realtime xác nhận được

### P2: REST snapshot cũ làm mất thiết bị vừa được thêm qua WebSocket

- Vị trí: frontend/src/services/realtimeState.js:32-34.
- Reproduce: REST getDevices đang lấy danh sách rỗng → nhận DEVICE cho thiết bị mới → REST cũ trả []. Reducer thay danh sách bằng action.data nên thiết bị mới biến mất.
- Kiểm tra version chỉ bảo vệ ID đã nằm trong response, không bảo vệ ID mới ngoài response. Test hiện tại chỉ thử đổi state thiết bị có sẵn.
- Kết quả probe reducer: device count=0 sau chuỗi trên, trong khi phải giữ thiết bị mới.
- Cần merge các thiết bị có event mới hơn thời điểm request; vẫn xử lý xóa quyền bằng version/tombstone rõ ràng. Thêm regression test thiết bị mới trong lúc initial snapshot/reconnect.
- Trái mục tiêu phục hồi snapshot an toàn khi kết nối/reconnect ở docs/REALTIME-BACKEND-FRONTEND.md.

### P2: Cấp lại quyền không phục hồi thiết bị offline trong giao diện

- Vị trí: frontend/src/services/realtimeState.js:34, :45, :51; backend/src/main/java/com/guardian/service/DeviceService.java:152-178; DeviceContext.jsx:72-75.
- ACCESS_REMOVED đặt revoked[id]=true. DEVICES luôn lọc ID đó, kể cả REST mới trả quyền hợp lệ. Chỉ DEVICE event mới xóa cờ.
- inviteViewer lưu ownership nhưng không publish DEVICE sau commit. Nếu thiết bị offline thì không có telemetry tạo DEVICE; Viewer đã bị remove rồi invite lại vẫn không thấy thiết bị sau reconnect. Reload/logout reset cache mới hết.
- Probe: DEVICE d → ACCESS_REMOVED d → DEVICES mới có d vẫn cho device count=0.
- Cấp quyền lần đầu cho một Viewer đang mở web cũng thiếu thông báo khi thiết bị offline vì socket CONNECTED thì không polling. Các mutation onboard/config/revoke/decommission cũng không publish DEVICE; client khác có thể giữ trạng thái cũ, đặc biệt lifecycle FAULT/DECOMMISSIONED vì telemetry sau đó bị bỏ qua.
- Cần publish sau commit cho thay đổi membership/config/lifecycle; snapshot mới có thẩm quyền được phép phục hồi quyền, snapshot cũ vẫn bị chặn bằng version. Test hai tài khoản, remove/reinvite khi offline, revoke ở tab khác.

## Các phần đã làm tốt

- Command được commit PENDING rồi mới dispatch MQTT; chỉ dùng UUID topic, không tự fallback simulator khi publish lỗi.
- ACK đối chiếu device/ID, khóa hàng khi đổi trạng thái, không cho ACK lặp đảo kết quả, có timeout và late ACK lưu riêng.
- SecurityState lấy từ telemetry, không suy từ lệnh còi.
- Telemetry lưu validity/source/receivedAt/deviceUptimeS; số đo invalid là null; GPS giữ last-known, chấp nhận tọa độ 0 hợp lệ, tính thêm tuổi dữ liệu.
- WebSocket yêu cầu ACCESS, user ACTIVE khi CONNECT; chỉ subscribe user queue, chặn SEND trực tiếp; gửi tới membership hiện tại và ADMIN, ngừng outbound khi token hết hạn.
- Chặn đăng ký ADMIN; kiểm tra ownership ở command/simulator/telemetry; tách ACCESS/REFRESH.
- Frontend có reconnect, refresh token, REST fallback, buffer telemetry 300 mẫu và lịch sử lệnh 100; không cần thêm hệ thống phân tán cho đồ án.
- Flyway V1/V2, env mẫu và health endpoint giúp tái chạy; phần mềm không tự nhận test simulator là kết quả hardware.

## Kiểm tra đã thực hiện

| Kiểm tra | Kết quả |
|---|---|
| Backend Maven test, Java hiện có trên máy | PASS 14 test: 13 realtime integration + 1 migration |
| Frontend npm ci | PASS |
| Frontend npm test | PASS 12 test |
| Frontend npm run build | PASS; JS bundle khoảng 844 kB, cảnh báo chunk lớn, chưa phải lỗi chặn đồ án |
| Probe REST simulator/HARDWARE | Tái hiện được dữ liệu giả lưu trên HARDWARE |
| Probe reducer snapshot/regrant | Tái hiện được cả hai lỗi danh sách |
| Diff firmware/node_a/node_b/hardware | Không có thay đổi trong branch test so với feature |

Log backend ở D:/Firmware-IoT-review-test/backend-review-test.log; log probe ở review-probe.log; báo cáo test ở backend/target/surefire-reports/. Chưa chạy lại browser smoke, Docker/PostgreSQL thật, cloud hosting hoặc board end-to-end; H2/MQTT local trong test không thay các phép thử đó.

## Lưu ý tích hợp đã có từ trước

QuickControlPanel.jsx chỉ cho UNLOCK khi THEFT_LOCK, trong khi firmware boot PARKED với motor mặc định tắt. Muốn chủ động bật đầu ra sau boot từ web phải dùng ARM hoặc điều chỉnh cách hiển thị/điều kiện UNLOCK theo hợp đồng; không suy relay đang cấp tải chỉ từ PARKED. Đây là điểm tích hợp cũ, không tính là regression mới của commit test.

GPS fix ngoài trời và Hall hiệu chỉnh vẫn thuộc phần embedded còn mở. Realtime mới không thể làm GPS có fix hoặc chứng minh tốc độ chính xác.

## Thứ tự chốt bản tích hợp

1. Sửa guard SIMULATED và test REST không cho làm bẩn HARDWARE.
2. Sửa đồng bộ DEVICE/membership và reducer snapshot, bổ sung hai ca regression.
3. Chạy lại test/build; dựng PostgreSQL/Docker theo cấu hình của nhóm.
4. Dùng board thật kiểm tra Hall/MPU → MQTT → DB → WebSocket → UI, command → ACK, mất Wi-Fi/reconnect; đo khoảng 20 lượt latency với đồng hồ thống nhất/video.
5. Lưu kết quả, sau đó mới merge vào branch tích hợp theo quy trình nhóm. Không cần thêm chức năng hay đổi firmware để hoàn thành các sửa này.

Tổng: Standards 1 finding (P1 source contamination); Spec 2 findings (P2 snapshot và membership recovery). Baseline hiện phù hợp để sửa và thử tích hợp, chưa đủ bằng chứng để nghiệm thu toàn bộ end-to-end.
