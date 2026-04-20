# Apex Team

## What This Is

A game day coaching console for youth sports. Coaches create teams, manage rosters, and run live games — setting lineups, swapping players in/out, and logging events like goals and assists. The architecture is sport-agnostic (supporting soccer, basketball, volleyball, and future sports), but v1 ships with soccer configuration only since that's what the coach is actively using.

## Core Value

A coach shows up to a game and can instantly see who's on the field, swap players, and track what happened — no paper lineups, no mental math.

## Current Milestone: v1.1 Season Management & Schedule

**Goal:** Enhance season lifecycle management with default locations and introduce a unified Schedule (Games + Practices) into the team workflow.

**Target features:**
- Create and edit seasons for a team (explicit management).
- Default practice location for seasons (auto-populates new practices).
- Create and view practice sessions.
- Unified "Schedule" tab replacing "Games" (combines games and practices).
- Reorganize Team dashboard to prioritize "Schedule" and "Roster".

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

- [x] Coach can sign up and log in with email/password (Phase 2)
- [x] Coach can create a team and select a sport (soccer for v1) (Phase 3)
- [x] Coach can add players to a roster (name, jersey number, contact email) (Phase 4)
- [x] Coach can create a new game (opponent, location, time, uniform color) (Phase 5, 9)
- [x] Coach can set a starting lineup by assigning players to positions (Phase 5)
- [x] Coach can swap players in/out during a live game (Phase 6, 9)
- [x] Coach can see at a glance who's on the field and who's on the bench (Phase 6)
- [x] Coach can tap to log goals and assists with timestamps (Phase 6)
- [x] Sport configuration is data-driven (positions, players on field, period type as JSONB/config) (Phase 3)
- [x] App works as a responsive web app (mobile-first, PWA-ready) (Phase 7)
- [x] Seasons can store default venue and jersey colors (Phase 9)

### Active

<!-- Current scope. Building toward these. -->

- [ ] Create and edit seasons for a team
- [ ] Set an active season
- [ ] Create and manage practice sessions (date, time, location)
- [ ] Default practice location for seasons
- [ ] Unified "Schedule" view in Team Dashboard (Games + Practices)
- [ ] Reorganize Team Dashboard segments: "Schedule" and "Roster"

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- Practice drills and sequencing — deferred to v1.2
- Automated equal-time rotation engine — deferred to v1.3
- Game scheduling UI (calendar view, recurring events) — deferred to v1.3
- Parent accounts and "claim token" onboarding — deferred to v2
- Assistant coach / team admin roles — deferred to v2
- Real-time coach sync (WebSocket) — deferred to v2
- iCal sync and calendar feeds — deferred to v2
- Messaging / team chat — deferred to v3
- Media hub (photo/video uploads) — deferred to v3
- Analytics and reporting — deferred to v3
- Basketball and volleyball sport configs — deferred (architecture supports them, but only soccer is seeded in v1)

## Context

- **Who uses this:** Youth sports coaches (the developer is a current soccer coach building this for personal use first)
- **Current pain:** Managing lineups on paper or mentally tracking who's played. No easy way to see substitution history or log game events
- **Technical environment:** Nx monorepo with Angular 21 frontend scaffolded. NestJS backend, PostgreSQL, Ionic/Capacitor, and Tailwind CSS planned per TRD but not yet implemented
- **Prior art:** The TRD describes a comprehensive multi-version roadmap. V1 focuses narrowly on the game day console
- **Codebase state:** Fresh Nx scaffold with default Angular app. Codebase mapped in `.planning/codebase/`

## Constraints

- **Tech stack:** Nx monorepo, Angular 21 (Signals, inject() pattern), NestJS, PostgreSQL, Ionic/Capacitor, Tailwind CSS — per TRD
- **Library structure:** Domain-driven `libs/domain/type/name` per TRD
- **State management:** Signals for UI-bound state; Observables for data streams — per TRD
- **Component style:** Declarative — use `toSignal` and `async` pipe, no manual `.subscribe()` in TypeScript files except for side-effect post actions
- **Styling:** Tailwind for layout/spacing; Ionic for Shadow DOM components — per TRD
- **Architecture:** Sport-agnostic from day one. Soccer-only seeded data in v1
- **Testing:** Vitest for unit tests, Playwright for E2E — per existing scaffold
- **Design aesthetic:** "Athletic Professional" — clean, dashboard-style, high-contrast with dark mode support

## Key Decisions

<!-- Decisions that constrain future work. Add throughout project lifecycle. -->

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Soccer-only v1, sport-agnostic architecture | Coach is currently coaching soccer; architecture should support any sport via config without code changes | — Pending |
| Game entity built with full scheduling fields from v1 | Avoid migration headaches when scheduling UI is added in v2 | — Pending |
| Manual swaps over automated rotations for v1 | Real coaching need is knowing who's on the field and making swaps, not auto-generated rotations | — Pending |
| Practice/drills deferred to v1.1 | Game day console is the core value; practice planning is a separate workflow | — Pending |
| Head coach only for v1 | Simplify auth/roles initially; assistant coaches and parents come in v2 | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-17 — Phase 04 (Roster Management) complete*
