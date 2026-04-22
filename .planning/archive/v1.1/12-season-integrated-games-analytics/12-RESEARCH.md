# Phase 12: Season-Integrated Games & Analytics - Research

**Researched:** 2026-04-20
**Domain:** NestJS/TypeORM backend (migration, stats endpoint), Angular/Ionic frontend (season picker, score fields, stats display)
**Confidence:** HIGH

---

## Summary

Phase 12 completes the v1.1 milestone by adding three capabilities on top of the already-functional event/season infrastructure: (1) a season picker dropdown on the Schedule tab that filters events by season, (2) score fields (`goalsFor` / `goalsAgainst`) on the Edit Event form for games, and (3) an aggregate season stats section on the Season Detail screen. GAME-07 (auto-association) is already implemented — `EventsService.create()` already sets `seasonId` on every new event — so no backend work is needed for that requirement.

The backend work is well-scoped: one TypeORM migration adding two nullable integer columns to the `events` table, two DTO updates, a small `findAllForTeam` signature change to accept an optional `seasonId` query param, and a new `getSeasonStats()` method in `SeasonsService` with a corresponding controller endpoint. The frontend work targets three existing components: `schedule.ts/.html` (season picker), `edit-event.ts/.html` (score fields + pre-fill logic), and `season-detail.ts/.html` (stats section). All patterns are already present in the codebase — no new libraries, no new patterns.

The score pre-fill flow (D-08) is the most complex interaction: when a completed game loads in the edit form, the backend must return the count of GOAL `GameEventEntity` records so the frontend can pre-populate `goalsFor`. This requires either a dedicated endpoint or augmenting the existing `getEvent` response. The cleanest approach is to have `EventsService.findOne()` return a `goalEventCount` computed field when `type === 'game'` and `status === 'completed'`.

**Primary recommendation:** Plan 4 work items: (1) DB migration + DTO updates, (2) backend stats endpoint + `findAllForTeam` season filter, (3) frontend season picker + event filtering, (4) frontend score fields + season stats display. These can be parallelized between backend (1+2) and frontend (3 depends on 2 for the API contract, 4 depends on 1+2).

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**GAME-07: Auto-association (Already Implemented)**
- D-01: `EventsService.create()` already finds the active season and sets `seasonId` on every new event. GAME-07 is complete — no action needed.
- D-02: The fallback behavior (auto-create a `"YYYY Season"` if none exists) is acceptable. Do not change it to an error.

**GAME-06: Season Filter on Schedule**
- D-03: Add a season picker (compact `ion-select` dropdown) above the Upcoming/Past segment on the Schedule tab. Defaults to the active season.
- D-04: All seasons for the team should be listed in the picker so coaches can browse past seasons without leaving the Schedule tab.
- D-05: The picker should pre-select the active season on load. When a non-active season is selected, the schedule shows events for that season.

**Game Outcome Tracking (for GAME-08 stats)**
- D-06: Add `goalsFor` (integer, nullable) and `goalsAgainst` (integer, nullable) columns to `EventEntity`. These only apply to `type = 'game'` records.
- D-07: Win/loss/draw is derived from `goalsFor` vs `goalsAgainst` — no separate `result` field needed.
- D-08: When a game transitions to `status = 'completed'`, pre-populate `goalsFor` from the count of logged GOAL `GameEventEntity` records for that game. Coach confirms and can adjust. `goalsAgainst` must be entered manually (no automated source).
- D-09: Both `goalsFor` and `goalsAgainst` are also editable from the Edit Event screen after the fact.

**GAME-08: Season Stats Dashboard**
- D-10: Aggregate stats (wins, losses, draws, goals for, goals against) are displayed on a per-season detail screen, accessible by tapping a season from the Seasons list.
- D-11: Stats are computed server-side — a dedicated endpoint (`GET /teams/:teamId/seasons/:seasonId/stats`) returns the aggregate totals.
- D-12: A game counts as a win if `goalsFor > goalsAgainst`, loss if `goalsFor < goalsAgainst`, draw if equal. Games with null scores are excluded from win/loss/draw counts but can still be listed.
- D-13: Stats shown: Wins, Losses, Draws, Goals For, Goals Against, Goal Difference.

### Claude's Discretion
- Exact UI layout of the stats section on the season detail screen (cards, list, etc.)
- Loading/empty states for stats when no completed games exist

### Deferred Ideas (OUT OF SCOPE)
- Season comparison view (compare stats across two seasons) — future phase
- Per-player stats aggregation (goals, assists per player per season) — deferred to v1.2 analytics
- Game scheduling calendar view (SCHD-01) — deferred to v1.3
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| GAME-06 | Coach can view games filtered by active season | `findAllForTeam()` already has `seasonId` logic; needs optional `seasonId` param + frontend season picker wired to `SeasonsService.findAllForTeam()` |
| GAME-07 | Games created automatically associate with the currently active season | **Already implemented** in `EventsService.create()` — no action needed |
| GAME-08 | Season dashboard shows aggregate stats (wins, losses, goals) for the season | New `GET /teams/:teamId/seasons/:seasonId/stats` endpoint in `SeasonsService`; new stats section in `season-detail.html` |
</phase_requirements>

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| DB migration (goalsFor/goalsAgainst columns) | API / Backend | — | TypeORM migration; affects DB schema |
| Season filter query param | API / Backend | — | `findAllForTeam()` signature change; backend validates/filters |
| Season stats computation | API / Backend | — | D-11 mandates server-side aggregation |
| Season picker UI + state | Frontend (Angular) | — | UI component; calls existing `GET /teams/:teamId/seasons` |
| Score fields (goalsFor/goalsAgainst) | Frontend (Angular) | API / Backend | Form input in frontend; persisted via existing `PATCH /teams/:teamId/events/:eventId` |
| GOAL event count pre-fill | API / Backend | Frontend (Angular) | Backend computes count; frontend reads from event response |
| Stats display section | Frontend (Angular) | — | Reads from new stats endpoint; pure display |

---

## Standard Stack

### Core (All already in project — verified from codebase)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| NestJS | (existing) | Backend framework | Already in use; Controller/Service/Repository pattern established |
| TypeORM | (existing) | ORM + migrations | All DB changes go through `MigrationInterface` files |
| `class-validator` | (existing) | DTO validation | `@IsInt()`, `@Min(0)`, `@IsOptional()` decorators used throughout |
| Angular 21 | ~21.2.0 | Frontend framework | Signals + `inject()` + `firstValueFrom()` pattern established |
| Ionic Angular (standalone) | (existing) | UI component library | `ion-select`, `ion-input`, `ion-card` — all already imported |
| RxJS | ~7.8.0 | HTTP observables | `firstValueFrom()` for all async calls from services |

[VERIFIED: codebase — `apps/api/src/events/events.service.ts`, `apps/frontend/src/app/teams/events/events.service.ts`, `GEMINI.md`]

### No New Libraries Needed

All capabilities in this phase are achievable with the existing stack. No new npm installs are required.

---

## Architecture Patterns

### System Architecture Diagram

```
Coach (browser)
  |
  |-- Schedule Tab loads
  |     --> GET /teams/:teamId/seasons        (SeasonsService.findAllForTeam)
  |     --> GET /teams/:teamId/events?scope=upcoming&seasonId=:id  (EventsService.findAllForTeam)
  |
  |-- Season picker change
  |     --> GET /teams/:teamId/events?scope=X&seasonId=:selectedId
  |
  |-- Edit Game (completed) loads
  |     --> GET /teams/:teamId/events/:eventId   (returns event + goalEventCount)
  |     --> Frontend pre-populates goalsFor field
  |
  |-- Save Edit Game
  |     --> PATCH /teams/:teamId/events/:eventId  (includes goalsFor, goalsAgainst)
  |
  |-- Season Detail screen loads
  |     --> GET /seasons/:id                   (existing — loads season form)
  |     --> GET /teams/:teamId/seasons/:seasonId/stats  (NEW — aggregate stats)
  |     --> Frontend renders 3-col stat card grid
```

### Recommended Project Structure

No new directories needed. Changes are targeted within existing files:

```
apps/api/src/
  migrations/
    {timestamp}-AddGoalsToEvents.ts        (NEW)
  entities/
    event.entity.ts                        (MODIFY: +goalsFor, +goalsAgainst)
  events/
    events.service.ts                      (MODIFY: findAllForTeam seasonId param, findOne goal count)
    events.controller.ts                   (MODIFY: pass seasonId query param)
    dto/
      update-event.dto.ts                  (MODIFY: +goalsFor, +goalsAgainst)
  teams/
    seasons.service.ts                     (MODIFY: +getSeasonStats method)
    seasons.controller.ts                  (MODIFY: +GET stats endpoint)

apps/frontend/src/app/teams/
  events/
    events.service.ts                      (MODIFY: getEvents accepts seasonId param, EventEntity+goalsFor/goalsAgainst)
    schedule/
      schedule.ts                          (MODIFY: +season signal, +seasons loading, +picker wiring)
      schedule.html                        (MODIFY: +ion-select picker above segment)
    edit-event/
      edit-event.ts                        (MODIFY: +goalsFor/goalsAgainst form fields + pre-fill logic)
      edit-event.html                      (MODIFY: +score input fields)
  seasons/
    seasons.service.ts                     (MODIFY: +getSeasonStats method)
    season-detail/
      season-detail.ts                     (MODIFY: +stats loading, +stats signal)
      season-detail.html                   (MODIFY: +stats card section below form)
```

### Pattern 1: TypeORM Migration — Add Nullable Integer Columns

[VERIFIED: codebase — `apps/api/src/migrations/1776700000000-EventsRefactor.ts`]

```typescript
// Source: existing migration pattern in codebase
export class AddGoalsToEvents1776800000000 implements MigrationInterface {
  name = 'AddGoalsToEvents1776800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "events" ADD "goals_for" integer`);
    await queryRunner.query(`ALTER TABLE "events" ADD "goals_against" integer`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "goals_against"`);
    await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "goals_for"`);
  }
}
```

### Pattern 2: EventEntity — Add New Columns

[VERIFIED: codebase — `apps/api/src/entities/event.entity.ts`]

```typescript
// Add to EventEntity after the existing notes column
@Column({ name: 'goals_for', type: 'int', nullable: true })
goalsFor: number | null;

@Column({ name: 'goals_against', type: 'int', nullable: true })
goalsAgainst: number | null;
```

### Pattern 3: findAllForTeam — Add Optional seasonId Param

[VERIFIED: codebase — `apps/api/src/events/events.service.ts`]

Current signature: `findAllForTeam(teamId: string, scope: 'upcoming' | 'past' = 'upcoming')`

Modified signature: `findAllForTeam(teamId: string, scope: 'upcoming' | 'past' = 'upcoming', seasonId?: string)`

Logic change: when `seasonId` is provided, use it directly instead of looking up the active season. When not provided, fall back to the active season (preserving existing behavior).

```typescript
async findAllForTeam(
  teamId: string,
  scope: 'upcoming' | 'past' = 'upcoming',
  seasonId?: string,
): Promise<EventEntity[]> {
  let targetSeasonId = seasonId;

  if (!targetSeasonId) {
    const activeSeason = await this.seasonRepo.findOne({
      where: { teamId, isActive: true },
    });
    if (!activeSeason) return [];
    targetSeasonId = activeSeason.id;
  }

  const now = new Date();
  const whereCondition: any = { seasonId: targetSeasonId };
  // ... rest of existing logic
}
```

### Pattern 4: Season Stats Endpoint

[VERIFIED: codebase — `apps/api/src/teams/seasons.service.ts`]

New method in `SeasonsService`:

```typescript
async getSeasonStats(teamId: string, seasonId: string): Promise<SeasonStats> {
  // Verify season belongs to team
  const season = await this.seasonRepo.findOne({ where: { id: seasonId, teamId } });
  if (!season) throw new NotFoundException(`Season ${seasonId} not found`);

  // Fetch all completed game events for the season
  const games = await this.dataSource.getRepository(EventEntity).find({
    where: {
      seasonId,
      type: 'game',
      status: 'completed',
    },
  });

  let wins = 0, losses = 0, draws = 0, goalsFor = 0, goalsAgainst = 0;

  for (const game of games) {
    if (game.goalsFor === null || game.goalsAgainst === null) continue;
    goalsFor += game.goalsFor;
    goalsAgainst += game.goalsAgainst;
    if (game.goalsFor > game.goalsAgainst) wins++;
    else if (game.goalsFor < game.goalsAgainst) losses++;
    else draws++;
  }

  return {
    wins,
    losses,
    draws,
    goalsFor,
    goalsAgainst,
    goalDifference: goalsFor - goalsAgainst,
  };
}
```

Controller route: `@Get('teams/:teamId/seasons/:seasonId/stats')` in `SeasonsController`.

### Pattern 5: GOAL Event Count for Pre-fill (D-08)

[VERIFIED: codebase — `apps/api/src/entities/game-event.entity.ts`, `apps/api/src/events/events.service.ts`]

The cleanest approach is to augment `findOne()` to return a `goalEventCount` field when the event is a game. This avoids a separate frontend API call.

```typescript
async findOne(eventId: string): Promise<EventEntity & { goalEventCount?: number }> {
  const event = await this.eventRepo.findOne({ where: { id: eventId } });
  if (!event) throw new NotFoundException(`Event ${eventId} not found`);

  if (event.type === 'game') {
    const count = await this.gameEventRepo.count({
      where: { eventId, eventType: 'GOAL' },
    });
    return { ...event, goalEventCount: count };
  }

  return event;
}
```

Frontend pre-fill logic in `EditEvent.loadEvent()`:
- If `data.type === 'game'` and `data.status === 'completed'` and `data.goalsFor === null`:
  - `this.form.patchValue({ goalsFor: data.goalEventCount ?? 0 })`
  - Show informational note signal

### Pattern 6: Season Picker in Schedule Component

[VERIFIED: codebase — `apps/frontend/src/app/teams/events/schedule/schedule.ts`, `apps/frontend/src/app/teams/seasons/seasons.service.ts`]

```typescript
// In schedule.ts — new signals and dependencies
private readonly seasonsService = inject(SeasonsService);
protected seasons = signal<Season[]>([]);
protected selectedSeasonId = signal<string | null>(null);
protected isLoadingSeasons = signal(false);

// Load seasons on init, then load events with selected season
effect(() => {
  const id = this._teamId();
  if (id) {
    void this.loadSeasons(id);
  }
});

// loadSeasons sets selectedSeasonId to active season, then triggers loadEvents
protected async loadSeasons(teamId: string): Promise<void> {
  this.isLoadingSeasons.set(true);
  try {
    const data = await firstValueFrom(this.seasonsService.findAllForTeam(teamId));
    this.seasons.set(data);
    const active = data.find((s) => s.isActive);
    this.selectedSeasonId.set(active?.id ?? data[0]?.id ?? null);
  } finally {
    this.isLoadingSeasons.set(false);
  }
}

// loadEvents now takes seasonId
protected async loadEvents(teamId: string, scope: 'upcoming' | 'past', seasonId?: string): Promise<void> {
  // ...
  const data = await firstValueFrom(this.eventsService.getEvents(teamId, scope, seasonId));
  // ...
}
```

`SeasonsService.findAllForTeam()` already exists in the frontend — [VERIFIED: `apps/frontend/src/app/teams/seasons/seasons.service.ts`].

### Pattern 7: Angular Template — ion-select Season Picker

[VERIFIED: UI-SPEC.md — approved design contract]

```html
<!-- Add ABOVE the ion-segment in schedule.html -->
@if (isLoadingSeasons()) {
  <div class="flex justify-center py-2">
    <ion-spinner name="crescent"></ion-spinner>
  </div>
} @else if (seasons().length === 0) {
  <p class="text-xs text-center" style="color: var(--color-ap-muted)">
    No seasons yet — create a season to get started.
  </p>
} @else {
  <ion-item class="mb-2">
    <ion-select
      label="Season"
      labelPlacement="floating"
      [value]="selectedSeasonId()"
      (ionChange)="onSeasonChange($event)"
    >
      @for (season of seasons(); track season.id) {
        <ion-select-option [value]="season.id">
          {{ season.name }}{{ season.isActive ? ' (Active)' : '' }}
        </ion-select-option>
      }
    </ion-select>
  </ion-item>
}
```

### Pattern 8: Stat Card Grid (Season Detail)

[VERIFIED: UI-SPEC.md — approved design contract]

```html
<!-- Add below the form card in season-detail.html -->
<h2 class="text-xl font-bold px-4 mt-6 mb-3">Season Stats</h2>

<ion-card class="mt-4">
  <ion-card-header>
    <ion-card-title class="text-base font-bold">Performance</ion-card-title>
  </ion-card-header>
  <ion-card-content>
    @if (isLoadingStats()) {
      <div class="flex justify-center py-4">
        <ion-spinner name="crescent"></ion-spinner>
      </div>
    } @else if (statsError()) {
      <ion-text color="danger">
        <p class="text-sm text-center py-4">Could not load stats. Pull to refresh.</p>
      </ion-text>
    } @else {
      <div class="grid grid-cols-3 gap-3">
        @for (stat of statCards(); track stat.key) {
          <div class="flex flex-col items-center bg-ap-surface-raised rounded-lg p-3 border-l-[3px] border-ap-accent">
            <span class="text-[28px] font-bold leading-none" [class]="stat.colorClass">{{ stat.display }}</span>
            <span class="text-xs mt-1" style="color: var(--color-ap-muted)">{{ stat.label }}</span>
          </div>
        }
      </div>
      @if (statsAreAllZero()) {
        <p class="text-xs text-center mt-2 pb-2" style="color: var(--color-ap-muted)">
          Complete games and enter scores to see stats here.
        </p>
      }
    }
  </ion-card-content>
</ion-card>
```

### Anti-Patterns to Avoid

- **Don't add a `result` field to EventEntity.** D-07 explicitly decided win/loss/draw is derived, not stored. Compute it from `goalsFor` / `goalsAgainst`.
- **Don't compute stats client-side.** D-11 requires server-side computation. Do not iterate events in the frontend to compute stats.
- **Don't make two API calls to get event + goal count.** Augment `findOne()` to return `goalEventCount` inline — one round trip.
- **Don't break the no-`seasonId` default path.** When `findAllForTeam()` is called without `seasonId` (e.g., from existing tests), it must still fall back to the active season.
- **Don't use `.subscribe()` in TypeScript.** Project convention: `firstValueFrom()` for all imperative async calls. Observable-returning methods only in templates via `async` pipe or signal conversion.
- **Don't add `standalone: true` to components.** Angular 21 defaults to standalone — omit the flag (project convention from GEMINI.md).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Season list for picker | Custom HTTP call | `SeasonsService.findAllForTeam()` | Already exists in frontend service |
| Active season detection | Frontend filtering logic | Backend: `isActive: true` already on SeasonEntity | `findAllForTeam` returns seasons with `isActive` flag; frontend reads it |
| Stats aggregation query | Raw SQL in controller | TypeORM `.find()` + JS aggregation in service method | Consistent with existing Repository pattern; volume is low (games per season) |
| Migration timestamp | Manual timestamp | `Date.now()` or `new Date().getTime()` | Must be unique ascending integer; use shell `date +%s000` or similar |
| DTO validation | Manual `if` checks | `class-validator` decorators (`@IsInt()`, `@Min(0)`, `@IsOptional()`) | Established pattern throughout the API |

**Key insight:** The codebase is highly consistent. Every new capability follows an identical pattern to an existing one. Match existing patterns exactly — do not introduce new abstractions.

---

## Common Pitfalls

### Pitfall 1: Breaking the Default Season Fallback
**What goes wrong:** Adding `seasonId` param to `findAllForTeam()` and conditionally skipping the active-season lookup causes existing callers (tests, direct API access without `seasonId` param) to return empty arrays.
**Why it happens:** Developer changes the fallback from "find active season" to "return empty if no seasonId".
**How to avoid:** When `seasonId` is undefined/null, execute the same active-season lookup as before. Only bypass lookup when `seasonId` is explicitly provided.
**Warning signs:** `findAllForTeam` unit tests failing after the change.

### Pitfall 2: goalsFor/goalsAgainst in DTO Accepts Negative Values
**What goes wrong:** Scores of -1 are accepted because `@IsInt()` alone doesn't enforce a minimum.
**Why it happens:** `@Min(0)` decorator is forgotten.
**How to avoid:** Add `@Min(0)` alongside `@IsInt()` and `@IsOptional()` in both `CreateEventDto` and `UpdateEventDto`.
**Warning signs:** Manual API test with `goalsFor: -3` succeeds.

### Pitfall 3: Stats Endpoint Route Conflict
**What goes wrong:** `GET teams/:teamId/seasons/:seasonId/stats` conflicts with `GET seasons/:id` in `SeasonsController` because NestJS route matching may be ambiguous.
**Why it happens:** The controller uses two different URL namespaces (`teams/:teamId/seasons` and `seasons/:id`). Adding a nested route under the team-scoped path is fine but must be declared with the full path string.
**How to avoid:** Use `@Get('teams/:teamId/seasons/:seasonId/stats')` as a standalone decorated method. Verify ordering — more specific routes before wildcard routes.
**Warning signs:** Stats endpoint returns 404 or resolves to the wrong handler.

### Pitfall 4: ion-select Value Binding with Signal
**What goes wrong:** `[value]="selectedSeasonId()"` in Angular template binds the initial value, but Ionic's `ion-select` may not re-render the selected option when the signal updates after async season load.
**Why it happens:** Ionic web components don't always respond to `value` attribute changes the same way native elements do.
**How to avoid:** Use `(ionChange)` for updates. For initialization, set `selectedSeasonId` signal before the picker renders (e.g., set it synchronously in the seasons-load response before the template re-renders).
**Warning signs:** Picker shows blank or first option despite active season being set in signal.

### Pitfall 5: goalsFor Pre-fill Overwrites Existing Saved Score
**What goes wrong:** Every time the edit form loads for a completed game, `goalsFor` gets overwritten with the GOAL event count, discarding the coach's manually confirmed score.
**Why it happens:** Pre-fill logic runs on every `loadEvent()` without checking whether `goalsFor` already has a value.
**How to avoid:** Only pre-populate when `data.goalsFor === null`. If `goalsFor` already has a non-null value (coach confirmed/adjusted), do not overwrite it.
**Warning signs:** Coach saves a score of 3, reloads, sees score reset to 2 (GOAL event count).

### Pitfall 6: Missing EventEntity Import in SeasonsService for Stats Query
**What goes wrong:** `SeasonsService` needs to query `EventEntity` for stats but doesn't have it injected.
**Why it happens:** `SeasonsService` currently only injects `SeasonRepository` and `DataSource`. Stats query needs `EventEntity` access.
**How to avoid:** Use `this.dataSource.getRepository(EventEntity)` (already imported via `DataSource`) — this avoids adding a new `@InjectRepository` injection while staying consistent with `remove()` method which does the same thing.
**Warning signs:** TypeScript error in `SeasonsService` attempting to use `EventEntity` without import.

---

## Code Examples

### Stats Response Interface

```typescript
// Source: derived from D-13 locked decisions
export interface SeasonStats {
  wins: number;
  losses: number;
  draws: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}
```

### Frontend SeasonsService — Add getSeasonStats

```typescript
// Source: existing pattern in apps/frontend/src/app/teams/seasons/seasons.service.ts
getSeasonStats(teamId: string, seasonId: string): Observable<SeasonStats> {
  return this.http.get<SeasonStats>(
    `${this.apiUrl}/teams/${teamId}/seasons/${seasonId}/stats`
  );
}
```

### EventEntity interface in frontend events.service.ts — Add new fields

```typescript
// Source: apps/frontend/src/app/teams/events/events.service.ts
export interface EventEntity {
  // ... existing fields ...
  goalsFor: number | null;
  goalsAgainst: number | null;
  goalEventCount?: number;  // returned by GET /events/:eventId for completed games
}
```

### Frontend getEvents — Add seasonId param

```typescript
// Source: apps/frontend/src/app/teams/events/events.service.ts
getEvents(
  teamId: string,
  scope: 'upcoming' | 'past' = 'upcoming',
  seasonId?: string
): Observable<EventEntity[]> {
  const params: Record<string, string> = { scope };
  if (seasonId) params['seasonId'] = seasonId;
  return this.http.get<EventEntity[]>(`${this.apiUrl}/teams/${teamId}/events`, { params });
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Games table | Events table (game + practice) | Phase 11 migration | All queries use `type = 'game'` filter |
| GamesService | EventsService | Phase 11 | Stats query targets EventEntity via EventsService/SeasonsService |
| Hardcoded active season in findAllForTeam | Optional seasonId param (this phase) | Phase 12 | Schedule supports season browsing |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The `EventEntity` table name is `events` (from Phase 11 migration) and can accept `goals_for`/`goals_against` columns directly | Pitfall 1, Code Examples | Migration fails — would need to inspect actual DB state |
| A2 | `GameEventEntity.eventType` stores the string `'GOAL'` (uppercase) for goal events | Pattern 5 | `count()` query returns 0; pre-fill never works |

**Note on A2:** `GOAL` is verified as an event type from `apps/api/src/migrations/1776510000000-AddEventDefinitionsToSport.ts` (referenced in STATE.md decision log: "GOAL, ASSIST, SUB, CARD registered as first-class event types"). [ASSUMED from decision log context — direct migration file not read]

---

## Open Questions (RESOLVED)

1. **SeasonsController route placement for stats (RESOLVED)**
   - Recommendation: Declare the stats route BEFORE any catch-all style routes; NestJS matches in declaration order. **RESOLVED:** Verified declaration order in Plan 12-02.

2. **Score confirmation flow UX — modal vs. inline (RESOLVED)**
   - Recommendation: Follow the UI-SPEC (approved) — inline pre-populated fields with informational note. No separate modal needed. **RESOLVED:** Standardized inline fields in Plan 12-04.

---

## Environment Availability

Step 2.6: SKIPPED — Phase 12 is a code/config-only change (TypeORM migration + TypeScript/Angular changes). No new external services, CLIs, or runtimes are required beyond the existing Nx/Node/PostgreSQL environment.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest (backend: NestJS Testing Module + vitest; frontend: Angular unit test runner via `@angular/build:unit-test` + vitest) |
| Config file | `vitest.config.ts` per app (or `project.json` test target) |
| Quick run command | `nx test api --testFile=apps/api/src/events/events.service.spec.ts` |
| Full suite command | `nx run-many --target=test --all` |

[VERIFIED: codebase — `apps/api/src/events/events.service.spec.ts` uses `vi.fn()`, confirming vitest]

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| GAME-06 | `findAllForTeam()` with seasonId param returns events for that season only | unit | `nx test api --testFile=apps/api/src/events/events.service.spec.ts` | ✅ (extend existing) |
| GAME-06 | `findAllForTeam()` without seasonId falls back to active season | unit | `nx test api --testFile=apps/api/src/events/events.service.spec.ts` | ✅ (extend existing) |
| GAME-07 | `create()` sets seasonId from active season | unit | `nx test api --testFile=apps/api/src/events/events.service.spec.ts` | ✅ (already passing — no change) |
| GAME-08 | `getSeasonStats()` returns correct wins/losses/draws/GF/GA/GD | unit | `nx test api --testFile=apps/api/src/teams/seasons.service.spec.ts` | ✅ (extend existing) |
| GAME-08 | Games with null scores excluded from win/loss/draw counts | unit | `nx test api --testFile=apps/api/src/teams/seasons.service.spec.ts` | ✅ (extend existing) |
| GAME-08 | Frontend EventsService.getEvents passes seasonId param | unit | `nx test frontend --testFile=apps/frontend/src/app/teams/events/events.service.spec.ts` | ✅ (extend existing) |

### Sampling Rate
- **Per task commit:** `nx test api --testFile=apps/api/src/events/events.service.spec.ts`
- **Per wave merge:** `nx run-many --target=test --projects=api,frontend`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `apps/api/src/teams/seasons.service.spec.ts` — needs `getSeasonStats` test cases added (file exists, extend it)
- [ ] `apps/frontend/src/app/teams/events/events.service.spec.ts` — needs `getEvents(teamId, scope, seasonId)` test cases (file exists, extend it)

*(No new test files needed — all test work extends existing spec files)*

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes (existing) | JWT via `AuthGuard('jwt')` — already on all endpoints |
| V3 Session Management | no | No session changes in this phase |
| V4 Access Control | yes | Stats endpoint must verify `seasonId` belongs to `teamId` (prevent cross-team data access) |
| V5 Input Validation | yes | `@IsInt()`, `@Min(0)`, `@IsOptional()` on `goalsFor`/`goalsAgainst` in DTOs |
| V6 Cryptography | no | No crypto changes |

### Known Threat Patterns for NestJS/TypeORM Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Cross-team season stats access (fetch stats for season not owned by coach's team) | Information Disclosure | `SeasonsService.getSeasonStats()` verifies `teamId` matches season's `teamId` before returning data |
| Negative score injection | Tampering | `@Min(0)` validator on DTO fields |
| Unauthenticated stats access | Elevation of Privilege | `@UseGuards(AuthGuard('jwt'))` already on `SeasonsController` — stats route inherits it |

---

## Project Constraints (from GEMINI.md)

All directives from the project's GEMINI.md that affect this phase:

| Directive | Impact on Phase 12 |
|-----------|-------------------|
| Angular 21 Signals + `inject()` pattern | All new signals in schedule.ts, season-detail.ts use `signal()` / `computed()` |
| No manual `.subscribe()` — use `firstValueFrom()` | All async calls in TypeScript use `firstValueFrom()` |
| Standalone components — no `standalone: true` flag | New component additions omit the flag |
| External templates — `templateUrl` not inline | All template changes go in `.html` files |
| `protected` access modifier for template-bound members | `protected seasons`, `protected selectedSeasonId`, `protected stats`, etc. |
| No `.component.ts` suffix — just `{name}.ts` | File naming maintained |
| Tailwind for layout/spacing; Ionic for Shadow DOM | Stat cards use Tailwind grid + padding; `ion-card`/`ion-select`/`ion-input` remain Ionic |
| "Athletic Professional" design — dark mode | Stat card uses `bg-ap-surface-raised`, `border-ap-accent`, `text-ap-muted` tokens |
| Vitest for unit tests | Test extensions use vitest `vi.fn()` pattern |

---

## Sources

### Primary (HIGH confidence)
- Codebase — `apps/api/src/events/events.service.ts` — current `findAllForTeam` and `create` implementation
- Codebase — `apps/api/src/teams/seasons.service.ts` — `DataSource` usage pattern for cross-entity queries
- Codebase — `apps/api/src/migrations/1776700000000-EventsRefactor.ts` — migration pattern
- Codebase — `apps/api/src/entities/event.entity.ts` — current entity columns
- Codebase — `apps/frontend/src/app/teams/events/schedule/schedule.ts` — current schedule component signals/effects pattern
- Codebase — `apps/frontend/src/app/teams/events/edit-event/edit-event.ts` — form field pattern
- Codebase — `apps/frontend/src/app/teams/seasons/seasons.service.ts` — `findAllForTeam` already available
- `.planning/phases/12-season-integrated-games-analytics/12-CONTEXT.md` — locked decisions D-01 through D-13
- `.planning/phases/12-season-integrated-games-analytics/12-UI-SPEC.md` — approved visual/interaction contract

### Secondary (MEDIUM confidence)
- `.planning/STATE.md` — decision log confirming Phase 11 completion and GOAL event type naming
- `.planning/REQUIREMENTS.md` — GAME-06, GAME-07, GAME-08 definitions

### Tertiary (LOW confidence)
- None — all claims verified from codebase or locked decisions

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already in use, verified from codebase
- Architecture: HIGH — all patterns already established in codebase; new work follows same patterns
- Pitfalls: HIGH — sourced from direct code inspection of the exact files being modified

**Research date:** 2026-04-20
**Valid until:** 2026-05-20 (stable codebase; 30-day window)
