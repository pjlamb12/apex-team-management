# Phase 11-01 Summary: Games to Events Transition

## Objective
Transition the database and core entities from "Games" to "Events" to support both games and practices.

## Accomplishments
- **Database Migration:** Created and executed a migration (`1776700000000-EventsRefactor.ts`) to:
  - Rename the `games` table to `events`.
  - Add `type` column (enum: 'game' | 'practice', default: 'game').
  - Add `duration_minutes` (int) and `notes` (text) columns.
  - Rename `game_id` to `event_id` in `lineup_entries` and `game_events`.
  - Rename the primary key constraint `PK_games` to `PK_events`.
  - Verified migration reversibility (run -> revert -> run).
- **Entity Refactoring:**
  - Renamed `GameEntity` to `EventEntity` and updated the `@Entity('events')` decorator.
  - Added `type`, `durationMinutes`, and `notes` properties to `EventEntity`.
  - Updated `LineupEntryEntity` and `GameEventEntity` to use `EventEntity` and renamed the relation/column to `event_id` / `eventId`.
- **Backend Code Refactoring:**
  - Updated `apps/api/src/data-source.ts` to include `EventEntity`.
  - Refactored `GamesService` to use `EventEntity` and renamed repositories (`eventRepo`, `gameEventRepo`).
  - Refactored `LineupEntriesService` to use `eventId`.
  - Updated `GamesController` to use `eventId` for parameter names while maintaining `/games` routes for initial compatibility.
  - Updated `SeasonsService` to count `EventEntity` records before deletion.
  - Updated DTOs (`CreateGameDto`, `UpdateGameDto`) to support new event fields and optional fields for practices.
- **Verification:**
  - `npx nx test api` passed with 32/32 tests successful.
  - `npx nx run api:build` succeeded.

## Key Changes
- **Tables renamed:** `games` -> `events`
- **Columns renamed:** `game_id` -> `event_id` (in related tables)
- **Entities renamed:** `GameEntity` -> `EventEntity`
- **Variable/Property renamed:** `gameId` -> `eventId` (throughout backend)

## Next Steps
- Sub-phase 11-02: Move "Games" logic to a dedicated "Events" module and controller to fully embrace the sport-agnostic event model.
