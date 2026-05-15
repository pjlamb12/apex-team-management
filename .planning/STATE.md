---
gsd_state_version: 1.2
milestone: v2.0
milestone_name: Team Analytics & Playing Time
status: Completed
last_updated: "2026-05-12T11:00:00Z"
progress:
  total_phases: 6
  completed_phases: 6
  total_plans: 4
  completed_plans: 4
  percent: 100
---

# State: Apex Team

## Project Reference

See: .planning/PROJECT.md

**Core value:** A coach shows up to a game and can instantly see who's on the field, swap players, and track what happened.
**Current focus:** Developing a comprehensive analytics suite to track playing time, participation, and performance.
**Current Position:** Milestone v2.0 — Completed

## Current Milestone

**v2.0 — Team Analytics & Playing Time**

Phase: Phase 34: Export & Polish (Completed)
Plan: N/A

Progress: ██████████ 100%

## Decision Log

| Date | Decision | Context |
|------|----------|---------|
| 2026-05-12 | Server-side Export Engine | Decided to implement PDF/CSV generation on the backend (NestJS) to ensure professional quality and support future scalability. UI polish will prioritize Dark Mode Accessibility and Mobile Chart Refinement. |
| 2026-05-08 | Individual Player Profiles | Implemented detailed player profile modals accessible from the roster. This view combines participation history, performance stats (goals/assists), and position heat maps for deep player development analysis. |
| 2026-05-08 | Roster Performance Dashboard | Created a centralized team analytics view with segment-based navigation for Performance, Participation, and Playtime. This provides coaches with high-level leaderboards and detailed breakdowns. |
| 2026-05-06 | Aggregated Metrics API | Performance metrics (goals, assists, cards) are aggregated on-the-fly from the event stream. This ensures accuracy even if events are added/removed retroactively. |
| 2026-05-06 | Attendance Sync | Game attendance is automatically synced from the lineup when a game is marked as 'completed' in `EventsService`. A manual sync button is also provided in the UI. |
| 2026-05-06 | Absolute vs Relative Time | Playing Time Engine uses gameTimeMs (relative to period start) if available, falling back to minuteOccurred. It handles PERIOD_END to support multi-period games correctly. |
| 2026-05-05 | Event-Sourced Analytics | Playing time will be derived dynamically from the `GameEvent` stream to ensure consistency with the live console's undo/redo capabilities. |
| 2026-05-05 | Attendance Parity | Participation will track both practices and games to provide a full picture of player commitment. |

## Active Context

- Phase 33: Player Profile Analytics completed.
- Individual player performance and participation history implemented.
- Position distribution analysis integrated into player profiles.
- Phase 34: Export & Polish context gathered. Decisions locked for server-side generation, multi-format reports, and dark mode/mobile UI polish.

## Session Continuity

Last session: 2026-05-12
Stopped at: Phase 34: Export & Polish context gathered. Ready for planning.

## Accumulated Context

### Roadmap Evolution
- Milestone v1.4: Assistant coach onboarding delivered.
- Milestone v1.5: Real-time synchronization delivered.
- Milestone v1.6: Calendar sync, recurring events, and weather delivered.
- Milestone v1.7: Drill Import Foundation delivered.
- Milestone v2.0: Team Analytics & Playing Time (Started).
