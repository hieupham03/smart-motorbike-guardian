# Database

Schema được quản lý duy nhất bởi Flyway trong `backend/src/main/resources/db/migration/`: V1 tạo schema, V2 thêm metadata/realtime/late ACK và dedupe.

Khởi động PostgreSQL bằng `deployment/docker-compose.yml`. DataInitializer chỉ tạo demo khi `DEMO_SEED_ENABLED=true`, mật khẩu từ môi trường. SQL và compose cũ đã bỏ để tránh khởi tạo chồng nhau và mật khẩu cố định.

Không xóa volume để nâng cấp. Sao lưu dữ liệu nhóm trước khi migrate. Xem `docs/REALTIME-BACKEND-FRONTEND.md`.
