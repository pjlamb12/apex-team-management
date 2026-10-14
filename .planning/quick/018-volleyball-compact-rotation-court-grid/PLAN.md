# Quick Task Plan: Issue #76 - Volleyball Compact Rotation Court Grid & Expanded Player Cards

## Overview
Based on volleyball coach feedback, the live game console no longer needs the large full-sized court diagram (`min-h-[520px]`). Since rapid stat tracking is now driven directly by player cards and the courtside stat keypad, the console layout can be altered to:
1. Replace the oversized court view with a compact rotation grid showing player positioning (Front row: Z4, Z3, Z2; Back row: Z5, Z6, Z1; Server: Z1; Libero tracking).
2. Give player cards substantially more screen space, larger touch targets, and clearer stat readability courtside.

---

## Layout Options

### Option A: Unified Court-Grid Cards (Primary / Default)
- The player cards themselves are arranged in a 2x3 court rotation matrix:
  - **Net Bar**: Visual net header at top.
  - **Front Row (Attackers/Blockers)**: Zone 4 (Left Front), Zone 3 (Middle Front), Zone 2 (Right Front).
  - **10ft Attack Line**: Visual dashed attack line separator.
  - **Back Row (Defenders/Passers)**: Zone 5 (Left Back), Zone 6 (Middle Back), Zone 1 (Right Back / Server ★).
  - **Libero Dock Card**: 7th card for Libero (or benched replaced player) with stats and quick swap status.
- **Benefits**:
  - Eliminates redundant diagrams; every pixel is an interactive, thumb-friendly player card.
  - Cards expand from ~85px to ~190-210px in width on tablets.
  - Live rotation advances rotate the cards clockwise directly across the court layout.
  - Total vertical height drops from 620px to ~360-380px, aligning 1:1 with the stat pad on the right and fitting on tablets without scrolling.

### Option B: Compact Mini-Court Diagram Widget + Expanded Player Cards
- A dedicated mini-court widget (~140px tall) showing a stylized 2x3 court diagram with player jersey badges, zones, and rotation arrows.
- Positioned alongside or above an expanded player cards grid.

### Option C: Dual-Mode Toggle
- Support a view mode toggle in the rotation header:
  - `Court Grid` (Option A): 2x3 court matrix (recommended default).
  - `Mini-Court + Strip` (Option B): Compact mini-court widget beside/above player cards.

---

## Acceptance Criteria
- [ ] Large `min-h-[520px]` volleyball court view removed from the live game console in `console-wrapper.html`.
- [ ] `VolleyballRotationStripComponent` enhanced to support `court-grid` mode (2x3 court matrix of player cards matching volleyball rotation zones Z4-Z3-Z2 / Z5-Z6-Z1 + Libero dock).
- [ ] Court visual cues included: Net header, 10ft attack line divider, zone labels (`Z4 LF`, `Z3 MF`, `Z2 RF`, `Z5 LB`, `Z6 MB`, `Z1 RB`), and Server highlight on Zone 1.
- [ ] Player cards expanded with larger touch targets, clearer typography, and high-contrast stat pills (K, A, D, P.Avg).
- [ ] Full courtside interactivity preserved: card selection, keypad armed stat fulfillment, empty slot bench substitutions, Libero swapping, and clockwise rotation.
- [ ] All unit tests pass across `client-feature-game-console` and frontend builds cleanly.

---

## Architecture & Implementation Steps

### 1. `VolleyballRotationStripComponent` Template & Styles
- Add `layoutMode` signal (`'court-grid' | 'strip'`, default `'court-grid'`).
- In `court-grid` mode:
  - Render top Net banner: `═══ NET ═══`.
  - Render Front Row: `grid grid-cols-3 gap-2` containing cards for Zone 4, Zone 3, Zone 2.
  - Render Attack Line: `10 FT ATTACK LINE` divider.
  - Render Back Row: `grid grid-cols-3 gap-2` containing cards for Zone 5, Zone 6, Zone 1.
  - Render Libero / Replaced card docked below the back row.
- In `strip` mode: preserve single-row horizontal layout with compact mini-court preview.
- Enhance card dimensions and styling:
  - Height ~90-110px.
  - Big jersey badge, clear player name, position name, and distinct stat indicators.
  - Glowing selection ring and server pulse.

### 2. `ConsoleWrapper` Template Updates
- File: `libs/client/feature/game-console/src/lib/console-wrapper/console-wrapper.html`
- In `@case ('Volleyball')`:
  - Replace `<div class="w-full min-h-[350px] sm:min-h-[520px]"><app-volleyball-court-view>...</div>` with the expanded `app-volleyball-rotation-strip`.
  - Note: `app-volleyball-court-view` remains available in `lineup-editor` where full court dragging is desired.

### 3. Unit Tests & Verification
- Update `volleyball-rotation-strip.spec.ts` to test `court-grid` layout, zone ordering, player clicks, and empty slots.
- Update `console-wrapper.spec.ts` if needed.
- Run `nx test client-feature-game-console` and `nx build frontend`.
