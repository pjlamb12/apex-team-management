# Phase 8: UI Rework — Pattern Map

**Mapped:** 2026-04-19
**Files analyzed:** 12 files to be modified (0 new files)
**Analogs found:** 12 / 12 (all files are their own analog — this is a within-file cleanup phase)

---

## File Classification

| Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---------------|------|-----------|----------------|---------------|
| `apps/frontend/src/styles.scss` | config | transform | itself (current 19-line state) | exact |
| `libs/client/ui/theme/src/lib/theme/theme.css` | config | transform | `apps/frontend/src/styles.scss` (import chain pattern) | role-match |
| `libs/client/feature/game-console/src/lib/console-wrapper/console-wrapper.scss` | component-style | request-response | itself (current hardcoded state) | exact |
| `libs/client/feature/game-console/src/lib/console-wrapper/console-wrapper.html` | component-template | request-response | itself (current Tailwind class state) | exact |
| `libs/client/feature/game-console/src/lib/event-log/event-log.scss` | component-style | request-response | itself (current `#ffffff` fallback state) | exact |
| `libs/client/feature/game-console/src/lib/soccer-pitch-view/soccer-pitch-view.html` | component-template | request-response | itself (current `bg-black/60` state) | exact |
| `apps/frontend/src/app/teams/games/lineup-editor/lineup-editor.scss` | component-style | request-response | itself (current `--ion-color-light` border state) | exact |
| `apps/frontend/src/app/auth/login/login.scss` | component-style | request-response | `signup.scss`, `reset-password.scss`, `home.scss` | exact |
| `apps/frontend/src/app/auth/signup/signup.scss` | component-style | request-response | `login.scss` | exact |
| `apps/frontend/src/app/auth/reset-password/reset-password.scss` | component-style | request-response | `login.scss` | exact |
| `apps/frontend/src/app/home/home.scss` | component-style | request-response | `login.scss` | exact |
| `apps/frontend/src/app/teams/create-team/create-team.scss` | component-style | request-response | `edit-team.scss` | exact |
| `apps/frontend/src/app/teams/edit-team/edit-team.scss` | component-style | request-response | `create-team.scss` | exact |
| `apps/frontend/src/app/teams/teams-list/teams-list.scss` | component-style | CRUD | itself (more complex than auth pages) | exact |

---

## Pattern Assignments

### `apps/frontend/src/styles.scss` (config, transform)

**Action:** ADD `@theme` block after `@import "tailwindcss"`, ADD second `@source` for game-console lib, ADD `@import` for `theme.css` as the last line.

**Current state** (lines 1–19 — entire file):
```scss
@import "tailwindcss";

// Tailwind v4: override dark variant to use .dark class on <html> (D-09)
// This enables dark: utility classes when <html class="dark"> is set
@custom-variant dark (&:where(.dark, .dark *));

// Tailwind v4: explicit source paths for Nx libs (Pitfall 3 in RESEARCH.md)
// Prevents Tailwind from purging classes used in lib component templates
@source "../../../libs/client/ui/theme/src";

// Ionic core CSS — must be imported after Tailwind to allow Ionic's reset to coexist
@import "@ionic/angular/css/core.css";
@import "@ionic/angular/css/normalize.css";
@import "@ionic/angular/css/structure.css";
@import "@ionic/angular/css/typography.css";

// Ionic dark palette — class-based, activated when <html class="ion-palette-dark"> is set
// ThemeService (Plan 05) applies BOTH .dark AND .ion-palette-dark simultaneously
@import "@ionic/angular/css/palettes/dark.class.css";
```

**After-fix target state** (complete replacement):
```scss
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

// Tailwind v4: override dark variant to use .dark class on <html> (D-09)
@custom-variant dark (&:where(.dark, .dark *));

// Tailwind v4: explicit source paths for Nx libs
@source "../../../libs/client/ui/theme/src";
@source "../../../libs/client/feature/game-console/src";

// Ionic core CSS
@import "@ionic/angular/css/core.css";
@import "@ionic/angular/css/normalize.css";
@import "@ionic/angular/css/structure.css";
@import "@ionic/angular/css/typography.css";

// Ionic dark palette — class-based
@import "@ionic/angular/css/palettes/dark.class.css";

// AP dark theme overrides — MUST be last to win specificity over Ionic defaults
@import "../../../../libs/client/ui/theme/src/lib/theme/theme.css";
```

**Critical constraint:** `@import theme.css` MUST appear after `@import "@ionic/angular/css/palettes/dark.class.css"`. Same selector specificity — last declaration wins.

---

### `libs/client/ui/theme/src/lib/theme/theme.css` (config, transform)

**Action:** FILL the currently empty file with the complete `.ion-palette-dark` override block.

**Current state** (line 1 only — file is empty/1 blank line):
```css
/* (empty) */
```

**After-fix target state** (complete file content):
```css
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

**Why this fixes Screens 1–6 and 11–13:** `ion-content`, `ion-card`, `ion-item`, `ion-toolbar`, `ion-tab-bar`, `ion-modal` all read their background from these CSS variables. Once overridden here, every page that inherits from Ionic's theming system automatically uses `#0f172a` instead of `#000000`.

---

### `libs/client/feature/game-console/src/lib/console-wrapper/console-wrapper.scss` (component-style, request-response)

**Action:** REMOVE `--background: #000000` from `ion-toolbar` (line 10). REPLACE `background: #111111` on `.scoreboard-container` (line 22) with `var(--ap-surface-raised, #263044)`. CHANGE `.team-name` `font-weight: 800` (line 46) to `700`.

**Current broken state** (entire file, lines 1–52):
```scss
.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  width: 100%;
}

ion-toolbar {
  --background: #000000;   /* LINE 10 — hardcoded; wins over global --ion-toolbar-background */
  --color: white;
  --border-width: 0 0 1px;
  --border-color: rgba(255, 255, 255, 0.1);
  height: 80px;
}

ion-title {
  padding-inline: 0;
}

.scoreboard-container {
  background: #111111;     /* LINE 22 — hardcoded near-black; bypasses token system */
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
  font-weight: 800;   /* LINE 46 — typography contract requires 700 */
  color: white;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

**Three targeted changes:**
1. Line 10: DELETE `--background: #000000;` entirely — global `--ion-toolbar-background: #0f172a` then applies
2. Line 22: CHANGE `background: #111111;` → `background: var(--ap-surface-raised, #263044);`
3. Line 46: CHANGE `font-weight: 800;` → `font-weight: 700;`

---

### `libs/client/feature/game-console/src/lib/console-wrapper/console-wrapper.html` (component-template, request-response)

**Action:** Replace three Tailwind `bg-gray-*` classes with AP token equivalents.

**Current broken state — three lines with hardcoded Tailwind grays:**

Line 32:
```html
<div class="flex flex-col h-screen max-h-[100vh] bg-gray-950 overflow-hidden">
```

Line 34:
```html
<div class="flex items-center justify-between gap-4 p-4 bg-gray-900 border-b border-white/5 shrink-0">
```

Line 69:
```html
<div class="flex-1 flex flex-col border-l border-white/10 bg-gray-900 overflow-hidden">
```

**After-fix replacements:**

Line 32 — `bg-gray-950` → `bg-ap-bg`:
```html
<div class="flex flex-col h-screen max-h-[100vh] bg-ap-bg overflow-hidden">
```

Line 34 — `bg-gray-900` → `bg-ap-surface-raised`:
```html
<div class="flex items-center justify-between gap-4 p-4 bg-ap-surface-raised border-b border-white/5 shrink-0">
```

Line 69 — `bg-gray-900` → `bg-ap-surface-raised`:
```html
<div class="flex-1 flex flex-col border-l border-white/10 bg-ap-surface-raised overflow-hidden">
```

**Token mapping:**
- `bg-gray-950` (`#030712`) → `bg-ap-bg` (`#0f172a`) — page-level background
- `bg-gray-900` (`#111827`) → `bg-ap-surface-raised` (`#263044`) — elevated surface (top bar, sideline panel)

---

### `libs/client/feature/game-console/src/lib/event-log/event-log.scss` (component-style, request-response)

**Action:** Replace four light-mode fallback values — two `#ffffff` background fallbacks and two light-gray border fallbacks.

**Current broken state** (entire file, lines 1–31):
```scss
:host {
  display: block;
  height: 100%;
  overflow-y: auto;
  border-left: 1px solid var(--ion-color-step-150, #e0e0e0);  /* LINE 5 — #e0e0e0 is light gray */
  background: var(--ion-background-color, #ffffff);            /* LINE 6 — #ffffff causes white flash */
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 32px;
  text-align: center;
}

ion-badge {
  min-width: 40px;
}

ion-list {
  padding-top: 0;
}

ion-list-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--ion-background-color, #ffffff);            /* LINE 29 — #ffffff causes white flash */
  border-bottom: 1px solid var(--ion-color-step-100, #f0f0f0); /* LINE 30 — #f0f0f0 is light gray */
}
```

**Four targeted changes:**
1. Line 5: `var(--ion-color-step-150, #e0e0e0)` → `rgba(255, 255, 255, 0.08)`
2. Line 6: `var(--ion-background-color, #ffffff)` → `var(--ion-background-color, var(--ap-surface, #1e293b))`
3. Line 29: `var(--ion-background-color, #ffffff)` → `var(--ion-background-color, var(--ap-surface, #1e293b))`
4. Line 30: `var(--ion-color-step-100, #f0f0f0)` → `rgba(255, 255, 255, 0.08)`

**Why the dark fallback matters:** Before Ionic resolves `--ion-background-color`, the CSS variable chain needs a dark fallback. `#ffffff` renders a blinding white panel inside the dark console for a brief moment on load.

---

### `libs/client/feature/game-console/src/lib/soccer-pitch-view/soccer-pitch-view.html` (component-template, request-response)

**Action:** Replace `bg-black/60` with `bg-slate-900/80` on the player name label (line 43 only).

**Current broken state** (line 43):
```html
<span class="player-name text-[10px] font-bold text-white bg-black/60 px-1.5 py-0.5 rounded shadow mt-1 whitespace-nowrap">
```

**After-fix:**
```html
<span class="player-name text-[10px] font-bold text-white bg-slate-900/80 px-1.5 py-0.5 rounded shadow mt-1 whitespace-nowrap">
```

**Why:** `bg-black/60` (`rgba(0,0,0,0.6)`) is pure black. `bg-slate-900/80` (`rgba(15,23,42,0.8)`) is a warmer dark slate that matches the AP palette — slightly higher opacity compensates for the lighter base color while still allowing the green pitch to show through.

**Note:** All other classes in this file are intentionally kept — `bg-green-700` (pitch), `bg-blue-600`/`bg-yellow-400` (player circles), `text-black` on selected jersey — these are all correct per the UI-SPEC.

---

### `apps/frontend/src/app/teams/games/lineup-editor/lineup-editor.scss` (component-style, request-response)

**Action:** Replace `var(--ion-color-light)` border on `ion-list-header` (line 19) with `rgba(255,255,255,0.12)`.

**Current broken state** (entire file, lines 1–32):
```scss
:host {
  display: block;
}

.slot-row {
  align-items: center;

  ion-select {
    --padding-start: 0;
    --padding-end: 0;
    min-height: 44px;
  }
}

ion-list-header {
  font-weight: 700;
  font-size: 1.1rem;
  --color: var(--ion-color-primary);
  border-bottom: 2px solid var(--ion-color-light);  /* LINE 19 — dark mode: #222428 (nearly invisible) */
  margin-bottom: 8px;
}

ion-item {
  --padding-start: 8px;
  --inner-padding-end: 8px;
}

ion-badge {
  font-size: 0.75rem;
  padding: 4px 8px;
}
```

**One targeted change:**
- Line 19: `border-bottom: 2px solid var(--ion-color-light);` → `border-bottom: 2px solid rgba(255, 255, 255, 0.12);`

**Why:** In Ionic's dark palette, `--ion-color-light` resolves to `#222428` (dark charcoal). A `2px solid #222428` border on a `#0f172a` background has insufficient contrast — it is functionally invisible. `rgba(255,255,255,0.12)` provides a clean semi-transparent white separator that works across all AP surfaces.

---

### `apps/frontend/src/app/auth/login/login.scss` (component-style, request-response)

**Action:** REMOVE the entire `ion-card { --background }` rule (lines 1–5 — the entire file becomes a comment-only skeleton or empty file).

**Current broken state** (entire file, lines 1–5):
```scss
// Login page styles — dark theme applied globally via ThemeService
// ion-card inherits dark mode variables from Ionic theming
ion-card {
  --background: var(--ion-color-step-50, #1a1a1a);
}
```

**After-fix:** Remove lines 3–5. The comment on lines 1–2 may remain or be removed — the important thing is the rule is gone. Once `theme.css` sets `--ion-card-background: #1e293b` and `--ion-color-step-50: #1e293b` globally, this per-component override is both redundant and potentially conflicting.

---

### `apps/frontend/src/app/auth/signup/signup.scss` (component-style, request-response)
### `apps/frontend/src/app/auth/reset-password/reset-password.scss` (component-style, request-response)
### `apps/frontend/src/app/home/home.scss` (component-style, request-response)

**Action:** Same as `login.scss` — REMOVE the entire `ion-card { --background }` rule.

**Current broken state** (all three files are identical, lines 1–3):
```scss
ion-card {
  --background: var(--ion-color-step-50, #1a1a1a);
}
```

**After-fix:** Delete the rule entirely. These files will be empty (or contain only a comment if preferred by convention).

---

### `apps/frontend/src/app/teams/create-team/create-team.scss` (component-style, request-response)
### `apps/frontend/src/app/teams/edit-team/edit-team.scss` (component-style, request-response)

**Action:** REMOVE the `--background` declaration from `ion-card` (lines 3–4 from the `--background` line only). The `border-radius: 12px` on the same rule block is intentional styling — KEEP IT.

**Current broken state** (both files identical, lines 1–5):
```scss
// Create team page styles   (or "Edit team page styles")
ion-card {
  --background: var(--ion-color-step-50, #1a1a1a);
  border-radius: 12px;
}
```

**After-fix** — remove only `--background` line, keep `border-radius`:
```scss
// Create team page styles   (or "Edit team page styles")
ion-card {
  border-radius: 12px;
}
```

**Critical difference from auth pages:** Do NOT delete the entire `ion-card` block here — `border-radius: 12px` is legitimate custom styling that does not come from the global override.

---

### `apps/frontend/src/app/teams/teams-list/teams-list.scss` (component-style, CRUD)

**Action:** SIMPLIFY the `--background` fallback chain on `ion-card` (line 3). INCREASE the border opacity (line 6) from `0.05` to `0.08`.

**Current broken state** (lines 1–10 — the `ion-card` rule):
```scss
// Teams list page styles
ion-card {
  --background: var(--ion-card-background, var(--ion-item-background, #1e1e1e));  /* LINE 3 */
  --color: var(--ion-text-color, white);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.05);  /* LINE 6 — barely visible at 5% opacity */
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  margin-bottom: 16px;
  overflow: hidden;
}
```

**Two targeted changes in the `ion-card` rule:**
1. Line 3: `--background: var(--ion-card-background, var(--ion-item-background, #1e1e1e));` → `--background: var(--ion-card-background);`
2. Line 6: `border: 1px solid rgba(255, 255, 255, 0.05);` → `border: 1px solid rgba(255, 255, 255, 0.08);`

**Why line 3:** With `theme.css` setting `--ion-card-background: #1e293b`, the nested fallback chain `var(--ion-card-background, var(--ion-item-background, #1e1e1e))` is unnecessary noise. Simplifying to `var(--ion-card-background)` is cleaner and still correct.

**Why line 6:** `rgba(255,255,255,0.05)` at 5% opacity on `#0f172a` creates `~#18202e` — a barely perceptible border. Increasing to 8% (`rgba(255,255,255,0.08)`) matches the `--ap-border` value used across the rest of the design system and provides visible card depth.

**Keep all other rules unchanged** — `ion-card-header`, `ion-card-content`, `ion-card-title`, `ion-badge`, `ion-fab-button`, `.max-w-2xl` are all correct.

---

## Shared Patterns

### Ionic Shadow DOM Override Pattern
**Source:** `libs/client/feature/game-console/src/lib/console-wrapper/console-wrapper.scss` (current broken state, lines 9–15)
**Apply to:** Any component SCSS that sets `--background` directly on Ionic components
**Rule:** When a component sets `--background: <hardcode>` on an Ionic component (e.g. `ion-toolbar`, `ion-card`), that hardcode wins over the global CSS variable. The fix is always to DELETE the hardcoded `--background` declaration and let the global `--ion-toolbar-background` / `--ion-card-background` from `theme.css` resolve.

```scss
/* PATTERN: Remove hardcoded --background to allow global variable cascade */

/* BEFORE — component override wins, global variable ignored: */
ion-toolbar {
  --background: #000000;   /* blocks global --ion-toolbar-background */
}

/* AFTER — global --ion-toolbar-background: #0f172a now applies: */
ion-toolbar {
  /* --background removed */
  --color: white;
  --border-width: 0 0 1px;
  --border-color: rgba(255, 255, 255, 0.1);
  height: 80px;
}
```

---

### Dark Fallback Pattern for CSS Variable Chains
**Source:** `libs/client/feature/game-console/src/lib/event-log/event-log.scss` (current broken lines 5–6, 29–30)
**Apply to:** Any SCSS using `var(--ion-*, #ffffff)` or `var(--ion-*, #f0f0f0)` or similar light fallbacks
**Rule:** In an always-dark app, CSS variable fallback values must be dark. Never use `#ffffff`, `#f0f0f0`, `#e0e0e0`, or any light hex as a fallback for background/border properties.

```scss
/* PATTERN: Always-dark fallback chain */

/* BEFORE — white fallback causes flash on load: */
background: var(--ion-background-color, #ffffff);
border-left: 1px solid var(--ion-color-step-150, #e0e0e0);

/* AFTER — dark fallback chain: */
background: var(--ion-background-color, var(--ap-surface, #1e293b));
border-left: 1px solid rgba(255, 255, 255, 0.08);
```

---

### Redundant Per-Component Ion-Card Override Pattern
**Source:** `apps/frontend/src/app/auth/login/login.scss` (lines 3–5), `signup.scss` (lines 1–3), `reset-password.scss` (lines 1–3), `home.scss` (lines 1–3)
**Apply to:** Any component SCSS file that sets `ion-card { --background: var(--ion-color-step-50, ...) }`
**Rule:** Once `theme.css` sets `--ion-color-step-50: #1e293b` and `--ion-card-background: #1e293b` globally, per-component `ion-card { --background }` overrides that reference those variables are redundant. Remove them.

```scss
/* PATTERN: Remove redundant per-component card background override */

/* BEFORE — redundant (global theme.css already sets --ion-color-step-50 correctly): */
ion-card {
  --background: var(--ion-color-step-50, #1a1a1a);
}

/* AFTER — empty file (or file with only comment): */
/* (rule deleted entirely) */
```

---

### Tailwind AP Token Replacement Pattern
**Source:** `libs/client/feature/game-console/src/lib/console-wrapper/console-wrapper.html` (lines 32, 34, 69)
**Apply to:** Any HTML template using `bg-gray-950`, `bg-gray-900` in the game console context
**Rule:** Replace hardcoded Tailwind gray-scale utilities with semantic AP token utilities. These only work after the `@theme` block is added to `styles.scss`.

```html
<!-- PATTERN: Replace Tailwind grays with AP semantic tokens -->

<!-- BEFORE: -->
<div class="bg-gray-950">     <!-- page background: #030712 -->
<div class="bg-gray-900">     <!-- elevated surface: #111827 -->

<!-- AFTER: -->
<div class="bg-ap-bg">              <!-- page background: #0f172a -->
<div class="bg-ap-surface-raised">  <!-- elevated surface: #263044 -->
```

**Token reference:**
- `bg-ap-bg` = `#0f172a` (replaces `bg-gray-950` for page backgrounds)
- `bg-ap-surface` = `#1e293b` (replaces `bg-gray-900` for card/list surfaces)
- `bg-ap-surface-raised` = `#263044` (replaces `bg-gray-900` for elevated surfaces like top bar, sideline panel)

---

## No Analog Found

No files in this phase lack an analog. All modifications are to existing files which serve as their own primary reference. The target state for each file is fully specified in the RESEARCH.md code examples and UI-SPEC design contract.

---

## Metadata

**Analog search scope:** `apps/frontend/src/`, `libs/client/feature/game-console/src/`, `libs/client/ui/theme/src/`
**Files read directly:** 12 source files + styles.scss + theme.css
**Pattern extraction date:** 2026-04-19

**Implementation order (from UI-SPEC § Implementation Priority):**
1. `theme.css` — fill with `.ion-palette-dark` block
2. `styles.scss` — add `@theme` block, second `@source`, `@import theme.css`
3. `event-log.scss` — fix `#ffffff` fallbacks (high-visibility risk)
4. `console-wrapper.scss` + `console-wrapper.html` — remove hardcoded blacks
5. Auth + team page SCSS files (login, signup, reset-password, home, create-team, edit-team) — remove redundant `ion-card` rules
6. `soccer-pitch-view.html` — replace `bg-black/60`
7. `lineup-editor.scss` — fix list-header border
8. `teams-list.scss` — simplify fallback chain + increase border opacity
