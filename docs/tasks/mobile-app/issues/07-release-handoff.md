# 07 — Kiểm thử, tài liệu và bàn giao

Status: ready-for-agent
Progress: open
Type: task
Scope: integration, documentation
Blocked by: 01, 02, 03, 04, 05, 06

## Expected behavior

- Có tài liệu kiến trúc/triển khai, nhật ký công việc, hướng dẫn build/run và bàn giao.
- Có checklist test tay trực tiếp cho app, backend, simulator và hardware.
- Ghi rõ PASS/FAIL/CHƯA CHẠY, commit/build/môi trường và giới hạn còn lại.
- Không tuyên bố GPS/relay/end-to-end thật nếu chưa có bằng chứng vật lý.

## Acceptance checks

- Chạy toàn bộ test phần mềm có thể chạy trong workspace.
- Rà credential, `git diff --check`, trạng thái nhánh và lịch sử commit.
