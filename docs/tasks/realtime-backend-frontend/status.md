# Hoàn thiện backend/frontend realtime

Status: ready-for-human
Progress: software-implemented; hardware-acceptance-pending
Scope: backend, frontend, database, integration
Ngày: 13/10/2026

Đã sửa luồng MQTT→DB→WebSocket→UI, metadata/freshness/GPS/null, lifecycle lệnh/ACK/timeout, quyền Owner/Viewer và migration. Yêu cầu người dùng cho phép sửa backend/frontend; firmware được giữ nguyên.

Hướng dẫn: [REALTIME-BACKEND-FRONTEND.md](../../REALTIME-BACKEND-FRONTEND.md). Bằng chứng phần mềm: [evidence/realtime/README.md](../../evidence/realtime/README.md).

Gate còn lại do người có breadboard thực hiện: Hall/MPU→UI thật, ACK/relay/interlock thật, LWT/mạng, GPS FIX/STALE ngoài trời, 20 phép đo latency và chạy lâu. Cần actual/log/video trước khi đánh dấu nghiệm thu toàn hệ thống.
