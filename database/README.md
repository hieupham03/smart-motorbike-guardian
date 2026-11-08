# Database

Schema được quản lý duy nhất bởi Flyway trong `backend/src/main/resources/db/migration/`: V1 tạo schema, V2 thêm metadata/realtime/late ACK và dedupe, V3 bổ sung push token/delivery. Không duy trì một bản SQL tạo bảng trùng lặp ngoài Flyway.

Khởi động PostgreSQL bằng `deployment/docker-compose.yml`. DataInitializer chỉ tạo demo khi `DEMO_SEED_ENABLED=true`, mật khẩu từ môi trường. SQL và compose cũ đã bỏ để tránh khởi tạo chồng nhau và mật khẩu cố định.

Không xóa volume để nâng cấp. Sao lưu dữ liệu nhóm trước khi migrate. Xem `docs/REALTIME-BACKEND-FRONTEND.md`.

- [Dữ liệu xe mẫu](sample-device.json) là fixture công khai, không chứa thông tin cá nhân/mật khẩu và không tự nhập vào DB production.
- [Truy vấn kiểm tra schema PostgreSQL](inspect-schema.sql) chỉ đọc metadata; dùng sau khi backend đã chạy Flyway.
- Seed tài khoản/thiết bị thực thi nằm trong DataInitializer phía backend, bật bằng biến môi trường. Không xuất database H2/PostgreSQL đã chạy vào Git.
