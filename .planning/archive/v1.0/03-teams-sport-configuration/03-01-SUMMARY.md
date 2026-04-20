---
phase: 03-teams-sport-configuration
plan: 01
subsystem: testing
tags: [vitest, nestjs, typeorm, teams, sports, tdd]

# Dependency graph
requires:
  - phase: 01-workspace-data-foundation
    provides: TeamEntity, SportEntity, TypeORM configuration
  - phase: 02-authentication
    provides: UserEntity and auth patterns

provides:
  - TeamsService test contract (create, findAllByCoach, update, remove)
  - SportsService test contract (findAllEnabled with isEnabled filter)
  - Failing test stubs for TEAM-01, TEAM-02, TEAM-04, TEAM-05

affects:
  - 03-02 through 03-06 (all plans that implement teams/sports service layer)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Vitest unit tests with vi.fn() mocked TypeORM repositories via NestJS Test.createTestingModule"
    - "Test stubs import from not-yet-existing service files to establish contract before implementation"

key-files:
  created:
    - apps/api/src/teams/teams.service.spec.ts
    - apps/api/src/sports/sports.service.spec.ts
  modified: []

key-decisions:
  - "Test stubs reference coachId on TeamEntity — TeamEntity will need coachId column added in implementation plan"
  - "Wave 0 establishes contracts only — no production code, no trust boundaries crossed"

patterns-established:
  - "Spec files import from service files that do not yet exist — import is the contract"
  - "NestJS Test.createTestingModule with getRepositoryToken to mock TypeORM repos in Vitest"

requirements-completed: [TEAM-01, TEAM-02, TEAM-04, TEAM-05]

# Metrics
duration: 1min
completed: 2026-04-17
---

# Phase 3 Plan 01: Teams & Sport Configuration — Test Contracts Summary

**Vitest test stubs for TeamsService (5 cases) and SportsService (2 cases) establishing the NestJS service contract before implementation**

## Performance

- **Duration:** ~1 min
- **Started:** 2026-04-17T13:15:27Z
- **Completed:** 2026-04-17T13:16:38Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Created `apps/api/src/teams/teams.service.spec.ts` with 5 failing test stubs covering create, findAllByCoach, update (with NotFoundException), and remove (with NotFoundException)
- Created `apps/api/src/sports/sports.service.spec.ts` with 2 test stubs covering findAllEnabled with isEnabled: true filter
- Established test contract that requires `coachId` on TeamEntity and TeamsService methods

## Task Commits

Each task was committed atomically:

1. **Task 1: Create teams.service.spec.ts stubs (TEAM-01, TEAM-04, TEAM-05)** - `fab4fd1` (test)
2. **Task 2: Create sports.service.spec.ts stub (TEAM-02)** - `243d644` (test)

## Files Created/Modified

- `apps/api/src/teams/teams.service.spec.ts` - Vitest spec with 5 test cases for TeamsService covering TEAM-01, TEAM-04, TEAM-05
- `apps/api/src/sports/sports.service.spec.ts` - Vitest spec with 2 test cases for SportsService covering TEAM-02

## Decisions Made

- The test stubs reference `coachId` on TeamEntity (in create/findAllByCoach), but the current TeamEntity does not have this column. The implementation plans (Wave 1+) must add `coachId` to TeamEntity to fulfill the contract established here.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- TeamEntity at `apps/api/src/entities/team.entity.ts` does not yet have a `coachId` column. The test stubs reference this field as part of the service contract. This is expected — Wave 0 defines the contract; Wave 1+ implementations will fulfill it by adding the column and wiring up the service.

## User Setup Required

None - no external service configuration required.

## Known Stubs

- `apps/api/src/teams/teams.service.spec.ts` — Imports `TeamsService` from `./teams.service` which does not yet exist (intentional — contract for Plan 04)
- `apps/api/src/sports/sports.service.spec.ts` — Imports `SportsService` from `./sports.service` which does not yet exist (intentional — contract for Plan 04)

These stubs are intentional Wave 0 artifacts. Plans 03-02 through 03-06 will implement the services.

## Next Phase Readiness

- Test contracts are in place for all TEAM-0x requirements
- Implementation plans can now write services and verify against these specs
- TeamEntity needs `coachId` column added (plan 03-03 or equivalent will handle this)

---
*Phase: 03-teams-sport-configuration*
*Completed: 2026-04-17*

## Self-Check: PASSED

- apps/api/src/teams/teams.service.spec.ts: FOUND
- apps/api/src/sports/sports.service.spec.ts: FOUND
- .planning/phases/03-teams-sport-configuration/03-01-SUMMARY.md: FOUND
- Commit fab4fd1 (TeamsService spec): FOUND
- Commit 243d644 (SportsService spec): FOUND
