# Đo lường và lưu minh chứng trước buổi demo

Đề bài mục 7.2 yêu cầu chọn chỉ tiêu phù hợp, mô tả phương pháp, giữ dữ liệu đo và nhận xét. Công cụ [measure-demo.cjs](../tests/manual/measure-demo.cjs) hỗ trợ quan sát backend đang nhận dữ liệu của thiết bị gắn nhãn HARDWARE. Công cụ mặc định chỉ đăng nhập và đọc API; không bật motor, còi, relay hoặc đổi cấu hình.

## 1. Những gì đo được

| Chỉ tiêu | Phương pháp | Cách hiểu kết quả |
|---|---|---|
| Độ ổn định luồng dữ liệu quan sát | Poll hồ sơ thiết bị và telemetry mới nhất, mặc định mỗi 1 giây; nhận diện mẫu bằng readingId/receivedAt | Đếm số lần đọc thành công/lỗi và mẫu backend khác nhau; theo dõi trạng thái, dữ liệu không đổi và cờ hợp lệ |
| Thời gian phản hồi REST | Đồng hồ đơn điệu trên máy thu, từ đầu poll tới khi nhận xong hai phản hồi | Bao gồm API, mạng và xử lý phía máy thu. Không phải độ trễ cảm biến đến màn hình |
| Dấu hiệu khởi động lại | Quan sát deviceUptimeS giảm giữa hai reading khác nhau | Có thể là reboot hoặc tràn counter; phải đối chiếu Serial/nguồn. Nếu uptimeAvailableReadings bằng 0 thì không đủ dữ liệu đánh giá reset |
| Phát hiện offline và phục hồi | Người thao tác đánh dấu ngắt/khôi phục bằng phím; công cụ chờ OFFLINE và ACTIVE kèm reading mới | Thời gian tính từ phím bấm, gồm sai số thao tác, chu kỳ poll và thời gian request. Không phải thời điểm chính xác dòng điện hoặc Wi-Fi mất |
| Độ trễ kết quả lệnh reset phiên | Chỉ khi thêm `--measure-reset`: gửi 5 lệnh RESET_WHEEL_SESSION, theo dõi từng cmd_id tới kết quả cuối | Thời gian client gửi yêu cầu đến lúc đọc thấy kết quả; đồng thời có ackAt − issuedAt theo cùng đồng hồ server nếu đủ timestamp |

Không suy ra **tỷ lệ mất gói MQTT** từ số lần poll hoặc số reading: endpoint chỉ trả mẫu mới nhất nên nhiều bản tin có thể tới giữa hai lần đọc. Không trừ uptime firmware với giờ UTC để tạo số “sensor-to-dashboard latency”.

Nhãn HARDWARE là điều kiện chọn dữ liệu, chưa tự chứng minh mạch vật lý là nguồn. Người vận hành phải nhìn thấy đúng board, UUID, log và thay đổi cảm biến trong cùng phiên đo.

## 2. Chuẩn bị phiên đo

1. Chạy backend, broker và hai node đúng cấu hình demo. Xác nhận dữ liệu thật đang tới ứng dụng trước khi đo.
2. Dùng Node.js 24 như bộ chạy/CI. Công cụ không cần cài thêm npm package.
3. Mật khẩu chỉ đọc từ biến môi trường `GUARDIAN_PASSWORD`, hoặc `DEMO_PASSWORD` nếu đã có trong terminal. `GUARDIAN_EMAIL` chọn tài khoản; mặc định là tài khoản mẫu `owner@guardian.iot`. Không đưa mật khẩu vào tham số command line.
4. Nếu tài khoản có nhiều xe HARDWARE, truyền `--device` bằng deviceId hoặc UUID đúng xe đang thử. Công cụ từ chối SIMULATED.
5. Đóng công cụ/simulator có thể phát bản tin vào cùng UUID. Không khởi chạy bài đo bằng dữ liệu emulated rồi gọi là đo phần cứng.

Nhập mật khẩu trong PowerShell mà không in ra màn hình hoặc lưu vào lịch sử lệnh:

```powershell
$taskMeasurementSecret = Read-Host 'Mat khau tai khoan demo' -AsSecureString
$taskMeasurementPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($taskMeasurementSecret)
try {
    $env:GUARDIAN_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($taskMeasurementPointer)
    node tests/manual/measure-demo.cjs --duration 60
} finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($taskMeasurementPointer)
    Remove-Item Env:GUARDIAN_PASSWORD -ErrorAction SilentlyContinue
}
```

Các lệnh tiếp theo cũng cần chạy trong terminal có biến môi trường hoặc bên trong khối `try` tương tự. Tệp cấu hình launcher chứa thông tin riêng vẫn ở `.local/`; không copy vào docs hoặc đính kèm khi nộp.

## 3. Ba lượt kiểm phù hợp trước demo

### Lượt A — kiểm nhanh 60 giây

```powershell
node tests/manual/measure-demo.cjs --base-url http://127.0.0.1:8082 --duration 60
```

Giữ motor OFF, quay bánh thật vài lần bằng tay, dừng và quan sát dữ liệu về 0. Công cụ cần thấy ít nhất hai reading khác nhau mới trả exit code 0. Exit code 0 chỉ cho biết đã quan sát dữ liệu mới có nhãn HARDWARE, không phải kết luận mọi tính năng đã PASS.

### Lượt B — chạy liên tục 30 phút

```powershell
node tests/manual/measure-demo.cjs --duration 1800
```

Trong phiên, thử có kiểm soát một lần mất/khôi phục mạng gateway:

- Thực hiện ngắt mạng rồi nhấn **o** ngay sau thao tác để ghi marker. Giữ hai node còn nguồn nếu đang đánh giá mạng.
- Đợi hệ thống thực sự ghi OFFLINE. Nhánh MQTT offline khác với rút UART của Node B: rút UART có thể chỉ làm sensorConnected=false trong khi gateway vẫn online.
- Khôi phục mạng rồi nhấn **r** ngay sau thao tác. Công cụ chờ ACTIVE kèm reading mới.
- **q** hoặc Ctrl+C kết thúc sớm và vẫn xuất summary. Để đủ dữ liệu 30 phút thì giữ công cụ chạy hết thời lượng.

Marker nhập bằng phím đơn trong terminal tương tác. Khi chạy nền hoặc redirect stdin, công cụ vẫn thu số liệu nhưng không có marker thủ công. Khi đó không tự điền số thời gian offline/recovery.

Ghi riêng cách ngắt, firmware đã nạp, mạng/broker và thao tác với motor/relay. Không thay đổi nguồn sai định mức hoặc làm chập dây để tạo ca lỗi.

### Lượt C — 5 phép đo lệnh không tác động GPIO

```powershell
node tests/manual/measure-demo.cjs --duration 60 --measure-reset
```

Tùy chọn này **xóa thống kê phiên bánh trong RAM 5 lần**. Chỉ chạy khi chấp nhận mất thống kê phiên hiện tại. Nó không gửi ARM, LOCK, REBOOT hoặc lệnh còi. Nếu chưa có dữ liệu cảm biến, người dùng là Viewer hoặc firmware không phản hồi, công cụ ghi kết quả bị từ chối/lỗi/timeout; không tự retry một lệnh POST chưa rõ kết quả.

Trong summary, `clientObservedMs` là thời gian từ request của máy thu đến lúc đọc được trạng thái cuối, gồm chu kỳ poll lệnh 250 ms. `serverIssuedToAckMs` là hiệu hai timestamp server, chỉ có khi cả hai hợp lệ và không đảo thời gian. P50/P95 dùng nearest-rank; với 5 phép đo thì P95 là giá trị lớn nhất của mẫu nhỏ, không chứng minh mức tin cậy thống kê cho sử dụng thực tế.

## 4. Tệp kết quả và cách viết nhận xét

Mỗi phiên tạo một thư mục mới trong `.local/evidence/demo-.../`, không ghi đè phiên cũ:

- `observations.jsonl`: phương pháp, projection mẫu đã lọc, marker, mã lỗi và kết quả reset nếu có.
- `summary.json`: thời lượng, số poll, reading khác nhau, cờ hợp lệ, độ trễ REST, các chuyển trạng thái, số mẫu có uptime và thời gian offline/recovery đã quan sát.

Projection chỉ giữ thông tin kỹ thuật cần đo. Không lưu email, tên, biển số, claim token, JWT, mật khẩu hoặc tọa độ GPS. Công cụ cũng không in raw body lỗi từ server. Khóa API/credential không xuất hiện trong tên file hoặc command line.

Các trường quan trọng:

| Trường | Diễn giải |
|---|---|
| uniqueBackendReadings | Số ID mẫu backend khác nhau từng nhìn thấy, không phải tổng gói MQTT đã nhận |
| unchangedReadingStaleObservations | Số poll mà mẫu mới nhất không đổi quá ngưỡng quan sát; đồng hồ bắt đầu từ khi công cụ thấy mẫu đó |
| sensorDisconnectedObservations / sensorUnknownObservations | Tách cờ false với trường chưa có; không suy null thành cảm biến đã hỏng |
| uptimeAvailableReadings / observedUptimeDecreases | Số mẫu mới có uptime và các lần uptime giảm; chỉ nói “không quan sát thấy giảm” nếu đã có dữ liệu uptime |
| offlineThenRecoveryObserved | Chỉ true khi cùng chu kỳ marker có cả OFFLINE và ACTIVE kèm reading mới |
| resetCommands.results | Kết quả từng lệnh, gồm cả REJECTED/TIMEOUT/lỗi; không chỉ chọn các lần thành công |

Mẫu nhận xét, chỉ điền số lấy từ phiên thực tế:

> Trong phiên quan sát ___ phút, công cụ đọc backend mỗi ___ ms và thấy ___ reading khác nhau. Có ___ lần poll lỗi; có/không quan sát dữ liệu không đổi quá ___ ms. Uptime được cung cấp trong ___ reading; quan sát ___ lần giảm cần đối chiếu Serial. Sau marker ngắt/khôi phục, lần đầu thấy OFFLINE/ACTIVE có dữ liệu mới sau ___/___ ms. Thời gian có sai số do thao tác và polling. Kết quả này không đo tỷ lệ mất bản tin hoặc độ trễ cảm biến đến dashboard.

Để đưa vào báo cáo, chọn summary/bảng đã rà quyền riêng tư và kèm ảnh/video cùng phiên. Giữ raw ở local để đối chiếu; không đẩy cả thư mục `.local` lên GitHub. Không thay các ô trống bằng số dự kiến hoặc số lấy từ bài kiểm thử emulator.

## 5. Kiểm công cụ đo

```powershell
node --test tests/manual/measure-demo.test.cjs
```

Bộ test kiểm tính toán/dedup/stale/marker, privacy projection, timeout, theo dõi đúng cmd_id và refresh token dùng chung cho các request đồng thời. Test dùng fixture và HTTP server cục bộ, không gửi lệnh vào thiết bị thật và không tạo bằng chứng nghiệm thu phần cứng.
