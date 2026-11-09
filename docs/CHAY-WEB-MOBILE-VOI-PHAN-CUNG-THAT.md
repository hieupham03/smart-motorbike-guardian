# Chạy web và mobile cùng hai node thật

Sử dụng **một backend duy nhất** để web và mobile nhìn cùng xe, cùng dữ liệu và kết quả lệnh. Chế độ chuẩn cho buổi demo là [classroom có broker xác thực riêng](CHUAN-BI-DEMO-TAI-TRUONG.md), không yêu cầu Docker hoặc MQTT Explorer. Cần chuẩn bị khóa và nạp Node A theo hướng dẫn đó trước khi chạy.

```text
Hall / MPU / GPS → Node B → UART → Node A → MQTT broker → Backend 8082
                                                          ├→ Web 5173
                                                          └→ Mobile qua Expo 8081
```

## 1. Chuẩn bị trước khi chạy

- Laptop và điện thoại cùng mạng LAN/Wi-Fi có Internet, không dùng mạng guest chặn các thiết bị truy cập nhau. Node A vào Wi-Fi 2,4 GHz đã cấu hình và có đường tới broker. Node B không cần Wi-Fi.
- Cắm hai node theo mạch đã hoạt động; dùng nguồn motor/MB102 đã kiểm, chung GND theo sơ đồ. Tắt nguồn trước khi thay dây. Không đưa 12 V vào chân 5V/3V3 của ESP hoặc motor TT 3–6 V.
- Node A chạy `firmware/node_a_gateway/node_a_gateway.ino`; Node B chạy `firmware/node_b_sensor/node_b_sensor.ino`. Nếu đang chạy đủ hai firmware chính thì không cần nạp lại chỉ vì đổi giao diện bản đồ. Nếu Node B vẫn chạy `gps_bringup.ino`, nạp lại firmware Node B đầy đủ.
- Khi đổi Wi-Fi, chỉnh `firmware/node_a_gateway/network_config.h` cục bộ rồi nạp lại Node A. Không chia sẻ mật khẩu hoặc đưa file này lên Git.
- Dừng backend/Expo cũ bằng Ctrl+C tại cửa sổ đã mở chúng. Không chạy đồng thời một backend Docker khác cho cùng buổi thử.

Classroom dùng broker riêng trên IP LAN laptop, port 1883; UUID xe thật là `550e8400-e29b-41d4-a716-446655440001`. Node A có username/khóa riêng. Broker công cộng là cấu hình cũ để thử giao tiếp, không đáp ứng ca thu hồi quyền kết nối tại broker.

Backend JAR đã được đóng gói lại từ source hiện tại trong lần chuẩn bị hướng dẫn. Sau các lần sửa backend tiếp theo, cần `mvn package` trong `backend/`; sửa frontend/mobile không yêu cầu đóng gói backend lại.

## 2. Mở cửa sổ A: backend và mobile

Trong VS Code mở Terminal → New Terminal, chạy:

```powershell
cd D:\Firmware-IoT
.\deployment\start-classroom-demo.bat -ClearCache
```

Giữ cửa sổ này mở. Launcher thực hiện:

1. Mở backend cổng 8082, bật MQTT thật.
2. Dùng DB H2 file riêng `.local/classroom-demo/guardian.mv.db`, broker xác thực và tài khoản demo. DB mới cần kích hoạt đúng mạch qua mã một lần.
3. Đặt URL API/WebSocket theo IP LAN và mở Metro cổng 8081.

Chờ dòng `Backend OK` và QR của Expo. Lần đầu mới yêu cầu tạo mật khẩu; những lần sau dùng mật khẩu cũ. Không cần dán JWT secret hoặc đặt mật khẩu lại mỗi buổi.

Trên trình duyệt điện thoại, mở địa chỉ health mà launcher in ra:

```text
http://<IP-laptop>:8082/api/health
```

Ví dụ, nếu launcher in IP `192.168.1.20`, mở `http://192.168.1.20:8082/api/health`. IP này chỉ là ví dụ. Không nhập `localhost` trên điện thoại để trỏ về laptop.

Khi sẵn sàng cho thiết bị thật, kết quả cần có:

```json
{"status":"UP","database":"UP","mqtt":"CONNECTED"}
```

Thứ tự trường có thể khác. `UP` chưa đủ nếu `mqtt` đang `DISCONNECTED`; đợi nối lại hoặc kiểm tra mạng/broker trước khi thử phần cứng. Health này kiểm backend, không tự xác nhận Node A đã online.

**Mở mobile trên điện thoại:** quét QR bằng Expo Go tương thích SDK 58, đăng nhập `owner@guardian.iot` với mật khẩu đã đặt. iPhone có thể yêu cầu Expo CLI và Expo Go đăng nhập cùng tài khoản Expo; làm theo thông báo của ứng dụng. [Cách mở app chính thức](https://docs.expo.dev/get-started/start-developing/).

**Mở mobile web vừa sửa:** nhấn `w` trong cửa sổ A. Bản Expo web mở trên cổng 8081 và cũng dùng backend 8082. Có thể dùng cách này trước khi chuyển sang điện thoại; nó là giao diện mobile web, khác bản native chạy trong Expo Go.

Không chạy thêm `npm start` hoặc `npm run web` ở một cửa sổ mobile khác khi launcher đang quản lý Metro.

## 3. Mở cửa sổ B: web React

Mở một terminal mới, giữ nguyên cửa sổ A:

```powershell
cd D:\Firmware-IoT\frontend
$env:BACKEND_URL = 'http://127.0.0.1:8082'
$env:VITE_WS_URL = '/ws'
npm run dev -- --host 0.0.0.0 --port 5173 --strictPort
```

Các dependency đã có trên máy; nếu một bản clone mới báo thiếu Vite, chạy `npm ci` trong `frontend/` rồi chạy lại. Mở `http://localhost:5173` trên laptop. Đăng nhập cùng `owner@guardian.iot` và mật khẩu ở mobile.

Hai biến ở trên quan trọng: web mặc định dùng backend 8080, còn launcher dùng 8082. Cả REST `/api` và realtime `/ws` phải đi qua proxy tới 8082. Launcher đã bổ sung origin web 5173 vào danh sách CORS. Nếu đang chạy launcher phiên cũ, dừng và mở lại sau sửa này.

## 4. Cấp nguồn và xác nhận hai node

1. Để công tắc nhánh motor OFF ban đầu; vẫn cấp USB cho hai node. Không đổi chân hoặc nguồn khi đang thử.
2. Mở Serial Monitor đúng COM của từng node ở 115200 baud. Dùng hai cửa sổ IDE/monitor nếu cần xem cùng lúc. Không mở hai chương trình đọc cùng một COM.
3. Quan sát các dấu hiệu mong đợi sau; dấu `...` là các giá trị thực tế thay đổi, không phải log đo sẵn:

```text
Node A:
[MQTT] Kết nối thành công tới Broker!
[Node A UART v2] ... fresh=1 ...

Node B:
[Node B Live] ... MPU: REAL (I2C) | Node A: CONNECTED ...
[GPS FIX] ...        hoặc [GPS NO_FIX] ... trong nhà
```

Node A cần cả MQTT kết nối và UART còn mới. Node B cần thấy Node A CONNECTED. Chưa có GPS FIX không chặn Hall, MPU hoặc lệnh bảo vệ.

Trên cả web và mobile, chọn xe thật có UUID trên, nhãn nguồn thiết bị thật/HARDWARE. DB mới thường đặt tên xe **Honda SH 150i ABS**; nếu đã đổi tên thì dùng UUID để đối chiếu. Không chọn **Yamaha Exciter** nguồn mô phỏng để kết luận mạch đã chạy.

Chờ thông tin xe mới và kết nối cảm biến. Giữ cả hai màn hình mở khi thử; không dùng công cụ mô phỏng để phát dữ liệu vào xe thật.

## 5. Thử lần lượt và quan sát cả ba phía

### A. Hall và thống kê phiên

- Giữ nhánh motor OFF, quay bánh bằng tay; có thể bật nguồn motor để thử sau khi đã để mô hình vững.
- Serial Node B phải đổi tốc độ. Web và mobile phải cùng tăng tốc độ/thống kê phiên khi nhận dữ liệu mới.
- Quay chậm đủ 10 vòng sau khi phiên đã bắt đầu. Với bánh 6,5 cm, một xung/vòng, quãng đường tăng khoảng **2,042 m**. Kiểm tra nam châm qua Hall đủ một lần mỗi vòng.
- Dừng bánh và đợi ít nhất 4 giây: tốc độ hợp lệ về 0.
- Bấm **Bắt đầu phiên mới** ở một giao diện: đợi kết quả lệnh được thực hiện; cả hai phải về thống kê phiên mới. Màn hình bên kia không cần tải lại trang.

### B. Điều khiển còi từ web và mobile

- Bấm **Bật còi** trên web: còi thật kêu, lệnh có kết quả thực hiện, mobile cập nhật kết quả.
- Bấm **Tắt còi** trên mobile: còi thật ngừng, web cập nhật.
- Có bản ghi yêu cầu/PENDING chưa đủ để gọi là đã thực hiện. Đối chiếu kết quả cuối trong lịch sử và quan sát còi.

### C. Bảo vệ và cảnh báo bánh quay

1. Tắt riêng nhánh motor, giữ hai USB. Đợi bánh dừng ít nhất 4 giây.
2. Bấm **Bật bảo vệ** ở web. Đợi kết quả thực hiện; web/mobile chuyển sang đang bảo vệ/ARMED. Node A ngắt relay motor theo logic bảo vệ.
3. Khi đang ARMED, có thể cấp lại nguồn nhánh motor: motor phải tiếp tục dừng do relay đang ngắt.
4. Giữ MPU yên, quay bánh tay ít nhất 3 vòng trong khoảng 3 giây. Cả hai ứng dụng phải nhận cảnh báo bánh quay khi canh giữ; Node A chuyển ALARM và còi báo theo nhịp.
5. Bấm **Tắt bảo vệ** ở mobile. Hệ thống về PARKED, còi báo tự động ngừng và relay cấp motor trở lại. Nếu nhánh motor vẫn ON thì bánh có thể quay ngay; để tay khỏi bánh trước khi bấm.

### D. MPU và dấu hiệu ngã

- Thử rung khi đã bật bảo vệ và bánh đứng yên: tác động đủ ngưỡng/thời gian tạo cảnh báo rung. Thử riêng với ca quay bánh để biết sự kiện đến từ cảm biến nào.
- Thử nghiêng MPU hơn khoảng 50° và giữ trên 2 giây; đặt nhẹ, không va đập breadboard hoặc làm chạm dây nguồn. Web/mobile cần nhận cảnh báo dấu hiệu nghiêng/ngã.
- Đây là cảnh báo theo ngưỡng trên mô hình; không thử bằng cách làm ngã xe thật.

### E. Khóa/mở khóa và điều kiện bánh dừng

- Khi bánh đang quay, yêu cầu khóa phải bị chặn ở giao diện hoặc bị firmware từ chối; không được báo đã khóa và ngắt motor theo lệnh này.
- Tắt nhánh motor, đợi bánh dừng trên 4 giây, bấm khóa và nhập mật khẩu xác nhận khi được yêu cầu: kết quả thực hiện, state THEFT_LOCK, relay ngắt.
- Cấp lại nhánh motor trong THEFT_LOCK: motor vẫn dừng. Bấm mở khóa ở giao diện còn lại: state PARKED, relay cấp lại và motor có thể quay.
- Lịch sử lệnh ở hai giao diện phải thống nhất; phản hồi ACK xác nhận xử lý firmware, còn motor/còi là quan sát đầu ra thực tế.

### F. Cảnh báo tốc độ

- Thử trong PARKED với dữ liệu Hall hợp lệ. Giữ tốc độ trên ngưỡng board đang báo về ít nhất 2 giây nếu motor/bánh đạt được. Có thể đổi ngưỡng 1–120 km/h trên ứng dụng và đợi ACK; không giả định lúc nào cũng là 2 km/h.
- Cả web và mobile nhận cảnh báo vượt ngưỡng. Chức năng chỉ cảnh báo, không giảm tốc hoặc cắt motor.
- Hạ xuống dưới ngưỡng ít nhất 0,5 km/h trong 2 giây để phục hồi trạng thái trước khi thử đợt mới. Không tăng nguồn quá định mức motor để ép đạt ngưỡng.

### G. GPS và bản đồ

- Để kiểm vị trí thật trên hệ thống, GPS phải lấy được fix trong lúc **Node B đầy đủ → UART → Node A → MQTT → backend** đang hoạt động. Chỉ dùng sketch bringup lấy fix riêng không chứng minh luồng đến ứng dụng.
- Đặt antenna chỗ thoáng, mặt gốm hướng trời, giữ nguồn ổn định. Có thể bắt đầu bằng các ca trong phòng rồi thử GPS sau khi có điều kiện.
- Serial B cần có FIX và tọa độ; Serial A có `gps_valid=1`. Cả web và mobile cùng hiện vị trí tương ứng.
- Đưa vào trong nhà và chờ mẫu mất hiệu lực: vẫn hiện điểm hợp lệ gần nhất cùng nhãn vị trí cũ. Nền bản đồ cần Internet, độc lập với việc module GPS có fix.
- Không có tọa độ từng nhận trong phiên/backend thì màn hình chờ vị trí là đúng. Không dùng 0,0 hoặc tọa độ mô phỏng để thay kết quả GPS thật.

Giữ app mở để thử cảnh báo realtime. Launcher đang tắt remote push; cảnh báo trong tab Cảnh báo không chứng minh thông báo nền khi khóa màn hình. Map trong Expo Go dùng thư viện native; mobile web dùng iframe OpenStreetMap. [Phạm vi Expo Go của react-native-maps](https://docs.expo.dev/versions/v58.0.0/sdk/map-view/).

## 6. Nếu không thấy dữ liệu thật

| Hiện tượng | Kiểm tra trước |
|---|---|
| Mobile không tới backend | Trên điện thoại mở health IP laptop:8082; kiểm cùng mạng, firewall và mạng guest |
| Health UP nhưng MQTT DISCONNECTED | Mạng có Internet và truy cập broker TCP 1883; launcher bật MQTT, Node A dùng cùng broker |
| Node A online nhưng cảm biến cũ | Node B còn nguồn, UART nối chéo đúng chân, chung GND, đúng hai firmware đầy đủ |
| Web không login/cập nhật, mobile được | Cửa sổ B có BACKEND_URL=8082, VITE_WS_URL=/ws; launcher mới có CORS cho web 5173 |
| Có số nhưng quay bánh không đổi | Đang chọn đúng xe HARDWARE/UUID; không chọn xe SIMULATED |
| ARM/reset bị WHEEL_DATA_STALE | Kiểm firmware hai node đều có wheel sample mới; không chỉ cập nhật một node |
| Khóa bị từ chối sau vừa dừng | Chờ đủ 4 giây không có xung; tốc độ và UART/counter phải hợp lệ/mới |
| GPS NO_FIX nhưng Hall vẫn chạy | Thử GPS ở chỗ thoáng; chưa có fix khác lỗi UART GPS. Chars tăng/checksum ít lỗi xác nhận đường nhận, không tự xác nhận vị trí |
| Có tọa độ nhưng nền bản đồ trống | Thử Mở bản đồ lớn, kiểm Internet/DNS dịch vụ bản đồ; trên web có nút tải lại |
| Cổng 8081/8082/5173 bận | Ctrl+C đúng terminal cũ; không xóa DB hoặc tắt ngẫu nhiên dịch vụ khác |

Log backend classroom tại `.local/classroom-demo/backend.log` và `backend-error.log`. Không chia sẻ file settings, mật khẩu hoặc token. Nếu đổi Wi-Fi, dừng launcher và chạy lại để URL/IP QR được cập nhật.

## 7. Lưu kết quả và dừng

Mỗi ca lưu một ảnh/video nhìn được thao tác phần cứng và hai giao diện, kèm log A/B cần thiết. Với GPS lưu đoạn FIX có tọa độ và ảnh vị trí; với điều khiển lưu kết quả lệnh và quan sát relay/motor/còi. Ghi PASS/FAIL theo điều thực tế quan sát, không điền sẵn PASS từ các kiểm phần mềm.

Kết thúc: tắt nhánh motor, Ctrl+C ở cửa sổ B rồi cửa sổ A, sau đó ngắt nguồn các node. DB file giữ tài khoản và lịch sử đã commit; phiên bánh firmware là RAM nên không giữ sau reset/mất điện.
