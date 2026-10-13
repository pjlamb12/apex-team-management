# Quick Task Plan: Issue #68 - Basketball Phase 5: Tactic Board Hardwood SVG & Basketball Playbook Presets

Part of Epic #63.

## Overview
Integrate Basketball into the Tactic Board with hardwood court SVGs, sport switcher, and basketball formation/play presets:

1. **PitchCanvasComponent (`libs/client/feature/tactic-board/src/lib/components/pitch-canvas/`)**:
   - Add Basketball Full-Court SVG:
     - Hardwood floor gradient & parquet plank lines pattern.
     - Half-court line, center jump circle, center restraint circle.
     - Left & right keys / free-throw lanes, free-throw circles, restricted areas, lane hash marks.
     - 3-point arcs with corner sidelines.
     - Backboards, rims/hoops.
   - Add Basketball Half-Court SVG:
     - High-detail offensive half-court view.
     - Hardwood wood plank background, perimeter boundaries, halfway line with center circle arc.
     - Key / paint area, free-throw line, free-throw circle (solid/dashed).
     - 3-point arc with corner 3 lines.
     - Restricted area arc, backboard, and hoop.
   - Ball token emoji: render 🏀 for `sport === 'basketball'` when `token.team === 'ball'`.

2. **PresetPickerModalComponent (`libs/client/feature/tactic-board/src/lib/components/preset-picker-modal/`)**:
   - Add Basketball formation & play presets:
     1. `5-Out Motion` (offensive, half_court)
     2. `4-Out 1-In` (offensive, half_court)
     3. `2-3 Zone Defense` (defensive, half_court)
     4. `Man-to-Man Defense` (defensive, half_court)
     5. `Horns / High Pick & Roll` (offensive, half_court)
     6. `1-3-1 Zone Defense` (defensive, half_court)
     7. `Baseline Out-of-Bounds (BLOB)` (set_piece, half_court)
   - Expose `basketballPresets` in `PresetPickerModal`.

3. **TacticBoardComponent & Navigation (`libs/client/feature/tactic-board/src/lib/`)**:
   - Add Basketball button to the sport switcher (⚽ Soccer, 🏐 Volleyball, 🏀 Basketball).
   - Add basketball pitch type options (`full_court` and `half_court`).
   - Default starter preset for Basketball when switching sport (`5-Out Motion` or standard half-court set).
   - Update `SavePlayModal` to indicate `🏀 Basketball` sport pill and set default title.
   - Update `PlaybookCard` thumbnail preview with basketball hardwood court SVG.
   - Update global styles for `.active-basketball` and `.pill-basketball`.

4. **Testing & Verification**:
   - Unit tests in `pitch-canvas.spec.ts` for basketball full-court, half-court, and ball token rendering.
   - Unit tests in `preset-picker-modal.spec.ts` for basketball presets.
   - Unit tests in `tactic-board.spec.ts` for basketball sport switching and default presets.
   - Run full test suite:
     - `nx test client-feature-tactic-board --no-watch`
     - `nx test client-data-access-tactics --no-watch`
     - `nx build frontend`
     - `nx build api`
