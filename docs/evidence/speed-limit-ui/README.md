# Bằng chứng phần mềm: chỉnh ngưỡng tốc độ web/mobile

Các ảnh và `result.json` được tạo bằng fixture REST/STOMP, không gửi lệnh lên broker công cộng hoặc mạch thật. Mobile trong phép kiểm tra trình duyệt là bản Expo web export, không phải điện thoại native.

| Kiểm tra | Kết quả |
|---|---|
| Host test module firmware thực | PASS: ngưỡng runtime, validation, dwell/hysteresis, giữ thống kê và bảo vệ Hall |
| Biên dịch Node A ESP32 core 2.0.17 | PASS; chưa upload |
| Backend | 27 tests PASS: 22 realtime, 2 payload/dispatch ngưỡng, 2 push, 1 migration |
| Backend executable JAR | PASS ở thư mục build riêng; đã cập nhật bản JAR cho launcher, cần khởi động lại tiến trình đang chạy |
| Frontend | 23 tests PASS và production build PASS |
| Mobile | 45 tests PASS, TypeScript/lint PASS, Expo web export PASS |
| Browser web + mobile export | 14 checks PASS, không có page error; xem [result.json](result.json) |

Các ca giao diện kiểm tra đầu vào, payload số, trạng thái chờ, ngưỡng thực chỉ thay đổi theo bản tin thiết bị, lỗi lưu, firmware cũ, dữ liệu cũ và Viewer. [web.png](web.png) / [mobile.png](mobile.png) có nhãn dữ liệu kiểm thử.

Chưa xác minh NVS sau mất điện, phản hồi MQTT của Node A đã nạp bản mới, hoặc thao tác trên điện thoại thật. Thực hiện [hướng dẫn nghiệm thu](../../CAI-DAT-NGUONG-TOC-DO-WEB-MOBILE.md) sau cập nhật.

Lệnh kiểm tra giao diện:

```powershell
node tests/integration/speed-limit-ui.cjs
```

Yêu cầu đã build `frontend/dist`, export `mobile/dist`, có Playwright và Edge theo môi trường dự án. Script tự mở server fixture cục bộ rồi đóng khi hoàn tất.
