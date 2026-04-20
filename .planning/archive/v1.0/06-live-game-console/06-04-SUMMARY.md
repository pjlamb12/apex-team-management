---
phase: 06-live-game-console
plan: 04
subsystem: live-game-console
tags: [frontend, angular, soccer-pitch, bench-view, substitution, signals]
requires: [06-03]
provides: [soccer-pitch-view, bench-view, 2-tap-sub-logic]
affects: [client-feature-game-console, console-wrapper]
tech-stack:
  added: []
  patterns: [Angular Signals, computed(), Angular Standalone Components, Ionic Cards, SVG/CSS pitch layout]
key-files:
  created: []
  modified:
    - libs/client/feature/game-console/src/lib/clock-display/clock-display.ts
    - libs/client/feature/game-console/src/lib/console-wrapper/console-wrapper.html
    - libs/client/feature/game-console/src/lib/console-wrapper/console-wrapper.ts
    - libs/client/feature/game-console/src/lib/console-wrapper/console-wrapper.spec.ts
    - libs/client/feature/game-console/vite.config.mts
decisions:
  - SoccerPitchViewComponent groups players by position category (GK/DEF/MID/FWD) and maps to Y-coordinates; X is distributed evenly across each row
  - BenchViewComponent uses an Ionic card grid; selection is communicated via parent-held selectedPlayerId signal
  - handlePlayerSelection in ConsoleWrapper owns all swap logic — bench/pitch detection and SUB event dispatch
  - ClockDisplayComponent renamed from ClockDisplay to match spec imports (standalone: true, imports: [] added)
metrics:
  duration: 25m
  completed_date: "2026-04-18T13:13:00Z"
---

# Phase 06 Plan 04: Field Visualization and 2-Tap Substitution Summary

## Objective
Implement the sport-specific soccer pitch visualization and bench view, and wire the 2-tap substitution interaction into the ConsoleWrapper.

## One-liner
Soccer pitch SVG/CSS tactical view with position-based player placement, scrollable bench card grid, and 2-tap SUB event dispatch in ConsoleWrapper — all 29 unit tests passing.

## Key Changes

### Context note
All three components (`SoccerPitchViewComponent`, `BenchViewComponent`, `handlePlayerSelection` swap logic) were already implemented and committed in the pre-existing implementation on the base commit `dc7a379`. This plan's work was verification, gap-filling, and integration wiring.

### Gap 1: console-wrapper.html was stale (placeholder divs, wrong method names)
The `ConsoleWrapper` HTML template still referenced:
- `isLoading()` and `errorMessage()` which do not exist in the TS
- `onStart()`, `onStop()`, `onReset()` instead of `startClock()` / `stopClock()`
- Placeholder `<div>` blocks instead of `<app-soccer-pitch-view>` and `<app-bench-view>`

Fixed the template to use the real method names, wire real child components, and include the popover for `PlayerActionMenuComponent`.

### Gap 2: ClockDisplayComponent class name mismatch
The class in `clock-display.ts` was exported as `ClockDisplay`, but all consumers (`clock-display.spec.ts`, `console-wrapper.ts`) imported it as `ClockDisplayComponent`. Renamed to `ClockDisplayComponent` and added `standalone: true, imports: []` to the decorator.

### Gap 3: IonBackButton missing from ConsoleWrapper imports
`ion-back-button` was used in the ConsoleWrapper template but `IonBackButton` was not listed in the component's `imports` array. Added `IonBackButton` to both the TS import and the component decorator imports array.

### Gap 4: console-wrapper.spec.ts mock and call-site mismatches
- `clockServiceMock` was missing `elapsedMs` and `currentMinute` — required by `ClockDisplayComponent` (which is a child of `ConsoleWrapper`)
- `handlePlayerSelection` spec calls passed a bare `Player` object; actual signature requires `{ player: Player; event: Event }`
- Fixed both issues in the spec

### Gap 5: vite.config inline deps
Added `/@ionic\/angular/` to the `server.deps.inline` list alongside `/@ionic\/core/` to prevent ESM syntax errors when Ionic Angular standalone components are imported in test suites.

## Verification Results

### Automated Tests
- All 29 tests pass across 6 spec files
- `src/lib/live-clock.service.spec.ts` — 6 tests
- `src/lib/live-game-state.service.spec.ts` — 5 tests
- `src/lib/soccer-pitch-view/soccer-pitch-view.spec.ts` — 4 tests
- `src/lib/clock-display/clock-display.spec.ts` — 4 tests
- `src/lib/bench-view/bench-view.spec.ts` — 4 tests
- `src/lib/console-wrapper/console-wrapper.spec.ts` — 6 tests

### Must-Have Verification

| Must-Have | Status | Evidence |
|-----------|--------|---------|
| Coach sees players in assigned positions on pitch | Met | `SoccerPitchViewComponent.positionedPlayers` computed groups by GK/DEF/MID/FWD with (x,y) placement |
| Coach sees bench players in scrollable list | Met | `BenchViewComponent` renders `stateService.benchPlayers()` as Ionic card grid in ConsoleWrapper |
| Tapping bench then pitch triggers SUB event | Met | `handlePlayerSelection` in ConsoleWrapper detects bench→active swap, calls `stateService.pushEvent({ type: 'SUB', ... })` |

### Success Criteria Check
- [x] Bench list displays all players not on the field (driven by `stateService.benchPlayers()`)
- [x] Pitch view displays all starting players (driven by `stateService.activePlayers()`)
- [x] Substitution successfully updates local state (tested in console-wrapper.spec.ts)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] console-wrapper.html had stale template referencing non-existent methods**
- **Found during:** Task 3 gap verification
- **Issue:** HTML called `isLoading()`, `errorMessage()`, `onStart()`, `onStop()`, `onReset()` — none exist in the TS
- **Fix:** Rewrote HTML to use `startClock()`, `stopClock()`, and real child component selectors
- **Files modified:** `console-wrapper.html`
- **Commit:** `8929dd4`

**2. [Rule 1 - Bug] ClockDisplayComponent exported under wrong name ClockDisplay**
- **Found during:** clock-display.spec.ts failure investigation
- **Issue:** Spec and console-wrapper both imported `ClockDisplayComponent` but class was named `ClockDisplay`; resulted in `undefined` being passed to Angular TestBed `imports`
- **Fix:** Renamed class to `ClockDisplayComponent`; added `standalone: true, imports: []`
- **Files modified:** `clock-display.ts`
- **Commit:** `8929dd4`

**3. [Rule 2 - Missing critical functionality] IonBackButton not imported in ConsoleWrapper**
- **Found during:** HTML template review
- **Issue:** `ion-back-button` used in template but not declared in component imports
- **Fix:** Added `IonBackButton` to both the TS import statement and component `imports` array
- **Files modified:** `console-wrapper.ts`
- **Commit:** `8929dd4`

**4. [Rule 1 - Bug] console-wrapper.spec call-site mismatches**
- **Found during:** Test run — 6 failures in console-wrapper.spec.ts
- **Issue 1:** `clockServiceMock` missing `elapsedMs` signal — required by child `ClockDisplayComponent`
- **Issue 2:** `handlePlayerSelection` called with bare Player; method expects `{ player, event }`
- **Fix:** Added `elapsedMs: signal(0)` and `currentMinute: vi.fn()` to mock; updated call-sites to pass `{ player, event: mockEvent }`
- **Files modified:** `console-wrapper.spec.ts`
- **Commit:** `8929dd4`

**5. [Rule 3 - Blocking issue] Ionic Angular ESM module error in tests**
- **Found during:** Test run — bench-view.spec.ts suite-level import failure when run from main repo
- **Issue:** `@ionic/angular/standalone` imports from `@ionic/core/components/...` which is an ESM file not handled by the existing inline regex
- **Fix:** Added `/@ionic\/angular/` to `server.deps.inline` in vite.config.mts
- **Files modified:** `vite.config.mts`
- **Commit:** `8929dd4`

**Note:** Tests must be run from the worktree directory (`/Users/pjlamb12/projects/apex-team/.claude/worktrees/agent-a31c7446`) rather than the main repo root, since the main repo's `libs/` contain the pre-rename `ClockDisplay` name.

## Known Stubs

None. All three must-have features are wired to real data sources:
- Pitch view reads from `stateService.activePlayers()`
- Bench view reads from `stateService.benchPlayers()`
- SUB events flow through `stateService.pushEvent()`

## Threat Surface Scan

No new network endpoints or trust boundaries introduced. All interactions are local state mutations via `LiveGameStateService`. The existing T-06-04-01 threat (invalid substitution via tampered input) is mitigated: `handlePlayerSelection` validates that the swap is between an active and bench player before dispatching the SUB event — preventing swapping two bench players or two active players.

## Self-Check: PASSED
- [x] `libs/client/feature/game-console/src/lib/clock-display/clock-display.ts` exports `ClockDisplayComponent`
- [x] `libs/client/feature/game-console/src/lib/console-wrapper/console-wrapper.html` wires `app-soccer-pitch-view` and `app-bench-view`
- [x] `libs/client/feature/game-console/src/lib/console-wrapper/console-wrapper.ts` imports `IonBackButton`
- [x] Commit `8929dd4` exists in git history
- [x] All 29 tests pass (verified via `npx nx run client-feature-game-console:test --no-cache`)
