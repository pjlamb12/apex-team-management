# Phase 9, Plan 3 Summary: Slot-Aware Live Game State

**Status:** Completed
**Date:** 2026-04-20T06:01:08Z

## 1. Goal
Refactor the live game state to use stable slot indices (0-10) for tracking on-field players, enabling precise position-based interactions and reliable undo.

## 2. Changes

### Frontend (Angular / Signals)
- **LiveGameStateService:**
    - Updated `LineupEntry` to include `slotIndex`.
    - Updated `GameEvent` to include `slotIndex`, `playerIdA/B`, and `slotIndexA/B`.
    - Refactored `activePlayers` computed signal to use a `Map<number, ...>` keyed by `slotIndex`.
    - Implemented slot-based logic for `SUB` events.
    - Implemented `POSITION_SWAP` event handling to exchange players between slots while preserving slot-based position labels.
    - Verified that `undo()` correctly restores the slot mapping by reprocessing the event stream.
- **EventSyncService:**
    - Verified that generic sync logic correctly propagates new slot-related fields to the backend.
    - Added comprehensive tests for `SUB` (with slots) and `POSITION_SWAP` syncing.

## 3. Verification Results
- **Unit Tests:** `npx nx test client-feature-game-console` passed (13/13 tests in relevant files).
- **Slot Tracking:** Verified that starting players are correctly mapped to slots and substitutions preserve these slots.
- **Position Swaps:** Verified that two players on the pitch can swap their assigned slots/positions.

## 4. Next Steps
Move to Wave 3:
- **09-04-PLAN.md:** Update Console UI to trigger slot-based events and handle 2-tap swaps.
