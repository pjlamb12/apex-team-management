# Phase 1: Workspace & Data Foundation - Research

**Researched:** 2026-04-14
**Domain:** Nx monorepo setup, NestJS + TypeORM + PostgreSQL, Ionic Angular, Tailwind CSS v4, TypeScript data models
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01 Library Scaffolding Scope:** Create only the libs Phase 1 requires: `libs/shared/util/models` and `libs/client/ui/theme`. All other libs from the TRD are created by the phase that first needs them.

**D-02 Sport Entity:** Stores position types (named zones) only: Goalkeeper, Defender, Midfielder, Forward. Field size and period structure are team-level settings.

**D-03 Team Entity:** Stores `players_on_field` (integer), `period_count` (integer), `period_length_minutes` (integer).

**D-04 Soccer Seed Data:** Sport name "Soccer", position types: ["Goalkeeper", "Defender", "Midfielder", "Forward"]. No field size or period type in the sport record.

**D-05 Season Entity:** Included in Phase 1's shared TypeScript models and database schema. Season management UI is deferred.

**D-06 Season Relationships:** `Team` has many `Seasons`. `Season` has many `Games`. Players can have season-specific statuses.

**D-07 Theme Default:** Defaults to OS preference (`prefers-color-scheme`) on first load. Manual toggle persists to localStorage.

**D-08 ThemeService:** Lives in `libs/client/ui/theme`. Manages a Signal for the current theme and applies/removes the `.dark` class on `<html>`.

**D-09 Dark Mode Strategy:** Tailwind class-based strategy (`darkMode: 'class'` equivalent in Tailwind v4 via `@custom-variant`). Ionic components use CSS custom property overrides scoped under `.dark` (but see research note — Ionic 8+ uses `.ion-palette-dark`).

**D-10 TypeORM Migrations:** `synchronize: false` in all environments from day one. All schema changes go through TypeORM migration files.

**D-11 Entity Location:** `@Entity` decorators in `libs/api/data-access/*` libs (per-phase). Phase 1 uses `apps/api/src/entities/` as temporary home until data-access libs are created. Shared TypeScript interfaces (no decorators) in `libs/shared/util/models`.

### Claude's Discretion

- NestJS configuration: use `@nestjs/config` with `.env` files
- TypeORM datasource configuration file location: `src/data-source.ts`
- Nx boundary tag schema: `scope:shared`, `scope:api`, `scope:client`, `type:util`, `type:feature`, `type:ui`
- Vitest is the test runner (already in scaffold, overrides TRD's mention of Jest)

### Deferred Ideas (OUT OF SCOPE)

- Season management UI
- Tournament entity
- runtime-config-loader
- Additional sport seeds (basketball, volleyball)
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| INFR-01 | App is mobile-first responsive (works well on phone browsers) | Ionic Framework + Tailwind responsive utilities provide mobile-first layout; covered by Ionic component system and Tailwind breakpoints |
| INFR-02 | App uses "Athletic Professional" design with dark mode support | ThemeService + Tailwind v4 `@custom-variant dark` + Ionic `.ion-palette-dark` palette import covers full dark mode stack |
| TEAM-03 | Sport selection configures positions and field size automatically | Soccer Sport entity seed with position_types JSONB field; Team entity reads sport positions on creation |
</phase_requirements>

---

## Summary

Phase 1 is a pure scaffolding phase — no user-facing flows, but every subsequent phase depends on what's built here. The work divides into four concrete tracks: (1) Nx library structure and module boundary rules, (2) NestJS API app with PostgreSQL/TypeORM and migrations, (3) Angular frontend with Ionic 8 + Tailwind CSS v4 integration and dark mode theming, and (4) shared TypeScript models plus the Soccer sport seed.

The stack is well-defined in the TRD and locked by CONTEXT.md decisions. The most technically nuanced integration is the dark mode layer: Tailwind v4 uses a CSS-first `@custom-variant` directive instead of a JavaScript config, and Ionic 8 uses `.ion-palette-dark` rather than `.dark` as its palette class. These are compatible by applying both classes to `<html>` simultaneously — the `ThemeService` applies `.dark` (for Tailwind utilities) and `.ion-palette-dark` (for Ionic palette) together. TypeORM migration workflow in an Nx monorepo requires a standalone `data-source.ts` file outside NestJS bootstrap because the TypeORM CLI cannot invoke the NestJS DI container.

**Primary recommendation:** Scaffold in wave order — Nx structure first, then API app with database connectivity, then Angular theme integration, then models + seed data. Each wave is independently testable before proceeding.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| TypeScript interfaces (User, Team, Player, Sport, Game, Season, GameEvent) | Shared lib (`libs/shared/util/models`) | — | Framework-agnostic types consumed by both API and client |
| Database schema & migrations | API app (`apps/api/src/entities/`, `src/migrations/`) | — | TypeORM entities + migration files live server-side |
| PostgreSQL connection config | API app (`apps/api/src/`) | — | NestJS `TypeOrmModule.forRootAsync()` with ConfigService |
| Soccer sport seed | API app (`apps/api/src/`) | — | Server-side migration or seeder that runs at startup |
| ThemeService + dark mode toggle | Client lib (`libs/client/ui/theme`) | Frontend app (`app.config.ts`) | Service logic in lib; provided at app bootstrap |
| Tailwind CSS configuration | Frontend app (`apps/frontend/`) | — | PostCSS config + styles.scss entry point are app-level |
| Ionic integration | Frontend app (`app.config.ts`) | Client components | `provideIonicAngular()` in app config; Ionic components in feature libs |
| Nx tag boundary rules | Root (`eslint.config.mjs`) | Project `project.json` files | Lint rule in root config; tags in each project.json |

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@nx/nest` | 22.6.5 | Nx plugin for NestJS apps and libs | Provides `@nx/nest:app` and `@nx/nest:lib` generators matching workspace version |
| `@nestjs/core` | 11.1.19 | NestJS framework core | TRD mandates NestJS for API layer |
| `@nestjs/common` | 11.1.19 | NestJS common utilities | Required alongside core |
| `@nestjs/platform-express` | 11.1.19 | HTTP adapter (Express) | Default NestJS HTTP platform |
| `@nestjs/config` | 4.0.4 | Environment variable management | Claude's Discretion: use for DB connection strings |
| `@nestjs/typeorm` | 11.0.1 | NestJS TypeORM integration module | Official NestJS ↔ TypeORM bridge |
| `typeorm` | 0.3.28 | ORM for PostgreSQL | TRD mandates TypeORM with PostgreSQL |
| `pg` | 8.20.0 | PostgreSQL driver for Node.js | TypeORM's PostgreSQL driver |
| `reflect-metadata` | 0.2.2 | Decorator metadata (required by TypeORM) | TypeORM and NestJS both require it |
| `@ionic/angular` | 8.8.3 | Ionic components for Angular standalone | TRD mandates Ionic/Capacitor for PWA/mobile |
| `tailwindcss` | 4.2.2 | Utility-first CSS | TRD mandates Tailwind as primary styling |
| `@tailwindcss/postcss` | 4.2.2 | PostCSS plugin for Tailwind v4 | Required for v4 PostCSS integration |
| `postcss` | Latest | CSS transformer | Required by Tailwind v4 PostCSS pipeline |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `typeorm-extension` | 3.9.0 | Database seeder utility for TypeORM | Soccer sport seed data; avoids writing raw migration SQL for static config data |
| `@types/pg` | Latest | TypeScript types for pg driver | Dev dependency for type safety |
| `cross-env` | Latest | Cross-platform env vars in npm scripts | Migration CLI scripts need NODE_ENV on Windows/Mac parity |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `typeorm-extension` seeder | TypeORM migration with hardcoded INSERT | Migration is simpler (no extra dep) but conflates schema migrations with data seeding — confusing to revert. `typeorm-extension` separates concerns cleanly. Either is valid for Phase 1. |
| `@nestjs/config` | `dotenv` directly | `@nestjs/config` integrates with ConfigService (injectable), required for `TypeOrmModule.forRootAsync()`. Use it. |
| Tailwind v4 `@custom-variant` | Tailwind v3 `darkMode: 'class'` config | v4 is the current version; v3 config approach is deprecated in v4. Use v4 CSS-first approach. |

**Installation:**
```bash
# API dependencies
npm install @nestjs/core @nestjs/common @nestjs/platform-express @nestjs/config @nestjs/typeorm typeorm pg reflect-metadata

# API dev dependencies
npm install --save-dev @nx/nest @types/pg

# Frontend dependencies
npm install @ionic/angular tailwindcss @tailwindcss/postcss postcss

# Optional: seeder
npm install --save-dev typeorm-extension
```

**Version verification:** All versions verified via `npm view <package> version` on 2026-04-14. [VERIFIED: npm registry]

---

## Architecture Patterns

### System Architecture Diagram

```
Developer Requests
        |
        v
[Nx Workspace Root]
    |           |
    v           v
[apps/api]   [apps/frontend]
    |               |
    |   TypeORM     |   Angular 21 + Ionic 8 + Tailwind v4
    v               v
[PostgreSQL DB]  [Browser / Mobile]
    ^
    |
[libs/shared/util/models]  <-- shared TypeScript interfaces
    ^               ^
    |               |
[apps/api]      [apps/frontend]
                    |
                [libs/client/ui/theme]
                    |
                ThemeService (Signal)
                applies .dark + .ion-palette-dark to <html>
```

**Data flow for dark mode toggle:**
```
User clicks toggle
    -> ThemeService.toggle()
    -> updates signal: theme = 'dark' | 'light'
    -> document.documentElement.classList: add/remove 'dark' AND 'ion-palette-dark'
    -> localStorage.setItem('theme', value)
    -> Tailwind dark: utilities activate (via @custom-variant dark)
    -> Ionic palette CSS variables activate (via .ion-palette-dark selector)
```

**Data flow for sport seed:**
```
[apps/api/src/migrations/]  or  [apps/api/src/seeds/]
    -> typeorm migration:run  (or typeorm-extension seed:run)
    -> INSERT INTO sports (name, position_types) VALUES (...)
    -> Sport entity row exists in DB
```

### Recommended Project Structure

```
apex-team/
├── apps/
│   ├── api/                          # NestJS API application
│   │   ├── src/
│   │   │   ├── app.module.ts         # Root NestJS module
│   │   │   ├── app.controller.ts     # Health check endpoint
│   │   │   ├── main.ts               # Bootstrap entry point
│   │   │   ├── data-source.ts        # TypeORM DataSource for CLI (standalone)
│   │   │   ├── entities/             # Temporary @Entity home (Phase 1 only)
│   │   │   │   ├── sport.entity.ts
│   │   │   │   ├── user.entity.ts
│   │   │   │   ├── team.entity.ts
│   │   │   │   ├── player.entity.ts
│   │   │   │   ├── season.entity.ts
│   │   │   │   ├── game.entity.ts
│   │   │   │   └── game-event.entity.ts
│   │   │   ├── migrations/           # TypeORM migration files
│   │   │   │   └── TIMESTAMP-InitialSchema.ts
│   │   │   └── seeds/                # (optional) typeorm-extension seeds
│   │   │       └── sport.seeder.ts
│   │   ├── .env                      # DB connection (not committed)
│   │   ├── .env.example              # Committed template
│   │   └── project.json              # Nx project config with migration targets
│   └── frontend/                     # Existing Angular 21 app
│       ├── src/
│       │   ├── app/
│       │   │   └── app.config.ts     # Add provideIonicAngular, IonicRouteStrategy
│       │   └── styles.scss           # Add @import "tailwindcss", Ionic imports
│       └── .postcssrc.json           # Tailwind v4 PostCSS config (app root)
├── libs/
│   ├── shared/
│   │   └── util/
│   │       └── models/               # @nx/js:lib — TypeScript interfaces only
│   │           └── src/
│   │               ├── index.ts
│   │               └── lib/
│   │                   ├── user.model.ts
│   │                   ├── team.model.ts
│   │                   ├── player.model.ts
│   │                   ├── sport.model.ts
│   │                   ├── season.model.ts
│   │                   ├── game.model.ts
│   │                   └── game-event.model.ts
│   └── client/
│       └── ui/
│           └── theme/                # @nx/angular:lib — ThemeService
│               └── src/
│                   ├── index.ts
│                   └── lib/
│                       └── theme.service.ts
└── tsconfig.base.json                # Add path aliases when libs are created
```

### Pattern 1: Nx Library Generation with Tags

**What:** Generate libs with proper scope and type tags so module boundary rules can be enforced.
**When to use:** Every lib creation in Phase 1 (and all future phases).

```bash
# Shared TypeScript models lib (no framework, pure TypeScript)
nx g @nx/js:lib libs/shared/util/models \
  --bundler=none \
  --unitTestRunner=vitest \
  --linter=eslint \
  --tags="scope:shared,type:util"

# Client theme lib (Angular standalone)
nx g @nx/angular:lib libs/client/ui/theme \
  --standalone \
  --unitTestRunner=vitest \
  --linter=eslint \
  --tags="scope:client,type:ui" \
  --importPath="@apex-team/client/ui/theme"

# NestJS API app
nx g @nx/nest:app apps/api \
  --frontendProject=frontend \
  --tags="scope:api"
```

Source: [VERIFIED: https://nx.dev/nx-api/nest/generators/library], [VERIFIED: https://nx.dev/docs/features/enforce-module-boundaries]

### Pattern 2: Nx Module Boundary Rules (Flat Config)

**What:** `@nx/enforce-module-boundaries` in root `eslint.config.mjs` with scope + type tag constraints.
**When to use:** Configure once in Phase 1; all subsequent phases inherit.

```javascript
// eslint.config.mjs — replace the wildcard depConstraints with:
{
  sourceTag: 'scope:shared',
  onlyDependOnLibsWithTags: ['scope:shared'],
},
{
  sourceTag: 'scope:api',
  onlyDependOnLibsWithTags: ['scope:shared', 'scope:api'],
},
{
  sourceTag: 'scope:client',
  onlyDependOnLibsWithTags: ['scope:shared', 'scope:client'],
},
```

Source: [VERIFIED: https://nx.dev/docs/features/enforce-module-boundaries]

### Pattern 3: TypeORM Module (Async, ConfigService)

**What:** Configure TypeORM via `forRootAsync` + `ConfigService` so DB credentials come from `.env`.
**When to use:** `AppModule` in `apps/api/src/app.module.ts`.
**Critical:** `synchronize: false` (D-10).

```typescript
// Source: https://context7.com/nestjs/typeorm/llms.txt [VERIFIED: Context7]
TypeOrmModule.forRootAsync({
  useFactory: (configService: ConfigService) => ({
    type: 'postgres',
    host: configService.get('DB_HOST'),
    port: configService.get<number>('DB_PORT'),
    username: configService.get('DB_USERNAME'),
    password: configService.get('DB_PASSWORD'),
    database: configService.get('DB_NAME'),
    entities: [__dirname + '/entities/**/*.entity{.ts,.js}'],
    synchronize: false,       // D-10: NEVER true
    migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
    migrationsRun: false,     // Run migrations via CLI, not auto
  }),
  inject: [ConfigService],
}),
```

### Pattern 4: TypeORM Data Source (CLI-only file)

**What:** A standalone `data-source.ts` file that the TypeORM CLI uses directly (outside NestJS DI container).
**When to use:** Required for `typeorm migration:generate` and `typeorm migration:run` CLI commands.

```typescript
// apps/api/src/data-source.ts
// Source: TypeORM docs [VERIFIED: Context7 /typeorm/typeorm]
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config({ path: __dirname + '/../.env' });

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'apex_team',
  entities: [__dirname + '/entities/**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
  synchronize: false,
  migrationsTableName: 'migrations',
});
```

### Pattern 5: TypeORM Migration Targets in project.json

**What:** Nx project.json targets that wrap TypeORM CLI commands.
**When to use:** `apps/api/project.json` — enables `nx run api:migration:generate`, etc.

```json
// apps/api/project.json — add to targets
"migration:generate": {
  "executor": "nx:run-commands",
  "options": {
    "command": "npx typeorm-ts-node-esm migration:generate apps/api/src/migrations/{args.name} -d apps/api/src/data-source.ts",
    "cwd": "{workspaceRoot}"
  }
},
"migration:run": {
  "executor": "nx:run-commands",
  "options": {
    "command": "npx typeorm-ts-node-esm migration:run -d apps/api/src/data-source.ts",
    "cwd": "{workspaceRoot}"
  }
},
"migration:revert": {
  "executor": "nx:run-commands",
  "options": {
    "command": "npx typeorm-ts-node-esm migration:revert -d apps/api/src/data-source.ts",
    "cwd": "{workspaceRoot}"
  }
}
```

Source: [CITED: https://www.thisdot.co/blog/setting-up-typeorm-migrations-in-an-nx-nestjs-project]

### Pattern 6: Tailwind v4 PostCSS + Dark Mode

**What:** Tailwind v4 is CSS-first. No `tailwind.config.js` file needed. PostCSS config at app root.
**When to use:** `apps/frontend/.postcssrc.json` and `apps/frontend/src/styles.scss`.

```json
// apps/frontend/.postcssrc.json
// Source: https://tailwindcss.com/docs/installation/framework-guides/angular [VERIFIED]
{
  "plugins": {
    "@tailwindcss/postcss": {}
  }
}
```

```scss
// apps/frontend/src/styles.scss
// Source: https://tailwindcss.com/docs/dark-mode [VERIFIED]
@import "tailwindcss";

// Override dark variant to use .dark class on <html>
@custom-variant dark (&:where(.dark, .dark *));

// Ionic core CSS
@import "@ionic/angular/css/core.css";
@import "@ionic/angular/css/normalize.css";
@import "@ionic/angular/css/structure.css";
@import "@ionic/angular/css/typography.css";
// Ionic dark palette (class-based) — uses .ion-palette-dark on <html>
@import "@ionic/angular/css/palettes/dark.class.css";
```

**SCSS + Tailwind v4 note:** Tailwind v4 is not designed as a SCSS preprocessor plugin. The correct approach is: `@import "tailwindcss"` runs through PostCSS first, SCSS processes the rest. Use `@import` (not `@use`) for Tailwind in `.scss` files. [VERIFIED: https://tailwindcss.com/docs/upgrade-guide, discussion on GitHub]

### Pattern 7: Ionic Angular Standalone Bootstrap

**What:** Configure Ionic in `app.config.ts` using standalone providers.
**When to use:** `apps/frontend/src/app/app.config.ts`.

```typescript
// Source: https://ionicframework.com/docs/angular/add-to-existing [VERIFIED: Context7]
import { provideIonicAngular, IonicRouteStrategy } from '@ionic/angular/standalone';
import { RouteReuseStrategy } from '@angular/router';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular({}),
    provideRouter(appRoutes),
  ],
};
```

### Pattern 8: ThemeService with Signal

**What:** Angular Signal-based service that manages dark mode state, persists to localStorage, and applies CSS classes.
**When to use:** `libs/client/ui/theme/src/lib/theme.service.ts`.
**Critical:** Must apply BOTH `.dark` (for Tailwind) AND `.ion-palette-dark` (for Ionic 8) when enabling dark mode (see Pitfall 2).

```typescript
// Source: Angular Signals docs [VERIFIED: angular.dev]
import { Injectable, signal, effect } from '@angular/core';

type Theme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  protected theme = signal<Theme>(this.getInitialTheme());

  constructor() {
    effect(() => {
      const isDark = this.theme() === 'dark';
      document.documentElement.classList.toggle('dark', isDark);
      document.documentElement.classList.toggle('ion-palette-dark', isDark);
      localStorage.setItem('theme', this.theme());
    });
  }

  toggle(): void {
    this.theme.update(t => t === 'dark' ? 'light' : 'dark');
  }

  isDark(): boolean {
    return this.theme() === 'dark';
  }

  private getInitialTheme(): Theme {
    const stored = localStorage.getItem('theme') as Theme | null;
    if (stored) return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
}
```

### Pattern 9: Shared TypeScript Models (Phase 1 scope)

**What:** Interface definitions in `libs/shared/util/models`. No `@Entity` decorators — pure TypeScript.
**When to use:** All entities relevant to Phase 1 schema.

```typescript
// libs/shared/util/models/src/lib/sport.model.ts
export interface Sport {
  id: string;
  name: string;
  positionTypes: string[];   // e.g. ["Goalkeeper", "Defender", "Midfielder", "Forward"]
  isEnabled: boolean;
}

// libs/shared/util/models/src/lib/team.model.ts
export interface Team {
  id: string;
  name: string;
  sportId: string;
  playersOnField: number;
  periodCount: number;
  periodLengthMinutes: number;
  seasons?: Season[];
}

// libs/shared/util/models/src/lib/season.model.ts
export interface Season {
  id: string;
  teamId: string;
  name: string;         // e.g. "Fall 2026"
  startDate: string;    // ISO date
  endDate: string;
  isActive: boolean;
}
```

### Anti-Patterns to Avoid

- **Using `synchronize: true` in TypeORM:** Destroys production data silently on entity changes. D-10 mandates `synchronize: false` always.
- **Putting `@Entity` decorators in `libs/shared/util/models`:** These are shared TypeScript interfaces — no decorators. Entities belong in API layer (D-11).
- **Creating all TRD libs in Phase 1:** D-01 explicitly restricts Phase 1 to `libs/shared/util/models` and `libs/client/ui/theme` only.
- **Using wildcard `*` module boundary tag constraint:** The existing `eslint.config.mjs` has a permissive wildcard rule. Phase 1 must replace it with scope-specific constraints.
- **Using `@tailwind base/components/utilities` syntax in SCSS:** That is Tailwind v3 syntax. Tailwind v4 uses `@import "tailwindcss"`.
- **Forgetting `@source` directive for Nx libs:** Tailwind v4 scans from `process.cwd()` by default, which in an Nx workspace may not find templates in `libs/`. Use `@source` directives or configure content paths.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Environment variable injection | Custom `process.env` reader | `@nestjs/config` + `ConfigService` | Injectable, testable, validated at startup |
| DB connection management | Manual `pg` Pool | `@nestjs/typeorm` `TypeOrmModule` | Handles connection pooling, retries, lifecycle hooks |
| TypeORM migration tracking | Custom migration table | TypeORM's built-in `migrationsTableName` | Tracks applied migrations, handles ordering |
| Dark mode persistence | Custom localStorage hook | Signal + `effect()` in ThemeService | Reactive, testable, SSR-safe |
| Ionic component theming | Custom CSS variables from scratch | `@ionic/angular/css/palettes/dark.class.css` | Ionic's 200+ variables pre-wired for all components |
| Module boundary enforcement | Manual import audits | `@nx/enforce-module-boundaries` ESLint rule | Automated, fails CI on boundary violations |

**Key insight:** TypeORM's migration CLI requires a standalone `DataSource` file — it cannot bootstrap NestJS to get its configuration. This is a mandatory architectural split: the `AppModule` uses `TypeOrmModule.forRootAsync()` (DI-friendly), while `data-source.ts` reads env vars directly (CLI-friendly).

---

## Common Pitfalls

### Pitfall 1: TypeORM Entity Glob Patterns in Nx Webpack Builds

**What goes wrong:** TypeORM `entities: ['**/*.entity.ts']` glob patterns fail when Nx compiles everything to a single bundle. The paths no longer resolve.
**Why it happens:** Nx/Webpack collapses file structure; runtime glob paths don't match compiled output.
**How to avoid:** Use `autoLoadEntities: true` in `TypeOrmModule.forRootAsync()` AND register entities explicitly in each feature module via `TypeOrmModule.forFeature([EntityClass])`. For the standalone `data-source.ts` (CLI only), use explicit entity class imports, not globs.
**Warning signs:** `EntityMetadataNotFoundError` or empty migration diffs at runtime.

Source: [CITED: https://medium.com/@p3rf/solving-issue-with-entities-loading-for-a-nx-dev-monorepo-setup-with-nest-js-and-typeorm-282d4491f0bc]

### Pitfall 2: Ionic 8 Dark Mode Class Changed from `.dark` to `.ion-palette-dark`

**What goes wrong:** Importing `@ionic/angular/css/palettes/dark.class.css` and applying `.dark` to `<html>` has no effect on Ionic components. Ionic components render light-mode colors regardless of `.dark` class.
**Why it happens:** Ionic 8+ changed its dark palette class from `.dark` (Ionic 7) to `.ion-palette-dark`. The imported CSS is scoped to `.ion-palette-dark`, not `.dark`.
**How to avoid:** Apply BOTH classes when enabling dark mode:
```typescript
document.documentElement.classList.toggle('dark', isDark);        // Tailwind
document.documentElement.classList.toggle('ion-palette-dark', isDark); // Ionic 8
```
D-09 says "scoped under `.dark`" but this is superseded by Ionic 8's actual behavior. The ThemeService MUST manage both classes.
**Warning signs:** Tailwind dark utilities work but Ionic components (toolbar, card, list) remain light.

Source: [VERIFIED: https://ionicframework.com/docs/theming/dark-mode]

### Pitfall 3: Tailwind v4 Scans Only `process.cwd()` by Default in Nx

**What goes wrong:** In development, Tailwind generates classes from `apps/frontend/`. In production, classes used only in `libs/client/` components get purged.
**Why it happens:** Tailwind v4 PostCSS plugin defaults to scanning from `process.cwd()` which in an Nx workspace is the workspace root — but Angular's build may run from the app directory.
**How to avoid:** Add explicit `@source` directives in `styles.scss` for each lib the frontend app consumes:
```scss
@import "tailwindcss" source("./src");
@source "../../../libs/client/ui/theme/src";
```
As libs are added in future phases, add corresponding `@source` entries.
**Warning signs:** Classes visible in dev but missing from production bundle.

Source: [CITED: https://nx.dev/blog/setup-tailwind-4-angular-nx-workspace]

### Pitfall 4: `tsconfig.base.json` `paths` Not Updated After Lib Generation

**What goes wrong:** Lib is generated, TypeScript compiles fine inside the lib, but importing `@apex-team/shared/models` from `apps/frontend` gives "cannot find module" errors.
**Why it happens:** Nx generators automatically add path aliases to `tsconfig.base.json`, but only if `--importPath` is specified during generation. Without it, no alias is created.
**How to avoid:** Specify `--importPath` for every lib: `--importPath="@apex-team/shared/util/models"`. Verify `tsconfig.base.json` `paths` after each `nx g` command.
**Warning signs:** TypeScript errors in the app importing the lib but not in the lib itself.

### Pitfall 5: Missing `reflect-metadata` Import in NestJS Bootstrap

**What goes wrong:** NestJS app throws `Reflect.metadata is not a function` on startup.
**Why it happens:** TypeORM and NestJS rely on `reflect-metadata` polyfill. It must be imported before any decorated class is loaded.
**How to avoid:** Add `import 'reflect-metadata';` as the first line of `apps/api/src/main.ts`.
**Warning signs:** Startup crash with `TypeError: Reflect.metadata is not a function`.

### Pitfall 6: `@import "tailwindcss"` vs `@use` in SCSS Files

**What goes wrong:** Using `@use "tailwindcss"` (SCSS module syntax) instead of `@import "tailwindcss"` causes PostCSS to not process Tailwind directives.
**Why it happens:** Tailwind v4 processes `@import` directives, not SCSS's `@use` syntax which has different semantics.
**How to avoid:** Always use `@import "tailwindcss";` at the top of `styles.scss`. Do not use `@use`.
**Warning signs:** No Tailwind utility classes appear in compiled CSS; no errors shown.

Source: [CITED: https://github.com/tailwindlabs/tailwindcss/discussions/18364]

---

## Code Examples

### Sport Entity (Temporary, apps/api/src/entities/)

```typescript
// apps/api/src/entities/sport.entity.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('sports')
export class Sport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ type: 'jsonb', default: [] })
  positionTypes: string[];

  @Column({ default: true })
  isEnabled: boolean;
}
```

### Team Entity (Temporary, apps/api/src/entities/)

```typescript
// apps/api/src/entities/team.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Sport } from './sport.entity';
import { Season } from './season.entity';

@Entity('teams')
export class Team {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @ManyToOne(() => Sport)
  @JoinColumn({ name: 'sport_id' })
  sport: Sport;

  @Column({ name: 'sport_id' })
  sportId: string;

  @Column({ name: 'players_on_field', default: 11 })
  playersOnField: number;

  @Column({ name: 'period_count', default: 2 })
  periodCount: number;

  @Column({ name: 'period_length_minutes', default: 45 })
  periodLengthMinutes: number;

  @OneToMany(() => Season, (season) => season.team)
  seasons: Season[];
}
```

### Soccer Seed Data

```typescript
// apps/api/src/seeds/sport.seeder.ts
// Using typeorm-extension or a TypeORM migration's up() method
// Source: [CITED: https://medium.com/@emfelipe/using-typeorm-migrations-for-simple-database-seeding-nestjs-example-1f1acbc0ef24]

// Option A: embed in InitialSchema migration up() method
await queryRunner.query(`
  INSERT INTO sports (id, name, position_types, is_enabled)
  VALUES (
    gen_random_uuid(),
    'Soccer',
    '["Goalkeeper", "Defender", "Midfielder", "Forward"]'::jsonb,
    true
  )
  ON CONFLICT (name) DO NOTHING;
`);
```

### tsconfig.base.json path alias (after lib generation)

```json
// tsconfig.base.json — Nx generator adds these automatically with --importPath
{
  "paths": {
    "@apex-team/shared/util/models": ["libs/shared/util/models/src/index.ts"],
    "@apex-team/client/ui/theme": ["libs/client/ui/theme/src/index.ts"]
  }
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `tailwind.config.js` with `darkMode: 'class'` | `@custom-variant dark` in CSS | Tailwind v4 (Jan 2025) | No JS config file needed for dark mode |
| `@tailwind base/components/utilities` directives | `@import "tailwindcss"` | Tailwind v4 (Jan 2025) | Single import replaces three directives |
| Ionic `.dark` class for dark palette | Ionic `.ion-palette-dark` class | Ionic 8 (2024) | Must apply different class; affects ThemeService |
| TypeORM `synchronize: true` for dev | `synchronize: false` + migration CLI | TypeORM best practice (not new, just enforced) | Explicit migrations in all environments |
| NgModules in Angular | Standalone components (no NgModule) | Angular 14+ default in Angular 17+ | All components, directives, pipes are standalone |

**Deprecated/outdated:**
- `tailwind.config.js` for v4: Still supported via `@config` directive but not needed for basic dark mode setup. Phase 1 should NOT create this file — use pure CSS-first v4 approach.
- TRD mention of "Jest (Unit)": Overridden by existing scaffold — Vitest is already configured via `@angular/build:unit-test` in `nx.json`. All new libs use Vitest.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `typeorm-ts-node-esm` is the correct CLI entry point for TypeScript ESM setup in this workspace | Pattern 5 (migration targets) | Migration CLI commands fail; may need `typeorm-ts-node-commonjs` depending on tsconfig module setting |
| A2 | `@nx/nest:app` generator for Nx 22.6.5 generates a NestJS 11.x app by default | Standard Stack | May generate NestJS 10.x; check generated package.json after scaffold |
| A3 | Applying both `.dark` AND `.ion-palette-dark` classes simultaneously causes no specificity conflicts | Pitfall 2, Pattern 8 | Ionic CSS variables may have conflicting specificity; test Ionic components in dark mode after integration |
| A4 | `@tailwindcss/postcss` v4 processes SCSS files correctly when the Angular build passes them through PostCSS | Pitfall 6 | Build pipeline may require additional PostCSS config or SCSS ordering; verify in browser after setup |

---

## Open Questions

1. **TypeORM CLI module format (ESM vs CJS)**
   - What we know: `tsconfig.base.json` uses `"module": "esnext"` at workspace root; NestJS typically uses CommonJS
   - What's unclear: Whether the generated `apps/api` tsconfig will use `"module": "commonjs"` (NestJS default) or ESM. This determines whether to use `typeorm-ts-node-esm` or `typeorm-ts-node-commonjs` in migration scripts.
   - Recommendation: After `nx g @nx/nest:app apps/api`, check the generated `tsconfig.app.json` — if `"module": "commonjs"`, use `typeorm-ts-node-commonjs`.

2. **PostgreSQL Docker container for dev**
   - What we know: Docker is available; a `postgres:14-alpine` container is running on port 5432 (for another project).
   - What's unclear: Whether to use that container (requires a new database) or spin up a new dedicated `postgres:16` container for apex-team.
   - Recommendation: Add `docker-compose.yml` at workspace root for apex-team's own PostgreSQL instance to avoid port conflicts and dependency on the other project's container.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | All tooling | Yes | v25.2.1 | — |
| npm | Package management | Yes | 11.6.2 | — |
| Nx CLI | Code generation | Yes (local 22.6.5, global 22.3.3) | 22.6.5 local | Use `npx nx` |
| Docker | PostgreSQL container | Yes (Desktop) | Desktop (running) | Manual PostgreSQL install |
| PostgreSQL | Database | Via Docker only | 14-alpine on :5432 (other project) | New Docker container on different port |
| psql CLI | Manual DB inspection | No | — | Use Docker exec or pgAdmin |

**Missing dependencies with no fallback:** None — all required tools are available.

**Missing dependencies with fallback:**
- PostgreSQL on port 5432 is occupied by another project. Apex Team needs its own container. Add a `docker-compose.yml` that maps to port `5433` (or use a dedicated named container).

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest (via `@angular/build:unit-test` in Nx) |
| Config file | `apps/frontend/project.json` (unit-test target uses `@angular/build:unit-test`); new libs get their own vitest config |
| Quick run command | `nx test frontend --watch=false` |
| Full suite command | `nx run-many --target=test --all` |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INFR-02 | ThemeService applies `.dark` class to `<html>` on toggle | unit | `nx test client-ui-theme --watch=false` | No — Wave 0 |
| INFR-02 | ThemeService reads OS preference on init | unit | `nx test client-ui-theme --watch=false` | No — Wave 0 |
| INFR-02 | ThemeService persists to localStorage | unit | `nx test client-ui-theme --watch=false` | No — Wave 0 |
| INFR-01 | Ionic is registered in app providers | unit | `nx test frontend --watch=false` | Partial (app.spec.ts exists) |
| TEAM-03 | Sport entity has positionTypes JSONB field | unit/integration | Manual DB inspection + migration run | No — Wave 0 |

### Sampling Rate
- **Per task commit:** `nx test frontend --watch=false` (smoke test)
- **Per wave merge:** `nx run-many --target=test --all`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `libs/client/ui/theme/src/lib/theme.service.spec.ts` — covers INFR-02 ThemeService behavior
- [ ] `libs/shared/util/models` has no testable logic (interfaces only) — no test file needed
- [ ] Migration integration test is manual-only (requires live DB) — document in verification checklist

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No (Phase 2) | — |
| V3 Session Management | No (Phase 2) | — |
| V4 Access Control | No (Phase 2) | — |
| V5 Input Validation | Partial — entity fields should have validation decorators | `class-validator` (add when entity is used in a controller; not in Phase 1 scope) |
| V6 Cryptography | No | — |

### Known Threat Patterns for This Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| `.env` file committed to git | Information Disclosure | Add `.env` to `.gitignore`, commit `.env.example` only |
| DB credentials in plain text env | Information Disclosure | `.env` file, never hardcoded |
| TypeORM `synchronize: true` in production | Tampering (data loss) | D-10: `synchronize: false` always |

**Phase 1 security posture:** This phase sets no authentication (deferred to Phase 2). The primary security concern is credential hygiene — `.env` files must not be committed. A `.env.example` with placeholder values should be committed instead.

---

## Sources

### Primary (HIGH confidence)
- Context7 `/nestjs/typeorm` — TypeOrmModule.forRoot/forRootAsync patterns, DataSource configuration
- Context7 `/typeorm/typeorm` — Migration generation and run CLI commands
- Context7 `/ionic-team/ionic-docs` — `provideIonicAngular`, `IonicRouteStrategy` standalone setup
- Context7 `/websites/nx_dev` — `@nx/nest:app`, `@nx/angular:lib`, `@nx/js:lib` generators; enforce-module-boundaries
- [Tailwind CSS official docs — dark mode](https://tailwindcss.com/docs/dark-mode) — `@custom-variant dark` syntax
- [Tailwind CSS official docs — Angular install](https://tailwindcss.com/docs/installation/framework-guides/angular) — PostCSS config
- [Ionic official docs — dark mode](https://ionicframework.com/docs/theming/dark-mode) — `.ion-palette-dark` class, palette CSS import
- npm registry — All package versions verified 2026-04-14

### Secondary (MEDIUM confidence)
- [Nx Blog: Tailwind v4 + Angular Nx workspace](https://nx.dev/blog/setup-tailwind-4-angular-nx-workspace) — `@source` directive for Nx monorepo
- [This Dot Labs: TypeORM migrations in Nx/NestJS](https://www.thisdot.co/blog/setting-up-typeorm-migrations-in-an-nx-nestjs-project) — project.json migration targets pattern

### Tertiary (LOW confidence)
- [Medium: Entity loading fix for Nx + NestJS + TypeORM](https://medium.com/@p3rf/solving-issue-with-entities-loading-for-a-nx-dev-monorepo-setup-with-nest-js-and-typeorm-282d4491f0bc) — glob pattern pitfall

---

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH — all versions verified via npm registry on research date
- Architecture: HIGH — patterns verified via Context7 (NestJS, TypeORM, Ionic) and official docs (Nx, Tailwind, Ionic)
- Pitfalls: HIGH for Ionic class name change (official docs); MEDIUM for Tailwind/Nx scanning (blog post + GitHub discussion)

**Research date:** 2026-04-14
**Valid until:** 2026-05-14 (stable ecosystem; Ionic/Tailwind major versions unlikely to change in 30 days)
