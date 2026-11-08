# Sơ đồ thiết kế

Mở [SMART_MOTORBIKE_GUARDIAN.vpp](SMART_MOTORBIKE_GUARDIAN.vpp) bằng Visual Paradigm. Dự án có 14 sơ đồ được tạo bằng phần tử và quan hệ gốc, chỉnh sửa được; [PNG/SVG xuất từ dự án](exports/) dùng trong báo cáo. Watermark Community Edition được giữ.

| Nhóm | Sơ đồ |
|---|---|
| Yêu cầu/kiến trúc | Bối cảnh, use case, ánh xạ năm tầng IoT, cấu trúc phần mềm |
| Phần cứng/triển khai | Hai node, thành phần triển khai và kết nối |
| Dữ liệu/giao thức | ERD logic, sequence telemetry, sequence command/ACK |
| Trạng thái/quy trình | Bảo vệ Node A, vòng đời thiết bị, tiếp nhận/chia sẻ xe, kiểm quyền/điều kiện, command timeout/ACK muộn |

ERD thể hiện các quan hệ và trường tiêu biểu. Schema đầy đủ được quản lý bằng Flyway trong `backend/src/main/resources/db/migration/`. Khi sửa sơ đồ, đối chiếu source và ngưỡng hiện tại; sơ đồ không thay bảng nối chân thực tế hoặc luật kiểm tra của firmware.

File khóa/backup, workspace và chương trình thử Open API phục vụ biên tập đã được loại khỏi phạm vi phát hành. Không cần cài MCP để đọc báo cáo hoặc mở file VPP.
