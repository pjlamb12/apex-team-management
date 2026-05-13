# Roadmap: Apex Team

## Milestone v2.0: Team Analytics & Playing Time

**Goal**: Transform captured game and practice data into actionable insights for coaches, focusing on fair playing time, player development, and performance tracking.

## Phases

- [x] **Phase 29: Playing Time Engine** - Implementation of the core logic to derive minutes and positions from game events.
- [x] **Phase 30: Participation & Attendance** - Attendance tracking for practices and games with commitment reporting.
- [x] **Phase 31: Performance Metrics Aggregator** - Backend and API for aggregating goals, assists, and other game events.
- [x] **Phase 32: Analytics Dashboard (Team View)** - Centralized dashboard for team-level stats and leaderboards.
- [x] **Phase 33: Player Profile Analytics** - Detailed individual performance views and position heat maps.
- [ ] **Phase 34: Export & Polish** - CSV/PDF reporting and final UI refinements.

## Phase Details

### Phase 29: Playing Time Engine
**Goal**: Calculate minutes played and position distribution from event-sourced game data.
**Depends on**: Milestone v1.7
**Requirements**: ANLY-PT-01, ANLY-PT-02, ANLY-POS-01, ENG-PT-01
**Success Criteria** (what must be TRUE):
  1. A game's total minutes are accurately split between players based on `SUB` events.
  2. "Time per Position" is calculated for each player in a completed game.
  3. Playing time updates automatically as game events are added or removed (undo).
**Plans**: TBD

### Phase 30: Participation & Attendance
**Goal**: Track attendance for all team events and report on player commitment.
**Depends on**: Phase 29
**Requirements**: ANLY-PART-01, ANLY-PART-02, ANLY-PART-03, ENG-PT-02, UI-ATT-01
**Success Criteria** (what must be TRUE):
  1. Coach can mark players as Present/Absent/Tardy/Injured for any practice or game.
  2. Participation percentage (Events Attended / Total Events) is visible in roster views.
  3. Game attendance is defaulted based on the game's roster/lineup.
**Plans**: TBD
**UI hint**: yes

### Phase 31: Performance Metrics Aggregator
**Goal**: Provide a robust API for fetching aggregated performance stats.
**Depends on**: Phase 29
**Requirements**: ANLY-PERF-01, ANLY-PERF-02, API-ANLY-01
**Success Criteria** (what must be TRUE):
  1. `GET /api/analytics/stats` returns aggregated counts for goals, assists, and cards.
  2. Stats can be filtered by `seasonId`, `startDate`, and `endDate`.
  3. Totals are consistent across different aggregation granularities (game vs season).
**Plans**: TBD

### Phase 32: Analytics Dashboard (Team View)
**Goal**: Visualize team-level trends and achievements.
**Depends on**: Phase 31
**Requirements**: ANLY-DASH-01, UI-DASH-01
**Success Criteria** (what must be TRUE):
  1. A "Team Analytics" tab is accessible from the main navigation.
  2. Dashboard displays playing time distribution charts (bar/pie).
  3. Top performers (goals/assists) are highlighted in a leaderboard.
**Plans**: TBD
**UI hint**: yes

### Phase 33: Player Profile Analytics
**Goal**: Deep-dive into individual player growth and data.
**Depends on**: Phase 32
**Requirements**: ANLY-DASH-02, UI-PROF-01
**Success Criteria** (what must be TRUE):
  1. Tapping a player in the roster opens a profile with an "Analytics" sub-view.
  2. Profile shows a position heat map (where they play most often).
  3. Historical playing time trend (minutes per game) is visualized.
**Plans**: TBD
**UI hint**: yes

### Phase 34: Export & Polish
**Goal**: Enable sharing of data and ensure a professional finish.
**Depends on**: Phase 33
**Requirements**: ANLY-DASH-03
**Success Criteria** (what must be TRUE):
  1. Coach can download a PDF summary of team analytics.
  2. CSV export of raw player stats is available for external use.
  3. UI adheres to "Athletic Professional" high-contrast theme across all new views.
**Plans**: 4 plans
- [ ] 34-01-PLAN.md — Export Infrastructure & CSV Export
- [ ] 34-02-PLAN.md — PDF Export Engine
- [ ] 34-03-PLAN.md — Frontend Export UI & Mobile Sharing
- [ ] 34-04-PLAN.md — UI Polish & Dark Mode
**UI hint**: yes

## Progress Table

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 23. iCal Sync Integration | 2/2 | Completed | 2026-05-05 |
| 24. Recurring Events | 2/2 | Completed | 2026-05-05 |
| 25. Weather Integration | 1/1 | Completed | 2026-05-05 |
| 26. Structured Locations | 1/1 | Completed | 2026-05-05 |
| 27. Import API & Validation | 2/2 | Completed | 2026-05-05 |
| 28. Drill Import UI | 1/1 | Completed | 2026-05-05 |
| 29. Playing Time Engine | 1/1 | Completed | 2026-05-06 |
| 30. Participation & Attendance | 1/1 | Completed | 2026-05-06 |
| 31. Performance Metrics Aggregator | 1/1 | Completed | 2026-05-06 |
| 32. Analytics Dashboard (Team View) | 1/1 | Completed | 2026-05-08 |
| 33. Player Profile Analytics | 1/1 | Completed | 2026-05-08 |
| 34. Export & Polish | 0/4 | Not started | - |
