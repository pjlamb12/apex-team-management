---
phase: 5
slug: games-lineup
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-17
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x (API unit), Cypress (e2e) |
| **Config file** | `apps/api/jest.config.ts`, `apps/frontend/jest.config.ts` |
| **Quick run command** | `nx test api --testPathPattern=games` |
| **Full suite command** | `nx run-many --target=test --all` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `nx test api --testPathPattern=games`
- **After every plan wave:** Run `nx run-many --target=test --all`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 5-01-01 | 01 | 1 | GAME-01 | T-5-01 / — | Migration creates correct columns | integration | `nx run api:typeorm migration:run` | ✅ W0 | ⬜ pending |
| 5-01-02 | 01 | 1 | GAME-01 | — | LineupEntryEntity maps correctly | unit | `nx test api --testPathPattern=lineup` | ✅ W0 | ⬜ pending |
| 5-02-01 | 02 | 1 | GAME-02 | T-5-02 | Coach ownership enforced on create | unit | `nx test api --testPathPattern=games.service` | ✅ W0 | ⬜ pending |
| 5-02-02 | 02 | 1 | GAME-02 | T-5-02 | Auto-season creation tested | unit | `nx test api --testPathPattern=games.service` | ✅ W0 | ⬜ pending |
| 5-03-01 | 03 | 2 | GAME-03 | — | Game list via season join works | unit | `nx test api --testPathPattern=games.service` | ✅ W0 | ⬜ pending |
| 5-03-02 | 03 | 2 | GAME-04 | — | Edit game before game starts | unit | `nx test api --testPathPattern=games.service` | ✅ W0 | ⬜ pending |
| 5-04-01 | 04 | 2 | LIVE-01 | — | Lineup save stores all players | unit | `nx test api --testPathPattern=lineup` | ✅ W0 | ⬜ pending |
| 5-04-02 | 04 | 2 | LIVE-02 | — | Bench derivation is correct | unit | `nx test api --testPathPattern=lineup` | ✅ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/api/src/games/games.service.spec.ts` — stubs for GAME-01, GAME-02, GAME-03, GAME-04
- [ ] `apps/api/src/games/lineup-entries.service.spec.ts` — stubs for LIVE-01, LIVE-02

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| IonSegment Roster/Games tab switch renders correct view | GAME-03 | UI interaction requires browser | Load team dashboard, tap Games segment, verify games list renders |
| Lineup editor per-slot player picker deduplication | LIVE-01 | DOM interaction | Assign player to slot 1, verify same player absent from slot 2 picker |
| Game creation navigates to lineup editor | GAME-01 | Navigation flow | Create game, verify redirect to /teams/:id/games/:gameId/lineup |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
