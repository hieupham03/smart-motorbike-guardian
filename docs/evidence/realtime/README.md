# Bằng chứng phần mềm realtime — 13/10/2026

Người chạy: Codex trên workspace local. Đây là **SOFTWARE ONLY**; không thay bằng chứng board, relay hay GPS ngoài trời.

| Kiểm tra | Actual | Kết quả |
|---|---|---|
| Backend `mvn test` | 13 ca tích hợp + 1 ca migration; 0 failure/error | PASS |
| MQTT TCP → Paho → H2 commit → STOMP WebSocket | Broker peer local, payload firmware-shaped; readingId nhận trên socket khớp DB; 19 ms trong lần chạy cuối | PASS phần mềm |
| Metadata/null/GPS/state/LWT | Uptime riêng, pin null, tọa độ 0 hợp lệ, stale giữ fix cuối, topic/device mismatch bị bỏ | PASS |
| Command | PENDING, broker lỗi không simulation; ACK sai device bị bỏ; duplicate không đảo status; TIMEOUT giữ ACK muộn | PASS |
| Quyền | Viewer bị REST chặn; stranger không đọc; REFRESH không dùng làm ACCESS; public SUBSCRIBE bị từ chối; membership bị gỡ không nhận tiếp | PASS |
| Migration DB cũ | Baseline V1 → V2; số đo cũ LEGACY, snapshot mặc định xóa; chạy lại không migrate lại | PASS trên H2 |
| Frontend `npm test` | 12 tests: ACK race, snapshot race, device isolation, revoked cache, GPS age, refresh/retry/network outage | PASS |
| Frontend `npm run build` | Vite build thành công; bundle chính khoảng 844 kB, gzip 241 kB | PASS; còn cảnh báo chunk >500 kB |
| Edge headless UI | 9 checks trong ui-smoke.json, 0 page errors; thao tác simulator → UI 142 ms trong lần chạy cuối | PASS phần mềm |
| Docker compose config | `docker compose -f deployment/docker-compose.yml config --quiet` exit 0 | PASS cấu hình; chưa chạy containers |
| `git diff --check` | Không lỗi whitespace | PASS |

19 ms và 142 ms là **mỗi loại một phép đo local**, gồm đường phần mềm được mô tả, không phải min/median/max hay cam kết độ trễ hardware/cloud. Payload MQTT của test được tạo trong phần mềm dù dùng contract HARDWARE; UI thử nguồn SIMULATED. Firmware thực vẫn có chu kỳ telemetry khoảng 1 giây.

Artifacts:

- [backend-tests.txt](backend-tests.txt): summary Surefire của lần chạy cuối.
- [ui-smoke.json](ui-smoke.json): danh sách kiểm tra giao diện và thời gian thực đo.
- [ws-telemetry-simulated.json](ws-telemetry-simulated.json), [api-latest-simulated.json](api-latest-simulated.json): payload thực thu từ môi trường H2/simulator thử, không phải số đo cảm biến.
- [dashboard-no-fix.png](dashboard-no-fix.png): HARDWARE chưa nhận telemetry, tốc độ/ADC trống, NO_FIX không marker.
- [command-executed-simulated.png](command-executed-simulated.png): command history sau ACK của simulator.
- [mqtt-unavailable.png](mqtt-unavailable.png): broker disabled, hardware command REJECTED/MQTT_UNAVAILABLE.
- [viewer-disabled.png](viewer-disabled.png): Viewer không có nút điều khiển khả dụng/simulator.

Tái chạy: [tests/integration/README.md](../../../tests/integration/README.md).

Chưa nghiệm thu trong phiên: PostgreSQL/Docker runtime, MQTT broker công cộng khi board gửi thật, Hall/MPU→UART→app vật lý, relay/interlock, GPS fix/stale thật, 20 lượt đo latency và chạy 30–60 phút. Dùng checklist ở [hướng dẫn realtime](../../REALTIME-BACKEND-FRONTEND.md) cùng [hướng dẫn hardware v2](../../HUONG-DAN-HARDWARE-FIRMWARE-V2-GPS.md).
