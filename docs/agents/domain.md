# Domain documentation

## Layout

Use one shared context for the coursework system, including hardware, firmware, and future backend/frontend integration:

- Glossary: `docs/GLOSSARY.md`.
- Architecture decision records: `docs/adr/NNNN-<decision>.md`.
- Skill configuration: `docs/agents/`.
- Local work tracking: `docs/tasks/`.

This layout overrides the skills' default root-level glossary and `.scratch/` paths. Multiple software directories do not require separate glossaries at this project's scale.

## Consumer rules

- Before exploring an area, read `docs/GLOSSARY.md` if it exists and relevant decisions in `docs/adr/`.
- If these do not exist, proceed without creating empty placeholders. Create them when terminology or a real design decision is resolved.
- Use defined terms consistently; make conflicting decisions explicit instead of silently overriding an ADR.
- Read the current hardware/firmware guide and GPS integration notes for wiring, payloads, and test procedures.
- Distinguish HARDWARE/SIMULATED data, current fix/last-known location, command acceptance/execution, and build success/physical test success.
- Keep records short and proportional to an IoT breadboard coursework project. Preserve one shared system model when backend/frontend work is authorized later.
