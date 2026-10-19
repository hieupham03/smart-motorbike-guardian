# Bàn giao mobile app

Cập nhật: 18/10/2026.

## Thành phần bàn giao

- Source mobile: `mobile/`; backend push + migration V3: `backend/`.
- Kế hoạch/task: `docs/tasks/mobile-app/`.
- Tổng quan kỹ thuật: [MOBILE-APP-IMPLEMENTATION.md](MOBILE-APP-IMPLEMENTATION.md).
- Cài đặt/build: [HUONG-DAN-CAI-DAT-VA-CHAY-MOBILE.md](HUONG-DAN-CAI-DAT-VA-CHAY-MOBILE.md).
- Test tay: [NGHIEM-THU-MOBILE-TRUC-TIEP.md](NGHIEM-THU-MOBILE-TRUC-TIEP.md).

## Trạng thái xác minh phần mềm

Tại ngày bàn giao trên Windows 11, Java runtime 21 biên dịch target Java 17, Node/npm trong workspace:

| Hạng mục | Kết quả |
|---|---|
| Backend `mvn test` | PASS: migration V1–V3, push transport mock và realtime integration; không gọi Expo thật |
| Mobile `npm run typecheck` | PASS |
| Mobile `npm run lint` | PASS, không error/warning |
| Mobile `npm test` | PASS: 8 suites/28 tests |
| Expo Doctor 1.21.5 | PASS: 20/20 checks |
| Expo web export | PASS; artifact tạm đã xóa |
| Camera/map/share/push native thật | CHƯA CHẠY — `ready-for-human` |
| GPS/relay/interlock/end-to-end board | CHƯA CHẠY — `ready-for-human` |

Web export chỉ chứng minh bundle; không thay native/hardware test.

## Việc người nhận cần làm

1. Chọn/merge nhánh tích hợp `feature-mobile-app` sau khi review; các nhánh task đã push riêng và xếp tầng.
2. Tạo `mobile/.env` với IP backend LAN và EAS project ID công khai.
3. Thiết lập EAS project, FCM/APNs và secret trên EAS/deployment; không commit credential.
4. Chạy migration PostgreSQL V3 trong môi trường backup/staging trước production/demo DB.
5. Tạo development build, chạy toàn bộ checklist native và lưu evidence.
6. Kết hợp người phụ trách hardware chạy checklist board; chỉ đánh PASS khi có actual/evidence.

## Rủi ro/giới hạn còn lại

- Prototype dùng HTTP/MQTT TCP theo baseline; chưa phải kiến trúc bảo mật xe thương mại.
- Expo Push Service là phụ thuộc ngoài; delivery có thể trễ. Backend lưu ticket/receipt/dedupe nhưng chưa có dashboard vận hành push.
- Installation ID là ID ngẫu nhiên trong AsyncStorage, không phải định danh phần cứng chống giả mạo.
- Backend gửi HTTP push sau commit đồng bộ; đủ cho demo, cần queue/outbox worker nếu nâng quy mô.
- History tải tối đa 5.000 mẫu mỗi truy vấn; chart rút mẫu. Cấu hình threshold chưa xuống firmware.
- Không có bằng chứng thiết bị thật trong phiên triển khai tự động này.

## Quy trình rollback

- App: cài lại APK/IPA build trước; không tái sử dụng credential trong Git.
- Backend: deploy commit trước. Migration V3 chỉ thêm bảng push; không tự drop bảng khi rollback. Backup DB và lập migration forward để xóa sau khi xác nhận không cần dữ liệu.
- Nếu push gây sự cố, đặt `EXPO_PUSH_ENABLED=false` và redeploy backend. Không sửa DB thủ công khi chưa backup.

## Kiểm tra nhanh sau bàn giao

```powershell
Set-Location backend
mvn test
Set-Location ../mobile
npm ci
npm run typecheck
npm run lint
npm test
npm run doctor
```

Sau đó thực hiện [checklist nghiệm thu trực tiếp](NGHIEM-THU-MOBILE-TRUC-TIEP.md).
