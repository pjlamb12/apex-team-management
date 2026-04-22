# Context: Phase 14 — Drill Library Foundation

## Goal
Build the repository of team knowledge by allowing coaches to document their favorite drills as a personal playbook that can be reused across all teams.

## Implementation Decisions

### 1. Data Model Association
- **Decision:** Drills and Tags are associated with the **Coach (User)**, not a specific Team.
- **Rationale:** Drills represent a coach's knowledge and "playbook," which should persist across different teams or seasons they manage.
- **Implication:** The API will fetch drills based on the authenticated `userId`.

### 2. Drill Instructions Structure
- **Decision:** Use **Structured Steps**.
- **Format:** `jsonb` array of objects: `Array<{ title: string, description: string }>`.
- **Rationale:** Provides better UI rendering (headers/bullets) and more organized instructions compared to a simple text block or string list.

### 3. Tagging Strategy
- **Decision:** **Global Tags** associated with the Coach.
- **Behavior:**
  - Tags are shared across all drills in the coach's library.
  - CRUD for tags will be coach-level (`/drills/tags`).
  - Search/Filtering in the UI will use these global tags.

### 4. Media Support
- **Decision:** Single **`sourceUrl`** field.
- **Rationale:** Fulfills the "source URL" requirement (DRIL-01) for linking to external videos (YouTube, Vimeo) or PDF guides.

### 5. UI Organization
- **Decision:** **Team Dashboard Segment**.
- **Route:** `/teams/:teamId/drills`.
- **Behavior:** Although drills are coach-bound, they are managed/viewed within the context of a team dashboard for v1.2 to maintain navigation consistency. The UI will show the coach's full library.

## API Specification (Draft)
- `GET /drills`: List all drills for the authenticated coach.
- `POST /drills`: Create a new drill.
- `GET /drills/:id`: Get full drill details including structured steps.
- `PATCH /drills/:id`: Update drill.
- `DELETE /drills/:id`: Delete drill.
- `GET /drills/tags`: List all unique tags for the coach.
- `POST /drills/tags`: Create a new global tag.

## Frontend Specification (Draft)
- **TeamDashboard**: Add `drills` to the segment list.
- **DrillList**: Search bar + Tag filters (horizontal scroll of chips).
- **DrillEditor**: Multi-step input form for instructions.

## Remaining Gray Areas (Deferred)
- **Drill Pinning:** Ability to "pin" certain drills to a specific team to reduce noise in the list.
- **Drill Rating:** Per-team rating of drills (DRIL-03) deferred to Phase 15.
