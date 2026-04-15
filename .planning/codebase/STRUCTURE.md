# Structure

## Overview

Nx monorepo with a single Angular application and its E2E test companion. The workspace follows Nx's default project layout with `apps/` for applications.

## Directory Layout

```
apex-team/
├── .editorconfig              # Editor settings (2-space indent, UTF-8)
├── .gitignore                 # Git ignore rules
├── .prettierignore            # Prettier ignore rules
├── .prettierrc                # Prettier config (singleQuote: true)
├── .vscode/                   # VS Code workspace settings
├── apps/
│   ├── frontend/              # Angular 21 application
│   │   ├── eslint.config.mjs  # App-level ESLint config
│   │   ├── project.json       # Nx project configuration
│   │   ├── public/            # Static assets
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── app.config.ts    # Application providers
│   │   │   │   ├── app.html         # Root template
│   │   │   │   ├── app.routes.ts    # Route definitions (empty)
│   │   │   │   ├── app.scss         # Root component styles
│   │   │   │   ├── app.spec.ts      # Root component test
│   │   │   │   ├── app.ts           # Root component class
│   │   │   │   └── nx-welcome.ts    # Default Nx welcome page
│   │   │   ├── index.html           # HTML shell
│   │   │   ├── main.ts              # Bootstrap entry point
│   │   │   └── styles.scss          # Global styles
│   │   ├── tsconfig.app.json        # App build tsconfig
│   │   ├── tsconfig.json            # Base tsconfig for app
│   │   └── tsconfig.spec.json       # Test tsconfig
│   └── frontend-e2e/               # Playwright E2E tests
│       ├── eslint.config.mjs
│       ├── playwright.config.ts     # Playwright configuration
│       ├── project.json
│       ├── src/
│       │   └── example.spec.ts      # Default E2E test
│       └── tsconfig.json
├── eslint.config.mjs          # Root ESLint config (flat config)
├── nx.json                    # Nx workspace configuration
├── package.json               # Root package.json
├── package-lock.json          # Dependency lock file
├── tsconfig.base.json         # Root TypeScript config
└── trd.md                     # Technical Requirements Document
```

## Key Locations

| What                  | Where                                  |
|-----------------------|----------------------------------------|
| Frontend app          | `apps/frontend/`                       |
| App entry point       | `apps/frontend/src/main.ts`            |
| Root component        | `apps/frontend/src/app/app.ts`         |
| Routes                | `apps/frontend/src/app/app.routes.ts`  |
| App providers         | `apps/frontend/src/app/app.config.ts`  |
| Global styles         | `apps/frontend/src/styles.scss`        |
| Static assets         | `apps/frontend/public/`               |
| E2E tests             | `apps/frontend-e2e/src/`              |
| Nx config             | `nx.json`                              |
| Build output          | `dist/apps/frontend/`                  |
| Root package.json     | `package.json`                         |

## Naming Conventions

| Element            | Convention                                           |
|--------------------|------------------------------------------------------|
| Component files    | `{name}.ts` (no `.component` suffix — Angular 21)    |
| Template files     | `{name}.html`                                        |
| Style files        | `{name}.scss`                                        |
| Test files         | `{name}.spec.ts`                                     |
| Config files       | `{name}.config.ts`                                   |
| Route files        | `{name}.routes.ts`                                   |
| Component selector | `app-{name}` (kebab-case, `app` prefix)              |
| Directive selector | `app{Name}` (camelCase, `app` prefix)                |
| E2E test files     | `{name}.spec.ts`                                     |

## Missing Directories (Per TRD)

| Directory                       | Purpose                          |
|---------------------------------|----------------------------------|
| `libs/`                         | Domain-driven library structure  |
| `libs/shared/util/models`       | Global TypeScript interfaces     |
| `libs/shared/util/logic-rotation` | Rotation engine logic          |
| `libs/shared/util/analytics`    | Analytics logic                  |
| `libs/api/`                     | NestJS API libraries             |
| `libs/client/`                  | Angular client libraries         |
| `apps/api/`                     | NestJS API application           |

## File Count Summary

| Category     | Count |
|--------------|-------|
| TypeScript   | 8     |
| HTML         | 1     |
| SCSS         | 2     |
| Config       | ~12   |
| **Total**    | ~23   |
