# Phase 35: Tryout Foundation - Context

**Gathered:** 2026-05-12
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase establishes the foundational data structures and services required for the "Tryout Management" feature. It focuses on creating a separate `Candidate` entity to track prospective players and integrating a new "Tryout" event type into the existing calendar and event systems.

</domain>

<decisions>
## Implementation Decisions

### Data Modeling
- **D-01: Dedicated Candidate Entity.** Candidates will be stored in a new `candidates` table, separate from the `players` table. This avoids cluttering the team roster with unselected individuals while allowing for a similar data structure for easy conversion later.
- **D-02: Multi-Team Context.** Candidates will belong to a specific `Team` but can be associated with a "Tryout Season" via metadata to allow for seasonal reporting.

### Event Integration
- **D-03: New Event Type: `TRYOUT`.** The existing `EventType` enum will be expanded to include `TRYOUT`. This allows tryout sessions to leverage the existing location, scheduling, and recurring event logic.
- **D-04: Candidate Attendance.** A new `candidate_attendance` table will link candidates to `Event` entities, separate from the `player_attendance` system.

### API & Storage
- **D-05: NestJS Candidate Module.** A new `CandidateModule` will be created to handle CRUD operations for prospective players.
- **D-06: File Attachments (Deferred).** Tracking physical forms or ID copies is deferred; this phase focuses on text-based profile data.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Standards
- `ROADMAP.md` — Phase 35 goals and success criteria.
- `apps/api/src/teams/entities/team.entity.ts` — Existing team structure.
- `apps/api/src/events/entities/event.entity.ts` — Event entity and type definitions.

### Data & Logic
- `apps/api/src/players/entities/player.entity.ts` — To be used as a reference for `Candidate` structure.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `EventsService` (Backend): Can be extended to support the `TRYOUT` event type.
- `Location` services: Already handle addresses and coordinates for all event types.

### Integration Points
- `EventsController`: Needs to ensure the new `TRYOUT` type is supported in validation and filtering.
- `TeamModule`: Will need to import the new `CandidateModule`.

</code_context>

<specifics>
## Specific Ideas
- The `Candidate` model should include fields for "Primary Position" and "Secondary Position" to help with session planning.
- Statuses: `REGISTERED`, `ATTENDING`, `SELECTED`, `DECLINED`, `WAITLISTED`.

</specifics>

<deferred>
## Deferred Ideas
- **Self-Registration Portal**: Candidates will be added manually by coaches for now.
- **Scouting Notes/Ratings**: Moved to Phase 36.
- **Roster Conversion Logic**: Moved to Phase 38.

</deferred>

---

*Phase: 35-tryout-management*
*Context gathered: 2026-05-12*
