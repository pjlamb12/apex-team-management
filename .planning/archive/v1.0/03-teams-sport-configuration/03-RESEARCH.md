# Phase 3: Teams & Sport Configuration - Research

**Researched:** 2026-04-16
**Domain:** Angular 21 Signals + Ionic 8 + NestJS 11 + TypeORM 0.3 — CRUD feature with navigation shell and data model migration
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Create a `/teams` route as the post-login destination. The existing `/home` route can remain as a redirect to `/teams` or be replaced. Phase 2 CONTEXT already targets `/teams` for post-login redirect.
- **D-02:** Teams are displayed as cards on the `/teams` list page. Each card shows: team name, sport badge (e.g., "Soccer"), and [Edit] / [Delete] action buttons.
- **D-03:** A first-time coach (no teams yet) sees a friendly empty state: centered icon/illustration, message like "No teams yet — create your first team", and a prominent Create Team button. Not just a bare button.
- **D-04:** A [+ Create Team] button is always visible on the teams list page (e.g., in the header or as a FAB), not just on empty state.
- **D-05:** The Create Team form shows a real sport dropdown, pre-populated from the `sports` table, with Soccer pre-selected. Even though only Soccer is available in v1, the dropdown is rendered so future sports appear automatically when seeded.
- **D-06:** The team card shows a small sport badge (e.g., "Soccer"). The team detail/edit page shows "Sport: Soccer" as a read-only label (sport is not changeable after team creation).
- **D-07:** Team creation form collects **name and sport only**. No format fields on the create form.
- **D-08:** Team detail/edit page allows editing **name only**. Sport is shown read-only. No format fields exposed on the team itself.
- **D-09:** `players_on_field`, `period_count`, and `period_length_minutes` are **moved from `TeamEntity` to `SeasonEntity`** via a TypeORM migration in this phase.
- **D-10:** `TeamEntity` retains only: `id`, `name`, `sportId` / `sport` relation, `seasons` relation.
- **D-11:** `SeasonEntity` gains: `playersOnField` (integer), `periodCount` (integer), `periodLengthMinutes` (integer).
- **D-12:** Team deletion uses an Ionic `AlertController` dialog with Cancel and Delete (destructive) buttons. No separate page.
- **D-13:** Phase 3 establishes the persistent bottom tab bar (`IonTabs` + `IonTabBar`) that all future phases share. Teams tab is the first tab and is active.
- **D-14:** Only tabs for implemented features are visible. In Phase 3, only the **Teams tab** is shown.
- **D-15:** The nav shell wraps the authenticated routes. Unauthenticated routes (login, signup, reset-password) remain outside the shell.

### Claude's Discretion

- NestJS teams module structure: `apps/api/src/teams/` with `TeamsController`, `TeamsService`, `TeamEntity`. Follow existing `apps/api/src/auth/` pattern.
- Angular teams feature: lazy-loaded under the shell. Route structure: `/teams` (list), `/teams/new` (create form), `/teams/:id` (detail/edit).
- Sport dropdown: fetched from `GET /sports` on component init, loaded into a signal. Only enabled sports (`isEnabled: true`) shown.
- Ionic `IonAlert` via `AlertController` for delete confirmation — consistent with Ionic patterns already in use.
- After team creation, navigate to `/teams` (the list) — not to a team detail page.
- The shell component lives at `apps/frontend/src/app/shell/` and uses `IonTabs`. Auth guard applied at the shell route level.

### Deferred Ideas (OUT OF SCOPE)

- **Season management UI** — Creating/editing seasons is deferred. Phase 3 migrates the fields to SeasonEntity but no UI for seasons yet.
- **Team color/branding** — Deferred until Phase 6.
- **Sport management UI** — Admin interface to add/edit sports. Out of scope for v1.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TEAM-01 | Coach can create a new team with a name | NestJS `POST /teams` endpoint + Angular create form at `/teams/new` |
| TEAM-02 | Coach can select a sport when creating a team (soccer for v1) | `GET /sports` endpoint feeds `IonSelect` dropdown in create form; Soccer pre-selected |
| TEAM-04 | Coach can view and edit team details | `GET /teams/:id` + `PATCH /teams/:id` endpoints; Angular detail/edit page at `/teams/:id` |
| TEAM-05 | Coach can delete a team | `DELETE /teams/:id` endpoint; `AlertController` confirmation dialog on frontend |
</phase_requirements>

---

## Summary

Phase 3 delivers the full teams CRUD flow on top of the existing Angular 21 + Ionic 8 + NestJS 11 foundation built in Phases 1–2. The work splits across four concerns: (1) a new NestJS `TeamsModule` + `SportsModule` following the established `apps/api/src/auth/` module pattern; (2) a TypeORM migration that moves format fields from `teams` to `seasons` and removes columns from `TeamEntity`; (3) an Angular navigation shell (`IonTabs`) that wraps all authenticated routes; and (4) three Angular team feature components (list, create, edit/detail) loaded lazily beneath that shell.

All required libraries are already installed (`@ionic/angular 8.8.4`, `@angular/core 21.2`, `@nestjs/typeorm 11`, `typeorm 0.3.28`, `ngx-reactive-forms-utils 5.1`). No new dependencies are needed. The code patterns — Signals for state, `inject()` for DI, `firstValueFrom()` for HTTP calls, standalone Ionic components, external templates — are all established in the auth components and can be followed directly.

The most critical sequencing risk is the migration: `players_on_field`, `period_count`, and `period_length_minutes` must be dropped from `teams` and added to `seasons` before the TypeORM entities are updated, otherwise TypeORM will error on startup. The migration must also add `userId` / `coach_id` to `teams` if team ownership by the logged-in coach is required for the CRUD endpoints (see Open Questions below).

**Primary recommendation:** Build NestJS TeamsModule first (API + migration), verify DB changes, then build the Angular shell + team feature components following the auth component pattern exactly.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Teams CRUD (create, read, update, delete) | API / Backend | — | Persistence + auth enforcement happen server-side |
| Sports list (dropdown data) | API / Backend | — | Read from DB sports table; frontend just consumes |
| Data model migration (format field move) | Database / Storage | API / Backend | TypeORM migration runs against DB; entity files live in API |
| Navigation shell (tab bar) | Frontend (Angular) | — | Pure UI routing concern, no backend involvement |
| Teams list, create, edit UI | Frontend (Angular) | — | Ionic components, Signals, HTTP calls to API |
| Delete confirmation dialog | Frontend (Angular) | — | `AlertController` is a client-side Ionic service |
| Auth guard on shell route | Frontend (Angular) | API / Backend | Frontend guards route; API independently validates JWT on every request |
| Sport badge display | Frontend (Angular) | — | Data comes from API; badge is a pure UI rendering concern |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@angular/core` | ~21.2.0 | Signals, `inject()`, components | Project foundation — already installed |
| `@ionic/angular` | ^8.8.4 | `IonTabs`, `IonTabBar`, `IonCard`, `AlertController`, etc. | Project foundation — already installed; standalone imports pattern established |
| `@nestjs/common` | ^11.1.19 | `@Controller`, `@Get`, `@Post`, `@Patch`, `@Delete`, `@UseGuards` | Project foundation — established in auth module |
| `@nestjs/passport` + `AuthGuard('jwt')` | ^11.0.5 | Protect teams endpoints with JWT | Already wired in auth module; same guard reused for teams |
| `@nestjs/typeorm` + `typeorm` | ^11.0.1 / ^0.3.28 | `TypeOrmModule.forFeature()`, repositories, migrations | Already in use; migration tooling configured in `apps/api/project.json` |
| `class-validator` + `class-transformer` | ^0.15.1 / ^0.5.1 | DTO validation on API (`@IsString`, `@IsUUID`, `@IsNotEmpty`) | Already installed; used in auth DTOs |
| `ngx-reactive-forms-utils` | ^5.1.0 | `ControlErrorsDisplayComponent` for form validation display | Already installed and used in login/signup forms |
| `rxjs` | ~7.8.0 | `firstValueFrom()` for HTTP calls | Already in use in `AuthService` |
| `runtime-config-loader` | ^6.1.0 | `apiBaseUrl` from config.json for HTTP calls | Already wired in `AuthService` and `app.config.ts` |

[VERIFIED: package.json in project root — all packages confirmed present at listed versions]

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@angular/forms` (ReactiveFormsModule) | ~21.2.0 | Form groups for create/edit forms | Both teams forms use reactive forms matching auth pattern |
| `@angular/router` (RouterLink, Router) | ~21.2.0 | Navigation between shell child routes | Shell child routes + back-navigation after form submit |
| Ionicons | bundled with `@ionic/angular` 8 | `people-outline` for tab bar and empty state | Ionicon names referenced directly as strings in `IonIcon` |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `AlertController` for delete | Custom modal component | `AlertController` is simpler and Ionic-native; custom modal adds complexity for no benefit |
| Signals + `inject()` for HTTP state | NgRx or RxJS `BehaviorSubject` | Signals are the project standard per TRD and established in auth service |
| `firstValueFrom()` for HTTP | `.toPromise()` or direct subscribe | `firstValueFrom` is the modern RxJS pattern; `.toPromise()` is deprecated |

**Installation:** No new packages required — all dependencies already in `package.json`.

---

## Architecture Patterns

### System Architecture Diagram

```
Coach Browser
     │
     ▼
Angular Shell Component (/shell)
  [authGuard]
  [IonTabs + IonTabBar]
     │
     ├── /teams (TeamsListComponent)
     │     │  GET /api/teams  ──────────────────────────► NestJS TeamsController
     │     │                                                    │
     │     │  DELETE /api/teams/:id  ──────────────────────    │
     │     │  (AlertController confirm first)                   ▼
     │     │                                              TeamsService
     ├── /teams/new (CreateTeamComponent)                      │
     │     │  GET /api/sports  ─────────────────────────► NestJS SportsController
     │     │  POST /api/teams  ─────────────────────────► TeamsController
     │     │                                                    │
     └── /teams/:id (EditTeamComponent)                        ▼
           │  GET /api/teams/:id  ──────────────────────  TypeORM Repository
           │  PATCH /api/teams/:id  ────────────────────  TeamEntity / SportEntity
           │  DELETE /api/teams/:id                            │
                                                               ▼
                                                        PostgreSQL
                                                  (teams table — migrated)
                                                  (seasons table — gains 3 cols)
                                                  (sports table — read-only seed)
```

All API requests carry JWT Bearer token via the existing `authInterceptor` (wired in `app.config.ts`). NestJS endpoints use `@UseGuards(AuthGuard('jwt'))`.

### Recommended Project Structure

```
apps/api/src/
├── teams/
│   ├── teams.module.ts         # TypeOrmModule.forFeature([TeamEntity])
│   ├── teams.controller.ts     # GET /teams, POST /teams, GET /teams/:id, PATCH /teams/:id, DELETE /teams/:id
│   ├── teams.service.ts        # Business logic, repo calls
│   └── dto/
│       ├── create-team.dto.ts  # name (string), sportId (UUID)
│       └── update-team.dto.ts  # name (string) — PartialType(CreateTeamDto) or explicit
├── sports/
│   ├── sports.module.ts        # TypeOrmModule.forFeature([SportEntity])
│   ├── sports.controller.ts    # GET /sports
│   └── sports.service.ts       # findAllEnabled()
├── migrations/
│   └── {timestamp}-MoveFormatFieldsToSeasons.ts  # New migration
└── entities/
    ├── team.entity.ts          # Updated: remove 3 format columns
    └── season.entity.ts        # Updated: add 3 format columns

apps/frontend/src/app/
├── shell/
│   ├── shell.ts                # IonTabs + IonTabBar, Teams tab only
│   ├── shell.html
│   └── shell.scss
├── teams/
│   ├── teams-list/
│   │   ├── teams-list.ts       # signal<Team[]>, loadTeams(), deleteTeam()
│   │   ├── teams-list.html
│   │   └── teams-list.scss
│   ├── create-team/
│   │   ├── create-team.ts      # signal<Sport[]>, FormGroup, submit()
│   │   ├── create-team.html
│   │   └── create-team.scss
│   └── edit-team/
│       ├── edit-team.ts        # route param via inject(ActivatedRoute), loadTeam(), save(), delete()
│       ├── edit-team.html
│       └── edit-team.scss
```

### Pattern 1: NestJS Module (Follow Auth Pattern)

**What:** Feature module with `TypeOrmModule.forFeature()`, controller, service, DTOs.
**When to use:** Every new NestJS feature area.
**Example:**
```typescript
// Source: apps/api/src/auth/auth.module.ts (existing)
@Module({
  imports: [TypeOrmModule.forFeature([TeamEntity, SportEntity])],
  controllers: [TeamsController],
  providers: [TeamsService],
})
export class TeamsModule {}
```

Register in `app.module.ts` by adding `TeamsModule` and `SportsModule` to the `imports` array — same place `AuthModule` is registered.

### Pattern 2: Angular Signal-Based Component (Follow Login Pattern)

**What:** Standalone component with `inject()`, signals for loading/error/data state, `firstValueFrom()` for HTTP.
**When to use:** All new Angular components in this project.
**Example:**
```typescript
// Source: apps/frontend/src/app/auth/login/login.ts (existing)
@Component({
  selector: 'app-teams-list',
  standalone: true,
  imports: [IonContent, IonList, IonCard, /* ... */],
  templateUrl: './teams-list.html',
  styleUrl: './teams-list.scss',
})
export class TeamsList {
  private readonly http = inject(HttpClient);
  private readonly config = inject(RuntimeConfigLoaderService);
  protected readonly alertCtrl = inject(AlertController);

  protected teams = signal<Team[]>([]);
  protected isLoading = signal(false);
  protected errorMessage = signal<string | null>(null);

  protected async loadTeams(): Promise<void> {
    this.isLoading.set(true);
    try {
      const data = await firstValueFrom(
        this.http.get<Team[]>(`${this.apiUrl}/teams`)
      );
      this.teams.set(data);
    } catch {
      this.errorMessage.set('Failed to load teams.');
    } finally {
      this.isLoading.set(false);
    }
  }
}
```

### Pattern 3: IonTabs Shell Route

**What:** A shell component that contains `IonTabs` and `IonTabBar`. Child routes render inside `IonRouterOutlet`.
**When to use:** Building the authenticated navigation wrapper.
**Example:**
```typescript
// Shell component template (shell.html)
// Source: Ionic Angular docs pattern [CITED: ionicframework.com/docs/api/tabs]
<ion-tabs>
  <ion-tab-bar slot="bottom">
    <ion-tab-button tab="teams" href="/shell/teams">
      <ion-icon name="people-outline"></ion-icon>
      <ion-label>Teams</ion-label>
    </ion-tab-button>
  </ion-tab-bar>
</ion-tabs>
```

Route structure in `app.routes.ts`:
```typescript
{
  path: 'shell',
  loadComponent: () => import('./shell/shell').then(m => m.Shell),
  canActivate: [authGuard],
  children: [
    { path: 'teams', loadComponent: () => import('./teams/teams-list/teams-list').then(m => m.TeamsList) },
    { path: 'teams/new', loadComponent: () => import('./teams/create-team/create-team').then(m => m.CreateTeam) },
    { path: 'teams/:id', loadComponent: () => import('./teams/edit-team/edit-team').then(m => m.EditTeam) },
    { path: '', redirectTo: 'teams', pathMatch: 'full' },
  ],
},
// Update the top-level redirect:
{ path: '', redirectTo: '/shell/teams', pathMatch: 'full' },
// Also update post-login redirect in AuthService (currently navigates to '/home'):
// await this.router.navigate(['/shell/teams']);
```

**Important:** The `/home` route and the `AuthService` post-login redirect (currently `'/home'`) must both be updated to point to `/shell/teams`.

### Pattern 4: TypeORM Migration (Follow Established Pattern)

**What:** Hand-write SQL migration for the column move. Generate the file with the Nx target.
**When to use:** Any schema change.
**Example approach:**
```typescript
// Source: apps/api/src/migrations/1744990000000-AddAuthColumns.ts (existing pattern)
export class MoveFormatFieldsToSeasons{timestamp} implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Add new columns to seasons (nullable first to avoid NOT NULL constraint error)
    await queryRunner.query(`
      ALTER TABLE "seasons"
        ADD COLUMN "players_on_field" integer,
        ADD COLUMN "period_count" integer,
        ADD COLUMN "period_length_minutes" integer
    `);
    // Step 2: Drop columns from teams
    await queryRunner.query(`
      ALTER TABLE "teams"
        DROP COLUMN "players_on_field",
        DROP COLUMN "period_count",
        DROP COLUMN "period_length_minutes"
    `);
  }
}
```

Run with: `nx run api:migration:run`
Generate with: `nx run api:migration:generate --args="--name=MoveFormatFieldsToSeasons"`

### Pattern 5: AlertController for Delete Confirmation

**What:** Inject `AlertController`, call `.create()` then `.present()`, react to role.
**When to use:** D-12 — delete confirmation.
**Example:**
```typescript
// Source: Ionic docs [CITED: ionicframework.com/docs/api/alert]
protected async confirmDelete(team: Team): Promise<void> {
  const alert = await this.alertCtrl.create({
    header: 'Delete Team',
    message: `Are you sure you want to delete ${team.name}? This cannot be undone.`,
    buttons: [
      { text: 'Keep Team', role: 'cancel' },
      {
        text: 'Delete Team',
        role: 'destructive',
        cssClass: 'text-danger',
        handler: () => this.deleteTeam(team.id),
      },
    ],
  });
  await alert.present();
}
```

`AlertController` is injected as a service — NOT imported as a standalone component. No import in the component `imports` array.

### Anti-Patterns to Avoid

- **Manual `.subscribe()` in TypeScript:** Use `firstValueFrom()` for one-shot HTTP calls. `toSignal()` for reactive bindings. No raw `.subscribe()`.
- **Constructor injection:** Use `inject()` function. No `constructor(private service: Service)`.
- **Inline templates/styles:** All new components use `templateUrl` + `styleUrl`.
- **Public template members:** Template-bound properties use `protected` access modifier, not `public`.
- **`synchronize: true` in TypeORM config:** Already set to `false` in `app.module.ts` and `data-source.ts`. Never change this. Use migrations only.
- **Modifying the DB schema in entity without a migration:** Entity files and migration SQL must stay in sync. Updating `team.entity.ts` without a migration will either error or silently diverge.
- **Forgetting to update `AuthService.login()` and `signup()` redirects:** Both currently navigate to `'/home'`. After adding the shell, they must navigate to `'/shell/teams'` (or just `'/shell'` which redirects internally).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Form validation display | Custom error component | `ControlErrorsDisplayComponent` from `ngx-reactive-forms-utils` | Already in use in login/signup; same pattern for team forms |
| Delete confirmation modal | Custom modal component | `AlertController` from `@ionic/angular/standalone` | Ionic-native, accessible, zero boilerplate |
| JWT attachment to HTTP requests | Manual header injection in each service | Existing `authInterceptor` already wired in `app.config.ts` | Interceptor handles all `HttpClient` requests automatically |
| Loading skeleton UI | Custom skeleton component | `IonSkeletonText` from `@ionic/angular/standalone` | Ionic built-in; follows UI-SPEC loading state contract |
| Sport badge chip | Custom badge component | `IonBadge` from `@ionic/angular/standalone` | Ionic built-in, styled with Tailwind + Ionic CSS variables |
| Tab navigation | Custom bottom nav | `IonTabs` + `IonTabBar` + `IonTabButton` | Ionic-native tab routing; integrates with Angular router automatically |

**Key insight:** This project has no custom UI primitives — everything is Ionic components + Tailwind utilities. Building custom equivalents would diverge from the established pattern and create maintenance burden.

---

## Common Pitfalls

### Pitfall 1: Migration Column Drop Fails Due to NOT NULL Default Values

**What goes wrong:** Dropping `players_on_field` (NOT NULL DEFAULT 11) from `teams` while simultaneously adding it to `seasons` as nullable creates a state where running rollback becomes complex.
**Why it happens:** The original `teams` migration defines these columns as `NOT NULL`. A migration that drops them must handle the ordering carefully.
**How to avoid:** In the migration `up()`: add columns to `seasons` as nullable first, then drop from `teams`. Do not set NOT NULL on seasons columns yet (season creation UI is deferred — no UI to populate them).
**Warning signs:** TypeORM startup error "column of relation does not exist" if entity files are updated without running the migration first.

### Pitfall 2: IonTabs Tab Route Mismatch

**What goes wrong:** Tab buttons with `tab="teams"` and `href="/shell/teams"` do not match the child route path, causing the tab to never appear active.
**Why it happens:** Ionic `IonTabButton` uses the `tab` attribute to match the active child route segment. The `tab` value must match the child route `path` exactly.
**How to avoid:** Ensure `tab="teams"` matches the child route `{ path: 'teams', ... }` in the shell's `children` array. The `href` should be the full path for direct navigation.
**Warning signs:** Tab bar shows but no tab appears highlighted/active.

### Pitfall 3: AuthService Post-Login Redirect Still Points to `/home`

**What goes wrong:** After implementing the shell, logging in navigates to `/home` (the old route), not the new shell.
**Why it happens:** `AuthService.login()` and `signup()` both call `this.router.navigate(['/home'])`. Two places to update.
**How to avoid:** Update both `login()` and `signup()` in `auth.service.ts` to navigate to `'/shell/teams'`.
**Warning signs:** After login, user lands on the old empty home page instead of teams list.

### Pitfall 4: `AlertController` Imported as Component Instead of Injected as Service

**What goes wrong:** `AlertController` added to the component `imports` array causes a compile error — it is not a standalone component directive.
**Why it happens:** Developers confuse Ionic service classes with component imports.
**How to avoid:** `AlertController` is injected via `inject(AlertController)` only. Never add it to `imports: []`.
**Warning signs:** TypeScript error: "Type 'typeof AlertController' is not assignable to type 'ImportedNgModuleProviders | Type<any>'".

### Pitfall 5: Sport Dropdown Shows Disabled Sports

**What goes wrong:** The dropdown shows all sports including any where `isEnabled: false`.
**Why it happens:** `GET /sports` returns all sports; filtering by `isEnabled` must happen either in the API query or in the frontend.
**How to avoid:** Filter at the API level: `SportsService.findAllEnabled()` queries with `WHERE is_enabled = true`. Simpler than frontend filtering and future-proof.
**Warning signs:** A future sport seeded with `isEnabled: false` appears in the dropdown.

### Pitfall 6: Team Entity Updated Before Migration Runs

**What goes wrong:** Removing `playersOnField`, `periodCount`, `periodLengthMinutes` from `team.entity.ts` before the migration runs causes TypeORM startup to log schema divergence warnings (or errors if strict mode).
**Why it happens:** TypeORM entities describe the expected schema. If the DB still has those columns but the entity doesn't declare them, TypeORM ignores them in entity operations — but existing data is not harmed. However, if the migration hasn't run yet and you try to query, TypeORM may try to map undefined columns.
**How to avoid:** Run `nx run api:migration:run` after writing the migration, then update entity files. Keep migration and entity changes in the same commit, clearly ordered in the implementation plan.
**Warning signs:** NestJS startup log "column teams.players_on_field does not exist" after entity update but before migration run.

### Pitfall 7: Missing `userId` / Team Ownership (Data Model Gap)

**What goes wrong:** Teams created via `POST /teams` are not associated with the authenticated coach, so any authenticated user can view/edit/delete any team.
**Why it happens:** The current `TeamEntity` has no `userId` / `coachId` foreign key. Phase 1's initial schema also has no such FK in the `teams` table.
**How to avoid:** The planner must decide whether Phase 3 adds a `coach_id` FK to teams (requiring an additional migration column and JWT-based ownership check in `TeamsService`) or defers this to a later phase. See Open Questions #1.
**Warning signs:** Any authenticated user (if multiple coaches sign up) sees all teams in the system, not just their own.

---

## Code Examples

### teams.controller.ts pattern
```typescript
// Source: apps/api/src/auth/auth.controller.ts (existing project pattern)
import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';

@Controller('teams')
@UseGuards(AuthGuard('jwt'))
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get()
  findAll(@Request() req: { user: { sub: string } }) {
    return this.teamsService.findAllByCoach(req.user.sub);
  }

  @Post()
  create(@Body() dto: CreateTeamDto, @Request() req: { user: { sub: string } }) {
    return this.teamsService.create(dto, req.user.sub);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.teamsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTeamDto) {
    return this.teamsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.teamsService.remove(id);
  }
}
```

### IonSelect sport dropdown (following auth IonInput pattern)
```html
<!-- Source: apps/frontend/src/app/auth/login/login.html (established pattern) -->
<ngx-control-errors-display>
  <ion-item>
    <ion-select
      label="Sport"
      labelPlacement="floating"
      formControlName="sportId"
      [value]="defaultSportId()"
    >
      @for (sport of sports(); track sport.id) {
        <ion-select-option [value]="sport.id">{{ sport.name }}</ion-select-option>
      }
    </ion-select>
  </ion-item>
</ngx-control-errors-display>
```

### ActivatedRoute param via inject() (Angular 21 pattern)
```typescript
// [CITED: angular.dev/guide/routing/read-route-state]
// Angular 21: use inject(ActivatedRoute) — no constructor injection
private readonly route = inject(ActivatedRoute);

ngOnInit(): void {
  const id = this.route.snapshot.paramMap.get('id');
  if (id) this.loadTeam(id);
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `NgModules` for Ionic imports | Standalone component imports | Angular 14+ / Ionic 7+ | All Ionic components imported per-component, no `IonicModule` import |
| Constructor injection in Angular | `inject()` function | Angular 14+ | Project standard — no `constructor(private x: X)` |
| `.subscribe()` for HTTP in services | `firstValueFrom()` + Signals | Angular 16+ / RxJS 7 | No manual subscription management |
| `@angular/router` `ActivatedRoute` snapshot via constructor | `inject(ActivatedRoute)` | Angular 14+ | Same functional API, `inject()` style |
| TypeORM `synchronize: true` | `synchronize: false` + migrations | Phase 1 decision D-10 | All schema changes via explicit migration files |

**Deprecated/outdated (do not use):**
- `IonicModule.forRoot()` in NgModule: not applicable — project uses standalone components
- `constructor(private service: Service)` injection: use `inject()` instead per project standard
- `HttpClientModule` in NgModule: replaced by `provideHttpClient()` in `app.config.ts` — already wired

---

## Runtime State Inventory

> This phase includes a data model migration. Runtime state audit is required.

| Category | Items Found | Action Required |
|----------|-------------|-----------------|
| Stored data | `teams` table has `players_on_field`, `period_count`, `period_length_minutes` columns in PostgreSQL. `seasons` table does NOT have these columns yet. | TypeORM migration: ADD to `seasons`, DROP from `teams` |
| Live service config | None — no external service registrations reference team format fields | None |
| OS-registered state | None — no OS-level registrations | None |
| Secrets/env vars | None — no env vars reference the column names being moved | None |
| Build artifacts | None — no compiled artifacts outside the repo reference these column names | None |

**Data migration note:** The format fields being dropped from `teams` have default values (11, 2, 45). The `seasons` table columns being added are nullable — no data migration of existing values is needed. Any existing team rows simply lose those fields; existing season rows gain nullable columns with NULL values (since season creation UI is deferred, no seasons exist in practice).

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Nx build, migration CLI | Yes | v25.2.1 | — |
| Docker | PostgreSQL (docker-compose) | Yes | Client present | — |
| PostgreSQL (via docker-compose) | TypeORM migrations, API runtime | Assumed via docker-compose | 15+ (docker-compose.yml) | Run `docker compose up -d` |
| `nx` CLI | Build, serve, migration targets | Yes (in devDeps 22.6.5) | 22.6.5 | `npx nx` |

[VERIFIED: `command -v node && node --version` returns v25.2.1]
[VERIFIED: `command -v docker` returns `/usr/local/bin/docker`]
[ASSUMED: PostgreSQL container is running or startable via `docker compose up -d` — not probed directly]

**Missing dependencies with no fallback:** None identified.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest (via `@nx/vitest 22.6.5`) for unit tests; `@angular/build:unit-test` executor for frontend |
| Config file | `libs/shared/util/models/vitest.config.mts` (existing); frontend uses Angular build executor |
| Quick run command | `nx test frontend --testFile=src/app/teams/teams-list/teams-list.spec.ts` |
| Full suite command | `nx run-many --target=test --all` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TEAM-01 | `TeamsService.create()` persists team with name and sportId | unit | `nx test api --testFile=src/teams/teams.service.spec.ts` | No — Wave 0 |
| TEAM-02 | `SportsService.findAllEnabled()` returns only `isEnabled: true` records | unit | `nx test api --testFile=src/sports/sports.service.spec.ts` | No — Wave 0 |
| TEAM-04 | `TeamsService.update()` patches team name; sport unchanged | unit | `nx test api --testFile=src/teams/teams.service.spec.ts` | No — Wave 0 |
| TEAM-05 | `TeamsService.remove()` deletes team by id | unit | `nx test api --testFile=src/teams/teams.service.spec.ts` | No — Wave 0 |
| TEAM-01 | CreateTeam component submits form and navigates to `/shell/teams` on success | unit (Angular TestBed) | `nx test frontend --testFile=src/app/teams/create-team/create-team.spec.ts` | No — Wave 0 |
| TEAM-05 | TeamsList component calls AlertController and deletes on confirm | unit (Angular TestBed) | `nx test frontend --testFile=src/app/teams/teams-list/teams-list.spec.ts` | No — Wave 0 |

### Sampling Rate

- **Per task commit:** `nx test frontend` or `nx test api` (whichever is relevant to the task)
- **Per wave merge:** `nx run-many --target=test --projects=frontend,api`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `apps/api/src/teams/teams.service.spec.ts` — covers TEAM-01, TEAM-04, TEAM-05 (service unit tests with mocked TypeORM repository)
- [ ] `apps/api/src/sports/sports.service.spec.ts` — covers TEAM-02
- [ ] `apps/frontend/src/app/teams/teams-list/teams-list.spec.ts` — covers TEAM-05 (delete flow)
- [ ] `apps/frontend/src/app/teams/create-team/create-team.spec.ts` — covers TEAM-01, TEAM-02 (form + navigation)
- [ ] `apps/frontend/src/app/shell/shell.spec.ts` — smoke test for tab bar render

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | Yes | JWT via `AuthGuard('jwt')` — `@UseGuards(AuthGuard('jwt'))` on `TeamsController` |
| V3 Session Management | No | Handled in Phase 2; no new session logic here |
| V4 Access Control | Yes | Team ownership check: only the creating coach should access their own teams (see Open Questions #1) |
| V5 Input Validation | Yes | `class-validator` on DTOs (`@IsString`, `@IsNotEmpty`, `@IsUUID`) |
| V6 Cryptography | No | No new cryptographic operations; password hashing remains in Phase 2's auth layer |

### Known Threat Patterns for NestJS + TypeORM

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Unauthenticated team access | Spoofing | `@UseGuards(AuthGuard('jwt'))` on all `TeamsController` endpoints |
| IDOR (accessing another coach's teams) | Elevation of Privilege | Filter `findAll` by `userId` from JWT payload; `findOne`/`update`/`remove` verify `coachId === req.user.sub` |
| Mass assignment via DTO | Tampering | Only `name` and `sportId` in `CreateTeamDto`; `UpdateTeamDto` only exposes `name` — `sportId` excluded |
| SQL injection | Tampering | TypeORM parameterized queries by default; raw `queryRunner.query()` in migrations uses template literals (safe — no user input) |

---

## Open Questions

1. **Team Ownership: Does `teams` need a `coach_id` FK?**
   - What we know: `TeamEntity` currently has no `userId`/`coachId` column. The initial migration does not add one. The auth module extracts `req.user.sub` (userId) from the JWT via Passport.
   - What's unclear: Did Phase 1/2 intentionally defer team ownership? The CONTEXT.md decisions do not explicitly mention adding `coachId` to `TeamEntity`, yet the `TeamsController` pattern above uses `req.user.sub` for `findAllByCoach()`.
   - Recommendation: **Add `coach_id` FK to the `teams` table as part of this phase's migration.** Without it, all coaches see all teams (broken multi-tenancy). The migration can add `coach_id uuid NOT NULL REFERENCES users(id)` alongside the format field moves. This is a straightforward addition and the right time to establish ownership.

2. **`/home` Route: Replace or Redirect?**
   - What we know: D-01 says the `/home` route "can remain as a redirect to `/teams` or be replaced."
   - What's unclear: Should `home.ts` be deleted, or kept as `{ path: 'home', redirectTo: '/shell/teams' }`?
   - Recommendation: Replace `/home` entirely with a redirect in `app.routes.ts`. The `home/` directory and component can be deleted to avoid confusion.

3. **Shell Route URL: `/shell` prefix or flat?**
   - What we know: CONTEXT.md says teams routes are `/teams`, `/teams/new`, `/teams/:id`. The shell wraps these.
   - What's unclear: Should the shell route be at `path: ''` (making teams accessible at `/teams`) or `path: 'shell'` (making them at `/shell/teams`)?
   - Recommendation: Use `path: ''` for the shell, with the `IonTabButton` pointing to `href="/teams"`. This keeps URLs clean (`/teams` not `/shell/teams`) and matches the CONTEXT.md decision wording. The shell component is the layout wrapper only; its own path segment should be empty.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | PostgreSQL container is running or can be started via `docker compose up -d` | Environment Availability | Migration commands will fail if DB is not accessible; planner should include DB startup verification step |
| A2 | `sports` table has at least one seeded Soccer record (from Phase 1 initial migration) | Architecture Patterns, Pattern 2 | Sport dropdown would be empty on first load; soccer seed is in `1744934400000-InitialSchema.ts` (verified) — actually VERIFIED not assumed |
| A3 | No seasons records currently exist in the DB | Runtime State Inventory | If seasons exist, the new nullable columns add NULL values which is safe — no risk |
| A4 | Shell route uses empty path (`path: ''`) so URLs remain `/teams` not `/shell/teams` | Architecture Patterns, Pattern 3 | If wrong, all links/redirects in auth service point to wrong paths; low risk if Open Question 3 is resolved in planning |

**A2 is actually VERIFIED** — confirmed in `1744934400000-InitialSchema.ts` lines 98–108. Removed from risk.

---

## Sources

### Primary (HIGH confidence)
- Project codebase (direct file reads): `apps/api/src/`, `apps/frontend/src/`, `apps/api/src/migrations/`, `package.json`
- `apps/api/src/migrations/1744934400000-InitialSchema.ts` — confirmed schema for `teams`, `seasons`, `sports` tables
- `apps/api/src/auth/` — established NestJS module pattern (controller, service, module, DTOs)
- `apps/frontend/src/app/auth/` — established Angular component pattern (Signals, inject(), standalone Ionic imports)
- `apps/frontend/src/app/app.config.ts` — confirmed `provideHttpClient(withInterceptors([authInterceptor]))` and `provideIonicAngular({})` wired
- `package.json` (root) — all dependency versions confirmed

### Secondary (MEDIUM confidence)
- [CITED: ionicframework.com/docs/api/tabs] — IonTabs/IonTabBar pattern
- [CITED: ionicframework.com/docs/api/alert] — AlertController API
- [CITED: angular.dev/guide/routing/read-route-state] — ActivatedRoute inject() pattern

### Tertiary (LOW confidence)
- None — all claims verified from codebase or official docs

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified in package.json
- Architecture: HIGH — patterns verified in existing codebase files
- Migration approach: HIGH — existing migration pattern verified in migrations directory
- Pitfalls: HIGH — derived from direct code reading of existing entities and migration SQL
- Test infrastructure: MEDIUM — framework confirmed, but no auth spec tests exist to validate the testing approach works end-to-end

**Research date:** 2026-04-16
**Valid until:** 2026-05-16 (stable framework versions; TypeORM 0.3 and Ionic 8 APIs stable)
