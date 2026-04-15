# Architecture Research: Youth Sports Team Management

## Overview

How sports team management systems are typically structured, with focus on multi-sport configurability, game-day state management, and the Nx monorepo domain-driven approach.

## System Architecture

### Component Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                        Nx Monorepo                           │
│                                                              │
│  ┌─────────────────────┐     ┌─────────────────────────┐    │
│  │   Angular/Ionic App  │────▶│      NestJS API          │    │
│  │   (apps/frontend)    │◀────│    (apps/api)            │    │
│  └─────────────────────┘     └────────────┬────────────┘    │
│           │                                │                 │
│  ┌────────┴────────┐           ┌──────────┴──────────┐     │
│  │ Client Libraries │           │   API Libraries      │     │
│  │ libs/client/*    │           │   libs/api/*          │     │
│  └────────┬────────┘           └──────────┬──────────┘     │
│           │                                │                 │
│           └──────────┬─────────────────────┘                │
│                      │                                       │
│             ┌────────┴────────┐                              │
│             │ Shared Libraries │                              │
│             │ libs/shared/*    │                              │
│             └─────────────────┘                              │
│                                                              │
└──────────────────────────────────────────────────────────────┘
                           │
                  ┌────────┴────────┐
                  │   PostgreSQL     │
                  └─────────────────┘
```

### Nx Library Taxonomy (Domain-Driven)

Based on the TRD's `libs/domain/type/name` convention:

```
libs/
├── shared/
│   ├── util/
│   │   ├── models/          # TypeScript interfaces shared across frontend/backend
│   │   ├── logic-rotation/  # Pure logic: rotation calculations (v1.3)
│   │   └── analytics/       # Aggregation logic (v3)
│   └── ui/
│       └── components/      # Shared UI primitives (if needed)
├── client/
│   ├── feature/
│   │   ├── auth/            # Login/signup pages
│   │   ├── dashboard/       # Team overview (v1.1+)
│   │   ├── game-console/    # Live game mode
│   │   ├── roster/          # Player management
│   │   └── team/            # Team CRUD
│   ├── data-access/
│   │   ├── auth/            # Auth service, token management
│   │   ├── teams/           # Team API service
│   │   ├── games/           # Game API service
│   │   └── players/         # Player API service
│   └── ui/
│       ├── theme/           # Tailwind config, dark mode, CSS tokens
│       └── components/      # Reusable UI components (player cards, field layout)
└── api/
    ├── feature/
    │   ├── auth/            # Passport JWT, signup/login endpoints
    │   ├── teams/           # Team CRUD endpoints
    │   ├── games/           # Game CRUD + live game endpoints
    │   └── players/         # Player CRUD endpoints
    └── data-access/
        ├── database/        # TypeORM config, base entity, migrations
        └── entities/        # TypeORM entities (or per-domain)
```

### Tag-Based Boundary Rules

Configure Nx `depConstraints` for architectural enforcement:

```json
{
  "depConstraints": [
    { "sourceTag": "scope:shared", "onlyDependOnLibsWithTags": ["scope:shared"] },
    { "sourceTag": "scope:client", "onlyDependOnLibsWithTags": ["scope:shared", "scope:client"] },
    { "sourceTag": "scope:api", "onlyDependOnLibsWithTags": ["scope:shared", "scope:api"] },
    { "sourceTag": "type:feature", "onlyDependOnLibsWithTags": ["type:data-access", "type:ui", "type:util"] },
    { "sourceTag": "type:data-access", "onlyDependOnLibsWithTags": ["type:util"] },
    { "sourceTag": "type:ui", "onlyDependOnLibsWithTags": ["type:util"] },
    { "sourceTag": "type:util", "onlyDependOnLibsWithTags": ["type:util"] }
  ]
}
```

## Data Architecture

### Entity Relationship Model

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  sports   │────▶│  teams   │────▶│ players  │
│           │     │          │     │          │
│ positions │     │ sport_id │     │ team_id  │
│ (JSONB)   │     │ coach_id │     │ name     │
└──────────┘     └────┬─────┘     │ jersey # │
                      │           └─────┬────┘
                 ┌────┴─────┐          │
                 │  users   │     ┌────┴──────┐
                 │          │     │   games    │
                 │ email    │     │            │
                 │ role     │     │ team_id    │
                 └──────────┘     │ opponent   │
                                  │ start_time │
                                  └────┬──────┘
                                       │
                              ┌────────┼────────┐
                              │                  │
                        ┌─────┴──────┐    ┌─────┴──────┐
                        │ lineups/   │    │game_events │
                        │ positions  │    │            │
                        │            │    │ player_id  │
                        │ game_id    │    │ event_type │
                        │ player_id  │    │ timestamp  │
                        │ position   │    └────────────┘
                        │ status     │
                        └────────────┘
```

### Game State Model (Event Sourcing Approach)

For the live game console, track lineup as a sequence of events rather than mutable state:

```typescript
// Each substitution creates a new event
interface GameLineupEvent {
  id: string;
  gameId: string;
  timestamp: Date;
  type: 'INITIAL_LINEUP' | 'SUBSTITUTION' | 'POSITION_CHANGE';
  playerIn?: string;   // player coming ON
  playerOut?: string;   // player going OFF
  position: string;     // position affected
}
```

**Current state** = replay all events from game start. This enables:
- Undo last substitution
- Playing time calculation (diff between events)
- Full substitution history
- Future analytics (position frequency, playing time distribution)

### Sport Configuration Schema

```typescript
interface SportConfig {
  id: string;
  name: string;                  // "Soccer", "Basketball"
  positions: Position[];         // [{ id, name, shortName, x, y }]
  defaultPlayersOnField: number; // 11 for soccer, 5 for basketball
  periodType: 'half' | 'quarter' | 'set' | 'period';
  periodsCount: number;         // 2 for soccer, 4 for basketball
  allowedSubstitutions?: 'unlimited' | 'limited' | 'dead-ball-only';
  eventTypes: string[];         // ['GOAL', 'ASSIST', 'FOUL', etc.]
}
```

## Data Flow: Live Game Console

```
Coach taps "Swap" → UI updates locally (optimistic)
                   → API call: POST /games/:id/events
                   → Database: Insert lineup event
                   → Response confirms or rejects
                   → UI reconciles if needed
```

**Offline consideration:** For v1, assume online connectivity. But design the event-log approach so offline queue can be added later (v2 coach sync).

## Build Order (Dependency Chain)

```
Phase 1: Workspace + shared models + database
Phase 2: Auth (backend + frontend)
Phase 3: Teams + Sport config
Phase 4: Roster/Players
Phase 5: Games + Lineup UI
Phase 6: Live Console (substitutions + events)
Phase 7: Polish + PWA
```

Each phase depends on the previous. This is the natural build order from the dependency graph.

---
*Researched: 2026-04-14*
