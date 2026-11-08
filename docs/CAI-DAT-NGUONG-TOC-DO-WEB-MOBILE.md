# Đổi ngưỡng cảnh báo tốc độ trên web và mobile

## Cách sử dụng

1. Đăng nhập bằng tài khoản chủ xe hoặc quản trị viên, chọn đúng xe.
2. Web: vào **Tổng quan → Thống kê phiên → Ngưỡng cảnh báo tốc độ**. Mobile: vào tab **Tổng quan**, kéo đến cùng mục này.
3. Kiểm tra dòng **Ngưỡng thiết bị báo về**. Đây là ngưỡng Node A thực sự gửi lên, không phải một giá trị chỉ lưu ở giao diện.
4. Nhập **Ngưỡng mới (km/h)** từ **1 đến 120**, ví dụ `5` hoặc `5,5` trên mobile, rồi bấm **Lưu ngưỡng cảnh báo**.
5. Chờ thiết bị phản hồi. Khi thành công, ứng dụng báo **Đổi ngưỡng cảnh báo tốc độ: Đã thực hiện**; dòng ngưỡng thiết bị báo về cập nhật khi bản tin tiếp theo tới.

Trong lúc chờ, các nút gửi lệnh bị khóa để tránh gửi lặp. Không tự đổi dòng ngưỡng đang áp dụng ngay khi bấm Lưu. Tài khoản chỉ theo dõi không được sửa. Dữ liệu cũ/mất kết nối hoặc firmware chưa hỗ trợ sẽ khóa việc lưu và hiển thị lý do.

## Cập nhật lần đầu

- Tắt nhánh nguồn motor trước khi nạp. Mở lại sketch từ ổ đĩa, nạp [Node A](../firmware/node_a_gateway/node_a_gateway.ino) cùng các header trong thư mục đó. Không phải thay dây hoặc thêm linh kiện. Node B không đổi trong tính năng này nếu đã chạy bản gửi bộ đếm bánh.
- Serial Node A ở 115200 sẽ có `[SPEED LIMIT] boot=... storage=READY`. Sau lệnh thành công có `[SPEED LIMIT] applied=... saved=NVS`.
- Khởi động lại backend để nạp bản JAR mới. Với bộ chạy trên lớp, đóng phiên launcher hiện tại bằng `Ctrl+C`, đợi backend dừng rồi mở lại `deployment/start-mobile-demo.bat`. Nếu backend được chạy riêng, dừng đúng tiến trình đó rồi chạy lại theo hướng dẫn cũ.
- Web tải lại trang. Mobile Reload trong Expo Go/dev build; không thêm native module nên không yêu cầu tạo bản native mới chỉ vì thay đổi này.
- Backend JAR đã build tại `backend/target/smart-motorbike-guardian-backend-1.0.0.jar`. Có bản build riêng tại `build/backend-speed-limit/` để tránh lỗi Windows giữ file đang chạy.

## Quy tắc hoạt động

- Node A dùng ngưỡng mới cho cảnh báo quá tốc độ; Node B tiếp tục đo Hall như trước.
- Khi tốc độ lớn hơn ngưỡng liên tục đủ **2 giây theo các mẫu tốc độ mới**, phát `SPEED_LIMIT_EXCEEDED`. Khi tốc độ xuống thấp hơn ngưỡng ít nhất **0,5 km/h** trong **2 giây**, bỏ trạng thái vượt ngưỡng để có thể cảnh báo lần sau.
- Đổi sang giá trị khác bắt đầu lại thời gian xét vượt ngưỡng, không xóa số xung/quãng đường phiên và không đổi PARKED/ARMED/ALARM/THEFT_LOCK. Gửi lại cùng giá trị không khởi động lại bộ đếm thời gian.
- Ngưỡng mặc định lần đầu là **2 km/h** cho bánh mô hình. Ngưỡng đã lưu trong NVS của Node A được đọc lại sau khởi động/mất điện. Xóa toàn bộ flash/NVS sẽ mất cấu hình này; thống kê phiên vẫn chỉ nằm trong RAM.
- Đây là **cảnh báo**, không phải bộ điều tốc. Nó không tự giảm tốc hay cắt relay motor. Luật từ chối ARM/LOCK khi bánh chưa dừng không phụ thuộc ngưỡng cảnh báo này.
- Ngưỡng mô phỏng trong khu vực nhà phát triển chỉ áp dụng simulator. Thiết bị thật dùng luồng lệnh dưới đây.

## Hợp đồng dữ liệu

REST giữ endpoint `POST /api/devices/{deviceId}/command`, payload:

```json
{"type":"CONFIG_THRESHOLDS","payload":"{\"speed_limit_kmh\":5.5}"}
```

Backend kiểm tra quyền điều khiển và JSON chỉ có một trường số hữu hạn `speed_limit_kmh`, trong khoảng 1–120. Sau đó gửi topic `guardian/{deviceUuid}/cmd/config_thresholds`:

```json
{"cmd_id":"<id-do-backend-tao>","type":"CONFIG_THRESHOLDS","speed_limit_kmh":5.5}
```

Firmware kiểm tra lại giá trị; chỉ trả `EXECUTED` sau khi lưu thành công. Giá trị sai trả `INVALID_SPEED_LIMIT`; lỗi lưu trả `CONFIG_STORAGE_FAILED`, ngưỡng đang chạy không đổi. ACK dùng `cmd_id` và endpoint/topic cũ; ACK muộn không đổi bản ghi TIMEOUT thành thành công.

`wheel_session` bổ sung `speed_limit_configurable` và gửi `speed_limit_kmh` từ ngưỡng runtime của Node A. Backend chuyển thành `speedLimitConfigurable` / `speedLimitKmh` trong REST/STOMP. Board cũ không gửi cờ hỗ trợ được hiển thị là chưa hỗ trợ đổi ngưỡng từ xa. Không lấy cột ngưỡng simulator trong DB để thay thế ngưỡng thực trên board.

## Kiểm tra và giới hạn bằng chứng

- Host test `wheel_activity_test.cpp`: ngưỡng động, giới hạn giá trị, thời gian duy trì, giữ thống kê và tiếp tục phát hiện trộm sau đổi ngưỡng.
- Backend: kiểm tra payload MQTT thực sự chứa giá trị, từ chối giá trị sai và Viewer, không đánh dấu áp dụng khi MQTT lỗi, nhận ngưỡng và cờ hỗ trợ từ bản tin thiết bị.
- Web/mobile: kiểm tra nhập liệu, chờ xác nhận, không đổi ngưỡng giả trước bản tin thiết bị, giữ ngưỡng cũ khi bị từ chối, khóa với dữ liệu cũ/firmware cũ/Viewer. Xem [kết quả UI](evidence/speed-limit-ui/result.json).
- Kiểm thử trình duyệt dùng fixture, gồm cả bản export mobile web; không chứng minh thao tác native trên điện thoại hay NVS/motor/còi thực tế.

Nghiệm thu thật: đặt ngưỡng 5 trên web, kiểm tra Serial và mobile cùng báo 5; đổi 3 trên mobile, kiểm tra web cùng báo 3; ngắt/cấp lại nguồn Node A và kiểm tra vẫn là 3; thử vượt ngưỡng đủ thời gian để nhận cảnh báo. Không thử lưu khi motor có thể tự khởi động ngoài kiểm soát.

Tham khảo triển khai giao diện theo [Expo SDK 58](https://docs.expo.dev/versions/v58.0.0/) và [React Native TextInput](https://reactnative.dev/docs/textinput).
