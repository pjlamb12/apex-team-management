# Phase 20: Team Join Codes & Assistant Onboarding - Context

**Gathered:** 2026-04-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement the core flow for a head coach to share a 6-character alphanumeric code and an assistant coach to use it to join the team from their dashboard. Establishes the basic RBAC for assistant vs head coach.
</domain>

<decisions>
## Implementation Decisions

### Code Lifecycle & Management
- **D-01:** Manual refresh — the coach explicitly generates a new code, which invalidates the old one.
- **D-02:** Format — 6-character alphanumeric (e.g. A4K9X2).

### Join Flow UX
- **D-03:** Dashboard modal — users sign up/log in first, then click a 'Join Team' action to enter the code from the dashboard.

### Assistant Permissions
- **D-04:** Full access except deletion — assistants can manage games, roster, and team details, but cannot delete the team itself.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Requirements
- `.planning/REQUIREMENTS.md` § v1.4 Requirements: Assistant Coach Invites — SYNC-01 and SYNC-02 define the core team sharing capabilities.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- The existing authentication and dashboard views can be extended to include the 'Join Team' modal.
- Standalone components for modals or dialogs (if any exist in `apps/frontend/src/app`) should be leveraged for the join flow.

### Integration Points
- Team settings view: Needs a new section to display the current join code and a "Regenerate" button.
- RBAC enforcement: Team deletion endpoints and UI controls must check for 'head coach' status rather than just team membership.

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches for generating the 6-character code and implementing the modal UX.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 20-team-join-codes-assistant-onboarding*
*Context gathered: 2026-04-27*