# Testing

## Overview

Testing infrastructure is configured but minimal. Unit tests use Vitest (via `@angular/build:unit-test`), and E2E tests use Playwright (via `@nx/playwright`).

## Unit Testing

### Framework

- **Runner:** Vitest ^4.0.8 (via `@angular/build:unit-test` executor)
- **DOM:** jsdom ^27.1.0
- **Test file pattern:** `*.spec.ts`
- **Config:** Inherited from `@angular/build:unit-test` executor defaults

### Existing Tests

Only the default scaffold test exists:

```typescript
// apps/frontend/src/app/app.spec.ts
describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App, NxWelcome],
    }).compileComponents();
  });

  it('should render title', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Welcome frontend');
  });
});
```

### Test Patterns

- Uses Angular's `TestBed` for component testing
- Standalone components imported directly (no module setup)
- Uses `fixture.whenStable()` for async rendering
- DOM assertions via `nativeElement` queries

### Running Tests

```bash
npx nx run frontend:test
```

## E2E Testing

### Framework

- **Runner:** Playwright ^1.36.0 (via `@nx/playwright/plugin`)
- **Config:** `apps/frontend-e2e/playwright.config.ts`
- **Preset:** `nxE2EPreset` from `@nx/playwright/preset`

### Configuration

| Setting             | Value                                |
|---------------------|--------------------------------------|
| Base URL            | `http://localhost:4200`              |
| Trace collection    | On first retry                       |
| Web server command  | `npx nx run frontend:serve`         |
| Reuse server        | `true`                               |
| CWD                 | `workspaceRoot`                      |

### Browser Projects

| Browser   | Status    |
|-----------|-----------|
| Chromium  | Enabled   |
| Firefox   | Enabled   |
| WebKit    | Enabled   |
| Mobile    | Commented |

### Existing Tests

Only the default scaffold test:

```typescript
// apps/frontend-e2e/src/example.spec.ts
test('has title', async ({ page }) => {
  await page.goto('/');
  expect(await page.locator('h1').innerText()).toContain('Welcome');
});
```

### Running E2E Tests

```bash
npx nx run frontend-e2e:e2e
```

## Coverage

No coverage thresholds configured. No CI pipeline set up.

## Mocking

No mocking patterns established yet.

## Missing Test Infrastructure

| Need                        | Notes                                         |
|-----------------------------|-----------------------------------------------|
| Service test patterns       | No services exist yet                         |
| HTTP testing                | No `provideHttpClientTesting()` configured    |
| Route testing               | No routes defined yet                         |
| Coverage configuration      | No thresholds or reports                      |
| CI test pipeline            | No GitHub Actions / CI config                 |
