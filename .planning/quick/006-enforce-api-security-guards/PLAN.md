# Quick Task Plan: Enforce JWT and TeamRoleGuard on all Team-Scoped API Controllers (Issue #38)

## Problem
Several controllers lack authentication or multi-tenant authorization guards (`TeamRoleGuard`), allowing horizontal privilege escalation (BOLA) where User A could access or mutate User B's team data:
1. `CandidatesController` & `ScoutingController`: missing `AuthGuard('jwt')` entirely on multiple routes.
2. `PlayersController`, `AttendanceController`, `AnalyticsController`, `PracticeDrillsController`, `SeasonsController`, `LeaguesController`, `SeasonChecklistController`: missing `TeamRoleGuard`, meaning any logged-in user can query or mutate another team's data.

## Solution Architecture

1. **`MembershipService` & `TeamRoleGuard` Enhancements (`apps/api/src/memberships`, `apps/api/src/auth/guards`)**:
   - Make `MembershipsModule` `@Global()` and import it where needed.
   - Enhance `MembershipService` with `findTeamIdBySeasonId(seasonId)` and `findTeamIdByLeagueId(leagueId)` using `DataSource` queries to resolve team context.
   - Enhance `TeamRoleGuard` to dynamically resolve `teamId` from:
     - `request.params.teamId`
     - `request.params.seasonId` -> `findTeamIdBySeasonId`
     - `request.params.leagueId` -> `findTeamIdByLeagueId`
     - `request.params.id` (checking if path is `/teams/:id`, `/seasons/:id`, or `/leagues/:id`)
     - `request.query.teamId` or `request.body.teamId`

2. **Controller Guarding & Role Annotations**:
   - `CandidatesController`: Apply `@UseGuards(AuthGuard('jwt'), TeamRoleGuard)` and `@TeamRoles(HEAD_COACH, ASSISTANT)` (delete requires `HEAD_COACH`).
   - `ScoutingController`: Apply `@UseGuards(AuthGuard('jwt'), TeamRoleGuard)` and `@TeamRoles(HEAD_COACH, ASSISTANT)` (delete rubric/note requires `HEAD_COACH`).
   - `PlayersController`: Apply `@UseGuards(AuthGuard('jwt'), TeamRoleGuard)` and `@TeamRoles(HEAD_COACH, ASSISTANT)` (delete requires `HEAD_COACH`).
   - `AttendanceController`: Apply `@UseGuards(AuthGuard('jwt'), TeamRoleGuard)` and `@TeamRoles(HEAD_COACH, ASSISTANT)`.
   - `AnalyticsController`: Apply `@UseGuards(AuthGuard('jwt'), TeamRoleGuard)` and `@TeamRoles(HEAD_COACH, ASSISTANT)`.
   - `PracticeDrillsController`: Apply `@UseGuards(AuthGuard('jwt'), TeamRoleGuard)` and `@TeamRoles(HEAD_COACH, ASSISTANT)`.
   - `SeasonsController`: Apply `@UseGuards(AuthGuard('jwt'), TeamRoleGuard)` and `@TeamRoles(HEAD_COACH, ASSISTANT)` (create/patch/delete requires `HEAD_COACH`).
   - `LeaguesController`: Apply `@UseGuards(AuthGuard('jwt'), TeamRoleGuard)` and `@TeamRoles(HEAD_COACH, ASSISTANT)` (create/patch/delete requires `HEAD_COACH`).
   - `SeasonChecklistController`: Apply `@UseGuards(AuthGuard('jwt'), TeamRoleGuard)` and `@TeamRoles(HEAD_COACH, ASSISTANT)` (create/delete item requires `HEAD_COACH`).

3. **Module Imports**:
   - Ensure `MembershipsModule` is properly registered and exported so all guards resolve without DI errors.

4. **Testing**:
   - Update and add unit tests in `team-role.guard.spec.ts` testing season/league resolution and role checks.
   - Update existing controller specs (`candidates.controller.spec.ts`, `scouting.controller.spec.ts`, `players.controller.spec.ts`, `attendance.controller.spec.ts`, etc.) to mock `TeamRoleGuard` / `MembershipService`.
   - Run Vitest test suite (`npx nx test api`) to ensure 100% pass rate.
