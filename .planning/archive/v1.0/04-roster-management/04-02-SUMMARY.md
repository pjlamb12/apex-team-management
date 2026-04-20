---
phase: "04"
plan: "02"
subsystem: api/players
tags: [nestjs, crud, dto, players, roster]
dependency_graph:
  requires: ["04-01-PLAN.md"]
  provides: ["PlayersController", "PlayersService", "CreatePlayerDto", "UpdatePlayerDto"]
  affects: ["apps/api/src/players/", "apps/api/src/entities/player.entity.ts"]
tech_stack:
  added: []
  patterns: ["@UseGuards(AuthGuard('jwt'))", "InjectRepository", "NotFoundException", "class-validator DTOs"]
key_files:
  created:
    - apps/api/src/players/players.controller.ts
    - apps/api/src/players/players.service.ts
    - apps/api/src/players/dto/create-player.dto.ts
    - apps/api/src/players/dto/update-player.dto.ts
  modified:
    - apps/api/src/entities/player.entity.ts
decisions:
  - "Used AuthGuard('jwt') from @nestjs/passport consistent with TeamsController pattern"
  - "PlayersService throws NotFoundException for update/remove when player not found in team"
  - "findAllForTeam orders by jerseyNumber ASC then lastName ASC for deterministic roster display"
metrics:
  duration: "~8 minutes"
  completed: "2026-04-17T23:04:02Z"
  tasks_completed: 3
  files_created: 4
  files_modified: 1
---

# Phase 04 Plan 02: PlayersController, PlayersService, and DTOs Summary

PlayersController and PlayersService implementing full CRUD for `/teams/:teamId/players` with JWT auth guard, class-validator DTOs, and scoped player queries by teamId.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 04-02-01 | Create Player DTOs | cb1f593 | create-player.dto.ts, update-player.dto.ts, player.entity.ts |
| 04-02-02 | Implement PlayersService | 911aa2e | players.service.ts |
| 04-02-03 | Implement PlayersController | 9125cd1 | players.controller.ts |

## Verification

- `grep -q "parentEmail" apps/api/src/players/dto/create-player.dto.ts` — PASS
- `grep -q "findAllForTeam" apps/api/src/players/players.service.ts` — PASS
- `grep -q "@Controller('teams/:teamId/players')" apps/api/src/players/players.controller.ts` — PASS
- `npx nx lint api` — PASS (0 errors, 11 pre-existing warnings in teams.service.spec.ts)
- `npx tsc --noEmit` — PASS (0 errors)
- `npx nx run api:build` — FAIL (pre-existing infrastructure issue: missing @nestjs/microservices package, unrelated to this plan)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical Field] Added parentEmail column to PlayerEntity**
- **Found during:** Task 1
- **Issue:** CreatePlayerDto includes `parentEmail` field but PlayerEntity had no corresponding column, which would cause TypeORM save to silently discard the value
- **Fix:** Added `@Column({ nullable: true }) parentEmail: string` to PlayerEntity
- **Files modified:** apps/api/src/entities/player.entity.ts
- **Commit:** cb1f593

**2. [Rule 3 - Pre-existing build failure] `npx nx run api:build` fails due to missing @nestjs/microservices**
- **Found during:** Task 3 verification
- **Issue:** Build fails with `Can't resolve '@nestjs/microservices'` — this is a pre-existing infrastructure issue not caused by this plan
- **Verification used instead:** `npx tsc --noEmit` passes with 0 errors, confirming no DI/syntax errors in this plan's code
- **Scope:** Out of scope — pre-existing issue, logged as deferred

## Known Stubs

None — all fields are wired to real TypeORM operations.

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: missing-team-ownership-check | apps/api/src/players/players.controller.ts | Routes require JWT but do not verify the authenticated coach owns the teamId in the URL. A coach could access another coach's players by guessing a teamId. Ownership check should be added when authorization middleware is introduced. |

## Self-Check: PASSED

- apps/api/src/players/dto/create-player.dto.ts — FOUND
- apps/api/src/players/dto/update-player.dto.ts — FOUND
- apps/api/src/players/players.service.ts — FOUND
- apps/api/src/players/players.controller.ts — FOUND
- Commits cb1f593, 911aa2e, 9125cd1 — FOUND
