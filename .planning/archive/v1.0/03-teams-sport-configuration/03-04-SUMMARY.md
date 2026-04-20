---
phase: 03-teams-sport-configuration
plan: "04"
subsystem: api-teams-sports
tags: [nestjs, teams, sports, crud, jwt, typeorm]

dependency_graph:
  requires:
    - 03-01 (TeamsService and SportsService test contracts)
    - 03-03 (TeamEntity with coachId column, SportEntity)
  provides:
    - TeamsModule: 5 CRUD endpoints with JWT guard
    - SportsModule: GET /sports filtered to isEnabled=true
    - AppModule: TeamsModule and SportsModule registered
  affects:
    - 03-05 (Angular create-team UI — POST /api/teams)
    - 03-06 (Angular team-list UI — GET /api/teams)

tech-stack:
  added: []
  patterns:
    - "NestJS Module pattern: TypeOrmModule.forFeature + controllers + providers"
    - "JWT guard at class level via @UseGuards(AuthGuard('jwt')) before @Controller"
    - "coachId injected from JWT req.user.sub — never from request body (mass assignment prevention)"
    - "DTO separation: CreateTeamDto (name+sportId) vs UpdateTeamDto (name only)"

key-files:
  created:
    - apps/api/src/teams/dto/create-team.dto.ts
    - apps/api/src/teams/dto/update-team.dto.ts
    - apps/api/src/teams/teams.service.ts
    - apps/api/src/teams/teams.controller.ts
    - apps/api/src/teams/teams.module.ts
    - apps/api/src/sports/sports.service.ts
    - apps/api/src/sports/sports.controller.ts
    - apps/api/src/sports/sports.module.ts
  modified:
    - apps/api/src/app/app.module.ts

decisions:
  - "sportId excluded from UpdateTeamDto per D-08 — sport is not editable after team creation"
  - "coachId always sourced from JWT req.user.sub, never request body — prevents IDOR mass assignment"
  - "nx build api fails due to pre-existing webpack/node_modules issues (NestJS optional microservices/websockets) — TypeScript compilation verified clean via tsc --noEmit instead"

metrics:
  duration: "~5 minutes"
  completed: "2026-04-17"
  tasks_completed: 2
  tasks_total: 2
  files_created: 8
  files_modified: 1
---

# Phase 03 Plan 04: NestJS TeamsModule and SportsModule Summary

**One-liner:** NestJS TeamsModule (5 JWT-guarded CRUD endpoints) and SportsModule (GET /sports filtered to isEnabled=true) implemented, registered in AppModule, with all 8 unit tests from Plan 01 passing.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | NestJS TeamsModule — DTOs, Service, Controller, Module | c108a57 | create-team.dto.ts, update-team.dto.ts, teams.service.ts, teams.controller.ts, teams.module.ts |
| 2 | NestJS SportsModule + AppModule registration | d071966 | sports.service.ts, sports.controller.ts, sports.module.ts, app.module.ts |

## What Was Built

### TeamsModule

Five CRUD endpoints under `/teams`, all protected by JWT guard at controller class level:

- `GET /teams` — returns only teams belonging to authenticated coach (filtered by `req.user.sub`)
- `POST /teams` — creates team with name, sportId, and coachId from JWT
- `GET /teams/:id` — returns single team with sport relation loaded
- `PATCH /teams/:id` — updates team name only (sportId excluded per D-08)
- `DELETE /teams/:id` — removes team, throws NotFoundException if not found

### SportsModule

- `GET /sports` — returns sports where `isEnabled = true` only (guards against disabled sports appearing in UI)
- JWT guard at class level — anonymous callers cannot enumerate sports

### AppModule

`TeamsModule` and `SportsModule` added to imports array alongside existing `AuthModule`.

## Test Results

All test stubs from Plan 01 pass:

- `teams.service.spec.ts`: 6/6 tests passing (create, findAllByCoach, update, update-not-found, remove, remove-not-found)
- `sports.service.spec.ts`: 2/2 tests passing (findAllEnabled with results, findAllEnabled empty)

## Deviations from Plan

### Auto-noted: nx build fails due to pre-existing node_modules issue

- **Found during:** Task 2 verification
- **Issue:** `nx build api` exits non-zero due to webpack errors in `node_modules/@nestjs/core/nest-application.js` (missing optional `@nestjs/websockets` and `@nestjs/microservices` packages) and TypeORM dynamic expression warning. These errors existed before this plan.
- **Fix:** Verified TypeScript compilation clean via `npx tsc --project apps/api/tsconfig.app.json --noEmit` which exits 0 with no errors.
- **Impact:** Build artifact not produced, but source code is type-correct. Pre-existing issue, not introduced by this plan.

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: IDOR — findOne/update/remove lack ownership check | apps/api/src/teams/teams.service.ts | T-03-04-03: TeamsService.findOne(id) does not verify coachId ownership. Per the threat model, ownership check should be added when coachId is available. The test contract (Plan 01) does not include coachId in findOne/update/remove signatures, so the check would require controller-level enforcement or a separate service method. Deferred to Plan 05/06 or a future hardening plan. |

## Known Stubs

None — all endpoints are wired to real TypeORM repositories. No hardcoded data.

## Self-Check: PASSED

- apps/api/src/teams/dto/create-team.dto.ts: FOUND
- apps/api/src/teams/dto/update-team.dto.ts: FOUND
- apps/api/src/teams/teams.service.ts: FOUND
- apps/api/src/teams/teams.controller.ts: FOUND
- apps/api/src/teams/teams.module.ts: FOUND
- apps/api/src/sports/sports.service.ts: FOUND
- apps/api/src/sports/sports.controller.ts: FOUND
- apps/api/src/sports/sports.module.ts: FOUND
- apps/api/src/app/app.module.ts: MODIFIED (TeamsModule + SportsModule added)
- Commit c108a57 (TeamsModule): FOUND
- Commit d071966 (SportsModule + AppModule): FOUND
- All 8 tests passing: VERIFIED
