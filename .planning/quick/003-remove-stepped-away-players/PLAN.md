# Quick Task Plan: Remove / Deactivate Stepped-Away Players from Roster & Game Day Console

## Problem
When players step away from a team, coaches need to remove them from active team management so they no longer appear on attendance screens, starting lineups, or substitute lists. However, hard-deleting a player destroys their match history, game events, and playing time records. Coaches need the ability to deactivate / remove players from active duty while preserving their past attendance, playing time, and performance analytics for the games and practices they participated in, with optional toggleable filtering in analytics.

## Solution Architecture

### 1. Database & Schema
- TypeORM Migration: Add `is_active` boolean column (`NOT NULL DEFAULT true`) to `players` table.
- Entity update: `apps/api/src/entities/player.entity.ts` with `@Column({ name: 'is_active', type: 'boolean', default: true }) isActive: boolean`.
- Shared models: Update `Player` interface in `libs/shared/util/models/src/lib/player.model.ts`.
- DTOs: Update `CreatePlayerDto` and `UpdatePlayerDto` in `apps/api/src/players/dto/`.

### 2. Backend Services & Controllers
- `PlayersService`:
  - `findAllForTeam(teamId, includeInactive)`: Filter `isActive: true` by default, allow `includeInactive: true` query param.
  - `findAllForSeason(seasonId, includeInactive)`: Filter `player.isActive: true` by default.
  - `update(teamId, playerId, data)`: Support updating `isActive`.
- `PlayersController`:
  - Accept `@Query('includeInactive') includeInactive?: string` on team and season player endpoints.
- `PerformanceMetricsService`:
  - Include `isActive` on `PlayerPerformanceMetrics`.
  - Keep historical metrics for any player with event attendance or game events.

### 3. Frontend Data Access
- `libs/client/data-access/team/src/lib/players.service.ts`:
  - Update `PlayerEntity`, `CreatePlayerDto`, `UpdatePlayerDto` to support `isActive`.
  - Pass `includeInactive` param in `getPlayers` and `getPlayersForSeason`.

### 4. Frontend UI & UX
- **Roster (`roster.ts`, `roster.html`)**:
  - Filter toggle or segment for "Show Inactive / Stepped-Away Players".
  - Swipe / action button to "Step Away / Deactivate" or "Reactivate".
  - Clear confirmation alert explaining that deactivating removes the player from future attendance & substitution lists while preserving historical stats.
- **Player Modal (`player-modal.ts`, `player-modal.html`)**:
  - Add "Active on Roster" toggle when editing a player.
- **Attendance Screen (`attendance-list.ts`)**:
  - Filter roster list to active players plus any player with an existing attendance record for that event.
- **Lineup Editor (`lineup-editor.ts`)**:
  - Filter available players and substitutes to active players (plus existing lineup entries).
- **Game Console & Practice Console (`console-wrapper`, `practice-stats-tab`)**:
  - Ensure bench/substitute picker only includes active players.
- **Manage Season Roster Modal (`manage-roster-modal.ts`)**:
  - Only show active players in the available historical pool.
- **Analytics Page (`analytics.ts`, `analytics.html`)**:
  - Retain stats for past games/practices the player attended.
  - Add an "Include Inactive Players" filter toggle.

## Validation
- Backend unit tests (`players.service.spec.ts`, `players.controller.spec.ts`, `performance-metrics.service.spec.ts`).
- Frontend unit tests (`roster.spec.ts`, `analytics.spec.ts`).
- Run `npx nx test api` and `npx nx test frontend`.
