---
phase: 05-games-lineup
plan: 04
subsystem: api
tags:
  - nestjs
  - backend
  - games
  - lineups
dependency_graph:
  requires:
    - 05-01
    - 05-02
    - 05-03
  provides:
    - "Games REST API"
    - "Bulk Lineup Persistence"
    - "Auto-Season Management"
  affects:
    - apps/api/src/app/app.module.ts
tech-stack:
  added: []
  patterns:
    - "Bulk replace (delete then insert) for lineup entries"
    - "Auto-creation of seasons during game creation"
key-files:
  created:
    - apps/api/src/games/games.service.ts
    - apps/api/src/games/lineup-entries.service.ts
    - apps/api/src/games/games.controller.ts
    - apps/api/src/games/games.module.ts
  modified:
    - apps/api/src/app/app.module.ts
    - apps/api/src/games/games.service.spec.ts
    - apps/api/src/games/lineup-entries.service.spec.ts
decisions:
  - "Included team ownership verification in GamesService.create via optional userId parameter"
  - "Used empty controller prefix in GamesController to support both /teams/ and /games/ paths"
  - "Implemented bulk replace in LineupEntriesService to simplify client-side lineup editing"
metrics:
  duration: "30m"
  completed_date: "2026-04-18"
---

# Phase 05 Plan 04: Games Backend Implementation Summary

Implemented the NestJS backend services, controller, and module for the Games & Lineup feature. This provides the necessary API for the frontend to manage games and lineups.

## Key Accomplishments

### 1. Games Service & Auto-Season Logic
- Implemented `GamesService` with full CRUD capabilities.
- Added logic to automatically create a "YYYY Season" for a team if no active season exists during game creation.
- Implemented filtering by active season in `findAllForTeam`.
- Added team ownership verification to the `create` method.

### 2. Lineup Persistence
- Implemented `LineupEntriesService` using a "delete then insert" pattern for bulk lineup updates.
- Provided `findByGame` to retrieve a game's full lineup including player details.

### 3. API Endpoints
- Exposed 6 protected REST endpoints in `GamesController`:
  - `POST /teams/:teamId/games`: Create game (with auto-season).
  - `GET /teams/:teamId/games`: List games for active season.
  - `PATCH /games/:gameId`: Update game details.
  - `DELETE /games/:gameId`: Delete game.
  - `GET /games/:gameId/lineup`: Get lineup.
  - `POST /games/:gameId/lineup`: Save lineup (bulk).

### 4. Testing & Wiring
- Updated `games.service.spec.ts` and `lineup-entries.service.spec.ts` with comprehensive unit tests.
- Registered `GamesModule` in the main `AppModule`.
- Verified all tests pass and TypeScript is clean.

## Deviations from Plan

### Rule 2 - Auto-add missing critical functionality
- **Ownership Check in GamesService.create:** Added `userId` parameter and verification logic to ensure only the team's coach can create games. This was identified in the threat model but not explicitly detailed in the task actions.

## Verification Results

- `npx nx test api --testPathPattern=games`: **PASSED** (24 tests total in api, including all games tests).
- `npx tsc --project apps/api/tsconfig.app.json --noEmit`: **PASSED** (No errors).

## Self-Check: PASSED

## Known Stubs
- None. Backend implementation is fully functional for the requirements of Phase 5.
