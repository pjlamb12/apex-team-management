---
phase: 06-live-game-console
reviewed: 2026-04-18T12:00:00Z
depth: standard
files_reviewed: 7
files_reviewed_list:
  - apps/api/src/migrations/1776510000000-AddEventDefinitionsToSport.ts
  - apps/api/src/games/games.service.ts
  - libs/client/feature/game-console/src/lib/console-wrapper/console-wrapper.ts
  - libs/client/feature/game-console/src/lib/live-clock.service.ts
  - libs/client/feature/game-console/src/lib/live-game-state.service.ts
  - libs/client/feature/game-console/src/lib/event-sync.service.ts
  - apps/frontend-e2e/src/live-console.spec.ts
findings:
  critical: 1
  warning: 5
  info: 4
  total: 10
status: issues_found
---

# Phase 06: Code Review Report (Plans 06-07 / 06-08 Update)

**Reviewed:** 2026-04-18T12:00:00Z
**Depth:** standard
**Files Reviewed:** 7
**Status:** issues_found

## Summary

This review covers the backend sync mismatch fixes (06-07) and clock persistence + signal immutability improvements (06-08). The seven files implement: sport-specific event definitions via database migration, payload schema validation in the games service, clock persistence to `localStorage`, immutable signal updates via `markEventSynced`/`markDeletionSynced`, and an E2E test covering the full game flow with reload persistence checks.

The signal immutability fix and clock persistence are correctly implemented. The most significant remaining issue is a SUB event payload field name mismatch between the front-end (`playerIdIn`/`playerIdOut`) and the backend JSON Schema (`inPlayerId`/`outPlayerId`) — all substitution events will be rejected by the API. A secondary concern is that the migration defines both a generic `CARD` type and separate `YELLOW_CARD`/`RED_CARD` types with overlapping semantics, creating an ambiguous API contract. Several smaller logic issues are documented below.

---

## Critical Issues

### CR-01: SUB event payload field names do not match the backend JSON Schema

**File:** `libs/client/feature/game-console/src/lib/console-wrapper/console-wrapper.ts:161-168`
**Also:** `apps/api/src/migrations/1776510000000-AddEventDefinitionsToSport.ts:37-45`

**Issue:** When a substitution is pushed via `stateService.pushEvent`, the event object uses the keys `playerIdIn`, `playerIdOut`, and `positionName`. In `EventSyncService.syncAdd`, these fields survive the stripping step (only `type`, `timestamp`, `minuteOccurred`, `synced`, `status`, and `id` are deleted) and are sent as the `payload` body to the API.

The backend's JSON Schema for the `SUB` event type (migration line 37-44) declares the required properties as `inPlayerId`, `outPlayerId`, and `positionName`. Because `playerIdIn` and `playerIdOut` (sent by the client) do not match `inPlayerId` and `outPlayerId` (required by the schema), AJV validation will fail with a `BadRequestException` for every substitution, even though the console UI confirms the swap locally.

**Fix:** Align either the client field names or the schema keys. The simplest fix is to rename in `console-wrapper.ts` at the `pushEvent` call site:

```typescript
// console-wrapper.ts — line 161
this.stateService.pushEvent({
  type: 'SUB',
  inPlayerId: inPlayerId,      // was playerIdIn
  outPlayerId: outPlayerId,    // was playerIdOut
  positionName,
  timestamp: Date.now(),
  minuteOccurred: this.clockService.currentMinute(),
});
```

Also update `live-game-state.service.ts` line 53 where SUB events are applied to `activePlayers`:

```typescript
// live-game-state.service.ts — line 53
if (event.type === 'SUB' && event.inPlayerId && event.outPlayerId) {
  const outPlayer = currentActive.get(event.outPlayerId);
  if (outPlayer) {
    const inEntry = lineup.find(e => e.playerId === event.inPlayerId);
    // ...
  }
}
```

---

## Warnings

### WR-01: Duplicate and conflicting card event type definitions in the migration

**File:** `apps/api/src/migrations/1776510000000-AddEventDefinitionsToSport.ts:49-79`

**Issue:** The migration registers three card-related event definitions: `CARD` (with a `color` enum field), `YELLOW_CARD` (no `color` field), and `RED_CARD` (no `color` field). The front-end's `handleAction` in `console-wrapper.ts` emits `YELLOW_CARD` and `RED_CARD` as event types directly. `EventSyncService` sends these types verbatim to the API as `eventType`.

The API will match `YELLOW_CARD` to its own definition (requiring only `playerId`) and `RED_CARD` similarly, so these calls will succeed. However, the generic `CARD` definition (which requires `playerId` + `color`) is never used by the front-end, creating dead schema. More importantly, the payload for `YELLOW_CARD` and `RED_CARD` events does not include a `color` field, which means any downstream reporting that joins on `event_type = 'CARD'` will miss these events, and code that attempts to distinguish yellow from red by `payload.color` will find it missing on `YELLOW_CARD`/`RED_CARD` events.

**Fix:** Remove the redundant `CARD` definition and standardize on `YELLOW_CARD` and `RED_CARD` in the migration, or remove `YELLOW_CARD`/`RED_CARD` and map the front-end to `CARD` with a `color` payload field. Whichever is chosen, the migration and front-end must agree on a single approach.

---

### WR-02: `clockService.initialize(gameId)` in `tap` reads `this.gameId()` signal, not the pipeline value

**File:** `libs/client/feature/game-console/src/lib/console-wrapper/console-wrapper.ts:88-92`

**Issue:**

```typescript
tap((lineup) => {
  const gameId = this.gameId();   // reads the signal
  if (gameId) {
    this.stateService.initialize(gameId, lineup);
    this.clockService.initialize(gameId);
  }
})
```

`this.gameId()` is a `toSignal` that is also derived from `paramMap`. Because signals in Angular are synchronous and `toSignal` subscribes to the observable at construction time, this will work in practice — both signals read from the same source and `paramMap` emits synchronously on first subscription. However, the `clockService.initialize(gameId)` call is inside the `tap` callback where `id` is already available from the `switchMap` closure. Depending on `this.gameId()` creates a fragile implicit coupling that would silently break if the `gameId` signal was ever initialized with a `defaultValue` of `null` and the paramMap emission was delayed (e.g., in unit tests or server-side rendering). The `stateService.initialize` call correctly uses the pipeline `id` at the `switchMap` level but the clock does not.

**Fix:** Pass the `id` from the switchMap pipe into the tap instead of calling the signal:

```typescript
protected lineup = toSignal(
  this.route.paramMap.pipe(
    map((params) => params.get('gameId')),
    filter((id): id is string => !!id),
    switchMap((id) =>
      this.http.get<LineupEntry[]>(`${this.apiUrl}/games/${id}/lineup`).pipe(
        tap((lineup) => {
          this.stateService.initialize(id, lineup);
          this.clockService.initialize(id);   // use pipeline `id`, not this.gameId()
        })
      )
    )
  )
);
```

---

### WR-03: `syncingIds` set is keyed on `timestamp-index`; index is unstable if events are ever compacted

**File:** `libs/client/feature/game-console/src/lib/event-sync.service.ts:29` and `43-45`

**Issue:** `getEventTempId` returns `${event.timestamp}-${index}` where `index` is the position in the `events()` array at the time the `effect` fires. Because `undo()` soft-deletes events (marks `status: 'deleted'`) rather than splicing them, and `initialize()` restores the full persisted array, indices remain stable for the lifetime of a single session. However:

1. If two events are logged at the same millisecond (e.g., rapid taps), they share the same `timestamp` but different indices. Their temp IDs will be `X-0` and `X-1`. If the array is ever reordered or the effect fires between insertions, the indices can collide, causing one event to skip sync.
2. `stateService.markEventSynced` (line 128-136 of `live-game-state.service.ts`) looks up events by `localTimestamp` (`e.timestamp === localTimestamp`). If two events share a timestamp, both will be marked synced when only one has been confirmed by the backend.

**Fix:** Assign a stable `localId` at `pushEvent` time:

```typescript
// live-game-state.service.ts — pushEvent
public pushEvent(event: GameEvent): void {
  this._events.update((prev) => [
    ...prev,
    { ...event, status: 'active', localId: crypto.randomUUID() },
  ]);
  this.save();
}

// event-sync.service.ts — use localId as the stable key
private getEventTempId(event: GameEvent): string {
  return event.localId ?? `${event.timestamp}`;
}

// live-game-state.service.ts — markEventSynced: match on localId instead of timestamp
public markEventSynced(localId: string, backendId: string): void {
  this._events.update((prev) =>
    prev.map((e) =>
      e.localId === localId ? { ...e, id: backendId, synced: true } : e
    )
  );
  this.save();
}
```

---

### WR-04: `removeEvent` authorization uses optional chaining that returns misleading error when relations are missing

**File:** `apps/api/src/games/games.service.ts:168`

**Issue:** The authorization check is:

```typescript
if (event.game?.season?.team?.coachId !== userId) {
  throw new ForbiddenException('Not authorized to remove events for this game');
}
```

If any relation in the chain is `undefined` (e.g., the TypeORM `relations` join produced incomplete data), `coachId` resolves to `undefined`, and `undefined !== userId` is always `true`. The operation is correctly blocked, but the caller receives `403 Forbidden` with the message "Not authorized" when the real cause is a data integrity problem. This masks bugs and makes debugging difficult.

**Fix:**

```typescript
if (!event.game?.season?.team) {
  throw new BadRequestException('Event data incomplete: missing game, season, or team relation');
}
if (event.game.season.team.coachId !== userId) {
  throw new ForbiddenException('Not authorized to remove events for this game');
}
```

---

### WR-05: E2E clock persistence assertion will fail if clock was never stopped before reload

**File:** `apps/frontend-e2e/src/live-console.spec.ts:99-100`

**Issue:** The test clicks "Start" at step 8, then performs a substitution and logs a goal, then calls `page.reload()` without ever clicking "Stop". The clock persistence in `LiveClockService` only writes to `localStorage` inside `stop()` (which calls `persistClock()`). The `initialize()` method reads the stored `accumulatedMs` back, but if the clock was never stopped before the reload, nothing was written, so `accumulatedMs` remains `0` after rehydration and the clock display will show `00:00`.

The assertion `await expect(page.locator('app-clock-display')).not.toHaveText('00:00')` will therefore fail consistently in CI.

**Fix:** Either stop the clock before reloading in the test, or add periodic persistence to `LiveClockService` so that running time is saved at regular intervals:

```typescript
// In LiveClockService.start() — persist on each tick
this.intervalId = setInterval(() => {
  this.updateElapsed();
  this.persistClock();  // persist every 100ms so reload can recover
}, 100);
```

Alternatively, update the test to stop the clock before reloading:

```typescript
await page.locator('ion-button:has-text("Stop")').click();
await page.reload();
await expect(page.locator('app-clock-display')).not.toHaveText('00:00');
```

---

## Info

### IN-01: `SportEntity.eventDefinitions` typed as `any[]`

**File:** `apps/api/src/entities/sport.entity.ts` (referenced by `apps/api/src/games/games.service.ts:129`)

**Issue:** The `eventDefinitions` column is typed as `any[]`. The cast `(d: any)` in `games.service.ts:129` is a consequence. Defining an `EventDefinition` interface would make the service safer and self-documenting.

**Fix:**

```typescript
// Create a shared interface, e.g. in a types file:
export interface EventDefinition {
  type: string;
  payloadSchema?: Record<string, unknown>;
}

// In SportEntity:
@Column({ name: 'event_definitions', type: 'jsonb', default: [] })
eventDefinitions: EventDefinition[];
```

---

### IN-02: `ngOnInit` is declared but empty in `ConsoleWrapper`

**File:** `libs/client/feature/game-console/src/lib/console-wrapper/console-wrapper.ts:107-109`

**Issue:** The component implements `OnInit` but the `ngOnInit` body contains only a comment. Since all initialization is handled by signal declarations in the class body, this lifecycle hook serves no purpose.

**Fix:** Remove the `ngOnInit` method and the `OnInit` import.

---

### IN-03: `console.error` calls remain in production service paths

**File:** `libs/client/feature/game-console/src/lib/event-sync.service.ts:69` and `libs/client/feature/game-console/src/lib/live-game-state.service.ts:93`

**Issue:** `console.error(...)` in sync failure paths and in the localStorage parse error path are acceptable during development but should ideally be replaced with a structured logger or suppressed in production builds. This is a low-priority hygiene issue.

---

### IN-04: `ASSIST` event defined in migration but has no front-end trigger

**File:** `apps/api/src/migrations/1776510000000-AddEventDefinitionsToSport.ts:22-32`

**Issue:** The migration adds an `ASSIST` event definition. The front-end's `handleAction` maps `ASSIST` to `{ assistorId: action.playerId }`, which matches the schema. However, the `PlayerActionMenuComponent` likely does not present an "Assist" action option (the review scope does not include that template), so this event type may be unreachable from the UI. If the menu does not expose it, the backend definition is dead schema. This should be verified and either the menu updated or the definition removed.

---

_Reviewed: 2026-04-18T12:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
