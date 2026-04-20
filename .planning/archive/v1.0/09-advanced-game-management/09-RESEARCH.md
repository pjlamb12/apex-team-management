# Phase 9 Research: Season Defaults & Advanced Console

## 1. Domain Model Changes

### Season Defaults (SEAS-01, SEAS-02)
We need to store default configuration at the season level.
- **SeasonEntity:**
    - `defaultHomeVenue`: string (location name)
    - `defaultHomeColor`: string (jersey color)
    - `defaultAwayColor`: string (jersey color)

### Game Home/Away Toggle (GAME-05)
- **GameEntity:**
    - `isHomeGame`: boolean (default: true)

## 2. Live Console Interaction Refactor

### Current Implementation Gap
The `LiveGameStateService.activePlayers` signal reconstructs the field based on `preferredPosition`.
If two players have the same position (e.g., both "Defender"), swapping one with a bench player currently depends on finding the player ID in a Map. 
If we want to support **On-Field Position Swaps** (LIVE-10), we need stable "Slots".

### Proposed Slot System
1. **Initial State:** `initialLineup` (from DB) provides the starting 11. We assign each starting entry a `slotIndex` (0–10).
2. **Event Payload Updates:**
    - `SUB`: Now includes `slotIndex` to identify exactly which physical spot is being swapped.
    - `POSITION_SWAP`: New event type with `playerIdA`, `playerIdB`. Swaps their currently assigned slots.
3. **Computation:**
    - `LiveGameStateService` maintains an array of 11 slots.
    - `activePlayers` computed signal returns players mapped to their current slots.
    - `SoccerPitchView` renders based on `slotIndex` coordinates (fixed for each index) rather than grouping by `preferredPosition`.

## 3. Undo Logic Fix (LIVE-05)
Currently, Undo simply marks the last event as `deleted`.
With the slot system, as long as `activePlayers` is derived by re-playing the event stream in order, Undo will naturally restore the previous slot assignments.

## 4. UI/UX Plan

### Team Dashboard / Season Settings
- Add "Season Settings" modal or section in `edit-team` to manage default venue and colors.

### Create Game
- Add a Toggle/Segment for "Home / Away".
- When "Home" is selected: Location = `season.defaultHomeVenue`, Uniform = `season.defaultHomeColor`.
- When "Away" is selected: Location = "", Uniform = `season.defaultAwayColor`.

### Live Console
- **Two-Tap Logic:**
    - Tap Active + Tap Bench = `SUB` (takes slot of Active).
    - Tap Active + Tap Active = `POSITION_SWAP` (swaps their slots).
    - Tap Bench + Tap Bench = Change selection.
