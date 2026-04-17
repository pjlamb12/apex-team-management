---
phase: 03-teams-sport-configuration
plan: "03"
subsystem: api-database
tags: [migration, typeorm, postgresql, entities, schema]
dependency_graph:
  requires: []
  provides: [teams-coach-fk, seasons-format-columns, team-entity-updated, season-entity-updated]
  affects: [03-04-teams-api, 03-05-create-team-ui, 03-06-team-list-ui]
tech_stack:
  added: []
  patterns: [two-step-nullable-column-pattern, typeorm-migration]
key_files:
  created:
    - apps/api/src/migrations/1745020800000-MoveFormatFieldsToSeasons.ts
  modified:
    - apps/api/src/entities/team.entity.ts
    - apps/api/src/entities/season.entity.ts
decisions:
  - "coach_id nullable at DB level for migration safety; TeamsService enforces ownership from JWT"
  - "Format fields moved to seasons as nullable integers (season creation UI deferred)"
metrics:
  duration: "~10 minutes"
  completed: "2026-04-17"
  tasks_completed: 2
  tasks_total: 2
  files_created: 1
  files_modified: 2
---

# Phase 03 Plan 03: DB Schema Migration — Move Format Fields to Seasons Summary

**One-liner:** TypeORM migration adds coach_id FK to teams and moves 3 format columns from teams to seasons as nullable integers, confirmed applied to live PostgreSQL database.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Write migration and update entity files | 843fb4e | apps/api/src/migrations/1745020800000-MoveFormatFieldsToSeasons.ts, apps/api/src/entities/team.entity.ts, apps/api/src/entities/season.entity.ts |
| 2 | Run migration against PostgreSQL | (operational — no new files) | DB schema updated via TypeORM CLI |

## What Was Built

### Migration: MoveFormatFieldsToSeasons1745020800000

Three-step migration:
1. Adds `players_on_field`, `period_count`, `period_length_minutes` as nullable integers to `seasons`
2. Adds `coach_id` uuid column to `teams` with FK constraint referencing `users(id) ON DELETE CASCADE`
3. Drops `players_on_field`, `period_count`, `period_length_minutes` from `teams`

The `down()` method fully reverses all changes using `DROP COLUMN IF EXISTS`.

### TeamEntity Updates

- Removed: `playersOnField`, `periodCount`, `periodLengthMinutes` columns
- Added: `coachId` (nullable uuid) and `coach` (`ManyToOne(() => UserEntity)` with `@JoinColumn({ name: 'coach_id' })`)
- Added: `import { UserEntity } from './user.entity'`

### SeasonEntity Updates

- Added: `playersOnField` (`integer | null`, nullable)
- Added: `periodCount` (`integer | null`, nullable)
- Added: `periodLengthMinutes` (`integer | null`, nullable)

## DB Schema Verification

`\d teams` confirmed:
- Columns: `id`, `name`, `sport_id`, `coach_id`
- FK constraint: `FK_teams_coach FOREIGN KEY (coach_id) REFERENCES users(id) ON DELETE CASCADE`
- No format columns present

`\d seasons` confirmed:
- New columns: `players_on_field integer`, `period_count integer`, `period_length_minutes integer` (all nullable)

Migration history (migrations table): `MoveFormatFieldsToSeasons1745020800000` recorded as entry 3.

## Deviations from Plan

None — plan executed exactly as written.

## Threat Model Coverage

| Threat ID | Disposition | Implementation |
|-----------|-------------|----------------|
| T-03-03-01 | mitigate | `coach_id` FK references `users(id)`; nullable at DB level for migration safety; TeamsService will enforce coachId from JWT (Plan 04) |
| T-03-03-02 | accept | Migration SQL is hardcoded DDL with no user input — no injection risk |
| T-03-03-03 | mitigate | `findAllByCoach` filter by coachId and IDOR ownership check implemented in Plan 04 |

## Known Stubs

None — this plan is pure DB/entity work with no UI rendering.

## Self-Check: PASSED

- apps/api/src/migrations/1745020800000-MoveFormatFieldsToSeasons.ts: FOUND
- apps/api/src/entities/team.entity.ts contains coachId: FOUND
- apps/api/src/entities/season.entity.ts contains playersOnField: FOUND
- Migration commit 843fb4e: FOUND
- DB schema verified via psql: teams has coach_id, seasons has format columns
