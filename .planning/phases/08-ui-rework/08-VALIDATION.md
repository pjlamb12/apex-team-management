---
phase: 8
slug: ui-rework
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-19
---

# Phase 8 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (via `@angular/build:unit-test`) |
| **Config file** | `apps/frontend/tsconfig.spec.json` |
| **Quick run command** | `npx nx test frontend` |
| **Full suite command** | `npx nx test frontend` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx nx test frontend` — existing unit tests confirm no regressions in component logic
- **After every plan wave:** Run `npx nx test frontend` (full suite)
- **Before `/gsd-verify-work`:** Full suite must be green + visual inspection across all 13 screens
- **Max feedback latency:** ~30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 8-01-01 | 01 | 1 | INFR-02 | — | N/A | visual | — | — | ⬜ pending |
| 8-01-02 | 01 | 1 | INFR-02 | — | N/A | unit (regression) | `npx nx test frontend` | ✅ existing | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements. No new test files needed — visual validation is the primary acceptance criterion for CSS/theme changes.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| No solid black backgrounds across all 13 screens | INFR-02 | CSS variable resolution and visual rendering cannot be asserted via unit tests | Run `npx nx serve frontend`, navigate to all 13 screens with dark mode enabled, confirm no `#000000` backgrounds |
| Sufficient contrast (text readable on all backgrounds) | INFR-02 | Contrast ratio requires visual or browser dev tools inspection | Check text/background pairs in browser DevTools accessibility inspector |
| Consistent card depth (cards visually distinct from page bg) | INFR-02 | Visual judgment call — no binary pass/fail automatable | Confirm `#1e293b` cards are distinguishable from `#0f172a` page background on each screen |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
