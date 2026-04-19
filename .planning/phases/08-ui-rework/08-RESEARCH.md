# Phase 8: UI Rework — Research

**Researched:** 2026-04-19
**Domain:** Angular 21 + Ionic 8 dark theme CSS variable overrides, Tailwind CSS v4 custom token system
**Confidence:** HIGH

---

## Summary

Phase 8 is a pure CSS/SCSS rework — no TypeScript changes, no new libraries, no new routes. The root cause of all dark-theme inconsistencies is a single missing file: `libs/client/ui/theme/src/lib/theme/theme.css` is empty, so Ionic's iOS dark palette defaults (`--ion-background-color: #000000`, `--ion-item-background: #000000`, `--ion-card-background: #1c1c1d`) are never overridden. Everything in the app that relies on those variables renders pure black.

The fix is a global-first strategy: write the "Athletic Professional" slate palette into `theme.css` scoped to `.ion-palette-dark`, then add an `@theme` block to `styles.scss` for Tailwind utilities, then surgically clean up per-component hardcodes in the game console SCSS and HTML templates. Most screens (Screens 1-6, 11-13 in the UI-SPEC) will be corrected by the global override alone; only the game console screens (7-10) require additional per-file changes.

**Primary recommendation:** Write `theme.css` first, verify import order in `styles.scss`, then address the 4 game-console files with hardcoded values. The UI-SPEC provides the exact CSS blocks — no guesswork required.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Ionic CSS variable overrides (background, card, toolbar, tab bar) | Frontend CSS (global) | — | Variables cascade from `.ion-palette-dark` root class; global ownership is correct |
| Custom design token definitions (`--ap-*`) | Frontend CSS (global `@theme`) | — | Tailwind `@theme` tokens compile to CSS vars + utility classes; belongs at global CSS entry point |
| Per-component hardcoded color removal | Individual component SCSS + HTML | — | Shadow DOM components require per-component SCSS overrides; Ionic CSS vars don't penetrate shadow root without explicit override |
| Import load order | `styles.scss` | — | CSS cascade requires theme overrides to load after `@ionic/angular/css/palettes/dark.class.css` |
| ThemeService dark mode activation | `libs/client/ui/theme/src/lib/theme.service.ts` | — | Already correct — applies both `.dark` and `.ion-palette-dark` simultaneously |

---

## Standard Stack

### Core (existing — no new installs)

| Library | Version | Purpose | Relevant to Phase |
|---------|---------|---------|------------------|
| `@ionic/angular` | `^8.8.4` | Component library + CSS variable system | CSS var overrides are the primary fix mechanism |
| `tailwindcss` | `^4.2.2` | Utility class framework | `@theme` block adds AP token utilities |
| `@tailwindcss/postcss` | `^4.2.2` | PostCSS integration | No config change needed |

**No new dependencies.** Phase 8 is purely CSS/SCSS edits to existing files.

---

## Architecture Patterns

### System Architecture Diagram

```
styles.scss (global CSS entry point)
│
├── @import "tailwindcss"          ← Tailwind v4 base + utilities
├── @theme { --color-ap-* }        ← ADD: AP design tokens → enables bg-ap-bg utilities
├── @custom-variant dark (...)     ← Existing: .dark class variant
├── @source "libs/client/ui/theme" ← Existing: Tailwind scans theme lib
├── @source "libs/client/feature/game-console" ← ADD: so ap-* utilities resolve in console templates
│
├── @import @ionic/angular/css/core.css + siblings
├── @import @ionic/angular/css/palettes/dark.class.css  ← Sets #000000 defaults
└── @import theme.css              ← ADD: Must be LAST to win specificity
                                      Overrides #000000 with #0f172a AP slate

theme.css (currently empty → fill with AP overrides)
    .ion-palette-dark {
        --ion-background-color: #0f172a;   ← Fixes Screens 1-6, 11-13
        --ion-item-background: #0f172a;
        --ion-card-background: #1e293b;    ← Fixes bench cards, auth cards
        --ion-toolbar-background: #0f172a; ← Fixes console toolbar hardcode
        --ion-tab-bar-background: #0f172a;
        --ion-modal-background: #0f172a;   ← Fixes player modal
        --ion-text-color: #f1f5f9;
        --ion-font-family: Inter, system-ui, ...
        --ion-color-step-50..200: AP slate values
    }

Per-component fixes (only where globals don't reach):
    console-wrapper.scss    → remove --background: #000000, background: #111111
    console-wrapper.html    → replace bg-gray-950, bg-gray-900 with AP tokens
    event-log.scss          → replace #ffffff fallbacks
    soccer-pitch-view.html  → replace bg-black/60 with bg-slate-900/80
    lineup-editor.scss      → replace --ion-color-light border with --ap-border

Per-component cleanup (redundant overrides to remove):
    login.scss, signup.scss, reset-password.scss, home.scss
    create-team.scss, edit-team.scss  → remove ion-card { --background: var(--ion-color-step-50, #1a1a1a) }
    teams-list.scss  → simplify --background fallback chain
```

### Recommended Project Structure

No new files or folders. Edits are in existing files:

```
apps/frontend/src/
└── styles.scss                          — ADD @theme block + @import theme.css + @source for game-console

libs/client/ui/theme/src/lib/theme/
└── theme.css                            — FILL with .ion-palette-dark override block

apps/frontend/src/app/
├── auth/login/login.scss                — REMOVE redundant ion-card { --background } rule
├── auth/signup/signup.scss              — REMOVE redundant rule
├── auth/reset-password/reset-password.scss — REMOVE redundant rule
├── home/home.scss                       — REMOVE redundant rule
├── teams/create-team/create-team.scss   — REMOVE redundant rule
├── teams/edit-team/edit-team.scss       — REMOVE redundant rule
└── teams/teams-list/teams-list.scss     — SIMPLIFY --background fallback, UPDATE border rgba

libs/client/feature/game-console/src/lib/
├── console-wrapper/console-wrapper.scss — REMOVE hardcoded #000000, #111111
├── console-wrapper/console-wrapper.html — REPLACE bg-gray-950, bg-gray-900
├── event-log/event-log.scss             — REPLACE #ffffff fallbacks
└── soccer-pitch-view/soccer-pitch-view.html — REPLACE bg-black/60
└── lineup-editor/lineup-editor.scss (apps) — FIX list-header border color
```

### Pattern 1: Ionic CSS Variable Override (Global)

**What:** Override Ionic's dark palette defaults at `.ion-palette-dark` scope in a file loaded after the Ionic dark palette import.

**When to use:** Any Ionic CSS variable that defaults to an undesirable value in dark mode.

**Load order rule:** `theme.css` MUST be imported after `@ionic/angular/css/palettes/dark.class.css` in `styles.scss`. Same selector specificity means last-write-wins in cascade.

```css
/* Source: UI-SPEC — libs/client/ui/theme/src/lib/theme/theme.css */
.ion-palette-dark {
  --ion-background-color: #0f172a;
  --ion-background-color-rgb: 15, 23, 42;
  --ion-item-background: #0f172a;
  --ion-card-background: #1e293b;
  --ion-toolbar-background: #0f172a;
  --ion-toolbar-border-color: rgba(255, 255, 255, 0.08);
  --ion-tab-bar-background: #0f172a;
  --ion-tab-bar-border-color: rgba(255, 255, 255, 0.08);
  --ion-modal-background: #0f172a;
  --ion-text-color: #f1f5f9;
  --ion-text-color-rgb: 241, 245, 249;
  --ion-font-family: Inter, system-ui, -apple-system, sans-serif;
  --ion-color-step-50: #1e293b;
  --ion-color-step-100: #263044;
  --ion-color-step-150: rgba(255, 255, 255, 0.08);
  --ion-color-step-200: rgba(255, 255, 255, 0.12);
}
```

### Pattern 2: Tailwind v4 `@theme` Block

**What:** Tailwind v4 uses an `@theme` block (not a config file) to declare custom design tokens. Tokens defined here become CSS custom properties AND Tailwind utility classes.

**When to use:** When you need `bg-ap-bg`, `text-ap-muted`, etc. in templates.

**Placement:** Inside `styles.scss`, after `@import "tailwindcss"` and before Ionic imports.

```css
/* Source: UI-SPEC — apps/frontend/src/styles.scss */
@theme {
  --color-ap-bg: #0f172a;
  --color-ap-surface: #1e293b;
  --color-ap-surface-raised: #263044;
  --color-ap-accent: #3b82f6;
  --color-ap-success: #22c55e;
  --color-ap-warning: #eab308;
  --color-ap-danger: #ef4444;
  --color-ap-text: #f1f5f9;
  --color-ap-muted: #94a3b8;
}
```

This enables: `class="bg-ap-bg"`, `class="text-ap-muted"`, `class="border-ap-surface"`, etc.

**Note:** The `dark:` prefix is not needed — ThemeService applies `.ion-palette-dark` globally on load for all new sessions. The app is effectively always in dark mode.

### Pattern 3: Ionic Component CSS Variable Override (Per-Component)

**What:** Ionic Web Components use Shadow DOM. Their internal styles cannot be overridden with regular CSS selectors. Instead, Ionic exposes CSS custom properties (prefixed `--`) that cross the shadow boundary.

**When to use:** When a global CSS variable override doesn't reach a specific component (e.g., `ion-toolbar` in `console-wrapper.scss` explicitly sets `--background: #000000`, overriding the global `--ion-toolbar-background`).

**Fix pattern:**
```scss
/* Remove the hardcoded override and let the global variable resolve: */

/* BEFORE (console-wrapper.scss): */
ion-toolbar {
  --background: #000000;  /* ← this wins over the global --ion-toolbar-background */
}

/* AFTER: */
ion-toolbar {
  /* --background removed; global --ion-toolbar-background: #0f172a applies */
  --color: white;
  --border-width: 0 0 1px;
  --border-color: rgba(255, 255, 255, 0.1);
  height: 80px;
}
```

### Anti-Patterns to Avoid

- **Hardcoded hex values in component SCSS:** `background: #000000` bypasses the token system and cannot be overridden by global variables. Always use CSS custom properties for color values.
- **`#ffffff` CSS variable fallbacks:** `background: var(--ion-background-color, #ffffff)` will render white when Ionic variables haven't loaded yet. Use `var(--ion-background-color, var(--ap-surface))` as fallback instead.
- **Over-specifying `--background` in component SCSS:** Setting `ion-card { --background: var(--ion-card-background, ...) }` is redundant once the global override sets `--ion-card-background` correctly. The redundant rule adds noise and may confuse future maintainers.
- **Using `.ios` qualifier in overrides:** Ionic's dark defaults use `.ion-palette-dark.ios` specificity. Your overrides should use `.ion-palette-dark` (without `.ios`) loaded after the Ionic import — same specificity level but later in cascade, so they win.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Dark theme color system | Custom dark mode toggle logic | Ionic CSS variables + `.ion-palette-dark` class | ThemeService already applies the class — just populate the variables |
| Design tokens | Hardcoded hex in each component | `@theme` block in `styles.scss` | Single source of truth; Tailwind generates utilities automatically |
| Contrast checking | Manual calculations | WCAG values already verified in UI-SPEC | UI-SPEC includes pre-verified contrast ratios for all token combinations |

---

## Common Pitfalls

### Pitfall 1: theme.css Not Imported in styles.scss

**What goes wrong:** The theme.css file is filled with overrides but has no effect because `styles.scss` never imports it.

**Why it happens:** The file exists in the library, but there is no `@import` statement in `styles.scss` for it. Currently confirmed: `styles.scss` has 19 lines and does NOT import `theme.css`.

**How to avoid:** Add `@import "../../../../libs/client/ui/theme/src/lib/theme/theme.css";` as the LAST line of `styles.scss` (after the Ionic dark palette import).

**Warning signs:** Page background stays pure black after filling `theme.css`.

---

### Pitfall 2: Import Order Reversal

**What goes wrong:** `theme.css` is imported BEFORE `@ionic/angular/css/palettes/dark.class.css`, so Ionic's defaults overwrite the AP overrides.

**Why it happens:** Misunderstanding CSS cascade — same specificity means last declaration wins.

**How to avoid:** Import order in `styles.scss` must be:
1. `@import "tailwindcss"`
2. `@theme { }` block
3. `@custom-variant dark`
4. `@source` declarations
5. `@import @ionic/angular/css/...` (core, normalize, structure, typography)
6. `@import @ionic/angular/css/palettes/dark.class.css`
7. `@import theme.css` ← LAST

**Warning signs:** `--ion-background-color` resolves to `#000000` in DevTools even after filling `theme.css`.

---

### Pitfall 3: Tailwind @source Missing for game-console Templates

**What goes wrong:** New `bg-ap-bg`, `bg-ap-surface-raised` utility classes are applied in `console-wrapper.html` or other game-console templates but are purged from the production build (they appear unstyled).

**Why it happens:** Tailwind v4's automatic content detection may not traverse into `libs/client/feature/game-console` from the CSS entry point in `apps/frontend/src/`. The existing `@source` in `styles.scss` only covers `libs/client/ui/theme/src`.

**How to avoid:** Add a second `@source` declaration for the game-console lib:
```css
@source "../../../libs/client/feature/game-console/src";
```

**Warning signs:** `bg-gray-950` (an existing class in console-wrapper.html) works in production but a new `bg-ap-bg` does not.

**Note:** The existing `bg-gray-900`, `bg-gray-950` classes in the game-console already work in production (these classes exist in commits that pass CI). This suggests Tailwind IS scanning the lib — either via Angular's esbuild template bundling or via `@source`. If no regression is seen when adding AP tokens, the extra `@source` may be optional. Add it defensively as it has zero cost.

---

### Pitfall 4: `--ion-color-step-50` Fallback Still Resolves to Dark Color

**What goes wrong:** After removing `ion-card { --background: var(--ion-color-step-50, #1a1a1a) }` from component SCSS files, the card background might still look slightly different from `#1e293b` because `--ion-color-step-50` is being overridden to `#1e293b` in `theme.css`, but the component's own `--background` rule was removed and now falls through to `--ion-card-background`.

**Why it happens:** This is actually the correct outcome — `--ion-card-background: #1e293b` resolves cleanly. The concern is a false alarm IF both `--ion-color-step-50` and `--ion-card-background` are set to the same value.

**How to avoid:** Confirm `--ion-color-step-50: #1e293b` matches `--ion-card-background: #1e293b` in `theme.css` so the visual result is identical regardless of which fallback chain resolves.

---

### Pitfall 5: White Flash in event-log on Initial Render

**What goes wrong:** `event-log.scss` uses `background: var(--ion-background-color, #ffffff)` for both `:host` and `ion-list-header`. Before Ionic resolves `--ion-background-color`, the fallback `#ffffff` briefly renders a white panel inside the dark game console.

**Why it happens:** The fallback is a legacy light-mode value that was never updated when the app moved to always-dark.

**How to avoid:** Change fallback to a dark value:
```scss
:host {
  background: var(--ion-background-color, var(--ap-surface, #1e293b));
}
ion-list-header {
  background: var(--ion-background-color, var(--ap-surface, #1e293b));
}
```

---

### Pitfall 6: Component Style Budget Exceeded

**What goes wrong:** Angular build fails with `anyComponentStyle` budget exceeded (4kb warning, 8kb error).

**Why it happens:** Adding CSS to a component SCSS file might push it over budget, but this phase is removing code from most component SCSS files, not adding.

**How to avoid:** Monitor — this phase is net CSS reduction. Only `theme.css` grows significantly (from 0 to ~50 lines). `theme.css` is a global stylesheet loaded via `@import`, not a component style, so it does not count against the component style budget.

---

## Code Examples

### Verified: Complete theme.css Block

```css
/* Source: UI-SPEC § "Ionic CSS Variable Overrides — Complete Block" */
/* File: libs/client/ui/theme/src/lib/theme/theme.css */

/**
 * Athletic Professional — Dark Theme Token Overrides
 * Applied when ThemeService sets both .dark and .ion-palette-dark on <html>
 *
 * Load order: This file must be imported AFTER @ionic/angular/css/palettes/dark.class.css
 * in apps/frontend/src/styles.scss to ensure specificity wins.
 */

.ion-palette-dark {
  /* === Page & Background === */
  --ion-background-color: #0f172a;
  --ion-background-color-rgb: 15, 23, 42;

  /* === Item / Row === */
  --ion-item-background: #0f172a;

  /* === Cards === */
  --ion-card-background: #1e293b;

  /* === Toolbars === */
  --ion-toolbar-background: #0f172a;
  --ion-toolbar-border-color: rgba(255, 255, 255, 0.08);

  /* === Tab Bar === */
  --ion-tab-bar-background: #0f172a;
  --ion-tab-bar-border-color: rgba(255, 255, 255, 0.08);

  /* === Modals & Popovers === */
  --ion-modal-background: #0f172a;

  /* === Text === */
  --ion-text-color: #f1f5f9;
  --ion-text-color-rgb: 241, 245, 249;

  /* === Font === */
  --ion-font-family: Inter, system-ui, -apple-system, sans-serif;

  /* === Color steps (used by ion-color-step-50 etc. references) === */
  --ion-color-step-50: #1e293b;
  --ion-color-step-100: #263044;
  --ion-color-step-150: rgba(255, 255, 255, 0.08);
  --ion-color-step-200: rgba(255, 255, 255, 0.12);
}
```

### Verified: Final styles.scss with AP tokens and theme.css import

```scss
/* Source: UI-SPEC § "Styles.scss Import Order Requirement" */
@import "tailwindcss";

@theme {
  --color-ap-bg: #0f172a;
  --color-ap-surface: #1e293b;
  --color-ap-surface-raised: #263044;
  --color-ap-accent: #3b82f6;
  --color-ap-success: #22c55e;
  --color-ap-warning: #eab308;
  --color-ap-danger: #ef4444;
  --color-ap-text: #f1f5f9;
  --color-ap-muted: #94a3b8;
}

@custom-variant dark (&:where(.dark, .dark *));

@source "../../../libs/client/ui/theme/src";
@source "../../../libs/client/feature/game-console/src";  /* defensive: ensures ap-* utilities resolve */

@import "@ionic/angular/css/core.css";
@import "@ionic/angular/css/normalize.css";
@import "@ionic/angular/css/structure.css";
@import "@ionic/angular/css/typography.css";

@import "@ionic/angular/css/palettes/dark.class.css";

@import "../../../../libs/client/ui/theme/src/lib/theme/theme.css";  /* LAST — wins specificity */
```

### Verified: console-wrapper.scss After Fix

```scss
/* Source: codebase audit + UI-SPEC § Screen 7 */
.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  width: 100%;
}

ion-toolbar {
  /* --background removed: global --ion-toolbar-background: #0f172a now applies */
  --color: white;
  --border-width: 0 0 1px;
  --border-color: rgba(255, 255, 255, 0.1);
  height: 80px;
}

ion-title {
  padding-inline: 0;
}

.scoreboard-container {
  background: var(--ap-surface-raised, #263044); /* was: background: #111111 */
  padding: 8px 24px;
  border-radius: 12px;
  border: 2px solid var(--ion-color-primary);
  box-shadow: 0 0 15px rgba(var(--ion-color-primary-rgb), 0.2);
}

.score-value {
  font-family: 'Inter', system-ui, sans-serif;
  font-weight: 900;
  font-size: 2.25rem;
  color: white;
}

.team-label {
  font-size: 0.65rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: rgba(255, 255, 255, 0.4);
}

.team-name {
  font-size: 1.25rem;
  font-weight: 700; /* was: 800 — align to typography contract */
  color: white;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

### Verified: console-wrapper.html Template Changes

```html
<!-- Source: codebase audit + UI-SPEC § Screen 7 -->
<!-- Line 32: was bg-gray-950 -->
<div class="flex flex-col h-screen max-h-[100vh] bg-ap-bg overflow-hidden">

<!-- Line 34: was bg-gray-900 -->
<div class="flex items-center justify-between gap-4 p-4 bg-ap-surface-raised border-b border-white/5 shrink-0">

<!-- Line 69: was bg-gray-900 -->
<div class="flex-1 flex flex-col border-l border-white/10 bg-ap-surface-raised overflow-hidden">
```

### Verified: event-log.scss After Fix

```scss
/* Source: codebase audit + UI-SPEC § Screen 10 */
:host {
  display: block;
  height: 100%;
  overflow-y: auto;
  border-left: 1px solid rgba(255, 255, 255, 0.08); /* was: var(--ion-color-step-150, #e0e0e0) */
  background: var(--ion-background-color, var(--ap-surface, #1e293b)); /* was: #ffffff fallback */
}

ion-list-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--ion-background-color, var(--ap-surface, #1e293b)); /* was: #ffffff fallback */
  border-bottom: 1px solid rgba(255, 255, 255, 0.08); /* was: var(--ion-color-step-100, #f0f0f0) */
}
```

### Verified: soccer-pitch-view.html Player Name Label Change

```html
<!-- Source: codebase audit + UI-SPEC § Screen 8 -->
<!-- Line 43: was bg-black/60 -->
<span class="player-name text-[10px] font-bold text-white bg-slate-900/80 px-1.5 py-0.5 rounded shadow mt-1 whitespace-nowrap">
```

### Verified: lineup-editor.scss List Header Fix

```scss
/* Source: codebase audit + UI-SPEC § Screen 6 */
ion-list-header {
  font-weight: 700;
  font-size: 1.1rem;
  --color: var(--ion-color-primary);
  border-bottom: 2px solid rgba(255, 255, 255, 0.12); /* was: var(--ion-color-light) which is #222428 in dark */
  margin-bottom: 8px;
}
```

---

## Complete Hardcode Audit

This is a verified list of all hardcoded color values found in the codebase that need updating:

### SCSS files — confirmed by codebase grep

| File | Line | Current Value | Action |
|------|------|---------------|--------|
| `console-wrapper.scss` | 10 | `--background: #000000` on `ion-toolbar` | REMOVE the declaration |
| `console-wrapper.scss` | 22 | `background: #111111` on `.scoreboard-container` | REPLACE with `var(--ap-surface-raised, #263044)` |
| `event-log.scss` | 6 | `background: var(..., #ffffff)` on `:host` | REPLACE fallback with `var(--ap-surface, #1e293b)` |
| `event-log.scss` | 5 | `border-left: 1px solid var(--ion-color-step-150, #e0e0e0)` | REPLACE with `rgba(255,255,255,0.08)` |
| `event-log.scss` | 30 | `background: var(..., #ffffff)` on `ion-list-header` | REPLACE fallback |
| `event-log.scss` | 31 | `border-bottom: 1px solid var(--ion-color-step-100, #f0f0f0)` | REPLACE with `rgba(255,255,255,0.08)` |
| `lineup-editor.scss` | 19 | `border-bottom: 2px solid var(--ion-color-light)` | REPLACE with `rgba(255,255,255,0.12)` |
| `login.scss` | 2-5 | `ion-card { --background: var(--ion-color-step-50, #1a1a1a) }` | REMOVE entire rule |
| `signup.scss` | 1-3 | `ion-card { --background: var(--ion-color-step-50, #1a1a1a) }` | REMOVE entire rule |
| `reset-password.scss` | 1-3 | `ion-card { --background: var(--ion-color-step-50, #1a1a1a) }` | REMOVE entire rule |
| `home.scss` | 1-3 | `ion-card { --background: var(--ion-color-step-50, #1a1a1a) }` | REMOVE entire rule |
| `create-team.scss` | 2-5 | `ion-card { --background: var(--ion-color-step-50, #1a1a1a) }` | REMOVE entire rule |
| `edit-team.scss` | 2-5 | `ion-card { --background: var(--ion-color-step-50, #1a1a1a) }` | REMOVE entire rule |
| `teams-list.scss` | 3 | `--background: var(--ion-card-background, var(--ion-item-background, #1e1e1e))` | SIMPLIFY to `var(--ion-card-background)` |
| `teams-list.scss` | 7 | `border: 1px solid rgba(255,255,255,0.05)` | INCREASE to `rgba(255,255,255,0.08)` |
| `console-wrapper.scss` | 49 | `font-weight: 800` on `.team-name` | CHANGE to `700` (typography contract) |

### HTML templates — confirmed by codebase grep

| File | Line | Current Value | Action |
|------|------|---------------|--------|
| `console-wrapper.html` | 32 | `class="... bg-gray-950 ..."` | REPLACE with `bg-ap-bg` |
| `console-wrapper.html` | 34 | `class="... bg-gray-900 ..."` | REPLACE with `bg-ap-surface-raised` |
| `console-wrapper.html` | 69 | `class="... bg-gray-900 ..."` | REPLACE with `bg-ap-surface-raised` |
| `soccer-pitch-view.html` | 43 | `class="... bg-black/60 ..."` | REPLACE with `bg-slate-900/80` |

### HTML templates — Tailwind gray classes that are acceptable (no change needed)

The following `text-gray-*` classes in templates map to Tailwind's built-in gray scale. Their contrast has been verified in the UI-SPEC or are in acceptable ranges on the AP bg palette:

| Class | Hex | Contrast on `#0f172a` | Status |
|-------|-----|----------------------|--------|
| `text-gray-400` | `#9ca3af` | 5.4:1 | PASS — acceptable for secondary text |
| `text-gray-300` | `#d1d5db` | 11.2:1 | PASS |
| `text-gray-500` | `#6b7280` | 3.9:1 | BORDERLINE — only used for empty-state hints and placeholders; acceptable per design contract |

These classes (`text-gray-400` in auth pages, teams-list empty state) do NOT need to be replaced with AP tokens since the UI-SPEC explicitly notes they are acceptable.

---

## File-to-Screen Mapping

| UI-SPEC Screen | Component File(s) | Action Required |
|----------------|-------------------|-----------------|
| 1: Auth Pages | `auth/login/`, `auth/signup/`, `auth/reset-password/` | Remove redundant `ion-card { --background }` rules from 3 SCSS files |
| 2: Teams List | `teams/teams-list/` | Simplify `--background` fallback chain; increase border opacity |
| 3: Team Dashboard | `teams/team-dashboard/` | Global override handles it; no file change |
| 4: Create/Edit Team | `teams/create-team/`, `teams/edit-team/` | Remove redundant `ion-card { --background }` rules |
| 5: Create/Edit Game | `teams/games/create-game/`, `teams/games/edit-game/` | Global override handles it; both SCSS files are empty — no change |
| 6: Lineup Editor | `teams/games/lineup-editor/` | Fix `ion-list-header` border color |
| 7: Console Wrapper | `libs/.../console-wrapper/` | Remove hardcoded `#000000`, `#111111`; replace `bg-gray-*` in HTML |
| 8: Soccer Pitch | `libs/.../soccer-pitch-view/` | Replace `bg-black/60` on player name label in HTML |
| 9: Bench View | `libs/.../bench-view/` | Global override handles it; no file change |
| 10: Event Log | `libs/.../event-log/` | Replace all 4 `#ffffff` and light-gray fallbacks |
| 11: Clock Display | `libs/.../clock-display/` | No change needed — `text-white` on dark bg is correct |
| 12: Player Action Menu | `libs/.../player-action-menu/` | Global override handles it; no SCSS file exists |
| 13: Player Modal | `teams/player-modal/` | Global override handles it; existing SCSS uses `--background: transparent` — correct |
| Home (unlisted) | `home/home.scss` | Remove redundant `ion-card { --background }` rule |

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Tailwind v3 config file (`tailwind.config.js`) | Tailwind v4 `@theme` block in CSS | No config file needed; tokens declared directly in CSS |
| Ionic `src/theme/variables.css` (Ionic v6 pattern) | Override via `.ion-palette-dark` class scoped CSS | Class-based theming avoids `(prefers-color-scheme)` media query conflicts |
| Manual dark mode JS class toggling | `ThemeService` signal + `effect()` | Reactive — class is automatically applied/removed when signal changes |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Adding `@source "../../../libs/client/feature/game-console/src"` to styles.scss is required for new `bg-ap-*` utilities to resolve in console templates | Pitfall 3 | If wrong (already scanned), adding the `@source` is a no-op — zero risk. If right (and not added), ap-* classes in console templates may be purged in production builds. |
| A2 | `--ion-popover-background` is a valid Ionic 8 CSS variable for overriding popover backgrounds | theme.css block (Screen 12) | If not a real variable, the popover bg falls back to `--ion-background-color` which IS overridden — acceptable outcome. |

---

## Open Questions

1. **Does `@source` for game-console lib need to be added?**
   - What we know: `bg-gray-950` and `bg-gray-900` in `console-wrapper.html` work in production today, suggesting those templates ARE scanned by Tailwind. The existing `@source` only declares `libs/client/ui/theme/src`, not the game-console lib.
   - What's unclear: How Angular's esbuild + Tailwind v4 PostCSS integration scans templates from Nx libs that are imported into the app. The Angular esbuild builder may emit templates as part of the JS bundle before Tailwind's PostCSS step, making auto-detection work without explicit `@source`.
   - Recommendation: Add the `@source` declaration defensively. It has no downside if already covered.

2. **Does `home/home.scss` need updating?**
   - What we know: `home.html` exists with `text-gray-400` classes and `home.scss` has the redundant `ion-card { --background }` rule (confirmed by codebase grep).
   - What's unclear: The UI-SPEC's 13-screen inventory does not include the Home screen (it's a logged-in placeholder page for Phase 2 that says "You're logged in!"). However, the SCSS file has the same redundant pattern as the auth pages.
   - Recommendation: Clean up `home.scss` (remove redundant rule) as part of the per-page cleanup wave.

---

## Environment Availability

Step 2.6: SKIPPED (no external dependencies — phase is purely CSS/SCSS edits to existing files. Angular build toolchain already installed and operational).

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest (via `@angular/build:unit-test`) |
| Config file | `apps/frontend/tsconfig.spec.json` |
| Quick run command | `npx nx test frontend --testFile=src/app/app.spec.ts` |
| Full suite command | `npx nx test frontend` |

### Phase Requirements → Test Map

Phase 8 implements INFR-02 ("Athletic Professional" dark mode). This is a visual/CSS requirement. Automated unit tests cannot verify CSS variable resolution or visual rendering — the primary validation method is visual inspection in a browser.

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INFR-02 | App uses "Athletic Professional" dark mode | Visual (manual) | — | — |
| — | No regression: existing component specs pass | Unit (existing) | `npx nx test frontend` | ✅ existing |

### Sampling Rate

- **Per task commit:** `npx nx test frontend` — existing unit tests pass (no CSS regression in component logic)
- **Phase gate:** Visual inspection in browser across all 13 screens before `/gsd-verify-work`

### Wave 0 Gaps

None — existing test infrastructure covers what can be automated. No new test files needed. Visual validation is the acceptance criterion.

---

## Security Domain

ASVS not applicable to this phase. Phase 8 is exclusively CSS/SCSS token overrides with no authentication, input handling, data persistence, or external service calls.

---

## Project Constraints (from GEMINI.md)

| Constraint | Directive |
|------------|-----------|
| Tech stack | Angular 21 (Signals, `inject()` pattern), Ionic/Capacitor, Tailwind CSS v4 |
| Styling | Tailwind for layout/spacing; Ionic CSS variables for Shadow DOM components |
| Component style | No `.component.ts` suffix — Angular 21 uses `{name}.ts` |
| State management | Signals for UI-bound state — no manual `.subscribe()` |
| Design aesthetic | "Athletic Professional" — clean, dashboard-style, high-contrast, dark mode |
| Formatter | singleQuote: true, 2-space indent, UTF-8 |
| Build | `@angular/build:application` (esbuild-based) with component style budget 4kb warning / 8kb error |

**Phase 8 compliance:** All changes are CSS/SCSS only — no TypeScript or template logic changes. No new components. No new dependencies. Fully compliant with all constraints.

---

## Sources

### Primary (HIGH confidence)

- `apps/frontend/src/styles.scss` — verified current import order (19 lines, confirmed no `theme.css` import)
- `libs/client/ui/theme/src/lib/theme/theme.css` — confirmed empty (1 line file)
- `libs/client/feature/game-console/src/lib/console-wrapper/console-wrapper.scss` — confirmed `--background: #000000` and `background: #111111` hardcodes
- `libs/client/feature/game-console/src/lib/console-wrapper/console-wrapper.html` — confirmed `bg-gray-950`, `bg-gray-900` Tailwind classes
- `libs/client/feature/game-console/src/lib/event-log/event-log.scss` — confirmed `#ffffff` fallback on `:host` and `ion-list-header`
- `libs/client/feature/game-console/src/lib/soccer-pitch-view/soccer-pitch-view.html` — confirmed `bg-black/60` on player name label
- `apps/frontend/src/app/teams/games/lineup-editor/lineup-editor.scss` — confirmed `var(--ion-color-light)` border
- All auth + team page SCSS files — confirmed redundant `ion-card { --background: var(--ion-color-step-50, #1a1a1a) }` patterns
- `.planning/phases/08-ui-rework/08-UI-SPEC.md` — primary design contract, verified against codebase

### Secondary (MEDIUM confidence)

- `package.json` — `@ionic/angular: ^8.8.4`, `tailwindcss: ^4.2.2` confirmed [VERIFIED]
- `GEMINI.md` (project instructions) — project constraints and conventions [VERIFIED]

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages confirmed from `package.json`
- Architecture: HIGH — all file paths and current values verified by direct codebase read
- Pitfalls: HIGH — all pitfalls derived from actual code found in codebase (not assumed)
- Hardcode audit: HIGH — grep-verified complete list of all hardcoded color values

**Research date:** 2026-04-19
**Valid until:** 2026-05-19 (CSS/Ionic — stable; no fast-moving dependencies in scope)
