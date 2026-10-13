# Quick Execution Plan: Basketball Bug Fixes - Courtside UX & Court View

**Issue**: #71 (`fix(basketball): courtside console UX, court view alignment, countdown timer, and substitution fixes`)
**Branch**: `feat/issue-64-basketball-foundation`

---

## 1. Overview & Goals
Address all 10 user-reported courtside console and court view UX/logic bugs:
1. **Lineup Editor Court View Alignment**: Contain court surface in strict aspect-ratio box so slot positions (`left: %`, `top: %`) never drift off the hardwood on wide screens/desktops.
2. **Lineup Editor Player Badges**: Ensure high-contrast, readable player nodes with jersey number, position tag, and player names.
3. **Basketball Game Clock Countdown**: Count down from period length (e.g. 8:00, 10:00) to 0:00 instead of counting up.
4. **Active Player Cards Jersey Padding**: Add proper horizontal/vertical padding to `#jersey` badges so numbers do not crowd the borders.
5. **Action Pad Contrast & Undo Button Padding**: High-contrast selected player header banner; increase vertical padding on "Undo Last Action" button.
6. **Live Console Court Stability**: Prevent unwanted zooming/reflow when players or shot locations are tapped.
7. **Shot Prompt HUD Artifact Fix**: Eliminate stuck top-edge pulsing ring and truncated orange box; anchor HUD cleanly with proper boundary-safe positioning.
8. **Half Court vs. Full Court Toggle**: Support dynamic toggling between half-court (`500x470`) and full-court (`500x940`) views in `BasketballCourtViewComponent`.
9. **Event Log Basketball Icons**: Add icons and colors for all basketball actions (`MADE_1/2/3PT`, `MISSED_1/2/3PT`, `REBOUND_OFF/DEF`, `STEAL`, `BLOCK`, `TURNOVER`, `FOUL`, etc.) and display `Q{period}` badges.
10. **Bench-to-Court Substitution Flow**: Render empty slot cards in `ActivePlayerStripComponent` when under 5 active players, enabling coaches to sub bench players back in seamlessly.

---

## 2. Detailed Task Breakdown

### Step 1: Basketball Court View Alignment, Aspect Ratio & Half/Full Court Toggle
- Files:
  - `libs/client/feature/game-console/src/lib/basketball-court-view/basketball-court-view.ts`
  - `libs/client/feature/game-console/src/lib/basketball-court-view/basketball-court-view.html`
  - `libs/client/feature/game-console/src/lib/basketball-court-view/basketball-court-view.scss`
- Changes:
  - Add `courtAspectRatio` computed signal (`500 / 470` for half court, `500 / 940` for full court).
  - Add `courtViewBox` computed signal (`0 0 500 470` vs `0 0 500 940`).
  - Wrap SVG, slot nodes, shot markers, and HUD overlay in `.court-surface` centered container with `aspect-ratio` locking.
  - Implement full-court SVG markings when `!isHalfCourt()`.
  - Fix Lineup Editor player slot badges: dark athletic surface, bold white text, clear `#jersey` and player name.
  - Fix HUD prompt positioning: if `y < 35`, place HUD card below pin to avoid top-edge clipping.
  - Fix background click / dismiss handling so HUD and ping ring clear immediately.

### Step 2: Basketball Countdown Clock
- Files:
  - `libs/client/feature/game-console/src/lib/live-game-state.service.ts`
  - `libs/client/feature/game-console/src/lib/console-wrapper/console-wrapper.ts`
  - `libs/client/feature/game-console/src/lib/clock-display/clock-display.ts`
  - `libs/client/feature/game-console/src/lib/clock-display/clock-display.html`
- Changes:
  - In `LiveGameStateService`, store and expose `periodLengthMinutes` signal (defaults to 8 for basketball).
  - In `ConsoleWrapper`, pass `periodLengthMinutes` from `event` or `league` during `stateService.initialize()`.
  - In `ClockDisplayComponent`, compute countdown remaining time when sport is Basketball (`Math.max(0, periodLengthMs - (elapsedMs % periodLengthMs))`).
  - Display `Q{period}` for basketball periods.

### Step 3: Active Player Strip Polish & Empty Slot Cards
- Files:
  - `libs/client/feature/game-console/src/lib/active-player-strip/active-player-strip.ts`
  - `libs/client/feature/game-console/src/lib/active-player-strip/active-player-strip.html`
- Changes:
  - Add horizontal padding to jersey badge (`min-w-[32px] px-1.5 h-7`).
  - Add `emptySlots` computed property comparing `activePlayers().length` to `playersOnCourt()`.
  - Render "+ Sub In" empty slot cards in the strip when active players < 5.
  - Emit `emptySlotSelected` output when clicked.
  - In `ConsoleWrapper`, handle `emptySlotSelected`: if a bench player is selected, sub them in; if none selected, present quick alert picker of bench players.

### Step 4: Rapid Action Keypad Polish
- Files:
  - `libs/client/feature/game-console/src/lib/rapid-action-keypad/rapid-action-keypad.html`
  - `libs/client/feature/game-console/src/lib/rapid-action-keypad/rapid-action-keypad.scss`
- Changes:
  - Style selected player header bar with high contrast (`bg-slate-800 border-slate-700 text-white`).
  - Increase vertical padding on "Undo Last Action" button (`py-3.5`).

### Step 5: Event Log Basketball Icons & Badges
- Files:
  - `libs/client/feature/game-console/src/lib/event-log/event-log.ts`
  - `libs/client/feature/game-console/src/lib/event-log/event-log.html`
- Changes:
  - Add icon mappings for `MADE_1PT`, `MADE_2PT`, `MADE_3PT`, `MISSED_1PT`, `MISSED_2PT`, `MISSED_3PT`, `REBOUND_OFFENSIVE`, `REBOUND_DEFENSIVE`, `STEAL`, `BLOCK`, `TURNOVER`, `FOUL`, `OPPONENT_FOUL`.
  - Add color mappings for basketball events.
  - Show `Q{period}` badge for Basketball events.

### Step 6: Testing & Verification
- Run unit tests: `npx nx test game-console`, `npx nx test frontend`.
- Run build: `npx nx build frontend`.
- Commit with reference to `#71` and push.
