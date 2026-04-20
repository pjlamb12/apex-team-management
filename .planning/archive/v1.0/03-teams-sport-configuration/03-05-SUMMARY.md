---
phase: 03-teams-sport-configuration
plan: "05"
subsystem: frontend-routing
tags: [shell, ionic-tabs, routing, auth-redirect]
dependency_graph:
  requires: [03-03-PLAN.md]
  provides: [shell-component, authenticated-routing, teams-navigation]
  affects: [03-06-PLAN.md]
tech_stack:
  added: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, IonRouterOutlet, addIcons, peopleOutline]
  patterns: [Ionic IonTabs shell pattern, Angular lazy-loaded child routes, authGuard on shell route]
key_files:
  created:
    - apps/frontend/src/app/shell/shell.ts
    - apps/frontend/src/app/shell/shell.html
    - apps/frontend/src/app/shell/shell.scss
    - apps/frontend/src/app/teams/teams-list/teams-list.ts (stub)
    - apps/frontend/src/app/teams/create-team/create-team.ts (stub)
    - apps/frontend/src/app/teams/edit-team/edit-team.ts (stub)
  modified:
    - apps/frontend/src/app/app.routes.ts
    - apps/frontend/src/app/auth/auth.service.ts
decisions:
  - "Shell at path '' (empty) so team URLs remain /teams, /teams/new, /teams/:id — Open Question 3 resolved"
  - "Legacy /home redirect to /teams preserves any bookmarked URLs (D-01)"
  - "Stub team components created to unblock build — plan 06 replaces them with real implementations"
metrics:
  duration: "~7 minutes"
  completed_date: "2026-04-17"
  tasks_completed: 2
  files_created: 6
  files_modified: 2
---

# Phase 03 Plan 05: Navigation Shell & Authenticated Routing Summary

**One-liner:** IonTabs shell component with Teams tab wired at empty path with authGuard, and AuthService redirected to /teams post-login.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create Shell component | 9069d4f | shell.ts, shell.html, shell.scss |
| 2 | Wire app.routes.ts and fix AuthService | 7459c82 | app.routes.ts, auth.service.ts, 3 stub components |

## What Was Built

### Shell Component (`apps/frontend/src/app/shell/`)

Standalone Angular component implementing the authenticated layout wrapper:

- `shell.ts`: Imports `IonTabs`, `IonTabBar`, `IonTabButton`, `IonIcon`, `IonLabel`, `IonRouterOutlet` from `@ionic/angular/standalone`. Registers `peopleOutline` icon via `addIcons()` in constructor.
- `shell.html`: Single `<ion-tabs>` root with `<ion-tab-bar slot="bottom">` containing one `<ion-tab-button tab="teams" href="/teams">` with people-outline icon and "Teams" label.
- `shell.scss`: Empty (Ionic handles tab bar styling natively).

### Routing (`apps/frontend/src/app/app.routes.ts`)

Replaced the old flat route table with shell-wrapped authenticated routing:

- Unauthenticated routes (`login`, `signup`, `reset-password`) remain at top level
- Shell route at `path: ''` with `canActivate: [authGuard]` wraps all authenticated routes
- Children: `teams` (TeamsList), `teams/new` (CreateTeam), `teams/:id` (EditTeam)
- Empty path child `redirectTo: 'teams'` handles `/` navigation for authenticated users
- Legacy `path: 'home'` redirects to `/teams` (preserves bookmarks)
- Wildcard `**` redirects to `/login`

### AuthService Fix (`apps/frontend/src/app/auth/auth.service.ts`)

Both `login()` and `signup()` now navigate to `/teams` instead of `/home` (RESEARCH.md Pitfall 3 avoided).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created stub team components to unblock build**

- **Found during:** Task 2 — app.routes.ts references TeamsList, CreateTeam, EditTeam which don't exist yet (plan 06 is wave 3)
- **Issue:** Angular lazy-loaded routes reference component files that do not exist; `nx build frontend` would fail
- **Fix:** Created minimal stub components in `teams-list/teams-list.ts`, `create-team/create-team.ts`, `edit-team/edit-team.ts` — each exports the named class with empty IonContent template
- **Files modified:** 3 new stub files
- **Commit:** 7459c82
- **Note:** Plan 06 (wave 3) will overwrite these stubs with real implementations

## Known Stubs

| File | Reason |
|------|--------|
| `apps/frontend/src/app/teams/teams-list/teams-list.ts` | Stub for build; plan 06 implements real TeamsList component |
| `apps/frontend/src/app/teams/create-team/create-team.ts` | Stub for build; plan 06 implements real CreateTeam component |
| `apps/frontend/src/app/teams/edit-team/edit-team.ts` | Stub for build; plan 06 implements real EditTeam component |

## Verification Results

All checks passed:
- `nx build frontend` exits 0 (TypeScript compilation succeeds)
- `grep -q "canActivate: [authGuard]" app.routes.ts` — PASS
- `grep -q "navigate.*'/teams'" auth.service.ts` — PASS (2 occurrences: login + signup)
- No `navigate.*'/home'` in auth.service.ts — PASS
- Shell component has `IonTabs`, `tab="teams"` attribute matches child route path

## Threat Surface Scan

No new threat surface introduced beyond what is in the plan's threat model:
- `T-03-05-01`: authGuard on shell route blocks unauthenticated access to /teams — mitigated (Phase 2 carries forward)
- `T-03-05-02`: Frontend routing is defense-in-depth only; API enforces JWT — accepted
- `T-03-05-03`: /home redirect reveals no information — accepted

## Self-Check: PASSED

- `apps/frontend/src/app/shell/shell.ts` — EXISTS
- `apps/frontend/src/app/shell/shell.html` — EXISTS
- `apps/frontend/src/app/shell/shell.scss` — EXISTS
- `apps/frontend/src/app/app.routes.ts` — MODIFIED
- `apps/frontend/src/app/auth/auth.service.ts` — MODIFIED
- Commit `9069d4f` — EXISTS (feat(03-05): create Shell component)
- Commit `7459c82` — EXISTS (feat(03-05): wire shell route)
