# Phase 10: Season Lifecycle & Defaults - Research

**Researched:** 2026-04-20
**Domain:** Season Management / Data Consistency
**Confidence:** HIGH

## Summary

This phase transitions the application from implicit active-season-only management to explicit season CRUD. Key responsibilities include ensuring data consistency (one active season per team), implementing safety checks for season deletion (preventing orphaned games), and adding support for `defaultPracticeLocation` which will be used in Phase 11 for practice scheduling.

**Primary recommendation:** Use TypeORM transactions in `SeasonsService` to atomically manage the `isActive` flag and add a pre-deletion check in `remove()` to provide clear feedback when games exist.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Automatic Deactivation:** If a season is updated to `isActive = true`, the system MUST automatically set `isActive = false` for all other seasons belonging to the same team.
- **Manual Deactivation:** Coaches can manually set a season to `isActive = false` to represent a "between seasons" state.
- **Restricted Hard Delete:** Hard deletion of a season is BLOCKED if any games or events are associated with it.
- **UI Entry Point:** "Manage Seasons" lives under **Team Settings** (`/teams/:id/settings/seasons`).
- **Practice Defaults:** Add `defaultPracticeLocation` to `seasons` table.

### the agent's Discretion
- **Archiving:** `isActive = false` will serve as the primary "Archived" indicator for v1.1.
- **Navigation:** Team Dashboard Settings Gear -> Seasons List -> Create/Edit Season.

### Deferred Ideas (OUT OF SCOPE)
- **Soft Delete:** Not requested in this phase; hard delete with safety check is sufficient.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SEAS-03 | Explicit creation via `SeasonsList` -> `SeasonDetail` | Backend CRUD and Frontend scaffolding patterns identified. |
| SEAS-04 | Editing via `SeasonDetail` | Backend Patch method and Frontend Form patterns identified. |
| SEAS-05 | Active toggle in `SeasonDetail` with auto-deactivation logic | Transactional logic for `isActive` flag identified in `SeasonsService`. |
| SEAS-06 | Delete button in `SeasonsList` with dependency check | Relation check for `GameEntity` in `SeasonsService.remove()` identified. |
| SEAS-07 | New field `defaultPracticeLocation` | Migration path and Entity updates identified. |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Season CRUD | API | Database | Persistence of season metadata and rules. |
| Active Policy Enforcement | API | — | Ensuring business rules (1-active-season) are enforced via transactions. |
| Delete Protection | API | Database | Checking for existing relations before allowing deletion. |
| Season Management UI | Frontend | — | Providing a dashboard-style interface for managing multiple seasons. |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| NestJS | 11.0.x | Backend Framework | Project standard for API development. |
| TypeORM | 0.3.x | Database ORM | Handles PostgreSQL relations and transactions. |
| Angular | 21.2.x | Frontend Framework | Uses Signals for state and Ionic for mobile-first UI. |
| Ionic | 8.x | UI Components | Provides standard mobile patterns (List, Detail, FAB). |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|--------------|
| class-validator | ^0.14 | Input Validation | DTO validation in NestJS controllers. |
| ngx-reactive-forms-utils | Latest | Form Errors | Displaying validation errors in Angular forms. |

**Installation:**
```bash
# No new packages required. Existing stack covers all needs.
```

**Version verification:**
- NestJS: `npm view @nestjs/core version` (Verified: 11.0.10) [VERIFIED: npm registry]
- Angular: `npm view @angular/core version` (Verified: 21.2.1) [VERIFIED: npm registry]

## Architecture Patterns

### Recommended Project Structure
```
apps/api/src/
├── entities/
│   └── season.entity.ts         # Added default_practice_location
├── migrations/
│   └── 1776700000000-AddPracticeLocationToSeason.ts
└── teams/
    ├── dto/
    │   ├── create-season.dto.ts # Updated
    │   └── update-season.dto.ts # Updated
    ├── seasons.service.ts       # Added transaction and delete check
    └── seasons.controller.ts    # CRUD endpoints

apps/frontend/src/app/teams/seasons/
├── seasons-list/               # List with Active indicator and Delete action
├── season-detail/              # Create/Edit form
└── seasons.service.ts          # Frontend API wrapper
```

### Pattern 1: Transactional Active State Management
**What:** Wrapping the update of `isActive` in a transaction to ensure no team ends up with two active seasons.
**When to use:** Whenever `isActive = true` is passed to `create` or `update`.

### Pattern 2: Signal-Driven Detail View
**What:** Using `toSignal` or manual signals to handle the asynchronous loading of season data in `SeasonDetail`.
**When to use:** All new Angular components in this phase.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| UUID Validation | Custom Regex | `ParseUUIDPipe` | Standard NestJS pipe, secure and reliable. |
| DB Transactions | Manual `BEGIN/COMMIT` | `dataSource.transaction()` | TypeORM manages connection pooling and rollback automatically. |
| Active-only UI | Custom filters | `isActive` flag in queries | The DB is the source of truth for the active state. |

## Common Pitfalls

### Pitfall 1: Race Condition in Active Flag
**What goes wrong:** Two concurrent requests set different seasons as active.
**How to avoid:** Use a database transaction and/or a single `UPDATE` query that sets all other seasons for that team to inactive first.

### Pitfall 2: Orphaned Data on Delete
**What goes wrong:** Deleting a season that still has games in the DB.
**How to avoid:** Check `gameRepo.count({ where: { seasonId } })` before proceeding with `remove()`. If > 0, throw a `ConflictException`.

### Pitfall 3: Timezone Confusion in `startDate`/`endDate`
**What goes wrong:** Using `Date` objects in JS/TS leading to shifting days due to local timezones.
**How to avoid:** Treat `startDate` and `endDate` as simple strings (ISO YYYY-MM-DD) and let the DB store them as `DATE` type without time.

## Code Examples

### Backend: SeasonsService Transactional Update
```typescript
// Source: CITED from standard TypeORM documentation for transactional patterns
async update(id: string, dto: UpdateSeasonDto): Promise<SeasonEntity> {
  return this.dataSource.transaction(async (manager) => {
    const season = await manager.findOne(SeasonEntity, { where: { id } });
    if (!season) throw new NotFoundException(`Season ${id} not found`);

    if (dto.isActive === true) {
      // Set all other seasons for this team to inactive
      await manager.update(
        SeasonEntity,
        { teamId: season.teamId, id: Not(id) },
        { isActive: false }
      );
    }

    Object.assign(season, dto);
    return manager.save(SeasonEntity, season);
  });
}
```

### Frontend: Season Management Link in Team Settings
```html
<!-- apps/frontend/src/app/teams/edit-team/edit-team.html -->
<ion-list-header class="mt-6">
  <ion-label>Management</ion-label>
</ion-list-header>
<ion-item button [routerLink]="['/teams', team()?.id, 'settings', 'seasons']" detail="true">
  <ion-icon name="calendar-outline" slot="start"></ion-icon>
  <ion-label>Manage Seasons</ion-label>
</ion-item>
```

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| PostgreSQL | Data layer | ✓ | 15.x | — |
| Node.js | Runtime | ✓ | 20.x | — |
| Nx | Build System | ✓ | 22.x | — |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest |
| Config file | `vitest.config.mts` |
| Quick run command | `npx nx test api` / `npx nx test frontend` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SEAS-05 | Auto-deactivation of old seasons | Integration | `npx nx test api --testFile=seasons.service.spec.ts` | ❌ Wave 0 |
| SEAS-06 | Block delete if games exist | Unit | `npx nx test api --testFile=seasons.service.spec.ts` | ❌ Wave 0 |
| SEAS-03 | UI Create Season | E2E | `npx playwright test apps/frontend-e2e/src/seasons.spec.ts` | ❌ Wave 0 |

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V4 Access Control | yes | Verify user owns the team/season via AuthGuard and Service checks. |
| V5 Input Validation | yes | `class-validator` for DTOs. |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Cross-Team Update | Tampering | Always include `teamId` check in service logic to prevent ID-guessing attacks. |

## Sources

### Primary (HIGH confidence)
- `apps/api/src/entities/season.entity.ts` - Verified current state of season fields.
- `apps/api/src/teams/seasons.service.ts` - Verified current CRUD logic.
- `10-CONTEXT.md` - Verified phase goals and policy decisions.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Core project stack is stable.
- Architecture: HIGH - Transactional pattern is well-understood.
- Pitfalls: MEDIUM - Race conditions are rare but possible; transaction mitigation is standard.

**Research date:** 2026-04-20
**Valid until:** 2026-05-20
