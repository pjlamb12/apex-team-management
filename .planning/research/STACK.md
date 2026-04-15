# Stack Research: Youth Sports Team Management

## Overview

Research into the standard 2025-2026 stack for building a youth sports team management application with game day coaching console, multi-sport roster management, and real-time lineup tracking.

## Recommended Stack (Aligned with TRD)

The TRD's chosen stack is well-aligned with industry best practices. Here's validation and specific recommendations:

### Frontend: Angular 21 + Ionic/Capacitor

**Recommendation: Proceed as planned** — Confidence: HIGH

| Technology | Version | Purpose | Notes |
|-----------|---------|---------|-------|
| Angular | ~21.2.0 | UI Framework | Already scaffolded. Signals + inject() pattern is current best practice |
| Ionic Framework | 8.x | Mobile UI components | Shadow DOM components, platform-adaptive UI, haptic feedback API |
| Capacitor | 7.x | Native bridge | PWA-first with native deploy capability |
| Tailwind CSS | 4.x | Utility styling | Works alongside Ionic CSS variables for theming |

**Key Angular 21 patterns to use:**
- `signal()` for component state (lineup positions, bench state)
- `computed()` for derived state (players remaining on bench, substitution count)
- `effect()` for side effects (saving game state, syncing)
- `toSignal()` to bridge Observable streams to template-reactive signals
- `inject()` function over constructor injection

**Ionic considerations:**
- Use `ion-reorder-group` for drag-and-drop lineup management
- `ion-action-sheet` for quick substitution actions during game
- `ion-fab` for floating "swap" and "log event" buttons in live mode
- Haptic feedback via `@capacitor/haptics` for timer transitions and substitution confirmations

### Backend: NestJS + PostgreSQL

**Recommendation: Proceed as planned** — Confidence: HIGH

| Technology | Version | Purpose | Notes |
|-----------|---------|---------|-------|
| NestJS | 11.x | API framework | Module-based, DDD-friendly, excellent TypeScript support |
| TypeORM | 0.3.x | ORM | Mature PostgreSQL support, migration tooling, entity decorators |
| PostgreSQL | 16+ | Database | JSONB for sport configs, relational for team/player/game data |
| Passport.js | 0.7.x | Auth | JWT strategy for stateless API auth |
| bcrypt | 5.x | Password hashing | Standard for password storage |

**Alternative ORM consideration:** Drizzle ORM is gaining traction for its SQL-first approach and better TypeScript inference. However, TypeORM remains the NestJS ecosystem standard and has deeper integration.

### Real-Time (Future: v2)

| Technology | Version | Purpose | Notes |
|-----------|---------|---------|-------|
| Socket.io | 4.x | WebSocket | For coach sync in v2. NestJS has native `@nestjs/websockets` support |

**Not needed for v1** — single coach per device, no real-time sync required.

### Infrastructure

| Technology | Purpose | Notes |
|-----------|---------|-------|
| `runtime-config-loader` | Runtime env config | Load API URLs, feature flags at runtime (not build-time) |
| `ngx-circuit` | Feature flags | User's own library — used for progressive feature rollout |

## What NOT to Use

| Technology | Why Not |
|-----------|---------|
| NgRx / NGXS | Over-engineered for this app size. Angular Signals + services handle state well |
| GraphQL | REST is simpler for this CRUD-heavy app. GraphQL adds complexity without clear benefit |
| MongoDB | Relational data (teams → players → games → events) maps naturally to PostgreSQL |
| Firebase | Data ownership and query flexibility matters. PostgreSQL gives full control |
| React Native | Already committed to Angular/Ionic. Cross-framework switch is unjustified |

## Version Compatibility Matrix

| Package | Min Version | Tested With |
|---------|-------------|-------------|
| Node.js | 20.x LTS | 22.x |
| Angular | 21.x | 21.2.0 |
| Nx | 22.x | 22.6.5 |
| TypeScript | 5.9.x | 5.9.2 |
| NestJS | 11.x | 11.0.0 |
| PostgreSQL | 16.x | 16+ |

---
*Researched: 2026-04-14*
