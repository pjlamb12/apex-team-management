# Phase 11-02 Summary: Events Module & Practice Logic

## Objective
Refactor the backend API from "Games" to "Events" and implement practice-specific logic, including season default inheritance and chronological filtering.

## Accomplishments
- **Module & Controller Refactoring:**
  - Renamed `apps/api/src/games/` to `apps/api/src/events/`.
  - Renamed classes: `GamesService` -> `EventsService`, `GamesController` -> `EventsController`, `GamesModule` -> `EventsModule`.
  - Updated API route to `@Controller('teams/:teamId/events')`.
  - Updated `AppModule` to import `EventsModule`.
- **Practice Specific Logic:**
  - Implemented automatic inheritance of `defaultPracticeLocation` from the active season when creating an event of type `practice`.
  - Updated DTOs (`CreateEventDto`, `UpdateEventDto`) to include `type`, `durationMinutes`, and `notes`.
- **Chronological Filtering (Scoped Fetching):**
  - Updated `EventsService.findAllForTeam` to support a `scope` parameter (`upcoming` | `past`).
  - `upcoming` (default): Returns events where `scheduledAt >= now`, sorted ASC.
  - `past`: Returns events where `scheduledAt < now`, sorted DESC.
- **Verification:**
  - `npx nx test api` passed with 35/35 tests successful (added 3 new test cases).
  - `npx nx run api:build` succeeded.

## Key Changes
- **API Base Route:** `/api/teams/:teamId/events`
- **New Event Fields:** `type` ('game' | 'practice'), `durationMinutes`, `notes`.
- **Chronological Sorting:** Unified schedule now sorts events by time and supports scoping.

## Next Steps
- Sub-phase 11-03: Frontend integration. Update Angular services and components to use the new `/events` API and support practice management.
