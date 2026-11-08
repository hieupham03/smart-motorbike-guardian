# Ứng dụng người dùng

- `src/`, `package.json`: web React/Vite.
- `mobile/`: app Expo/React Native cho Android/iOS và bản web export phục vụ kiểm thử.

Web: `npm ci`, đặt biến môi trường shell `BACKEND_URL` nếu API không ở cổng 8080, rồi `npm run dev`. Vite proxy `/api` và `/ws` tới cùng backend. `npm test` và `npm run build` kiểm tra bản web.

Mobile: xem [hướng dẫn riêng](mobile/README.md). Hai ứng dụng dùng chung REST/STOMP, quyền và trạng thái lệnh. Ngưỡng tốc độ được áp dụng qua lệnh có xác nhận từ thiết bị, không chỉ lưu vào form. Phần Chẩn đoán & thử nghiệm tách các trường kỹ thuật và simulator khỏi luồng sử dụng chính.
