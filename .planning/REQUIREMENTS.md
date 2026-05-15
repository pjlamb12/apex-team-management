# Requirements: Milestone v2.0 — Team Analytics & Playing Time

**Goal**: Transform captured game and practice data into actionable insights for coaches, focusing on fair playing time, player development, and performance tracking.

## User Stories

### Playing Time & Positions
- **ANLY-PT-01**: As a coach, I want to see exactly how many minutes each player spent on the field so I can ensure fair participation.
- **ANLY-PT-02**: As a coach, I want to see the average playing time per player across the season to identify trends in roster usage.
- **ANLY-POS-01**: As a coach, I want to see which positions a player has played most frequently to assist with player development and versatility.

### Participation & Attendance
- **ANLY-PART-01**: As a coach, I want to mark attendance (Present, Absent, Tardy, Injured) for practices so I can track commitment.
- **ANLY-PART-02**: As a coach, I want game attendance to be automatically linked to the roster/lineup state.
- **ANLY-PART-03**: As a coach, I want to see a participation percentage for each player to help with lineup decisions.

### Performance Metrics
- **ANLY-PERF-01**: As a coach, I want to see aggregated stats (goals, assists, fouls) for players across multiple games.
- **ANLY-PERF-02**: As a coach, I want to see a leaderboard of team stats to celebrate player achievements.

### Insights & Reporting
- **ANLY-DASH-01**: As a coach, I want a dedicated Analytics Dashboard that summarizes team health and performance at a glance.
- **ANLY-DASH-02**: As a coach, I want to view a "Player Card" with individual analytics when tapping a player in the roster.
- **ANLY-DASH-03**: As a coach, I want to export analytics reports to CSV or PDF to share with parents or other coaches.

## Technical Requirements

### Backend (NestJS)
- **ENG-PT-01**: Implement a Playing Time Engine that calculates minutes from the event-sourced `GameEvent` stream.
- **ENG-PT-02**: Store and aggregate attendance records linked to `Event` (practice/game) and `Player`.
- **API-ANLY-01**: Create endpoints for fetching aggregated stats with filters for season, date range, and event type.

### Frontend (Angular 21)
- **UI-DASH-01**: Build a high-level Analytics Dashboard using Ionic grid and chart components.
- **UI-PROF-01**: Enhance Player Profile views with data visualizations (Playing time charts, position heat maps).
- **UI-ATT-01**: Add attendance marking interface to the event detail views.

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| ANLY-PT-01 | Phase 29 | Pending |
| ANLY-PT-02 | Phase 29 | Pending |
| ANLY-POS-01 | Phase 29 | Pending |
| ANLY-PART-01 | Phase 30 | Pending |
| ANLY-PART-02 | Phase 30 | Pending |
| ANLY-PART-03 | Phase 30 | Pending |
| ANLY-PERF-01 | Phase 31 | Pending |
| ANLY-PERF-02 | Phase 31 | Pending |
| ANLY-DASH-01 | Phase 32 | Pending |
| ANLY-DASH-02 | Phase 33 | Pending |
| ANLY-DASH-03 | Phase 34 | Pending |
| ENG-PT-01 | Phase 29 | Pending |
| ENG-PT-02 | Phase 30 | Pending |
| API-ANLY-01 | Phase 31 | Pending |
| UI-DASH-01 | Phase 32 | Pending |
| UI-PROF-01 | Phase 33 | Pending |
| UI-ATT-01 | Phase 30 | Pending |

## Success Criteria
1. Coach can view a game summary showing exact minutes played for every player.
2. Participation rates are accurately calculated for players across a mix of games and practices.
3. Performance stats (goals/assists) are aggregated correctly across a user-defined season.
4. Exported PDF/CSV reports match the data displayed in the dashboard.
