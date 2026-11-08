# Bằng chứng giao diện — 01/11/2026

Đây là kiểm thử phần mềm bằng trình duyệt. Ảnh được gắn nhãn dữ liệu giả lập; không phải ảnh nghiệm thu mạch hoặc điện thoại thật.

| Bằng chứng | Nội dung |
|---|---|
| [ui-acceptance.json](ui-acceptance.json) | 34 kiểm tra giao diện với REST/STOMP có kiểm soát; PASS, không lỗi JavaScript |
| [integration/integration-results.json](integration/integration-results.json) | 15 kiểm tra mobile web export với Spring Boot/H2 thật và MQTT/push emulator cục bộ; PASS |
| [web-dashboard.png](web-dashboard.png) | Tổng quan dành cho chủ xe trên web |
| [web-small-phone.png](web-small-phone.png) | Web ở kích thước màn hình nhỏ |
| [web-developer.png](web-developer.png) | Khu vực chẩn đoán web |
| [mobile-dashboard.png](mobile-dashboard.png) | Mobile web export, Tổng quan |
| [mobile-developer.png](mobile-developer.png) | Mobile web export, khu vực chẩn đoán |

Chạy lại từ thư mục gốc sau khi build/export vào đúng đường dẫn ghi trong script:

```powershell
node tests/integration/user-dev-ui-smoke.cjs
node tests/integration/mobile-integrated-acceptance.cjs
```

Script thứ hai dùng các cổng cục bộ và tự quản lý tiến trình thử; cần JAR backend/dependency trình duyệt theo script. Không dùng dữ liệu tài khoản thật. Các ảnh trong `integration/` thuộc cùng phiên thử, không thay bằng chứng cũ ngày 25/10.

Các trường `physicalBoard: false` và `nativePhone: false` trong kết quả là giới hạn chủ đích. Export Android/Hermes đã chạy thành công nhưng chưa cài/thao tác native trên điện thoại ở phiên này. Nghiệm thu phần cứng và remote push vẫn cần kết quả trực tiếp.
