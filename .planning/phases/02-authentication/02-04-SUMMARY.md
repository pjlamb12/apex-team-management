---
phase: "02"
plan: "02-04"
subsystem: "authentication"
tags: ["angular", "auth", "services", "guards", "interceptors"]
requires: ["02-01"]
provides: ["Frontend Auth Service", "Auth Guard", "Auth Interceptor", "Route configurations for Auth UI"]
affects: ["apps/frontend/src/app/auth", "apps/frontend/src/app/app.config.ts", "apps/frontend/src/app/app.routes.ts"]
tech-stack:
  added: []
  patterns: ["Signal-based services", "Functional interceptors", "Functional guards"]
key-files:
  created: ["apps/frontend/src/app/auth/auth.service.ts", "apps/frontend/src/app/auth/auth.guard.ts", "apps/frontend/src/app/auth/auth.interceptor.ts"]
  modified: ["apps/frontend/src/app/app.config.ts", "apps/frontend/src/app/app.routes.ts"]
key-decisions:
  - "Used a sliding window for token refresh avoiding dependency loop inside the Interceptor by using native fetch."
  - "Module-level isRefreshing flag added to avoid multi-refresh races."
  - "Used inject() pattern across all created services, guards, and interceptors."
requirements: ["AUTH-01", "AUTH-02", "AUTH-03", "AUTH-04"]
duration: "3 min"
---

# Phase 02 Plan 04: Frontend Auth Foundation

Created the angular HTTP interceptor to handle Auth headers, route guard to check for auth, and stateful AuthService.

## What Was Done
- Built `AuthService` in `apps/frontend/src/app/auth` with `login()`, `signup()`, `logout()`, `refresh()` built atop signals and `fetch()` to handle core auth lifecycle actions.
- Built a functional HTTP Interceptor (`authInterceptor`) checking JWT expiries and appending Authorization Bearer headers to requests.
- Wrote a functional Route Guard (`authGuard`) to block unauthenticated access to system components.
- Stood up basic application routing targeting lazy loaded auth UI.
- Registered the HTTP Interceptor in `app.config.ts`.

## Deviations from Plan

None - ran locally fine however production build fails until UI files are completed.

## Self-Check: PASSED
