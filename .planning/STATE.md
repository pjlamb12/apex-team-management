---
gsd_state_version: 1.2
milestone: v1.3
milestone_name: Rotation Engine & Tactical Subs
status: In Progress
last_updated: "2026-05-10T00:00:00Z"
progress:
  total_phases: 3
  completed_phases: 1
  total_plans: 9
  completed_plans: 3
  percent: 33
---

# State: Apex Team

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-10)

**Core value:** A coach shows up to a game and can instantly see who's on the field, swap players, and track what happened.
**Current focus:** Tactical substitution staging and automated rotation logic.
**Current Position:** Milestone v1.3 — Phase 18: Rotation Rule Engine

## Current Milestone

**v1.3 — Rotation Engine & Tactical Subs**

Phase: Phase 18: Rotation Engine & Playtime
Plan: 18-02-PLAN.md

Progress: ▓▓▓▓░░░░░░ 44%

## Decision Log

| Date | Decision | Context |
|------|----------|---------|
| 2026-05-10 | Event-Sourced Playtime | derive minutes from SUB events in the log for 100% undo compatibility. |
| 2026-05-10 | Goalie Protection | exclude slot index 0 (GK) from automated rotation suggestions. |
| 2026-05-10 | Seconds-level Precision | track playtime in seconds (ms internal) for maximum accuracy. |
| 2026-05-10 | Auto-Stage Workflow | interval alerts automatically populate the Sub-Queue for one-tap application. |
| 2026-04-24 | Bulk substitution staging with batch-apply | Deliver high-performance substitution workflow for coaches. |
| 2026-04-24 | Undo events are filtered from UI | Ensure Event Log remains clean after corrections. |
| 2026-04-14 | Soccer-only v1, sport-agnostic architecture | Build positions/config as data, only seed soccer |

## Active Context

- Milestone v1.3 — Phase 17 complete.
- Phase 18 planned: Rotation Engine & Playtime.
- Goal: Real-time tracking and fair-play suggestions.

## Session Continuity

Last session: 2026-05-10
Stopped at: Phase 18 planned. Ready for execution.

## Accumulated Context

### Roadmap Evolution
- Milestone v1.2 complete.
- Phase 17 complete: Sub-Queue and bulk apply delivered.
- Phase 18: Ready to implement playtime tracking and rotation logic.
