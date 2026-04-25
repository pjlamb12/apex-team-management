---
gsd_state_version: 1.2
milestone: v1.3
milestone_name: Rotation Engine & Tactical Subs
status: In planning
last_updated: "2026-05-10T10:00:00Z"
progress:
  total_phases: 3
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# State: Apex Team

## Project Reference

See: .planning/PROJECT.md

**Core value:** A coach shows up to a game and can instantly see who's on the field, swap players, and track what happened.
**Current focus:** High-performance substitutions, sub-queuing, and automated rotation engine.
**Current Position:** Starting Milestone v1.3

## Current Milestone

**v1.3 — Rotation Engine & Tactical Subs**

Phase: Phase 17: Tactical Sub-Queue (Planning)
Plan: TBD

Progress: ░░░░░░░░░░ 0%


## Decision Log

| Date | Decision | Context |
|------|----------|---------|
| 2026-04-14 | Soccer-only v1, sport-agnostic architecture | Build positions/config as data, only seed soccer |
| 2026-04-14 | Manual swaps over auto-rotations for v1 | Rotation engine deferred to v1.3 |
| 2026-04-14 | Event-sourced game state | Immutable events for lineup changes, enables undo + analytics |
| 2026-05-10 | Start Milestone v1.3 | Focusing on Rotation Engine and Sub-Queue as requested by user. |
| 2026-05-10 | Sub-Queue as "Staging" Layer | Implement a pending state for substitutions to allow bulk apply, rather than immediate execution. |

## Active Context

- Milestone v1.2 Completed.
- Milestone v1.3 Roadmap defined and Requirements updated.
- Ready to begin Phase 17.

## Session Continuity

Last session: 2026-04-23 (v1.2 wrap-up)
Stopped at: v1.2 Complete.

## Accumulated Context

### Roadmap Evolution
- Milestone v1.0 complete: Delivered core team/game/lineup management.
- Milestone v1.1 complete: Delivered Season Management & Schedule.
- Milestone v1.2 complete: Delivered Practice Planning & Drill Library.
- Milestone v1.3 starting: Focusing on Rotation Engine & Tactical Subs.
