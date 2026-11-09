# Xác thực MQTT và vòng đời thiết bị khi demo

Chế độ classroom chạy broker MQTT thật trong cùng tiến trình Java với backend. Hai thành phần vẫn dùng giao thức MQTT qua TCP; broker không sinh dữ liệu cảm biến. Node A kết nối bằng IP LAN của laptop, nên luồng Hall/MPU và điều khiển không cần broker công cộng hoặc Internet. Mobile vẫn cần kết nối được laptop; nền bản đồ cần dịch vụ bản đồ bên ngoài.

Mở `deployment/start-classroom-demo.bat` theo hướng dẫn triển khai. Cấu hình riêng được giữ trong `.local/classroom-demo/`; firmware chỉ đọc `firmware/node_a_gateway/network_config.h` local, không commit file này. Cổng MQTT mặc định là 1883. Chế độ này dùng LAN riêng, **chưa mã hóa TLS**, không được trình bày như triển khai bảo mật trên Internet.

## Ba loại thông tin khác nhau

| Thông tin | Công dụng |
|---|---|
| Tài khoản người dùng và JWT | Đăng nhập ứng dụng, kiểm tra quyền Owner/Viewer/Admin tại API và realtime |
| Mã kích hoạt thiết bị | Gán thiết bị chờ kích hoạt cho chủ sở hữu; dùng một lần, mã cấp mới có hạn 7 ngày |
| Username/mật khẩu MQTT của thiết bị | Xác thực Node A với broker; mỗi UUID có mật khẩu riêng, backend lưu bản băm BCrypt |

Backend có tài khoản MQTT dịch vụ riêng, không dùng mật khẩu Node A. Thiết bị có client ID `Guardian-<UUID>`, username `device-<UUID>`. Broker kiểm tra trạng thái và mật khẩu trong cơ sở dữ liệu; credential của thiết bị đang chờ kích hoạt, bị thu hồi hoặc ngừng sử dụng không cho phép CONNECT.

## Quyền trên topic

- Node A chỉ gửi telemetry, trạng thái, heartbeat, thống kê bánh, sự kiện/cảnh báo và ACK trong `guardian/<UUID của mình>/...`.
- Node A chỉ nhận lệnh trong `guardian/<UUID của mình>/cmd/...`; không được đọc dữ liệu xe khác hoặc gửi lệnh điều khiển.
- Tài khoản dịch vụ backend đọc các topic dữ liệu/ACK và gửi các loại lệnh được hỗ trợ. Người dùng ứng dụng không được cung cấp mật khẩu dịch vụ này.
- Backend vẫn kiểm tra ownership, nội dung bản tin và trạng thái thiết bị. ACL tại broker bổ sung một lớp kiểm soát trước khi dữ liệu tới backend.

## Thứ tự kích hoạt và thu hồi

1. Admin cấp thiết bị để có UUID và mã kích hoạt; hoặc dùng Node A thật đang chờ kích hoạt trong DB classroom mới. Không xóa DB đang dùng để tạo lại kịch bản.
2. Owner nhập mã kích hoạt trên web hoặc mobile. Thiết bị chuyển từ PROVISIONED sang ACTIVE và có ownership. Đăng nhập Viewer để kiểm tra quyền xem sau khi Owner chia sẻ.
3. Node A dùng credential riêng để kết nối. Theo dõi firmware/hardware do bản tin trạng thái gửi lên và thử dữ liệu/còi/relay.
4. **Tạm thu hồi kết nối** chuyển thiết bị sang FAULT, xóa hash credential và đóng phiên MQTT. Mật khẩu cũ không được kết nối lại; các bản tin tới muộn cũng không được nhập vào dữ liệu thiết bị.
5. **Kích hoạt lại kết nối** là thao tác riêng của Owner/Admin. Hệ thống giữ ownership, cấp mật khẩu hoàn toàn mới và chuyển về OFFLINE, chờ Node A nối lại. Credential mới phải được cập nhật vào cấu hình local và nạp lại Node A. Nếu thiết bị chưa có chủ, nó trở về PROVISIONED với mã kích hoạt mới.
6. **Ngừng sử dụng** chuyển sang DECOMMISSIONED và không cho kích hoạt lại. Chỉ dùng cho thiết bị thử đã chọn rõ hoặc kết thúc kịch bản khi nhóm không còn cần dùng danh tính đó.

Khóa động cơ/THEFT_LOCK và thu hồi kết nối là hai nghiệp vụ khác nhau. Khóa động cơ tác động relay theo điều kiện bánh dừng; thu hồi kết nối tác động quyền MQTT, không tự chứng minh motor đã dừng. Trong demo, hoàn tất các ca điều khiển và tắt nhánh motor trước khi thử thu hồi.

## Cấp lại mật khẩu

Màn hình Chẩn đoán của Owner/Admin có thao tác cấp lại thông tin kết nối. API chỉ trả mật khẩu một lần, dùng `Cache-Control: no-store`; không đưa mật khẩu vào snapshot thiết bị, realtime hay audit log. Lần cấp mới vô hiệu hóa mật khẩu đang dùng, nên chỉ thực hiện khi sẵn sàng cập nhật Node A.

Không dùng file cấu hình cũ sau khi đổi mật khẩu. Bộ khởi tạo không tự ghi đè credential đã đổi hoặc tự mở lại thiết bị đã thu hồi. Không chụp mật khẩu vào ảnh báo cáo, không đưa file `.local/` hoặc `network_config.h` lên GitHub.

## API phục vụ kịch bản

| API | Quyền | Kết quả |
|---|---|---|
| POST `/api/admin/devices` | Admin | Cấp thiết bị, UUID và claim có hạn |
| POST `/api/devices/onboard` | Người dùng đăng nhập, mã hợp lệ | Gán ownership và kích hoạt; từ chối mã hết hạn/đã dùng |
| POST `/api/devices/{id}/mqtt-credentials` | Owner/Admin | Đổi credential, trả mật khẩu một lần; không tự kích hoạt lại FAULT |
| POST `/api/devices/{id}/revoke` | Owner/Admin | Thu hồi quyền kết nối và đóng phiên MQTT |
| POST `/api/devices/{id}/reactivate` | Owner/Admin | Kích hoạt lại FAULT bằng credential mới |
| POST `/api/devices/{id}/decommission` | Owner/Admin | Ngừng sử dụng vĩnh viễn |

Kiểm thử bằng client MQTT thật trên localhost nằm tại `backend/src/test/java/com/guardian/EmbeddedMqttSecurityIntegrationTest.java`; [hồ sơ kiểm thử](evidence/mqtt-security/README.md) nêu phạm vi và kết quả. Kết quả đó không thay việc quan sát Node A bị ngắt và bị từ chối kết nối lại trong buổi demo mạch thật.

Broker sử dụng thư viện [Moquette](https://github.com/moquette-io/moquette), khóa phiên bản Maven trong `backend/pom.xml`; hook xác thực/ACL và API đóng phiên được đối chiếu với [source artifact chính thức](https://repo.maven.apache.org/maven2/io/moquette/moquette-broker/0.17/moquette-broker-0.17-sources.jar). Thư viện hỗ trợ broker; phần quản lý thiết bị, credential, quyền, dữ liệu và giao diện do source dự án triển khai.
