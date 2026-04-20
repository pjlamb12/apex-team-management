---
phase: 1
slug: workspace-data-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-14
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (via `@angular/build:unit-test` in Nx) |
| **Config file** | `apps/frontend/project.json` (unit-test target); new libs get their own vitest config |
| **Quick run command** | `nx test frontend --watch=false` |
| **Full suite command** | `nx run-many --target=test --all` |
| **Estimated runtime** | ~15 seconds (smoke), ~45 seconds (full suite) |

---

## Sampling Rate

- **After every task commit:** Run `nx test frontend --watch=false`
- **After every plan wave:** Run `nx run-many --target=test --all`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 45 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 1-ThemeSvc-init | theme | 1 | INFR-02 | — | OS preference read on init | unit | `nx test client-ui-theme --watch=false` | ❌ W0 | ⬜ pending |
| 1-ThemeSvc-toggle | theme | 1 | INFR-02 | — | `.dark` + `.ion-palette-dark` applied to `<html>` | unit | `nx test client-ui-theme --watch=false` | ❌ W0 | ⬜ pending |
| 1-ThemeSvc-persist | theme | 1 | INFR-02 | — | localStorage persists preference | unit | `nx test client-ui-theme --watch=false` | ❌ W0 | ⬜ pending |
| 1-Ionic-providers | infra | 1 | INFR-01 | — | `provideIonicAngular()` in app config | unit | `nx test frontend --watch=false` | ✅ exists | ⬜ pending |
| 1-DB-migration | db | 2 | TEAM-03 | T-1-env | `.env` not in git; `.env.example` committed | manual | See Manual-Only | ❌ W0 | ⬜ pending |
| 1-Sport-seed | db | 2 | TEAM-03 | — | Soccer sport config seeded with 4 position types | manual | See Manual-Only | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `libs/client/ui/theme/src/lib/theme.service.spec.ts` — unit stubs for INFR-02 (ThemeService init, toggle, persist)
- [ ] `libs/shared/util/models` — interfaces only, no test file needed

*Note: Migration integration tests are manual-only (require live DB) — documented in Manual-Only Verifications below.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| TypeORM migrations run successfully | TEAM-03 | Requires live PostgreSQL DB connection | Run `npx typeorm migration:run -d apps/api/src/data-source.ts`; verify exit code 0 and table creation |
| Soccer sport config seeded | TEAM-03 | Requires live DB + seed script | Run seed command; query `SELECT * FROM sport WHERE name = 'Soccer'`; verify 4 position_types in JSONB |
| `.env` not committed to git | Security | Git state check | Run `git ls-files .env`; expect empty output. Verify `.env.example` is tracked. |
| Tailwind + Ionic dark mode renders | INFR-02 | Visual verification | Start app, toggle dark mode, verify Ionic components use dark palette and Tailwind dark: utilities apply |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 45s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
