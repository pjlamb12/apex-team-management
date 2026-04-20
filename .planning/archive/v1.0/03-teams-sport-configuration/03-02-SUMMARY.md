---
phase: 03-teams-sport-configuration
plan: 02
subsystem: frontend-tests
tags: [test-stubs, angular, wave-0, tdd]
dependency_graph:
  requires: []
  provides:
    - apps/frontend/src/app/teams/teams-list/teams-list.spec.ts
    - apps/frontend/src/app/teams/create-team/create-team.spec.ts
    - apps/frontend/src/app/shell/shell.spec.ts
  affects: []
tech_stack:
  added: []
  patterns:
    - Angular TestBed with Vitest describe/it/expect imports
    - vi.fn() mocks for HttpClient, AlertController, Router
    - Partial<T> mock typing pattern
key_files:
  created:
    - apps/frontend/src/app/teams/teams-list/teams-list.spec.ts
    - apps/frontend/src/app/teams/create-team/create-team.spec.ts
    - apps/frontend/src/app/shell/shell.spec.ts
  modified: []
decisions:
  - "Used Partial<T> typing for mocks consistent with existing auth test patterns"
  - "Shell spec imports RouterTestingModule per Angular router testing convention"
metrics:
  duration_seconds: 62
  completed_date: "2026-04-17"
  tasks_completed: 2
  tasks_total: 2
  files_created: 3
  files_modified: 0
---

# Phase 03 Plan 02: Frontend Test Stubs (Wave 0) Summary

**One-liner:** Angular TestBed spec stubs for TeamsList (delete flow), CreateTeam (sport dropdown + form submit), and Shell (ion-tabs smoke test).

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create teams-list.spec.ts stub (TEAM-05 delete flow) | fe82ad7 | apps/frontend/src/app/teams/teams-list/teams-list.spec.ts |
| 2 | Create create-team.spec.ts and shell.spec.ts stubs (TEAM-01, TEAM-02) | c6800cc | apps/frontend/src/app/teams/create-team/create-team.spec.ts, apps/frontend/src/app/shell/shell.spec.ts |

## What Was Built

Three Angular test stub spec files were created as part of Wave 0 of Phase 3:

1. **teams-list.spec.ts** — Tests the `TeamsList` component's delete flow (TEAM-05). Asserts that `AlertController.create` is called with `header: 'Delete Team'` when a delete is triggered.

2. **create-team.spec.ts** — Tests the `CreateTeam` component for:
   - Sport dropdown loading via `GET /sports` on init (TEAM-02)
   - Form submit navigating to `/teams` on success (TEAM-01)
   - Form not submitted when invalid (TEAM-01)

3. **shell.spec.ts** — Smoke tests the `Shell` tab bar component for:
   - Component creation
   - `ion-tabs` element presence
   - `ion-tab-bar` element presence

All spec files use `TestBed.configureTestingModule` with Vitest imports (`vi`, `describe`, `it`, `expect`, `beforeEach`), matching the existing auth component test patterns. These stubs will fail compilation until Plan 06 creates the corresponding components — this is intentional (Wave 0 test-first contract).

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

All three spec files import components that do not yet exist (`TeamsList`, `CreateTeam`, `Shell`). These are intentional Wave 0 stubs — the components will be created in Plan 06, at which point the tests will become executable. The stub nature is documented in the plan objective and VALIDATION.md.

## Threat Flags

None — these are test-only files with no production attack surface. All HTTP calls are mocked.

## Self-Check: PASSED

- [x] `apps/frontend/src/app/teams/teams-list/teams-list.spec.ts` exists
- [x] `apps/frontend/src/app/teams/create-team/create-team.spec.ts` exists
- [x] `apps/frontend/src/app/shell/shell.spec.ts` exists
- [x] Commit fe82ad7 exists (teams-list.spec.ts)
- [x] Commit c6800cc exists (create-team.spec.ts + shell.spec.ts)
