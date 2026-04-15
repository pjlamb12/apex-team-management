---
phase: 01-workspace-data-foundation
plan: 02
subsystem: api, database
tags: [nestjs, typeorm, postgres, typeorm-migrations, docker-compose, reflect-metadata]

# Dependency graph
requires:
  - phase: 01-01
    provides: Nx monorepo scaffold with apps/api directory structure
provides:
  - NestJS API app at apps/api/ with health check endpoint
  - TypeORM configured with synchronize:false, autoLoadEntities:true
  - 7 TypeORM entity files in apps/api/src/entities/ (SportEntity, UserEntity, TeamEntity, PlayerEntity, SeasonEntity, GameEntity, GameEventEntity)
  - Standalone data-source.ts for TypeORM CLI migrations
  - Migration targets (migration:generate, migration:run, migration:revert) in apps/api/project.json
  - PostgreSQL docker-compose.yml on port 5433
  - apps/api/.env.example committed; apps/api/.env gitignored
affects:
  - 01-03 (migrations phase — depends on data-source.ts, entities, and docker-compose.yml)
  - All subsequent API phases (entities define the schema)

# Tech tracking
tech-stack:
  added:
    - "@nestjs/core 11.x — NestJS framework core"
    - "@nestjs/common — NestJS common utilities"
    - "@nestjs/platform-express — Express HTTP adapter"
    - "@nestjs/config — ConfigService for .env management"
    - "@nestjs/typeorm — NestJS TypeORM integration"
    - "typeorm 0.3.x — ORM for PostgreSQL"
    - "pg — PostgreSQL driver"
    - "reflect-metadata — Decorator metadata polyfill"
    - "@nx/nest — Nx generator plugin for NestJS apps"
    - "@types/pg — TypeScript types for pg driver"
  patterns:
    - "TypeOrmModule.forRootAsync with ConfigService (not hardcoded config)"
    - "autoLoadEntities:true to avoid Nx/Webpack glob resolution issues (Pitfall 1)"
    - "synchronize:false in all TypeORM configs (D-10)"
    - "data-source.ts reads dotenv directly (CLI-only, no DI)"
    - "Explicit entity class imports in data-source.ts (not globs)"
    - "Entity class suffix (SportEntity not Sport) to distinguish from shared interfaces"
    - "typeorm-ts-node-commonjs CLI entry point (apps/api uses CommonJS module format)"

key-files:
  created:
    - apps/api/src/main.ts
    - apps/api/src/app/app.module.ts
    - apps/api/src/app/app.controller.ts
    - apps/api/src/data-source.ts
    - apps/api/src/entities/sport.entity.ts
    - apps/api/src/entities/user.entity.ts
    - apps/api/src/entities/team.entity.ts
    - apps/api/src/entities/player.entity.ts
    - apps/api/src/entities/season.entity.ts
    - apps/api/src/entities/game.entity.ts
    - apps/api/src/entities/game-event.entity.ts
    - apps/api/project.json
    - docker-compose.yml
    - apps/api/.env.example
  modified:
    - .gitignore (added apps/api/.env)
    - package.json (added NestJS + TypeORM + pg + reflect-metadata dependencies)

key-decisions:
  - "Used typeorm-ts-node-commonjs (not typeorm-ts-node-esm) because apps/api/tsconfig.app.json uses module:commonjs"
  - "app.module.ts and app.controller.ts live in apps/api/src/app/ (Nx @nx/nest:app generator creates this structure)"
  - "migrations path in AppModule adjusted to __dirname + '/../migrations/**' to account for app/ subdirectory"
  - "Entity suffix naming: SportEntity not Sport (D-11 — distinguishes TypeORM entities from shared interfaces)"

patterns-established:
  - "NestJS bootstrap: import 'reflect-metadata' must be first line of main.ts"
  - "TypeORM entity: @PrimaryGeneratedColumn('uuid'), snake_case column names via name: option, Entity suffix class names"
  - "TypeORM DataSource: reads dotenv directly, explicit entity imports (no globs)"
  - "Docker port mapping: 5433 host -> 5432 container to avoid conflict with existing postgres on 5432"

requirements-completed: [INFR-01, TEAM-03]

# Metrics
duration: 15min
completed: 2026-04-15
---

# Phase 01 Plan 02: NestJS API with TypeORM entities and PostgreSQL docker-compose

**NestJS API app scaffolded with TypeORM (synchronize:false), 7 entity files (SportEntity through GameEventEntity), standalone data-source.ts for migrations CLI, and postgres:16-alpine on port 5433**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-04-15T00:00:00Z
- **Completed:** 2026-04-15
- **Tasks:** 2
- **Files modified:** 16

## Accomplishments

- NestJS API app generated at apps/api/ with health check endpoint at GET /health
- TypeORM configured with autoLoadEntities:true and synchronize:false (D-10) wired to ConfigService reading from .env
- All 7 entity files created with proper Entity suffix naming convention and snake_case column names
- Standalone data-source.ts created for TypeORM CLI with explicit entity class imports (not globs, Pitfall 1)
- Migration targets (commonjs format) added to apps/api/project.json
- docker-compose.yml with postgres:16-alpine on port 5433 (avoids conflict with existing postgres on 5432)
- apps/api/.env gitignored; .env.example committed (T-02-01 mitigation)

## Task Commits

Each task was committed atomically:

1. **Task 1: Generate NestJS API app and install backend packages** - `206ebb1` (feat)
2. **Task 2: Create all 7 TypeORM entity files and data-source.ts** - `194242e` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified

- `apps/api/src/main.ts` - NestJS bootstrap with reflect-metadata as first import
- `apps/api/src/app/app.module.ts` - Root module with ConfigModule (global) and TypeOrmModule.forRootAsync
- `apps/api/src/app/app.controller.ts` - Health check endpoint GET /health
- `apps/api/src/data-source.ts` - Standalone TypeORM DataSource for CLI; reads dotenv directly; explicit entity imports
- `apps/api/src/entities/sport.entity.ts` - Sports table; positionTypes JSONB column; isEnabled
- `apps/api/src/entities/user.entity.ts` - Users table; email unique; displayName; createdAt
- `apps/api/src/entities/team.entity.ts` - Teams table; sportId FK; playersOnField, periodCount, periodLengthMinutes (D-03)
- `apps/api/src/entities/player.entity.ts` - Players table; teamId FK; firstName, lastName, jerseyNumber, preferredPosition
- `apps/api/src/entities/season.entity.ts` - Seasons table; teamId FK; name, startDate, endDate, isActive (D-06)
- `apps/api/src/entities/game.entity.ts` - Games table; seasonId FK; opponent, scheduledAt (D-06)
- `apps/api/src/entities/game-event.entity.ts` - Game_events table; gameId FK; eventType, minuteOccurred, payload JSONB
- `apps/api/project.json` - Added migration:generate, migration:run, migration:revert targets (commonjs)
- `docker-compose.yml` - postgres:16-alpine container named apex-team-db, port 5433:5432
- `apps/api/.env` - Local dev credentials (gitignored)
- `apps/api/.env.example` - Committed template with placeholder values
- `.gitignore` - Added apps/api/.env entry (T-02-01 threat mitigation)

## Decisions Made

- **typeorm-ts-node-commonjs** chosen over typeorm-ts-node-esm because apps/api/tsconfig.app.json uses `"module": "commonjs"` (verified after generation per RESEARCH.md Open Question A1)
- **Nx generator structure respected**: @nx/nest:app generates app.module.ts and app.controller.ts in `apps/api/src/app/` subdirectory (not src/ root). The migrations path in app.module.ts was adjusted from `__dirname + '/migrations/**'` to `__dirname + '/../migrations/**'` to account for this.
- **Entity suffix naming enforced** (SportEntity not Sport) per D-11 to distinguish TypeORM entities from shared interfaces in libs/shared/util/models

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Adjusted migrations path in app.module.ts for Nx generator subdirectory structure**
- **Found during:** Task 1 (app.module.ts creation)
- **Issue:** Plan specified files at apps/api/src/app.module.ts but @nx/nest:app generator creates them in apps/api/src/app/app.module.ts. The migrations path `__dirname + '/migrations/**'` would point to `apps/api/src/app/migrations/` (wrong location)
- **Fix:** Changed migrations path to `__dirname + '/../migrations/**/*{.ts,.js}'` so it resolves to `apps/api/src/migrations/` from the app/ subdirectory
- **Files modified:** apps/api/src/app/app.module.ts
- **Verification:** `npx nx build api` succeeds without TypeScript errors
- **Committed in:** 206ebb1 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** Structural fix required by Nx generator convention. No scope creep. Plan goal fully achieved.

## Issues Encountered

- `@nx/nest` was not installed initially — installed as dev dependency before generator could run. Build succeeded without errors after installation.

## User Setup Required

None - no external service configuration required for this plan. Docker container is started in Plan 03 before migrations run.

## Next Phase Readiness

- Plan 03 (migrations) can proceed: docker-compose.yml is ready, data-source.ts is ready, all entity files exist
- `docker-compose up -d` starts the postgres container on port 5433
- `npx nx run api:migration:generate --args="--name=InitialSchema"` generates the first migration
- `npx nx run api:migration:run` applies migrations against the running database

---
## Self-Check: PASSED

All 14 expected files found. Both task commits verified in git log (206ebb1, 194242e).

*Phase: 01-workspace-data-foundation*
*Completed: 2026-04-15*
