---
phase: 01-workspace-data-foundation
plan: 03
subsystem: api-database
tags: [typeorm, migration, postgresql, seed-data]
dependency_graph:
  requires: ["01-02"]
  provides: ["database-schema", "soccer-seed"]
  affects: ["apps/api/src/migrations/"]
tech_stack:
  added: ["ts-node@10.x"]
  patterns: ["TypeORM migration file", "Soccer seed via INSERT ON CONFLICT DO NOTHING"]
key_files:
  created:
    - apps/api/src/migrations/1744934400000-InitialSchema.ts
  modified: []
decisions:
  - "Used port 5434 for worktree postgres container (port 5433 occupied by circuit-breaker-db)"
  - "TS_NODE_PROJECT=apps/api/tsconfig.app.json required for migration CLI to resolve entity imports"
  - "ts-node installed as dev dependency — required by typeorm-ts-node-commonjs runner"
metrics:
  duration: "~15 minutes"
  completed: "2026-04-15"
  tasks_completed: 2
  files_created: 1
  files_modified: 0
---

# Phase 01 Plan 03: Initial TypeORM Migration Summary

**One-liner:** Handwritten TypeORM migration creating all 7 database tables with Soccer sport seed via idempotent INSERT ON CONFLICT DO NOTHING.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Write initial schema migration file | bb86788 | apps/api/src/migrations/1744934400000-InitialSchema.ts |
| 2 | Start database container and run migration | f858cc5 | package.json, package-lock.json |

## What Was Built

The `1744934400000-InitialSchema.ts` migration file creates the complete Phase 1 database schema:

**Tables created (in FK dependency order):**
1. `sports` — sport configuration with `position_types` JSONB
2. `users` — user accounts with email uniqueness constraint
3. `teams` — teams with sport FK and game configuration defaults
4. `players` — players belonging to a team
5. `seasons` — seasons scoped to a team
6. `games` — games scoped to a season
7. `game_events` — events scoped to a game

**Soccer seed (D-04):** Inserted in `up()` with `ON CONFLICT (name) DO NOTHING` for idempotency:
- name: "Soccer"
- position_types: `["Goalkeeper", "Defender", "Midfielder", "Forward"]`
- No field size or period type (stored at team level per D-02/D-03)

**down()** drops all 7 tables in reverse FK order (game_events → games → seasons → players → teams → users → sports).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] ts-node missing for migration CLI**
- **Found during:** Task 2
- **Issue:** `typeorm-ts-node-commonjs` requires `ts-node` which was not installed
- **Fix:** `npm install --save-dev ts-node`
- **Files modified:** package.json, package-lock.json
- **Commit:** f858cc5

**2. [Rule 3 - Blocking] Port 5433 occupied by circuit-breaker-db container**
- **Found during:** Task 2
- **Issue:** `docker-compose up -d postgres` failed — port 5433 already bound by another project's container
- **Fix:** Started a dedicated `apex-team-db-worktree` container on port 5434 via `docker run`; updated apps/api/.env to DB_PORT=5434
- **Note:** .env is gitignored (correct); the worktree container is ephemeral. The main project docker-compose.yml uses port 5433 as intended.

**3. [Rule 3 - Blocking] Migration CLI could not resolve entity imports via nx target**
- **Found during:** Task 2
- **Issue:** `npx nx run api:migration:run` failed because ts-node could not find entity modules without the tsconfig specifying `apps/api/src` root
- **Fix:** Ran migration directly with `TS_NODE_PROJECT=apps/api/tsconfig.app.json npx typeorm-ts-node-commonjs migration:run -d apps/api/src/data-source.ts`
- **Note:** The `nx run api:migration:run` target in project.json should be updated to pass `TS_NODE_PROJECT` for future use, but that is out of scope for this plan.

## Verification Results

```
\dt output: 8 relations (7 app tables + migrations tracking table)
SELECT name, position_types FROM sports:
  Soccer | ["Goalkeeper", "Defender", "Midfielder", "Forward"]
SELECT count(*) FROM sports WHERE name='Soccer': 1
```

All success criteria met:
- Migration file exists in `apps/api/src/migrations/` with timestamp prefix
- `up()` creates all 7 tables in FK dependency order
- `up()` inserts Soccer sport with 4 position types using ON CONFLICT DO NOTHING
- `down()` drops all 7 tables in reverse FK dependency order
- Migration executed without error against the running database
- Soccer row confirmed in sports table

## Known Stubs

None.

## Threat Flags

None — migration SQL is static (no user input), credentials in gitignored .env, synchronize: false enforced (T-03-02 mitigated by Plan 02).

## Self-Check: PASSED

- apps/api/src/migrations/1744934400000-InitialSchema.ts: FOUND
- Commit bb86788: FOUND
- Commit f858cc5: FOUND
- Soccer row in database: CONFIRMED (count=1)
