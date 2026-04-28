# Phase 18, Wave 1 Summary: Real-time Playtime Tracking

**Status:** Completed
**Date:** 2026-05-12

## Key Achievements
- **Data Foundation**: Updated `GameEvent` interface in `live-game-state.service.ts` to include `gameTimeMs`.
- **Instrumentation**: Updated `ConsoleWrapper` to capture `gameTimeMs` for all user-triggered events (Subs, Goals, Swaps, etc.).
- **Real-Time Logic**: Implemented `PlaytimeService` using a computed signal that derives total seconds played for each player by iterating the event log and adding the "Live" offset from the `LiveClockService`.
- **TDD & Quality**: Added comprehensive unit tests for `PlaytimeService` covering initial state, sub-stints, period transitions, and real-time increments.

## Artifacts Created/Modified
- `libs/client/feature/game-console/src/lib/rotation-engine/playtime.service.ts`
- `libs/client/feature/game-console/src/lib/rotation-engine/playtime.service.spec.ts`
- `libs/client/feature/game-console/src/lib/live-game-state.service.ts`
- `libs/client/feature/game-console/src/lib/console-wrapper/console-wrapper.ts`

## Verification Results
- All unit tests passed (`npx nx test client-feature-game-console`).
- Playtime correctly increments in real-time when the clock is running.
