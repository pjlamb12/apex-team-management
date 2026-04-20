---
phase: 01-workspace-data-foundation
plan: "04"
subsystem: ui
tags: [ionic, tailwind, postcss, angular, dark-mode, scss]

# Dependency graph
requires:
  - phase: 01-01
    provides: Nx workspace scaffold with Angular 21 frontend app at apps/frontend

provides:
  - "@ionic/angular 8.x installed and provideIonicAngular registered in app.config.ts"
  - "Tailwind CSS v4 installed with @tailwindcss/postcss PostCSS plugin"
  - "apps/frontend/.postcssrc.json — Tailwind v4 PostCSS config"
  - "apps/frontend/src/styles.scss — Tailwind entry, @custom-variant dark, @source for libs, all Ionic CSS imports"
  - "apps/frontend/src/app/app.config.ts — IonicRouteStrategy and provideIonicAngular({}) providers"

affects:
  - 01-05-ThemeService
  - all client feature plans that use Ionic components or Tailwind utilities

# Tech tracking
tech-stack:
  added:
    - "@ionic/angular 8.8.3 — Ionic components for Angular standalone"
    - "tailwindcss 4.x — CSS-first utility framework"
    - "@tailwindcss/postcss 4.x — PostCSS plugin for Tailwind v4"
    - "postcss — CSS transformer (peer dependency)"
  patterns:
    - "Tailwind v4 CSS-first: @import 'tailwindcss' instead of @tailwind directives"
    - "@custom-variant dark for class-based dark mode (.dark on <html>)"
    - "@source directive to prevent Tailwind purging lib component classes"
    - "Ionic standalone bootstrap: provideIonicAngular({}) + IonicRouteStrategy in app.config.ts"
    - "Dual dark mode classes: .dark (Tailwind) AND .ion-palette-dark (Ionic 8) applied simultaneously by ThemeService"

key-files:
  created:
    - "apps/frontend/.postcssrc.json — PostCSS plugin config for Tailwind v4"
  modified:
    - "apps/frontend/src/styles.scss — Tailwind entry point + Ionic CSS imports + dark mode variant"
    - "apps/frontend/src/app/app.config.ts — Ionic providers: IonicRouteStrategy, provideIonicAngular({})"
    - "package.json — added @ionic/angular, tailwindcss, @tailwindcss/postcss, postcss"

key-decisions:
  - "Use @import 'tailwindcss' (PostCSS processed) not @use (SCSS syntax) — Pitfall 6"
  - "Add @source directive for libs/client/ui/theme/src to prevent class purging in production — Pitfall 3"
  - "Import @ionic/angular/standalone for standalone component pattern — Pattern 7"
  - "styles.scss imports dark.class.css which uses .ion-palette-dark selector; ThemeService must apply both .dark and .ion-palette-dark simultaneously — Pitfall 2"
  - "No tailwind.config.js created — Tailwind v4 is CSS-first"

patterns-established:
  - "Pattern: Tailwind v4 PostCSS config lives at apps/frontend/.postcssrc.json (app-level, not workspace root)"
  - "Pattern: Ionic standalone providers registered in ApplicationConfig providers array"
  - "Pattern: Dark mode uses @custom-variant dark in CSS — no JS config needed"

requirements-completed: [INFR-01, INFR-02]

# Metrics
duration: 8min
completed: 2026-04-15
---

# Phase 01 Plan 04: Ionic Angular + Tailwind CSS v4 Integration Summary

**@ionic/angular 8 and Tailwind CSS v4 wired into Angular 21 frontend with class-based dark mode via @custom-variant and dual .dark/.ion-palette-dark class strategy**

## Performance

- **Duration:** 8 min
- **Started:** 2026-04-15T22:27:24Z
- **Completed:** 2026-04-15T22:35:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Installed @ionic/angular, tailwindcss, @tailwindcss/postcss, and postcss packages
- Created apps/frontend/.postcssrc.json with @tailwindcss/postcss plugin (Tailwind v4 PostCSS entry point)
- Configured styles.scss with @import "tailwindcss", @custom-variant dark (class-based), @source directive for Nx libs, and all 5 Ionic CSS imports including dark.class.css
- Registered IonicRouteStrategy and provideIonicAngular({}) in app.config.ts for standalone Angular bootstrap
- Confirmed nx build frontend --configuration=development succeeds

## Task Commits

Each task was committed atomically:

1. **Task 1: Install Ionic and Tailwind CSS packages, create PostCSS config** - `a466e2d` (chore)
2. **Task 2: Configure styles.scss and app.config.ts for Ionic + Tailwind** - `645450a` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `apps/frontend/.postcssrc.json` - Tailwind v4 PostCSS plugin config; required for @import "tailwindcss" to be processed
- `apps/frontend/src/styles.scss` - Global stylesheet: Tailwind entry, dark variant override, @source for libs, all Ionic CSS imports
- `apps/frontend/src/app/app.config.ts` - Added IonicRouteStrategy (RouteReuseStrategy provider) and provideIonicAngular({})
- `package.json` / `package-lock.json` - Added @ionic/angular, tailwindcss, @tailwindcss/postcss, postcss

## Decisions Made

- Imported from `@ionic/angular/standalone` (not `@ionic/angular`) — correct import path for Angular standalone component pattern (RESEARCH.md Pattern 7)
- Used `@import "tailwindcss"` (not `@use`) in .scss — SCSS @use syntax is not processed by Tailwind v4 PostCSS (Pitfall 6)
- Added `@source "../../../libs/client/ui/theme/src"` directive — prevents Tailwind from purging classes in Nx lib templates during production build (Pitfall 3)
- Imported `@ionic/angular/css/palettes/dark.class.css` — Ionic 8 uses `.ion-palette-dark` class (not `.dark`) for dark palette; ThemeService (Plan 05) must apply both classes simultaneously (Pitfall 2)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

A SASS deprecation warning appeared during build: `@import` is deprecated in SCSS (Sass is moving to `@use`). This warning originates from SCSS's own `@import` syntax for the Ionic CSS files and does not affect functionality. The `@import "tailwindcss"` line is processed by PostCSS before SCSS sees it and does not trigger this warning. The build succeeds and all Tailwind/Ionic functionality works correctly. The warning will be resolved in a future cleanup pass when SCSS `@use` syntax for CSS imports is standardized.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Ionic component system is registered and ready for use in Angular standalone components
- Tailwind CSS v4 utilities are available across the frontend app and libs/client/ui/theme
- Dark mode infrastructure is CSS-ready: `.dark` class activates Tailwind dark: utilities, `.ion-palette-dark` activates Ionic dark palette
- ThemeService (Plan 05) can now implement the class-toggling logic — the CSS hooks are in place
- Any new Nx lib under `libs/client/` that the frontend consumes will need its own `@source` entry added to styles.scss

---
*Phase: 01-workspace-data-foundation*
*Completed: 2026-04-15*
