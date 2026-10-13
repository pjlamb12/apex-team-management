# Quick Execution Plan: Basketball Phase 6 - Analytics, Player Profiles & Demo Team Seeder

**Issue**: #69 (`feat(basketball): Phase 6 - Analytics, Player Profiles & Demo Team Seeder`)
**Branch**: `feat/issue-64-basketball-foundation`

---

## 1. Overview & Goals
Extend backend metrics services, team analytics dashboards, player profiles, and the demo team seeder for Basketball:
1. **Backend Analytics**:
   - `PerformanceMetricsService`: Aggregate basketball statistics (PTS, REB OFF/DEF/TOT, AST, STL, BLK, TO, PF, FGM/A, 3PM/A, FTM/A, GP).
   - `PlayerAnalyticsService`: Compute per-game averages (PPG, RPG, APG, SPG, BPG) and shooting percentages (FG%, 3P%, FT%). Include basketball metrics in player history game logs.
   - `LlmExportService`: Format basketball match logs, quarter timelines, and positional/playtime distribution for AI exports.
2. **Frontend Models & Team Analytics**:
   - Update `PlayerPerformanceMetrics` and `PlayerProfileAnalytics` in `@apex-team/client/data-access/team`.
   - Team Analytics: Summary KPI cards (Points For, Points Against, Point Diff), Leaderboards (Scorers, Rebounders, Playmakers, Steals, Blocks), and Roster Performance Table with basketball statistics.
3. **Player Profile**:
   - Basketball KPI cards (PPG, RPG, APG, STL, BLK).
   - Shooting Splits card (FG%, 3P%, FT%).
   - Game history line score with basketball stat badges.
4. **Demo Team Seeder**:
   - Seed `Apex Ballers (Demo)`: 12-player roster (PG, SG, SF, PF, C), U14 basketball league (5 on court, 4 quarters of 8 min), completed past game (64-58) with realistic event timeline, attendance, and lineups.
   - Add Basketball radio option to demo seeder alert in `teams-list.ts`.

---

## 2. Detailed Task Breakdown

### Step 1: Backend Analytics (`apps/api/src/analytics/`)
- `performance-metrics.service.ts`:
  - Extend `PlayerPerformanceMetrics` interface with basketball fields.
  - In `getMetricsForEvents`: Process `MADE_1PT`, `MISSED_1PT`, `MADE_2PT`, `MISSED_2PT`, `MADE_3PT`, `MISSED_3PT`, `REBOUND_OFFENSIVE`, `REBOUND_DEFENSIVE`, `STEAL`, `BLOCK`, `TURNOVER`, `FOUL`, `ASSIST`.
  - In `initializeMetrics`: Default basketball fields to 0.
- `player-analytics.service.ts`:
  - Extend `PlayerHistoryEntry` and `PlayerProfileAnalytics` with basketball fields.
  - Compute averages (`ppg`, `rpg`, `apg`, `spg`, `bpg`) and shooting splits (`fgPct`, `fg3Pct`, `ftPct`).
  - Populate basketball stats in `history`.
- `export/llm-export.service.ts`:
  - Format basketball events in game timeline and positional playtime table.
- Unit tests:
  - `performance-metrics.service.spec.ts`
  - `player-analytics.service.spec.ts`
  - `llm-export.service.spec.ts`

### Step 2: Shared Client Data Access Models
- `libs/client/data-access/team/src/lib/analytics.service.ts`:
  - Update `PlayerPerformanceMetrics`, `PlayerHistoryEntry`, and `PlayerProfileAnalytics` interfaces to match backend.

### Step 3: Frontend Team Analytics (`apps/frontend/src/app/teams/team-dashboard/analytics/`)
- `analytics.ts`:
  - Add computed leaderboards for basketball (`topBasketballScorers`, `topBasketballRebounders`, `topBasketballPlaymakers`, `topBasketballSteals`, `topBasketballBlocks`).
- `analytics.html`:
  - Summary KPI cards for Basketball (Points For, Points Against, Point Diff).
  - Leaderboard cards for Basketball.
  - Roster Performance Table for Basketball with full box score columns.
- Unit tests in `analytics.spec.ts`.

### Step 4: Frontend Player Profile (`apps/frontend/src/app/teams/team-dashboard/analytics/player-profile/`)
- `player-profile.ts` & `player-profile.html`:
  - Render Basketball KPI cards (PPG, RPG, APG, STL, BLK).
  - Render Shooting Splits card (FG%, 3P%, FT%).
  - Display basketball game log badges in history list.
- Unit tests in `player-profile.spec.ts`.

### Step 5: Demo Team Seeder (`apps/api/src/teams/` & `teams-list.ts`)
- `teams.service.ts`:
  - Implement basketball branch in `seedDemo`: Team name `Apex Ballers (Demo)`, U14 basketball league, 12 players, completed 64-58 game with realistic events and shot coordinates.
- `teams-list.ts`:
  - Add `Basketball (Apex Ballers)` to `showSeedDemoAlert` inputs.
- Unit tests in `teams.service.spec.ts` and `teams-list.spec.ts`.

### Step 6: Verification & Git Commit
- Run test suites:
  - `npx nx test api --no-watch`
  - `npx nx test frontend --no-watch`
- Run builds:
  - `npx nx build frontend`
  - `npx nx build api`
- Commit as `feat(basketball): Phase 6 - Analytics, Player Profiles & Demo Team Seeder (#69)`
- Push to `origin feat/issue-64-basketball-foundation`
