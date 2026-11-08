# Log GPS cũ — lưu ngày 20/10/2026

Nguồn: các đoạn người dùng đã gửi trong hội thoại, sao chép nguyên văn; không phải phép đo mới ngày lưu file. Ngày trong tên file là ngày gửi đoạn log theo lịch sử hội thoại, không khẳng định thời điểm đo độc lập. Không có tọa độ GPS riêng tư trong các đoạn này.

| File | Nội dung | Chứng minh được |
|---|---|---|
| [2026-10-12-node-b-no-fix.txt](2026-10-12-node-b-no-fix.txt) | Trích các dòng GPS của Node B, 23:03:23–23:03:43 | Byte tiếp tục tăng, checksum_errors=0, chưa có FIX |
| [2026-10-17-bringup-no-fix.txt](2026-10-17-bringup-no-fix.txt) | Hai đoạn Serial: uptime 62 s và 662–664 s | UART RX6/9600 nhận NMEA; có lúc GSV có C/N0, GGA vẫn dùng 0 vệ tinh; sau đó không có C/N0 dương |
| [2026-10-17-nmea-no-fix.txt](2026-10-17-nmea-no-fix.txt) | Các câu GGA/GSA/GSV/RMC đã gửi | GGA quality=0, GSA fix type=1, RMC status=V, không có tọa độ hợp lệ |

## Kết luận và giới hạn

- Người dùng đã xác nhận mang GPS ra ngoài trời thì FIX, vào nhà lại NO_FIX. Ghi nhận đây là xác nhận vận hành; không có đoạn Serial chứa tọa độ FIX trong các log cũ tìm lại được.
- Các đoạn được lưu là bằng chứng nhận dữ liệu GPS và trạng thái NO_FIX, không dùng làm bằng chứng định vị đã có tọa độ. `reported=12` trong GSV không phải số vệ tinh dùng định vị; `0,0` trong log Node B không phải vị trí thật.
- Hai đoạn uptime 62 s và 662–664 s được gửi riêng, không phải bản ghi liên tục và không chứng minh chính xác thời gian mất/khôi phục FIX.
- Không dựng thêm `$GPGGA` quality=1, RMC status=A, lat/lon, HDOP hay ảnh bản đồ. Nghiệm thu FIX/STALE qua UART/MQTT/DB/map thuộc bước tích hợp hệ thống còn lại.
- Kiểm tra lại trên máy ngày 20/10: checksum XOR của cả 9 câu NMEA trong file raw khớp với checksum đã gửi. Đây là kiểm tra bản ghi cũ, không phải lần thu vệ tinh mới.
