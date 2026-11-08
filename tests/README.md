# Kiểm thử

| Phần | Lệnh / hướng dẫn |
|---|---|
| Repository | `python tests/publication/check_repository.py` từ gốc repo |
| Backend | `cd backend` rồi `mvn verify` — H2/Flyway, quyền, MQTT/ACK và ngưỡng |
| Web | `cd frontend` rồi `npm ci`, `npm test`, `npm run build` |
| Mobile | `cd frontend/mobile` rồi `npm ci`, `npm run typecheck`, `npm run lint`, `npm test -- --watch=false` |
| Firmware | [Host UART/Hall/ngưỡng và Arduino build](firmware/README.md) |
| Browser | [Web/mobile fixtures và tích hợp](integration/README.md) |

Các test phần mềm dùng nguồn module thật hoặc REST/STOMP/MQTT emulator theo từng phép kiểm. Không coi pass host/browser/export là đã xác nhận GPS RF, relay/motor/còi hoặc push trên điện thoại thật. Kịch bản kiểm thử thủ công nằm trong `docs/` và được liên kết từ [tài liệu dự án](../docs/README.md).
