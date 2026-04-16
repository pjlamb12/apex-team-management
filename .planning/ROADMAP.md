# Roadmap: Apex Team v1

**Created:** 2026-04-14
**Milestone:** v1 — Game Day Console
**Phases:** 7
**Requirements:** 31

## Phase Overview

| # | Phase | Goal | Requirements | Success Criteria |
|---|-------|------|--------------|------------------|
| 1 | Workspace & Data Foundation | Establish Nx monorepo structure, shared models, database schema, and sport config | INFR-01, INFR-02, TEAM-03 | 3 |
| 2 | Authentication | Coach can sign up, log in, and maintain sessions | AUTH-01, AUTH-02, AUTH-03, AUTH-04 | 4 |
| 3 | Teams & Sport Configuration | Coach can create and manage teams with sport-driven position config | TEAM-01, TEAM-02, TEAM-04, TEAM-05 | 4 |
| 4 | Roster Management | Coach can build and manage a player roster for each team | ROST-01, ROST-02, ROST-03, ROST-04 | 4 |
| 5 | Games & Lineup | Coach can create games and assign players to starting positions | GAME-01, GAME-02, GAME-03, GAME-04, LIVE-01, LIVE-02 | 5 |
| 6 | Live Game Console | Coach can run a live game with substitutions and event logging | LIVE-03, LIVE-04, LIVE-05, LIVE-06, LIVE-07, LIVE-08, INFR-03 | 5 |
| 7 | PWA & Native Builds | App is installable as PWA and builds for Android/iOS via Capacitor | INFR-04, INFR-05, INFR-06 | 4 |

## Phase Details

### Phase 1: Workspace & Data Foundation

**Goal:** Establish the Nx monorepo library structure, shared TypeScript models, NestJS API app, PostgreSQL database with TypeORM, Tailwind CSS + Ionic integration, and seed soccer sport configuration.

**UI hint**: yes

**Requirements:** INFR-01, INFR-02, TEAM-03

**Depends on:** Nothing (starting phase)

**Plans:** 6 plans

Plans:
- [x] 01-01-PLAN.md — Nx library scaffold and module boundary rules
- [x] 01-02-PLAN.md — NestJS API app, packages, entities, and data-source
- [x] 01-03-PLAN.md — Initial schema migration and Soccer seed
- [x] 01-04-PLAN.md — Ionic Angular and Tailwind CSS v4 frontend integration
- [x] 01-05-PLAN.md — Shared TypeScript models and ThemeService (TDD)
- [x] 01-06-PLAN.md — End-to-end phase verification (human checkpoint)

**Success criteria:**
1. Nx workspace has `libs/shared`, `libs/client`, `libs/api` structure with tag-based boundary rules enforced
2. NestJS API app created at `apps/api/` with PostgreSQL + TypeORM connected and migrations running
3. Angular frontend has Ionic Framework + Tailwind CSS integrated with "Athletic Professional" dark mode theme working
4. Soccer sport config seeded in database with positions, field size, and period type
5. Shared TypeScript models defined for User, Team, Player, Sport, Game, GameEvent

---

### Phase 2: Authentication

**Goal:** Coach can create an account, log in, maintain sessions across refreshes, and reset their password.

**UI hint**: yes

**Requirements:** AUTH-01, AUTH-02, AUTH-03, AUTH-04

**Depends on:** Phase 1

**Plans:** 6 plans

Plans:
- [x] 02-01-PLAN.md — Install auth packages, configure NestJS bootstrap, proxy, and JWT env
- [x] 02-02-PLAN.md — Extend UserEntity with auth columns and run migration
- [x] 02-03-PLAN.md — NestJS auth module (DTOs, AuthService, JwtStrategy, AuthController)
- [x] 02-04-PLAN.md — Angular AuthService, route guard, interceptor, and route config
- [ ] 02-05-PLAN.md — Auth UI pages (Login, Signup, Reset-Password, Home placeholder)
- [ ] 02-06-PLAN.md — End-to-end verification checkpoint

**Success criteria:**
1. Coach can sign up with email/password and account is created in PostgreSQL
2. Coach can log in and receive a JWT that persists across browser refresh
3. Coach can log out from any page and JWT is invalidated client-side
4. Coach can request a password reset email and set a new password via link

---

### Phase 3: Teams & Sport Configuration

**Goal:** Authenticated coach can create a team, select a sport, and manage team details. Sport selection automatically configures positions and field size.

**UI hint**: yes

**Requirements:** TEAM-01, TEAM-02, TEAM-04, TEAM-05

**Depends on:** Phase 2

**Success criteria:**
1. Coach can create a new team with a name and select soccer as the sport
2. Team creation automatically loads soccer positions and field configuration from the sports table
3. Coach can view and edit team name and details
4. Coach can delete a team (with confirmation)

---

### Phase 4: Roster Management

**Goal:** Coach can add, edit, and remove players from a team's roster with quick-add workflow.

**UI hint**: yes

**Requirements:** ROST-01, ROST-02, ROST-03, ROST-04

**Depends on:** Phase 3

**Success criteria:**
1. Coach can quick-add a player with name, jersey number, and contact email
2. Coach can edit any player's details
3. Coach can remove a player from the roster (with confirmation)
4. Coach can view the full roster sorted by jersey number with all player details visible

---

### Phase 5: Games & Lineup

**Goal:** Coach can create game events with opponent/location/time details and set a starting lineup by assigning roster players to sport-specific positions.

**UI hint**: yes

**Requirements:** GAME-01, GAME-02, GAME-03, GAME-04, LIVE-01, LIVE-02

**Depends on:** Phase 4

**Success criteria:**
1. Coach can create a new game with opponent, location, date/time, and uniform color
2. Coach can view a list of games (past and upcoming) for the team
3. Coach can edit game details before the game starts
4. Coach can set a starting lineup by assigning available players to positions with remaining players on the bench
5. Coach can see at a glance who's on the field (by position) and who's on the bench

---

### Phase 6: Live Game Console

**Goal:** During a live game, coach can make substitutions, undo swaps, and log game events (goals, assists) — all with fast, touch-optimized UI. Game state survives page refresh.

**UI hint**: yes

**Requirements:** LIVE-03, LIVE-04, LIVE-05, LIVE-06, LIVE-07, LIVE-08, INFR-03

**Depends on:** Phase 5

**Success criteria:**
1. Coach can swap a bench player with an on-field player in 3 taps or fewer
2. Coach can view full substitution history with timestamps for the current game
3. Coach can undo the last substitution
4. Coach can tap a player to log a goal or assist with automatic timestamp
5. Game state (lineup, events, substitutions) persists to localStorage and survives page refresh

---

### Phase 7: PWA & Native Builds

**Goal:** App is installable as a Progressive Web App and builds for Android and iOS via Capacitor. Ready for distribution.

**UI hint**: no

**Requirements:** INFR-04, INFR-05, INFR-06

**Depends on:** Phase 6

**Success criteria:**
1. App has a valid web manifest and service worker for PWA installation
2. App is installable on mobile home screen via browser "Add to Home Screen"
3. Capacitor Android build produces a working APK/AAB
4. Capacitor iOS build produces a working archive for TestFlight/App Store

---
*Roadmap created: 2026-04-14*
*Last updated: 2026-04-16 — Phase 2 planning complete (6 plans)*
