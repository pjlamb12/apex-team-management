# Phase 5: Games & Lineup - Context

**Gathered:** 2026-04-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver the full game creation flow (opponent, location, date/time, uniform color) and the starting lineup editor (assign players to positions before a game). Games are accessed inside the Team Dashboard via an IonSegment tab strip alongside the Roster view.

Phase 5 does NOT include live game controls (swaps, event logging) — those are Phase 6. The lineup set here is the starting lineup only.

</domain>

<decisions>
## Implementation Decisions

### Season Handling
- **D-01:** Games in Phase 5 use an auto-created default season. When the coach creates their first game for a team and no active season exists, the backend automatically creates one — no UI prompt, no coach input required.
- **D-02:** The auto-created season is named by year (e.g., "2026 Season"). The backend derives the year from the current date at creation time. Creation logic lives entirely in the API — the frontend simply calls the game creation endpoint as normal.
- **D-03:** The `isActive: true` flag on SeasonEntity identifies the auto-created season. If an active season already exists for the team, use it; otherwise create a new one.

### Games Navigation
- **D-04:** Games are NOT a top-level bottom-nav tab (Phase 3's D-14 "Games tab" is superseded). Games live inside the Team Dashboard alongside Roster.
- **D-05:** Team Dashboard uses an `IonSegment` tab strip with two segments: **[Roster]** and **[Games]**. Tapping the segment switches the view inline — no separate sub-route navigation needed.
- **D-06:** The Games segment shows a list of games (upcoming + past) for the team, with a FAB or header button to create a new game.

### Game Entity — Missing Fields
- **D-07:** The current `GameEntity` only has `opponent` and `scheduledAt`. Phase 5 adds the missing fields via migration: `location` (varchar, nullable), `uniformColor` (varchar, nullable), and `status` (enum: `scheduled` | `in_progress` | `completed`, default `scheduled`).
- **D-08:** Games are scoped to a Season, not directly to a Team. The `GET /teams/:teamId/games` endpoint joins through Season to return all games for the team's active season.

### Lineup Storage Model
- **D-09:** A separate `lineup_entries` table stores the starting lineup: `id`, `game_id`, `player_id`, `position_name` (nullable for bench), `status` (`starting` | `bench`).
- **D-10:** Every available player is recorded — on-field players have a `positionName` and `status = 'starting'`; bench players have `positionName = null` and `status = 'bench'`. Phase 6 gets a complete player set from `lineup_entries` alone, no separate roster join needed for "who's available."
- **D-11:** The `LineupEntryEntity` is the Phase 6 swap target — a substitution replaces a 'starting' entry's player_id and logs a GameEvent. The table design intentionally supports this without changes.

### Lineup Assignment UX
- **D-12:** The lineup editor shows **N positional slots** (default 11 for soccer). Each slot is a row with two pickers: a **position-type picker** (GK, DEF, MID, FWD from the sport's positionTypes) and a **player picker** (available roster players). Both are independently selectable per slot.
- **D-13:** Per-slot flexibility — the coach can set 4 DEF + 1 FWD one game and 3 DEF + 2 FWD another. There is no fixed formation; each slot is assigned independently.
- **D-14:** Default slot count is **11** (hardcoded for Phase 5, soccer standard). Phase 6 or a future season management phase can wire up `playersOnField` from SeasonEntity dynamically.
- **D-15:** Bench section appears below the on-field slots. Players from the roster who are not assigned to an on-field slot are shown as bench automatically (or the coach can explicitly mark someone bench). Bench list shows jersey number and name.
- **D-16:** A player already assigned to a slot is removed from the available options in other slots' player pickers (no duplicate assignments).

### Claude's Discretion
- Game creation form UX: use a full-page route (`/teams/:id/games/new`) rather than a modal — game creation has more fields than player creation and deserves more screen real estate.
- Game list: show upcoming games first (sorted by scheduledAt ASC), then past games below. Group by upcoming/past with a divider.
- NestJS module structure: `apps/api/src/games/` with `GamesController`, `GamesService`, `LineupEntriesService`. Follow existing module patterns.
- Angular games feature: lazy-loaded under the shell. Route: `/teams/:id/games/new` and `/teams/:id/games/:gameId/lineup`.
- After game creation, navigate to the game's lineup editor so the coach can immediately set the starting lineup.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Spec
- `trd.md` — Full stack and library architecture. Section 3 (Library Architecture) defines where feature libs live.

### Planning Artifacts
- `.planning/ROADMAP.md` §Phase 5 — Success criteria (5 items) define the acceptance bar.
- `.planning/REQUIREMENTS.md` — GAME-01, GAME-02, GAME-03, GAME-04, LIVE-01, LIVE-02 are the requirements this phase satisfies.
- `.planning/PROJECT.md` — Constraints (Angular Signals, inject() pattern, no manual .subscribe(), Tailwind + Ionic, "Athletic Professional" design, sport-agnostic architecture).

### Prior Phase Artifacts
- `.planning/phases/01-workspace-data-foundation/01-CONTEXT.md` — D-10 (migrations only, synchronize: false), D-11 (entity location conventions).
- `.planning/phases/03-teams-sport-configuration/03-CONTEXT.md` — D-13/D-14 (IonTabs shell established, tabs appear per phase), D-12 (AlertController for destructive actions).
- `.planning/phases/04-roster-management/04-CONTEXT.md` — D-01 (Team Dashboard as team entry point), D-02 (IonModal for overlays), D-05 (jersey numbers not unique).

### Existing Entities
- `apps/api/src/entities/game.entity.ts` — Current GameEntity (needs location, uniformColor, status fields added via migration).
- `apps/api/src/entities/game-event.entity.ts` — GameEventEntity (Phase 6 target; Phase 5 creates the entity but does not write events).
- `apps/api/src/entities/season.entity.ts` — SeasonEntity (isActive field used for auto-selection).
- `apps/api/src/entities/player.entity.ts` — PlayerEntity (source for lineup player picker).

### Existing Frontend
- `apps/frontend/src/app/app.routes.ts` — Current routes; games sub-routes added under the shell.
- `apps/frontend/src/app/teams/team-dashboard/team-dashboard.ts` — Team Dashboard component; gains IonSegment for Roster/Games toggle.
- `apps/frontend/src/app/teams/players.service.ts` — Existing players service pattern to follow for games.service.ts.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `AlertController` — Already injected and used in `team-dashboard.ts` for delete confirmation. Same pattern for game deletion.
- `ModalController` + `IonModal` — Already proven in `team-dashboard.ts` for `PlayerModal`. Lineup editor uses a route not a modal, but modal pattern remains available.
- `AuthInterceptor` — Wired globally; all HTTP calls get auth headers automatically.
- `PlayersService` pattern — `signal<T[]>([])` + `loadXxx()` method + `inject(HttpClient)`. GamesService follows this exactly.

### Established Patterns
- **inject() pattern** — No constructor injection. `inject(Router)`, `inject(ActivatedRoute)`, etc.
- **Signals for UI state** — `signal<Game[]>([])`, `signal<boolean>(false)` for loading/error. No manual `.subscribe()`.
- **Standalone Ionic components** — Import each Ionic component directly in the `imports: []` array of the standalone `@Component`.
- **External templates** — `templateUrl` + `styleUrl` (not inline).
- **Protected class members** — All template-bound fields use `protected` access.
- **Lazy-loaded routes** — `loadComponent: () => import(...)` pattern throughout `app.routes.ts`.

### Integration Points
- `apps/frontend/src/app/teams/team-dashboard/team-dashboard.ts` — Add IonSegment + segment change handler. Load games data when Games segment is active.
- `apps/api/src/app/app.module.ts` — GamesModule registered here.
- `apps/api/src/migrations/` — New migration for GameEntity fields (location, uniformColor, status) and new lineup_entries table.

</code_context>

<specifics>
## Specific Ideas

- **Post-game-creation flow:** After the coach creates a game, immediately navigate to the lineup editor for that game. The coach just confirmed they're playing — it's the natural next step to set who's starting.
- **Slot flexibility insight:** The coach noted that formation varies by game (4 DEF one game, 1 FWD another). The per-slot position picker (D-12, D-13) handles this naturally — no formation template needed, each slot is independently configured.
- **Bench section:** Bench players visible at a glance below the on-field slots (D-15) directly satisfies LIVE-02 ("see who's on the field and who's on the bench").

</specifics>

<deferred>
## Deferred Ideas

- **Season management UI** — Named seasons, season switching, archiving past seasons. D-01 auto-creates one silently; a dedicated season management phase comes later.
- **Game format per game** — Coach mentioned wanting flexibility on player count per game (7v7 vs 11v11). D-14 hardcodes 11 for Phase 5; dynamic slot count tied to SeasonEntity.playersOnField is a future enhancement.
- **Top-level Games tab** — Phase 3 anticipated a Games tab in the bottom nav. Superseded by D-04 (games inside Team Dashboard). If the coach later wants a cross-team games view, a Games tab can be added.
- **Game status transitions UI** — Marking a game as "in_progress" or "completed" is a Phase 6 concern (when the Live Console is active). Phase 5 only creates `scheduled` games.

</deferred>

---

*Phase: 05-games-lineup*
*Context gathered: 2026-04-17*
