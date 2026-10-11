# Quick Task Plan: Issue #65 - Basketball Phase 2: High-Speed Courtside UX & Interactive Shot Chart Component

Part of Epic #63.

## Overview
Build a high-speed courtside UX tailored for basketball's fast pace, featuring:
1. `BasketballCourtViewComponent` with half/full court hardwood rendering, touch shot spot capture, auto 2PT/3PT detection based on court geometry, instant Make/Miss HUD, and visual shot chart markers (makes ●, misses ✕) with filter controls.
2. `ActivePlayerStripComponent` with persistent, thumb-friendly cards for the 5 on-court starters showing Jersey #, Name, Position, live Points, Personal Fouls with warning badges (⚠️ 4 PF), and single-tap focus.
3. `RapidActionKeypadComponent` with tactical stat buttons (2PT, 3PT, FT, O-REB, D-REB, AST, TO, STL, BLK, FOUL, Sub-to-Bench), two-tap flow (Player -> Stat or Stat -> Player), Haptics integration, and 1-tap Undo.
4. `LiveGameStateService` extensions for basketball player stats, team points, team fouls per period, bonus tracking, and undo support.
5. Integration into `ConsoleWrapper` and `LineupEditor` for Basketball.
6. Full Vitest test suite and end-to-end verification.

---

## Detailed Components to Implement

### 1. Basketball Court Geometry & Shot Calculations
- File: `libs/client/feature/game-console/src/lib/basketball-court-view/basketball-shot-geometry.ts`
- Normalized coordinates: `x: 0..100` (baseline/width), `y: 0..100` (length/depth).
- Half-court dimensions & geometry:
  - Basket rim center: `x = 50, y = 14`.
  - 3-point arc radius: ~`23.75` ft in NBA, ~`19.75` ft in high school.
  - In normalized % units (court 50ft wide x 47ft half-court):
    - Rim center at `(50, 14.5)`.
    - Corner 3 line offset: `x < 8.8` or `x > 91.2` with depth up to `y = 28`.
    - Arc radius $R \approx 42.5\%$ from rim center.
  - Function `calculateShotType(x: number, y: number, isHalfCourt?: boolean): { shotType: '2PT' | '3PT'; distanceFeet: number }`.

### 2. `BasketballCourtViewComponent`
- Directory: `libs/client/feature/game-console/src/lib/basketball-court-view/`
- Files:
  - `basketball-court-view.ts`
  - `basketball-court-view.html`
  - `basketball-court-view.scss`
  - `basketball-court-view.spec.ts`
- Inputs:
  - `players: Player[]`
  - `selectedPlayerId: string | null`
  - `events: GameEvent[]` (or shot events)
  - `playersOnField: number` (default 5)
  - `isHalfCourt: boolean` (default true, toggleable)
  - `shotFilter: 'all' | 'makes' | 'misses'`
  - `filterPlayerId: string | null`
  - `formationSlots: LineupSlot[]` (for lineup editor mode)
- Outputs:
  - `shotLogged: { type: 'MADE_2PT' | 'MISSED_2PT' | 'MADE_3PT' | 'MISSED_3PT' | 'MADE_1PT' | 'MISSED_1PT'; playerId: string; x: number; y: number; distanceFeet: number; assistorId?: string }`
  - `playerSelected: { player: Player; event: Event }`
  - `emptySlotSelected: number`
  - `backgroundClicked: void`
- Visual Features:
  - Hardwood floor styling (dark mode athletic hardwood).
  - SVG/CSS court lines: Key / lane, free throw circle, 3-point line, hoop / rim / backboard, restricted area arc, center circle.
  - Touch handler on court container: records touch `(x, y)` as percentage, opens instant mini HUD near touch point or bottom prompt with `[ MADE (Green) ]` / `[ MISSED (Red) ]`, detected 2PT/3PT with toggle override.
  - Shot chart markers:
    - Makes: green dot ● with jersey number.
    - Misses: red cross ✕ with jersey number.
    - Filter controls (All, Makes, Misses, Filter by selected player).

### 3. `ActivePlayerStripComponent`
- Directory: `libs/client/feature/game-console/src/lib/active-player-strip/`
- Files:
  - `active-player-strip.ts`
  - `active-player-strip.html`
  - `active-player-strip.scss`
  - `active-player-strip.spec.ts`
- Inputs:
  - `activePlayers: (Player & { preferredPosition?: string; slotIndex?: number })[]`
  - `selectedPlayerId: string | null`
  - `playerStats: Record<string, BasketballPlayerStats>`
  - `foulLimit: number` (default 5)
- Outputs:
  - `playerSelected: Player`
- Features:
  - Shows 5 horizontal cards.
  - Jersey number, Player name, Position (`PG`, `SG`, `SF`, `PF`, `C`).
  - Live Points (`PTS: X`).
  - Personal Fouls count (`PF: Y` with warning badge `⚠️ 4 PF` when `fouls >= foulLimit - 1`, red badge when fouled out).
  - Selected state with active ring and elevated glow.

### 4. `RapidActionKeypadComponent`
- Directory: `libs/client/feature/game-console/src/lib/rapid-action-keypad/`
- Files:
  - `rapid-action-keypad.ts`
  - `rapid-action-keypad.html`
  - `rapid-action-keypad.scss`
  - `rapid-action-keypad.spec.ts`
- Inputs:
  - `selectedPlayer: Player | null`
  - `teamFouls: number`
  - `canUndo: boolean`
- Outputs:
  - `actionTriggered: { type: string; playerId?: string; payload?: any }`
  - `undoClicked: void`
  - `subOffClicked: Player`
- Features:
  - Stat Keys:
    - **Scoring**: `+2 MADE`, `2PT MISS`, `+3 MADE`, `3PT MISS`, `+1 FT MADE`, `FT MISS`
    - **Possession**: `O-REB`, `D-REB`, `AST`, `TO`
    - **Defense**: `STL`, `BLK`, `FOUL`
    - **Sub**: `SUB TO BENCH`
  - Two-Tap flow:
    - If player selected: tapping key emits action immediately with `playerId`.
    - If no player selected: tapping key arms that stat (key is highlighted), next tap on active player logs the armed stat.
  - Haptic feedback with `@capacitor/haptics`.
  - Undo button triggers `undoClicked`.

### 5. `LiveGameStateService` Updates
- Basketball player stats calculation:
  - PTS, AST, OREB, DREB, REB, STL, BLK, TO, FOULS, FGM, FGA, FG3M, FG3A, FTM, FTA.
- Basketball score calculation:
  - Team score = sum of 1PT + 2PT + 3PT makes.
  - Opponent score = sum of `OPPONENT_SCORE` points.
- Team fouls tracking per period & bonus calculation (`bonusThreshold`).
- `undoLastEvent()` method to remove the most recent non-deleted event.

### 6. Integration in `ConsoleWrapper`
- Full courtside basketball view when `stateService.sportName() === 'Basketball'`:
  - Active Player Strip at the top of the action area.
  - Basketball Court View + Shot Chart on the left.
  - Rapid Action Keypad on the right (or bottom in mobile view).
  - Opponent score quick buttons (+1, +2, +3, Opponent Foul, Opponent TO).
  - Team Fouls & Bonus badge (`BONUS` indicator when `teamFouls >= bonusThreshold`).

### 7. Integration in `LineupEditor`
- In `LineupEditor`, when `sportName === 'Basketball'`, render `BasketballCourtViewComponent` with starter slots (0-4: PG, SG, SF, PF, C).

### 8. Testing & Verification
- Unit tests for all new components and services.
- `npx nx test client-feature-game-console --no-watch` - ✅ Passed (160/160 tests)
- `npx nx test frontend --no-watch` - ✅ Passed (122/122 tests)
- `npx nx test api --no-watch` - ✅ Passed (352/352 tests)
- `npx nx build frontend` - ✅ Passed
- `npx nx build api` - ✅ Passed

## Status
- **Complete**: All criteria for GitHub Issue #65 have been implemented and verified.
