# Bằng chứng review mobile — 25/10/2026

Code được pull: `ba4e81a`, so với local trước pull `e8b0afd`; có thêm các thay đổi Hall local đã khôi phục. Kiểm tra trên Windows, Node/npm/Java hiện có; không có thiết bị Android/ADB để nghiệm thu native.

- Backend: 23 tests PASS; migration V1–V3, push mock, REST/STOMP/Hall integration. Log tại `build/mobile-integrated-backend-20261025.log` và surefire reports, được ignore.
- Mobile: npm ci, typecheck, lint PASS; Jest 8 suites / 28 tests PASS; Expo web export PASS.
- Frontend React hiện tại: 17 tests PASS.
- Expo Doctor: 19/20, check SDK package patch FAIL (11 packages). Log `build/mobile-doctor-20261025.log`.
- [Runtime integration results](integration-results.json): 7 luồng cơ bản chạy được, 5 nhóm phát hiện được ghi riêng. Kết quả `COMPLETED_WITH_FINDINGS` không phải PASS toàn ứng dụng.
- [Realtime helper probe](realtime-probe.json): gọi source mergeDeviceSnapshot thực; hai invariant đều FAIL.
- [Ảnh app web với backend thật](mobile-web-emulator.png): có banner SOFTWARE TEST/MQTT-GPS EMULATOR; tọa độ/telemetry do bộ giả lập trên localhost phát.

Script tái hiện: `tests/integration/mobile-integration-smoke.cjs`. Cần backend JAR đã package và Expo web export ở `build/mobile-web-20261025` với API `http://127.0.0.1:18085`, WS `ws://127.0.0.1:18085/ws`. Script tự dùng các cổng loopback 18085/15175/18885/18886, DB H2 riêng, MQTT emulator và HTTP push mock; tự dừng tiến trình thử lúc kết thúc. Không chạy nếu các cổng này đang có dịch vụ khác.

Không lưu access/refresh token, mật khẩu, Expo token thật hoặc Wi-Fi. Mật khẩu/secret thử tạo ngẫu nhiên trong RAM. Không gọi public broker/Expo thật, không đổi DB nhóm, không điều khiển board. Hai lần chạy đầu phát hiện lỗi notification web và lỗi cleanup của Java launcher trong harness; harness đã sửa cleanup và ghi nhận lỗi app vào kết quả review, sau đó chạy lại bản đầy đủ. Không xem lỗi harness là lỗi ứng dụng.

[Báo cáo và bước sửa](../../../NGHIEM-THU-MOBILE-TRUC-TIEP.md).
