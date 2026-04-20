# Phase 1: Workspace & Data Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-14
**Phase:** 01-workspace-data-foundation
**Areas discussed:** Library scaffolding scope, Soccer sport config data, Tailwind + Ionic dark mode setup, TypeORM migrations strategy

---

## Library Scaffolding Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Only what Phase 1 needs | Create libs/shared/util/models and libs/client/ui/theme now. Each subsequent phase creates its own libs. | ✓ |
| All libs upfront | Create all 10 TRD libs as empty shells with Nx boundary tags. | |
| Shared + API libs only | Create shared and api structure now, client libs per-phase. | |

**User's choice:** Only what Phase 1 needs
**Notes:** Keeps Phase 1 focused, avoids creating empty placeholder directories. Other libs are created by the phase that first needs them.

---

## Soccer Sport Config Data

### Position detail level

| Option | Description | Selected |
|--------|-------------|----------|
| Named zones only | GK, Defender, Midfielder, Forward — 4 zone types, flexible for any formation. | ✓ |
| Specific named positions | 10-11 distinct named positions (LB, RB, CB, CDM, etc.) | |
| Formation-based slots | Numbered slots with a default formation grid | |

**User's choice:** Named zones only

### Game structure ownership

| Option | Description | Selected |
|--------|-------------|----------|
| 2 halves, 11 players | Standard adult soccer config at sport level | |
| 2 halves, configurable players | Period type in sport, field size configurable | |
| 4 quarters, 11 players | Youth quarter-based leagues | |

**User's choice:** N/A — user corrected the framing: field size and period structure belong at Team level, not Sport level. A coach may have two soccer teams with different formats.

### Team-level game structure fields

| Option | Description | Selected |
|--------|-------------|----------|
| players_on_field + period type/length | Team stores: players_on_field, period_count, period_length_minutes | ✓ |
| Just players on field | Only field size on Team, periods handled at game creation | |
| Free-form game format | Text field on Team describing format | |

**User's choice:** players_on_field + period type/length
**Notes:** Covers any youth or adult configuration (7v7, 9v9, 11v11; halves or quarters).

---

## Season Data Model (surfaced during soccer config discussion)

**Context:** User raised that a team persists across multiple seasons/tournaments, affecting roster and game history. This wasn't in the original scope — evaluated as a foundational data model decision.

| Option | Description | Selected |
|--------|-------------|----------|
| Model it now, UI later | Add Season entity to Phase 1 data model; season management UI deferred. | ✓ |
| Defer entirely | Add Season when season management phase is planned. Risk: migration headache. | |
| Minimal — season field on Team | Just a current_season string/date on Team, not a full entity. | |

**User's choice:** Model it now, UI later

### Season relationship structure

| Option | Description | Selected |
|--------|-------------|----------|
| Team → Seasons → Games | Season has many Games; players have season-specific statuses. | ✓ |
| Team → Seasons + Games independent | Games optionally reference a Season. | |
| Game → Season only | Season as a tag/label on Game, no Season entity. | |

**User's choice:** Team → Seasons → Games

---

## Tailwind + Ionic Dark Mode Setup

### Dark mode default behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Follow OS preference | Check prefers-color-scheme on first load. Manual toggle available. | ✓ |
| Always start dark | Dark by default regardless of OS. | |
| Always start light | Default to light, coach switches manually. | |

**User's choice:** Follow OS preference with a toggle

### ThemeService location

| Option | Description | Selected |
|--------|-------------|----------|
| libs/client/ui/theme service | ThemeService in the ui/theme lib, manages Signal, applies .dark to html. | ✓ |
| App-level only for now | Put in apps/frontend for Phase 1, move to lib later. | |
| Angular CDK or Ionic mechanism | Use Ionic's built-in color scheme API or CDK MediaMatcher. | |

**User's choice:** libs/client/ui/theme service

---

## TypeORM Migration Strategy

### Schema management approach

| Option | Description | Selected |
|--------|-------------|----------|
| Migration files from day one | synchronize: false everywhere. All changes via migration files. | ✓ |
| synchronize: true in dev | Auto-sync in dev, migrations for prod deploys. | |
| synchronize: true until Phase 6 | Use auto-sync throughout, generate baseline before PWA builds. | |

**User's choice:** Migration files from day one

### Entity location in Nx structure

| Option | Description | Selected |
|--------|-------------|----------|
| libs/api/data-access/* when created | Entities in domain libs per-phase; Phase 1 uses apps/api/src/entities/ temporarily. | ✓ |
| apps/api/src/entities in Phase 1 | All entities in API app for Phase 1; migrate to libs later. | |
| libs/api/data-access/core in Phase 1 | Create one core data-access lib in Phase 1 for all entities. | |

**User's choice:** libs/api/data-access/* when those libs are created

---

## Claude's Discretion

- NestJS `@nestjs/config` + `.env` files for DB config (runtime-config-loader deferred to Phase 7)
- TypeORM datasource at `src/data-source.ts` (standard convention)
- Nx tag schema following TRD naming conventions
- Vitest as test runner (overrides TRD's Jest — scaffold already established this)

## Deferred Ideas

- Season management UI (model defined in Phase 1, UI is a future phase)
- Tournament entity as a Season variant
- `runtime-config-loader` for runtime environment variables (Phase 7)
- Basketball and volleyball sport config seeds (architecture supports, v1 soccer only)
