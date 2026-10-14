# Quick Task Plan: Issue #73 - Basketball Shot Chart Period Breakdown & Game Intelligence Summary

**Issue**: #73 (`feat(basketball): clear shot chart per period, add period breakdown, and redesign game summary scoring section`)
**Branch**: `feat/issue-73-basketball-shot-chart-summary`

---

## 1. Overview & Goals
Enhance the basketball tracking and post-game analysis experience across both the live game console and post-game summary:
1. **Live Game Console Period-Filtered Shot Chart**:
   - Filter court shot markers to the active period (`stateService.currentPeriod()`) by default.
   - When advancing periods (e.g. Q1 ➔ Q2), clear the court cleanly for the new period.
   - Provide a period pill selector toggle (`[Q1] [Q2*] [All]`) in the court controls so coaches can review previous quarters courtside.
2. **Post-Game Summary Shot Chart Period Breakdown**:
   - Add period filter segment to the Shot Chart tab: `[All Game] [Q1] [Q2] [Q3] [Q4] [OT]`.
   - Display dynamic shooting percentage and volume badges (`FG: 8/14 (57.1%) | 3PT: 2/4 (50%) | 2PT: 6/10 (60%) | PTS: 21`) reflecting the selected period.
3. **Integrated Basketball Game Intelligence Section (Highlights Tab)**:
   - Replace linear 60+ row scoring plays list with a comprehensive basketball analytics dashboard:
     - **Momentum Strip & Lead Differential Chart**: SVG step/area curve of score margin over game time, quarter divider markers, and momentum summary metrics (Largest Lead, Lead Changes, Times Tied, Biggest Run).
     - **Scoring Runs & Drought Tracker**: Highlight pivotal moments (e.g. Apex 10–0 Run, Scoring Drought, Opponent Surges).
     - **Scoring Distribution & Offensive Profile**: Paint points (PITP), 3PT, Mid-Range, Free Throws, Assisted % and Points off Turnovers.
     - **Quarter-by-Quarter Period Recap Cards**: Modular cards for Q1–Q4/OT with quarter score & margin, top scorer, shooting efficiency, and quarter takeaway.
     - **Key & Clutch Plays**: High-leverage plays (lead changes, 3-pointers, and-ones, clutch final-3-minute baskets) with a collapsible `<ion-accordion>` containing the full play-by-play audit log.
4. **Preserve Soccer & Volleyball**: Soccer Goal Timeline and volleyball set scores remain completely intact.

---

## 2. Acceptance Criteria
- [x] Live basketball console shot chart defaults to current period and clears upon advancing periods.
- [x] Live basketball console provides a period toggle to review earlier quarters courtside if desired.
- [x] Post-game summary shot chart supports filtering by `All` or individual periods (`Q1`, `Q2`, `Q3`, `Q4`, `OT`) with per-period shooting percentages.
- [x] Basketball Highlights tab replaces linear scoring table with:
  - Lead Differential & Momentum Chart + Run/Drought Tracker
  - Scoring Distribution Cards (Paint, 3PT, Mid-Range, FT, Assisted %)
  - Quarter-by-Quarter Period Recap Cards
  - Key Plays timeline with collapsible full play-by-play accordion.
- [x] Soccer and volleyball summary views remain unaffected (preserving the Goal Timeline for soccer and set scores for volleyball).
- [x] Unit tests pass for period-filtered basketball shot queries, run calculations, and summary aggregations across console and frontend.

---

## 3. Implementation Steps

### Step 1: Period Filtering in `BasketballCourtViewComponent` & `ConsoleWrapper`
- Files:
  - `libs/client/feature/game-console/src/lib/basketball-court-view/basketball-court-view.ts`
  - `libs/client/feature/game-console/src/lib/basketball-court-view/basketball-court-view.html`
  - `libs/client/feature/game-console/src/lib/console-wrapper/console-wrapper.html`
- Details:
  - Add input `currentPeriod = input<number | null | undefined>(undefined)`.
  - Add `periodFilter = model<number | 'all' | null>(null)`.
  - Track `activePeriod = computed(() => this.periodFilter() ?? this.currentPeriod() ?? 'all')`.
  - Compute `availablePeriods` from `currentPeriod` and `shots`.
  - When period is filtered, `filteredShots` filters to `shot.period === activePeriod()`.
  - Add period pill selector (`[Q1] [Q2*] ... [All]`) in court controls bar when not in lineup mode.
  - When `currentPeriod()` advances (e.g. Q1 -> Q2), automatically clear court view to new active period if `periodFilter` was not explicitly pinned to a past period.
  - In `console-wrapper.html`, pass `[currentPeriod]="stateService.currentPeriod()"` to `app-basketball-court-view`.

### Step 2: Post-Game Summary Shot Chart Period Breakdown
- Files:
  - `apps/frontend/src/app/teams/events/game-summary/game-summary.ts`
  - `apps/frontend/src/app/teams/events/game-summary/game-summary.html`
- Details:
  - Add signal `shotChartPeriodFilter = signal<number | 'all'>('all')`.
  - Add computed `shotChartPeriods`: array of periods from game events (`Q1`, `Q2`, `Q3`, `Q4`, `OT`).
  - Add computed `filteredBasketballShots`: filtered by `shotChartPeriodFilter()`.
  - Add computed `periodShootingStats`: FG made/att/%, 3PT made/att/%, 2PT made/att/%, FT made/att/%, total points for the selected period.
  - In `game-summary.html` shot-chart tab:
    - Render segmented period filter: `[All Game] [Q1] [Q2] [Q3] [Q4] [OT]`.
    - Render dynamic shooting stats badges bar.
    - Pass `filteredBasketballShots()` into `BasketballCourtViewComponent`.

### Step 3: Integrated Basketball Game Intelligence Dashboard
- Files:
  - `apps/frontend/src/app/teams/events/game-summary/game-summary.ts`
  - `apps/frontend/src/app/teams/events/game-summary/game-summary.html`
  - `apps/frontend/src/app/teams/events/game-summary/game-summary.scss`
- Details:
  - Compute `basketballGameIntelligence`:
    - **Score Progression & Lead Differential Curve**:
      - Calculate running scores (Team vs Opponent) and lead differential after every play.
      - Calculate `maxLeadTeam`, `maxLeadOpponent`, `leadChanges`, `timesTied`, `biggestRunTeam`, `biggestRunOpponent`.
      - Generate SVG points / path for score differential curve (`viewBox="0 0 600 120"`) with horizontal zero line and period break indicators.
    - **Scoring Runs & Droughts**:
      - Detect runs (e.g. >= 8-0 or >= 10-2 runs) and droughts (>= 3 minutes or >= 4 missed/turnovers without score).
    - **Scoring Distribution Profile**:
      - Points in Paint (PITP), 3PT points, Mid-Range points, Free Throw points.
      - Percentages of total score.
      - Assisted FGs count & percentage.
      - Points off Turnovers.
    - **Quarter-by-Quarter Period Recap Cards**:
      - For each period: period score (Apex vs Opponent), margin, period top scorer, FG/3PT efficiency, and takeaway text.
    - **Key & Clutch Plays**:
      - Filter plays for lead changes, buzzer beaters, 3-pointers, and clutch baskets in final 3 minutes when margin <= 5.
    - **Collapsible Full Play-by-Play**:
      - Render full audit log in `<ion-accordion-group>` `<ion-accordion>`.
  - Replace linear basketball scoring table in `game-summary.html` with this modern Athletic Professional dashboard.

### Step 4: Unit Testing & Verification
- Files:
  - `libs/client/feature/game-console/src/lib/basketball-court-view/basketball-court-view.spec.ts`
  - `apps/frontend/src/app/teams/events/game-summary/game-summary.spec.ts`
- Details:
  - Test period filtering in `BasketballCourtViewComponent`.
  - Test period switching and shot count changes.
  - Test game intelligence calculations: lead changes, largest lead, runs, scoring distribution, and period summaries in `game-summary.spec.ts`.
  - Run `nx test client-feature-game-console` and `nx test frontend --watch=false`.
  - Ensure zero regressions in soccer and volleyball.
 
---
 
## 4. Verification Results
- **Unit Tests**:
  - `nx test client-feature-game-console --watch=false`: 232 tests passing (20 test files).
  - `nx test frontend --watch=false`: 140 tests passing (22 test files).
- **Build**:
  - `nx build frontend`: Passed successfully (0 errors).
- **Lint**:
  - `eslint` on all touched basketball files passed cleanly with 0 errors.
