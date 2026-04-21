---
gsd_state_version: 1.1
milestone: v1.1
milestone_name: Season Management & Schedule
status: Phase 12 planning
last_updated: "2026-04-20T17:00:00Z"
progress:
  total_phases: 3
  completed_phases: 2
  total_plans: 4
  completed_plans: 4
  percent: 100
---

# State: Apex Team

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-20)

**Core value:** A coach shows up to a game and can instantly see who's on the field, swap players, and track what happened.
**Current focus:** Season management, practice sessions, and unified schedule.
**Current Position:** Milestone v1.1 — Phase 12: Season-Integrated Games & Analytics

## Current Milestone

**v1.1 — Season Management & Schedule**

Phase: Phase 11: Practice Management & Unified Schedule
Plan: Completed

Progress: ▓▓▓▓▓▓▓▓▓▓ 100%


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

## Active Context

- Phase 10 delivered: Season creation, management, active toggle, and practice location defaults.
- Phase 11 delivered: Practice creation/editing, unified schedule tab showing games and practices chronologically, time-of-day display on events.
- App is mobile-first, PWA-ready, and supports dark mode.
- Core coaching console is functional.
- Milestone v1.1 roadmap defines the next three phases (10, 11, 12).

## Session Continuity

Last session: 2026-04-20
Stopped at: Phase 10 completed. Ready for Phase 11: Practice Management & Unified Schedule planning.

## Accumulated Context

### Roadmap Evolution
- Phase 10-12 defined: Season Lifecycle & Defaults, Practice Management & Unified Schedule, and Season-Integrated Games & Analytics.
