---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: Defining requirements
last_updated: "2026-04-20T00:35:00Z"
progress:
  total_phases: 0
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# State: Apex Team

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-20)

**Core value:** A coach shows up to a game and can instantly see who's on the field, swap players, and track what happened.
**Current focus:** Defining requirements
**Current Position:** Milestone v1.1 Season Management & Gaps

## Current Milestone

**v1.1 — Season Management & Gaps**

Phase: Not started
Plan: —

Progress: ░░░░░░░░░░ 0%


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

## Active Context

- Phase 6 Live Game Console complete and verified.
- Touch-optimized substitution engine (2 taps) implemented and reactive.
- Event-sourced game state with Undo support implemented.
- Optimized backend sync with AJV validation and correct payload mapping.
- Game clock persists across page reloads.

## Session Continuity

Last session: 2026-04-18
Stopped at: Session resumed — Phase 6 verified and complete, ready for Phase 7

## Accumulated Context

### Roadmap Evolution
- Phase 8 added: UI Rework — resolve dark-theme inconsistencies (black backgrounds, dark-gray-on-black contrast)

---
*Last updated: 2026-04-19 — Phase 8 added*
