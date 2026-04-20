# Phase 10 Validation: Season Lifecycle & Defaults

**Status:** Initializing
**Date:** 2026-04-20

## 1. Goal
Verify that season management follows the "Exactly Zero or One Active" policy, prevents deleting seasons with games, and provides a functional UI for creating/editing seasons.

## 2. Automated Validation (Nyquist)

### 2.1 Backend Logic
| Req ID | Behavior | Test Type | Command |
|--------|----------|-----------|---------|
| SEAS-05 | Auto-deactivation of old seasons | Unit/Integration | `npx nx test api --testPathPattern=seasons.service.spec.ts` |
| SEAS-06 | Block delete if games exist | Unit | `npx nx test api --testPathPattern=seasons.service.spec.ts` |

### 2.2 Schema & Models
| Req ID | Behavior | Test Type | Command |
|--------|----------|-----------|---------|
| SEAS-07 | Migration for defaultPracticeLocation | Build | `npx nx build api` |
| — | Shared models updated | Lint | `npx nx lint models` |

### 2.3 Frontend Scaffolding
| Req ID | Behavior | Test Type | Command |
|--------|----------|-----------|---------|
| — | Frontend build success | Build | `npx nx build frontend` |
| — | Linting | Lint | `npx nx lint frontend` |

## 3. Human UAT (Manual)

### 3.1 Season Lifecycle
- [ ] Create a new season named "Test Season".
- [ ] Edit "Test Season" and mark it as `Active`.
- [ ] Create a second season "New Active Season" and mark it as `Active`.
- [ ] Verify "Test Season" is now automatically set to `Inactive`.
- [ ] Verify a season with games cannot be deleted.

### 3.2 Navigation & Settings
- [ ] Navigate to **Team Settings** -> **Manage Seasons**.
- [ ] Verify the season list displays all seasons for the team.
- [ ] Verify clicking a season opens the Edit view.
