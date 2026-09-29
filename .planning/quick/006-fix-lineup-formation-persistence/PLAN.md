# Quick Task Plan: Fix Lineup Formation Persistence & Pitch View Rendering (Issue #52)

## Problem
In the lineup editor and game console:
1. Formations such as 1-3-4-1 (3 DEF, 4 MID, 1 FWD), 1-2-5-1 (2 DEF, 5 MID, 1 FWD), 2-4-2, and 3-2-2-1 (box midfield) are not reliably supported or rendered cleanly.
2. In 9v9 events, a "phantom 10th player" bug can occur when switching formations, substituting players, or loading legacy data where `playersOnField` was originally 11.
3. Live game console (`LiveGameStateService`) active players can desync with the saved lineup when starters have null slot indices or when substitution events don't clean up the outgoing player's slot, causing phantom extra players.
4. Midfield slots were confined to a single flat line (y: 44, slots 6-10), preventing staggered midfield layouts like 3-2-2-1 (CDM/CAM).

## Solution Architecture

1. **Pitch View Coordinates & Model Support**:
   - In `libs/shared/util/models/src/lib/lineup-entry.model.ts`:
     - Update `getPositionFromSlot` to support slots 16-21 as `MID` (CDM / CAM coordinates).
   - In `libs/client/feature/game-console/src/lib/soccer-pitch-view/soccer-pitch-view.ts`:
     - Expand `slotCoordinates` to include:
       - Defensive midfield (CDM): slot 16 (x: 35, y: 56), slot 17 (x: 65, y: 56), slot 18 (x: 50, y: 56)
       - Attacking midfield (CAM): slot 19 (x: 35, y: 32), slot 20 (x: 65, y: 32), slot 21 (x: 50, y: 32)
   - In `soccer-pitch-view.scss` & `console-wrapper.html`:
     - Ensure `:host { display: block; width: 100%; height: 100%; position: relative; }` and proper flex styling so the pitch view never collapses.
   - In `apps/api/src/analytics/playing-time.service.ts`:
     - Update `getPositionFromSlot` to recognize slots 16-21 as `MID`.

2. **Backend Lineup Validation (`apps/api/src/events/lineup-entries.service.ts`)**:
   - Inject `Repository<EventEntity>` into `LineupEntriesService`.
   - In `saveLineup(eventId, dto)`:
     - Fetch the event to determine `event.playersOnField`.
     - Enforce `playersOnField` strictly: starters (excluding libero slot 99) exceeding `event.playersOnField` are demoted to `status: 'bench'` with `slotIndex: null`.
   - In `findByGame(eventId)`:
     - Add deterministic ordering: `order: { slotIndex: 'ASC', createdAt: 'ASC' }`.

3. **Frontend Lineup Editor (`apps/frontend/src/app/teams/events/lineup-editor/lineup-editor.ts`)**:
   - In `loadData()`:
     - Strictly enforce `newSlots.length < fieldCount` in Step 1 so extra starters in the database are not added to on-field slots.
     - Support candidate slots up to 21 when filling remaining slots.
   - In `updateSlot()`:
     - Only change `slotIndex` if the position category (`currentPos !== newPos`) actually changed.
     - Search candidate slots including 16-21 for `MID`.
   - In `handlePitchEmptySlotSelected()`:
     - Properly handle moving on-pitch players to empty slots without creating ghost slots.
     - If total non-libero slots exceed `fieldCount`, prune empty slots.
   - In `onSave()`:
     - Validate that active starters do not exceed `fieldCount`.
   - In `lineup-editor.html`:
     - Use `@for (slot of slots(); track idx; let idx = $index)` to prevent DOM teardown on position change.

4. **Live Game State Service (`libs/client/feature/game-console/src/lib/live-game-state.service.ts`)**:
   - In `activePlayers`:
     - Cap initial starters at `this._playersOnField()`.
     - For starters with `slotIndex === null`, assign available default slots up to `playersOnField`.
     - In `SUB` event handling: find and remove `event.playerIdOut` from `slotMap` before placing the incoming player, preventing slot duplication.

5. **Testing & Verification**:
   - Unit tests in `lineup-entries.service.spec.ts` testing `playersOnField` capping.
   - Unit tests in `live-game-state.service.spec.ts` verifying 1-3-4-1, 1-2-5-1, and sub slot handling.
   - Unit tests in `lineup-editor.spec.ts` verifying 1-3-4-1 and 1-2-5-1 formation layout and persistence.
   - Run Vitest for `api`, `client-feature-game-console`, and `frontend`.
