---
phase: 17-tactical-sub-queue
plan: 03
subsystem: game-console
tags: [integration, bulk-actions, sub-queue]
dependency_graph:
  requires: [17-02]
  provides: [Batch Substitution Logic]
  affects: [ConsoleWrapper]
tech_stack: [Angular Signals, RxJS]
key_files:
  - libs/client/feature/game-console/src/lib/console-wrapper/console-wrapper.ts
  - libs/client/feature/game-console/src/lib/console-wrapper/console-wrapper.html
decisions:
  - Substitution staging uses tap-tap interaction (bench then pitch).
  - Bulk application captures current minute once for all events in the batch.
  - Slot lookup for outgoing players is dynamic at time of application.
metrics:
  duration: 45m
  completed_date: "2026-04-24"
---

# Phase 17 Plan 03: Integration Summary

## Substantive Summary
Integrated the tactical sub-queue into the main Game Console and implemented the bulk application logic. Coaches can now stage multiple substitutions by tapping a bench player followed by a pitch player (or vice versa), and then apply them all at once with a single tap.

## Key Changes
- **ConsoleWrapper**:
    - Integrated `SubQueueComponent` into the layout.
    - Updated `handlePlayerSelection` to support substitution staging when a bench player and an active player are selected.
    - Implemented `handleApplySubs()` to process all staged substitutions as a bulk operation, ensuring consistent timestamps and minutes for the entire batch.
    - Implemented `handleUnstageSub()` and `handleClearSubs()` for queue management.
- **Event Log Fix**:
    - Fixed a bug where undone events were still visible in the event log.
    - Added a toast notification for "Undo Last" actions.
    - Added a clarifying note to the Event Log UI about the permanent nature of undoing.

## Deviations from Plan
- Automated E2E tests for the batch sub-queue were postponed due to environment setup complexities (Playwright protocol error). Manual verification was performed to ensure functionality meets requirements.
- Added UX improvements to the Event Log (Undo toast and note) based on user feedback during the phase.

## Self-Check: PASSED
- [x] Coach can stage substitutions via tap-tap.
- [x] Batch Apply creates multiple SUB events with identical timestamps.
- [x] UI remains accurate even if players change positions while staged.
- [x] Undo removes events from the UI list.
