# Quick Task Plan: Import Schedule (AI / JSON) for Competitions & Seasons

## Problem
Coaches receive game schedules via screenshots from tournament websites (GotSport, Tourney Machine, LeagueApps, TeamSnap, etc.), flyers, or emails. Manually typing each game (date, opponent, location, home/away, uniform color) into the schedule is tedious.

## Solution
1. **Backend (`apps/api`)**:
   - Create `CreateBulkEventsDto` supporting an array of `CreateEventDto` with optional `leagueId` and `seasonId`.
   - Add `POST /teams/:teamId/events/bulk` endpoint in `EventsController`.
   - Implement `EventsService.createBulk` to resolve league/season defaults, create all games in batch, emit real-time WebSocket notifications, and return the created records.
   - Add unit tests in `events.service.spec.ts`.

2. **Client Data Access (`libs/client/data-access/team`)**:
   - Add `bulkCreateEvents(teamId: string, data: { events: CreateEventDto[]; leagueId?: string; seasonId?: string })` to `EventsService`.

3. **Frontend UI (`apps/frontend`)**:
   - Create `ScheduleImportModal` (`schedule-import-modal.ts`, `.html`, `.scss`):
     - Competition & season selection dropdowns.
     - "📸 How to Import with Gemini" prompt helper with 1-click **"Copy Gemini Prompt"** and **"Load Sample JSON"**.
     - Resilient JSON editor/textarea with syntax validation & markdown code-block cleanup.
     - Interactive preview of parsed games with inline editing/deleting before committing.
     - 1-click "Import X Games" action with loading feedback.
   - Update `Schedule` component (`schedule.ts`, `schedule.html`) to expose the modal via Action Sheet and Competition toolbar button.
   - Add unit tests for `ScheduleImportModal` and updated `Schedule`.

## Plan
1. Create `apps/api/src/events/dto/create-bulk-events.dto.ts`.
2. Update `apps/api/src/events/events.service.ts` and `apps/api/src/events/events.controller.ts`.
3. Add backend tests to `apps/api/src/events/events.service.spec.ts`.
4. Update `libs/client/data-access/team/src/lib/events.service.ts`.
5. Create `apps/frontend/src/app/teams/events/schedule/schedule-import-modal/schedule-import-modal.ts`, `.html`, `.scss`, `.spec.ts`.
6. Update `apps/frontend/src/app/teams/events/schedule/schedule.ts` and `schedule.html`.
7. Verify all unit tests (`npx nx test api` and `npx nx test frontend`).
