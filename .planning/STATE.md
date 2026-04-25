---
gsd_state_version: 1.2
milestone: v1.3
milestone_name: Rotation Engine & Tactical Subs
status: In Progress
last_updated: "2026-05-10T12:00:00Z"
progress:
  total_phases: 3
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# State: Apex Team

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-10)

**Core value:** A coach shows up to a game and can instantly see who's on the field, swap players, and track what happened.
**Current focus:** Tactical substitution staging and automated rotation logic.
**Current Position:** Starting Milestone v1.3 — Phase 17: Tactical Sub-Queue

## Current Milestone

**v1.3 — Rotation Engine & Tactical Subs**

Phase: Phase 17: Tactical Sub-Queue (Planning)
Plan: N/A

Progress: ▓░░░░░░░░░ 0%

## Decision Log

| Date | Decision | Context |
|------|----------|---------|
| 2026-04-14 | Soccer-only v1, sport-agnostic architecture | Build positions/config as data, only seed soccer |
| 2026-04-14 | Manual swaps over auto-rotations for v1 | Rotation engine deferred to v1.3 |
| 2026-04-14 | Event-sourced game state | Immutable events for lineup changes, enables undo + analytics |
| 2026-04-14 | Head coach only for v1 | Single role, single device. Multi-coach in v2 |
| 2026-04-14 | Game entity has full scheduling fields from v1 | Avoid migration when adding scheduling UI in v2 |
| 2026-04-16 | Added missing frontend proxy configuration during auth test | Added proxy.conf.json handling routing for /api/* without CORS complexity. |
| 2026-04-17 | Phase 5 planned: Games & Lineup | Deliver game creation flow and starting lineup editor. Games scoped to active season. |
| 2026-04-18 | Included team ownership verification in GamesService.create | Mitigate T-5-04-02 by checking coach_id on team |
| 2026-04-18 | Implemented bulk replace for lineup entries | Simplifies client-side lineup editing and Phase 6 swap implementation |
| 2026-04-18 | Use AJV for runtime validation of sport-specific JSON payloads to ensure schema adherence. | Support sport-agnostic event logging with dynamic validation. |
| 2026-04-18 | Store event definitions on the Sport entity to allow for sport-agnostic event logging. | Dynamic events (GOAL, ASSIST, SUB, CARD) defined as data, not hardcoded. |
| 2026-04-18 | YELLOW_CARD and RED_CARD registered as first-class event types in Soccer sport | Resolves sync mismatches where cards were logged locally but rejected by API. |
| 2026-04-18 | Use localStorage for clock persistence keyed by gameId | Ensures game timer survives accidental page refresh (Requirement INFR-03). |
| 2026-04-20 | Start Milestone v1.1 | v1.0 complete with Phase 9 advanced features. v1.1 focuses on Season management and Schedule. |
| 2026-04-21 | Milestone v1.1 Completed | Season Management, Schedule, and Advanced Game Lifecycle fully delivered. |
| 2026-04-21 | Start Milestone v1.2 | Focus shifts to Drill Library and Practice Planning. |
| 2026-04-23 | Phase 16 completed | Practice Execution (Pacer) implemented. Milestone v1.2 Complete. |
| 2026-05-10 | Sub-Queue UX: Tap-Tap Staging | Coach will click a bench player then a field player to stage a sub. |
| 2026-05-10 | Rotation Logic: Hybrid Configuration | System will support Pure Equalization, Position-Aware, and Target-Based goals. |
| 2026-05-10 | Auto-Rotation: Suggested (One-Tap Apply) | Interval timer will pre-fill the Sub-Queue and notify the coach to Apply. |
| 2026-05-10 | Persistent Sub-Queue Sidebar/Footer | The staging area and Apply button will be permanently visible during games. |

## Active Context

- Milestone v1.3 started.
- Goal: Implement Tactical Sub-Queue (Phase 17).

## Session Continuity

Last session: 2026-04-23
Stopped at: Milestone v1.2 complete. Ready for v1.3.

## Accumulated Context

### Roadmap Evolution
- Milestone v1.2 complete: Delivered Practice Planning and Drill Library.
- Milestone v1.3 started: Focus on Rotation Engine and Tactical Subs.
