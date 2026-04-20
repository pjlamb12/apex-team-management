# Phase 04 Research: Roster Management

## Objective
Identify the required architectural changes and components to support the Roster Management phase (Phase 4).

## Domain Analysis
- **Goal:** Coach can add, edit, and remove players from a team's roster via a quick-add workflow.
- **Data entities:** We have an existing `PlayerEntity` but it is missing the new `parentEmail` requirement. It has `firstName`, `lastName`, `jerseyNumber` (number), `preferredPosition`, and a relation to `TeamEntity`.
- **Frontend Architecture:** Currently, navigating to `/teams/:id` loads the `EditTeam` component. According to the Phase 4 context (D-01), the `/teams/:id` route should act as the "Team Dashboard" containing the roster.
- **Workflow:** An `IonModal` will be used for fast data entry (D-02) to add players inline on the dashboard without reloading pages.
- **API Endpoints:** A dedicated `GET /teams/:teamId/players` endpoint (D-03) should separate roster logic from team-level logic.

## Recommended Implementation Plan

### 1. Database & Migrations
- Modify `PlayerEntity` (`apps/api/src/entities/player.entity.ts`) to add `parentEmail` (varchar, nullable depending on v1 requirements, though D-04 says strictly required on frontend, the DB can enforce it if applicable or be nullable for migrating older records). Let's make it nullable on DB and require on API layer, or just enforce `varchar` with no nullable if it's a hard requirement. Wait, D-04 says "Parent email and jersey number are strictly required". We should add it as a required column (providing a default or writing a migration accordingly if there were existing rows, but we are early).
- Generate and run the TypeORM migration.

### 2. API Backend (`PlayersModule`)
- Create a new module inside `apps/api/src/players/` or extend `apps/api/src/teams/`? Given NestJS conventions, a `players` module mapping its controller to `/teams/:teamId/players` is a bit complex. It is simpler to put a `PlayersController` in `apps/api/src/players/` with decorator `@Controller('teams/:teamId/players')`.
- Endpoints:
  - `GET /teams/:teamId/players` - List all players.
  - `POST /teams/:teamId/players` - Add a player.
  - `PATCH /teams/:teamId/players/:playerId` - Edit a player.
  - `DELETE /teams/:teamId/players/:playerId` - Remove a player.
- Validation: NestJS `@IsEmail()`, `@IsNotEmpty()`, `@IsNumber()` on the DTOs. Ensure jersey number does NOT enforce DB uniqueness (D-05).

### 3. Frontend Architecture
- **Refactoring `/teams/:id`**: Convert the existing `EditTeam` page at `/teams/:id` into the `TeamDashboard` page. Move the generic team-editing (Name change) to an "Edit Team" button that either opens a modal or navigates to `/teams/:id/settings`.
- **Roster Components**: 
  - Sub-component for the roster listing within the dashboard.
  - An `IonModal` overlay component for "Add Player" / "Edit Player".
- **State Management**: Signals to hold the array of `Player` objects fetched via Angular `HttpClient` upon dashboard initialization.

## Validation Architecture
- Verify the TypeORM migration reflects the changes.
- Verify API accepts correctly formed player payloads and rejects invalid ones.
- Verify UI accurately lists the players, and the modal adds/edits members as expected with Signal states updating without deep refreshes.

## RESEARCH COMPLETE
