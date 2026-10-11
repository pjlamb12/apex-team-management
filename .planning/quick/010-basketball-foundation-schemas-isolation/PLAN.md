# Quick Task Plan: Issue #64 - Basketball Phase 1: Foundation, Schemas & Architectural View Isolation

Part of Epic #63.

## Overview
Establish the database foundation, event validation schemas, shared models, and architectural view isolation for Basketball support:
1. TypeORM migration `SeedBasketballSportAndEventDefinitions` inserting `Basketball` sport into `sports` table with position types and JSON schemas for 20 basketball event types.
2. Shot location coordinates `{ x: number, y: number, distanceFeet?: number }` in shot event schemas.
3. `foulLimit` (default 5) and `bonusThreshold` (default 5) configuration added to leagues and events tables, entities, DTOs, and shared models.
4. Basketball slot mappings in `lineup-entry.model.ts` (0-4 -> PG, SG, SF, PF, C).
5. `tactic-play.model.ts` updated to include `'basketball'` in `TacticSport` and `BasketballCourtType` (`'full_court' | 'half_court'`).
6. Architectural Isolation (Sport Flash Bug fix):
   - `LiveGameStateService._sportName` refactored from hardcoded `signal<string>('Soccer')` to nullable `signal<string | null>(null)` with `isSportReady = computed(() => this._sportName() !== null)`.
   - `ConsoleWrapper` and `LineupEditor` updated to eliminate fallthrough `@else` rendering of Soccer with strict `@switch (stateService.sportName())` and neutral loading skeleton.

---

## Detailed Implementation Tasks

### 1. Database Migration: `SeedBasketballSportAndEventDefinitions`
- File: `apps/api/migrations/1785100000000-SeedBasketballSportAndEventDefinitions.ts`
- Register in: `apps/api/migrations/index.ts`
- Alter tables:
  - Add `foul_limit` (integer, default 5) and `bonus_threshold` (integer, default 5) to `leagues`.
  - Add `foul_limit` (integer, default 5) and `bonus_threshold` (integer, default 5) to `events`.
- Insert into `sports`:
  - `name`: `'Basketball'`
  - `position_types`: `["Point Guard", "Shooting Guard", "Small Forward", "Power Forward", "Center"]`
  - `is_enabled`: `true`
  - `event_definitions`: JSON schemas for 20 basketball events:
    - `MADE_1PT`: shot schema `{ playerId, x, y, distanceFeet }`, required `['playerId']`
    - `MISSED_1PT`: shot schema `{ playerId, x, y, distanceFeet }`, required `['playerId']`
    - `MADE_2PT`: shot schema `{ playerId, x, y, distanceFeet, assistorId }`, required `['playerId']`
    - `MISSED_2PT`: shot schema `{ playerId, x, y, distanceFeet }`, required `['playerId']`
    - `MADE_3PT`: shot schema `{ playerId, x, y, distanceFeet, assistorId }`, required `['playerId']`
    - `MISSED_3PT`: shot schema `{ playerId, x, y, distanceFeet }`, required `['playerId']`
    - `OPPONENT_SCORE`: `{ points: { type: 'integer', minimum: 1, maximum: 3 } }`
    - `REBOUND_OFFENSIVE`: `{ playerId }`, required `['playerId']`
    - `REBOUND_DEFENSIVE`: `{ playerId }`, required `['playerId']`
    - `ASSIST`: `{ playerId, assistorId }`
    - `STEAL`: `{ playerId }`, required `['playerId']`
    - `BLOCK`: `{ playerId }`, required `['playerId']`
    - `TURNOVER`: `{ playerId }`, required `['playerId']`
    - `FOUL`: `{ playerId, foulType }`, required `['playerId']`
    - `OPPONENT_FOUL`: `{ opponentPlayerNumber }`
    - `TIMEOUT`: `{ team: { enum: ['us', 'opponent'] } }`
    - `SUB`: `{ inPlayerId, outPlayerId, positionName }`, required `['inPlayerId', 'outPlayerId', 'positionName']`
    - `POSITION_SWAP`: `{ playerIdA, playerIdB, slotIndexA, slotIndexB, positionNameA, positionNameB }`, required `['playerIdA']`
    - `PERIOD_START`: `{ period }`, required `['period']`
    - `PERIOD_END`: `{ period }`, required `['period']`
- Migration down method cleanly reverses columns and deletes `'Basketball'`.

### 2. Entities, DTOs & Services (API)
- `apps/api/src/entities/league.entity.ts`: Add `foulLimit` and `bonusThreshold`.
- `apps/api/src/entities/event.entity.ts`: Add `foulLimit` and `bonusThreshold`.
- `apps/api/src/teams/dto/create-league.dto.ts`: Add optional `foulLimit` and `bonusThreshold` validators.
- `apps/api/src/events/dto/create-event.dto.ts` & `update-event.dto.ts`: Add optional `foulLimit` and `bonusThreshold` validators.
- `apps/api/src/events/events.service.ts`: Cascade `foulLimit` and `bonusThreshold` from league defaults.

### 3. Shared Models & Interfaces
- `libs/shared/util/models/src/lib/lineup-entry.model.ts`:
  - `getDefaultSlots`: return `[0, 1, 2, 3, 4]` when `sportName === 'Basketball'`.
  - `getPositionFromSlot`: return `'PG'`, `'SG'`, `'SF'`, `'PF'`, `'C'` for slots `0..4` when `sportName === 'Basketball'`.
- `libs/shared/util/models/src/lib/tactic-play.model.ts`:
  - Extend `TacticSport` with `'basketball'`.
  - Define `BasketballCourtType = 'full_court' | 'half_court'`.
  - Add `BasketballCourtType` to `PitchType`.
- `libs/shared/util/models/src/lib/league.model.ts`: Add `foulLimit` and `bonusThreshold`.
- `libs/shared/util/models/src/lib/game.model.ts`: Add `foulLimit` and `bonusThreshold`.
- `libs/client/data-access/team/src/lib/events.service.ts`: Add `foulLimit` and `bonusThreshold` to `EventEntity`.

### 4. Architectural Isolation: State Service & Component Refactoring
- `libs/client/feature/game-console/src/lib/live-game-state.service.ts`:
  - Refactor `_sportName = signal<string | null>(null)`.
  - Add `isSportReady = computed(() => this._sportName() !== null)`.
  - Ensure `initialize()` sets `sportName ?? null`.
- `libs/client/feature/game-console/src/lib/console-wrapper/console-wrapper.html`:
  - Switch field/court view to strict `@switch (stateService.sportName())`:
    - `@case ('Volleyball')`: Volleyball court view
    - `@case ('Soccer')`: Soccer pitch view
    - `@default`: neutral animated loading skeleton
  - Switch action buttons and stats rows to avoid fallthrough Soccer controls.
  - Neutral clock/score placeholder while `stateService.sportName()` is null.
- `apps/frontend/src/app/teams/events/lineup-editor/lineup-editor.ts` & `.html`:
  - Add computed `sportName = computed(() => this.team()?.sport?.name ?? null)`.
  - Switch pitch view to strict `@switch (sportName())`:
    - `@case ('Volleyball')`: Volleyball court view
    - `@case ('Soccer')`: Soccer pitch view
    - `@default`: neutral animated loading skeleton
  - Avoid soccer formations appearing for basketball or other sports.

### 5. Verification & Testing
- [x] Unit tests for `lineup-entry.model.spec.ts` (basketball slots and position mappings).
- [x] Unit tests for migration & event validation schema (`SeedBasketballSportAndEventDefinitions.spec.ts` and `events.service.spec.ts`).
- [x] Unit tests for `live-game-state.service.spec.ts` (`sportName` nullability and `isSportReady`).
- [x] Unit tests for `console-wrapper.spec.ts` (view isolation with neutral loading skeleton and sport switching).
- [x] Full Vitest test suite run across `api`, `models`, `client-feature-game-console`, and `frontend`:
  - `nx test models`: 13/13 passed
  - `nx test api`: 352/352 passed (including 39 migration schema validation tests)
  - `nx test client-feature-game-console`: 117/117 passed
  - `nx test frontend`: 122/122 passed
- [x] Linting:
  - `nx lint api`: 0 errors
  - `nx lint models`: 0 errors
  - `nx lint frontend`: 0 errors
- [x] Production builds:
  - `nx build api`: Success
  - `nx build frontend`: Success

