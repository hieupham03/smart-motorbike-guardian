# Quy tắc repository và bản phát hành

GitHub main và tag là bản bàn giao hoàn chỉnh cho người đọc/người sử dụng. Nội dung phải nhất quán giữa code, hướng dẫn, cấu hình mẫu và cách chạy; bản nháp, cache, dữ liệu runtime và công cụ nội bộ được giữ ngoài phạm vi xuất bản.

## Cấu trúc môn học

| Thành phần | Nội dung bàn giao |
|---|---|
| README.md | Giới thiệu, kiến trúc, cài đặt và chạy |
| firmware/ | Mã nguồn hai node, header và sketch kiểm tra GPS |
| backend/ | API, xử lý telemetry, quyền, quản lý thiết bị/lệnh |
| frontend/ | Web; ứng dụng mobile trong frontend/mobile/ |
| database/ | Chỉ dẫn schema/migration và dữ liệu mẫu |
| deployment/ | Docker Compose, broker, bộ chạy và hướng dẫn |
| hardware/ | Đấu nối, linh kiện, hình prototype/minh họa có nhãn |
| tests/ | Kiểm thử và kiểm tra bản phát hành |
| docs/ | Bộ báo cáo/slide hiện hành và thiết kế |
| .env.example | Danh sách biến môi trường, không chứa bí mật |

Dotfile Git/CI được giữ khi phục vụ quản lý mã nguồn. Không xuất bản node_modules, dist, target, database local, Wi-Fi thật, Firebase credential, token, khóa API, file Office/Visual Paradigm đang khóa, mirror firmware hoặc nhiều bản báo cáo/slide cũ.

## Lịch sử và danh tính

- Giữ lịch sử commit thể hiện tiến trình làm việc của nhóm; không force-push, squash toàn bộ lịch sử hoặc dựng commit giả để chia đều đóng góp.
- Commit có nội dung cụ thể, chẳng hạn `feat: configure speed alert from web and mobile` hoặc `chore: prepare coursework release layout`.
- Mỗi thành viên sử dụng tài khoản GitHub của mình để commit/push phần mình thực hiện. Không thay tác giả hoặc giả mạo tài khoản để đáp ứng yêu cầu.
- Bản cuối có tag/release bất biến, ví dụ `v1.0.0`, trỏ tới commit đã kiểm. Bản sửa sau đó dùng phiên bản mới; không di chuyển tag cũ.

## Bí mật, dữ liệu cá nhân và quyền truy cập

- `.env.example` chỉ chứa tên biến, giá trị công khai hoặc địa chỉ minh họa. `.env`, network_config.h thật, dữ liệu DB và credential nằm ngoài Git.
- Quét cả nội dung chuẩn bị xuất bản và lịch sử; fixture công khai chỉ được miễn trừ bằng mẫu khớp chính xác, có giải thích. Không in giá trị bí mật trong log kiểm tra.
- Ảnh/log minh chứng phải loại token, email/số điện thoại/địa chỉ thật không cần thiết và dữ liệu cá nhân của người dùng.
- Khi repository private, nhóm phải cấp quyền cho tài khoản giảng viên và kiểm tra truy cập. Không ghi tên/tài khoản giảng viên nếu chưa được cung cấp.

## Kiểm trước phát hành

Chạy `python tests/publication/check_repository.py`, bộ quét bí mật và các kiểm thử/build liên quan. Kiểm tra bằng clone sạch: dependencies được cài từ lockfile, không phụ thuộc file cache trên máy tác giả. README, link và launcher phải dùng đúng đường dẫn đang xuất bản.

Tag/release xác định snapshot code, không thay thế nghiệm thu điện thoại thật hay phần cứng. Ghi rõ phạm vi các kết quả đã chạy trong `docs/RELEASE.md`; không đổi phần chưa kiểm thành PASS để gọi bản phát hành là “100%”.
