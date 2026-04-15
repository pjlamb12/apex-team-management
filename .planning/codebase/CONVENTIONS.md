# Conventions

## Overview

The codebase is a fresh Nx scaffold with minimal custom conventions. Most conventions come from Nx/Angular defaults and tooling configuration.

## Code Style

### Formatting

Configured via Prettier (`.prettierrc`) and EditorConfig (`.editorconfig`):

| Setting                    | Value       |
|----------------------------|-------------|
| Single quotes              | `true`      |
| Indent style               | spaces      |
| Indent size                | 2           |
| Final newline              | `true`      |
| Trim trailing whitespace   | `true`      |
| Charset                    | UTF-8       |

### TypeScript Compiler Settings

Strict mode enabled in `apps/frontend/tsconfig.json`:

```json
{
  "strict": true,
  "noImplicitOverride": true,
  "noPropertyAccessFromIndexSignature": true,
  "noImplicitReturns": true,
  "noFallthroughCasesInSwitch": true,
  "isolatedModules": true,
  "target": "es2022",
  "moduleResolution": "bundler",
  "module": "preserve"
}
```

### Angular Compiler Settings

```json
{
  "enableI18nLegacyMessageIdFormat": false,
  "strictInjectionParameters": true,
  "strictInputAccessModifiers": true,
  "strictTemplates": true
}
```

## Component Patterns

### Standalone Components (Angular 21)

All components use standalone pattern without NgModules:

```typescript
// apps/frontend/src/app/app.ts
@Component({
  imports: [NxWelcome, RouterModule],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected title = 'frontend';
}
```

Key observations:
- **No `.component.ts` suffix** — Angular 21 convention uses just `{name}.ts`
- **External templates** — Uses `templateUrl` reference (not inline)
- **SCSS styles** — Uses `styleUrl` (singular) with SCSS
- **`protected` class members** — Template-bound fields use `protected` access
- **No `standalone: true`** — Angular 21 defaults to standalone (no flag needed)

### Bootstrapping

```typescript
// apps/frontend/src/main.ts
bootstrapApplication(App, appConfig).catch((err) => console.error(err));
```

Uses functional bootstrapping with `ApplicationConfig`.

### Application Config

```typescript
// apps/frontend/src/app/app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [provideBrowserGlobalErrorListeners(), provideRouter(appRoutes)],
};
```

Uses provider functions rather than NgModule imports.

## Naming Conventions

| Element             | Convention            | Example                    |
|---------------------|-----------------------|----------------------------|
| Files               | `{name}.ts`           | `app.ts`, `app.config.ts`  |
| Templates           | `{name}.html`         | `app.html`                 |
| Styles              | `{name}.scss`         | `app.scss`                 |
| Tests               | `{name}.spec.ts`      | `app.spec.ts`              |
| Components (class)  | PascalCase            | `App`                      |
| Selectors (element) | `app-{name}`          | `app-root`                 |
| Selectors (attr)    | `app{Name}`           | (camelCase)                |
| Routes              | `{name}.routes.ts`    | `app.routes.ts`            |

## Linting

### ESLint Configuration

- **Format:** Flat config (`eslint.config.mjs`)
- **Base:** `@nx/eslint-plugin` flat configs
- **Angular rules:** `angular-eslint` flat configs (applied in frontend app)
- **Module boundaries:** Enforced via `@nx/enforce-module-boundaries` (wildcard constraints only)

### Component Selector Rules

```javascript
// apps/frontend/eslint.config.mjs
'@angular-eslint/component-selector': ['error', {
  type: 'element',
  prefix: 'app',
  style: 'kebab-case',
}],
'@angular-eslint/directive-selector': ['error', {
  type: 'attribute',
  prefix: 'app',
  style: 'camelCase',
}],
```

## Error Handling

No custom error handling patterns established. The bootstrap uses `.catch((err) => console.error(err))` for uncaught errors. `provideBrowserGlobalErrorListeners()` is enabled for browser-level error handling.

## Import Patterns

- No path aliases configured in `tsconfig.base.json` (empty `paths: {}`)
- Direct relative imports used within the app
- This will need updating when the `libs/` structure is created (e.g., `@apex-team/shared/models`)
