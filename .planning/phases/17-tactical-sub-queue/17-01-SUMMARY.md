---
phase: 17-tactical-sub-queue
plan: 01
subsystem: game-console
tags: [service, state, tdd]
dependency_graph:
  requires: []
  provides: [LiveGameStateService.pushEvents, LiveGameStateService.stagedSubs]
  affects: [ConsoleWrapper]
tech_stack: [Angular Signals]
key_files: [libs/client/feature/game-console/src/lib/live-game-state.service.ts]
decisions:
  - Use a separate _stagedSubs signal for volatile staging state.
  - stageSub logic automatically clears conflicting pairs to ensure player uniqueness.
metrics:
  duration: 15m
  completed_date: "2026-05-10"
---

# Phase 17 Plan 01: Service & State Summary

## Substantive Summary
Implemented bulk event pushing and a tactical substitution staging queue in `LiveGameStateService`. This provides the foundational logic for "Tap-Tap" staging where coaches can select a bench player and a field player to prepare a substitution without immediately applying it.

## Key Changes
- **LiveGameStateService**:
    - Added `pushEvents(events: GameEvent[])` for atomic bulk updates.
    - Added `stagedSubs` signal (readonly).
    - Added `stageSub(in, out)` with conflict resolution (prevents one player from being in multiple staged pairs).
    - Added `unstageSub(playerId)` and `clearStagedSubs()`.

## Deviations from Plan
None - plan executed exactly as written.

## Self-Check: PASSED
- [x] pushEvents implemented and tested.
- [x] StagedSub uses minimal interface.
- [x] stageSub enforces player uniqueness.
- [x] Unit tests pass.
