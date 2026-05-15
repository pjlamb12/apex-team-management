# Apex Team

## What This Is

A game day coaching console for youth sports. Coaches create teams, manage rosters, and run live games — setting lineups, swapping players in/out, and logging events like goals and assists. The architecture is sport-agnostic (supporting soccer, basketball, volleyball, and future sports), but v1 ships with soccer configuration only since that's what the coach is actively using.

## Core Value

A coach shows up to a game and can instantly see who's on the field, swap players, and track what happened — no paper lineups, no mental math.

## Current Milestone: v3.0 Tryout Management & Recruiting

**Goal:** Streamline the process of evaluating new talent and onboarding players to the team through a dedicated tryout and scouting workflow.

**Target features:**
- **Candidate Management**: Dedicated pool for prospective players distinct from the team roster.
- **Scouting Rubrics**: Configurable performance ratings and qualitative coaching notes.
- **Tryout Attendance**: Specialized tracking for candidate participation in evaluation sessions.
- **Roster Promotion**: Seamless conversion of candidates to rostered players upon selection.

## Requirements

### Validated

- [x] Assistant Coach Join Codes: Generate and display alphanumeric codes.
- [x] Assistant Onboarding Flow: Enter code to join a team.
- [x] Real-time WebSocket sync between coach devices during games.
- [x] iCal Sync: Generate .ics URLs for teams.
- [x] Recurring Events: "Repeat" logic for practices and games.
- [x] Precision Weather: Lat/Lon based forecasts via WeatherAPI.com.
- [x] Structured Locations: Address search and coordinate mapping.
- [x] Drill Import (JSON/File): Ingest drills from external sources.
- [x] Playing Time Engine: Core logic for deriving minutes from events.
- [x] Participation Analytics: Attendance and commitment reporting.
- [x] Performance Metrics: Aggregated stats across games/seasons.
- [x] Team Dashboard: High-level visualization of team stats.
- [x] Player Profile Analytics: Detailed individual performance views.
- [x] Export & Polish: CSV reporting and final UI refinements.

### Active

- [ ] Tryout Foundation: Candidate data model and "Tryout" event type.
- [ ] Scouting & Evaluation: Rubrics and performance ratings.
- [ ] Tryout Session Management: Attendance and live evaluation entry.
- [ ] Roster Promotion: Workflow for converting candidates to players.

### Out of Scope / Deferred

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- Parent accounts and "claim token" onboarding — deferred to v3.0
- Personalized iCal feeds for parents — deferred to v3.0
- Messaging / team chat — deferred to v4.0
- Media hub (photo/video uploads) — deferred to v4.0

## Context

- **Who uses this:** Youth sports coaches (the developer is a current soccer coach building this for personal use first)
- **Current pain:** Difficulty tracking playing time parity and long-term player development trends manually.
- **Technical environment:** Nx monorepo with Angular 21 frontend. NestJS backend, PostgreSQL, Ionic/Capacitor, and Tailwind CSS.
- **Prior art:** V1 focused on the game day console; V2 focuses on the "Coaching Intelligence" layer.
- **Codebase state:** Full backend/frontend integration for core team management and game day console.

## Constraints

- **Tech stack:** Nx monorepo, Angular 21 (Signals, inject() pattern), NestJS, PostgreSQL, Ionic/Capacitor, Tailwind CSS
- **Library structure:** Domain-driven `libs/domain/type/name` per TRD
- **State management:** Signals for UI-bound state; Observables for data streams
- **Component style:** Declarative — use `toSignal` and `async` pipe, no manual `.subscribe()` in TypeScript files except for side-effect post actions
- **Styling:** Tailwind for layout/spacing; Ionic for Shadow DOM components
- **Architecture:** Sport-agnostic from day one. Soccer-only seeded data in v1
- **Testing:** Vitest for unit tests, Playwright for E2E
- **Design aesthetic:** "Athletic Professional" — clean, dashboard-style, high-contrast with dark mode support

## Key Decisions

<!-- Decisions that constrain future work. Add throughout project lifecycle. -->

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Event-Sourced Analytics | Playing time will be derived dynamically from the `GameEvent` stream to ensure consistency with the live console's undo/redo capabilities. | — Pending |
| Attendance Parity | Participation will track both practices and games to provide a full picture of player commitment. | — Pending |
| Soccer-only v1, sport-agnostic architecture | Coach is currently coaching soccer; architecture should support any sport via config without code changes | — Completed |
| Game entity built with full scheduling fields from v1 | Avoid migration headaches when scheduling UI is added in v2 | — Completed |
| Manual swaps over automated rotations for v1 | Real coaching need is knowing who's on the field and making swaps, not auto-generated rotations | — Completed |
| Practice/drills deferred to v1.1 | Game day console is the core value; practice planning is a separate workflow | — Completed |
| Head coach only for v1 | Assistant coach onboarding pulled into v1.4, parent onboarding remains v2/v3 | — Modified |

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
*Last updated: 2026-05-05 — Milestone v1.7 Complete*
