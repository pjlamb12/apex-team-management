# Phase 11-03 Summary: Frontend Integration & Practice Management

## Objective
Refactor the frontend to support the unified "Schedule" view and practice management, replacing the existing "Games" tab with a sport-agnostic event model.

## Accomplishments
- **Frontend Refactoring:**
  - Renamed `apps/frontend/src/app/teams/games/` to `apps/frontend/src/app/teams/events/`.
  - Renamed `GamesService` to `EventsService` and updated all API calls to use `/api/teams/:id/events`.
  - Updated `EventEntity`, `CreateEventDto`, and `UpdateEventDto` interfaces to include `type`, `durationMinutes`, and `notes`.
  - Updated all component imports and class names from `Game` to `Event`.
- **Unified Schedule View:**
  - Implemented `ScheduleComponent` with an [Upcoming | Past] segment toggle.
  - Merges games and practices into a single chronological list.
  - Uses type-specific icons: `calendar-outline` for games, `fitness-outline` for practices.
  - Games link to the Lineup Editor / Game Console; Practices link directly to the Edit view.
- **Practice Management UI:**
  - Implemented `CreatePractice` component.
  - Automatically inherits `defaultPracticeLocation` from the active season.
  - Integrated practice creation into the Team Dashboard via a new multi-action FAB.
- **Game Console Integration:**
  - Updated `ConsoleWrapper` and `EventSyncService` to use the new event-based API routes.
  - Ensured `teamId` is passed for proper ownership checks in the backend.
  - Updated `LiveGameStateService` to use `eventId` and unified storage keys.
- **Verification:**
  - `npx nx run frontend:build` succeeded.
  - Updated unit tests for `EventsService`, `LiveGameStateService`, `EventSyncService`, and `ConsoleWrapper` to reflect the new event-based architecture.

## Key Changes
- **Tab Renamed:** "Games" -> "Schedule" on Team Dashboard.
- **Routes Updated:** `/teams/:id/games/*` -> `/teams/:id/events/*`.
- **New Feature:** dedicated practice creation workflow with season default inheritance.

## Final Status
Phase 11 (Practice Management & Schedule) is now complete. Both backend and frontend fully support a unified event model for games and practices.
