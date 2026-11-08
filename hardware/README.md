# Phần cứng

- [Bảng đấu nối và nguồn](SO-DO-DAU-NOI-PHAN-CUNG.md) là căn cứ khi lắp mạch.
- [Bảng linh kiện, GPIO và cách kiểm tra](../docs/HUONG-DAN-HARDWARE-FIRMWARE-V2-GPS.md).
- [Hình mạch có GPS](images/wiring-gps.png) và [cận cảnh Node B/GPS](images/gps-node-b.png) là **hình minh họa**, không phải ảnh chụp prototype.
- `diagram.json` là mô hình sơ đồ tham khảo; xác nhận chân theo firmware và board thật trước khi nối.

Node A: ESP32-WROOM-32, UART RX16/TX17, relay GPIO23, còi GPIO18. Node B: ESP32-S3 N16R8, UART RX18/TX17, Hall GPIO4, I2C SDA8/SCL9, GPS RX6/TX7. Hai node chung GND. Bánh đường kính 6,5 cm, giả định một xung Hall mỗi vòng.

Nhãn nguồn trên breakout quyết định điện áp VCC. Logic ESP32 là 3,3 V. Motor dùng nhánh nguồn riêng qua tiếp điểm relay; tắt nhánh đó khi nạp hoặc thay dây. Khi có ảnh breadboard thật đã kiểm quyền riêng tư, bổ sung vào `images/` và ghi rõ linh kiện/phiên bản tương ứng.
