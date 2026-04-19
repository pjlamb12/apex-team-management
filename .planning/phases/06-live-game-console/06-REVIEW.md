---
phase: 06-live-game-console
reviewed: 2026-04-18T00:00:00Z
depth: standard
files_reviewed: 25
files_reviewed_list:
  - apps/api/src/entities/sport.entity.ts
  - apps/api/src/games/dto/create-event.dto.ts
  - apps/api/src/games/games.controller.ts
  - apps/api/src/games/games.module.ts
  - apps/api/src/games/games.service.ts
  - apps/api/src/migrations/1776510000000-AddEventDefinitionsToSport.ts
  - apps/frontend/src/app/app.routes.ts
  - libs/client/feature/game-console/src/index.ts
  - libs/client/feature/game-console/src/lib/bench-view/bench-view.ts
  - libs/client/feature/game-console/src/lib/bench-view/bench-view.html
  - libs/client/feature/game-console/src/lib/clock-display/clock-display.ts
  - libs/client/feature/game-console/src/lib/clock-display/clock-display.html
  - libs/client/feature/game-console/src/lib/console-wrapper/console-wrapper.ts
  - libs/client/feature/game-console/src/lib/console-wrapper/console-wrapper.html
  - libs/client/feature/game-console/src/lib/event-log/event-log.ts
  - libs/client/feature/game-console/src/lib/event-log/event-log.html
  - libs/client/feature/game-console/src/lib/event-sync.service.ts
  - libs/client/feature/game-console/src/lib/live-clock.service.ts
  - libs/client/feature/game-console/src/lib/live-game-state.service.ts
  - libs/client/feature/game-console/src/lib/player-action-menu/player-action-menu.ts
  - libs/client/feature/game-console/src/lib/player-action-menu/player-action-menu.html
  - libs/client/feature/game-console/src/lib/soccer-pitch-view/soccer-pitch-view.ts
  - libs/client/feature/game-console/src/lib/soccer-pitch-view/soccer-pitch-view.html
  - apps/frontend-e2e/src/live-console.spec.ts
  - libs/client/feature/game-console/vite.config.mts
findings:
  critical: 2
  warning: 6
  info: 5
  total: 13
status: issues_found
---

# Phase 06: Code Review Report

**Reviewed:** 2026-04-18T00:00:00Z
**Depth:** standard
**Files Reviewed:** 25
**Status:** issues_found

## Summary

This phase implements the Live Game Console feature: a real-time game tracking UI with clock management, player substitution via drag-and-drop, event logging, and background sync to the API. The backend adds an event-logging endpoint guarded by coach ownership and validated against sport-specific JSON Schema definitions stored in the database.

The overall architecture is well-structured. The most significant issues are a security gap on the backend (payload schema validation is bypassed when a payload is absent but the schema demands one) and a direct mutation of a signal-owned object in `EventSyncService` that violates Angular's reactivity contract and causes silent state corruption. Several logic bugs exist around event type mismatches between the front-end and backend, and the clock state is lost on page reload despite the event log being persisted.

---

## Critical Issues

### CR-01: Payload schema validation skipped when `payload` is omitted but required

**File:** `apps/api/src/games/games.service.ts:137`
**Issue:** The AJV validation block is guarded by `if (definition.payloadSchema && dto.payload)`. When `dto.payload` is `undefined` or `null`, validation is skipped entirely — even when the schema has `required` fields. For example, the `GOAL` event schema requires `scorerId`. A client that omits the payload field completely bypasses this requirement and the event is persisted with no payload data.
**Fix:**
```typescript
// Replace the guard with: always validate when a schema exists
if (definition.payloadSchema) {
  const validate = this.ajv.compile(definition.payloadSchema);
  const valid = validate(dto.payload ?? {}); // treat missing payload as empty object
  if (!valid) {
    throw new BadRequestException(
      `Invalid payload for event type ${dto.eventType}: ${this.ajv.errorsText(validate.errors)}`,
    );
  }
}
```

---

### CR-02: Direct mutation of signal-owned object in `EventSyncService`

**File:** `libs/client/feature/game-console/src/lib/event-sync.service.ts:76-77` and `99`
**Issue:** `syncAdd` and `syncDelete` mutate the `event` object directly (`event.id = response.id`, `event.synced = true`) after retrieving it from the signal array. In Angular signals, mutating an object that lives inside a signal does not trigger change detection — the signal still holds the same object reference. This means the view never updates to reflect the synced state, and when `stateService.save()` is called immediately after, it may serialize stale or partially-written data depending on timing. Additionally, `syncDelete` has a redundant `error` handler in `.subscribe()` that will never fire because errors are already swallowed by `catchError(... of(null))`.

**Fix:**
```typescript
// In syncAdd — use stateService to update the event immutably:
.subscribe(response => {
  if (response) {
    this.stateService.markEventSynced(index, response.id);
    this.syncingIds.delete(tempId);
  }
});

// Add to LiveGameStateService:
public markEventSynced(index: number, backendId: string): void {
  this._events.update(prev =>
    prev.map((e, i) => i === index ? { ...e, id: backendId, synced: true } : e)
  );
  this.save();
}
```

---

## Warnings

### WR-01: Event type mismatch — front-end emits `YELLOW_CARD`/`RED_CARD`, backend only knows `CARD`

**File:** `libs/client/feature/game-console/src/lib/player-action-menu/player-action-menu.html:19-23` and `apps/api/src/migrations/1776510000000-AddEventDefinitionsToSport.ts:49`
**Issue:** The action menu emits `YELLOW_CARD` and `RED_CARD` event types. The backend's event definitions (and the `CARD` schema) only register a single `CARD` type. When the front-end posts `eventType: 'YELLOW_CARD'` to the API, `logEvent` will throw `BadRequestException: Event type YELLOW_CARD not supported for this sport`. The event log UI also handles `YELLOW_CARD` and `RED_CARD` separately in `getEventIcon` and `getEventColor`, so either the event definitions need two entries or the client needs to map to `CARD`.

**Fix:** Either update the migration to add `YELLOW_CARD` and `RED_CARD` definitions (with `color` in the schema), or map the client's action type to `CARD` before posting and include `color` in the payload:
```typescript
// In ConsoleWrapper.handleAction — translate before posting:
protected handleAction(action: { type: string; playerId: string }): void {
  let eventType = action.type;
  let payload: Record<string, any> = { playerId: action.playerId };

  if (action.type === 'YELLOW_CARD' || action.type === 'RED_CARD') {
    eventType = 'CARD';
    payload = { playerId: action.playerId, color: action.type === 'YELLOW_CARD' ? 'yellow' : 'red' };
  }
  // ...
}
```

---

### WR-02: `GOAL` and `ASSIST` event types sent to API without required payload

**File:** `libs/client/feature/game-console/src/lib/console-wrapper/console-wrapper.ts:179-188`
**Issue:** `handleAction` constructs a `GameEvent` with only `type`, `playerId`, `timestamp`, and `minuteOccurred`. When synced, `EventSyncService.syncAdd` strips `type`, `timestamp`, `minuteOccurred`, `synced`, `status`, and `id` from the payload object, leaving `{ playerId }`. The backend schema for `GOAL` requires `scorerId` (not `playerId`), and `ASSIST` requires `assistorId`. The API will reject these events as invalid payloads even after CR-01 is fixed. The front-end's local event model uses `playerId` but the API schemas use `scorerId`/`assistorId`.

**Fix:** Either align the backend schemas to accept `playerId`, or map the local event fields to the expected schema keys in `EventSyncService.syncAdd` before posting.

---

### WR-03: Clock state is not persisted — reloads reset the clock to zero

**File:** `libs/client/feature/game-console/src/lib/live-clock.service.ts:1-81`
**Issue:** `LiveGameStateService` persists events to `localStorage` on every change, and the E2E test at line 97 asserts that the clock is not `00:00` after a reload. But `LiveClockService` holds all state (`startTime`, `accumulatedMs`, `elapsedMs`) purely in memory signals with no persistence or rehydration. After reload, the clock will always show `00:00`, making the E2E test assertion at line 97 fragile — it will pass only if the clock is still running in the same browser session (which a `page.reload()` breaks).

**Fix:** Persist `accumulatedMs` alongside the event log:
```typescript
// In stop(): save to localStorage
localStorage.setItem('game-clock-ms', String(this.accumulatedMs()));

// In initialize() or constructor: rehydrate
const stored = localStorage.getItem('game-clock-ms');
if (stored) this.accumulatedMs.set(Number(stored));
```

---

### WR-04: `lineup` signal initialization race condition in `ConsoleWrapper`

**File:** `libs/client/feature/game-console/src/lib/console-wrapper/console-wrapper.ts:82-94`
**Issue:** The `lineup` signal is initialized with a `tap` that calls `this.stateService.initialize(gameId, lineup)` using `this.gameId()`. However, `gameId` is itself a `toSignal` derived from the same `paramMap`. Both are set up in the constructor, but Angular's `toSignal` subscribes lazily. There is no guarantee that `gameId` signal has emitted a value by the time the `tap` runs on the first `lineup` emission — in practice `gameId` will have the value because both read from the same paramMap, but this implicit dependency is fragile. If the `gameId` signal is `undefined` at that point, `initialize` is skipped silently and the lineup never loads.

**Fix:** Use the `id` already available in the `switchMap` pipeline instead of `this.gameId()`:
```typescript
protected lineup = toSignal(
  this.route.paramMap.pipe(
    map((params) => params.get('gameId')),
    filter((id): id is string => !!id),
    switchMap((id) =>
      this.http.get<LineupEntry[]>(`${this.apiUrl}/games/${id}/lineup`).pipe(
        tap((lineup) => this.stateService.initialize(id, lineup)) // use `id` directly
      )
    )
  )
);
```

---

### WR-05: `removeEvent` authorization uses optional chaining that silently allows deletion on bad data

**File:** `apps/api/src/games/games.service.ts:167`
**Issue:** `event.game?.season?.team?.coachId !== userId` — if any relation is `undefined` (e.g., the relation join failed or the data is inconsistent), the condition evaluates `undefined !== userId` which is `true`, triggering `ForbiddenException` rather than a `BadRequestException` about incomplete data. While this fails safe (denying the operation), it returns a misleading error message ("Not authorized") when the real problem is a data integrity issue. More importantly, if there is a data integrity gap where `coachId` is somehow `undefined`, `undefined !== userId` is always `true` and will block the legitimate coach.

**Fix:** Add an explicit guard before the authorization check:
```typescript
if (!event.game?.season?.team) {
  throw new BadRequestException('Event data incomplete (missing game, season, or team relation)');
}
if (event.game.season.team.coachId !== userId) {
  throw new ForbiddenException('Not authorized to remove events for this game');
}
```

---

### WR-06: `getEventTempId` index-based ID is unstable across effect re-runs

**File:** `libs/client/feature/game-console/src/lib/event-sync.service.ts:43-45`
**Issue:** `getEventTempId` is `${event.timestamp}-${index}`. The `index` is the position in the `events()` array at the time the effect runs. If a prior event is marked `deleted`, it stays in the array (soft-delete), so indices remain stable for existing events. However, if `undo()` marks an event as deleted and the effect fires again, the same event at the same index now has `status: 'deleted'` — this will be correctly routed to `syncDelete`. The real problem is that on subsequent effect runs, newly added events shift their index if anything before them in the array was removed. Because events are only soft-deleted (never removed from the array), this is currently stable, but it is a latent bug: if `save()`/`initialize()` ever trims deleted events from `localStorage` and reloads, the indices will change and events could be re-synced or skipped. Using `event.timestamp` alone (or a proper UUID) as the temp ID would be more robust.

**Fix:** Generate a `localId` UUID at `pushEvent` time and store it on the event object:
```typescript
// In pushEvent:
this._events.update((prev) => [
  ...prev,
  { ...event, status: 'active', localId: crypto.randomUUID() }
]);

// In EventSyncService, use event.localId as the temp ID
private getEventTempId(event: GameEvent): string {
  return event.localId!;
}
```

---

## Info

### IN-01: `SportEntity.eventDefinitions` typed as `any[]`

**File:** `apps/api/src/entities/sport.entity.ts:15`
**Issue:** The column is typed as `any[]`. Defining an `EventDefinition` interface (with `type: string` and `payloadSchema: object`) would make the service code safer and self-documenting, removing the need for `(d: any)` casts in `games.service.ts:129`.

---

### IN-02: `console.error` calls left in production service code

**File:** `libs/client/feature/game-console/src/lib/event-sync.service.ts:69` and `98`
**File:** `libs/client/feature/game-console/src/lib/live-game-state.service.ts:93`
**Issue:** `console.error(...)` calls are left in production paths. These are appropriate for development but should ideally be replaced with a structured logging service or at minimum suppressed in production builds.

---

### IN-03: `ngOnInit` is empty in `ConsoleWrapper`

**File:** `libs/client/feature/game-console/src/lib/console-wrapper/console-wrapper.ts:106-108`
**Issue:** The `ngOnInit` method implements `OnInit` but has no body. Since all initialization happens via signal declarations in the constructor scope, `ngOnInit` can be removed along with the `OnInit` import.

---

### IN-04: `BenchViewComponent` references a non-existent stylesheet

**File:** `libs/client/feature/game-console/src/lib/bench-view/bench-view.ts:9`
**Issue:** `styleUrls: ['./bench-view.scss']` references a `.scss` file. This file was not included in the review scope, but given several sibling files had `.css` deleted in this phase, verify that `bench-view.scss` exists; if it does not, this will cause a build error.

---

### IN-05: E2E test persistence assertion may be unreliable

**File:** `apps/frontend-e2e/src/live-console.spec.ts:97`
**Issue:** After `page.reload()`, the test asserts `app-clock-display` does not show `00:00`. As noted in WR-03, the clock is not persisted to localStorage. This assertion will consistently fail in CI. Recommend either implementing clock persistence (WR-03 fix) or adjusting the assertion to check only event log persistence, which is the feature actually backed by localStorage.

---

_Reviewed: 2026-04-18T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
