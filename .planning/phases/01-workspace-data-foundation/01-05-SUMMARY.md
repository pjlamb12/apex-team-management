---
phase: 01-workspace-data-foundation
plan: 05
subsystem: shared-models, client-theme
tags: [models, theme, dark-mode, typescript-interfaces, angular-signals]
dependency_graph:
  requires: ["01-01", "01-04"]
  provides: ["shared-model-interfaces", "theme-service"]
  affects: ["all plans consuming @apex-team/shared/util/models", "all plans consuming @apex-team/client/ui/theme"]
tech_stack:
  added: []
  patterns: ["Angular signal-based service", "TDD RED/GREEN", "pure TypeScript interfaces"]
key_files:
  created:
    - libs/shared/util/models/src/lib/sport.model.ts
    - libs/shared/util/models/src/lib/user.model.ts
    - libs/shared/util/models/src/lib/team.model.ts
    - libs/shared/util/models/src/lib/player.model.ts
    - libs/shared/util/models/src/lib/season.model.ts
    - libs/shared/util/models/src/lib/game.model.ts
    - libs/shared/util/models/src/lib/game-event.model.ts
    - libs/client/ui/theme/src/lib/theme.service.ts
    - libs/client/ui/theme/src/lib/theme.service.spec.ts
  modified:
    - libs/shared/util/models/src/index.ts
    - libs/client/ui/theme/src/index.ts
decisions:
  - "Used vi.stubGlobal for localStorage mock because @nx/angular:unit-test executor provides a non-standard localStorage stub without .clear()"
  - "Added TestBed.flushEffects() after toggle() calls to flush Angular signal effects before asserting DOM state"
metrics:
  duration: "~15 minutes"
  completed: "2026-04-15"
  tasks_completed: 2
  files_modified: 11
---

# Phase 1 Plan 5: Shared Models and ThemeService Summary

**One-liner:** 7 pure TypeScript model interfaces plus signal-based ThemeService applying both .dark (Tailwind) and .ion-palette-dark (Ionic 8) classes simultaneously.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | ThemeService TDD (RED+GREEN) | 12416a4 (RED), f71f4bb (GREEN) | theme.service.spec.ts, theme.service.ts, index.ts |
| 2 | 7 shared model interfaces | fbf3e27 | 7 model files + index.ts |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed localStorage incompatibility with @nx/angular:unit-test executor**
- **Found during:** Task 1 (GREEN phase)
- **Issue:** The `@nx/angular:unit-test` executor provides a custom localStorage stub that does not implement `.clear()`, causing `TypeError: localStorage.clear is not a function` in 8 of 9 tests.
- **Fix:** Replaced `localStorage.clear()` calls with `vi.stubGlobal('localStorage', createLocalStorageMock())` using a full in-memory Storage implementation. Added `vi.unstubAllGlobals()` in `afterEach`.
- **Files modified:** `libs/client/ui/theme/src/lib/theme.service.spec.ts`
- **Commit:** f71f4bb

**2. [Rule 3 - Blocking] Added TestBed.flushEffects() for Angular signal effect flushing**
- **Found during:** Task 1 (GREEN phase)
- **Issue:** Angular `effect()` runs asynchronously after signal changes. Tests asserting DOM classList or localStorage state after `toggle()` were reading stale values.
- **Fix:** Added `TestBed.flushEffects()` after each `service.toggle()` call in tests that assert side effects.
- **Files modified:** `libs/client/ui/theme/src/lib/theme.service.spec.ts`
- **Commit:** f71f4bb

## Verification Results

1. `npx nx test theme --watch=false` — 9 tests pass (2 test files)
2. `grep "ion-palette-dark" libs/client/ui/theme/src/lib/theme.service.ts` — present
3. `grep "@Entity" libs/shared/util/models/src/lib/*.ts` — returns only D-11 comment, no actual decorator
4. `grep "positionTypes" libs/shared/util/models/src/lib/sport.model.ts` — present
5. `grep "playersOnField" libs/shared/util/models/src/lib/team.model.ts` — present
6. Barrel `libs/shared/util/models/src/index.ts` — exports all 7 interfaces
7. Barrel `libs/client/ui/theme/src/index.ts` — exports ThemeService

## TDD Gate Compliance

- RED gate commit: `12416a4` (test(01-05): add failing ThemeService spec)
- GREEN gate commit: `f71f4bb` (feat(01-05): implement ThemeService)
- Gate sequence: PASSED

## Self-Check: PASSED

- `libs/client/ui/theme/src/lib/theme.service.ts` — FOUND
- `libs/client/ui/theme/src/lib/theme.service.spec.ts` — FOUND
- `libs/shared/util/models/src/lib/sport.model.ts` — FOUND
- `libs/shared/util/models/src/lib/team.model.ts` — FOUND
- `libs/shared/util/models/src/lib/season.model.ts` — FOUND
- `libs/shared/util/models/src/lib/game.model.ts` — FOUND
- Commits 12416a4, f71f4bb, fbf3e27 — all verified in git log
