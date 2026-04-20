# Roadmap: Apex Team v1.1

**Created:** 2026-04-20
**Milestone:** v1.1 — Season Management & Schedule
**Phases:** 3 (Continuation from Phase 9)
**Requirements:** 11

## Phase Overview

- [x] **Phase 10: Season Lifecycle & Defaults** - Coaches can explicitly create and manage seasons, including setting default practice locations.
- [ ] **Phase 11: Practice Management & Unified Schedule** - Create practices that leverage season defaults and view a chronological schedule of all team events.
- [ ] **Phase 12: Season-Integrated Games & Analytics** - Games automatically associate with the active season, allowing for filtered views and aggregate performance metrics.

## Phase Details

### Phase 10: Season Lifecycle & Defaults
**Goal**: Establish season management and default settings to organize team data over time.
**Depends on**: Phase 9
**Requirements**: SEAS-03, SEAS-04, SEAS-05, SEAS-06, SEAS-07
**Success Criteria** (what must be TRUE):
  1. Coach can create a new named season with start and end dates.
  2. Coach can edit season details or delete a season.
  3. Coach can set a "default practice location" for a season.
  4. Coach can toggle which season is "Active" for the team (exactly one active).
**Plans**: 4 plans
- [x] 10-01-PLAN.md — Backend Schema & DTOs
- [x] 10-02-PLAN.md — Backend Business Logic
- [x] 10-03-PLAN.md — Frontend Scaffolding & Navigation
- [x] 10-04-PLAN.md — Frontend Detail View
**UI hint**: yes

### Phase 11: Practice Management & Unified Schedule
**Goal**: Integrate practice sessions into the team workflow and provide a single view for all upcoming events.
**Depends on**: Phase 10
**Requirements**: PRAC-01, PRAC-02, SCHD-02
**Success Criteria** (what must be TRUE):
  1. Coach can create, edit, and delete practice sessions with date, time, and location.
  2. New practices automatically inherit the location from the active season's default.
  3. Team Dashboard features a "Schedule" tab that displays both Games and Practices in a unified chronological list.
**Plans**: 3 plans
- [ ] 11-01-PLAN.md — Event-Centric Data Migration
- [ ] 11-02-PLAN.md — Backend Events Refactor & Practice Logic
- [ ] 11-03-PLAN.md — Frontend Unified Schedule & Practice Management
**UI hint**: yes

### Phase 12: Season-Integrated Games & Analytics
**Goal**: Automate game-season association and provide aggregate insights into season performance.
**Depends on**: Phase 11
**Requirements**: GAME-06, GAME-07, GAME-08
**Success Criteria** (what must be TRUE):
  1. New games are automatically associated with the currently active season.
  2. Coach can filter the game list by season (defaulting to the active one).
  3. Season dashboard displays aggregate stats (wins, losses, goals for/against) for the selected season.
**Plans**: TBD
**UI hint**: yes

## Progress Table

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 10. Season Lifecycle & Defaults | 4/4 | Completed | 2026-04-20 |
| 11. Practice Management & Unified Schedule | 0/3 | Not started | - |
| 12. Season-Integrated Games & Analytics | 0/0 | Not started | - |

---

## v1.0 Roadmap Reference (Archived)

For historical context, see `.planning/archive/v1.0/ROADMAP.md` (once archived).

Summary of v1.0 Phases:
- Phase 1: Workspace & Data Foundation
- Phase 2: Authentication
- Phase 3: Teams & Sport Configuration
- Phase 4: Roster Management
- Phase 5: Games & Lineup
- Phase 6: Live Game Console
- Phase 7: PWA & Native Builds
- Phase 8: UI Rework
- Phase 9: Season Defaults & Advanced Console
