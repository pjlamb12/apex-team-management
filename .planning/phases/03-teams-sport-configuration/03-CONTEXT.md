# Phase 3: Teams & Sport Configuration - Context

**Gathered:** 2026-04-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver the full teams management flow: create a team (name + sport), view a list of teams, edit team details, and delete a team with confirmation. Sport selection auto-configures positions from the sports table. This phase also establishes the persistent bottom tab bar navigation shell that all future phases (Roster, Games, Live Console) will extend.

No roster, game, or lineup UI in this phase. After creating or selecting a team, the coach stays on the teams section — roster navigation starts in Phase 4.

A **data model correction** is included in this phase: `players_on_field`, `period_count`, and `period_length_minutes` are moved from `TeamEntity` to `SeasonEntity` via migration. Format settings belong to the season/tournament context, not the team itself.

</domain>

<decisions>
## Implementation Decisions

### Teams List & Route
- **D-01:** Create a `/teams` route as the post-login destination. The existing `/home` route can remain as a redirect to `/teams` or be replaced. Phase 2 CONTEXT already targets `/teams` for post-login redirect.
- **D-02:** Teams are displayed as cards on the `/teams` list page. Each card shows: team name, sport badge (e.g., "Soccer"), and [Edit] / [Delete] action buttons.
- **D-03:** A first-time coach (no teams yet) sees a friendly empty state: centered icon/illustration, message like "No teams yet — create your first team", and a prominent Create Team button. Not just a bare button.
- **D-04:** A [+ Create Team] button is always visible on the teams list page (e.g., in the header or as a FAB), not just on empty state.

### Sport Selector
- **D-05:** The Create Team form shows a real sport dropdown, pre-populated from the `sports` table, with Soccer pre-selected. Even though only Soccer is available in v1, the dropdown is rendered so future sports appear automatically when seeded.
- **D-06:** The team card shows a small sport badge (e.g., "Soccer"). The team detail/edit page shows "Sport: Soccer" as a read-only label (sport is not changeable after team creation).

### Team Create & Edit Form
- **D-07:** Team creation form collects **name and sport only**. No format fields on the create form.
- **D-08:** Team detail/edit page allows editing **name only**. Sport is shown read-only. No format fields exposed on the team itself.

### Team Format — Data Model Correction
- **D-09:** `players_on_field`, `period_count`, and `period_length_minutes` are **moved from `TeamEntity` to `SeasonEntity`** via a TypeORM migration in this phase. The same team (e.g., Thunder FC) may play in different leagues with different formats (11v11 in one, 7v7 in another) — format is a season/tournament concern, not a team concern.
- **D-10:** `TeamEntity` retains only: `id`, `name`, `sportId` / `sport` relation, `seasons` relation.
- **D-11:** `SeasonEntity` gains: `playersOnField` (integer), `periodCount` (integer), `periodLengthMinutes` (integer). These fields are set when a season is created (Phase deferred — no season management UI in Phase 3).

### Delete Confirmation
- **D-12:** Team deletion uses an Ionic `AlertController` dialog ("Are you sure you want to delete [team name]? This cannot be undone.") with Cancel and Delete (destructive) buttons. No separate page.

### App Navigation Shell
- **D-13:** Phase 3 establishes the persistent bottom tab bar (`IonTabs` + `IonTabBar`) that all future phases share. Teams tab is the first tab and is active.
- **D-14:** Only tabs for implemented features are visible. In Phase 3, only the **Teams tab** is shown. Roster, Games, and Console tabs appear when their respective phases are implemented — no disabled/greyed-out placeholder tabs.
- **D-15:** The nav shell wraps the authenticated routes. Unauthenticated routes (login, signup, reset-password) remain outside the shell.

### Claude's Discretion
- NestJS teams module structure: `apps/api/src/teams/` with `TeamsController`, `TeamsService`, `TeamEntity`. Follow existing `apps/api/src/auth/` pattern.
- Angular teams feature: lazy-loaded under the shell. Route structure: `/teams` (list), `/teams/new` (create form), `/teams/:id` (detail/edit).
- Sport dropdown: fetched from `GET /sports` on component init, loaded into a signal. Only enabled sports (`isEnabled: true`) shown.
- Ionic `IonAlert` via `AlertController` for delete confirmation — consistent with Ionic patterns already in use.
- After team creation, navigate to `/teams` (the list) — not to a team detail page.
- The shell component lives at `apps/frontend/src/app/shell/` and uses `IonTabs`. Auth guard applied at the shell route level.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Spec
- `trd.md` — Full stack and library architecture. Section 3 (Library Architecture: `libs/domain/type/name`) defines where feature libs live.

### Planning Artifacts
- `.planning/ROADMAP.md` §Phase 3 — Success criteria (4 items) define the acceptance bar.
- `.planning/REQUIREMENTS.md` — TEAM-01, TEAM-02, TEAM-04, TEAM-05 are the requirements this phase satisfies.
- `.planning/PROJECT.md` — Constraints (Angular Signals, inject() pattern, no manual .subscribe(), Tailwind + Ionic, "Athletic Professional" design, sport-agnostic architecture).

### Prior Phase Artifacts
- `.planning/phases/01-workspace-data-foundation/01-CONTEXT.md` — D-02 through D-04 (sport config data model, original team-level format fields — now overridden by D-09 above), D-10 (migrations only, synchronize: false), D-11 (entity location conventions).
- `.planning/phases/02-authentication/02-CONTEXT.md` — D-06 (auth page design), route/guard patterns, Ionic component usage.

### Existing Code
- `apps/api/src/entities/team.entity.ts` — Current TeamEntity (has players_on_field, period_count, period_length_minutes — to be removed in this phase's migration).
- `apps/api/src/entities/sport.entity.ts` — SportEntity (id, name, positionTypes JSONB, isEnabled).
- `apps/api/src/entities/season.entity.ts` — SeasonEntity (gains format fields in this phase's migration).
- `apps/frontend/src/app/app.routes.ts` — Current routes. Shell wraps authenticated routes here.
- `apps/frontend/src/app/home/home.ts` — Existing home placeholder (to be replaced by /teams route).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `apps/frontend/src/app/auth/auth.service.ts` — Auth state signal. `authGuard` already wraps `/home`. Shell route replaces `/home` as the guard entry point.
- `apps/frontend/src/app/auth/auth.interceptor.ts` — HTTP interceptor already wired. Teams API calls get auth headers automatically.
- Ionic components already imported standalone-style in `home.ts` — same pattern for teams components (`IonCard`, `IonList`, `IonButton`, `IonFab`, `IonAlert`, `IonTabs`, `IonTabBar`, `IonTabButton`, `IonIcon`).

### Established Patterns
- **Lazy-loaded routes** — `loadComponent: () => import(...)` pattern from `app.routes.ts`. Teams sub-routes follow the same pattern.
- **inject() pattern** — No constructor injection. `inject(AuthService)` style throughout.
- **Signals for UI state** — `signal<Team[]>([])`, `signal<boolean>(false)` for loading/error states. No manual `.subscribe()`.
- **External templates** — `templateUrl` + `styleUrl` (not inline). All new components follow this.
- **Protected class members** — Template-bound fields use `protected` access modifier.
- **Ionic + Tailwind** — Ionic for Shadow DOM components, Tailwind for layout/spacing.

### Integration Points
- `apps/frontend/src/app/app.routes.ts` — Shell route added here with auth guard. Teams sub-routes nested inside.
- `apps/api/src/app/app.module.ts` — TeamsModule registered here.
- `apps/api/src/migrations/` — New migration file for format field move (teams → seasons).

</code_context>

<specifics>
## Specific Ideas

- **Format fields on season, not team:** The coach's insight is that Thunder FC might play 11v11 in one league and 7v7 in a rec tournament. Season/tournament is where format lives. Phase 3 corrects the data model now before roster and games depend on the wrong structure.
- **Sport dropdown future-proof:** Even though only Soccer exists in v1, the dropdown loads from `GET /sports` dynamically. When basketball or volleyball seeds are added later, the dropdown just works.
- **Shell in Phase 3:** Building the tab bar now avoids a messy retrofit in Phase 4 when roster needs its own tab. The shell is deliberately minimal — Teams tab only. Future phases add their tab as part of their own implementation.

</specifics>

<deferred>
## Deferred Ideas

- **Season management UI** — Creating/editing seasons (where format fields like players_on_field live) is deferred. Phase 3 migrates the fields to SeasonEntity but no UI for seasons yet.
- **Team color/branding** — A team color or jersey color on the team record (useful for the live console). Deferred — not needed until Phase 6.
- **Sport management UI** — Admin interface to add/edit sports. Out of scope for v1 (sports are seed data only).

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 03-teams-sport-configuration*
*Context gathered: 2026-04-16*
