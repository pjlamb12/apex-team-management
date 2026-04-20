---
phase: 3
slug: teams-sport-configuration
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-16
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (via `@nx/vitest 22.6.5`) for unit tests; `@angular/build:unit-test` executor for frontend |
| **Config file** | `libs/shared/util/models/vitest.config.mts` (existing); frontend uses Angular build executor |
| **Quick run command** | `nx test frontend --testFile=src/app/teams/teams-list/teams-list.spec.ts` |
| **Full suite command** | `nx run-many --target=test --all` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `nx test frontend` or `nx test api` (whichever is relevant to the task)
- **After every plan wave:** Run `nx run-many --target=test --projects=frontend,api`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** ~30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 3-01-01 | 01 | 0 | TEAM-01 | — | N/A | unit | `nx test api --testFile=src/teams/teams.service.spec.ts` | ❌ W0 | ⬜ pending |
| 3-01-02 | 01 | 0 | TEAM-02 | — | N/A | unit | `nx test api --testFile=src/sports/sports.service.spec.ts` | ❌ W0 | ⬜ pending |
| 3-01-03 | 01 | 0 | TEAM-04 | — | N/A | unit | `nx test api --testFile=src/teams/teams.service.spec.ts` | ❌ W0 | ⬜ pending |
| 3-01-04 | 01 | 0 | TEAM-05 | — | N/A | unit | `nx test api --testFile=src/teams/teams.service.spec.ts` | ❌ W0 | ⬜ pending |
| 3-02-01 | 02 | 0 | TEAM-01 | — | N/A | unit (Angular TestBed) | `nx test frontend --testFile=src/app/teams/create-team/create-team.spec.ts` | ❌ W0 | ⬜ pending |
| 3-02-02 | 02 | 0 | TEAM-05 | — | N/A | unit (Angular TestBed) | `nx test frontend --testFile=src/app/teams/teams-list/teams-list.spec.ts` | ❌ W0 | ⬜ pending |
| 3-02-03 | 02 | 0 | — | — | N/A | unit (Angular TestBed) | `nx test frontend --testFile=src/app/shell/shell.spec.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/api/src/teams/teams.service.spec.ts` — stubs for TEAM-01, TEAM-04, TEAM-05 (service unit tests with mocked TypeORM repository)
- [ ] `apps/api/src/sports/sports.service.spec.ts` — stubs for TEAM-02
- [ ] `apps/frontend/src/app/teams/teams-list/teams-list.spec.ts` — stubs for TEAM-05 (delete flow)
- [ ] `apps/frontend/src/app/teams/create-team/create-team.spec.ts` — stubs for TEAM-01, TEAM-02 (form + navigation)
- [ ] `apps/frontend/src/app/shell/shell.spec.ts` — smoke test for tab bar render

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Empty state UI (centered icon + message + button) | TEAM-01 | Visual layout cannot be asserted by unit test | Log in as new coach with no teams; verify empty state renders with icon, message, and Create Team button |
| Delete confirmation dialog | TEAM-05 | AlertController modal interaction | Click Delete on a team card; verify alert appears with Cancel and Delete (destructive) buttons |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
