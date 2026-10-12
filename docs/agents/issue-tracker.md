# Issue tracker: Local Markdown

All issues and specs live in this repository under `docs/tasks/`. This overrides the skills' default `.scratch/` path. A GitHub remote exists, but GitHub Issues and other external trackers are not used for this workflow.

## Conventions

- One feature per directory: `docs/tasks/<feature-slug>/`.
- Optional spec: `docs/tasks/<feature-slug>/spec.md`.
- If tickets are useful, use one file per ticket: `docs/tasks/<feature-slug>/issues/<NN>-<slug>.md`, numbered from `01`.
- Record `Status:` near the top using `docs/agents/triage-labels.md`.
- Record scope (hardware, firmware, backend, frontend, or integration), expected behavior, acceptance checks, and evidence when relevant.
- Append useful discussion under `## Comments`; avoid copying entire conversations.
- Small changes need no ticket. Do not create a backlog or mark tests passed without evidence.

## Skill operations

- "Publish to the issue tracker": create or update the corresponding local Markdown file, not a remote issue.
- "Fetch the relevant ticket": read the referenced local file.
- Store ordinary technical documentation under `docs/`.
- A human performs wiring, voltage measurements, uploads requiring their intervention, and physical observations. An agent may prepare code, instructions, and appropriate host checks.
- Backend/frontend expansion or cloning member repositories requires an explicit user request; installation of these skills does not authorize it.

## Optional wayfinding

Only use this structure for work large enough to need it:

- Map: `docs/tasks/<effort>/map.md`.
- Child tickets: `docs/tasks/<effort>/issues/NN-<slug>.md`.
- Record `Type:` (research/prototype/grilling/task), `Blocked by:` ticket numbers, and a separate `Progress:` (open/claimed/resolved).
- Use `Status:` for triage roles; use `Progress:` for claims and completion.
- Resolve a ticket by recording its answer/evidence and linking it from the map. Do not add this machinery to routine GPS bringup.
