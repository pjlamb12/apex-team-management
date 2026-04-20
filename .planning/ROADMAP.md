# Roadmap: Apex Team v1

**Created:** 2026-04-14
**Milestone:** v1 — Game Day Console
**Phases:** 8
**Requirements:** 31

## Phase Overview

| # | Phase | Goal | Requirements | Success Criteria |
|---|-------|------|--------------|------------------|
| 1 | Workspace & Data Foundation | Establish Nx monorepo structure, shared models, database schema, and sport config | INFR-01, INFR-02, TEAM-03 | 3 |
| 2 | Authentication | Coach can sign up, log in, and maintain sessions | AUTH-01, AUTH-02, AUTH-03, AUTH-04 | 4 |
| 3 | Teams & Sport Configuration | Coach can create and manage teams with sport-driven position config | TEAM-01, TEAM-02, TEAM-04, TEAM-05 | 4 |
| 4 | Roster Management | Coach can build and manage a player roster for each team | ROST-01, ROST-02, ROST-03, ROST-04 | 4 |
| 5 | Games & Lineup | Coach can create games and assign players to starting positions | GAME-01, GAME-02, GAME-03, GAME-04, LIVE-01, LIVE-02 | 5 |
| 6 | Live Game Console | ● Complete | LIVE-03, LIVE-04, LIVE-05, LIVE-06, LIVE-07, LIVE-08, INFR-03 | 5 |
| 7 | PWA & Native Builds | ● Complete | INFR-04, INFR-05, INFR-06 | 4 |
| 8 | UI Rework | Resolve dark-theme inconsistencies — black backgrounds, dark-gray-on-black contrast issues, and visual polish across all screens | — | — |
| 9 | Season Defaults & Advanced Console | Implement season-level default venues/colors and advanced lineup swap logic | SEAS-01, SEAS-02, GAME-05, LIVE-05, LIVE-09, LIVE-10 | 4 |

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
- [x] 02-05-PLAN.md — Auth UI pages (Login, Signup, Reset-Password, Home placeholder)
- [x] 02-06-PLAN.md — End-to-end verification checkpoint

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

**Plans:** 8 plans

Plans:
- [x] 06-01-PLAN.md — Foundation & Backend Updates
- [x] 06-02-PLAN.md — Core Game State & Clock Services
- [x] 06-03-PLAN.md — Console UI Shell & Routing
- [x] 06-04-PLAN.md — Sport-Specific Visualization & Substitutions
- [x] 06-05-PLAN.md — Event Logging & Sync
- [x] 06-06-PLAN.md — Final Verification & Polishing
- [x] 06-07-PLAN.md — Backend Sync Mismatch Fixes
- [x] 06-08-PLAN.md — Clock Persistence and Signal Immutability Fixes

**Success criteria:**
1. Coach can swap a bench player with an on-field player in 2 taps
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

**Plans:** 4 plans
- [x] 07-01-PLAN.md — PWA and Capacitor Initialization
- [x] 07-02-PLAN.md — Native Platform Configuration
- [x] 07-03-PLAN.md — Haptics and Native Branding
- [x] 07-04-PLAN.md — Phase Verification & Build Artifacts

**Success criteria:**
1. App has a valid web manifest and service worker for PWA installation
2. App is installable on mobile home screen via browser "Add to Home Screen"
3. Capacitor Android build produces a working APK/AAB
4. Capacitor iOS build produces a working archive for TestFlight/App Store

---

### Phase 8: UI Rework

**Goal:** Resolve dark-theme inconsistencies across all screens — eliminate opaque black backgrounds, dark-gray-on-black contrast issues, and other visual polish problems so the app feels cohesive and readable.

**Depends on:** Phase 7

**Plans:** 4 plans

Plans:
- [x] 08-01-PLAN.md — Global token system: fill theme.css AP overrides + update styles.scss @theme block and import order
- [x] 08-02-PLAN.md — Game console hardcode removal: console-wrapper, event-log, soccer-pitch-view
- [x] 08-03-PLAN.md — Per-page SCSS cleanup: redundant ion-card overrides, teams-list border, lineup-editor border
- [ ] 08-04-PLAN.md — Visual verification checkpoint across all 13 screens

**Success criteria:**
1. No screen has an unintended solid black background that breaks the design system
2. All text/icon elements meet sufficient contrast against their backgrounds
3. Dark-theme colors are consistent across all pages and components

### Phase 9: Season Defaults & Advanced Console

**Goal:** Allow seasons to store default venue and jersey colors; fix Undo logic; and implement position-retaining swaps and on-field player position swaps.

**Depends on:** Phase 8

**Plans:** 4 plans

Plans:
- [ ] 09-01-PLAN.md — Backend Extensions & Migration
- [ ] 09-02-PLAN.md — Season Settings & Smart Game Creation
- [ ] 09-03-PLAN.md — Live Console Slot Refactor
- [ ] 09-04-PLAN.md — Advanced Pitch Interactions

**Success criteria:**
1. Season settings allow setting a default home venue and home/away colors
2. Game creation pre-populates location and jersey color based on home/away toggle
3. LIVE-05 fix: Undo substitution correctly restores the outgoing player to their previous position slot
4. LIVE-09: Bench player swapping in takes the exact position slot of the outgoing player
5. LIVE-10: Tapping two on-field players swaps their assigned positions

---
*Roadmap created: 2026-04-14*
*Last updated: 2026-04-19 — Phase 9 added: Season Defaults & Advanced Console*
