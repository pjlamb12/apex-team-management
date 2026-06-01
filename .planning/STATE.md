---
gsd_state_version: 1.2
milestone: v4.0
milestone_name: Competition & League Management
status: In Progress
last_updated: "2026-05-20T03:00:00Z"
progress:
  total_phases: 3
  completed_phases: 2
  total_plans: 1
  completed_plans: 1
  percent: 66
---

# State: Apex Team

## Project Reference

See: .planning/PROJECT.md

**Core value:** A coach shows up to a game and can instantly see who's on the field, swap players, and track what happened.
**Current focus:** Adding a competition/league layer to group games and providing granular analytics per tournament or session.
**Current Position:** Milestone v4.0 — Phase 42: Grouped Schedule & Analytics

## Current Milestone

**v4.0 — Competition & League Management**

Phase: Phase 42: Grouped Schedule & Analytics
Plan: TBD

Progress: ██████░░░░ 66%

## Decision Log

| Date | Decision | Context |
|------|----------|---------|
| 2026-05-16 | League Layer Addition | Decided to add a `League` (or Competition) entity between `Season` and `Event`. This allows grouping games by session (Fall, Spring) or event (Tournaments) for better organization and reporting. |
| 2026-05-16 | Multi-Season Rosters | Implemented a `season_players` join table to decouple players from teams at a seasonal level. This allows for empty rosters in new seasons while maintaining a historical "Roster Pool" for easy re-onboarding. |
| 2026-05-14 | Tryout Console Scope | Refactored candidate management to be scoped specifically to tryout events rather than a top-level team segment. This keeps the main dashboard focused on the active roster and schedule. |
