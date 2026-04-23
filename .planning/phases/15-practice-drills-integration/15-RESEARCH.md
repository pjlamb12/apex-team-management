# Phase 15: Practice Drills Integration - Research

**Researched:** 2026-04-22
**Domain:** Practice Planning & Drill Library Integration
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Practice Console UI:** Dedicated practice view with tabs (**Summary** and **Plan**). Matches the "Game Console" pattern.
- **Junction Data Model:** Metadata-rich `PracticeDrill` table with `sequence`, `durationMinutes`, `teamRating` (1-5), and `notes`.
- **Drill Selection:** Use a Modal Browser (reusing `DrillList` logic).
- **Drill Duplication:** Allowed within a single practice plan.
- **Rating Lifecycle:** `teamRating` editable only when practice status is `in_progress` or `completed`.
- **Security:** API must verify coach ownership of both the Event and the Drill.

### the agent's Discretion
- **Validation:** Show "Total Planned Time" vs "Scheduled Duration" as a visual warning; do not block saving.
- **API Specification:** Drafted endpoints for CRUD on practice drills and bulk reordering.

### Deferred Ideas (OUT OF SCOPE)
- **Pacer Timer:** Deferred to Phase 16.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PRAC-03 | Add drills to practice with sequencing/time | `PracticeDrillEntity` with `sequence` and `duration_minutes`. |
| DRIL-03 | Rate drills per practice (1-5 star) | `team_rating` field with status-gated UI logic. |
</phase_requirements>

## Summary

This phase transforms a simple practice event into a structured training session by integrating the Drill Library (Phase 14) with the Scheduling system (Phase 11). Coaches will construct a "Practice Plan" by selecting drills, assigning durations, and sequencing them.

A key architectural shift in this phase is the introduction of a dedicated "Practice Console" UI, using a tabbed interface (Summary/Plan) to handle the increased complexity of drill management. The data model is centered around a metadata-rich junction table `PracticeDrillEntity`, which now includes a `notes` field for session-specific instructions.

**Primary recommendation:** Implement a dedicated Practice Detail view with `ion-segment` tabs. Use a junction entity `PracticeDrillEntity` with metadata (sequence, duration, rating, notes) to associate `DrillEntity` with `EventEntity`.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Practice Plan Storage | Database | — | Persistent storage of drill associations and metadata |
| Drill Sequencing Logic | API | Browser | Backend enforces order; Frontend handles drag-drop UI |
| Practice Console Tabs | Browser | — | UI navigation between Summary and Plan views |
| Practice Duration Tracking | Browser | — | Real-time calculation of total planned time vs. event duration |
| Drill Performance Rating | API | Database | Persistence of coach feedback per drill/practice; status-gated |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeORM | ^0.3.28 | ORM for PostgreSQL | Project standard for data persistence [VERIFIED: package.json] |
| @ionic/angular | ^8.8.4 | UI Components | Provides `ion-segment` for tabs and `ion-reorder-group` for sequencing [VERIFIED: npm view] |
| NestJS | ^11.1.19 | Backend Framework | Core API framework [VERIFIED: package.json] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|--------------|
| class-validator | ^0.15.1 | DTO Validation | Validating sequence, duration, and rating inputs in API |

## Architecture Patterns

### Practice Console (Tabbed UI)
The UI follows the "Console" pattern established in the Game Console.
- **Summary Tab:** Event metadata (date, time, location, description).
- **Plan Tab:** Drill sequence, durations, and notes.
- **Edit Mode:** Toggles between read-only viewing and plan modification (reordering/adding).

### Metadata-Rich Junction Table (`PracticeDrill`)
Since we need to store session-specific metadata (sequence, duration, notes) about the relationship, we use a dedicated junction entity.

**Entity Schema:**
```typescript
@Entity('practice_drills')
export class PracticeDrillEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => EventEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'event_id' })
  event: EventEntity;

  @Column({ name: 'event_id' })
  eventId: string;

  @ManyToOne(() => DrillEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'drill_id' })
  drill: DrillEntity;

  @Column({ name: 'drill_id' })
  drillId: string;

  @Column({ type: 'int' })
  sequence: number;

  @Column({ name: 'duration_minutes', type: 'int', default: 0 })
  durationMinutes: number;

  @Column({ name: 'team_rating', type: 'int', nullable: true })
  teamRating: number | null; // DRIL-03: 1-5 star rating

  @Column({ type: 'text', nullable: true })
  notes: string | null; // Decision: nullable notes for session-specific instructions
}
```

### Backend DTOs
- **AddDrillToPlanDto:**
  - `drillId: string` (required)
  - `durationMinutes: number` (required, min 1)
  - `sequence: number` (required, min 0)
  - `notes: string` (optional)
- **UpdatePlanDrillDto:**
  - `durationMinutes: number` (optional)
  - `teamRating: number` (optional, 1-5)
  - `notes: string` (optional)
- **ReorderPlanDto:**
  - `orderedIds: string[]` (required, IDs of `PracticeDrillEntity`)

### Recommended Project Structure
```
libs/client/data-access/drill/src/lib/
└── practice-drills.service.ts          # Client-side API wrapper

libs/client/feature/practice-console/src/lib/
├── practice-console.ts                 # Wrapper with tabs
├── tabs/
│   ├── summary/                        # Summary tab component
│   └── plan/                           # Plan tab component
└── components/
    └── drill-selector-modal/           # Reusable selection logic

apps/api/src/
├── entities/practice-drill.entity.ts   # Database entity
└── drills/                             # Extended to handle practice associations
    ├── practice-drills.controller.ts
    ├── practice-drills.service.ts
    └── dto/
        ├── add-drill-to-plan.dto.ts
        ├── update-plan-drill.dto.ts
        └── reorder-plan.dto.ts
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Drag-and-drop reordering | Custom touch handlers | `ion-reorder-group` | Built-in to Ionic, optimized for mobile touch. |
| Tabbed Navigation | Custom state/divs | `ion-segment` | Standard Ionic pattern for "segmented" views within a page. |
| Star rating UI | Custom SVG logic | Ionic Icons + simple button loop | Matches project aesthetic and is accessible. |

## Common Pitfalls

### Pitfall 1: Ghost Drills & Orphaned Plans
**What goes wrong:** A drill is deleted from the library, but remains in practices, causing 500 errors on fetch.
**Why it happens:** Cascading deletes not configured on junction table.
**How to avoid:** Use `onDelete: 'CASCADE'` on both `event` and `drill` relations in `PracticeDrillEntity`.

### Pitfall 2: Multi-tenant Ownership Breach (CRITICAL)
**What goes wrong:** A coach adds a drill ID belonging to another coach to their practice plan.
**Why it happens:** API verifies `drillId` existence but not ownership.
**How to avoid:** API must verify `drill.coach_id === req.user.id` AND `event.team.coach_id === req.user.id` before creating the junction record [CITED: 15-CONTEXT.md].

### Pitfall 3: Rating Prematurity
**What goes wrong:** Coaches rate a drill before the practice has actually happened.
**Why it happens:** UI allows editing `teamRating` during the "planning" phase.
**How to avoid:** UI should hide or disable `teamRating` inputs unless the practice status is `in_progress` or `completed` [CITED: 15-CONTEXT.md].

### Pitfall 4: Sequence Collisions
**What goes wrong:** Two drills have the same sequence number after a manual edit.
**Why it happens:** Partial saves or racing requests.
**How to avoid:** Implement a bulk `reorder` endpoint that accepts an ordered list of IDs and updates all sequences in a single database transaction.

## Code Examples

### Total Time Calculation (Frontend)
```typescript
// practice-plan.ts
protected readonly plan = this.practiceDrillsService.plan;
protected readonly event = this.eventsService.currentEvent;

protected readonly totalPlannedMinutes = computed(() => {
  return this.plan().reduce((sum, item) => sum + (item.durationMinutes || 0), 0);
});

protected readonly isOverPlanned = computed(() => {
  const scheduled = this.event()?.durationMinutes;
  return scheduled ? this.totalPlannedMinutes() > scheduled : false;
});
```

### Backend Multi-tenant Check
```typescript
// practice-drills.service.ts
async addDrillToPlan(coachId: string, eventId: string, drillId: string) {
  const event = await this.eventRepo.findOne({ 
    where: { id: eventId }, 
    relations: ['team'] 
  });
  const drill = await this.drillRepo.findOne({ where: { id: drillId } });

  if (!event || event.team.coachId !== coachId) throw new ForbiddenException();
  if (!drill || drill.coachId !== coachId) throw new ForbiddenException();

  // Proceed with association...
}
```

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `ion-segment` is preferred over Angular Router for sub-views | Summary | Minor UI inconsistency |
| A2 | Drill duplication is desired | Decisions | Complexity in UI if we need to prevent it |

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| PostgreSQL | Data layer | ✓ | 15.4 | — |
| Ionic | UI | ✓ | 8.8.4 | — |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest |
| Quick run command | `npx nx test api` |
| Full suite command | `npx nx run-many -t test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PRAC-03 | Add drill to practice with notes | Integration | `npx vitest apps/api/src/drills` | ❌ Wave 0 |
| PRAC-03 | Reorder drills in plan | Integration | `npx vitest apps/api/src/drills` | ❌ Wave 0 |
| DRIL-03 | Rate drill (status-gated) | Integration | `npx vitest apps/api/src/drills` | ❌ Wave 0 |

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V4 Access Control | yes | Verify ownership of both Event and Drill before association |
| V5 Input Validation | yes | Validate `durationMinutes` > 0 and `sequence` >= 0 |

## Sources

### Primary (HIGH confidence)
- `.planning/phases/15-practice-drills-integration/15-CONTEXT.md` - Implementation decisions.
- `apps/api/src/entities/event.entity.ts` - Checked existing event structure.
- `apps/api/src/entities/drill.entity.ts` - Checked existing drill structure.
- `Ionic Framework Docs` - Verified `ion-segment` and `ion-reorder-group`.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Core project technologies verified.
- Architecture: HIGH - Matches Game Console patterns and 15-CONTEXT decisions.
- Pitfalls: HIGH - Addresses multi-tenant and data integrity risks.

**Research date:** 2026-04-22
**Valid until:** 2026-05-22
