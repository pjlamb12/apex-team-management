# Research Summary: Apex Team

## Overview

Synthesis of 4 research dimensions for the Apex Team youth sports coaching console.

## Key Findings

### Stack

The TRD's chosen stack (Angular 21 + Ionic/Capacitor + NestJS + PostgreSQL) is well-validated. Key confirmations:

- **Angular 21 Signals** are the right state management approach — no need for NgRx/NGXS for this app size
- **PostgreSQL with JSONB** is ideal for sport-agnostic position configurations
- **TypeORM** remains the NestJS standard ORM, though Drizzle is an alternative
- **Skip Socket.io for v1** — single coach, no sync needed yet
- **Tailwind + Ionic** requires careful CSS integration (avoid preflight conflicts)

### Table Stakes Features (v1 Must-Haves)

1. Auth (email/password, JWT, session persistence)
2. Team creation with sport selection
3. Roster management (add/edit/remove players)
4. Game creation (opponent, location, time)
5. Starting lineup assignment
6. Live substitutions
7. Event logging (goals, assists)

### Architecture Recommendations

1. **Event-sourced game state** — don't use mutable lineup objects. Every substitution is an immutable event. Current state = replay events. Enables undo, playing time calculation, and future analytics
2. **Nx domain-driven libraries** — `libs/{scope}/{type}/{name}` with tag-based boundary enforcement
3. **Local-first game console** — optimistic updates, background API sync. Don't block on network during gameplay
4. **Sport config as data** — JSONB positions, configurable event types. No ENUMs for sport-specific concepts

### Critical Pitfalls to Avoid

| # | Pitfall | Prevention | Phase |
|---|---------|-----------|-------|
| 1 | Over-engineering sport config | Seed soccer, keep it simple. Generalize after 2-3 sports | Phase 1 |
| 2 | Online-only game console | Local-first state, optimistic API sync | Phase 5-6 |
| 3 | Mutable lineup state | Event sourcing from day one | Phase 5 |
| 4 | Premature multi-device sync | v1 = single coach. Design for future sync | All |
| 5 | Auth scope creep | One role (COACH), email/password only | Phase 2 |
| 6 | Poor game-day UX | Large tap targets, 2-3 tap max, haptics | Phase 6 |
| 7 | Rigid schema (ENUMs) | JSONB for sport-specific data | Phase 1 |

### Build Order (Dependency-Driven)

```
1. Workspace infrastructure + shared models + database schema
2. Authentication (backend + frontend)
3. Teams + Sport configuration (seed soccer)
4. Roster / Player management
5. Games + Lineup assignment
6. Live Console (substitutions + event logging)
7. Polish + PWA + dark mode
```

### What NOT to Build

- NgRx or complex state management (Signals + services are sufficient)
- GraphQL (REST is simpler and adequate)
- Real-time sync (v2)
- Visual field editor for custom sports (v2+)
- Player statistics dashboards (v3)
- Payment/billing features (never — different product)

---
*Synthesized: 2026-04-14*
*Sources: STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md*
