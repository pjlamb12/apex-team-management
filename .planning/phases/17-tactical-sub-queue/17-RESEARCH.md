# Research: Phase 17 - Tactical Sub-Queue (REVISED)

## Goal
Implement a staging mechanism for substitutions that allows coaches to prepare multiple changes and execute them in bulk.

## Revised Architecture

### 1. Data Model
Update `StagedSub` interface (simplified per feedback):
```typescript
export interface StagedSub {
  inPlayerId: string;
  outPlayerId: string;
}
```
**Constraint:** `slotIndex` and `positionName` are removed from the staged state. They must be resolved dynamically from the current `activePlayers` state at the time of rendering or execution. This ensures that if a `POSITION_SWAP` occurs after a sub is staged, the sub will still happen at the correct physical slot.

### 2. Service Layer (`LiveGameStateService`)
- Store `stagedSubs` as a signal.
- **Bulk Updates:** Add `pushEvents(events: GameEvent[])` to allow atomic updates of the event log. This reduces signal thrashing and ensures a single `localStorage` write per batch.
- **Staging Logic:** `stageSub` must enforce player uniqueness. A player (whether bench or field) can only be involved in ONE pending substitution. Staging a player who is already part of a pair should replace the old pair.

### 3. UI Components
- **SubQueueComponent**: Displays staged pairs. Looks up names/numbers from `initialLineup` for display.
- **SoccerPitchView**: 
    - Inputs: `stagedSubs`.
    - Logic: Finds the current `slotIndex` of the `outPlayerId` in `activePlayers()`.
    - Renders the `inPlayerId` at that `slotIndex` with a "staged" visual state.
- **BenchView**: Highlights players who are in the `stagedIn` set.

### 4. Interaction Flow
- User taps bench player -> `selectedPlayerId` set.
- User taps active player -> `LiveGameStateService.stageSub(in, out)` called.
- User clicks "Apply" in `SubQueueComponent`:
    1. Capture `currentMinute()` and `timestamp`.
    2. Map `stagedSubs` to `GameEvent[]`.
    3. Resolve `slotIndex` for each `outPlayerId`.
    4. Call `stateService.pushEvents(batch)`.
    5. Clear the queue.

## Pitfalls to Avoid
- **Stale Slots:** Avoid caching `slotIndex` in the `StagedSub` object. Always look it up from the latest `activePlayers` computed signal.
- **Signal Spam:** Use `pushEvents` to avoid triggering effects multiple times for a single logical "Apply" action.
- **Player Overlap:** Enforce the "one sub per player" rule in the service to prevent confusing UI states (e.g., one bench player appearing to sub in for two people).
