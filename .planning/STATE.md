---
gsd_state_version: 1.2
milestone: v1.4
milestone_name: Assistant Coach Invites
status: Planning
last_updated: "2026-05-12T16:15:00Z"
progress:
  total_phases: 1
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# State: Apex Team

## Project Reference

See: .planning/PROJECT.md

**Core value:** A coach shows up to a game and can instantly see who's on the field, swap players, and track what happened.
**Current focus:** Allow head coaches to generate and share alphanumeric join codes with assistant coaches.
**Current Position:** Milestone v1.4 — Planning

## Current Milestone

**v1.4 — Assistant Coach Invites**

Phase: Phase 20: Team Join Codes & Assistant Onboarding
Plan: 20-01-PLAN.md (Pending)

Progress: ░░░░░░░░░░ 0%

## Decision Log

| Date | Decision | Context |
|------|----------|---------|
| 2026-04-27 | Phase 20 Context | Manual refresh for code, 6-character alphanumeric format, dashboard modal for join flow, full access except deletion for assistants. |
| 2026-05-12 | Assistant Coaches via Code | Assistant coach invites promoted to v1.4 before parent access. Mojo-style alphanumeric codes chosen over email links for simplicity. |
| 2026-05-12 | Tactical Polish | Banner UI in header and high-performance tap-tap interactions confirmed. |
| 2026-05-12 | Conflict Resolution | Manual staged subs block auto-alerts to prevent UI clutter. |
| 2026-05-12 | Interval Boundary Optimization | engine triggers on strict clock intervals (8, 16, 24...) to maintain rhythm. |
| 2026-05-10 | Event-Sourced Playtime | derive minutes from SUB events in the log for 100% undo compatibility. |
| 2026-05-10 | Goalie Protection | exclude slot index 0 (GK) from automated rotation suggestions. |
| 2026-05-10 | Seconds-level Precision | track playtime in seconds (ms internal) for maximum accuracy. |
| 2026-05-10 | Auto-Stage Workflow | interval alerts automatically populate the Sub-Queue for one-tap application. |
| 2026-04-24 | Bulk substitution staging with batch-apply | Deliver high-performance substitution workflow for coaches. |
| 2026-04-24 | Undo events are filtered from UI | Ensure Event Log remains clean after corrections. |

## Active Context

- Milestone v1.4 in planning.
- Phase 20: Team Join Codes & Assistant Onboarding

## Session Continuity

Last session: 2026-04-27
Stopped at: Phase 20 context gathered
Resume file: .planning/phases/20-team-join-codes-assistant-onboarding/20-CONTEXT.md

## Accumulated Context

### Roadmap Evolution
- Milestone v1.3 complete.
- Phase 17 complete: Sub-Queue and bulk apply delivered.
- Phase 18 complete: Playtime tracking and automated rotation engine integrated.
- Phase 19 complete: Alerts banner and tactical polish delivered.
- Milestone v1.4 established: Shifted Assistant Coach invites forward via join code mechanics.
