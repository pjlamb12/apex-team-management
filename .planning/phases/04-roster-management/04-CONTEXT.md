---
phase: "04"
name: "Roster Management"
---

<decisions>
## Implementation Decisions

### Navigation Structure
- **D-01:** Tapping a team on the "Teams" tab acts as the gateway to a team dashboard, which will contain the roster functionality. Do not create a separate global top-level tab for the Roster.

### Player Entry Flow
- **D-02:** Use an `IonModal` slide-up overlay for adding new players to the roster. This provides a fast, app-like experience without navigating away from the list.

### Data Fetching
- **D-03:** Fetch roster data using a dedicated `GET /teams/:teamId/players` endpoint. Do not eager-load players into the standard `GET /teams/:id` payload to keep queries isolated and light.

### Validation
- **D-04:** Parent email and player jersey number are strictly **required** fields when adding a player.
- **D-05:** Jersey numbers do **not** need to be unique per team (to accommodate youth/rec league generic jersey overlaps).

### Claude's Discretion
- Create Angular Signals-based components matching the Phase 3 styling for the roster lists and layout.
- Use standard class-validator rules in NestJS for payload validation (e.g., `@IsEmail()`, `@IsNotEmpty()`).
</decisions>

<canonical_refs>
## Canonical References

### Project Spec
- `.planning/ROADMAP.md` §Phase 4
- `.planning/REQUIREMENTS.md` — ROST-01 (add player), ROST-02 (list), ROST-03 (edit), ROST-04 (remove)
- `.planning/PROJECT.md` — Mobile-first constraints

### Prior Phase Artifacts
- `.planning/phases/03-teams-sport-configuration/03-CONTEXT.md` — UI visual architecture, `IonTabs` baseline, and module patterns.
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- The `AuthInterceptor` is in place from Phase 2 and handles tokens automatically.
- Ionic UI Components (`IonList`, `IonCard`, `IonModal`, `AlertController`) are already proven working in the codebase.

### Established Patterns
- **Angular**: Standalone components, mapped to nested routes using `loadComponent`, reliant on `inject()` for DI to omit constructors.
- **NestJS**: Follow the existing `TeamsModule` layout (Controller > Service > TypeORM Entity).
</code_context>

<specifics>
## Specific Ideas
- Coach workflow is designed around being at the field during a game; speed data entry is prioritized, hence the slide-up modal rather than heavy standalone creation pages.
</specifics>

<deferred>
## Deferred Ideas
- N/A
</deferred>

---
*Phase: 04-roster-management*
*Context gathered: 2026-04-17*
