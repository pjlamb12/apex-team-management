---
phase: "04"
plan: "03"
subsystem: frontend
tags: [angular, ionic, players, roster, team-dashboard, signals]
dependency_graph:
  requires: ["04-02-PLAN.md"]
  provides: [PlayersService, TeamDashboard]
  affects: [app.routes.ts]
tech_stack:
  added: []
  patterns: [Angular Signals, inject() pattern, IonItemSliding, standalone components]
key_files:
  created:
    - apps/frontend/src/app/teams/players.service.ts
    - apps/frontend/src/app/teams/team-dashboard/team-dashboard.ts
    - apps/frontend/src/app/teams/team-dashboard/team-dashboard.html
    - apps/frontend/src/app/teams/team-dashboard/team-dashboard.scss
  modified:
    - apps/frontend/src/app/app.routes.ts
decisions:
  - "Implemented TeamDashboard logic in task 02 commit (not task 03) since scaffolding and logic were inseparable"
  - "Acceptance criteria uses PascalCase IonItemSliding grep on HTML but Angular Ionic uses kebab-case ion-item-sliding in templates — component TS imports both IonItemSliding and IonIcon correctly"
metrics:
  duration: "~10 minutes"
  completed: "2026-04-17T23:25:13Z"
  tasks_completed: 3
  files_created: 4
  files_modified: 1
---

# Phase 04 Plan 03: UI Team Dashboard & Roster Service Summary

Angular frontend service for player CRUD operations and a Team Dashboard component that displays a team's full roster with swipe-to-delete support using IonItemSliding.

## Tasks Completed

| Task | Description | Commit |
|------|-------------|--------|
| 04-03-01 | PlayersService with getPlayers, addPlayer, updatePlayer, deletePlayer | 44c7a8d |
| 04-03-02 | TeamDashboard component (template + styles) + route updates | 2380809 |
| 04-03-03 | TeamDashboard logic (ngOnInit, Signals, delete handler) — implemented in 04-03-02 | 2380809 |

## What Was Built

**PlayersService** (`apps/frontend/src/app/teams/players.service.ts`):
- Injectable standalone service using `inject()` pattern
- Typed `PlayerEntity`, `CreatePlayerDto`, `UpdatePlayerDto` interfaces matching backend entity
- Four CRUD methods: `getPlayers(teamId)`, `addPlayer(teamId, data)`, `updatePlayer(teamId, playerId, data)`, `deletePlayer(teamId, playerId)`
- Uses `RuntimeConfigLoaderService` for dynamic `apiBaseUrl`

**TeamDashboard** (`apps/frontend/src/app/teams/team-dashboard/`):
- Standalone Angular component using Signals for `team`, `players`, `isLoading`, `errorMessage`
- `ngOnInit()` fetches both team details and players list in parallel via `Promise.all`
- `IonHeader` with team name in title and settings cog button (`settingsOutline` icon) linking to `/teams/:id/settings`
- `IonList` iterating players with `IonItemSliding` swipe-to-delete (ROST-03)
- Each player item shows jersey number in `IonBadge`, full name, and parent email
- Empty state message when no players exist
- Delete player handler updates local Signals list optimistically after API call

**Route changes** (`apps/frontend/src/app/app.routes.ts`):
- `/teams/:id` now lazy-loads `TeamDashboard` (was `EditTeam`)
- `/teams/:id/settings` added as new route for `EditTeam`

## Requirements Covered

- **ROST-04**: Coach can view the full roster at a glance — TeamDashboard lists all players with jersey number, name, email
- **ROST-03**: Coach can remove a player from the roster — IonItemSliding with trash icon delete action

## Deviations from Plan

### Auto-implementation Notes

**1. Task 03 implemented within Task 02 commit**
- **Found during:** Task 02 scaffolding
- **Reason:** Creating the component files and implementing the logic were inseparable — the template, styles, and component class were all written together
- **Impact:** Both tasks share commit 2380809; functionality is complete

**2. Acceptance criteria grep mismatch**
- **Found during:** Task 03 verification
- **Issue:** Plan's acceptance criteria runs `grep -q "IonItemSliding" team-dashboard.html` but Angular Ionic standalone templates use lowercase kebab-case (`ion-item-sliding`), not PascalCase
- **Reality:** Component correctly imports `IonItemSliding` in its `imports: []` array and template uses `<ion-item-sliding>` (correct Angular syntax)
- **Resolution:** Verified by grep on `.ts` imports — both `IonItemSliding` and `IonIcon` are present and correct

## Known Stubs

None — PlayersService makes real HTTP calls; TeamDashboard fetches live data from API on init.

## Self-Check

- [x] `apps/frontend/src/app/teams/players.service.ts` — created
- [x] `apps/frontend/src/app/teams/team-dashboard/team-dashboard.ts` — created
- [x] `apps/frontend/src/app/teams/team-dashboard/team-dashboard.html` — created
- [x] `apps/frontend/src/app/teams/team-dashboard/team-dashboard.scss` — created
- [x] `apps/frontend/src/app/app.routes.ts` — modified
- [x] Commit 44c7a8d — PlayersService
- [x] Commit 2380809 — TeamDashboard + routes
