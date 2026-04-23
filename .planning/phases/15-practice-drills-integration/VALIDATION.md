# Phase 15: Practice Drills Integration - Validation

## Overview
Validation for Phase 15 ensures that drills can be correctly associated with practices, sequenced, and rated while maintaining strict multi-tenant security and data integrity.

## Backend Validation (API)

### REQ-15-B1: PracticeDrill Association
- **Scenario:** Add a drill to a practice session.
- **Verification:**
  - POST `/teams/:teamId/events/:eventId/drills` creates a `PracticeDrillEntity`.
  - Check that `drillId`, `eventId`, `sequence`, and `durationMinutes` are correctly stored.
  - Verify that `onDelete: 'CASCADE'` works for both `Drill` and `Event`.

### REQ-15-B2: Multi-tenant Security
- **Scenario:** Attempt to add a drill owned by Coach B to Coach A's practice.
- **Verification:**
  - API returns `403 Forbidden` if `drill.coachId !== req.user.id`.
  - API returns `403 Forbidden` if `event.team.coachId !== req.user.id`.

### REQ-15-B3: Plan Reordering
- **Scenario:** Reorder drills in a practice plan.
- **Verification:**
  - PUT `/teams/:teamId/events/:eventId/drills/sequence` with an array of IDs.
  - Verify all `sequence` numbers are updated correctly in a single transaction.

### REQ-15-B4: Status-gated Ratings
- **Scenario:** Attempt to rate a drill in a 'scheduled' practice.
- **Verification:**
  - PATCH `teamRating` returns `400 Bad Request` if `event.status === 'scheduled'`.
  - PATCH `teamRating` succeeds if `event.status === 'in_progress'` or `'completed'`.

## Frontend Validation (Client)

### REQ-15-F1: Practice Console Navigation
- **Scenario:** Navigate to a practice from the schedule.
- **Verification:**
  - URL matches `teams/:id/events/:eventId/console`.
  - Tab segment defaults to 'summary'.
  - Switching to 'plan' tab shows the drill list.

### REQ-15-F2: Drill Selection Modal
- **Scenario:** Add a drill using the selection modal.
- **Verification:**
  - Modal shows search and tag filters.
  - Selecting a drill adds it to the list with default duration.

### REQ-15-F3: Duration Warnings
- **Scenario:** Total planned time exceeds scheduled duration.
- **Verification:**
  - UI displays a visual warning (e.g., red text or banner).
  - Saving is still permitted (visual warning only).

### REQ-15-F4: Drill Sequencing
- **Scenario:** Drag and drop drills to reorder.
- **Verification:**
  - `ion-reorder-group` correctly handles the visual movement.
  - Reorder event triggers API call to update sequences.

## Automated Test Suites

| Target | Command | Purpose |
|--------|---------|---------|
| API | `npx nx test api --testFile=drills.service.spec.ts` | Unit tests for service logic |
| API | `npx nx test api --testFile=practice-drills.controller.spec.ts` | Integration tests for endpoints |
| E2E | `npx nx e2e frontend-e2e --spec=practice-planning.spec.ts` | End-to-end flow for planning |

## Manual Verification Checklist
- [ ] Create a practice and add 3 drills.
- [ ] Reorder the drills and refresh the page to verify persistence.
- [ ] Set a 60-minute practice duration and add 70 minutes of drills; verify warning appears.
- [ ] Start the practice (status -> in_progress) and verify ratings can now be set.
- [ ] Attempt to delete a drill from the library; verify it is removed from the practice plan.
