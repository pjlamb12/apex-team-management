# Apex Team

## What This Is

A game day coaching console for youth sports. Coaches create teams, manage rosters, and run live games — setting lineups, swapping players in/out, and logging events like goals and assists. The architecture is sport-agnostic (supporting soccer, basketball, volleyball, and future sports), but v1 ships with soccer configuration only since that's what the coach is actively using.

## Core Value

A coach shows up to a game and can instantly see who's on the field, swap players, and track what happened — no paper lineups, no mental math.

## Current Milestone: v1.7 Drill Import Foundation

**Goal:** Allow coaches to easily import drills from AI-generated sources (like Gemini) via JSON or file upload.

**Target features:**
- **JSON Import:** Paste raw JSON into a dedicated import field in the Drill Library.
- **File Upload:** Upload .json files directly to populate the library.
- **Strict Validation:** Ensure imported data adheres to the `DrillEntity` schema.

## Requirements

### Validated

- [x] Assistant Coach Join Codes: Generate and display alphanumeric codes.
- [x] Assistant Onboarding Flow: Enter code to join a team.
- [x] Real-time WebSocket sync between coach devices during games.
- [x] iCal Sync: Generate .ics URLs for teams.
- [x] Recurring Events: "Repeat" logic for practices and games.
- [x] Precision Weather: Lat/Lon based forecasts via WeatherAPI.com.
- [x] Structured Locations: Address search and coordinate mapping.

### Active

- [ ] JSON Paste Import: UI for pasting and validating drill JSON.
- [ ] File Upload Import: Support for importing .json files.
- [ ] Import Preview: Review drill data before saving to the database.

### Out of Scope / Deferred

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- Parent accounts and "claim token" onboarding — deferred to v3.0
- Personalized iCal feeds for parents — deferred to v3.0
- Messaging / team chat — deferred to v4.0
- Media hub (photo/video uploads) — deferred to v4.0
- Analytics and reporting — deferred to v2.0

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
