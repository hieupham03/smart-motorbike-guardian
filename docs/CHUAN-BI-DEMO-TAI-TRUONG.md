# Chuẩn bị và chạy demo tại trường

Bám [đề bài](assignment/DE-BAI-IOT.pdf), đặc biệt mục 4, 6, 7 và 8.3–8.4: khoảng 10 phút trình bày, 5–7 phút demo và 5 phút vấn đáp. Dùng [bộ slide](slides/README.md) và [lời thoại/10 bước demo](KICH-BAN-DEMO-VA-VAN-DAP.md). Cả bốn người phải có mặt và giải thích được phần việc thực tế.

## 1. Bộ mang theo

- Laptop đã cài dependencies và build sẵn; sạc laptop, hai cáp USB dữ liệu, mạch hai node, cảm biến và nguồn motor đã dùng. Cố định dây/nam châm, đánh dấu Node A/B và chân nguồn. Không cần mua thêm linh kiện để đáp ứng luồng demo này.
- PDF và PowerPoint lưu trên laptop; Word/PDF báo cáo, ảnh prototype thật và video dự phòng nếu có. Video không thay thế demo trực tiếp.
- Dùng Wi-Fi/hotspot riêng có băng tần 2,4 GHz cho ESP32; laptop và điện thoại cùng mạng, không có client isolation. Dữ liệu Hall/MPU và điều khiển LAN không cần Internet; tải bản đồ, dịch vụ cloud và một số thao tác Expo có thể cần Internet.
- Bí mật ở `.local/` và `network_config.h` local. Không đưa chúng vào USB/source nộp, hình chụp hoặc video công khai. Bản sao GitHub chỉ chứa cấu hình mẫu.

## 2. Chuẩn bị trên đúng laptop

Thực hiện một lần trước buổi demo, không chờ đến lớp mới tải dependencies:

```powershell
cd D:\Firmware-IoT
cd backend
mvn verify
cd ../frontend
npm ci
npm run build
cd mobile
npm ci
npm run typecheck
cd ../..
```

Điền Wi-Fi riêng vào `firmware/node_a_gateway/network_config.h` từ file mẫu nếu chưa có. Đóng Serial Monitor trước khi nạp. Tắt riêng nguồn motor, giữ USB hai node.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File deployment/scripts/start-mobile-demo.ps1 -Classroom -Prepare
```

Lệnh tạo khóa riêng trong cấu hình local, không in khóa. Nó giữ Wi-Fi đã điền và đặt broker là IP LAN laptop. Nạp lại **Node A** bằng Arduino IDE hoặc Arduino CLI sau khi chuẩn bị. Node B dùng sketch đầy đủ `firmware/node_b_sensor/`, không dùng sketch GPS bring-up để demo toàn hệ thống. Nếu đổi mạng/IP tại lớp, chạy lại bước Prepare và nạp Node A; không cần sửa thuật toán cảm biến.

## 3. Mở hệ thống

Để demo chính bằng web:

```powershell
.\deployment\start-classroom-demo.bat -WebOnly
```

Giữ terminal mở. Web classroom tại `https://localhost:5173` hoặc `https://<IP-laptop>:5173`; backend nội bộ tại `http://<IP-laptop>:8082`, broker MQTT riêng tại `<IP-laptop>:1883`. Health `/api/health` phải có `status=UP`, `database=UP`, `mqtt=CONNECTED`. Nếu nhận IP sai, thêm `-LanIp <IPv4-Wi-Fi>` vào lệnh.

HTTPS được chuẩn bị bằng OpenSSL sẵn trên máy, với chứng chỉ local có SAN cho localhost/IP LAN. So fingerprint launcher in ra với chứng chỉ trước khi chấp nhận ngoại lệ trên đúng laptop; script không tự cài CA vào trust store. Chứng chỉ tự ký không được cơ quan công khai xác nhận. HTTPS/WSS bảo vệ đường trình duyệt → proxy web; proxy → backend đi qua loopback trên laptop. MQTT TCP và chế độ Expo Go HTTP vẫn là giới hạn riêng của LAN thử nghiệm, không được gọi là đã mã hóa toàn hệ thống.

Nếu backend đã chạy và muốn mở thêm một cổng HTTPS riêng:

```powershell
.\deployment\start-classroom-https.bat -LanIp <IP-laptop>
```

Cổng riêng là 5443. Backend phải khởi động bằng launcher classroom hiện hành để CORS cho phép origin HTTPS; không tắt xác thực để tránh lỗi CORS.

Để chạy cả mobile ngay từ đầu, bỏ `-WebOnly`. Nếu web/backend đang chạy và muốn mở mobile sau:

```powershell
.\deployment\start-mobile-client.bat
```

Mở Expo Go bằng QR hoặc URL `exp://<IP-laptop>:8081`. Không khởi động thêm backend thứ hai. Nếu điện thoại không truy cập được health qua IP laptop, kiểm cùng mạng và quyền firewall cho Java/Node trong mạng riêng trước khi thử app.

Tài khoản mẫu là `admin@guardian.iot`, `owner@guardian.iot`, `viewer@guardian.iot`; dùng mật khẩu demo đã đặt tại laptop. Launcher classroom có database riêng ở `.local/classroom-demo/`, giữ database cũ của mobile và PostgreSQL.

## 4. Kích hoạt đúng mạch thật

Với DB classroom mới, UUID `550e8400-e29b-41d4-a716-446655440001` chưa có chủ. Node A không được nhận vào broker cho đến khi kích hoạt.

1. Admin mở **Quản trị → Thiết bị → Xem mã kích hoạt** của UUID trên. Không nhầm mã kích hoạt một lần với mật khẩu MQTT.
2. Owner mở **Xe của tôi → Thêm xe**, nhập mã và tên mô hình. Chờ kích hoạt thành công.
3. Chọn đúng xe nguồn **HARDWARE**, chờ dữ liệu cảm biến mới. Kiểm tra Node A báo MQTT kết nối, UART `fresh=1`; Node B báo MPU thật và Node A kết nối.
4. Owner chia sẻ quyền theo dõi cho `viewer@guardian.iot`. Viewer chỉ xem; lệnh điều khiển phải bị backend từ chối.

Nếu xe đã được kích hoạt từ lần tập, không thể dùng lại mã đã tiêu thụ. Để tập lại toàn bộ quy trình với cùng board, dùng baseline riêng ở mục 7; không xóa dữ liệu thật hoặc sửa DB để giả kết quả.

## 5. Thứ tự demo 10 bước

| Bước đề bài 8.4 | Thao tác ngắn | Kết quả cần thấy |
|---|---|---|
| 1. Vai trò | Owner xem/điều khiển, Viewer xem | Hai phạm vi quyền khác nhau |
| 2. Kích hoạt | Thêm xe bằng mã một lần trên DB chưa claim | Thiết bị có chủ và nhận kết nối |
| 3–4. Telemetry/realtime | Quay bánh thật, giữ MPU chắc | Tốc độ/phiên đổi, backend lưu dữ liệu, web cập nhật |
| 5. Lệnh/ACK | Dừng bánh hơn 4 giây, bật bảo vệ | Lịch sử EXECUTED và trạng thái ARMED; quan sát đầu ra riêng |
| 6. Cấu hình | Đổi ngưỡng tại Thống kê phiên | ACK thực thi và ngưỡng board báo về trùng giá trị mới |
| 7. Offline | Ngắt USB Node A, giữ nguồn motor tắt; đợi timeout | Thiết bị OFFLINE; cắm lại thì phục hồi. Nếu muốn giữ Node B chạy, chỉ ngắt A |
| 8. Cảnh báo | ARMED, quay bánh tay đủ xung | Cảnh báo bánh quay và còi thật; tắt bảo vệ để ngừng còi |
| 9. Sai quyền | Viewer gửi lệnh trực tiếp qua API hoặc kiểm thử bảo mật đã chuẩn bị | 403 ở backend; không chỉ nút bị ẩn |
| 10. Thu hồi | Owner thu hồi ở cuối demo | Phiên MQTT bị ngắt, Node A không đăng nhập lại bằng khóa cũ, backend không nhận thêm telemetry |

OFFLINE do presence mặc định cần khoảng 45 giây; MQTT Last Will có thể phát hiện sớm hơn, không cam kết tức thì. Không gọi trạng thái khóa motor `THEFT_LOCK` là thu hồi kết nối MQTT. Đừng decommission vĩnh viễn board duy nhất giữa buổi; chọn thao tác thu hồi có quy trình kích hoạt lại.

GPS cần thử FIX ngoài trời riêng. Nếu trong phòng `NO_FIX`, trình bày đúng và vẫn demo được Hall/MPU. Native push, OTA và AI không phải phần đã nghiệm thu; không dùng chúng làm điểm chính trong bài nói.

## 6. Khi đổi hoặc cấp lại khóa thiết bị

Trong **Chẩn đoán & thử nghiệm**, Owner/Admin có thể cấp lại khóa, hoặc kích hoạt lại sau thu hồi. Khóa mới chỉ trả một lần và bị ẩn mặc định; khóa cũ không được phục hồi. Lưu khóa mới trong cấu hình riêng:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File deployment/scripts/start-mobile-demo.ps1 -Classroom -Prepare -UpdateDeviceSecret
```

Lệnh hỏi khóa qua nhập ẩn, cập nhật DPAPI và `network_config.h`; sau đó nạp Node A. Dừng bộ chạy trước khi dùng Prepare. Launcher khởi động bình thường không ghi đè khóa trong file. Decommission là trạng thái cuối, không thể kích hoạt lại.

## 7. Baseline để tập lại, không xóa lịch sử thử

Baseline được chụp khi DB classroom đã seed nhưng mạch chưa claim. Chỉ sao lưu DB khi backend đã dừng, cùng `settings.json` và `network_config.h` vào `.local/classroom-demo/baseline-unclaimed/`. Không tạo baseline bằng dữ liệu tự nhận là đã đo.

Khi cần quay lại để diễn tập bước kích hoạt, Ctrl+C bộ chạy, giữ nguồn motor tắt rồi chạy:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File deployment/scripts/restore-classroom-baseline.ps1 -Restore
```

Script từ chối DB đang mở, sao lưu DB/cấu hình hiện tại vào snapshots trước khi khôi phục riêng classroom. Nó không chạm `.local/mobile-demo/` hoặc PostgreSQL. Sau đổi LAN/khóa, Prepare và nạp lại Node A để khớp baseline. Các raw logs, ảnh và số liệu ở `.local/evidence/` vẫn được giữ nguyên.

## 8. Chốt bằng chứng và vấn đáp

Dùng [công cụ đo](DO-LUONG-VA-LUU-MINH-CHUNG.md) để ghi số liệu; không gán độ trễ REST thành độ trễ từ cảm biến tới màn hình. Lưu ảnh toàn mạch thật và video ngắn có thao tác vật lý, ứng dụng và kết quả. Báo cáo có chú thích AI và nguồn tài nguyên; đối chiếu thêm quy định AUR.99 của giảng viên nếu được cung cấp.

Nhóm tự điền danh tính ở bìa/bảng nhóm/slide. Mỗi người trả lời được luồng dữ liệu chung, rồi giải thích sâu phần mình theo [kịch bản vấn đáp](KICH-BAN-DEMO-VA-VAN-DAP.md). Đọc [đối chiếu điều kiện đồ án](DOI-CHIEU-DIEU-KIEN-DO-AN.md) và kết quả trong hồ sơ phát hành, không nói mọi chức năng đã được thử trên thiết bị nếu chưa có evidence.
