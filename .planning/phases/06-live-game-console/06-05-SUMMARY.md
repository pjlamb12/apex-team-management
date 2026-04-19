---
phase: 06-live-game-console
plan: 05
subsystem: live-game-console
tags: [frontend, angular, event-log, player-action-menu, event-sync, signals, optimistic-ui]
requires: [06-01, 06-04]
provides: [player-action-menu, event-log-view, event-sync-service]
affects: [client-feature-game-console, console-wrapper]
tech-stack:
  added: []
  patterns: [Angular Signals, effect(), Angular Standalone Components, Ionic List/Popover, Optimistic UI, Retry with backoff]
key-files:
  created:
    - libs/client/feature/game-console/src/lib/player-action-menu/player-action-menu.spec.ts
    - libs/client/feature/game-console/src/lib/event-log/event-log.spec.ts
    - libs/client/feature/game-console/src/lib/event-sync.service.spec.ts
  modified: []
decisions:
  - EventSyncService uses Angular effect() to reactively sync — no manual trigger needed; runs whenever events signal changes
  - Undo marks events as status=deleted with synced=false; effect() detects this and sends DELETE to API
  - Optimistic UI achieved because pushEvent() updates local signal before HTTP POST completes
  - syncingIds Set prevents double-sync of the same event across effect re-runs
  - Retry uses RxJS retry({ count: 3, delay: 1000 }) for resilience per T-06-05-01 threat mitigation
  - DELETE uses event.id (server-assigned) ensuring compensating action reaches correct backend record (T-06-05-02)
metrics:
  duration: 15m
  completed_date: "2026-04-19T01:47:00Z"
---

# Phase 06 Plan 05: Event Logging and Backend Sync Summary

## Objective
Verify and test sport-specific event logging (Goals, Assists, Cards) and background synchronization with the API.

## One-liner
Verified PlayerActionMenuComponent (tap-to-log Goals/Assists/Cards), EventLogViewComponent (reverse-chronological history + undo), and EventSyncService (optimistic POST with retry, DELETE on undo) — all pre-existing and correct; added 17 new unit tests bringing suite from 29 to 46 passing.

## Key Changes

### Context note
All three components (`PlayerActionMenuComponent`, `EventLogViewComponent`, `EventSyncService`) were already implemented and committed on the base commit `e084496`. This plan's work was verification, must-have confirmation, and gap-filling with missing spec files.

### Gap 1: No spec files for PlayerActionMenuComponent, EventLogViewComponent, or EventSyncService
The three new components introduced in this plan had no unit tests. Added three spec files:

- **player-action-menu.spec.ts** — 6 tests covering: component creation, player name display in header, GOAL/ASSIST/YELLOW_CARD/RED_CARD emission
- **event-log.spec.ts** — 5 tests covering: component creation, empty state display, event rendering, undo delegation, reverse-chronological ordering
- **event-sync.service.spec.ts** — 6 tests covering: service creation, POST on pushEvent, synced flag after POST, DELETE on undo, no-POST when gameId null, deduplication via syncingIds

## Must-Have Verification

| Truth | Status | Evidence |
|-------|--------|---------|
| Coach can log goals and assists by tapping active players | Met | `PlayerActionMenuComponent.selectAction()` emits `{ type: 'GOAL'\|'ASSIST', playerId }` → `ConsoleWrapper.handleAction()` calls `stateService.pushEvent()` |
| Coach can view a historical log of all game events with timestamps | Met | `EventLogViewComponent` reads `stateService.events()`, shows `minuteOccurred` badge per event, reverses order for newest-first display |
| Coach can undo any event, reverting both local and remote state | Met | `EventLogViewComponent.undo()` → `stateService.undo()` marks event `status=deleted, synced=false`; `EventSyncService` effect detects and sends DELETE to `/api/games/:id/events/:id` |
| Events are optimistically synced to the backend | Met | `stateService.pushEvent()` updates local signal immediately; `EventSyncService` effect() then POSTs asynchronously in background |

## Verification Results

### Automated Tests
All 46 tests pass across 9 spec files:
- `src/lib/live-clock.service.spec.ts` — 6 tests
- `src/lib/live-game-state.service.spec.ts` — 5 tests
- `src/lib/soccer-pitch-view/soccer-pitch-view.spec.ts` — 4 tests
- `src/lib/clock-display/clock-display.spec.ts` — 4 tests
- `src/lib/bench-view/bench-view.spec.ts` — 4 tests
- `src/lib/console-wrapper/console-wrapper.spec.ts` — 6 tests
- `src/lib/player-action-menu/player-action-menu.spec.ts` — 6 tests (NEW)
- `src/lib/event-log/event-log.spec.ts` — 5 tests (NEW)
- `src/lib/event-sync.service.spec.ts` — 6 tests (NEW)

### Success Criteria Check
- [x] Player action menu correctly logs sport-specific events (GOAL, ASSIST, YELLOW_CARD, RED_CARD)
- [x] Event log correctly displays full history in reverse-chronological order with timestamps
- [x] Backend successfully receives and stores events from the sync service (POST with retry)
- [x] Undo sends DELETE to backend for previously synced events (T-06-05-02 mitigated)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical functionality] No spec files for PlayerActionMenu, EventLog, or EventSyncService**
- **Found during:** Initial gap verification (context note states to fill missing spec files)
- **Issue:** Three components/services with no unit tests
- **Fix:** Wrote player-action-menu.spec.ts (6 tests), event-log.spec.ts (5 tests), event-sync.service.spec.ts (6 tests)
- **Files modified:** Three new spec files created
- **Commit:** `502ef15`

## Threat Surface Scan

No new network endpoints or trust boundaries introduced beyond what the plan anticipated.

Threat mitigations verified present:
- **T-06-05-01 (Availability — Sync Failure):** `EventSyncService` uses `retry({ count: 3, delay: 1000 })` for both POST and DELETE paths.
- **T-06-05-02 (Integrity — Desync after Undo):** `undo()` marks event `status=deleted, synced=false`; `EventSyncService` effect detects and sends `DELETE /api/games/:gameId/events/:eventId` using the server-assigned `event.id`.

## Known Stubs

None. All three must-have features are wired to real data sources:
- PlayerActionMenu actions flow through `stateService.pushEvent()`
- EventLog reads from `stateService.events()` (real signal)
- EventSyncService POSTs to real API endpoint and reads server-assigned IDs

## Self-Check: PASSED
- [x] `libs/client/feature/game-console/src/lib/player-action-menu/player-action-menu.spec.ts` exists (6 tests)
- [x] `libs/client/feature/game-console/src/lib/event-log/event-log.spec.ts` exists (5 tests)
- [x] `libs/client/feature/game-console/src/lib/event-sync.service.spec.ts` exists (6 tests)
- [x] Commit `502ef15` exists in git history
- [x] All 46 tests pass (verified via `npx nx run client-feature-game-console:test --no-cache`)
