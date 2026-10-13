# Quick Task Plan: Issue #67 - Basketball Phase 4: Lineup Editor & Game Summary Box Scores

Part of Epic #63.

## Overview
Implement complete Basketball support in the pre-game Lineup Editor and post-game Game Summary views:
1. **Lineup Editor Integration (`apps/frontend/src/app/teams/events/lineup-editor`)**:
   - Add `BASKETBALL_FORMATIONS` in `@apex-team/shared/util/models` with standard sets: `Standard (PG, SG, SF, PF, C)`, `5-Out Motion`, `4-Out 1-In`, `2-3 Zone`, `Horns (Pick & Roll)`.
   - Update `LineupEditor` component to expose basketball formations in `availableFormations` and `currentFormation`, allowing selection via dropdown.
   - Update `BasketballCourtViewComponent` to accept `[formation]` input and dynamically adjust slot coordinates for different sets.
   - Pass `[activePlayers]="pitchPlayers()"` into `app-basketball-court-view` so the 5 starters with jersey # and positions are rendered on the hardwood court.
   - Verify empty court slot clicking seats bench players directly into unoccupied positions.
2. **Game Summary (`apps/frontend/src/app/teams/events/game-summary`)**:
   - Basketball period formatting: format periods as `1st Quarter`, `2nd Quarter`, `3rd Quarter`, `4th Quarter`, `Overtime` for 4-quarter games (and `1st Half`, `2nd Half` for 2 halves). Default period count for Basketball to 4.
   - Post-Game Basketball Box Score tab (`activeSegment === 'boxscore'`):
     - Compute `basketballBoxScore` with `MIN`, `PTS`, `FGM-A`, `FG%`, `3PM-A`, `3P%`, `FTM-A`, `FT%`, `OREB`, `DREB`, `REB`, `AST`, `STL`, `BLK`, `TO`, `PF`, `+/-`.
     - Compute `basketballPeriodScores` for line score display (Q1, Q2, Q3, Q4, Total).
     - Render full box score table with team totals row.
   - Interactive Post-Game Shot Chart tab (`activeSegment === 'shot-chart'`):
     - Compute `basketballShots` from game events (`MADE_1PT`, `MISSED_1PT`, `MADE_2PT`, `MISSED_2PT`, `MADE_3PT`, `MISSED_3PT`).
     - Render `app-basketball-court-view` with shot filters (All, Makes, Misses) and player filters.
   - Event log formatting:
     - Render basketball icons and event descriptions (`🏀 3PT by #11 Curry (Assist: #23 Green)`, `🛑 Block by #3 Davis`, `⚠️ Foul on #7 Brown`, etc.).
3. **Unit Tests & Verification**:
   - Add tests in `lineup-editor.spec.ts` for basketball formation selection, slot assignment, and court view rendering.
   - Add tests in `game-summary.spec.ts` for basketball period labels, basketball box score computation, shot chart event filtering, and basketball event log formatting.
   - Run `nx test frontend --no-watch`, `nx test client-feature-game-console --no-watch`, `nx build frontend`, `nx build api`.
