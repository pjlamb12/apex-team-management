# Context: Phase 15 — Practice Drills Integration

## Goal
Transform a simple practice event into a structured training session by allowing coaches to sequence drills from their library, allocate time, and track performance.

## Implementation Decisions

### 1. UI Architecture (The "Practice Console")
- **Decision:** Dedicated practice view with tabs.
- **Rationale:** High-detail management of multiple drills requires more space than a simple edit form. Matches the "Game Console" pattern.
- **Behavior:** 
  - Tapping a practice in Schedule navigates to a Practice Detail view.
  - Tabs: **Summary** (Details/Edit), **Plan** (Drill sequencing).
  - "Edit Plan" mode enables sequencing and duration updates.

### 2. Junction Data Model (`PracticeDrill`)
- **Decision:** Metadata-rich junction table.
- **Entity Fields:**
  - `sequence`: Integer (0-indexed).
  - `durationMinutes`: Integer.
  - `teamRating`: Integer (1-5, nullable).
  - `notes`: Text (nullable).
- **Security:** API must verify coach ownership of both the `Event` and the `Drill` for all mutations.

### 3. Drill Selection & Logic
- **Selection:** Use a Modal Browser. Reuses `DrillList` logic (tags/search) to pick drills.
- **Duplicates:** Allowed. A coach can add the same drill multiple times in one plan (e.g., Warmup and Finish).
- **Validation:** 
  - Show "Total Planned Time" vs "Scheduled Duration".
  - Warn (visual only) if Total > Scheduled.
  - **Do NOT block saving** on over-planning.

### 4. Lifecycle of a Rating (DRIL-03)
- **Decision:** Status-gated editing.
- **Behavior:** 
  - `teamRating` is hidden/read-only during planning.
  - Becomes editable only when practice status is `in_progress` or `completed`.

## API Specification (Draft)
- `GET /teams/:teamId/events/:eventId/drills`: Fetch the ordered plan for a practice.
- `POST /teams/:teamId/events/:eventId/drills`: Add a drill to the plan.
- `PATCH /teams/:teamId/events/:eventId/drills/:practiceDrillId`: Update sequence, duration, rating, or notes.
- `DELETE /teams/:teamId/events/:eventId/drills/:practiceDrillId`: Remove drill from plan.
- `PUT /teams/:teamId/events/:eventId/drills/sequence`: Bulk update sequence (for reordering).

## Frontend Specification (Draft)
- **PracticeWrapper**: Top-level route with segments.
- **PracticePlanTab**: List of selected drills with duration/notes.
- **DrillSelectorModal**: Reusable drill browser.

## Remaining Gray Areas
- **Pacer Timer:** Logic for Phase 16. The data model built here must support a "started_at" or "current_drill" concept later.
