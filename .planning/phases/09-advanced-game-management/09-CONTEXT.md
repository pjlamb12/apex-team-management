# Phase 9 Context: Season Defaults & Advanced Console

**Status:** Initializing
**Last Updated:** 2026-04-19

## 1. Goal
Enhance the season management layer with sensible defaults (venues, colors) and refine the live game console to handle high-fidelity lineup interactions and reliable undo state.

## 2. Core Requirements
- **SEAS-01:** Default home field/venue for seasons.
- **SEAS-02:** Default home/away jersey colors for seasons.
- **GAME-05:** Home/Away toggle for games with inheritance from season defaults.
- **LIVE-05 (fix):** Undo substitution restores correct position slots.
- **LIVE-09:** Precise position-slot takeovers for bench players swapping in.
- **LIVE-10:** On-field player position swaps (2-tap interaction).

## 3. Technical Strategy

### Backend (NestJS / TypeORM)
- **SeasonEntity:** Add `defaultHomeVenue`, `defaultHomeColor`, `defaultAwayColor`.
- **GameEntity:** Add `isHomeGame` (boolean).
- **Migration:** Create migration for new schema fields.
- **GamesService:** Update `create` logic to pre-fill fields from active season when `isHomeGame` is toggled.

### Frontend (Angular / Signals)
- **Season Settings:** Add UI to `edit-team` (or a new `season-settings`) to manage defaults.
- **Game Creation:** Add Home/Away toggle; reactive update of location/color based on toggle.
- **LiveGameStateService:** 
    - Refactor `activePlayers` computed logic to be slot-aware (index-based).
    - Update `undo` to restore not just the player ID but the position slot mapping.
- **ConsoleWrapper:**
    - Handle "On-Field + On-Field" tap sequence to trigger a position swap event.
    - Ensure SUB events preserve the intended position slot.

## 4. Interaction Flow: Position Swap (LIVE-10)
1. Coach taps Player A on the pitch (Selected).
2. Coach taps Player B on the pitch.
3. System detects both are active.
4. System emits `POSITION_SWAP` event (or SUB with re-mapping).
5. UI updates immediately showing Player A and B in each other's circles.

## 5. Success Criteria
1. Seasons store defaults for venue and colors.
2. New games pre-fill based on Home/Away selection.
3. Live console correctly manages slot-based substitutions.
4. On-field players can swap positions in 2 taps.
5. Undo works perfectly even after complex position shifts.
