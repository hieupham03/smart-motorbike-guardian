# Log GPS NEO-6M (trạng thái NO_FIX)

Các bản ghi Serial thu từ Node B và sketch kiểm tra GPS NEO-6M trong nhà (không chứa tọa độ riêng tư).

| File | Nội dung | Chứng minh được |
|---|---|---|
| [2026-10-12-node-b-no-fix.txt](2026-10-12-node-b-no-fix.txt) | Trích các dòng GPS của Node B, 23:03:23–23:03:43 | Byte tiếp tục tăng, checksum_errors=0, chưa có FIX |
| [2026-10-17-bringup-no-fix.txt](2026-10-17-bringup-no-fix.txt) | Hai đoạn Serial: uptime 62 s và 662–664 s | UART RX6/9600 nhận NMEA; có lúc GSV có C/N0, GGA vẫn dùng 0 vệ tinh; sau đó không có C/N0 dương |
| [2026-10-17-nmea-no-fix.txt](2026-10-17-nmea-no-fix.txt) | Các câu GGA/GSA/GSV/RMC đã thu | GGA quality=0, GSA fix type=1, RMC status=V, không có tọa độ hợp lệ |

## Kết luận và giới hạn

- Các đoạn log là bằng chứng nhận dữ liệu NMEA hợp lệ và trạng thái `NO_FIX` trong nhà, không dùng làm bằng chứng định vị đã có tọa độ. `reported=12` trong GSV không phải số vệ tinh dùng định vị; `0,0` trong log Node B không phải vị trí thật.
- Kiểm tra checksum XOR của cả 9 câu NMEA trong file raw đều hợp lệ.
- Để kiểm chứng `FIX`/`STALE` có tọa độ thật qua toàn hệ thống cần đặt module GPS ở khu vực ngoài trời thoáng.
