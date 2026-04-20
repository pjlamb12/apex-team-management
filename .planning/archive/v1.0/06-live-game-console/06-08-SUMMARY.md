---
phase: 06-live-game-console
plan: "08"
subsystem: live-game-console
tags: [clock-persistence, signal-immutability, localStorage, e2e, angular-signals]
dependency_graph:
  requires: ["06-07"]
  provides: [clock-persistence, immutable-signal-updates, e2e-assertion-fix]
  affects: [live-clock-service, live-game-state-service, event-sync-service, e2e-spec]
tech_stack:
  added: []
  patterns: [localStorage-keyed-by-gameId, immutable-signal-spread-replace]
key_files:
  created: []
  modified:
    - libs/client/feature/game-console/src/lib/live-clock.service.ts
    - libs/client/feature/game-console/src/lib/live-game-state.service.ts
    - libs/client/feature/game-console/src/lib/event-sync.service.ts
    - libs/client/feature/game-console/src/lib/console-wrapper/console-wrapper.ts
    - apps/frontend-e2e/src/live-console.spec.ts
decisions:
  - "Use event.timestamp as stable local identifier for markEventSynced lookup (id is only known after backend responds)"
  - "persistClock() called in stop() and reset() only — not on start() — so only completed intervals are persisted"
  - "markDeletionSynced() introduced alongside markEventSynced() to cover the syncDelete path symmetrically"
metrics:
  duration: "~15 minutes"
  completed_date: "2026-04-18"
  tasks_completed: 3
  tasks_total: 3
---

# Phase 06 Plan 08: Clock Persistence and Signal Immutability Fixes Summary

Clock elapsed time persists to localStorage keyed by gameId and is restored on page reload; EventSyncService now uses immutable signal spread-replace via markEventSynced/markDeletionSynced instead of directly mutating signal-owned objects.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add clock persistence to LiveClockService | ffb9f19 | live-clock.service.ts, console-wrapper.ts |
| 2 | Fix direct signal mutation — add markEventSynced() and update EventSyncService | cad66cf | live-game-state.service.ts, event-sync.service.ts |
| 3 | Update E2E clock persistence assertion | c43326f | live-console.spec.ts |

## What Was Built

### Task 1 — Clock Persistence

Added localStorage persistence to `LiveClockService`:
- `private gameId: string | null = null` — scopes all localStorage ops to the current game
- `public initialize(gameId)` — reads `apex_clock_${gameId}` from localStorage; if a valid positive integer is stored, sets `accumulatedMs` and calls `updateElapsed()` to restore display
- `private persistClock()` — writes current `accumulatedMs()` to `localStorage.setItem('apex_clock_${gameId}', ...)`
- `stop()` now calls `persistClock()` immediately after accumulating elapsed ms
- `reset()` now calls `persistClock()` after zeroing `accumulatedMs` and `elapsedMs` (writes 0 to storage so next session starts fresh)

Wired `clockService.initialize(gameId)` in `ConsoleWrapper` inside the `lineup` toSignal `tap()` block, co-located with `stateService.initialize(gameId, lineup)`.

### Task 2 — Immutable Signal Updates

Added two public methods to `LiveGameStateService`:
- `markEventSynced(localTimestamp, backendId)` — immutable spread-replace mapping over `_events`, sets `id` and `synced: true`, then calls `save()`
- `markDeletionSynced(localTimestamp)` — immutable spread-replace mapping over `_events`, sets `synced: true`, then calls `save()`

Updated `EventSyncService`:
- `syncAdd` subscribe: replaced `event.id = response.id; event.synced = true; stateService.save()` with `stateService.markEventSynced(event.timestamp, response.id)`
- `syncDelete` subscribe next: replaced `event.synced = true; stateService.save()` with `stateService.markDeletionSynced(event.timestamp)`

Angular change detection now correctly fires because signal array is replaced by a new array reference on each sync state update.

### Task 3 — E2E Assertion Order

Reordered persistence check in `apps/frontend-e2e/src/live-console.spec.ts` lines 95-100:
- Event log check (`toContainText('GOAL')`) moved before clock display check
- Ensures Angular signals have initialized (hydrated from localStorage) before clock assertion runs
- Reduces flakiness without changing assertion semantics

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Threat Surface Scan

No new network endpoints, auth paths, or trust-boundary schema changes introduced. LocalStorage writes are constrained to `apex_clock_${gameId}` keys (coach-controlled, low-value attack surface per plan threat model T-06-08-01). No new threat flags.

## Self-Check

### Files exist:
- [x] libs/client/feature/game-console/src/lib/live-clock.service.ts — FOUND
- [x] libs/client/feature/game-console/src/lib/live-game-state.service.ts — FOUND
- [x] libs/client/feature/game-console/src/lib/event-sync.service.ts — FOUND
- [x] libs/client/feature/game-console/src/lib/console-wrapper/console-wrapper.ts — FOUND
- [x] apps/frontend-e2e/src/live-console.spec.ts — FOUND

### Commits exist:
- [x] ffb9f19 — Task 1 (clock persistence)
- [x] cad66cf — Task 2 (signal immutability)
- [x] c43326f — Task 3 (E2E assertion)

### Acceptance criteria:
- [x] `apex_clock_` appears 2+ times in live-clock.service.ts (found: 2)
- [x] `event.id = response.id` appears 0 times in event-sync.service.ts (found: 0)
- [x] `markEventSynced` defined in live-game-state.service.ts (found: 1)
- [x] `markDeletionSynced` defined in live-game-state.service.ts (found: 1)
- [x] `not.toHaveText('00:00')` appears in live-console.spec.ts (found: 2 — one earlier in test, one in persistence block)
- [x] Event log assertion appears BEFORE clock assertion in persistence block (line 98 before line 100)
- [x] TypeScript check passes with no errors

## Self-Check: PASSED
