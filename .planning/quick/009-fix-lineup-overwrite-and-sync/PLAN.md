# Quick Task Plan: Prevent Lineup Overwrites & Enable Real-Time Lineup Sync

## Problem
1. **Destructive "Go Live"**: Tapping "Go Live" in `LineupEditor` unconditionally executed `onSave(true)`, overwriting the lineup in PostgreSQL even if the user made zero edits (e.g. an assistant coach entering the live console with a stale cached PWA bundle).
2. **Schedule Routing**: Match status remained `'scheduled'` even after clock started, forcing coaches tapping the game on the schedule to route to `LineupEditor` instead of `ConsoleWrapper`.
3. **No Real-Time Lineup Sync**: `LineupEntriesService.saveLineup` did not broadcast any websocket event. Clients in the lineup editor or game console were never notified when another coach modified the lineup.
4. **Console Bypassing Offline Storage**: `ConsoleWrapper` called `http.get('/lineup')` directly instead of `eventsService.getLineup(...)`, ignoring IndexedDB fallback and caching.

## Solution Architecture
1. **LineupEditor Dirty Tracking & Safe Navigation**:
   - In `apps/frontend/src/app/teams/events/lineup-editor/lineup-editor.ts`:
     - Maintain `initialSlotsSignature = signal<string | null>(null)` and `isDirty = computed(...)`.
     - In `onSave(goLive = true)`: if `!isDirty()`, bypass `saveLineup` HTTP call and navigate directly to `/console`.
     - Update button labels in `lineup-editor.html` to reflect state ("Go Live" vs "Save & Go Live", disable "Save" when not dirty).
     - Inject `SocketService` to join `event:${eventId}` and listen for `lineupUpdated`:
       - If `!isDirty()`, silently refresh data.
       - If `isDirty()`, notify coach via toast message.
2. **Backend WebSocket Broadcast on Lineup Save**:
   - In `apps/api/src/events/lineup-entries.service.ts`:
     - Inject `SocketGateway`.
     - After saving lineup, emit `lineupUpdated` to `event:${eventId}` and `team:${teamId}`.
3. **Live Console Real-Time Lineup Sync**:
   - In `libs/client/feature/game-console/src/lib/console-wrapper/console-wrapper.ts`:
     - Listen for `lineupUpdated` event and call `this.stateService.updateInitialLineup(lineup)`.
     - Switch lineup fetch to use `eventsService.getLineup(...)` instead of raw `http.get`.
     - Update `event.status` to `'in_progress'` in `startClock()`.
4. **Schedule Navigation**:
   - In `apps/frontend/src/app/teams/events/schedule/schedule.ts`:
     - In `getEventLink()`, if `event.status === 'in_progress'` or `clockStartTime` is active or `clockAccumulatedMs > 0`, route directly to `/console`.
5. **Testing & Verification**:
   - Update `lineup-entries.service.spec.ts` to mock `SocketGateway` and verify `lineupUpdated` emission.
   - Update `lineup-editor.spec.ts` to verify `isDirty` tracking and safe "Go Live" navigation without calling `saveLineup`.
   - Update `console-wrapper.spec.ts` and `schedule.spec.ts` as needed.
   - Run Vitest tests with `--watch=false` to ensure 100% pass.
