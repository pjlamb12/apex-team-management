# Stack

## Overview

Nx monorepo with Angular 21 frontend. Currently a fresh scaffold — single `@angular/build:application` app with default NxWelcome page.

## Languages & Runtimes

| Language   | Version      | Usage                       |
|------------|--------------|-----------------------------|
| TypeScript | ~5.9.2       | All application code        |
| HTML       | 5            | Angular templates           |
| SCSS       | (built-in)   | Component and global styles |
| JavaScript | ESNext       | Config files (ESLint, etc.) |

**Runtime:** Node.js (dev tooling), Browser (Angular app)

## Frameworks

| Framework  | Version   | Role               | Config                                  |
|------------|-----------|--------------------|-----------------------------------------|
| Angular    | ~21.2.0   | Frontend framework | `apps/frontend/project.json`            |
| Nx         | 22.6.5    | Monorepo tooling   | `nx.json`                               |

### Angular Details

- **Build system:** `@angular/build:application` (new esbuild-based builder)
- **Component style:** Standalone components (no NgModules)
- **Inline style language:** SCSS
- **Prefix:** `app`
- **Strict mode:** Enabled (`strict: true` in tsconfig)
- **Angular compiler options:** `strictTemplates`, `strictInjectionParameters`, `strictInputAccessModifiers` — all enabled

## Dependencies

### Production

| Package              | Version  | Purpose             |
|----------------------|----------|---------------------|
| `@angular/common`    | ~21.2.0  | Common module       |
| `@angular/compiler`  | ~21.2.0  | Template compiler   |
| `@angular/core`      | ~21.2.0  | Core framework      |
| `@angular/forms`     | ~21.2.0  | Forms module        |
| `@angular/platform-browser` | ~21.2.0 | Browser platform |
| `@angular/router`    | ~21.2.0  | Routing             |
| `rxjs`               | ~7.8.0   | Reactive programming|

### Dev Dependencies (Key)

| Package                | Version   | Purpose                        |
|------------------------|-----------|--------------------------------|
| `@nx/angular`          | 22.6.5    | Nx Angular plugin              |
| `@nx/eslint`           | 22.6.5    | Nx ESLint integration          |
| `@nx/playwright`       | 22.6.5    | Nx Playwright E2E integration  |
| `@nx/js`               | 22.6.5    | Nx JS/TS plugin                |
| `@nx/web`              | 22.6.5    | Nx web utilities               |
| `@playwright/test`     | ^1.36.0   | E2E testing framework          |
| `vitest`               | ^4.0.8    | Unit test runner               |
| `eslint`               | ^9.8.0    | Linting                        |
| `prettier`             | ~3.6.2    | Code formatting                |
| `@swc/core`            | ~1.15.5   | Fast TypeScript compilation    |
| `typescript`           | ~5.9.2    | TypeScript compiler            |
| `angular-eslint`       | ^21.2.0   | Angular ESLint rules           |

## Build & Dev Configuration

### Nx Workspace (`nx.json`)

- **Analytics:** Disabled
- **Default generator config:** Applications use `playwright` for E2E, `eslint` for linting, `scss` for styles, `vitest-angular` for unit tests
- **Plugins:** `@nx/playwright/plugin`, `@nx/eslint/plugin`
- **Caching:** Enabled for `@angular/build:application`, `@nx/eslint:lint`, `@angular/build:unit-test`

### Build Targets (`apps/frontend/project.json`)

| Target         | Executor                        | Port  |
|----------------|---------------------------------|-------|
| `build`        | `@angular/build:application`    | —     |
| `serve`        | `@angular/build:dev-server`     | 4200  |
| `test`         | `@angular/build:unit-test`      | —     |
| `lint`         | `@nx/eslint:lint`               | —     |
| `serve-static` | `@nx/web:file-server`           | 4200  |

### Production Build Budgets

| Type              | Warning | Error |
|-------------------|---------|-------|
| Initial bundle    | 500kb   | 1mb   |
| Component style   | 4kb     | 8kb   |

## Configuration Files

| File                    | Purpose                                |
|-------------------------|----------------------------------------|
| `nx.json`               | Nx workspace configuration             |
| `tsconfig.base.json`    | Base TypeScript config                 |
| `eslint.config.mjs`     | Root ESLint config (flat config)       |
| `.prettierrc`           | Prettier config (singleQuote: true)    |
| `.editorconfig`         | Editor settings (2-space indent, UTF-8)|
| `package.json`          | Dependencies and project metadata      |

## Notable Patterns

- **No `libs/` directory yet** — the domain-driven library architecture from the TRD (`libs/domain/type/name`) has not been created
- **No backend** — NestJS API, PostgreSQL, and Socket.io from the TRD are not yet scaffolded
- **No Ionic/Capacitor** — PWA/Mobile layer not yet integrated
- **No Tailwind CSS** — not yet configured despite being in the TRD
- **SWC-based compilation** — uses `@swc/core` for fast TypeScript transpilation
