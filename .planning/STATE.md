# State: Apex Team

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-14)

**Core value:** A coach shows up to a game and can instantly see who's on the field, swap players, and track what happened.
**Current focus:** Phase 1 — Workspace & Data Foundation

## Current Milestone

**v1 — Game Day Console**

| Phase | Name | Status | Requirements |
|-------|------|--------|--------------|
| 1 | Workspace & Data Foundation | ○ Pending | INFR-01, INFR-02, TEAM-03 |
| 2 | Authentication | ○ Pending | AUTH-01, AUTH-02, AUTH-03, AUTH-04 |
| 3 | Teams & Sport Configuration | ○ Pending | TEAM-01, TEAM-02, TEAM-04, TEAM-05 |
| 4 | Roster Management | ○ Pending | ROST-01, ROST-02, ROST-03, ROST-04 |
| 5 | Games & Lineup | ○ Pending | GAME-01..04, LIVE-01, LIVE-02 |
| 6 | Live Game Console | ○ Pending | LIVE-03..08, INFR-03 |
| 7 | PWA & Native Builds | ○ Pending | INFR-04, INFR-05, INFR-06 |

Progress: ░░░░░░░░░░ 0%

## Decision Log

| Date | Decision | Context |
|------|----------|---------|
| 2026-04-14 | Soccer-only v1, sport-agnostic architecture | Build positions/config as data, only seed soccer |
| 2026-04-14 | Manual swaps over auto-rotations for v1 | Rotation engine deferred to v1.3 |
| 2026-04-14 | Event-sourced game state | Immutable events for lineup changes, enables undo + analytics |
| 2026-04-14 | Head coach only for v1 | Single role, single device. Multi-coach in v2 |
| 2026-04-14 | Game entity has full scheduling fields from v1 | Avoid migration when adding scheduling UI in v2 |

## Active Context

- Fresh Nx 22.6.5 scaffold with Angular 21 frontend
- No backend, no database, no libraries created yet
- Codebase mapped in .planning/codebase/
- Research completed in .planning/research/

---
*Last updated: 2026-04-14 after project initialization*
