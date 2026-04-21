---
phase: 12
slug: season-integrated-games-analytics
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-20
---

# Phase 12 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (NestJS Testing Module + vitest; Angular unit test runner + vitest) |
| **Config file** | `vitest.config.ts` per app (or `project.json` test target) |
| **Quick run command** | `nx test api --testFile=apps/api/src/events/events.service.spec.ts` |
| **Full suite command** | `nx run-many --target=test --projects=api,frontend` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `nx test api --testFile=apps/api/src/events/events.service.spec.ts`
- **After every plan wave:** Run `nx run-many --target=test --projects=api,frontend`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** ~30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 12-01-01 | 01 | 1 | GAME-06, GAME-08 | T-12-01 | DTO rejects negative scores; migration adds nullable columns only | unit | `nx test api --testFile=apps/api/src/events/events.service.spec.ts` | ✅ extend | ⬜ pending |
| 12-02-01 | 02 | 1 | GAME-06 | — | `findAllForTeam()` with seasonId filters correctly | unit | `nx test api --testFile=apps/api/src/events/events.service.spec.ts` | ✅ extend | ⬜ pending |
| 12-02-02 | 02 | 1 | GAME-08 | T-12-02 | `getSeasonStats()` verifies teamId before returning data | unit | `nx test api --testFile=apps/api/src/teams/seasons.service.spec.ts` | ✅ extend | ⬜ pending |
| 12-03-01 | 03 | 2 | GAME-06 | — | Season picker defaults to active season on load | unit | `nx test frontend --testFile=apps/frontend/src/app/teams/events/events.service.spec.ts` | ✅ extend | ⬜ pending |
| 12-04-01 | 04 | 2 | GAME-08 | — | Stats section renders correct win/loss/draw/GF/GA/GD values | unit | `nx test frontend --testFile=apps/frontend/src/app/teams/seasons/seasons.service.spec.ts` | ✅ extend | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/api/src/teams/seasons.service.spec.ts` — add `getSeasonStats` test cases (file exists, extend it)
- [ ] `apps/frontend/src/app/teams/events/events.service.spec.ts` — add `getEvents(teamId, scope, seasonId)` test cases (file exists, extend it)

*No new test files needed — all test work extends existing spec files.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Score pre-fill when completed game loads in edit form | GAME-08 (D-08) | Requires E2E interaction flow (create game → mark completed → open edit form) | Open edit screen for a completed game; verify goalsFor field pre-populated from GOAL event count |
| Season picker shows all team seasons | GAME-06 | Requires live data in UI | Open Schedule tab; verify picker lists all seasons for team |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
