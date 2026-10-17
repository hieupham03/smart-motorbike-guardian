# Kiểm tra bản tích hợp — 18/10/2026

SOFTWARE ONLY. Không thay bằng chứng GPS/relay/Hall trên breadboard.

| Kiểm tra đã chạy | Kết quả |
|---|---|
| Maven test | 19 test PASS, 0 failure/error (18 integration, 1 migration) |
| npm test | 14 test PASS, gồm race snapshot/regrant |
| npm ci + npm run build | PASS |
| UART host test | PASS checksum, timeout, length, null/empty |
| Wheel/freshness host test | PASS first pulse, stop/resume, decay, stale sample, long idle across micros wrap |
| Node A core2.0.17 esp32 | Build PASS, flash749497B/staticRAM56608B |
| Node B S3 N16R8/OPI/CDC | Build PASS, flash301609B/staticRAM20448B |
| GPS bringup S3 | Build PASS, flash282089B/staticRAM19924B |
| PostgreSQL15 riêng + backend host | FlywayV1/V2 PASS; healthDBUP; API ghi/đọc SIMULATED |
| Docker Compose build/up | Backend maven/Java17, frontend node20/nginx, postgres15: PASS |
| Browser qua Docker/Nginx | UI_SMOKE_PASS; WebSocket, simulator, command/history, MQTT_UNAVAILABLE, Viewer, reload;0pageerrors |

Docker dùng project thử guardian-completion, các cổng localhost13000/18082/15435 để không chạm container/DB nhóm đang dùng. CORS cấu hình rõ cho origin thử; MQTT_ENABLED=false, không điều khiển board. API/WebSocket dùng nguồn SIMULATED, không phải dữ liệu vật lý. Các filecredential tạm nằm build/ bị ignore.

Phép đo browser local: một lượt125ms qua Docker, một lượt208ms qua Vite/H2. Không phải min/median/max, không chứng minh độ trễ hardware hoặc cloud. JSON smoke được lưu cùng thư mục; không chứa token/mật khẩu.

Các regression sửa lỗi thực: không ghi simulator vào HARDWARE/FAULT/DECOMMISSIONED; không mất thiết bị mới vì snapshot cũ; phục hồi quyền sau remove/reinvite; DEVICE tới Viewer khi thiết bị offline; ngưỡng hardware không giả áp dụng. Hai lượt code review không phát hiện lỗi chặn tích hợp sau sửa.

Còn bắt buộc thử thật: nạp firmware mới, hiệu chỉnh Hall, motor/nguồn/relay/reset, GPS fix→stale→phục hồi xuyên suốt DB/map, board→web và remoteACK, latency nhiều lượt, chạy30–60phút. Mobile/ADC/hosting theo phạm vi nhóm và rubric; chưa coi hoàn tất.
