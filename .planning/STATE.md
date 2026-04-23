---
gsd_state_version: 1.2
milestone: v1.2
milestone_name: Practice Planning & Drill Library
status: Milestone v1.2 started
last_updated: "2026-04-21T18:00:00Z"
progress:
  total_phases: 3
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# State: Apex Team

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-20)

**Core value:** A coach shows up to a game and can instantly see who's on the field, swap players, and track what happened.
**Current focus:** Practice planning, drill library, and live session execution.
**Current Position:** Phase 14: Drill Library Foundation Completed — Moving to Phase 15: Practice Execution

## Current Milestone

**v1.2 — Practice Planning & Drill Library**

Phase: Phase 15: Practice Drills Integration (Completed)
Plan: 15-05

Progress: ▓▓▓▓▓▓▓▓▓░ 90%


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
| 2026-04-20 | Phase 10 completed | Season Lifecycle & Defaults implemented. Moving to Phase 11. |
| 2026-04-20 | Phase 11 completed | Practice Management & Unified Schedule implemented. Moving to Phase 12. |
| 2026-04-21 | Non-negative integer validation for scores | Ensure goals_for and goals_against are valid. |
| 2026-04-21 | Integrated season selection directly into Schedule tab | Ensure coaches can view past and present games in a single view. |
| 2026-04-21 | Extracted data-access/team library | Break circular dependencies and fix test resolution issues. |
| 2026-04-21 | Multi-period support & explicit End Game | Enable granular game tracking and lifecycle management. |
| 2026-04-21 | Milestone v1.1 Completed | Season Management, Schedule, and Advanced Game Lifecycle fully delivered. |
| 2026-04-21 | Start Milestone v1.2 | Focus shifts to Drill Library and Practice Planning. |
| 2026-04-21 | Phase 14 completed | Drill Library Foundation (Backend, UI components, and Dashboard integration) complete. |
| 2026-04-23 | Phase 15 completed | Practice Drills Integration (Backend entities/service/API, Client data-access, and Practice Console UI) complete. |

## Active Context

- Milestone v1.2 in progress.
- Phase 15 completed.
- Current goal: Verify Phase 15 and prepare for Milestone v1.2 wrap-up.

## Session Continuity

Last session: 2026-04-21
Stopped at: Phase 14 complete. Drill Library browser and editor integrated. Ready for Phase 15.

## Accumulated Context

### Roadmap Evolution
- Milestone v1.1 complete: Delivered SEAS-03 to SEAS-07, PRAC-01, PRAC-02, SCHD-02, GAME-06 to GAME-11.
- Milestone v1.2 in progress: Phase 14 complete. Delivered DRIL-01 to DRIL-04.
