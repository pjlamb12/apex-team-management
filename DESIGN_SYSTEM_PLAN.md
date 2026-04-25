# Apex Team — Design System Implementation Plan

Generated: 2026-04-24

## Goal
Full dark + light theme support, theme switcher, consistent component reuse, easy-to-follow design system.

---

## Stack
- Angular 19 (standalone components)
- Tailwind CSS v4
- Ionic Framework
- ThemeService (signals, localStorage persistence)

---

## Root Problem
`@theme` in Tailwind v4 compiles static tokens — they never respond to `.dark` class changes.
Ionic CSS vars in `theme.css` are dark-only (applied to `:root`).
Templates use raw gray utilities (`text-gray-300`, `text-gray-400`) instead of semantic tokens.

---

## Priority Implementation Queue

### P1 — Fix Token Architecture (foundation for everything)
**File:** `apps/frontend/src/styles.scss`

Replace static `@theme` values with dynamic CSS var references:
```scss
@theme {
  --color-ap-bg: var(--ap-bg);
  --color-ap-surface: var(--ap-surface);
  --color-ap-surface-raised: var(--ap-surface-raised);
  --color-ap-accent: var(--ap-accent);
  --color-ap-success: var(--ap-success);
  --color-ap-warning: var(--ap-warning);
  --color-ap-danger: var(--ap-danger);
  --color-ap-text: var(--ap-text);
  --color-ap-muted: var(--ap-muted);
  --color-ap-border: var(--ap-border);
}

:root {
  /* LIGHT defaults */
  --ap-bg: #f8fafc;
  --ap-surface: #ffffff;
  --ap-surface-raised: #f1f5f9;
  --ap-accent: #3b82f6;
  --ap-success: #16a34a;
  --ap-warning: #ca8a04;
  --ap-danger: #dc2626;
  --ap-text: #0f172a;
  --ap-muted: #64748b;
  --ap-border: rgba(0, 0, 0, 0.1);
}

html.dark {
  --ap-bg: #0f172a;
  --ap-surface: #1e293b;
  --ap-surface-raised: #263044;
  --ap-accent: #3b82f6;
  --ap-success: #22c55e;
  --ap-warning: #eab308;
  --ap-danger: #ef4444;
  --ap-text: #f1f5f9;
  --ap-muted: #94a3b8;
  --ap-border: rgba(255, 255, 255, 0.08);
}
```

### P2 — Fix Ionic CSS Variables for Light Mode
**File:** `libs/client/ui/theme/src/lib/theme/theme.css`

Split `:root` (light) and `html.dark / .ion-palette-dark` (dark):
- Light: white backgrounds, slate-900 text, black/10 borders
- Dark: existing values

Also add `--ion-font-family: 'Plus Jakarta Sans', ...` to both.

### P3 — Fix ThemeService
**File:** `libs/client/ui/theme/src/lib/theme.service.ts`

Changes:
1. Make `isDark` a `computed()` signal (not a method) for reactive template binding
2. Fallback to `prefers-color-scheme` when no localStorage value exists

```ts
readonly isDark = computed(() => this.theme() === 'dark');

private getInitialTheme(): Theme {
  const stored = localStorage.getItem('theme') as Theme | null;
  if (stored === 'dark' || stored === 'light') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
```

### P4 — Add Theme Switcher to Shell
**File:** `apps/frontend/src/app/shell/shell.html` + `shell.ts`

Add `ion-header` with toolbar containing a theme toggle button (sun/moon icon).
Inject ThemeService, use `themeService.isDark()` signal to pick icon.

### P5 — Add Typography (Google Fonts)
**File:** `apps/frontend/src/index.html` (preconnect + font link)
**File:** `apps/frontend/src/styles.scss` (font family rules)

Fonts:
- Headings: `Barlow Condensed` (500, 600, 700) — athletic, condensed, sports brand
- Body: `Plus Jakarta Sans` (300, 400, 500, 600, 700) — clean SaaS readability

```scss
h1, h2, h3, h4, ion-card-title {
  font-family: 'Barlow Condensed', sans-serif;
  letter-spacing: 0.01em;
}
```

### P6 — Replace Hard-coded Grays in Templates
Grep for `text-gray-`, `text-white` (hard-coded), `bg-gray-` across all HTML templates.
Replace with semantic tokens:

| Old | New |
|-----|-----|
| `text-gray-300` | `text-ap-text` |
| `text-gray-400` | `text-ap-muted` |
| `text-gray-500` | `text-ap-muted` |
| `text-white` (in auth pages) | `text-ap-text` |
| `text-primary` | `text-ap-accent` |
| `bg-gray-900` | `bg-ap-bg` |

### P7 — Global UX Fixes (styles.scss)
```scss
// Focus rings
:focus-visible {
  outline: 2px solid var(--ap-accent);
  outline-offset: 2px;
}

// Reduced motion
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}

// Smooth theme transitions
html {
  transition: background-color 200ms ease, color 200ms ease;
}
```

### P8 — Build ApEmptyStateComponent
**Location:** `libs/client/ui/empty-state/`

Inputs: `icon` (string), `title` (string), `message` (string), `actionLabel?` (string)
Output: `actionClick` (EventEmitter)
Replaces inline empty states in: teams-list, drill-library, roster, schedule, game-console

### P9 — Build ApPageHeaderComponent
**Location:** `libs/client/ui/page-header/`

Inputs: `title` (string), `subtitle?` (string)
Content slots: `actions` (ng-content with select)
Replaces scattered `ion-header` + `ion-toolbar` + `ion-title` patterns

### P10 — Build ApLoadingComponent (skeleton)
**Location:** `libs/client/ui/loading/`

Variants: `list` (repeating row skeletons), `card` (card-shaped skeleton), `spinner` (centered)
Input: `variant` ('list' | 'card' | 'spinner'), `count?` (number, default 3)
Replaces bare `ion-spinner` usages

---

## Design Token Reference

### Color Palette

| Token | Dark | Light | Tailwind Class |
|-------|------|-------|----------------|
| `ap-bg` | `#0f172a` | `#f8fafc` | `bg-ap-bg`, `text-ap-bg` |
| `ap-surface` | `#1e293b` | `#ffffff` | `bg-ap-surface` |
| `ap-surface-raised` | `#263044` | `#f1f5f9` | `bg-ap-surface-raised` |
| `ap-accent` | `#3b82f6` | `#3b82f6` | `bg-ap-accent`, `text-ap-accent` |
| `ap-success` | `#22c55e` | `#16a34a` | `text-ap-success` |
| `ap-warning` | `#eab308` | `#ca8a04` | `text-ap-warning` |
| `ap-danger` | `#ef4444` | `#dc2626` | `text-ap-danger` |
| `ap-text` | `#f1f5f9` | `#0f172a` | `text-ap-text` |
| `ap-muted` | `#94a3b8` | `#64748b` | `text-ap-muted` |
| `ap-border` | `rgba(255,255,255,0.08)` | `rgba(0,0,0,0.1)` | `border-ap-border` |

### Typography

| Role | Font | Weights |
|------|------|---------|
| Headings (h1–h4, ion-card-title) | Barlow Condensed | 500, 600, 700 |
| Body, UI | Plus Jakarta Sans | 300, 400, 500, 600, 700 |

### Spacing & Layout
- Body text: minimum 16px on mobile
- Line height: 1.5–1.75 for body
- Card border radius: 12px (Ionic default, keep)
- Touch targets: minimum 44×44px
- Max content width: `max-w-2xl` (672px) for single-column, `max-w-4xl` for dashboard

### Animation
- Micro-interactions: 150–200ms ease
- Theme transition: 200ms ease (on `html` element)
- No layout-shifting transforms on hover (use `brightness` or `shadow` instead)

---

## Files Modified (track progress)

- [x] `apps/frontend/src/styles.scss` — P1, P5 (partial), P7 ✓
- [x] `apps/frontend/src/index.html` — P5 (Google Fonts preconnect + link) ✓
- [x] `libs/client/ui/theme/src/lib/theme/theme.css` — P2 ✓
- [x] `libs/client/ui/theme/src/lib/theme.service.ts` — P3 ✓
- [x] `apps/frontend/src/app/shell/shell.html` — P4 ✓
- [x] `apps/frontend/src/app/shell/shell.ts` — P4 ✓
- [x] All `*.html` template files — P6 (gray → token replacements) ✓
- [x] `libs/client/feature/practice-console/.../practice-execution-tab.ts` — pre-existing build fix ✓
- [x] `libs/client/ui/empty-state/` — P8 (EmptyState component) ✓
- [x] `libs/client/ui/section-label/` — P9 (SectionLabel component, replaces inline form section dividers) ✓
- [x] `libs/client/ui/loading/` — P10 (Loading component, variants: spinner/list/card) ✓

---

## Accessibility Checklist (verify at end)
- [ ] Color contrast 4.5:1 for normal text in both themes
- [ ] Focus rings visible in both themes
- [ ] `prefers-reduced-motion` respected
- [ ] All icon-only buttons have `aria-label`
- [ ] Form inputs have associated labels
- [ ] No color as sole error indicator
- [ ] Tab order matches visual order
