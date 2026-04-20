---
phase: 01-workspace-data-foundation
plan: 01
subsystem: infra
tags: [nx, eslint, typescript, monorepo, module-boundaries]

# Dependency graph
requires: []
provides:
  - libs/shared/util/models — shared TypeScript models lib (scope:shared,type:util)
  - libs/client/ui/theme — Angular ThemeService lib (scope:client,type:ui)
  - tsconfig.base.json path aliases for both libs
  - Scope-specific Nx module boundary rules (scope:shared, scope:api, scope:client)
affects:
  - All subsequent phases that import from @apex-team/shared/util/models or @apex-team/client/ui/theme
  - Any lib generation that needs to declare a scope tag

# Tech tracking
tech-stack:
  added:
    - "@nx/js:lib (libs/shared/util/models)"
    - "@nx/angular:lib --buildable (libs/client/ui/theme)"
    - vitest
    - "@nx/vitest"
    - prettier
    - "@nx/eslint"
  patterns:
    - "Nx library tags: scope:{shared|api|client}, type:{util|feature|ui}"
    - "Module boundary enforcement via @nx/enforce-module-boundaries depConstraints"
    - "Path aliases in tsconfig.base.json auto-populated by Nx generators via --importPath"

key-files:
  created:
    - libs/shared/util/models/src/index.ts
    - libs/shared/util/models/project.json
    - libs/client/ui/theme/src/index.ts
    - libs/client/ui/theme/project.json
    - vitest.workspace.ts
  modified:
    - eslint.config.mjs
    - tsconfig.base.json
    - nx.json
    - package.json

key-decisions:
  - "Used --buildable flag for @nx/angular:lib because vitest-angular requires buildable or publishable libs"
  - "Angular lib project named 'theme' by Nx (not 'client-ui-theme'); shared lib named 'models'"
  - "Wildcard depConstraints replaced with 3 scope-specific rules per RESEARCH.md Pattern 2"

patterns-established:
  - "Pattern 1 — Lib generation: Use --importPath flag to ensure tsconfig.base.json paths are auto-populated"
  - "Pattern 2 — Scope isolation: scope:shared → scope:shared only; scope:api → scope:shared + scope:api; scope:client → scope:shared + scope:client"

requirements-completed:
  - INFR-01
  - INFR-02
  - TEAM-03

# Metrics
duration: 8min
completed: 2026-04-15
---

# Phase 01 Plan 01: Nx Library Scaffolding & Module Boundary Rules Summary

**Two Nx libs scaffolded with correct scope tags and path aliases; wildcard boundary rule replaced with scope-specific isolation for shared/api/client.**

## Performance

- **Duration:** ~8 minutes
- **Started:** 2026-04-15T22:22:19Z
- **Completed:** 2026-04-15T22:30:00Z
- **Tasks:** 2 of 2
- **Files modified:** 8 (plus 26 new files in libs/)

## Accomplishments

- Generated `libs/shared/util/models` as a pure TypeScript Nx lib (`@nx/js:lib`) with `scope:shared,type:util` tags and import path `@apex-team/shared/util/models`
- Generated `libs/client/ui/theme` as a buildable Angular Nx lib (`@nx/angular:lib`) with `scope:client,type:ui` tags and import path `@apex-team/client/ui/theme`
- Updated `eslint.config.mjs` to replace permissive wildcard depConstraints with three scope-specific rules that enforce isolation between shared, API, and client layers
- Verified `tsconfig.base.json` paths populated automatically by Nx generators with aliases for both libs
- Confirmed `nx lint frontend` passes with no module boundary violations

## Task Commits

Each task was committed atomically:

1. **Task 1: Generate libs/shared/util/models and libs/client/ui/theme** - `65f0e2d` (feat)
2. **Task 2: Enforce Nx module boundary rules in eslint.config.mjs** - `b2b8fdf` (feat)

**Plan metadata:** See SUMMARY commit below

## Files Created/Modified

- `libs/shared/util/models/src/index.ts` — Barrel export for shared TypeScript models lib
- `libs/shared/util/models/project.json` — Nx project config with tags scope:shared,type:util
- `libs/client/ui/theme/src/index.ts` — Barrel export for Angular ThemeService lib
- `libs/client/ui/theme/project.json` — Nx project config with tags scope:client,type:ui
- `eslint.config.mjs` — Scope-specific module boundary depConstraints
- `tsconfig.base.json` — Path aliases for @apex-team/shared/util/models and @apex-team/client/ui/theme
- `nx.json` — Updated with vitest plugin and lib configurations
- `vitest.workspace.ts` — Vitest workspace config for libs

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Angular lib unitTestRunner flag value**
- **Found during:** Task 1
- **Issue:** Plan specified `--unitTestRunner=vitest` but `@nx/angular:lib` only accepts `vitest-angular`, `vitest-analog`, `jest`, or `none`
- **Fix:** Used `--unitTestRunner=vitest-angular` (correct value for Angular libs) combined with `--buildable` flag (required by vitest-angular per Nx error message)
- **Files modified:** libs/client/ui/theme/project.json — generated as buildable Angular lib
- **Commit:** 65f0e2d

### Notes

- The Nx generator named the Angular lib `theme` (not `client-ui-theme`) and the shared lib `models` (not `shared-util-models`) — this is the Nx default behavior of using the final path segment as the project name
- The verification command in the plan used `shared-util-models` and `client-ui-theme` as project names — these are wrong. Actual names: `models` and `theme`

## Known Stubs

None — this plan creates infrastructure only (lib scaffolding, config). No UI or data flow.

## Threat Flags

None — changes are developer config files (eslint.config.mjs, tsconfig.base.json, lib scaffolding). No network endpoints, auth paths, or trust boundaries introduced.

## Self-Check: PASSED

- `libs/shared/util/models/src/index.ts` — FOUND
- `libs/client/ui/theme/src/index.ts` — FOUND
- `tsconfig.base.json` has `@apex-team/shared/util/models` — FOUND
- `tsconfig.base.json` has `@apex-team/client/ui/theme` — FOUND
- `eslint.config.mjs` has `scope:api` depConstraint — FOUND
- Task 1 commit `65f0e2d` — FOUND
- Task 2 commit `b2b8fdf` — FOUND
- `nx lint frontend` — PASSED
