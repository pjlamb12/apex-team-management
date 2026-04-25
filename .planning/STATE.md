---
gsd_state_version: 1.2
milestone: v1.3
milestone_name: Rotation Engine & Tactical Subs
status: In Progress
last_updated: "2026-05-12T15:00:00Z"
progress:
  total_phases: 3
  completed_phases: 2
  total_plans: 11
  completed_plans: 9
  percent: 81
---

# State: Apex Team

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-10)

**Core value:** A coach shows up to a game and can instantly see who's on the field, swap players, and track what happened.
**Current focus:** Tactical substitution staging and automated rotation logic.
**Current Position:** Milestone v1.3 — Phase 19: Tactical Polish & Alerts

## Current Milestone

**v1.3 — Rotation Engine & Tactical Subs**

Phase: Phase 19: Tactical Polish & Alerts
Plan: 19-01

Progress: ▓▓▓▓▓▓▓▓░░ 81%

## Decision Log

| Date | Decision | Context |
|------|----------|---------|
| 2026-05-12 | Interval Boundary Optimization | engine triggers on strict clock intervals (8, 16, 24...) to maintain rhythm. |
| 2026-05-10 | Event-Sourced Playtime | derive minutes from SUB events in the log for 100% undo compatibility. |
| 2026-05-10 | Goalie Protection | exclude slot index 0 (GK) from automated rotation suggestions. |
| 2026-05-10 | Seconds-level Precision | track playtime in seconds (ms internal) for maximum accuracy. |
| 2026-05-10 | Auto-Stage Workflow | interval alerts automatically populate the Sub-Queue for one-tap application. |
| 2026-04-24 | Bulk substitution staging with batch-apply | Deliver high-performance substitution workflow for coaches. |
| 2026-04-24 | Undo events are filtered from UI | Ensure Event Log remains clean after corrections. |

## Active Context

- Milestone v1.3 — Phase 18 complete.
- Phase 19: Tactical Polish & Alerts is now In Progress.
- Planning for Phase 19 complete.

## Session Continuity

Last session: 2026-05-12
Stopped at: Phase 19 planning complete.

## Accumulated Context

### Roadmap Evolution
- Milestone v1.2 complete.
- Phase 17 complete: Sub-Queue and bulk apply delivered.
- Phase 18 complete: Playtime tracking and automated rotation engine integrated.
- Phase 19 planned: Alerts banner and tactical polish.
