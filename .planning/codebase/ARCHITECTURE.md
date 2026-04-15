# Architecture

## Overview

The project is a freshly scaffolded Nx monorepo with a single Angular application. No architectural patterns have been implemented yet beyond the default scaffold. The TRD describes a domain-driven library architecture that has not been created.

## Current Pattern

**Scaffold-only** — The existing codebase is a default Nx Angular application generated via `@nx/angular:application`. It contains:

- A root `App` component with the default NxWelcome page
- An empty route configuration
- Standard Angular bootstrapping via `bootstrapApplication()`

## Layers (Current)

```
┌─────────────────────┐
│   Angular Frontend   │  apps/frontend/
│   (Standalone App)   │
└─────────────────────┘
```

No additional layers exist. The TRD describes a multi-layer architecture:

```
┌─────────────────────┐
│   Angular/Ionic UI   │  apps/frontend/ (+ Capacitor)
├─────────────────────┤
│   Client Libraries   │  libs/client/feature/*, libs/client/ui/*
├─────────────────────┤
│   Shared Libraries   │  libs/shared/util/*
├─────────────────────┤
│   NestJS API         │  apps/api/ (planned)
├─────────────────────┤
│   API Libraries      │  libs/api/feature/*, libs/api/data-access/*
├─────────────────────┤
│   PostgreSQL         │  Database (planned)
└─────────────────────┘
```

## Data Flow (Current)

No data flow exists. The app renders a static NxWelcome page.

## Entry Points

| Entry Point                          | File                                    |
|--------------------------------------|-----------------------------------------|
| Angular bootstrap                    | `apps/frontend/src/main.ts`             |
| Root component                       | `apps/frontend/src/app/app.ts`          |
| Route definitions                    | `apps/frontend/src/app/app.routes.ts`   |
| Application config (providers)       | `apps/frontend/src/app/app.config.ts`   |
| HTML shell                           | `apps/frontend/src/index.html`          |
| Global styles                        | `apps/frontend/src/styles.scss`         |

## Key Abstractions

### Angular Application Config

`apps/frontend/src/app/app.config.ts` — Uses functional `ApplicationConfig` pattern with `provideRouter()` and `provideBrowserGlobalErrorListeners()`. This is the modern Angular approach (no NgModule).

### Standalone Components

`apps/frontend/src/app/app.ts` — Uses `@Component({ imports: [...] })` with inline imports. No NgModule-based architecture.

## Module Boundaries

ESLint is configured with `@nx/enforce-module-boundaries` but no `depConstraints` are defined beyond the wildcard (`*` can depend on `*`). The TRD's domain-driven structure (`libs/domain/type/name`) will require proper boundary rules.

## Build Pipeline

```
Source → SWC/esbuild → dist/apps/frontend/browser/
```

- Angular 21 uses the new `@angular/build:application` executor (esbuild-based)
- TypeScript compiled via SWC for speed
- Output to `dist/apps/frontend/`
