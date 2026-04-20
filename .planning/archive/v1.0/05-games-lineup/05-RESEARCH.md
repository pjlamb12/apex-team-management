# Phase 5: Games & Lineup — Research

**Researched:** 2026-04-17
**Domain:** NestJS + TypeORM game/lineup management; Angular Signals + Ionic IonSegment, IonSelect, IonDatetime
**Confidence:** HIGH (all findings verified against actual codebase)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Auto-create a default season on first game creation per team (no UI, backend only).
- **D-02:** Auto-season name is "YYYY Season" derived from current date at creation time.
- **D-03:** Use `isActive: true` on SeasonEntity to identify the default season. If one exists, reuse it; otherwise create one.
- **D-04:** Games are NOT a top-level bottom-nav tab — they live inside Team Dashboard.
- **D-05:** Team Dashboard uses `IonSegment` with two buttons: **Roster** and **Games** — inline content swap, no sub-route navigation.
- **D-06:** Games segment shows game list with FAB to create new game.
- **D-07:** GameEntity migration adds: `location` (varchar nullable), `uniformColor` (varchar nullable), `status` (enum `scheduled|in_progress|completed`, default `scheduled`).
- **D-08:** Games are scoped to a Season, not directly to a Team. `GET /teams/:teamId/games` joins through Season.
- **D-09:** `lineup_entries` table: `id`, `game_id`, `player_id`, `position_name` (nullable for bench), `status` (`starting|bench`).
- **D-10:** Every available player is recorded — starters have `positionName` + `status='starting'`; bench have `positionName=null` + `status='bench'`.
- **D-11:** `LineupEntryEntity` is the Phase 6 swap target — design intentionally supports substitution without schema changes.
- **D-12:** Lineup editor shows 11 positional slots. Each slot has two `IonSelect` pickers: position-type and player.
- **D-13:** Per-slot flexibility — no fixed formation; each slot configured independently (GK/DEF/MID/FWD).
- **D-14:** Hardcode 11 slots for Phase 5 (soccer standard). Dynamic count via `SeasonEntity.playersOnField` is Phase 6+.
- **D-15:** Bench section below on-field slots — auto-populated with unassigned players.
- **D-16:** Player already in a slot is removed from available options in other slots' player pickers.

### Claude's Discretion
- Game creation form UX: full-page route `/teams/:id/games/new` (not a modal).
- Game list: upcoming first (scheduledAt ASC), then past below. Group with divider.
- NestJS module: `apps/api/src/games/` with `GamesController`, `GamesService`, `LineupEntriesService`.
- Angular feature: lazy-loaded routes `/teams/:id/games/new` and `/teams/:id/games/:gameId/lineup`.
- After game creation, navigate to `/teams/:id/games/:gameId/lineup` lineup editor.

### Deferred Ideas (OUT OF SCOPE)
- Season management UI (named seasons, switching, archiving)
- Game format flexibility per game (7v7 vs 11v11)
- Top-level Games tab in bottom nav
- Game status transitions UI (in_progress, completed) — Phase 6 only
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| GAME-01 | Coach can create a new game with opponent, location, date/time, and uniform color | NestJS GamesController POST endpoint; Angular create-game form with IonInput, IonDatetime, IonSelect; migration adds location/uniformColor columns |
| GAME-02 | Coach can view list of past and upcoming games | GamesService findAllForTeam joined via Season; frontend GamesService signal-based load; IonCard list with grouped upcoming/past dividers |
| GAME-03 | Coach can edit game details before kickoff | GamesController PATCH endpoint; edit-game route with pre-populated form; status check prevents editing in_progress/completed games |
| GAME-04 | Coach can delete a game | GamesController DELETE with cascade to lineup_entries; AlertController confirm dialog; IonItemSliding swipe-delete on game card |
| LIVE-01 | Coach can set a starting lineup by assigning players to positions | LineupEntriesService PUT/POST bulk upsert; lineup editor with 11 IonItem slot rows; position-type IonSelect + player IonSelect per slot |
| LIVE-02 | Coach can see who's on the field and who's on the bench at a glance | Lineup editor bench section auto-derives from unassigned players; lineup_entries status field enables quick query |
</phase_requirements>

---

## Summary

Phase 5 builds the game management and lineup assignment layer on top of the team/roster foundation established in Phases 1-4. The work splits cleanly into three concerns: (1) a TypeORM migration adding fields to `games` and creating `lineup_entries`, (2) a new NestJS `GamesModule` with two services and one controller, and (3) Angular UI additions — an `IonSegment` tab strip in Team Dashboard, a full-page game creation form, a game edit page, and a lineup editor with 11 paired position+player selectors.

The most architecturally significant decision is the auto-season creation on first game (D-01 to D-03). The `GamesService.create` method must check for an active season on the team and create one if absent — this happens transparently, with no API surface change. The lineup model (D-09/D-10) stores every player in `lineup_entries` regardless of starting/bench status so Phase 6 can query a single table to know who is available for substitution.

The Angular frontend follows established patterns exactly: `inject()` for DI, `signal<T[]>([])` + async load methods, `firstValueFrom()` for HTTP calls, standalone Ionic components imported per-component, lazy-loaded routes, and `ControlErrorsDisplayComponent` for form validation errors.

**Primary recommendation:** Build in this order: migration → entity → NestJS module → Angular service → Team Dashboard segment → game list → game creation form → game edit form → lineup editor. This keeps API and UI in lock-step and avoids blocked dependencies.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Game CRUD (create/edit/delete) | API / Backend | — | Data persistence; season scoping logic; status enforcement lives server-side |
| Auto-season creation | API / Backend | — | Backend-only per D-02; frontend is unaware |
| Lineup persistence | API / Backend | — | `lineup_entries` is server-authoritative; Phase 6 reads same data |
| Games list display | Frontend (Angular) | — | Signal-based read from API; sorted/grouped in frontend |
| IonSegment tab switch | Frontend (Angular) | — | Inline state toggle; no navigation or API call when switching back to cached Roster tab |
| Game creation form | Frontend (Angular) | — | Form validation, date picker, post-submit navigation |
| Lineup editor (slot pickers) | Frontend (Angular) | — | Client-side player-exclusion logic per D-16; final state POST to API on Save |
| Bench derivation | Frontend (Angular) | — | Computed from unassigned players in signal — no extra API call needed |
| Migration execution | Database / Storage | — | TypeORM migration CLI, synchronize: false enforced |

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeORM | ^0.3.28 | Entity/migration ORM | Already in use — synchronize: false, migrations only [VERIFIED: package.json] |
| NestJS | (existing) | API framework | PlayersModule pattern to replicate [VERIFIED: codebase] |
| `@nestjs/passport` + `AuthGuard('jwt')` | (existing) | Route protection | All controllers use this guard [VERIFIED: players.controller.ts] |
| Angular Signals | (existing via Angular 17+) | Reactive state | Project-wide pattern, no manual .subscribe() [VERIFIED: team-dashboard.ts] |
| Ionic Angular standalone | (existing) | UI components | Imported per-component in standalone @Component [VERIFIED: team-dashboard.ts] |
| `class-validator` + `class-transformer` | (existing) | DTO validation | CreatePlayerDto uses IsString/IsNotEmpty etc. [VERIFIED: create-player.dto.ts] |
| `ngx-reactive-forms-utils` (`ControlErrorsDisplayComponent`) | (existing) | Form error display | Used in create-team.html for field-level errors [VERIFIED: create-team.html] |
| `runtime-config-loader` | (existing) | API base URL config | `config.getConfigObjectKey('apiBaseUrl')` pattern in all services [VERIFIED: players.service.ts] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `ReactiveFormsModule` + `FormBuilder` | (existing) | Form management | All form pages use it [VERIFIED: create-team.ts] |
| `firstValueFrom` (rxjs) | (existing) | Observable → Promise bridge | All async HTTP calls in components [VERIFIED: team-dashboard.ts] |
| `AlertController` (Ionic) | (existing) | Confirm dialogs | Destructive actions (delete game) [VERIFIED: team-dashboard.ts] |
| `IonDatetime` + `IonDatetimeButton` + `IonModal` | (Ionic, existing) | Date/time picker | Game creation scheduledAt field — Ionic-standard pattern [ASSUMED: Ionic docs, not yet used in codebase] |
| `IonSegment` + `IonSegmentButton` | (Ionic, existing) | Tab strip | Team Dashboard Roster/Games switch [ASSUMED: not yet in codebase but Ionic standard] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Full-page game creation route | IonModal | Modal lacks enough screen space for 4 fields + date picker; full-page is explicitly decided (Claude's Discretion) |
| Per-slot IonSelect pickers | Drag-and-drop formation UI | Far too complex for Phase 5; IonSelect is touch-friendly and consistent with existing form patterns |
| Auto-derive bench in frontend signal | Separate `GET /lineup/bench` endpoint | Frontend derivation is simpler; bench = roster players not in starters signal |

**No new npm installs required for this phase.** All libraries are already present in the workspace.

---

## Architecture Patterns

### System Architecture Diagram

```
Coach browser
     │
     ▼
Team Dashboard (teams/:id)
     │  IonSegment tap "Games"
     ▼
[Games Segment content]            [Roster Segment content]
     │  signal<Game[]>              │  signal<Player[]>
     │  loadGames() → GET           │  (already loaded)
     ▼                              
GamesService (Angular)
     │  firstValueFrom(HttpClient)
     ▼
NestJS GamesController
     │  @UseGuards(AuthGuard('jwt'))
     ├──GET  /teams/:teamId/games  ─────► GamesService.findAllForTeam()
     │                                       │  joins seasons WHERE isActive=true
     │                                       ▼
     │                                   games table (filtered by season_id)
     │
     ├──POST /teams/:teamId/games  ─────► GamesService.create()
     │       (create-game form)              │
     │                                       ├─ find or create active season
     │                                       │    seasons table (WHERE team_id, isActive=true)
     │                                       └─ INSERT into games table
     │                                       │
     │                                       └──► navigate to /:gameId/lineup
     │
     ├──PATCH /games/:gameId        ─────► GamesService.update()
     │       (edit-game form)               └─ UPDATE games table
     │
     ├──DELETE /games/:gameId       ─────► GamesService.remove()
     │       (AlertController)              └─ DELETE games + CASCADE lineup_entries
     │
     └──POST /games/:gameId/lineup  ─────► LineupEntriesService.saveLineup()
            (lineup editor Save)               │  DELETE existing + bulk INSERT
                                               └─ lineup_entries table
                                               
Lineup Editor (teams/:teamId/games/:gameId/lineup)
     │  signal<LineupSlot[]>(11 slots)
     │  signal<Player[]>([]) — full roster
     │  computed bench = roster NOT in starters
     ▼
GET /games/:gameId/lineup   ─────────────► LineupEntriesService.findByGame()
GET /teams/:teamId/players  ─────────────► PlayersService (reused)
```

### Recommended Project Structure

```
apps/api/src/
├── entities/
│   └── lineup-entry.entity.ts       # NEW — LineupEntryEntity
├── migrations/
│   └── TIMESTAMP-GamesLineupPhase.ts  # NEW — adds columns + lineup_entries table
└── games/                           # NEW NestJS module
    ├── games.module.ts
    ├── games.controller.ts
    ├── games.service.ts
    ├── lineup-entries.service.ts
    └── dto/
        ├── create-game.dto.ts
        ├── update-game.dto.ts
        └── save-lineup.dto.ts

apps/frontend/src/app/
├── teams/
│   ├── team-dashboard/
│   │   ├── team-dashboard.ts        # MODIFIED — IonSegment, games loading
│   │   └── team-dashboard.html      # MODIFIED — segment + games list
│   └── games/                       # NEW Angular feature folder
│       ├── games.service.ts
│       ├── create-game/
│       │   ├── create-game.ts
│       │   ├── create-game.html
│       │   └── create-game.scss
│       ├── edit-game/
│       │   ├── edit-game.ts
│       │   ├── edit-game.html
│       │   └── edit-game.scss
│       └── lineup-editor/
│           ├── lineup-editor.ts
│           ├── lineup-editor.html
│           └── lineup-editor.scss
└── app.routes.ts                    # MODIFIED — 3 new lazy routes
```

### Pattern 1: NestJS Module (follow PlayersModule exactly)

**What:** Standard NestJS feature module with TypeOrmModule.forFeature, controller, and service(s).
**When to use:** Every new API feature domain.
**Example:**
```typescript
// Source: apps/api/src/players/players.module.ts [VERIFIED]
@Module({
  imports: [TypeOrmModule.forFeature([GameEntity, SeasonEntity, LineupEntryEntity])],
  controllers: [GamesController],
  providers: [GamesService, LineupEntriesService],
  exports: [GamesService],
})
export class GamesModule {}
```
Register in `app.module.ts` imports array alongside PlayersModule [VERIFIED: app.module.ts].

### Pattern 2: Angular GamesService (follow PlayersService)

**What:** Injectable with `inject(HttpClient)`, `inject(RuntimeConfigLoaderService)`, returning Observables.
**When to use:** All frontend API communication for games.
**Example:**
```typescript
// Source: apps/frontend/src/app/teams/players.service.ts [VERIFIED]
@Injectable({ providedIn: 'root' })
export class GamesService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(RuntimeConfigLoaderService);

  private get apiUrl(): string {
    return this.config.getConfigObjectKey('apiBaseUrl') as string;
  }

  getGames(teamId: string): Observable<Game[]> {
    return this.http.get<Game[]>(`${this.apiUrl}/teams/${teamId}/games`);
  }

  createGame(teamId: string, data: CreateGameDto): Observable<Game> {
    return this.http.post<Game>(`${this.apiUrl}/teams/${teamId}/games`, data);
  }

  updateGame(gameId: string, data: UpdateGameDto): Observable<Game> {
    return this.http.patch<Game>(`${this.apiUrl}/games/${gameId}`, data);
  }

  deleteGame(gameId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/games/${gameId}`);
  }

  getLineup(gameId: string): Observable<LineupEntry[]> {
    return this.http.get<LineupEntry[]>(`${this.apiUrl}/games/${gameId}/lineup`);
  }

  saveLineup(gameId: string, entries: SaveLineupDto): Observable<LineupEntry[]> {
    return this.http.post<LineupEntry[]>(`${this.apiUrl}/games/${gameId}/lineup`, entries);
  }
}
```

### Pattern 3: Signal-based component state (follow TeamDashboard)

**What:** All UI state in `signal<T>()`. Load via `firstValueFrom()` in async method called from `ngOnInit`.
**When to use:** Every component that loads data.
**Example:**
```typescript
// Source: apps/frontend/src/app/teams/team-dashboard/team-dashboard.ts [VERIFIED]
protected games = signal<Game[]>([]);
protected isGamesLoading = signal(false);
protected gamesError = signal<string | null>(null);

protected async loadGames(teamId: string): Promise<void> {
  this.isGamesLoading.set(true);
  try {
    const games = await firstValueFrom(this.gamesService.getGames(teamId));
    this.games.set(games);
  } catch {
    this.gamesError.set('Failed to load games. Please refresh.');
  } finally {
    this.isGamesLoading.set(false);
  }
}
```

### Pattern 4: IonSegment inline tab switch

**What:** Signal-driven segment value; `@if` blocks switch content without navigation.
**When to use:** Team Dashboard Roster/Games toggle.
**Example:**
```typescript
// [ASSUMED: Ionic standard — not yet in codebase]
protected selectedSegment = signal<'roster' | 'games'>('roster');

protected onSegmentChange(event: CustomEvent): void {
  const val = event.detail.value as 'roster' | 'games';
  this.selectedSegment.set(val);
  if (val === 'games' && this.games().length === 0) {
    void this.loadGames(this.teamId);
  }
}
```
Template: `<ion-segment [value]="selectedSegment()" (ionChange)="onSegmentChange($event)">`

### Pattern 5: TypeORM Migration (follow existing migrations)

**What:** Raw SQL in `queryRunner.query()`. Always include `IF NOT EXISTS` / `IF EXISTS` for idempotency.
**When to use:** Every schema change, never `synchronize: true`.
**Example:**
```typescript
// Source: apps/api/src/migrations/1776466961975-AddParentEmailToPlayer.ts [VERIFIED]
public async up(queryRunner: QueryRunner): Promise<void> {
  // Add fields to existing games table
  await queryRunner.query(`
    ALTER TABLE "games"
      ADD COLUMN IF NOT EXISTS "location" character varying,
      ADD COLUMN IF NOT EXISTS "uniform_color" character varying,
      ADD COLUMN IF NOT EXISTS "status" character varying NOT NULL DEFAULT 'scheduled'
  `);
  // Create new table
  await queryRunner.query(`
    CREATE TABLE IF NOT EXISTS "lineup_entries" (
      "id" uuid DEFAULT gen_random_uuid() NOT NULL,
      "game_id" uuid NOT NULL,
      "player_id" uuid NOT NULL,
      "position_name" character varying,
      "status" character varying NOT NULL DEFAULT 'bench',
      CONSTRAINT "PK_lineup_entries" PRIMARY KEY ("id"),
      CONSTRAINT "FK_lineup_entries_game" FOREIGN KEY ("game_id")
        REFERENCES "games"("id") ON DELETE CASCADE,
      CONSTRAINT "FK_lineup_entries_player" FOREIGN KEY ("player_id")
        REFERENCES "players"("id") ON DELETE CASCADE
    )
  `);
}
```
Note: Use `character varying` not an enum type for `status` — this avoids PostgreSQL enum migration complexity while still being constrainable by application logic. [VERIFIED: pattern from InitialSchema migration]

### Pattern 6: Auto-season creation (new pattern for this phase)

**What:** GamesService.create checks for active season; creates one if absent.
**When to use:** Only in GamesService.create — transparent to controller and frontend.
**Example:**
```typescript
// [ASSUMED: new pattern derived from SeasonEntity structure]
async create(teamId: string, dto: CreateGameDto): Promise<GameEntity> {
  let season = await this.seasonRepo.findOne({
    where: { teamId, isActive: true },
  });
  if (!season) {
    const year = new Date().getFullYear();
    season = this.seasonRepo.create({
      teamId,
      name: `${year} Season`,
      isActive: true,
    });
    season = await this.seasonRepo.save(season);
  }
  const game = this.gameRepo.create({ ...dto, seasonId: season.id });
  return this.gameRepo.save(game);
}
```
GamesModule must import `TypeOrmModule.forFeature([..., SeasonEntity])`.

### Pattern 7: Lineup save as bulk replace

**What:** Delete all existing lineup_entries for a game, then bulk insert the new set.
**When to use:** Lineup editor "Save Lineup" — simpler than partial upsert.
**Example:**
```typescript
// [ASSUMED: standard bulk-replace pattern]
async saveLineup(gameId: string, entries: SaveLineupEntryDto[]): Promise<LineupEntryEntity[]> {
  await this.lineupRepo.delete({ gameId });
  const created = this.lineupRepo.create(
    entries.map((e) => ({ ...e, gameId }))
  );
  return this.lineupRepo.save(created);
}
```

### Pattern 8: IonDatetime in IonModal (Ionic standard)

**What:** `IonDatetimeButton` triggers `IonModal` containing `IonDatetime`. Presentation mode is `date-time`.
**When to use:** scheduledAt field in game creation form.
**Example:**
```html
<!-- [ASSUMED: Ionic IonDatetime standard pattern] -->
<ion-item>
  <ion-label>Date & Time</ion-label>
  <ion-datetime-button datetime="game-datetime"></ion-datetime-button>
</ion-item>
<ion-modal [keepContentsMounted]="true">
  <ng-template>
    <ion-datetime
      id="game-datetime"
      presentation="date-time"
      formControlName="scheduledAt"
    ></ion-datetime>
  </ng-template>
</ion-modal>
```

### Pattern 9: Lazy routes (follow app.routes.ts)

**What:** `loadComponent: () => import(...).then(m => m.ComponentClass)` inside the authenticated shell.
**When to use:** All new Angular page components.
**Example:**
```typescript
// Source: apps/frontend/src/app/app.routes.ts [VERIFIED]
{
  path: 'teams/:id/games/new',
  loadComponent: () =>
    import('./teams/games/create-game/create-game').then((m) => m.CreateGame),
},
{
  path: 'teams/:id/games/:gameId/lineup',
  loadComponent: () =>
    import('./teams/games/lineup-editor/lineup-editor').then((m) => m.LineupEditor),
},
{
  path: 'teams/:id/games/:gameId/edit',
  loadComponent: () =>
    import('./teams/games/edit-game/edit-game').then((m) => m.EditGame),
},
```

### Anti-Patterns to Avoid

- **manual .subscribe():** Never subscribe manually. Use `firstValueFrom()` instead. [VERIFIED: project convention, team-dashboard.ts]
- **constructor injection:** Use `inject()` everywhere. No `constructor(private x: X)` in components. [VERIFIED: all frontend files]
- **synchronize: true:** TypeORM must always run `synchronize: false`. Schema changes via migrations only. [VERIFIED: data-source.ts, app.module.ts]
- **Inline templates/styles:** Always use `templateUrl` + `styleUrl` for components. [VERIFIED: all existing components]
- **private template bindings:** Template-bound members must be `protected`, not `private`. [VERIFIED: team-dashboard.ts]
- **Enum PostgreSQL type for status:** Using `CREATE TYPE ... AS ENUM` creates migration complexity. Store status as `character varying` and validate in the application layer. [VERIFIED: existing migration pattern uses character varying for event_type]
- **Loading games in ngOnInit eagerly:** Load games lazily — only when the Games segment is first activated. Avoids unnecessary API calls when the user only wants to manage the roster.
- **Mutating signals with direct assignment:** Always use `signal.set()` or `signal.update()` — never `signal()` calls without assignment.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Form validation error display | Custom error component | `ControlErrorsDisplayComponent` from `ngx-reactive-forms-utils` | Already integrated in project; consistent UX [VERIFIED: create-team.html] |
| Date/time picker | Custom input | `IonDatetime` + `IonDatetimeButton` + `IonModal` | Ionic's native picker handles mobile keyboard avoidance, locale, and validation |
| Delete confirmation dialog | Custom modal | `AlertController` | Already imported and used in `team-dashboard.ts`; natively accessible [VERIFIED] |
| Swipe-to-delete | Custom gesture | `IonItemSliding` + `IonItemOptions` | Already used in team-dashboard.html; Ionic handles touch/mouse events [VERIFIED] |
| Player exclusion across slot pickers | Server-side validation | Frontend computed signal | Computed bench = roster minus starters signal; picker filters derived in template with `@if` or `[disabled]` |
| TypeORM migration generation | Hand-writing migration timestamps | `npx typeorm migration:generate` or manual with `Date.now()` timestamp prefix | Timestamps must be unique and monotonically increasing |

**Key insight:** Phase 5 introduces no new npm packages. Every required capability already exists in the project's dependency tree.

---

## Common Pitfalls

### Pitfall 1: Season join missing from game list query
**What goes wrong:** `GET /teams/:teamId/games` returns empty array or 500 because the query joins games directly to teams, but games are linked to teams through seasons.
**Why it happens:** The GameEntity has `seasonId` FK, not `teamId` FK. A naive `gameRepo.find({ where: { teamId } })` fails.
**How to avoid:** Query via season: `gameRepo.createQueryBuilder('g').innerJoin('g.season', 's').where('s.teamId = :teamId AND s.isActive = true', { teamId })`.
**Warning signs:** Empty game list despite games existing in DB; TypeORM "column does not exist" error for team_id on games table.

### Pitfall 2: IonSegment `ionChange` event vs `(change)` native event
**What goes wrong:** `(change)` fires on initial render or doesn't fire at all in Ionic standalone components.
**Why it happens:** Ionic custom events use `ionChange`, not native DOM `change`. They are different event emitters.
**How to avoid:** Always use `(ionChange)="handler($event)"` on `IonSegment`. [ASSUMED: Ionic standard]
**Warning signs:** Segment switch does nothing, or fires on component init unexpectedly.

### Pitfall 3: IonDatetime value format mismatch
**What goes wrong:** `scheduledAt` value from IonDatetime is an ISO 8601 string with timezone offset (e.g., `2026-04-17T15:00:00+05:00`). TypeORM expects a JS Date or ISO string without timezone ambiguity.
**Why it happens:** IonDatetime emits the local timezone string, but `timestamp` columns in PostgreSQL store UTC. If not converted, scheduled times shift unexpectedly.
**How to avoid:** Parse the IonDatetime value to `new Date(value)` before sending to API. NestJS with `class-transformer`'s `@Type(() => Date)` on the DTO handles the conversion server-side.
**Warning signs:** Games appear off by hours in the list; scheduled time shows as incorrect in DB.

### Pitfall 4: Lineup editor loads roster and lineup in parallel — race condition if game not found
**What goes wrong:** Lineup editor fires `GET /games/:gameId/lineup` and `GET /teams/:teamId/players` in parallel. If the gameId is invalid, both requests resolve but lineup is empty — misleading.
**Why it happens:** `Promise.all()` doesn't short-circuit on one failure if the other resolves.
**How to avoid:** Use `Promise.all()` but check game validity first (the API should return 404 for unknown gameId, which becomes a caught error). Set `gamesError` signal and show error state.
**Warning signs:** Blank lineup editor with no error message when navigating to a deleted game's lineup.

### Pitfall 5: Duplicate player assignment — filtering not applied in second picker
**What goes wrong:** Coach selects Player A in Slot 1 and then sees Player A available in Slot 2 picker.
**Why it happens:** Each `IonSelect`'s options list is statically bound. Exclusion requires reactive recalculation after any slot changes.
**How to avoid:** Derive a `assignedPlayerIds` computed value from the slots signal. In the template, use `[disabled]="assignedPlayerIds().has(player.id)"` on `IonSelectOption` for each slot's player picker.
**Warning signs:** Same player appears in multiple on-field slots; API receives duplicate player_id in lineup payload.

### Pitfall 6: `IonItemSliding` reset after alert dismiss
**What goes wrong:** After the "Delete Game" alert is dismissed without confirming, the `IonItemSliding` remains open (swipe state stuck).
**Why it happens:** Closing the alert doesn't automatically close the sliding item.
**How to avoid:** Inject `IonList` or `IonItemSliding` ref via `@ViewChild`/`viewChild()` and call `.closeSlidingItems()` after alert dismiss (both cancel and confirm paths).
**Warning signs:** Delete swipe option remains visible after tapping "Keep Game".

### Pitfall 7: Migration timestamp collision
**What goes wrong:** Running `npm run migration:run` fails because a migration timestamp matches an existing one.
**Why it happens:** Copying a migration file without updating the timestamp prefix.
**How to avoid:** Use `Date.now()` at time of writing to generate the migration class name and file name. Check existing migrations: latest is `1776466961975`. New migration must use a later timestamp.
**Warning signs:** TypeORM "duplicate migration name" error on startup.

### Pitfall 8: `status` enum in PostgreSQL requires `ALTER TYPE` for changes
**What goes wrong:** If `status` is defined as a PostgreSQL ENUM type, adding a new value in Phase 6 requires an `ALTER TYPE ... ADD VALUE` migration, which cannot be rolled back easily.
**Why it happens:** PostgreSQL ENUM types are database-level objects; migrating them is fragile.
**How to avoid:** Store `status` as `character varying` (confirmed by existing migration patterns). Enforce valid values in NestJS DTO with `@IsIn(['scheduled', 'in_progress', 'completed'])`.
**Warning signs:** N/A — this is a preventative decision; the pitfall is choosing ENUM type upfront.

---

## Code Examples

### LineupEntryEntity

```typescript
// [ASSUMED: new file, follows GameEventEntity pattern from game-event.entity.ts] [VERIFIED pattern]
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { GameEntity } from './game.entity';
import { PlayerEntity } from './player.entity';

@Entity('lineup_entries')
export class LineupEntryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => GameEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'game_id' })
  game: GameEntity;

  @Column({ name: 'game_id' })
  gameId: string;

  @ManyToOne(() => PlayerEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'player_id' })
  player: PlayerEntity;

  @Column({ name: 'player_id' })
  playerId: string;

  @Column({ name: 'position_name', nullable: true })
  positionName: string | null;

  @Column({ default: 'bench' })
  status: 'starting' | 'bench';
}
```

### Updated GameEntity (after migration)

```typescript
// [ASSUMED: modified from existing game.entity.ts] [VERIFIED base]
@Entity('games')
export class GameEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => SeasonEntity)
  @JoinColumn({ name: 'season_id' })
  season: SeasonEntity;

  @Column({ name: 'season_id' })
  seasonId: string;

  @Column({ nullable: true })
  opponent: string;

  @Column({ type: 'timestamp', nullable: true })
  scheduledAt: Date;

  @Column({ nullable: true })
  location: string | null;

  @Column({ name: 'uniform_color', nullable: true })
  uniformColor: string | null;

  @Column({ default: 'scheduled' })
  status: 'scheduled' | 'in_progress' | 'completed';
}
```

### Team Dashboard — IonSegment binding

```typescript
// [ASSUMED: new addition to team-dashboard.ts]
protected selectedSegment = signal<'roster' | 'games'>('roster');
protected games = signal<Game[]>([]);
protected isGamesLoading = signal(false);
protected gamesError = signal<string | null>(null);
private gamesLoaded = false;

protected onSegmentChange(event: CustomEvent): void {
  const val = event.detail.value as 'roster' | 'games';
  this.selectedSegment.set(val);
  if (val === 'games' && !this.gamesLoaded) {
    void this.loadGames(this.teamId);
    this.gamesLoaded = true;
  }
}
```

### Games grouped by upcoming/past (computed)

```typescript
// [ASSUMED: derived state pattern]
protected upcomingGames = computed(() => {
  const now = new Date();
  return this.games()
    .filter(g => new Date(g.scheduledAt) >= now)
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
});

protected pastGames = computed(() => {
  const now = new Date();
  return this.games()
    .filter(g => new Date(g.scheduledAt) < now)
    .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());
});
```

### Lineup editor — bench derivation

```typescript
// [ASSUMED: computed signal pattern]
protected slots = signal<LineupSlot[]>(
  Array.from({ length: 11 }, (_, i) => ({ slotIndex: i, positionName: null, playerId: null }))
);

protected assignedPlayerIds = computed(() =>
  new Set(this.slots().map(s => s.playerId).filter(Boolean))
);

protected benchPlayers = computed(() =>
  this.players().filter(p => !this.assignedPlayerIds().has(p.id))
);
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| NgModule imports for Ionic | Standalone component imports per-component | Angular 17+ / Ionic 7+ | All imports in `imports: []` of `@Component` decorator [VERIFIED: team-dashboard.ts] |
| `this.service.getX().subscribe(data => ...)` | `firstValueFrom(this.service.getX())` in async method | Angular 16+ | Cleaner, no unsubscribe needed [VERIFIED: team-dashboard.ts] |
| Constructor injection | `inject()` function | Angular 14+ | All new code uses `inject()` [VERIFIED: all frontend files] |
| `synchronize: true` in dev | migrations always | Phase 1 decision | `synchronize: false` in both app.module.ts and data-source.ts [VERIFIED] |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `IonSegment` uses `(ionChange)` not `(change)` for event binding | Patterns / Pitfalls | Segment switch silently fails or fires on init; fix is renaming event binding |
| A2 | `IonDatetime` + `IonDatetimeButton` + `IonModal` is the correct Ionic pattern for date-time picker in a form | Standard Stack / Code Examples | If Ionic changed the API, the picker won't open or won't bind to FormControl |
| A3 | `IonItemSliding.closeSlidingItems()` is the correct API for resetting swipe state | Pitfall 6 | Alert dismiss leaves swipe open; fix is finding the correct Ionic API |
| A4 | `character varying` for status column is preferable to PostgreSQL ENUM | Pitfalls / Code Examples | No risk if wrong — both work; `character varying` is simpler to migrate |
| A5 | `computed()` from Angular Signals is available in this Angular version | Code Examples | Bench derivation won't work; alternative is a method call in template |
| A6 | `[disabled]` on `IonSelectOption` prevents selection of already-assigned players | Pitfall 5 / Code Examples | Players can be double-assigned; need UI-level exclusion via filtering options instead |

**Note:** A5 and A6 are the highest-risk assumptions. `computed()` is available in Angular 17+ [ASSUMED based on training knowledge]. `[disabled]` on `IonSelectOption` — the safer approach is to filter the options array per slot rather than relying on `disabled` attribute support.

---

## Open Questions

1. **Does `IonSelectOption [disabled]` actually suppress selection in Ionic standalone?**
   - What we know: Standard HTML `<option disabled>` prevents selection; Ionic wraps this.
   - What's unclear: Whether Ionic's `IonSelectOption` passes through `[disabled]` to the action sheet interface.
   - Recommendation: Filter the available players array per slot instead of using `[disabled]` — `availablePlayers(slotIndex)` returns roster minus (all assigned IDs except current slot's ID). This is unambiguous.

2. **Should `GET /teams/:teamId/games` include games from all seasons or only the active one?**
   - What we know: D-08 says "joins through Season to return all games for the team's active season." Only one active season per team exists at a time.
   - What's unclear: If a coach re-activates a past season (future phase), they'd want to see old games. For Phase 5, filtering by `isActive: true` is correct per the decisions.
   - Recommendation: Filter by `isActive: true` for Phase 5. Document this assumption in GamesService code comments so Phase 6 can broaden the query if needed.

3. **Migration timestamp — what value to use?**
   - What we know: Last migration timestamp is `1776466961975` (April 2026 epoch).
   - What's unclear: The exact timestamp to use for the new migration.
   - Recommendation: Use `Date.now()` at time of writing the migration. The planner should leave this as a placeholder `TIMESTAMP` for the implementer to fill with the actual current millisecond epoch.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| PostgreSQL | TypeORM migrations | ✓ | Running (docker-compose) | — |
| Node.js / npm | Migration CLI, Angular build | ✓ | (existing) | — |
| TypeORM CLI | Migration generate/run | ✓ | via `npx typeorm` in data-source.ts | — |

Step 2.6: No new external dependencies. All existing infrastructure is sufficient.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest (NestJS) + Jasmine/Jest (Angular via Nx) |
| Config file | `jest.config.ts` per app (Nx managed) |
| Quick run command | `npx nx test api --testFile=src/games/games.service.spec.ts` |
| Full suite command | `npx nx run-many --target=test --all` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| GAME-01 | `GamesService.create` saves game and creates season if none exists | unit | `npx nx test api --testFile=src/games/games.service.spec.ts` | ❌ Wave 0 |
| GAME-02 | `GamesService.findAllForTeam` returns games via season join | unit | `npx nx test api --testFile=src/games/games.service.spec.ts` | ❌ Wave 0 |
| GAME-03 | `GamesService.update` patches game fields | unit | `npx nx test api --testFile=src/games/games.service.spec.ts` | ❌ Wave 0 |
| GAME-04 | `GamesService.remove` deletes game and cascades lineup entries | unit | `npx nx test api --testFile=src/games/games.service.spec.ts` | ❌ Wave 0 |
| LIVE-01 | `LineupEntriesService.saveLineup` bulk-replaces lineup entries | unit | `npx nx test api --testFile=src/games/lineup-entries.service.spec.ts` | ❌ Wave 0 |
| LIVE-02 | `LineupEntriesService.findByGame` returns starting + bench entries | unit | `npx nx test api --testFile=src/games/lineup-entries.service.spec.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx nx test api --testFile=src/games/games.service.spec.ts --passWithNoTests`
- **Per wave merge:** `npx nx run-many --target=test --projects=api,frontend`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `apps/api/src/games/games.service.spec.ts` — covers GAME-01 through GAME-04
- [ ] `apps/api/src/games/lineup-entries.service.spec.ts` — covers LIVE-01, LIVE-02
- [ ] `apps/api/src/games/games.controller.spec.ts` — controller is defined smoke test

*(Frontend components follow existing pattern of minimal spec files with "should be defined" tests — no new spec gaps beyond the new component files.)*

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | `@UseGuards(AuthGuard('jwt'))` on GamesController — same as all existing controllers [VERIFIED] |
| V3 Session Management | no | JWT managed by existing AuthModule |
| V4 Access Control | yes | Team ownership must be verified — coach should only manage games for their own teams. GamesService must join through teams.coach_id = requesting user's sub |
| V5 Input Validation | yes | DTO validation via `class-validator` (IsString, IsNotEmpty, IsDateString, IsOptional) on CreateGameDto/UpdateGameDto/SaveLineupDto |
| V6 Cryptography | no | No new cryptographic operations |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Coach accesses another coach's game via direct gameId | Elevation of Privilege | GamesService.findOne must verify game → season → team.coach_id matches JWT sub before returning |
| Invalid UUID in route param crashes TypeORM | Tampering | Use `ParseUUIDPipe` on `@Param('gameId')` in GamesController |
| Lineup entries for players not on the team | Tampering | LineupEntriesService must verify all player_ids belong to the game's team before inserting |
| Mass lineup save with 1000 entries | DoS | Validate array length in SaveLineupDto — max 11 entries (hardcoded for Phase 5) |

**Access control note:** The existing `PlayersController` does not verify team ownership (it trusts teamId from route param). Phase 5 should implement at least a basic ownership check in GamesService — verify that `team.coach_id === user.sub` before creating/modifying games. This is a security improvement over the Phase 4 pattern.

---

## Sources

### Primary (HIGH confidence)
- `apps/api/src/players/players.module.ts` — NestJS module pattern to replicate
- `apps/api/src/players/players.controller.ts` — Controller pattern, AuthGuard usage
- `apps/api/src/players/players.service.ts` — Service pattern, Repository injection
- `apps/api/src/entities/game.entity.ts` — Current GameEntity (needs migration)
- `apps/api/src/entities/season.entity.ts` — SeasonEntity structure (isActive field)
- `apps/api/src/entities/game-event.entity.ts` — Entity pattern for LineupEntryEntity
- `apps/api/src/migrations/*.ts` — Migration patterns (raw SQL, IF NOT EXISTS)
- `apps/api/src/app/app.module.ts` — Module registration pattern
- `apps/api/src/data-source.ts` — Entity registration for CLI
- `apps/frontend/src/app/teams/team-dashboard/team-dashboard.ts` — Signal state, inject(), AlertController, ModalController
- `apps/frontend/src/app/teams/team-dashboard/team-dashboard.html` — IonItemSliding, IonFab template
- `apps/frontend/src/app/teams/players.service.ts` — Angular service pattern
- `apps/frontend/src/app/teams/create-team/create-team.ts` — Form pattern, ControlErrorsDisplayComponent
- `apps/frontend/src/app/teams/create-team/create-team.html` — Form template pattern
- `apps/frontend/src/app/app.routes.ts` — Route registration pattern

### Secondary (MEDIUM confidence)
- `.planning/phases/05-games-lineup/05-CONTEXT.md` — Locked decisions (D-01 through D-16)
- `.planning/phases/05-games-lineup/05-UI-SPEC.md` — Component inventory, screen layouts, interaction contracts
- `.planning/REQUIREMENTS.md` — GAME-01..04, LIVE-01..02 requirement definitions

### Tertiary (LOW confidence — training knowledge)
- IonSegment `ionChange` event name
- IonDatetime + IonDatetimeButton + IonModal combination pattern
- `computed()` signal availability in current Angular version
- `[disabled]` attribute on IonSelectOption

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified against actual codebase files
- Architecture: HIGH — derived directly from existing patterns + CONTEXT.md locked decisions
- Pitfalls: MEDIUM — most derived from TypeORM/Angular/Ionic known behaviors, 2 from codebase inspection
- Security: MEDIUM — pattern matches existing codebase but ownership check is a new pattern for this project

**Research date:** 2026-04-17
**Valid until:** 2026-05-17 (stable stack — Ionic, Angular, NestJS, TypeORM all pinned via package.json)
