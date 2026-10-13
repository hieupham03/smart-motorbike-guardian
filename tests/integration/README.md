# Software integration checks

`backend/src/test/java/com/guardian/`: `mvn test` chạy H2/Flyway, MQTT TCP peer local, STOMP thật, metadata, ACK/timeout và quyền. Không cần board, broker công cộng hoặc PostgreSQL thật.

`frontend/src/services/`: `npm test` chạy reducer, freshness, session refresh/race conditions bằng Node test runner.

UI smoke dành cho môi trường Windows có Microsoft Edge:

1. Trong `backend/`: `mvn package -DskipTests`.
2. Trong `frontend/`: `npm ci`, rồi `npm install --no-save --package-lock=false playwright`. Dependency UI chỉ dùng khi chạy smoke, không cần cho app/default unit tests.
3. Từ root repo: `node tests/integration/ui-runtime.cjs`. Helper tạo secret tạm, H2 riêng, MQTT disabled; dùng cổng 18080/15173, không điều khiển board.
4. Terminal khác, từ root: `node tests/integration/ui-smoke.cjs`.
5. Ctrl+C terminal runtime để dừng backend/Vite và xóa file credential/PID tạm. Không chạy helper khi những cổng này đã được dùng.

Smoke login Owner/Viewer, xác nhận WebSocket, telemetry SIMULATED, ACK/command history, MQTT_UNAVAILABLE, NO_FIX/null ADC, quyền Viewer và reload. Ảnh/JSON phần mềm được ghi vào `docs/evidence/realtime/`; cần phân biệt với evidence hardware.
