# Quick Task Plan: Issue #66 - Basketball Phase 3: Live Game Console Engine, Fouls/Bonus & Full Box Score

Part of Epic #63.

## Overview
Implement the full live basketball game console engine:
1. **LiveGameStateService Extensions**:
   - Multi-point score tracking (1PT, 2PT, 3PT makes and opponent points).
   - Running quarter/period scores (`Q1`, `Q2`, `Q3`, `Q4`, `OT1`...) with score deltas for each period.
   - Personal fouls with automatic `fouledOut` flag when reaching `foulLimit` (default 5, configurable to 6).
   - Team fouls per period with automatic `BONUS` and `DOUBLE BONUS` state (threshold default 5, double bonus default 10).
   - Timeouts tracking for team and opponent (default 5, tracking used & remaining).
   - Full Box Score aggregation per player:
     `MIN`, `PTS`, `FGM-A`, `FG%`, `3PM-A`, `3P%`, `FTM-A`, `FT%`, `OREB`, `DREB`, `REB`, `AST`, `STL`, `BLK`, `TO`, `PF`, `fouledOut`, and `+/-` (plus/minus calculated during on-court stints).
2. **ConsoleWrapper Integration**:
   - Scoreboard header showing Home vs Away points, Period/Quarter, Team Fouls & BONUS badge, Timeouts remaining.
   - Opponent quick-action buttons: `+1`, `+2`, `+3`, `Opp Foul`, `Opp Timeout`.
   - Collapsible live Team Box Score table with all advanced columns (MIN, PTS, FGM-A, FG%, 3PM-A, 3P%, FTM-A, FT%, REB, AST, STL, BLK, TO, PF, +/-).
   - Quarter-by-quarter score summary table (Q1, Q2, Q3, Q4, Total).
3. **Comprehensive Unit Testing**:
   - LiveGameStateService basketball engine tests.
   - ConsoleWrapper basketball scoreboard and box score tests.
   - Full workspace verification (`client-feature-game-console`, `frontend`, `api`).

## Execution Steps
1. **Extend `LiveGameStateService`**:
   - Add timeout tracking signals (`_timeoutsLimit`, `teamTimeoutsRemaining`, `opponentTimeoutsRemaining`, `logTimeout`, `logOpponentTimeout`).
   - Add `doubleBonusThreshold` and update `basketballFouls` with `bonusState: 'NONE' | 'BONUS' | 'DOUBLE_BONUS'`.
   - Implement `basketballPeriodScores` computed signal (calculating per-period team and opponent points and cumulative totals).
   - Implement basketball plus/minus (`+/-`) and minute tracking in `basketballBoxScore` or enhanced `playerStats`.
   - Add helper methods for timeout usage and opponent timeout.
2. **Update `ConsoleWrapper` Component**:
   - Add opponent timeout button (`addOpponentBasketballTimeout`) and team timeout button (`callTeamTimeout`).
   - Update scoreboard header for basketball to show timeouts remaining and BONUS/DOUBLE BONUS indicators.
   - Enhance the box score table below the court to be collapsible with full columns and a Quarter-by-Quarter line score table.
3. **Write Unit Tests**:
   - Add tests for quarter scoring, bonus/double bonus, timeouts, plus/minus, and full box score in `live-game-state.service.spec.ts`.
   - Add tests for basketball timeouts and box score table in `console-wrapper.spec.ts`.
4. **Build & Verify**:
   - `npx nx test client-feature-game-console --no-watch`
   - `npx nx test frontend --no-watch`
   - `npx nx build frontend`
   - `npx nx build api`
