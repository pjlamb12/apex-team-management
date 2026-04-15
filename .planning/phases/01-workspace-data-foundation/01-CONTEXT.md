# Phase 1: Workspace & Data Foundation - Context

**Gathered:** 2026-04-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Establish the Nx monorepo library structure, shared TypeScript models, NestJS API app, PostgreSQL database with TypeORM (migration files), Tailwind CSS + Ionic integration, and seed soccer sport configuration.

No user-facing flows in this phase. This phase builds the technical skeleton — shared types, database schema, theme infrastructure — that all subsequent phases depend on.

</domain>

<decisions>
## Implementation Decisions

### Library Scaffolding Scope
- **D-01:** Create only the libs Phase 1 requires: `libs/shared/util/models` and `libs/client/ui/theme`. All other libs from the TRD (`api/feature/*`, `api/data-access/*`, `client/feature/*`) are created by the phase that first needs them, not pre-scaffolded here.

### Sport Configuration Data Model
- **D-02:** The `Sport` entity stores position types (named zones) only: Goalkeeper, Defender, Midfielder, Forward. Field size and period structure are **team-level settings**, not sport-level settings — a coach may have two soccer teams with different formats (7v7 vs 11v11, 4 quarters vs 2 halves).
- **D-03:** The `Team` entity stores: `players_on_field` (integer), `period_count` (integer), `period_length_minutes` (integer). These override any sport defaults.
- **D-04:** Soccer seed data: sport name "Soccer", position types: ["Goalkeeper", "Defender", "Midfielder", "Forward"]. No field size or period type in the sport record.

### Season Data Model
- **D-05:** A `Season` entity is included in Phase 1's shared TypeScript models and database schema. Season management UI is deferred — Phase 1 only defines the entity and its relationships.
- **D-06:** Relationship: `Team` has many `Seasons`. `Season` has many `Games`. Players can have season-specific statuses (active/inactive per season). This allows a team to persist across seasons while roster and game history are season-scoped.

### Dark Mode & Theme
- **D-07:** Theme defaults to OS preference (`prefers-color-scheme`) on first load. A manual toggle is available and persists the user's preference (e.g., localStorage).
- **D-08:** `ThemeService` lives in `libs/client/ui/theme`. It manages a Signal for the current theme and applies/removes the `.dark` class on `<html>`. This is the canonical theme authority for the whole app.
- **D-09:** Dark mode uses Tailwind's class-based strategy (`darkMode: 'class'` in tailwind.config). Ionic components use CSS custom property overrides scoped under `.dark`.

### TypeORM Migration Strategy
- **D-10:** `synchronize: false` in all environments from day one. All schema changes go through TypeORM migration files. This is non-negotiable — matches the roadmap success criteria ("migrations running").
- **D-11:** TypeORM `@Entity` decorators belong in `libs/api/data-access/*` libs, created per-phase as those libs are scaffolded. Phase 1 defines shared TypeScript interfaces (no `@Entity` decorators) — these live in `libs/shared/util/models`. The NestJS API app in Phase 1 will have its own `src/entities/` as a temporary home for the initial schema until data-access libs are created.

### Claude's Discretion
- NestJS configuration: use `@nestjs/config` with `.env` files for database connection strings and app port. The TRD mentions `runtime-config-loader` but that's a runtime env concern for production deployment, not dev config.
- TypeORM datasource configuration file location (`src/data-source.ts`) — standard NestJS convention.
- Nx boundary tag schema (`scope:shared`, `scope:api`, `scope:client`, `type:util`, `type:feature`, `type:ui`) — follow TRD naming.
- Vitest is the test runner (already in scaffold), not Jest as listed in TRD. TRD is overridden by existing scaffold.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Specification
- `trd.md` — Technical Requirements Document. Defines the full stack, library architecture (`libs/domain/type/name`), and feature roadmap. Section 3 (Library Architecture) is directly relevant to Phase 1.

### Planning Artifacts
- `.planning/ROADMAP.md` §Phase 1 — Success criteria (5 items) define the acceptance bar for this phase.
- `.planning/REQUIREMENTS.md` — INFR-01, INFR-02, TEAM-03 are the requirements this phase satisfies.
- `.planning/PROJECT.md` — Constraints section lists the full stack and architectural non-negotiables.

### Codebase Maps
- `.planning/codebase/STACK.md` — Current state: Angular 21 scaffold, no libs/, no backend, no Tailwind. What Phase 1 starts from.
- `.planning/codebase/STRUCTURE.md` — Existing directory layout and what's missing per TRD.
- `.planning/codebase/CONVENTIONS.md` — Angular 21 conventions already established (standalone components, no `.component.ts` suffix, etc.).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `apps/frontend/src/app/app.config.ts` — ApplicationConfig pattern already established. ThemeService will be provided here.
- `apps/frontend/src/styles.scss` — Global stylesheet. Tailwind directives (`@tailwind base/components/utilities`) and Ionic imports go here.

### Established Patterns
- **Standalone components** — Angular 21 default, no NgModules. All new components follow this.
- **External templates** — `templateUrl` + `styleUrl`, not inline. Keep this pattern.
- **`protected` class members** — Template-bound fields use `protected` access.
- **Vitest** — Already configured via `@angular/build:unit-test`. New libs follow this test setup.
- **ESLint flat config** — `eslint.config.mjs` at root and app level. New libs get their own lint configs.

### Integration Points
- `apps/frontend/src/app/app.config.ts` — Where `provideIonicAngular()`, `ThemeService`, and eventual `provideHttpClient()` get registered.
- `apps/frontend/src/styles.scss` — Tailwind entry point and Ionic theme variables.
- `tsconfig.base.json` — Path aliases (currently empty `paths: {}`) will be populated when libs are created (e.g., `@apex-team/shared/models`).
- `nx.json` — Tag enforcement rules for module boundary constraints.

</code_context>

<specifics>
## Specific Ideas

- **Season scope:** A team persists across seasons, but roster and games are season-scoped. The coach's "active season" is how they navigate — switching season changes which players/games are shown.
- **Position naming:** Use display-friendly zone names ("Goalkeeper", "Defender", "Midfielder", "Forward") not abbreviated codes. Coaches and parents read these labels.
- **Sport config as seed, not UI:** No sport management UI in v1. Soccer config is a database seed that ships with the app. Future sports (basketball, volleyball) are added via new seed files.

</specifics>

<deferred>
## Deferred Ideas

- **Season management UI** — Creating/editing seasons, archiving past seasons, switching active season. Model is defined in Phase 1; UI is a future phase.
- **Tournament entity** — User mentioned tournaments alongside seasons. Similar concept (scoped set of games). Note for the season management phase to consider tournaments as a Season subtype or variant.
- **runtime-config-loader** — TRD mentions this for runtime environment variables. Deferred to PWA/production phase (Phase 7) when deployment config matters.
- **Additional sport seeds** — Basketball and volleyball configs per TRD. Architecture supports them; only soccer is seeded in v1.

</deferred>

---

*Phase: 01-workspace-data-foundation*
*Context gathered: 2026-04-14*
