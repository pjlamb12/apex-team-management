# Phase 11: Practice Management & Unified Schedule - Research

**Researched:** 2026-04-20
**Domain:** Events/Scheduling, Backend/Frontend Refactoring
**Confidence:** HIGH

## Summary
Phase 11 unifies "Games" and "Practices" into a single concept: "Events". This requires a significant refactor of both backend and frontend codebases, including a database table rename from `games` to `events`. A new `type` field will distinguish games from practices. The refactor will also include inheritance of season defaults (e.g., `default_practice_location`) when creating new events.

**Primary recommendation:** Use a single database migration to handle the table rename and constraint updates to ensure data integrity during the transition. Refactor all service names from `GamesService` to `EventsService` simultaneously to maintain clarity.

<user_constraints>
## User Constraints (from 11-CONTEXT.md)

### Locked Decisions
- **Table Rename:** The `games` table will be renamed to `events`.
- **New Entity:** `EventEntity` replaces `GameEntity`.
- **Type Field:** Add `type` column (`'game' | 'practice'`) to distinguish records.
- **Practice-Specific Fields:** `durationMinutes` (nullable int), `notes` (nullable text).
- **Game-Specific Fields:** Remain but nullable for practices (`opponent`, `uniformColor`, etc.).
- **Foreign Keys:** Update `LineupEntry` and `GameEvent` to point to `eventId` (was `gameId`).
- **EventsService:** Replaces `GamesService` in both backend and frontend.
- **Unified Schedule View:** Replaces "Games" tab on Team Dashboard with "Schedule".
- **Inheritance:** Practices inherit `location` from `season.defaultPracticeLocation`.

### the agent's Discretion
- **API Filtering:** Use a `scope` query parameter (`upcoming` | `past`) for the events list.
- **Icon Selection:** Use `calendar-outline` for Games and `fitness-outline` for Practices.
- **Routing:** Rename backend routes from `/games` to `/events`.

### Deferred Ideas (OUT OF SCOPE)
- None mentioned.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PRAC-01 | Practice creation via `EventEntity` with `type='practice'`. | `EventEntity` will support `type`, `durationMinutes`, and `notes`. |
| PRAC-02 | Edit/Delete practices via `EventsService`. | CRUD logic in `EventsService` is type-agnostic. |
| SCHD-02 | Unified Schedule tab in `TeamDashboard` using merged `events` list. | Backend `findAllForTeam` will return both types by default. |
| SEAS-07 | Auto-populate practice location from `season.defaultPracticeLocation`. | `SeasonEntity` already includes `default_practice_location`. |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Event Data Management | API / Backend | Database | Business logic for creating/fetching events, persisting to `events` table. |
| Unified Schedule View | Browser / Client | Frontend Server (SSR) | Displaying combined list of games and practices to the coach. |
| Season Default Inheritance | API / Backend | — | When a practice is created, the backend should fetch the season's `default_practice_location`. |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| NestJS | 11.1.19 | Backend framework | [VERIFIED: npm list] |
| TypeORM | 0.3.28 | ORM for PostgreSQL | [VERIFIED: npm list] |
| Angular | 21.2.8 | Frontend framework | [VERIFIED: npm list] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|--------------|
| Ajv | (via NestJS) | Validation schema | Validating `GameEvent` payloads. |

## Architecture Patterns

### Recommended Project Structure
```
apps/api/src/
├── entities/
│   ├── event.entity.ts       # Renamed from game.entity.ts
│   ├── lineup-entry.entity.ts # Updates reference to EventEntity
│   └── game-event.entity.ts   # Updates reference to EventEntity
└── events/                    # Renamed from games/
    ├── events.controller.ts
    ├── events.service.ts
    └── lineup-entries.service.ts

apps/frontend/src/app/teams/
└── events/                    # Renamed from games/
    ├── schedule/              # Unified Schedule view
    ├── create-event/          # Unified creation modal
    └── events.service.ts      # Unified service
```

### Pattern 1: Unified Service with Filtering
The `EventsService` will handle both types using a `type` discriminator.
```typescript
// Proposed backend filtering logic
async findAllForTeam(teamId: string, options: { scope?: 'upcoming' | 'past', type?: string }): Promise<EventEntity[]> {
  const query = this.eventRepo.createQueryBuilder('event')
    .where('event.seasonId = :seasonId', { seasonId: activeSeason.id });

  if (options.scope === 'upcoming') {
    query.andWhere('event.scheduledAt >= :now', { now: new Date() }).orderBy('event.scheduledAt', 'ASC');
  } else if (options.scope === 'past') {
    query.andWhere('event.scheduledAt < :now', { now: new Date() }).orderBy('event.scheduledAt', 'DESC');
  }
  
  if (options.type) {
    query.andWhere('event.type = :type', { type: options.type });
  }

  return query.getMany();
}
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Table Rename | Manual SQL | TypeORM Migration | Ensures consistent rename of tables, columns, and foreign keys. |
| Date Formatting | Custom logic | Angular `date` pipe | Standardized across the application. |

## Runtime State Inventory

| Category | Items Found | Action Required |
|----------|----------|------------------|
| Stored data | `games` table in PostgreSQL | Migration: Rename table to `events`, update FKs in `lineup_entries`, `game_events`. |
| Stored data | `game_id` column in `lineup_entries` | Migration: Rename to `event_id`. |
| Stored data | `game_id` column in `game_events` | Migration: Rename to `event_id`. |
| Live service config | None | N/A |
| OS-registered state | None | N/A |
| Secrets/env vars | None | N/A |
| Build artifacts | Frontend `dist/` | Complete rebuild required to update API routes. |

## Common Pitfalls

### Pitfall 1: Breaking Foreign Key Constraints
**What goes wrong:** Renaming the `games` table without updating the foreign keys in `lineup_entries` and `game_events` will cause database errors.
**Why it happens:** TypeORM might not automatically rename the constraint if done manually.
**How to avoid:** Use a generated migration and double-check the SQL output for `ALTER TABLE` statements.

### Pitfall 2: Confusing `EventEntity` vs `GameEventEntity`
**What goes wrong:** Naming overlap makes code hard to read (e.g., `EventService` logs an `Event` that is actually a `GameEvent`).
**Why it happens:** "Event" is used both for scheduled items (games/practices) and in-game actions (goals/assists).
**How to avoid:** Explicitly rename `GameEventEntity` references to clarify they belong to a *Game* event type, or keep the name but ensure clarity in the service methods (e.g., `logInGameEvent`).

## Code Examples

### Unified Event Entity
```typescript
@Entity('events')
export class EventEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: ['game', 'practice'], default: 'game' })
  type: 'game' | 'practice';

  @Column({ nullable: true })
  opponent?: string;

  @Column({ name: 'scheduled_at', type: 'timestamp' })
  scheduledAt: Date;

  @Column({ nullable: true })
  location: string | null;

  @Column({ name: 'duration_minutes', nullable: true, type: 'integer' })
  durationMinutes: number | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;
  
  // ... rest of fields
}
```

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Practices do not use `LineupEntry` records. | Pitfalls | If they do, the UI needs to support practice lineups. |
| A2 | Season default practice location is the only inheritance required for practices. | Summary | Might miss other defaults (like practice duration). |

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| PostgreSQL | Data storage | ✓ | 16 | — |
| NestJS | Backend API | ✓ | 11.1.19 | — |
| Angular | Frontend UI | ✓ | 21.2.8 | — |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest |
| Quick run command | `npx nx test api` / `npx nx test frontend` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PRAC-01 | Create practice | integration | `npx nx test api --testNamePattern="EventsService"` | ❌ Wave 0 |
| SCHD-02 | Unified schedule fetch | integration | `npx nx test api --testNamePattern="findAllForTeam"` | ❌ Wave 0 |

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V4 Access Control | yes | Ensure coach can only create/edit events for their own teams. |
| V5 Input Validation | yes | Validate event types and duration ranges. |

## Sources

### Primary (HIGH confidence)
- [CITED: apps/api/src/entities/game.entity.ts]
- [CITED: apps/api/src/entities/season.entity.ts]
- [CITED: apps/frontend/src/app/teams/games/games.service.ts]
- [CITED: .planning/phases/11-practice-management-schedule/11-CONTEXT.md]

### Secondary (MEDIUM confidence)
- [VERIFIED: npm list] - confirms core technology versions.
