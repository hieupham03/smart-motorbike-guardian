# Project guidance

This repository is an IoT coursework prototype running on a breadboard/testbed. Aim for A/A+ quality through correct behavior, a complete IoT data/control path, clear explanations, and measured demo evidence. Do not treat it as a production vehicle security product.

## Current scope

- Prioritize hardware, firmware, and real NEO-6M GPS integration on the ESP32-S3 N16R8 sensor node.
- Backend and frontend code already exist. Read them when needed to understand interfaces, but change or clone additional member repositories only when the user requests that scope.
- Keep the workflow simple: clarify requirements, implement, verify, record results. Create specs or tickets only when useful; avoid unnecessary infrastructure or architectural rewrites.
- Distinguish compilation/host tests from hardware verification. Never claim GPS fix, relay behavior, or end-to-end operation without evidence.
- Follow `docs/HUONG-DAN-HARDWARE-FIRMWARE-V2-GPS.md` for current wiring and manual checks. Confirm electrical assumptions against the actual breakout and board.
- Use `firmware/node_a_gateway/` and `firmware/node_b_sensor/` as canonical firmware. When changing files mirrored in `node_a/` and `node_b/`, keep the corresponding copies synchronized.
- Keep credentials out of committed files and tool output.

## Agent skills

### Issue tracker

Track work as local Markdown under `docs/tasks/<feature>/`; do not publish external issues automatically. See `docs/agents/issue-tracker.md`.

### Triage labels

Use the five default triage roles, separating work requiring physical hardware from work an agent can perform. See `docs/agents/triage-labels.md`.

### Domain docs

Use one shared context: `docs/GLOSSARY.md` and `docs/adr/`, created when needed. See `docs/agents/domain.md`.
