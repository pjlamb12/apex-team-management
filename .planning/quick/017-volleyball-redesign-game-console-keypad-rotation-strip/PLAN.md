# Quick Task Plan: Issue #70 - Volleyball Courtside Game Console Redesign

## Overview
Redesign the Volleyball live game console UX to enable rapid, courtside stat tracking during fast-paced live rallies, mirroring the high-speed courtside logging patterns designed for basketball.

Rallies last 5–15 seconds with multiple touches in quick succession. Coaches need zero-popover rapid logging, a dedicated active rotation strip, a tactile stat keypad, one-tap rotation, quick Libero swapping, header undo, and haptics.

---

## Acceptance Criteria
- [ ] **Active Rotation Strip**: Displays all 6 rotation zones (Zone 1 to Zone 6) + Libero with server highlight on Zone 1 and live player stats (Kills, Aces, Digs, Passing Average).
- [ ] **Rapid Stat Action Pad**: Enables direct, popover-free logging for all volleyball skills (serving, passing ratings 0-3, setting, attacking, blocking, digs) supporting two-tap flows (Player -> Stat and Stat -> Player).
- [ ] **Automatic Set Score Updates**: Point-scoring events (`ACE`, `KILL`, `BLOCK`, `SERVICE_ERROR`, `HITTING_ERROR`, `SET_ERROR`, `SERVE_RECEIVE` with score 0) update running set scores automatically.
- [ ] **Single-Tap Rotate**: Advances on-court players clockwise through zones (Z1 ➔ Z6 ➔ Z5 ➔ Z4 ➔ Z3 ➔ Z2 ➔ Z1).
- [ ] **Instant One-Tap Undo**: Reverts the last logged rally event from the header and keypad, with atomic undo for rotation swap batches.
- [ ] **Quick Libero Swap**: Instant toggle for back-row players without modal navigation.
- [ ] **Haptic Feedback**: `@capacitor/haptics` confirmation on tap across mobile/PWA.
- [ ] **Unit Tests**: Full Vitest coverage passing for new volleyball courtside components and services.

---

## Architecture & Implementation Steps

### 1. `LiveGameStateService` Updates
- File: `libs/client/feature/game-console/src/lib/live-game-state.service.ts`
- Include `BLOCK` in team points calculation in `score`, `runningBoxScore`, and `setsWon`.
- Include `SERVE_RECEIVE (score: 0)` (Ace Against) in opponent points calculation.
- Ensure `undoLastEvent()` properly batches consecutive `POSITION_SWAP` events so rotating is undone in a single tap.
- Add `quickLiberoSwap()` helper method if applicable.

### 2. `VolleyballRotationStripComponent`
- Directory: `libs/client/feature/game-console/src/lib/volleyball-rotation-strip/`
- Files:
  - `volleyball-rotation-strip.ts`
  - `volleyball-rotation-strip.html`
  - `volleyball-rotation-strip.scss`
  - `volleyball-rotation-strip.spec.ts`
- Renders:
  - 6 Zone cards (Zones 1-6 ordered according to rotation).
  - Zone 1 prominently highlighted with **SERVER** badge.
  - Player jersey #, short name, zone badge (`Z1`..`Z6`), and live stat pills: Kills (`K`), Aces (`A`), Digs (`D`), Passing Average (`P.Avg`).
  - Active Libero card (distinct styling): shows status (On Court vs On Bench), stats, and quick swap button.
  - Empty slots allow subbing in.
  - Haptics and visual glowing selection ring (`border-amber-400`, `shadow-amber-500/20`).

### 3. `VolleyballStatPadComponent`
- Directory: `libs/client/feature/game-console/src/lib/volleyball-stat-pad/`
- Files:
  - `volleyball-stat-pad.ts`
  - `volleyball-stat-pad.html`
  - `volleyball-stat-pad.scss`
  - `volleyball-stat-pad.spec.ts`
- Renders:
  - Keypad header with current player selection, or Armed Stat indicator with Cancel button.
  - Quick action controls: Rotate button, Point Us (`+ Pt`), Point Opp (`+ Opp`), Quick Libero swap.
  - Categorized skill pads:
    - **Serving**: `ACE` (+Pt), `Attempt`, `Service Error` (Opp Pt)
    - **Passing**: `3` (Perfect), `2` (Playable), `1` (Out of System), `0` (Ace Against / Opp Pt)
    - **Setting**: `Assist`, `Attempt`, `Error` (Opp Pt)
    - **Attacking**: `KILL` (+Pt), `Hit Attempt`, `Hitting Error` (Opp Pt)
    - **Defense**: `BLOCK` (+Pt), `Block Touch`, `DIG`
  - Undo button.
  - Two-tap interaction model: Player ➔ Stat (immediate dispatch) or Stat ➔ Player (`fulfillArmedStat`).

### 4. `ConsoleWrapperComponent` Integration
- Integrate `VolleyballRotationStripComponent` above `VolleyballCourtViewComponent`.
- Integrate `VolleyballStatPadComponent` on the right console side for Volleyball.
- Add header-bar instant Undo button with `@capacitor/haptics`.
- Remove popovers for player taps in Volleyball mode, binding direct selection to rapid stat pad.
- Wire quick Libero swap and quick point management.

### 5. Vitest Unit Testing & Verification
- Unit test `volleyball-rotation-strip.spec.ts`.
- Unit test `volleyball-stat-pad.spec.ts`.
- Add test cases in `live-game-state.service.spec.ts` for volleyball scoring with `BLOCK`, `SERVE_RECEIVE` score 0, and batch undo.
- Add test cases in `console-wrapper.spec.ts` for volleyball courtside UX.
- Run full test suite with `npx nx test client-feature-game-console`.
