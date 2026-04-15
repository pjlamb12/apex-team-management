# Concerns

## Overview

The codebase is a fresh Nx scaffold with a single commit. There is no tech debt or accumulated issues. The concerns listed here are gaps between the current scaffold state and the target architecture described in the TRD.

## Scaffold vs. TRD Gap Analysis

The TRD describes a comprehensive team management ecosystem. The current codebase is a default `@nx/angular:application` scaffold. The following gaps are significant:

### Missing Infrastructure (High Priority)

| Gap                          | TRD Reference                        | Impact            |
|------------------------------|--------------------------------------|-------------------|
| No `libs/` directory         | Domain-driven structure required     | Blocks all libs   |
| No NestJS backend            | `apps/api/` with Passport/JWT       | Blocks API work   |
| No PostgreSQL setup          | Database schema defined in TRD      | Blocks data layer |
| No path aliases              | `tsconfig.base.json` paths empty    | Blocks lib imports|

### Missing Frontend Infrastructure (Medium Priority)

| Gap                          | TRD Reference                        | Impact            |
|------------------------------|--------------------------------------|-------------------|
| No Ionic/Capacitor           | PWA/Mobile focus                     | Blocks mobile     |
| No Tailwind CSS              | Primary styling tool per TRD        | Blocks UI work    |
| No `runtime-config-loader`   | Runtime environment management      | Blocks deployment |
| No `ngx-circuit`             | Feature flags                        | Non-blocking      |
| No dark mode implementation  | Signal-based theme toggle           | Blocks theming    |

### Missing Module Boundary Rules

The ESLint `@nx/enforce-module-boundaries` is configured but with wildcard constraints only (`*` → `*`). The TRD's domain-driven structure (`libs/domain/type/name`) will need strict boundary rules:

```
libs/shared  → no external deps (pure logic)
libs/client  → can depend on libs/shared
libs/api     → can depend on libs/shared
apps/*       → can depend on libs/*
```

## Configuration Concerns

| Concern                                     | Severity | Notes                                              |
|---------------------------------------------|----------|-----------------------------------------------------|
| `tsconfig.base.json` uses `moduleResolution: "node"` | Low | Frontend overrides to `"bundler"`, but base may cause issues for future NestJS app |
| No path aliases defined                      | Medium   | Will be needed for `@apex-team/*` library imports   |
| `emitDecoratorMetadata: true` in base        | Info     | Frontend disables it; NestJS may need it            |
| No `.env` management                         | Medium   | Will need environment strategy for API secrets      |

## Security Considerations

- No authentication or authorization exists
- No CORS configuration
- No input validation or sanitization
- No CSP (Content Security Policy) headers configured
- All of these are expected — the app is a bare scaffold

## Performance Considerations

- Production build budgets are configured (500kb warning, 1mb error for initial bundle)
- Component style budgets configured (4kb warning, 8kb error)
- SWC compilation for fast development builds
- No lazy loading configured (routes are empty)

## Code Quality Notes

- Angular strict mode enabled — good foundation
- ESLint with Angular rules configured
- Prettier configured for consistent formatting
- No TODO/FIXME items in the codebase
- Single commit history (`Initial commit`)

## Fragile Areas

None — the codebase is too new to have fragile areas. The primary risk is architectural decisions made in early phases that constrain later work.

## Recommendations

1. **Establish `libs/` structure and path aliases early** — this sets the foundation for all domain-driven work
2. **Configure module boundary rules** before libraries multiply — easier to enforce from the start
3. **Set up the NestJS backend alongside frontend** — the TRD has tight coupling between frontend features and API endpoints
4. **Add Tailwind CSS and Ionic before building UI components** — avoids restyling later
5. **Plan database migrations early** — the TRD has a specific schema that should drive entity design
