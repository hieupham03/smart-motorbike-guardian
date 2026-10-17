# BÁO CÁO ĐỒ ÁN KẾT THÚC HỌC PHẦN
## Học phần: IoT và Ứng dụng

---

# 1. TRANG BÌA

**Tên đề tài (Tiếng Việt):** Hệ thống IoT giám sát và bảo vệ xe máy đa node
**Tên đề tài (Tiếng Anh):** Motorbike Guardian: A Multi-Node Embedded IoT System for Vehicle Security and Driving Behavior Monitoring
**Học phần:** IoT và ứng dụng
**Nhóm thực hiện:** [Điền tên nhóm]
**Thời gian thực hiện:** 03/09/2026 – 24/11/2026
**GitHub Repository:** [Điền link repo, ví dụ: https://github.com/[ten-nhom]/motorbike-guardian]

---

# 2. THÔNG TIN NHÓM VÀ BẢNG PHÂN CÔNG CÔNG VIỆC

## 2.1 Thông tin thành viên (4 người)

| STT | Họ tên | MSSV | Vai trò | Tài khoản GitHub |
|---|---|---|---|---|
| 1 | [Bạn] | [MSSV] | Embedded Lead | [username] |
| 2 | [Thành viên 2] | [MSSV] | Backend Lead | [username] |
| 3 | [Thành viên 3] | [MSSV] | Frontend/Dashboard Lead | [username] |
| 4 | [Thành viên 4] | [MSSV] | Security/QA/DevOps Lead | [username] |

## 2.2 Bảng phân công chi tiết theo hạng mục

| Hạng mục | Người phụ trách chính | Người hỗ trợ | Sản phẩm bàn giao |
|---|---|---|---|
| Firmware Sensor Node & Gateway Node (mọi tier) | Embedded Lead | — | `firmware/` |
| Thiết kế giao thức UART nội bộ (khung gói tin, checksum) | Embedded Lead | — | `firmware/`, `docs/` |
| Lắp ráp testbed vật lý | Embedded Lead | Security/QA Lead | `hardware/` |
| Backend API (auth, RBAC, quản lý thiết bị, command service) | Backend Lead | — | `backend/` |
| Cơ sở dữ liệu, ERD, migration | Backend Lead | — | `database/` |
| MQTT Subscriber Service, xử lý telemetry | Backend Lead | Security/QA Lead | `backend/` |
| Dashboard/Frontend (toàn bộ màn hình chức năng) | Frontend Lead | Backend Lead (tích hợp API) | `frontend/` |
| MQTT Broker (cấu hình TLS, ACL) | Security/QA Lead | Backend Lead | `deployment/` |
| Kế hoạch & thực thi kiểm thử chức năng + bảo mật + phi chức năng (độc lập với người code) | Security/QA Lead | — | `tests/` |
| Docker Compose, triển khai, CI cơ bản | Security/QA Lead | Backend Lead | `deployment/` |
| Báo cáo, slide, video demo | Cả nhóm, tổng hợp bởi Frontend Lead | — | `docs/` |

**Nguyên tắc phân công:** mỗi thành viên chịu trách nhiệm chính một tầng kiến trúc riêng biệt (Embedded / Backend / Frontend / Security-QA-DevOps), có ranh giới giao tiếp rõ ràng qua hợp đồng đã thống nhất trước (giao thức UART nội bộ, MQTT topic schema, REST API spec — xem mục 9, 10), cho phép làm việc song song từ tuần đầu tiên. Việc tách riêng **Security/QA/DevOps** thành một vai trò độc lập (thay vì gộp vào Backend như bản 3 người trước đây) giúp có người kiểm thử **độc lập với người viết code**, đúng tinh thần kiểm thử khách quan, và giảm tải cho Backend Lead vì khối lượng công việc bảo mật/hạ tầng theo yêu cầu đề bài là đáng kể.

## 2.3 Mốc thời gian dự án (theo lịch học phần)

| Mốc | Ngày | Nội dung |
|---|---|---|
| Bắt đầu | 03/09/2026 | Đăng ký đề tài, khởi động |
| Kiểm tra giữa kỳ | 28/10 hoặc 04/11/2026 | Chốt Tier 1 (đa node qua UART), demo luồng dữ liệu cơ bản |
| Thuyết trình | 04/11, 11/11 hoặc 18/11/2026 | Trình bày thiết kế và tiến độ |
| Hạn nộp báo cáo + source code | 24/11/2026 | Nộp GitHub + báo cáo hoàn chỉnh |
| Demo và vấn đáp | 25/11 hoặc 02/12/2026 | Demo trực tiếp + bảo vệ |

## 2.4 Deadline chi tiết theo tuần cho từng thành viên (03/09 – 24/11/2026, 12 tuần)

**Nguyên tắc lịch:** deadline nội bộ luôn đặt sớm hơn mốc chính thức của học phần ít nhất 3-4 ngày, để có thời gian tích hợp và xử lý phát sinh trước khi báo cáo/demo thật.

| Tuần | Ngày bắt đầu | Embedded Lead (bạn) | Backend Lead | Frontend Lead | Security/QA/DevOps Lead |
|---|---|---|---|---|---|
| 1 | 03/09 | Chọn/đặt mua linh kiện (mục 8.1); dựng sơ đồ chân (mục 8.3); test đọc thô từng cảm biến (Hall, MPU6050, ADC) bằng code mẫu, chưa FreeRTOS | Khởi tạo repo backend, chọn framework, thiết kế sơ bộ ERD (mục 10.1) | Khởi tạo repo frontend, dựng khung UI (routing, layout), chưa nối API | Khởi tạo `docker-compose.yml` khung; cài đặt Mosquitto local, test publish/subscribe thủ công |
| 2 | 10/09 | Lắp ráp testbed vật lý hoàn chỉnh (motor+Hall, MPU6050, nguồn DC, relay); code đọc đồng thời tất cả cảm biến ổn định | Viết migration DB (User, Device, Ownership); dựng API `auth/register`, `auth/login` (JWT cơ bản, chưa RBAC) | Màn hình Đăng nhập/Đăng ký (UI, chưa nối API thật) | Viết file cấu hình ACL Mosquitto mẫu (chưa gắn TLS); nghiên cứu thư viện test bảo mật sẽ dùng |
| 3 | 17/09 | Chuyển sang FreeRTOS trên 1 ESP32 (SensorTask/ProcessingTask/SafetyTask cơ bản, chưa UART 2 node) | RBAC middleware; API `/devices` (CRUD cơ bản, chưa lifecycle đầy đủ) | Nối màn hình Đăng nhập/Đăng ký với API thật của Backend Lead | TLS cho Mosquitto; script test S-03 (token không hợp lệ) chạy thử tay |
| 4 | 24/09 | **Chốt Tier 0**: 1 ESP32 chạy đầy đủ state machine an toàn + gửi MQTT; test toàn bộ F-05, S-07 (ràng buộc tốc độ=0) | Command Service (cmd_id, lưu PENDING); MQTT Subscriber Service ghi telemetry vào DB | Màn hình danh sách thiết bị + chi tiết thiết bị (dữ liệu giả/mock trước) | Thiết lập InfluxDB + PostgreSQL qua Docker Compose; viết `.env.example` |
| 5 | 01/10 | Thiết kế giao thức khung UART (mục 9.1); bắt đầu tách Sensor Node/Gateway Node | Device Lifecycle Service (state machine mục 11.1); API onboarding | Màn hình dashboard real-time (nối WebSocket/polling với dữ liệu thật từ Tier 0) | Viết test case F-01 đến F-04 thành script tự động (không test tay nữa) |
| 6 | 08/10 | Hoàn thiện giao tiếp UART 2 node ổn định, có xử lý lỗi checksum/timeout (mục 9.1) | Alert Service (acknowledge/resolve); Audit Log Service | Màn hình cảnh báo (danh sách, acknowledge/resolve) | Test case bảo mật S-01, S-02, S-04, S-05, S-06 |
| 7 | 15/10 | **Chốt Tier 1** — buffer trước kiểm tra giữa kỳ; sửa lỗi phát sinh khi tích hợp với Backend | Hoàn thiện toàn bộ API còn thiếu (mục 10.2); tích hợp step-up confirmation | Màn hình cấu hình thiết bị + lịch sử lệnh | Chạy full bộ test bảo mật (7 case); ghi nhận kết quả |
| **—** | **~28/10 hoặc 04/11** | **KIỂM TRA GIỮA KỲ — demo Tier 1 hoạt động đầy đủ luồng dữ liệu cơ bản** ||||
| 8 | 22/10 | Bắt đầu Tier mở rộng (STM32 hoặc GPS/Edge AI) tuỳ tiến độ thực tế | Revoke/Decommission API (mục 11.5); ghi audit log đầy đủ mọi thao tác | Màn hình quản lý người dùng theo quyền (mời Viewer, quản lý Admin) | Đo NFR-01, NFR-02 (độ trễ); bắt đầu chạy test ổn định 24h liên tục |
| 9 | 29/10 | Tiếp tục Tier mở rộng; hỗ trợ tích hợp nếu Backend/Frontend cần dữ liệu thật | Tối ưu truy vấn, export CSV; sửa lỗi phát hiện từ test của Security Lead | Hoàn thiện toàn bộ 9 màn hình theo mục 9.10/10.2; polish UI | Đo NFR-03 đến NFR-06; viết báo cáo kết quả đo (mục 15.3) |
| 10 | 05/11 | Chốt phần cứng/firmware cuối cùng, không thêm tính năng mới, chỉ sửa lỗi | Chốt backend, không thêm tính năng mới, chỉ sửa lỗi | Chốt frontend; quay video demo nháp lần 1 | Chạy lại toàn bộ test case (functional + security + NFR) trên bản chốt |
| 11 | 12/11 | Viết phần Embedded trong báo cáo (mục 8, 9.1); chuẩn bị phần vấn đáp cá nhân | Viết phần Backend trong báo cáo (mục 10, 11); chuẩn bị vấn đáp | Tổng hợp toàn bộ báo cáo 20 mục; làm slide; quay video demo chính thức | Viết phần Bảo mật/Kiểm thử trong báo cáo (mục 13, 15); chuẩn bị vấn đáp |
| 12 | 19/11 | Buffer chung cả nhóm: rà soát checklist mục 20.4, tổng duyệt demo, tạo tag `v1.0.0` ||||
| — | **24/11** | **NỘP BÁO CÁO + SOURCE CODE (GitHub)** ||||
| — | **25/11 hoặc 02/12** | **DEMO VÀ VẤN ĐÁP** ||||

---

# 3. TÓM TẮT ĐỒ ÁN

Đồ án xây dựng một nguyên mẫu hệ thống IoT hoàn chỉnh giám sát và bảo vệ xe máy, tích hợp đầy đủ các lớp theo yêu cầu học phần: thiết bị vật lý đa cảm biến gồm Sensor Node và Gateway Node giao tiếp qua UART với giao thức khung gói tin tự thiết kế, kết nối MQTT có bảo mật (TLS, ACL theo thiết bị) lên backend, backend quản lý vòng đời thiết bị và người dùng theo mô hình phân quyền ba vai trò (Admin/Owner/Viewer), cơ sở dữ liệu lưu trữ telemetry theo thời gian và lịch sử thao tác, dashboard web hiển thị trạng thái thời gian thực và hỗ trợ điều khiển, cùng cơ chế xác thực, phân quyền, audit log và các biện pháp bảo mật cơ bản theo chuẩn OWASP API Security.

Hệ thống giải quyết bài toán thật: xe máy đỗ nơi không có người giám sát dễ bị trộm cắp hoặc gặp sự cố (va chạm, ngã xe) mà chủ xe không được biết kịp thời. Giải pháp phát hiện hành vi bất thường qua cảm biến gia tốc/tốc độ, cảnh báo tức thời hai chiều qua IoT, và cho phép khoá động cơ từ xa với ràng buộc an toàn cứng (chỉ khoá khi xe đã dừng hẳn). Toàn bộ hệ thống được kiểm chứng trên một testbed vật lý mô phỏng tín hiệu xe máy bằng phần cứng thật (động cơ DC, cảm biến Hall, IMU), không cần lắp đặt lên xe máy thật, loại bỏ rủi ro an toàn khi thử nghiệm trên phương tiện đang vận hành.

---

# 4. GIỚI THIỆU BÀI TOÁN

## 4.1 Bối cảnh

Việt Nam có mật độ xe máy cao nhất khu vực; tại các đô thị lớn, xe máy thường được để tại các khu vực không có người trông giữ liên tục (vỉa hè, sân chung cư, bãi gửi tự phát). Trộm cắp xe máy là loại tội phạm phổ biến, và các sự cố như va chạm/ngã xe khi không có người xung quanh (ví dụ người thân lớn tuổi hoặc trẻ mới lái) thường không được ghi nhận hoặc thông báo kịp thời cho gia đình.

## 4.2 Vấn đề cần giải quyết

- Chủ xe không được cảnh báo khi xe bị di chuyển/trộm cắp trong lúc họ không có mặt
- Không có cách giám sát từ xa hành vi sử dụng xe (tốc độ, sự kiện bất thường)
- Các giải pháp hiện có (khoá cơ học, định vị GPS đơn thuần) không có khả năng phát hiện hành vi bất thường hay can thiệp từ xa có kiểm soát

## 4.3 Đối tượng sử dụng và các bên liên quan

| Bên liên quan | Vai trò trong hệ thống |
|---|---|
| Chủ xe cá nhân | Owner — sở hữu, cấu hình, điều khiển thiết bị của mình |
| Người thân được uỷ quyền theo dõi (phụ huynh, người giám hộ) | Viewer — chỉ xem trạng thái/cảnh báo, không có quyền điều khiển |
| Quản trị hệ thống (nhóm vận hành/nhà cung cấp dịch vụ) | Admin — quản lý toàn bộ tài khoản và thiết bị trong hệ thống |

## 4.4 Mục tiêu hệ thống

1. Phát hiện sớm hành vi trộm cắp/va chạm thông qua giám sát đa cảm biến thời gian thực
2. Cảnh báo tức thời tới chủ xe qua kênh IoT hai chiều, kể cả khi họ không có mặt tại chỗ
3. Cho phép can thiệp từ xa (khoá động cơ) với ràng buộc an toàn được kiểm chứng nghiêm ngặt
4. Cung cấp hệ thống quản lý người dùng, thiết bị, dữ liệu và bảo mật đạt chuẩn theo yêu cầu học phần

## 4.5 Phạm vi triển khai

Nguyên mẫu triển khai trên testbed vật lý mô phỏng (không lắp đặt lên xe máy thật), quy mô 1–3 "xe" thiết bị tuỳ tiến độ, hệ thống backend/dashboard vận hành trên một server duy nhất (không triển khai multi-region), giao tiếp nội bộ giữa các node dùng UART với giao thức tự thiết kế (không triển khai chuẩn công nghiệp CAN/UDS).

## 4.6 Vì sao bài toán này cần giải pháp IoT, không chỉ một ứng dụng quản lý thông thường

Một ứng dụng quản lý/web thông thường yêu cầu người dùng chủ động nhập liệu hoặc kiểm tra thủ công. Bài toán ở đây có ba đặc điểm bắt buộc cần IoT:

1. **Cần dữ liệu thời gian thực từ hiện trường vật lý** (tốc độ, gia tốc) mà không có cách nào con người tự đo và nhập liệu liên tục
2. **Cần cảnh báo chủ động, đẩy (push) tới người dùng ngay khi sự kiện xảy ra**, không phải chờ người dùng vào ứng dụng kiểm tra (pull) — đây là lý do chọn kiến trúc publish/subscribe (MQTT) thay vì chỉ REST API
3. **Cần khả năng điều khiển ngược lại thiết bị vật lý từ xa** (khoá động cơ) — một ứng dụng phần mềm thuần tuý không có kênh nào để tác động lên thế giới vật lý

Nếu bỏ IoT, hệ thống chỉ còn là báo động tại chỗ (giống chuông báo trộm thông thường), mất hoàn toàn khả năng cảnh báo khi chủ xe không có mặt — đây chính là giá trị cốt lõi mà đề tài hướng tới.

---

# 5. KHẢO SÁT YÊU CẦU

## 5.1 Kịch bản sử dụng chính (Use Cases)

| Mã | Kịch bản | Tác nhân |
|---|---|---|
| UC-01 | Đăng ký tài khoản và đăng nhập | Owner, Viewer, Admin |
| UC-02 | Đăng ký/kích hoạt thiết bị mới (onboarding) | Owner |
| UC-03 | Xem trạng thái và dữ liệu telemetry thời gian thực | Owner, Viewer |
| UC-04 | Kích hoạt/tắt chế độ canh giữ (Arm/Disarm) | Owner |
| UC-05 | Nhận cảnh báo khi phát hiện trộm/va chạm | Owner, Viewer |
| UC-06 | Xác nhận/xử lý cảnh báo | Owner |
| UC-07 | Gửi lệnh khoá động cơ khẩn cấp | Owner |
| UC-08 | Xem lịch sử dữ liệu và lịch sử lệnh | Owner, Viewer |
| UC-09 | Mời/quản lý người dùng khác truy cập thiết bị của mình | Owner |
| UC-10 | Quản lý toàn bộ tài khoản và thiết bị trong hệ thống | Admin |
| UC-11 | Khoá/thu hồi quyền kết nối của một thiết bị | Owner, Admin |
| UC-12 | Ngừng sử dụng (decommission) thiết bị | Owner, Admin |

*(Sơ đồ use case dạng hình vẽ — xem mục 20 Phụ lục để vẽ bằng công cụ UML dựa trên bảng trên)*

## 5.2 Yêu cầu chức năng (Functional Requirements)

| Mã | Yêu cầu |
|---|---|
| FR-01 | Hệ thống phải thu thập dữ liệu tốc độ, gia tốc, điện áp ắc quy từ thiết bị theo thời gian thực |
| FR-02 | Hệ thống phải phát hiện sự kiện bất thường (chuyển động khi đã ARMED, va chạm) và sinh cảnh báo trong vòng 1 giây kể từ khi sự kiện xảy ra tại thiết bị |
| FR-03 | Hệ thống phải cho phép Owner gửi lệnh điều khiển (arm/disarm/khoá) và nhận xác nhận thực thi từ thiết bị |
| FR-04 | Hệ thống phải từ chối lệnh khoá động cơ nếu tốc độ thiết bị đang khác 0 |
| FR-05 | Hệ thống phải phân quyền truy cập theo vai trò (Admin/Owner/Viewer) |
| FR-06 | Hệ thống phải lưu lịch sử telemetry, lịch sử lệnh, và lịch sử cảnh báo có thể tra cứu theo thiết bị và khoảng thời gian |
| FR-07 | Hệ thống phải phát hiện và hiển thị trạng thái online/offline của thiết bị |
| FR-08 | Hệ thống phải cho phép Admin/Owner thu hồi (revoke) quyền kết nối của một thiết bị |
| FR-09 | Hệ thống phải quản lý toàn bộ vòng đời thiết bị theo các trạng thái quy định (mục 11) |

## 5.3 Yêu cầu phi chức năng (Non-Functional Requirements)

| Mã | Yêu cầu | Chỉ tiêu mục tiêu |
|---|---|---|
| NFR-01 | Độ trễ từ cảm biến đến dashboard | < 2 giây trong điều kiện mạng bình thường |
| NFR-02 | Độ trễ lệnh điều khiển (từ lúc gửi đến khi có ACK) | < 1.5 giây |
| NFR-03 | Độ trễ phát hiện & phản ứng an toàn (ràng buộc khoá động cơ) | < 500 mili-giây, xử lý cục bộ tại Gateway, không phụ thuộc mạng |
| NFR-04 | Tỷ lệ mất bản tin telemetry (điều kiện mạng ổn định) | < 1% |
| NFR-05 | Khả năng phục hồi sau mất mạng | Thiết bị tự kết nối lại trong vòng 30 giây sau khi mạng khôi phục, không mất dữ liệu cảnh báo quan trọng (lưu cục bộ khi mất mạng) |
| NFR-06 | Độ tin cậy của lệnh điều khiển | Có cơ chế xác nhận (ACK) và retry, không xử lý lệnh trùng lặp |
| NFR-07 | Bảo mật | Toàn bộ kết nối MQTT dùng TLS; API dùng HTTPS; mật khẩu băm bcrypt/argon2 |
| NFR-08 | Chi phí | Tổng chi phí phần cứng testbed dưới 700.000 VNĐ |
| NFR-09 | Năng lượng | Không bắt buộc tối ưu năng lượng ở MVP (thiết bị dùng nguồn ngoài trong testbed), ghi nhận là hướng phát triển |
| NFR-10 | Khả năng mở rộng | Kiến trúc phải cho phép thêm thiết bị mới mà không sửa đổi schema cơ sở dữ liệu hoặc logic backend hiện có |

## 5.4 Ràng buộc

| Loại | Nội dung |
|---|---|
| Chi phí | Ngân sách sinh viên, ưu tiên linh kiện phổ biến tại Việt Nam |
| Thiết bị | ESP32 (và STM32 tuỳ chọn ở tier mở rộng), không dùng Raspberry Pi |
| Mạng | Wi-Fi cho kết nối thiết bị–backend; UART cho kết nối nội bộ giữa các node |
| Độ trễ | Xem NFR-01 đến NFR-03 |
| Độ tin cậy | Logic an toàn (khoá động cơ) phải hoạt động độc lập với tình trạng kết nối mạng |
| An toàn | Không đấu nối vào hệ thống điện xe máy thật; mọi tín hiệu được mô phỏng bằng testbed an toàn |
| Quyền riêng tư | Dữ liệu vị trí (nếu triển khai GPS) là dữ liệu cá nhân, chỉ Owner và người được Owner cấp quyền mới truy cập được |

## 5.5 Tiêu chí đánh giá mức độ thành công

| Tiêu chí | Ngưỡng đạt |
|---|---|
| Luồng dữ liệu đầu cuối | Demo được từ thay đổi vật lý trên testbed đến hiển thị trên dashboard trong thời gian thực |
| Phát hiện & cảnh báo | Phát hiện đúng ≥ 90% các kịch bản trộm/va chạm giả lập trong test |
| Ràng buộc an toàn | 100% các lần thử khoá động cơ khi tốc độ ≠ 0 đều bị từ chối (không có ngoại lệ) |
| Bảo mật | Vượt qua toàn bộ test case bảo mật đã thiết kế (mục 15) |
| Hoàn thiện backend | Đầy đủ 5 nhóm chức năng backend theo yêu cầu đề bài (quản lý người dùng, vòng đời thiết bị, dữ liệu, giám sát/cảnh báo, điều khiển) |

---

# 6. PHÂN TÍCH VÀ LỰA CHỌN GIẢI PHÁP

## 6.1 So sánh các hướng đề tài đã cân nhắc

Nhóm đã khảo sát nhiều hướng đề tài (giám sát bảo quản lạnh, giám sát tải điện gia dụng, giám sát va đập vận chuyển hàng hoá, giám sát an toàn sạc pin, hệ thống cập nhật firmware từ xa) theo bộ tiêu chí: tính thực tế, chiều sâu IoT, chiều sâu Embedded, khả năng dùng FreeRTOS một cách tự nhiên, độ đơn giản của mô hình thử nghiệm, chi phí, và khả năng hoàn thành đúng tiến độ. Motorbike Guardian đạt điểm cân bằng tốt nhất, đồng thời cho phép nhóm áp dụng kỹ năng embedded liên quan định hướng nghề nghiệp của thành viên phụ trách Embedded.

## 6.2 Lựa chọn kiến trúc giao tiếp nội bộ giữa các node

**Vấn đề cần giải quyết:** cần một kiến trúc truyền thông giữa Sensor Node và Gateway Node.

**Các phương án đã cân nhắc:**

| Phương án | Ưu điểm | Nhược điểm | Quyết định |
|---|---|---|---|
| CAN bus (TWAI) | Mô phỏng đúng kiến trúc mạng đa ECU của ô tô thật | Cần thêm CAN transceiver, terminator; độ phức tạp và rủi ro debug cao, không tương xứng với lợi ích cho phạm vi môn học này | Không chọn — cân nhắc lại và loại bỏ để giảm rủi ro tiến độ, dồn thời gian cho phần backend/bảo mật đang chiếm trọng số lớn hơn trong tiêu chí chấm điểm |
| ESP-NOW (không dây, giao thức riêng của Espressif) | Không cần dây nối vật lý, độ trễ thấp | Là giao thức đóng, phần lớn xử lý tầng thấp do thư viện đảm nhiệm, ít thể hiện kỹ năng tự thiết kế giao thức | Không chọn — nhóm ưu tiên thể hiện kỹ năng embedded thuần (tự thiết kế khung gói tin) hơn là dùng thư viện có sẵn |
| **UART với giao thức khung gói tin tự thiết kế** | Đơn giản, không cần linh kiện phụ trợ (transceiver/terminator), cho phép nhóm tự thiết kế đầy đủ: cấu trúc khung, checksum, xử lý mất đồng bộ — đúng kỹ năng embedded cấp thấp | Cần dây nối vật lý giữa 2 board (không ảnh hưởng vì cả hai đặt trên cùng một testbed cố định) | **Chọn** |

**Chiến lược triển khai theo Tier** vẫn được áp dụng để giảm rủi ro: hệ thống luôn có một phiên bản hoạt động hoàn chỉnh ở mỗi giai đoạn (chi tiết mục 16.1).

## 6.3 Lựa chọn giao thức IoT: MQTT

| Phương án | Lý do không chọn / chọn |
|---|---|
| HTTP polling | Độ trễ cảnh báo phụ thuộc chu kỳ hỏi, không phù hợp yêu cầu cảnh báo tức thời (NFR-01, NFR-02) |
| CoAP | Phù hợp mạng cực kỳ hạn chế (LPWAN); không cần thiết vì thiết bị dùng Wi-Fi ổn định |
| **MQTT (chọn)** | Kiến trúc publish/subscribe cho phép đẩy lệnh và cảnh báo tức thời hai chiều; hỗ trợ QoS đảm bảo độ tin cậy; có Last Will and Testament để phát hiện offline; payload nhẹ phù hợp tài nguyên MCU |

HTTP/REST được dùng riêng cho giao tiếp Frontend ↔ Backend (đúng khuyến nghị đề bài), không dùng cho giao tiếp Thiết bị ↔ Backend.

## 6.4 Lựa chọn nền tảng phần cứng: ESP32 (mở rộng STM32)

ESP32 được chọn vì có sẵn Wi-Fi tích hợp, hệ sinh thái FreeRTOS/ESP-IDF trưởng thành, chi phí thấp, phù hợp năng lực đội nhóm. STM32 được cân nhắc bổ sung ở tier mở rộng cho Sensor Node (giao tiếp với Gateway vẫn qua UART, không phụ thuộc CAN) để nhóm áp dụng kỹ năng STM32 đang học, phù hợp định hướng học tập của thành viên phụ trách Embedded.

---

# 7. KIẾN TRÚC HỆ THỐNG

## 7.1 Sơ đồ bối cảnh hệ thống (System Context)

```
                    ┌─────────────────────────────────┐
                    │         NGƯỜI DÙNG                │
                    │  (Owner / Viewer / Admin)          │
                    └───────────────┬─────────────────┘
                                    │ HTTPS (Web/App)
                                    ▼
                    ┌─────────────────────────────────┐
                    │      MOTORBIKE GUARDIAN SYSTEM     │
                    │  (Backend + Dashboard + Broker)    │
                    └───────────────┬─────────────────┘
                                    │ MQTT/TLS
                                    ▼
                    ┌─────────────────────────────────┐
                    │  THIẾT BỊ (Sensor Node + Gateway)   │
                    │      gắn testbed mô phỏng xe          │
                    └─────────────────────────────────┘
```
*(Vẽ lại bằng công cụ diagram — xem hướng dẫn Phụ lục mục 20)*

## 7.2 Sơ đồ kiến trúc tổng thể (đầy đủ các lớp)

```
[LỚP THIẾT BỊ — DEVICE LAYER]
Testbed vật lý (motor+Hall, MPU6050, nguồn DC, relay)
        │
        ▼
Sensor Node (ESP32, mở rộng STM32) — FreeRTOS
        │  UART (giao thức khung gói tin tự thiết kế, 115200 baud)
        ▼
Gateway Node (ESP32) — FreeRTOS, SafetyTask, state machine an toàn
        │
[LỚP KẾT NỐI — CONNECTIVITY LAYER]
        │  MQTT/TLS (mTLS hoặc user/pass riêng từng thiết bị)
        ▼
MQTT Broker (Mosquitto, ACL theo device_id)
        │
[LỚP EDGE/GATEWAY - đã tích hợp trong Gateway Node ở trên]
        │
[LỚP BACKEND]
        ▼
MQTT Subscriber Service ──► Message Validator ──► Time-series DB (telemetry)
        │                                     └──► Relational DB (user, device, command, alert, audit log)
        ▼
Backend REST API (Node.js/Express hoặc Python/FastAPI)
├── Auth Service (JWT)
├── RBAC Middleware
├── Device Lifecycle Service
├── Command Service (gửi lệnh + theo dõi ACK)
├── Alert Service
└── Audit Log Service
        │
[LỚP ỨNG DỤNG — APPLICATION LAYER]
        ▼
Frontend Web Dashboard (React) — HTTPS + JWT, KHÔNG kết nối MQTT trực tiếp
```

## 7.3 Nguyên tắc kiến trúc cốt lõi

**Kiến trúc trung gian (mediated architecture):** Frontend không bao giờ cầm credential MQTT hay publish trực tiếp lên broker. Mọi thao tác của người dùng đi qua Backend API — nơi duy nhất kiểm tra danh tính và quyền hạn trước khi chuyển lệnh xuống thiết bị qua MQTT bằng credential riêng của backend.

**Tách biệt an toàn khỏi kết nối:** `SafetyTask` tại Gateway Node hoạt động độc lập hoàn toàn với trạng thái mạng — quyết định khoá động cơ luôn được xử lý cục bộ, không chờ phản hồi từ cloud.

## 7.4 Sơ đồ triển khai (Deployment Diagram)

```
┌─────────────────────┐     ┌──────────────────────────────────┐
│   Testbed vật lý     │     │        Server (VPS/laptop)          │
│  ┌────────────────┐  │     │  ┌────────────┐  ┌──────────────┐ │
│  │  Sensor Node    │  │UART │  │  Mosquitto  │  │  Backend API   │ │
│  │  (ESP32/STM32)  │──┼─────┤  │  Broker     │──│  (Docker)      │ │
│  └────────────────┘  │     │  └────────────┘  └───────┬──────┘ │
│  ┌────────────────┐  │ WiFi│                          │        │
│  │  Gateway Node   │──┼─────┤                  ┌───────▼──────┐ │
│  │  (ESP32)        │  │     │                  │  PostgreSQL/  │ │
│  └────────────────┘  │     │                  │  InfluxDB      │ │
└─────────────────────┘     │                  └──────────────┘ │
                              │  ┌────────────────────────────┐  │
                              │  │  Frontend (React, Nginx)     │  │
                              │  └────────────────────────────┘  │
                              └──────────────────────────────────┘
                                            ▲
                                            │ HTTPS
                                    Trình duyệt người dùng
```

---

# 8. THIẾT KẾ PHẦN CỨNG

## 8.1 Danh sách linh kiện chi tiết (thông số, số lượng, vai trò)

| # | Linh kiện | Thông số kỹ thuật | Số lượng | Vai trò | Ghi chú lựa chọn |
|---|---|---|---|---|---|
| 1 | ESP32-WROOM-32 DevKit (30 hoặc 38 chân) | Dual-core Xtensa LX6, 240MHz, 520KB SRAM, Wi-Fi 802.11 b/g/n, Bluetooth 4.2, 4MB Flash | 2 | Sensor Node + Gateway Node | Chọn bản DevKit tích hợp sẵn cổng USB-UART (CP2102/CH340) để nạp code trực tiếp, không cần mạch nạp rời |
| 2 | STM32F103C8T6 "Blue Pill" | ARM Cortex-M3, 72MHz, 20KB SRAM, 64KB Flash, 2× USART | 1 (tuỳ chọn, Tier mở rộng) | Thay thế Sensor Node ở Tier 2 | Cần thêm mạch nạp ST-Link V2 (~50.000đ) nếu board không có sẵn bootloader USB |
| 3 | Cảm biến Hall Effect (loại digital, ví dụ A3144 hoặc module KY-003) | Ngưỡng kích hoạt digital, hoạt động 4.5–24V | 1 | Đọc xung tốc độ khi đĩa nam châm quay qua | Chọn loại digital (on/off) thay vì analog để đơn giản hoá xử lý ngắt (interrupt), không cần ADC |
| 4 | Nam châm nhỏ (neodymium, ⌀5mm) | — | 1–2 | Gắn lên đĩa/bánh motor để kích hoạt cảm biến Hall mỗi vòng quay | Gắn lệch tâm trên đĩa nhựa/mica cắt tròn gắn vào trục motor |
| 5 | Module cảm biến gia tốc MPU6050 (GY-521) | 3-axis accelerometer + 3-axis gyroscope, I2C, ±2g đến ±16g | 1 | Mô phỏng gia tốc/va chạm/ngã xe | Module GY-521 đã tích hợp sẵn LDO 3.3V, dùng trực tiếp với ESP32 5V/3.3V |
| 6 | Motor giảm tốc DC 6-12V (loại có trục ra, kèm bánh xe/đĩa nhỏ) | 6-12V DC, tốc độ ~100-200 RPM sau hộp số | 1 | Mô phỏng chuyển động bánh xe | Loại có hộp số giảm tốc để tốc độ vòng quay ở mức dễ đo bằng cảm biến Hall (không quá nhanh) |
| 7 | Module nguồn giảm áp LM2596 (có núm vặn chỉnh áp) | Ngõ vào 4-40V, ngõ ra 1.25-37V điều chỉnh được, dòng tối đa 3A | 1 | Mô phỏng điện áp ắc quy có thể "yếu dần" | Núm vặn cho phép demo trực quan việc giảm áp mà không cần thêm mạch |
| 8 | Relay module 5V, 1 kênh (loại có opto-cách ly) | Điện áp điều khiển 5V, tiếp điểm chịu tải đến 10A/250VAC hoặc 10A/30VDC | 1 | Cắt nguồn cấp cho motor DC (cơ cấu chấp hành chính) | Chọn loại có opto-cách ly để bảo vệ ESP32 khỏi nhiễu/dòng ngược từ cuộn dây relay |
| 9 | Module GPS NEO-6M (kèm ăng-ten) | Giao tiếp UART, độ chính xác định vị ~2.5m, thời gian bắt tín hiệu nguội <35s | 1 (tuỳ chọn, Tier mở rộng) | Định vị vị trí | Chỉ cần thiết nếu triển khai Tier mở rộng; test được ngoài trời/gần cửa sổ |
| 10 | Buzzer 5V (loại active, có mạch dao động tích hợp) | 5V, tần số cố định ~2-4kHz | 1 | Cảnh báo âm thanh tại chỗ | Loại active để điều khiển trực tiếp bằng digital HIGH/LOW, không cần tạo tần số PWM |
| 11 | LED đơn (đỏ/xanh) + điện trở hạn dòng 220Ω | 5mm, 20mA | 2-3 | Đèn báo trạng thái (PARKED/ARMED/ALARM) | — |
| 12 | Breadboard cỡ lớn (830 lỗ) | — | 2 | Lắp mạch thử nghiệm trước khi hàn cố định | 1 cho Sensor Node, 1 cho Gateway Node |
| 13 | Dây jumper đực-đực, đực-cái, cái-cái (bộ 40 sợi mỗi loại) | — | 3 bộ | Kết nối linh kiện, kết nối UART giữa 2 node | — |
| 14 | Điện trở các loại (220Ω, 1kΩ, 4.7kΩ, 10kΩ) | 1/4W | ~20 (bộ) | Hạn dòng LED, pull-up cho Hall sensor nếu cần | — |
| 15 | Khay/đế gỗ hoặc mica (khoảng 30×20cm) | — | 1 | Bệ đỡ cố định toàn bộ testbed | Cố định motor + relay + node để giảm rung/xê dịch khi demo, đảm bảo dữ liệu cảm biến ổn định |
| 16 | Nguồn tổ ong/adapter 12V 2A | — | 1 | Cấp nguồn cho motor + module LM2596 | Tách nguồn riêng cho motor khỏi nguồn cấp ESP32 (qua USB) để tránh sụt áp ảnh hưởng vi điều khiển |
| 17 | Pin 18650 + đế pin (tuỳ chọn) | 3.7V, ~2000-3000mAh | 1-2 | Demo khả năng chạy độc lập không cần nguồn ngoài | Không bắt buộc cho MVP, ghi nhận ở hướng phát triển (mục 17.2, tối ưu năng lượng) |

*Đáp ứng khuyến nghị đề bài: ≥ 2 loại cảm biến (Hall/tốc độ, MPU6050/gia tốc, ADC/điện áp qua LM2596, tuỳ chọn GPS), ≥ 1 cơ cấu chấp hành (relay, buzzer), ≥ 2 node thiết bị (Sensor Node + Gateway Node).*

**Nguồn mua tham khảo:** các linh kiện trên đều là linh kiện phổ thông, có sẵn tại các cửa hàng linh kiện điện tử tại Việt Nam (ví dụ: Hshop, Điện tử Việt Đức, Linh Kiện Số) hoặc sàn thương mại điện tử — nhóm cập nhật link/mã sản phẩm cụ thể và hoá đơn vào thư mục `hardware/` khi đặt mua thực tế.

## 8.2 Sơ đồ khối phần cứng

```
┌───────────────────────────── SENSOR NODE ─────────────────────────────┐
│                                                                        │
│   Motor DC ──(cơ)── Đĩa mã hoá/nam châm ──(từ)──► Cảm biến Hall (GPIO INT)
│                                                                        │
│   Nguồn DC điều chỉnh ──(áp)──► Chia áp ──► ADC (điện áp ắc quy)       │
│                                                                        │
│   MPU6050 ──(I2C: SDA/SCL)──► ESP32/STM32                             │
│                                                                        │
│   ESP32/STM32 ──(UART TX/RX)──────────────► GATEWAY NODE               │
└─────────────────────────────────────────────────────────────────────┘
                                    │ UART (2 dây TX/RX + GND, 115200 baud)
┌───────────────────────────── GATEWAY NODE ─────────────────────────────┐
│                                                                        │
│   UART TX/RX ◄──────────────────────────────► ESP32                   │
│                                                                        │
│   ESP32 ──(GPIO)──► Relay ──► Cắt nguồn Motor DC (cơ cấu chấp hành)    │
│   ESP32 ──(GPIO)──► Buzzer, LED (cảnh báo tại chỗ)                     │
│   ESP32 ──(UART, tuỳ chọn)──► GPS NEO-6M                               │
│   ESP32 ──(Wi-Fi)──► MQTT Broker                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## 8.3 Sơ đồ kết nối cảm biến và cơ cấu chấp hành (chân cụ thể)

| Thiết bị | Chân ESP32 (ví dụ) | Loại kết nối |
|---|---|---|
| Cảm biến Hall | GPIO 4 (interrupt, pull-up) | Digital Input + Interrupt |
| MPU6050 SDA/SCL | GPIO 21 / GPIO 22 | I2C |
| Chia áp đo ắc quy | GPIO 34 (ADC1_CH6) | Analog Input |
| UART TX/RX (Sensor↔Gateway) | GPIO 17 (TX2) / GPIO 16 (RX2) — dùng UART2, để trống UART0 cho debug qua USB | UART |
| Relay điều khiển | GPIO 26 | Digital Output |
| Buzzer | GPIO 27 | Digital Output (PWM nếu cần âm thanh biến điệu) |
| LED trạng thái | GPIO 2 | Digital Output |
| GPS UART | GPIO 33 (RX) / GPIO 32 (TX), UART khác với liên kết nội bộ | UART |

*(Bảng chân cụ thể sẽ được xác nhận lại theo board thực tế sử dụng và cập nhật trong `hardware/` trên GitHub)*

## 8.4 Danh sách linh kiện và hình ảnh prototype

*Yêu cầu bắt buộc nộp trong thư mục `hardware/`: hình ảnh chụp testbed thực tế, danh sách linh kiện đầy đủ kèm mã sản phẩm/nhà cung cấp, và file sơ đồ nối dây (Fritzing hoặc bản vẽ tay chụp ảnh) — nhóm cập nhật sau khi lắp ráp xong Tier 0.*

---

# 9. THIẾT KẾ GIAO THỨC VÀ LUỒNG DỮ LIỆU

## 9.1 Giao thức UART nội bộ (Sensor Node ↔ Gateway Node) — tự thiết kế

Vì đây là phần thể hiện kỹ năng embedded cấp thấp rõ nhất trong toàn đồ án, nhóm tự thiết kế một giao thức khung gói tin (framing protocol) đơn giản trên nền UART, thay vì gửi dữ liệu thô không có cấu trúc.

**Cấu trúc khung (frame):**

| Byte | Tên | Mô tả |
|---|---|---|
| 0 | `START` | Byte bắt đầu khung, cố định `0xAA` |
| 1 | `MSG_TYPE` | Loại bản tin (xem bảng bên dưới) |
| 2 | `LENGTH` | Số byte payload (0–8) |
| 3..(3+LENGTH-1) | `PAYLOAD` | Dữ liệu, cấu trúc tuỳ theo `MSG_TYPE` |
| 3+LENGTH | `CHECKSUM` | XOR toàn bộ byte từ `MSG_TYPE` đến hết `PAYLOAD` |
| 3+LENGTH+1 | `END` | Byte kết thúc khung, cố định `0x55` |

**Bảng loại bản tin (`MSG_TYPE`):**

| Giá trị | Tên | Hướng | Payload |
|---|---|---|---|
| `0x01` | `TELEMETRY` | Sensor → Gateway | tốc độ (2B) + điện áp ắc quy (1B) + cờ trạng thái (1B) |
| `0x02` | `ACCEL_EVENT` | Sensor → Gateway | accel_x/y/z (mỗi 2B) |
| `0x03` | `CMD_RELAY` | Gateway → Sensor | trạng thái relay (1B) |
| `0x04` | `DIAG_REQUEST` | Gateway → Sensor | service_id (1B) |
| `0x05` | `DIAG_RESPONSE` | Sensor → Gateway | service_id + data (≤7B) |
| `0x06` | `HEARTBEAT` | Hai chiều | rỗng |
| `0x07` | `NACK` | Hai chiều | mã lỗi (1B) — gửi khi checksum sai hoặc mất đồng bộ khung |

**Xử lý lỗi (đây là phần thể hiện chiều sâu embedded quan trọng nhất):**
- **Mất đồng bộ khung:** nếu byte nhận được không khớp `START` khi đang chờ khung mới, bộ nhận tiếp tục quét (scan) từng byte cho đến khi tìm thấy `0xAA` tiếp theo, không cố gắng "đoán" dữ liệu
- **Sai checksum:** bộ nhận huỷ khung, gửi `NACK` kèm mã lỗi `CHECKSUM_FAIL`, bên gửi có cơ chế gửi lại tối đa 2 lần trước khi báo lỗi lên tầng trên
- **Timeout:** nếu không nhận được `HEARTBEAT` trong 3 giây liên tục, Gateway coi Sensor Node mất kết nối nội bộ, chuyển trạng thái an toàn (không tự ý ra quyết định khi thiếu dữ liệu tin cậy)
- **Buffer overflow:** giới hạn cứng `LENGTH ≤ 8`, khung có `LENGTH` vượt giới hạn bị huỷ ngay không xử lý tiếp

*Đây là bản giao thức tự thiết kế đơn giản hoá, không phải chuẩn công nghiệp — mục tiêu là minh hoạ đúng nguyên lý framing/error-handling của giao tiếp nối tiếp cấp thấp, một kỹ năng embedded nền tảng.*

## 9.2 Cấu trúc Topic MQTT (Gateway Node ↔ Backend)

Quy ước chung: `guardian/{device_id}/{loại_bản_tin}`, trong đó `device_id` là UUID duy nhất cấp cho từng thiết bị khi onboarding (mục 11).

| Topic | Hướng | QoS | Nội dung |
|---|---|---|---|
| `guardian/{device_id}/telemetry` | Device→Broker | 0 | Tốc độ, điện áp ắc quy, mỗi 2 giây |
| `guardian/{device_id}/event` | Device→Broker | 1 | Chuyển trạng thái (PARKED/ARMED/ALARM/THEFT_LOCK) |
| `guardian/{device_id}/alert` | Device→Broker | 1 | Cảnh báo, kèm nguyên nhân |
| `guardian/{device_id}/gps` | Device→Broker | 0 | Vị trí (Tier mở rộng) |
| `guardian/{device_id}/diag` | Device→Broker | 1 | Kết quả chẩn đoán hệ thống |
| `guardian/{device_id}/heartbeat` | Device→Broker | 0 | Nhịp tim thiết bị, mỗi 15 giây — tách riêng khỏi telemetry để backend phát hiện online/offline độc lập |
| `guardian/{device_id}/status` | Device→Broker | 1, retain=true | online/offline, publish qua Last Will and Testament khi mất kết nối đột ngột |
| `guardian/{device_id}/cmd/{cmd_type}` | Broker→Device | 1 | Lệnh điều khiển (arm/disarm/lock/config), **chỉ Backend được phép publish** theo ACL |
| `guardian/{device_id}/cmd/ack` | Device→Broker | 1 | Xác nhận đã thực thi lệnh |

## 9.3 Cấu trúc bản tin (Payload Schema — MQTT)

**Telemetry:**
```json
{
  "device_id": "550e8400-e29b-41d4-a716-446655440000",
  "ts": 1735900000,
  "speed_kmh": 0,
  "battery_v": 12.6,
  "state": "ARMED"
}
```

**Alert:**
```json
{
  "device_id": "550e8400-e29b-41d4-a716-446655440000",
  "ts": 1735900040,
  "alert_id": "a1b2c3d4",
  "reason": "MOTION_WHILE_ARMED",
  "severity": "HIGH",
  "action_taken": "ALARM_TRIGGERED"
}
```

**Lệnh điều khiển (Backend → Device), ví dụ khoá động cơ:**
```json
{
  "cmd_id": "c-9f8e7d6c",
  "type": "LOCK_ENGINE",
  "issued_by": "user_123",
  "ts": 1735900100
}
```

**Xác nhận lệnh (Device → Backend):**
```json
{
  "cmd_id": "c-9f8e7d6c",
  "result": "EXECUTED",
  "ts": 1735900100,
  "reason_if_failed": null
}
```
Nếu lệnh bị từ chối do vi phạm ràng buộc an toàn:
```json
{
  "cmd_id": "c-9f8e7d6c",
  "result": "REJECTED",
  "ts": 1735900100,
  "reason_if_failed": "SPEED_NOT_ZERO"
}
```

## 9.4 Mã định danh thiết bị

Mỗi thiết bị được cấp một `device_id` dạng UUID v4 duy nhất tại thời điểm onboarding (mục 11), không trùng lặp trong toàn hệ thống, dùng làm khoá chính liên kết giữa: namespace topic MQTT, bản ghi trong bảng `devices`, credential MQTT riêng, và ACL trên broker.

## 9.5 Timestamp và đơn vị đo

- Tất cả timestamp dùng Unix epoch (giây, UTC)
- Đơn vị chuẩn hoá: tốc độ (km/h), điện áp (V), gia tốc (m/s² hoặc đơn vị g, ghi rõ trong `docs/`)
- Thiết bị đồng bộ thời gian qua NTP khi khởi động và khi kết nối lại Wi-Fi

## 9.6 Cơ chế xác nhận lệnh điều khiển (Command Acknowledgment)

1. Backend sinh `cmd_id` duy nhất (UUID), lưu vào bảng `commands` với trạng thái `PENDING`
2. Backend publish lệnh lên `guardian/{device_id}/cmd/{cmd_type}`, khởi động timer chờ ACK (timeout 5 giây)
3. Gateway Node nhận lệnh, xử lý qua state machine an toàn, publish kết quả lên `guardian/{device_id}/cmd/ack`
4. Backend cập nhật trạng thái lệnh thành `EXECUTED`/`REJECTED`/`TIMEOUT`
5. Nếu `TIMEOUT`, backend không tự động retry lệnh khoá động cơ nhưng có thể retry lệnh không nguy hiểm (arm/disarm) tối đa 2 lần

## 9.7 Cơ chế phát hiện online/offline

- **Chủ động (heartbeat):** thiết bị publish `heartbeat` mỗi 15 giây; backend đánh dấu `OFFLINE` nếu không nhận được trong 45 giây
- **Bị động (LWT):** broker tự publish `status=offline` (retain=true) nếu mất kết nối đột ngột

## 9.8 QoS, retry, timeout và xử lý bản tin trùng lặp

| Loại bản tin | QoS | Retry | Xử lý trùng lặp |
|---|---|---|---|
| Telemetry | 0 | Không | Không cần — dữ liệu mới luôn ghi đè |
| Alert | 1 | Broker đảm bảo | Backend kiểm tra `alert_id` — nếu đã tồn tại, bỏ qua |
| Command | 1 | Backend retry tối đa 2 lần với lệnh không nguy hiểm | Gateway kiểm tra `cmd_id` đã xử lý chưa — nếu trùng, chỉ gửi lại ACK |
| Heartbeat | 0 | Không cần | Không cần |

## 9.9 Luồng dữ liệu Thiết bị → Backend → Ứng dụng

```
Testbed (motor quay) → Sensor Node (đọc Hall) → Khung UART TELEMETRY
    → Gateway Node (SafetyTask xử lý) → MQTT publish telemetry
    → Broker → Backend Subscriber → Validate → Ghi Time-series DB
    → WebSocket/polling → Dashboard cập nhật biểu đồ (< 2 giây, theo NFR-01)
```

## 9.10 Luồng dữ liệu Ứng dụng → Backend → Thiết bị

```
Owner bấm "Khoá xe" trên Dashboard → HTTPS POST /api/devices/{id}/command (kèm JWT + step-up confirmation)
    → Backend: xác thực JWT → kiểm tra RBAC → kiểm tra step-up confirmation
    → Backend sinh cmd_id, lưu PENDING → publish MQTT guardian/{id}/cmd/lock_engine
    → Gateway Node nhận → SafetyTask kiểm tra tốc độ = 0?
        → Nếu đúng: gửi khung UART CMD_RELAY xuống Sensor Node, kích hoạt relay, publish ACK result=EXECUTED
        → Nếu sai: publish ACK result=REJECTED, reason=SPEED_NOT_ZERO
    → Backend cập nhật trạng thái lệnh, ghi audit log
    → Dashboard hiển thị kết quả cho Owner (< 1.5 giây, theo NFR-02)
```

---

# 10. THIẾT KẾ CƠ SỞ DỮ LIỆU, API VÀ BACKEND

## 10.1 Mô hình dữ liệu (ERD)

```
┌──────────────┐        ┌──────────────────┐        ┌──────────────┐
│    User       │        │    Ownership       │        │    Device     │
├──────────────┤        ├──────────────────┤        ├──────────────┤
│ user_id (PK)  │◄──────┤ user_id (FK)       ├───────►│ device_id(PK) │
│ email         │   1  N │ device_id (FK)     │ N   1  │ device_uuid   │
│ password_hash │        │ role (Owner/Viewer)│        │ name          │
│ full_name     │        │ granted_at         │        │ lifecycle_state│
│ status        │        └──────────────────┘        │ firmware_ver  │
│ created_at    │                                      │ hw_version    │
└──────────────┘                                      │ created_at    │
       │ 1                                             │ last_seen_at  │
       │                                                └──────┬───────┘
       │ N                                                     │ 1
┌──────▼───────┐        ┌──────────────────┐        ┌─────────▼──────┐
│  AuditLog     │        │     Command        │        │  TelemetryReading (time-series)│
├──────────────┤        ├──────────────────┤        ├─────────────────┤
│ log_id (PK)   │        │ cmd_id (PK)        │        │ reading_id (PK)  │
│ user_id (FK)  │        │ device_id (FK)     │        │ device_id (FK)   │
│ device_id (FK)│        │ issued_by (FK User)│        │ ts               │
│ action        │        │ type               │        │ speed_kmh        │
│ result        │        │ status             │        │ battery_v        │
│ source_ip     │        │ issued_at          │        │ state             │
│ ts            │        │ ack_at             │        └─────────────────┘
└──────────────┘        └──────────────────┘

┌──────────────┐
│    Alert      │
├──────────────┤
│ alert_id (PK) │
│ device_id (FK)│
│ reason        │
│ severity      │
│ status (OPEN/ACKNOWLEDGED/RESOLVED) │
│ created_at    │
│ resolved_by (FK User, nullable)     │
│ resolved_at   │
└──────────────┘
```

**Ghi chú lựa chọn công nghệ:** `TelemetryReading` lưu ở time-series database (InfluxDB) để tối ưu truy vấn theo khoảng thời gian; các bảng còn lại lưu ở relational database (PostgreSQL/SQLite).

## 10.2 Mô tả API (REST — giao tiếp Frontend ↔ Backend)

| Method | Endpoint | Chức năng | Yêu cầu quyền |
|---|---|---|---|
| POST | `/api/auth/register` | Đăng ký tài khoản | Không (public) |
| POST | `/api/auth/login` | Đăng nhập, trả JWT | Không (public) |
| POST | `/api/auth/refresh` | Làm mới access token | Refresh token hợp lệ |
| POST | `/api/auth/change-password` | Đổi mật khẩu | JWT hợp lệ |
| GET | `/api/users/me` | Xem thông tin tài khoản hiện tại | JWT hợp lệ |
| GET | `/api/devices` | Danh sách thiết bị người dùng có quyền truy cập | JWT + lọc theo Ownership |
| POST | `/api/devices/onboard` | Đăng ký thiết bị mới (nhận claim token từ QR) | JWT (Owner) |
| GET | `/api/devices/{id}` | Chi tiết + trạng thái thiết bị | JWT + kiểm tra Ownership |
| PATCH | `/api/devices/{id}/config` | Cập nhật cấu hình ngưỡng | JWT + role Owner |
| POST | `/api/devices/{id}/command` | Gửi lệnh điều khiển (kèm step-up confirmation) | JWT + role Owner |
| GET | `/api/devices/{id}/commands` | Lịch sử lệnh | JWT + kiểm tra Ownership |
| POST | `/api/devices/{id}/revoke` | Thu hồi quyền kết nối thiết bị | JWT + role Owner/Admin |
| POST | `/api/devices/{id}/decommission` | Ngừng sử dụng thiết bị | JWT + role Owner/Admin |
| GET | `/api/devices/{id}/telemetry?from=&to=` | Tra cứu dữ liệu lịch sử | JWT + kiểm tra Ownership |
| GET | `/api/devices/{id}/telemetry/export?format=csv` | Xuất dữ liệu | JWT + kiểm tra Ownership |
| GET | `/api/alerts?device_id=&status=` | Danh sách cảnh báo | JWT + kiểm tra Ownership |
| POST | `/api/alerts/{id}/acknowledge` | Xác nhận đã xem cảnh báo | JWT + kiểm tra Ownership |
| POST | `/api/alerts/{id}/resolve` | Đánh dấu đã xử lý cảnh báo | JWT + kiểm tra Ownership |
| POST | `/api/devices/{id}/users` | Mời người dùng khác (gán role Viewer) | JWT + role Owner |
| GET | `/api/admin/users` | Danh sách toàn bộ tài khoản hệ thống | JWT + role Admin |
| GET | `/api/admin/devices` | Danh sách toàn bộ thiết bị hệ thống | JWT + role Admin |
| GET | `/api/admin/audit-log?device_id=&user_id=` | Tra cứu nhật ký thao tác | JWT + role Admin |

**Nguyên tắc bắt buộc:** mọi endpoint (trừ register/login) đều qua middleware xác thực JWT trước, sau đó middleware RBAC kiểm tra quyền dựa trên bảng `Ownership` — kiểm tra ở backend, không chỉ ẩn nút trên giao diện.

## 10.3 Kiến trúc Backend

- **Ngôn ngữ/framework đề xuất:** Node.js (Express) hoặc Python (FastAPI)
- **MQTT Subscriber Service:** subscribe `guardian/+/#`, validate payload theo JSON Schema trước khi ghi DB
- **Xác thực:** JWT access token (15 phút) + refresh token (7 ngày)
- **Kết nối MQTT của Backend:** dùng credential riêng, có quyền publish/subscribe toàn bộ namespace `guardian/#`

---

# 11. QUẢN LÝ VÒNG ĐỜI THIẾT BỊ

## 11.1 Mô hình trạng thái vòng đời thiết bị (Device Lifecycle State Machine)

*Lưu ý: đây là state machine ở tầng quản lý backend, khác với state machine an toàn PARKED/ARMED/ALARM/THEFT_LOCK chạy trên firmware.*

```
Registered ──(cấp device_id + claim token)──► Provisioned
    │
    └──(người dùng quét QR, claim thiết bị vào tài khoản)──► Active
                                                                  │
                            ┌─────────────────────────────────────┤
                            │                                     │
                    (mất heartbeat > 45s)                (lỗi phần cứng/firmware báo lỗi)
                            │                                     │
                            ▼                                     ▼
                        Offline ◄──(heartbeat trở lại)──────  Fault
                            │                                     │
                            └──────────────┬──────────────────────┘
                                            │ (Owner/Admin đưa vào bảo trì)
                                            ▼
                                      Maintenance
                                            │ (hoàn tất bảo trì)
                                            ▼
                                      Active (quay lại)
                                            │
                            (Owner/Admin quyết định ngừng sử dụng)
                                            ▼
                                    Decommissioned
                                  (thu hồi credential vĩnh viễn,
                                   broker từ chối mọi kết nối từ device_id này)
```

## 11.2 Mô tả từng trạng thái và thao tác quản lý tương ứng

| Trạng thái | Mô tả | Thao tác quản lý liên quan |
|---|---|---|
| **Registered** | Thiết bị được tạo bản ghi, đã cấp `device_id` nhưng chưa có credential | Admin sinh `device_id` khi lắp ráp phần cứng xong |
| **Provisioned** | Thiết bị đã có credential MQTT, sẵn sàng để claim | Backend cấp credential qua quy trình provisioning (mục 11.3) |
| **Active** | Đã gán cho một Owner, đang hoạt động, gửi telemetry/heartbeat đều đặn | Owner claim thiết bị qua QR; cấu hình tham số từ xa qua `PATCH /devices/{id}/config` |
| **Offline** | Không nhận heartbeat trong 45 giây | Tự động chuyển bởi backend; tự quay lại Active khi heartbeat trở lại |
| **Fault** | Thiết bị tự báo lỗi hoặc backend phát hiện dữ liệu bất thường liên tục | Ghi AuditLog, gửi thông báo cho Owner |
| **Maintenance** | Owner/Admin chủ động đưa vào chế độ bảo trì | Cảnh báo bị tạm ẩn khỏi dashboard chính |
| **Decommissioned** | Ngừng sử dụng vĩnh viễn | Backend xoá/vô hiệu hoá credential MQTT, `device_id` không thể kết nối lại |

## 11.3 Quy trình Onboarding thiết bị mới

1. Thiết bị mới lắp ráp xong, gán `device_id` (UUID), trạng thái `Registered`
2. Gateway Node lần đầu boot vào chế độ "provisioning" (Wi-Fi AP tạm), hiển thị mã QR chứa `device_id` + `claim_token` dùng một lần (hạn 24 giờ)
3. Backend cấp credential MQTT thật → trạng thái `Provisioned`
4. Owner quét QR → gửi lên `POST /api/devices/onboard` (kèm JWT)
5. Backend xác minh `claim_token`, tạo `Ownership(user_id, device_id, role=Owner)`, đánh dấu token đã dùng → `Active`
6. Gateway Node nhận thông báo claim thành công, thoát provisioning, kết nối Wi-Fi thật

## 11.4 Theo dõi phiên bản phần cứng và firmware

Bảng `Device` lưu `firmware_version` và `hw_version`, cập nhật mỗi khi Gateway Node gửi `heartbeat` — nền tảng chuẩn bị cho OTA (mục 16.4) nếu triển khai.

## 11.5 Khoá/thu hồi quyền kết nối (Revoke)

1. Backend vô hiệu hoá credential MQTT của thiết bị trên broker
2. Broker ngắt kết nối hiện tại (nếu đang online) và từ chối mọi lần kết nối lại
3. Trạng thái chuyển `Fault` hoặc `Decommissioned`
4. Ghi `AuditLog` với `action = DEVICE_REVOKED`

**Đây là 1 trong 2 test bảo mật bắt buộc theo đề bài** — xem mục 15.

---

# 12. QUẢN LÝ NGƯỜI DÙNG VÀ PHÂN QUYỀN

## 12.1 Ba vai trò trong hệ thống

| Vai trò | Mô tả |
|---|---|
| **Admin** | Quản trị viên hệ thống — quản lý toàn bộ tài khoản và thiết bị |
| **Owner** | Chủ sở hữu thiết bị — quản lý đầy đủ thiết bị mình sở hữu |
| **Viewer** | Người được Owner cấp quyền xem — chỉ xem, không điều khiển/cấu hình |

## 12.2 Ma trận vai trò và quyền (RBAC Matrix)

| Chức năng | Admin | Owner | Viewer |
|---|---|---|---|
| Đăng ký/đăng nhập/đổi mật khẩu | ✓ (của chính mình) | ✓ | ✓ |
| Xem danh sách thiết bị | ✓ (tất cả) | ✓ (thiết bị sở hữu) | ✓ (thiết bị được cấp quyền) |
| Xem telemetry/lịch sử | ✓ | ✓ | ✓ |
| Nhận cảnh báo | ✓ | ✓ | ✓ |
| Xác nhận/xử lý cảnh báo | ✓ | ✓ | ✗ |
| Arm/Disarm | ✓ | ✓ | ✗ |
| Khoá động cơ (lệnh nguy hiểm) | ✓ | ✓ (kèm step-up confirmation) | ✗ |
| Cấu hình ngưỡng cảnh báo | ✓ | ✓ | ✗ |
| Mời người dùng khác | ✓ | ✓ (cho thiết bị của mình) | ✗ |
| Thu hồi (revoke) thiết bị | ✓ (mọi thiết bị) | ✓ (thiết bị của mình) | ✗ |
| Decommission thiết bị | ✓ | ✓ (thiết bị của mình) | ✗ |
| Quản lý tài khoản người dùng khác | ✓ | ✗ | ✗ |
| Xem audit log toàn hệ thống | ✓ | ✓ (chỉ log liên quan) | ✗ |

## 12.3 Quản lý tài khoản người dùng

- **Đăng ký:** email + mật khẩu (≥ 8 ký tự, có chữ hoa/số), băm bcrypt/argon2
- **Đăng nhập/đăng xuất:** JWT access + refresh token; đăng xuất thu hồi refresh token phía backend
- **Đổi mật khẩu:** yêu cầu nhập mật khẩu cũ
- **Quản lý trạng thái tài khoản:** `Active`/`Suspended`

## 12.4 Quản lý credential thiết bị

Mỗi thiết bị có username/password MQTT riêng biệt, không chia sẻ giữa các thiết bị; credential cấp trong bước Provisioned, không hardcode trong firmware public trên GitHub.

---

# 13. THIẾT KẾ BẢO MẬT VÀ QUYỀN RIÊNG TƯ

## 13.1 Nguyên tắc bảo mật áp dụng (đối chiếu yêu cầu đề bài)

| Yêu cầu đề bài | Biện pháp áp dụng |
|---|---|
| Mật khẩu băm an toàn | bcrypt/argon2 + salt |
| API yêu cầu xác thực | Middleware JWT bắt buộc trên mọi endpoint trừ register/login |
| Kiểm tra quyền ở backend | RBAC middleware kiểm tra `Ownership` trước khi xử lý mọi request |
| Người dùng chỉ truy cập phạm vi được cấp quyền | Query database lọc theo `Ownership` |
| Thiết bị có định danh và xác thực riêng | `device_id` UUID + credential MQTT riêng |
| Không dùng chung tài khoản/khoá cho mọi thiết bị | Mỗi thiết bị có user MQTT riêng |
| Không đưa secret lên GitHub | `.env` trong `.gitignore`, chỉ commit `.env.example` |
| Secret qua biến môi trường | JWT secret, DB password, MQTT admin credential |
| Kiểm tra và làm sạch dữ liệu đầu vào | Validate schema cho mọi request/MQTT payload |
| Cơ chế khoá/thu hồi thiết bị | Chức năng Revoke (mục 11.5) |
| Ghi audit log | Bảng `AuditLog`, append-only |
| TLS/HTTPS | MQTT qua TLS (port 8883), REST API qua HTTPS |
| Mô tả dữ liệu cá nhân và quyền riêng tư | Mục 13.4 |

## 13.2 Kiến trúc xác thực hệ thống

| Đối tượng | Cơ chế xác thực |
|---|---|
| Người dùng (Frontend) | JWT access token (15 phút) + refresh token (7 ngày) qua HTTPS |
| Thiết bị (MQTT) | Username/password riêng từng `device_id`, TLS bắt buộc; hướng phát triển: mTLS |

## 13.3 Xác thực bước nâng cao cho lệnh nguy hiểm (Step-up Re-authentication)

Lệnh `LOCK_ENGINE` yêu cầu Owner nhập lại mật khẩu tài khoản (Step-up Re-authentication) trước khi Backend gửi lệnh — JWT hợp lệ là điều kiện cần nhưng không đủ.

> **Làm rõ thuật ngữ học thuật:** Đây là cơ chế **Step-up Re-authentication** (xác thực lại bước nâng cấp bằng cùng yếu tố mật khẩu) nhằm ngăn chặn việc điện thoại/trình duyệt bị người khác bấm nhầm hoặc phiên làm việc bị bỏ quên, không phải là xác thực đa nhân tố độc lập (2FA - Two-Factor Authentication như OTP/TOTP). Hướng mở rộng thực tế có thể tích hợp thêm yếu tố thứ hai độc lập (mã TOTP Google Authenticator hoặc OTP Telegram/SMS).

## 13.4 Quyền riêng tư và dữ liệu cá nhân

| Loại dữ liệu cá nhân | Mục đích | Biện pháp bảo vệ |
|---|---|---|
| Vị trí GPS (Tier mở rộng) | Định vị khi bị trộm | Chỉ Owner/Viewer được cấp quyền mới xem; không chia sẻ bên thứ ba; đề xuất xoá sau 90 ngày |
| Email, họ tên | Định danh tài khoản | Không hiển thị công khai |
| Lịch sử hành vi sử dụng xe | Driving score (nếu triển khai) | Chỉ Owner xem của thiết bị mình sở hữu |

Hệ thống không thu thập dữ liệu sức khoẻ, hình ảnh, âm thanh.

## 13.5 Mô hình các mối đe doạ chính (Threat Model rút gọn theo STRIDE)

| Mối đe doạ | Mô tả | Biện pháp kiểm soát |
|---|---|---|
| Spoofing | Giả mạo thiết bị/người dùng | Credential riêng biệt; JWT ký bằng secret mạnh |
| Tampering | Sửa đổi bản tin trên đường truyền | TLS mã hoá toàn bộ MQTT và HTTPS |
| Repudiation | Chối bỏ đã gửi lệnh nguy hiểm | Audit log append-only |
| Information Disclosure | Xem dữ liệu không thuộc quyền | RBAC middleware kiểm tra Ownership |
| Denial of Service | Spam kết nối/bản tin | Rate limiting API; giới hạn kết nối theo device_id |
| Elevation of Privilege | Viewer cố gọi API dành cho Owner | RBAC middleware từ chối bất kể JWT hợp lệ |
| Trích xuất credential từ thiết bị bị tháo dỡ | Đọc credential từ firmware | Không hardcode; cấp qua provisioning; hướng phát triển: NVS encryption |

---

# 14. TRIỂN KHAI HỆ THỐNG

## 14.1 Môi trường triển khai

| Thành phần | Công nghệ đề xuất |
|---|---|
| Firmware | ESP-IDF/Arduino (ESP32), STM32CubeIDE/HAL (STM32, tuỳ chọn) |
| MQTT Broker | Eclipse Mosquitto, TLS + ACL |
| Backend | Node.js/Express hoặc Python/FastAPI, Docker |
| Database quan hệ | PostgreSQL (hoặc SQLite khi phát triển) |
| Database time-series | InfluxDB |
| Frontend | React, Nginx (Docker) |
| Điều phối container | Docker Compose |

## 14.2 Sơ đồ Docker Compose (mô tả)

```
services:
  mosquitto      — broker MQTT, mount cấu hình TLS + ACL
  backend        — API service, đọc biến môi trường từ .env
  postgres       — database quan hệ
  influxdb       — database time-series
  frontend       — Nginx phục vụ build React
networks: guardian-net
volumes: postgres-data, influx-data, mosquitto-data
```

## 14.3 Cấu trúc thư mục GitHub Repository

```
motorbike-guardian/
├── README.md
├── firmware/
│   ├── sensor-node/
│   └── gateway-node/
├── backend/
├── frontend/
├── database/
├── deployment/
├── hardware/
├── tests/
├── docs/
└── .env.example
```

**Quy định:** mỗi thành viên commit bằng tài khoản GitHub cá nhân; tag `v1.0.0` cho bản nộp cuối; không commit `.env`/secret/dữ liệu cá nhân thật.

---

# 15. KIỂM THỬ VÀ ĐÁNH GIÁ

## 15.1 Kiểm thử chức năng

| # | Quy trình | Cách thực hiện | Kỳ vọng |
|---|---|---|---|
| F-01 | Đăng nhập và phân quyền | Đăng nhập 3 tài khoản Admin/Owner/Viewer | Mỗi tài khoản chỉ thấy đúng chức năng theo RBAC |
| F-02 | Đăng ký, kích hoạt thiết bị | Thực hiện quy trình onboarding | Chuyển đúng Registered→Provisioned→Active |
| F-03 | Thiết bị gửi telemetry | Vặn biến trở thay đổi tốc độ motor | Dữ liệu mới xuất hiện < 2 giây |
| F-04 | Dashboard cập nhật dữ liệu | Quan sát khi telemetry thay đổi | Cập nhật thời gian thực, không cần tải lại trang |
| F-05 | Gửi và xác nhận lệnh điều khiển | Owner gửi lệnh Arm | ACK `EXECUTED` < 1.5s |
| F-06 | Phát hiện thiết bị offline | Ngắt nguồn Gateway Node | Offline trong 45s hoặc ngay lập tức qua LWT |
| F-07 | Sinh và xử lý cảnh báo | Giả lập trộm khi ARMED | Alert tạo, Owner acknowledge được |
| F-08 | Khoá/ngừng sử dụng thiết bị | Owner gọi Revoke | Ngắt kết nối, không kết nối lại được |

## 15.2 Kiểm thử bảo mật (tối thiểu 2 theo đề bài — nhóm thực hiện 7)

| # | Test case | Cách thực hiện | Kỳ vọng |
|---|---|---|---|
| S-01 | Không truy cập thiết bị người khác | Viewer A gọi API xem thiết bị của Owner B | `403 Forbidden` |
| S-02 | Thiết bị bị thu hồi không gửi được dữ liệu | Revoke thiết bị, thử kết nối lại | Broker từ chối |
| S-03 | Từ chối token không hợp lệ/hết hạn | Gọi API với JWT giả/hết hạn | `401 Unauthorized` |
| S-04 | Broker từ chối sai topic | Dùng credential thiết bị A publish vào topic thiết bị B | Broker từ chối theo ACL |
| S-05 | Viewer không thực hiện được thao tác nguy hiểm | Viewer gọi API khoá động cơ | `403 Forbidden`, không gửi lệnh xuống thiết bị |
| S-06 | Từ chối dữ liệu không hợp lệ | Publish payload sai định dạng/giá trị vô lý | Backend loại bỏ, ghi log bất thường |
| S-07 | Ràng buộc an toàn cốt lõi firmware | Gửi lệnh nguy hiểm (`LOCK_ENGINE` hoặc `REBOOT`) khi tốc độ $v > 0.5\ \text{km/h}$ | Gateway từ chối ngay tại biên phần cứng, ACK `REJECTED, SPEED_NOT_ZERO`; bảo vệ không ngắt nguồn/reset chip khi xe đang chạy |
| S-08 | Xác thực bước nâng cao (Step-up Re-authentication) | Gửi lệnh khoá động cơ mà không nhập hoặc nhập sai mật khẩu tài khoản | Backend từ chối `400 Bad Request`, ghi log `COMMAND_REJECTED_STEPUP` vào Audit Log |

## 15.3 Kiểm thử phi chức năng (đối chiếu NFR mục 5.3)

| Chỉ tiêu | Phương pháp đo |
|---|---|
| Độ trễ cảm biến → dashboard (NFR-01) | So sánh timestamp sự kiện vật lý vs. timestamp dashboard nhận, lặp 30 lần, lấy trung bình/p95 |
| Độ trễ lệnh điều khiển (NFR-02) | Đo từ lúc bấm gửi lệnh đến lúc nhận ACK, lặp 30 lần |
| Độ trễ phản ứng an toàn (NFR-03) | Đo từ khung UART báo tốc độ=0 đến khi relay ngắt, bằng oscilloscope/logic analyzer |
| Tỷ lệ mất bản tin (NFR-04) | So sánh counter ở firmware vs. số bản tin backend nhận |
| Phục hồi sau mất mạng (NFR-05) | Ngắt Wi-Fi 60s, đo thời gian kết nối lại + đồng bộ dữ liệu tồn đọng |
| Xử lý bản tin trùng lặp (NFR-06) | Gửi lại cùng `cmd_id` hai lần, kiểm tra chỉ thực thi một lần |
| Mức dùng CPU/RAM | `esp_get_free_heap_size()` theo dõi định kỳ |
| Độ ổn định theo thời gian | Chạy liên tục ≥ 24 giờ, ghi nhận số lần crash/reset |

*Kết quả đo cụ thể sẽ được cập nhật sau khi hoàn thành giai đoạn kiểm thử, kèm nhận xét từng chỉ tiêu.*

---

# 16. CHỨC NĂNG NÂNG CAO

## 16.1 Chiến lược triển khai theo Tier

| Tier | Kiến trúc phần cứng | Mục tiêu | Mốc dự kiến |
|---|---|---|---|
| **Tier 0** (bắt buộc) | 1 ESP32 duy nhất | Nền tảng an toàn + toàn bộ backend/frontend hoạt động | Tuần 1-4 |
| **Tier 1** (đích chính) | 2 node qua UART (giao thức tự thiết kế) | Kiến trúc phân tán, đúng mốc giữa kỳ | Tuần 4-6 |
| **Tier 2** (mở rộng, tuỳ chọn) | Sensor Node đổi sang STM32 (vẫn qua UART) | Kiến trúc đa chip | Tuần 6-8, nếu dư thời gian |
| **Tier 3** (mở rộng, tuỳ chọn) | GPS, driving score/Edge AI | Điểm cộng | Tuần 8-10, nếu dư thời gian |

## 16.2 Edge AI (nếu triển khai Tier 3)

- **Vấn đề giải quyết:** phân loại kiểu chuyển động (phanh gấp/cua gấp/ngã xe/rung động thông thường) từ dữ liệu gia tốc
- **Nguồn dữ liệu:** cửa sổ trượt 1-2 giây accel_x/y/z thu thập từ testbed
- **Tiền xử lý:** chuẩn hoá, trích đặc trưng (mean, std, peak, zero-crossing rate)
- **Mô hình:** cây quyết định nhẹ hoặc ngưỡng đa chiều, đủ nhẹ chạy trên ESP32
- **Chỉ số đánh giá:** accuracy, precision/recall từng lớp (đặc biệt recall lớp "ngã/trộm")
- **Tích hợp:** kết quả gửi kèm trong `event`/`alert`
- **Nguyên tắc:** AI chỉ hỗ trợ phân loại, không quyết định khoá động cơ — quyết định an toàn cuối cùng luôn dựa rule-based (tốc độ=0) ở firmware

## 16.3 Driving Score (nếu triển khai Tier 3)

Chấm điểm hành vi lái theo tần suất phanh gấp/tăng tốc gấp trong phiên chạy mô phỏng — minh hoạ giá trị ứng dụng thực tế (Usage-Based Insurance).

## 16.4 Cập nhật firmware từ xa (OTA) — hướng phát triển

Nếu triển khai, dùng cơ chế dual-partition + rollback tự động của ESP-IDF cho Gateway Node, xác minh checksum, tự khôi phục phiên bản cũ nếu lỗi. Không bắt buộc cho MVP.

---

# 17. HẠN CHẾ VÀ HƯỚNG PHÁT TRIỂN

## 17.1 Hạn chế (nhìn nhận trung thực)

| Hạn chế | Giải thích |
|---|---|
| Không kiểm chứng trên xe máy thật | Quyết định có chủ đích loại bỏ rủi ro an toàn; thông số ánh xạ (tốc độ motor ↔ km/h thực tế) là quy ước tự đặt |
| Giao thức UART nội bộ là bản tự thiết kế đơn giản | Không phải chuẩn công nghiệp (CAN/LIN) — mục tiêu minh hoạ nguyên lý framing/error-handling, không phải tái tạo chuẩn thật |
| Chưa tối ưu năng lượng | Thiết bị dùng nguồn ngoài, chưa đánh giá khả năng chạy pin dài hạn |
| Quy mô thử nghiệm nhỏ (1-3 thiết bị) | Chưa đánh giá mở rộng ở quy mô lớn (load testing) |
| mTLS chưa triển khai ở MVP | Dùng username/password riêng từng thiết bị làm giải pháp tạm thời hợp lý |

## 17.2 Hướng phát triển

- Mở rộng quản lý nhiều xe (fleet management)
- Hoàn thiện OTA làm chức năng chính thức
- Nâng cấp mTLS thay username/password
- Tích hợp OTP thật qua SMS/email cho step-up confirmation
- Đánh giá khả năng mở rộng bằng thiết bị mô phỏng số lượng lớn
- Cân nhắc nâng cấp giao tiếp nội bộ lên CAN bus nếu phát triển thành đồ án tốt nghiệp, để mô phỏng đúng hơn kiến trúc mạng ECU ô tô thật (không thực hiện trong phạm vi học phần này)
- Thử nghiệm phần đọc dữ liệu không xâm lấn trên xe máy thật ở giai đoạn phát triển sau
- Mã hoá credential lưu trữ trong flash thiết bị (NVS encryption)

---

# 18. KẾT LUẬN

Đồ án Motorbike Guardian xây dựng một nguyên mẫu hệ thống IoT hoàn chỉnh, tích hợp đầy đủ các thành phần theo yêu cầu học phần: thiết bị vật lý đa cảm biến hoạt động thực tế trên testbed mô phỏng an toàn với hai node giao tiếp qua giao thức UART tự thiết kế, kết nối MQTT có bảo mật lên backend, backend tự xây dựng với đầy đủ 5 nhóm chức năng (quản lý người dùng, quản lý vòng đời thiết bị, quản lý dữ liệu, giám sát/cảnh báo, điều khiển thiết bị), cơ chế xác thực-phân quyền-audit log theo mô hình ba vai trò, và giao diện dashboard hỗ trợ đầy đủ các quy trình nghiệp vụ chính. Hệ thống giải quyết một vấn đề thực tế cụ thể với đối tượng sử dụng rõ ràng, có khả năng triển khai thành nguyên mẫu hoạt động được. Việc lựa chọn giao thức UART tự thiết kế thay vì CAN bus giúp giảm rủi ro kỹ thuật, tập trung nguồn lực nhóm 4 người vào các yêu cầu trọng tâm của đề bài (backend, bảo mật, quản lý vòng đời thiết bị), trong khi vẫn thể hiện đầy đủ kỹ năng embedded cấp thấp (thiết kế khung gói tin, xử lý lỗi, FreeRTOS).

---

# 19. TÀI LIỆU THAM KHẢO

1. Espressif Systems, "ESP-IDF Programming Guide — OTA Updates," Espressif Documentation.
2. Espressif Systems, "ESP-IDF UART Driver Documentation," Espressif Documentation.
3. OASIS, "MQTT Version 5.0 Specification," OASIS Standard.
4. Eclipse Foundation, "Eclipse Mosquitto Documentation" (cấu hình TLS/ACL).
5. OWASP Foundation, "OWASP API Security Top 10."
6. *(Bổ sung các paper/tài liệu học thuật cụ thể đã tham khảo trong quá trình nghiên cứu đề tài)*

---

# 20. PHỤ LỤC

## 20.1 Danh sách sơ đồ cần vẽ hoàn chỉnh bằng công cụ chuyên dụng trước khi nộp

- Sơ đồ bối cảnh hệ thống (mục 7.1)
- Sơ đồ use case đầy đủ (mục 5.1)
- Sơ đồ kiến trúc tổng thể các lớp (mục 7.2)
- Sơ đồ khối phần cứng (mục 8.2) và sơ đồ nối dây chi tiết (mục 8.3)
- Sơ đồ triển khai (mục 7.4)
- ERD (mục 10.1)
- Sequence diagram cho 2 quy trình: luồng telemetry (mục 9.9) và luồng lệnh điều khiển (mục 9.10)
- Sơ đồ trạng thái vòng đời thiết bị (mục 11.1) và sơ đồ trạng thái an toàn firmware
- Sơ đồ khung gói tin giao thức UART (mục 9.1)

## 20.2 Kịch bản Demo trực tiếp (10 bước)

| Bước | Nội dung |
|---|---|
| 1 | Đăng nhập lần lượt Admin, Owner, Viewer |
| 2 | Đăng ký/kích hoạt thiết bị mới qua QR |
| 3 | Thiết bị gửi dữ liệu cảm biến (vặn biến trở) |
| 4 | Dashboard hiển thị dữ liệu thời gian thực |
| 5 | Gửi lệnh Arm, nhận ACK |
| 6 | Thay đổi cấu hình thiết bị |
| 7 | Ngắt kết nối để phát hiện offline |
| 8 | Kích hoạt cảnh báo thật (giả lập trộm), xác nhận trên dashboard |
| 9 | Thử thao tác không được cấp quyền (Viewer cố khoá động cơ) |
| 10 | Revoke/decommission thiết bị, chứng minh không kết nối lại được |

## 20.3 Chi phí ước tính phần cứng (VNĐ, đối chiếu danh sách linh kiện mục 8.1)

| # | Hạng mục | Tiết kiệm | Tiêu chuẩn | Nâng cao |
|---|---|---|---|---|
| 1 | ESP32-WROOM-32 DevKit x2 | 140.000 | 180.000 | 240.000 |
| 2 | STM32F103C8T6 + ST-Link V2 (Tier mở rộng) | — | 100.000 | 140.000 |
| 3 | Cảm biến Hall (A3144/KY-003) | 15.000 | 20.000 | 25.000 |
| 4 | Nam châm neodymium nhỏ | 5.000 | 5.000 | 10.000 |
| 5 | Module MPU6050 (GY-521) | 20.000 | 30.000 | 45.000 |
| 6 | Motor giảm tốc DC 6-12V | 30.000 | 45.000 | 70.000 |
| 7 | Module LM2596 (có núm vặn) | 15.000 | 20.000 | 30.000 |
| 8 | Relay module 5V (opto-cách ly) | 15.000 | 25.000 | 40.000 |
| 9 | GPS NEO-6M + ăng-ten (tuỳ chọn) | — | 75.000 | 100.000 |
| 10 | Buzzer active 5V | 5.000 | 8.000 | 10.000 |
| 11 | LED + điện trở (bộ) | 10.000 | 15.000 | 20.000 |
| 12 | Breadboard 830 lỗ x2 | 40.000 | 60.000 | 80.000 |
| 13 | Dây jumper (3 bộ) | 30.000 | 45.000 | 60.000 |
| 14 | Điện trở các loại (bộ) | 10.000 | 15.000 | 20.000 |
| 15 | Khay/đế gỗ-mica | 30.000 | 50.000 | 80.000 |
| 16 | Nguồn tổ ong 12V 2A | 40.000 | 55.000 | 70.000 |
| 17 | Pin 18650 + đế pin (tuỳ chọn) | — | 40.000 | 60.000 |
| — | Dự phòng linh kiện hỏng/hàn lỗi (10%) | ~40.000 | ~78.000 | ~110.000 |
| | **Tổng (Tier 0-1, không STM32/GPS/pin)** | **~445.000** | — | — |
| | **Tổng (đủ Tier 0-2, có STM32)** | — | **~866.000** | — |
| | **Tổng (đủ Tier 0-3, có STM32+GPS+pin)** | — | — | **~1.210.000** |

*Lưu ý: bảng này chi tiết hơn bảng ở mục 20.3 phiên bản trước — nhóm dùng bảng này làm căn cứ chính khi lập dự trù mua sắm thực tế.*

## 20.4 Bảng đối chiếu yêu cầu đề bài ↔ mục báo cáo (self-checklist, không thuộc bản nộp chính thức)

| Yêu cầu đề bài | Mục báo cáo | Trạng thái |
|---|---|---|
| Thiết bị vật lý hoạt động thực tế | Mục 8 | Cần hoàn thành lắp ráp thực tế |
| ≥ 2 cảm biến, ≥ 1 cơ cấu chấp hành, ≥ 2 node | Mục 8.1 | Đã thiết kế đủ |
| Giao thức IoT + topic/payload | Mục 9 | Đã thiết kế đầy đủ |
| Backend tự xây dựng | Mục 10 | Đã thiết kế kiến trúc riêng |
| Quản lý người dùng ≥ 3 vai trò | Mục 12 | Đã có Admin/Owner/Viewer |
| Quản lý vòng đời thiết bị | Mục 11 | Đã thiết kế đầy đủ |
| Điều khiển thiết bị có ACK | Mục 9.6, 10.2 | Đã có |
| Bảo mật + ≥ 2 test | Mục 13, 15.2 | 7 test case (vượt tối thiểu) |
| Giao diện đầy đủ chức năng | Mục 9.10, 10.2 | Cần hoàn thiện Frontend thực tế |
| Sơ đồ bắt buộc | Mục 20.1 | Cần vẽ bằng công cụ chuyên dụng |
| Kiểm thử chức năng + phi chức năng | Mục 15 | Cần điền kết quả đo thực tế |
| Cấu trúc GitHub đúng chuẩn | Mục 14.3 | Đã thiết kế |
| Kịch bản demo 10 bước | Mục 20.2 | Đã có |
