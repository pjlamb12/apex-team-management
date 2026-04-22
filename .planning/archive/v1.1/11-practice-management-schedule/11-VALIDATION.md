# Phase 11 Validation: Practice Management & Unified Schedule

**Verified:** 2026-04-20
**Confidence:** HIGH

## 1. Automated Test Mapping

| Req ID | Behavior | Test Type | Command | File |
|--------|----------|-----------|---------|------|
| PRAC-01 | Create practice | integration | `npx nx test api --testNamePattern="EventsService.create"` | `apps/api/src/events/events.service.spec.ts` |
| PRAC-02 | Edit/Delete practice | integration | `npx nx test api --testNamePattern="EventsService.(update|remove)"` | `apps/api/src/events/events.service.spec.ts` |
| SCHD-02 | Unified schedule fetch | integration | `npx nx test api --testNamePattern="EventsService.findAllForTeam"` | `apps/api/src/events/events.service.spec.ts` |
| SEAS-07 | Inherit season default | integration | `npx nx test api --testNamePattern="EventsService.create.*inheritance"` | `apps/api/src/events/events.service.spec.ts` |
| REFR-01 | Game -> Event Rename | unit | `npx nx test api --testNamePattern="EventEntity"` | `apps/api/src/entities/event.entity.spec.ts` |

## 2. Manual Verification Checklist

| Item | Action | Expected Result |
|------|--------|-----------------|
| Migration | Run `npx typeorm migration:run` | Table `games` is renamed to `events`, columns added. |
| Inheritance | Create New Practice in UI | Location field is pre-filled with active season's `defaultPracticeLocation`. |
| Unified View | Navigate to "Schedule" tab | Both games and practices appear in a single chronological list. |
| Toggle | Toggle [Upcoming \| Past] | List filters correctly by date relative to `now`. |

## 3. Feedback Latency & Risk

- **Migration Risk:** HIGH. Renaming a core table can break foreign keys. **Mitigation:** Plan 11-01 Task 1 includes a "down" migration check.
- **Refactor Latency:** MEDIUM. Renaming "Games" to "Events" across the frontend requires updating multiple components. **Mitigation:** Exhaustive file list in Plan 11-03.
- **Type Safety:** HIGH. Ensure `type: 'game' | 'practice'` is strictly enforced in the DTOs and Entities.
