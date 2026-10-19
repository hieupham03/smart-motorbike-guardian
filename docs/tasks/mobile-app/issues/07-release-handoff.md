# 07 — Kiểm thử, tài liệu và bàn giao

Status: resolved
Progress: complete
Type: task
Scope: integration, documentation
Branch: `task/mobile-07-release-handoff`
Blocked by: 01, 02, 03, 04, 05, 06

## Expected behavior

- Có tài liệu kiến trúc/triển khai, nhật ký công việc, hướng dẫn build/run và bàn giao.
- Có checklist test tay trực tiếp cho app, backend, simulator và hardware.
- Ghi rõ PASS/FAIL/CHƯA CHẠY, commit/build/môi trường và giới hạn còn lại.
- Không tuyên bố GPS/relay/end-to-end thật nếu chưa có bằng chứng vật lý.

## Acceptance checks

- Chạy toàn bộ test phần mềm có thể chạy trong workspace.
- Rà credential, `git diff --check`, trạng thái nhánh và lịch sử commit.

## Tài liệu bàn giao

- `docs/MOBILE-APP-IMPLEMENTATION.md`: kiến trúc, công nghệ, phạm vi và nhật ký task/commit.
- `docs/HUONG-DAN-CAI-DAT-VA-CHAY-MOBILE.md`: cài đặt, chạy, EAS build, deployment và troubleshooting.
- `docs/NGHIEM-THU-MOBILE-TRUC-TIEP.md`: 20 ca test tay và mẫu ghi evidence.
- `docs/BAN-GIAO-MOBILE-APP.md`: trạng thái, việc cần làm, giới hạn và rollback.

## Bằng chứng phần mềm 18/10/2026

- Backend `mvn test`: PASS, 15 tests; migration đến V3, push dùng mock transport.
- Frontend `npm test`: PASS, 12 tests; `npm run build`: PASS, có warning chunk >500 kB.
- Mobile typecheck/lint: PASS; Jest: 8 suites/28 tests PASS.
- Expo Doctor 1.21.5: 20/20 PASS; web export: PASS.
- `git diff --check`: PASS (cảnh báo chuyển LF/CRLF không phải whitespace error).

Native phone, EAS push, GPS, relay và end-to-end board vẫn là `ready-for-human`, không ghi PASS.
