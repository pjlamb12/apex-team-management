# Phase 13 Research: Advanced Game Management

## Status
- [x] Identify missing fields in `SeasonEntity` DTOs
- [x] Identify necessary fields for `EventEntity`
- [x] Explore Live Console integration for period tracking
- [x] Explore "End Game" logic

## Data Model Changes

### SeasonEntity
- `periodCount`: number (integer) - Default number of periods (e.g., 2 for halves, 4 for quarters).
- `periodLengthMinutes`: number (integer) - Duration of each period.
*Note: These are already in the Entity but missing from DTOs.*

### EventEntity (Game)
- `periodCount`: number (integer, nullable) - Override for this specific game.
- `periodLengthMinutes`: number (integer, nullable) - Override for this specific game.
- `currentPeriod`: number (integer, default: 1) - Track current period during the game.
- `status`: 'scheduled' | 'in_progress' | 'completed' - Already exists. "End Game" will transition to `completed`.

### GameEventEntity
- Log individual events with their period.
- Add `period` to the `payload` JSONB of `GameEventEntity`. This avoids a table migration for `game_events`.

## Frontend Changes

### Season Management
- Add "Default Game Format" section to Season create/edit forms.
- Fields: "Number of Periods", "Period Length (mins)".
- Update `CreateSeasonDto` and `UpdateSeasonDto` on the backend.

### Game Creation/Edit
- Add "Game Format" section (optional overrides).
- Pre-fill from Active Season if not set on the game.
- Update `CreateEventDto` and `UpdateEventDto` on the backend.

### Live Console
- Display current period (e.g., "1st Half", "Period 2").
- "Start Next Period" button (if periods remain).
- "End Game" button.
- Logic to transition periods and update `currentPeriod`.
- Log a special `PERIOD_START` or `PERIOD_END` event? (Decided: No, just tag each event with `period`).
- When "Next Period" is clicked:
    1. Stop clock.
    2. Reset clock to 0:00 (for the new period).
    3. Increment `currentPeriod`.
    4. Sync `currentPeriod` to backend `EventEntity`.
- When "End Game" is clicked:
    1. Stop clock.
    2. Set status to `completed`.
    3. Sync status to backend `EventEntity`.
    4. Navigate to Game Summary.

## Live Console Analysis

### `LiveGameStateService`
- Add `currentPeriod` signal.
- Update `pushEvent` to include the `currentPeriod` in the event payload.
- Add `nextPeriod()` and `endGame()` methods.

### `LiveClockService`
- Add `reset()` (already exists but ensures it's usable for periods).
- Maybe add a way to track *total* elapsed time across periods if needed for analytics.

### `ConsoleWrapper`
- Add UI for period control.
- Show "Next Period" instead of just "Start/Stop" when a period is over? Or separate buttons.
- Soccer usually has a fixed period length. We could auto-stop or just notify the coach.
- v1.1 will keep it manual: Coach clicks "Next Period".

## Questions & Decisions
- **D-13-01:** Clock reset? Yes, for youth sports, resetting the clock to 0:00 for each period is standard.
- **D-13-02:** Period naming? For now, generic "Period X" or "Half X" based on `periodCount`. If `periodCount` is 2, use "Half". If 4, use "Quarter". Else "Period".
- **D-13-03:** Explicit "End Game"? Yes, transitions status to `completed`.
