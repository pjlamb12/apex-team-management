# Phase 18 Plan 02: Rotation Engine Core Summary

## Objective
Implement the algorithmic core of the rotation engine, providing substitution suggestions based on cumulative playtime and coach-defined rules (PURE, POSITION, CONSTRAINT).

## Key Changes

### 1. RotationService Implementation
- Created `RotationService` to generate `StagedSub[]` suggestions.
- **PURE Mode:** Pairs least-played bench players with most-played field players.
- **POSITION Mode:** Pairs players within the same position groups (Forward, Midfield, Defense).
- **CONSTRAINT Mode:** Respects `minBenchMinutes` (rest time) and `maxFieldMinutes` (readiness to sub out).
- **Goalkeeper Protection:** Explicitly excludes players in `slotIndex: 0` from automated sub-out suggestions.

### 2. Algorithmic Logic
- Uses `PlaytimeService.playtimeMap` for sorting candidates.
- Uses `LiveClockService` for real-time constraint checking.
- Uses `LiveGameStateService` event log to derive "last sub out" times for bench rest calculations.

## Verification Results

### Automated Tests
- Ran `npx nx test client-feature-game-console`
- `rotation.service.spec.ts`: 7 tests passed.
  - PURE rotation logic (least vs most played).
  - POSITION rotation logic (matching within groups).
  - CONSTRAINT logic (respecting bench/field limits).
  - Goalkeeper protection (GK never suggested for sub-out).
- Total tests in library: 69 passed.

## Deviations from Plan
- **Constraint Logic Enhancement:** Injected `LiveClockService` and utilized the event log in `RotationService` to accurately calculate rest time for `minBenchMinutes` support, which was slightly more advanced than the "simplified proxy" initially considered.

## Self-Check: PASSED
- [x] Suggestions always pair a bench player with a field player.
- [x] GK is never included in automated suggestions.
- [x] PURE mode successfully maximizes rotation of the most/least played players.
- [x] CONSTRAINT mode respects coach-defined bench/field time limits.
