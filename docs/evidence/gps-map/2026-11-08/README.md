# Hiển thị bản đồ vị trí xe

Thay đổi ứng dụng:

- Mobile web thay khối chỉ có tọa độ bằng iframe bản đồ OpenStreetMap, có marker, zoom và liên kết mở bản đồ lớn. Bản Android/iOS giữ `react-native-maps` đang có.
- Web đóng gói CSS Leaflet từ dependency đã cài thay vì tải qua CDN. Dùng tile URL chuẩn; giữ attribution, thêm thông báo lỗi và nút tải lại nền bản đồ.
- Không thay firmware, backend hoặc dữ liệu GPS. Chưa có vị trí thì chờ; có vị trí nhưng GPS mất hiệu lực thì giữ điểm gần nhất và cảnh báo rõ.

Kiểm tra đã chạy:

| Phép kiểm | Kết quả |
|---|---|
| Web production build | PASS |
| Web logic | 17/17 PASS |
| Mobile typecheck và lint | PASS |
| Mobile GPS presentation | 4/4 PASS |
| Expo export web | PASS, `build/gps-map-mobile-20261108` |
| Browser integration | 8 kiểm tra PASS, không page error; chi tiết `results.json` |

Browser integration kiểm trạng thái chưa có vị trí, marker/iframe đúng tọa độ, thay đổi qua STOMP, giữ vị trí cũ, CSS Leaflet không phụ thuộc CDN, lỗi tile và tải lại. API, STOMP và nội dung tile/iframe được kiểm soát bằng fixture; ảnh `web-map-stale.png`, `mobile-map-stale.png` có nhãn mô phỏng. `attempt-1-failure.json` giữ lần thất bại đầu do test đợi tên xe ở màn hình không hiển thị tên; đã sửa điều kiện chờ của test rồi chạy lại thành công.

`provider-probe.json` ghi riêng khả năng tải một bản đồ thật từ dịch vụ ngoài bằng tọa độ ví dụ công khai. Phép thử này không thay thế GPS thật hoặc kiểm trên điện thoại. Không giả kết quả kết nối mạng ngoài thành PASS từ fixture.

Tái chạy:

```powershell
node tests/integration/gps-map-ui.cjs
node tests/integration/gps-map-provider-probe.cjs
```

Nguồn kỹ thuật: [OpenStreetMap embed HTML](https://wiki.openstreetmap.org/wiki/Export#Embeddable_HTML), [tile URL và attribution](https://operations.osmfoundation.org/policies/tiles/). Map dùng tọa độ GPS của xe; không yêu cầu lấy vị trí điện thoại.
