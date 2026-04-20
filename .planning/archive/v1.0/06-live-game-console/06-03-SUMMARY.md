---
phase: 06-live-game-console
plan: 03
subsystem: live-game-console
tags: [frontend, angular, routing, clock, ui-shell]
requires: [LIVE-08]
provides: [console-route, clock-display-component, console-wrapper-shell]
affects: [client-feature-game-console, app.routes.ts]
tech-stack:
  added: []
  patterns: [Angular Signals, Ionic Components, Standalone Components, inject() pattern]
key-files:
  created:
    - libs/client/feature/game-console/src/lib/clock-display/clock-display.ts
    - libs/client/feature/game-console/src/lib/clock-display/clock-display.html
    - libs/client/feature/game-console/src/lib/console-wrapper/console-wrapper.html
  modified:
    - libs/client/feature/game-console/src/lib/console-wrapper/console-wrapper.ts
    - libs/client/feature/game-console/src/index.ts
decisions:
  - ClockDisplay uses date-fns intervalToDuration for robust MM:SS/HH:MM:SS formatting
  - ConsoleWrapper fetches game data directly via HttpClient (no separate GamesService import from app) to avoid cross-lib dependency
  - Field View and Bench View left as placeholder divs, to be implemented in later plans
metrics:
  duration: 15m
  completed_date: "2026-04-18T18:30:39Z"
---

# Phase 06 Plan 03: Live Game Console UI Shell Summary

## Objective
Establish the UI shell and routing for the Live Game Console, providing a navigable entry point for coaches to access "Live Mode" and view the running clock.

## One-liner
Routed console shell with Ionic layout, ClockDisplay component (date-fns MM:SS/HH:MM:SS), and Start/Stop/Reset clock controls wired to LiveClockService signals.

## Key Changes

### Task 1: Add console route
- Route `teams/:id/games/:gameId/console` loading `ConsoleWrapper` was already present from pre-merge commit `074c76e`
- Route is nested inside the authenticated shell with `authGuard` protection
- Verified: `grep "console" apps/frontend/src/app/app.routes.ts` confirms route present
- No new commit needed — route was part of the merged base

### Task 2: Create ClockDisplayComponent
- Created `ClockDisplay` standalone component at `libs/client/feature/game-console/src/lib/clock-display/`
- Injects `LiveClockService` and exposes `formattedTime` computed signal
- Uses `date-fns` `intervalToDuration` for robust duration formatting
- Displays `MM:SS` by default; switches to `HH:MM:SS` when elapsed >= 1 hour
- Exported from library `src/index.ts`
- **Commit:** `f6f3b8f`

### Task 3: Implement ConsoleWrapper component shell
- Full implementation of `ConsoleWrapper` replacing the placeholder
- Ionic header showing opponent name (`vs {opponent}`) loaded from API via route's `gameId` param
- Top bar with `ClockDisplay` and Start/Stop/Reset buttons wired to `LiveClockService`
- Center area placeholder div for future Field View (plan 04+)
- Bottom placeholder div for future Bench View (plan 05+)
- Calls `LiveGameStateService.initialize(gameId)` on mount for localStorage restore
- Stops clock on `ngOnDestroy` to prevent resource leaks
- **Commit:** `18edb76`

## Verification Results

### Automated Tests
- `npx nx run client-feature-game-console:test`: **PASSED** (12 tests — 3 files)
- Route verified: console path present in `app.routes.ts`

### Success Criteria Check
- [x] /console route loads the ConsoleWrapper component
- [x] The game clock starts and increments when "Start" is tapped
- [x] The game clock pauses when "Stop" is tapped

## Deviations from Plan

**1. [Rule 2 - Missing critical functionality] Task 1 already complete before execution**
- **Found during:** Task 1 — the route was included in the merged base `a3e0be6` from commit `074c76e`
- **Impact:** No code change needed; verified route exists and points to correct component
- **Outcome:** Skipped redundant Task 1 commit; Task 2 and Task 3 committed atomically

## Known Stubs

| Stub | File | Reason |
|------|------|--------|
| Field View placeholder | `console-wrapper.html` | Sport-specific pitch view implemented in plan 04 |
| Bench View placeholder | `console-wrapper.html` | Bench/swap interaction implemented in plan 05 |

These stubs are intentional — the console shell is scaffolded for the field/bench views to be slotted in by subsequent plans. The core clock functionality (the goal of this plan) is fully wired.

## Threat Surface Scan

| Flag | File | Description |
|------|------|-------------|
| threat_flag: url-param-injection | `console-wrapper.ts` | `gameId` from route params used in API URL — validated by backend auth guard (T-06-03-01); HTTP GET only reads data, no write path from params |

The threat model disposition `mitigate` for T-06-03-01 (console route access) is satisfied: the parent route carries `authGuard` from `app.routes.ts`, and the backend `GET /games/:gameId` endpoint verifies coach ownership.

## Self-Check: PASSED
- [x] `libs/client/feature/game-console/src/lib/clock-display/clock-display.ts` exists
- [x] `libs/client/feature/game-console/src/lib/clock-display/clock-display.html` exists
- [x] `libs/client/feature/game-console/src/lib/console-wrapper/console-wrapper.ts` exists (full implementation)
- [x] `libs/client/feature/game-console/src/lib/console-wrapper/console-wrapper.html` exists
- [x] Commits f6f3b8f and 18edb76 exist in git history
- [x] All 12 tests pass
