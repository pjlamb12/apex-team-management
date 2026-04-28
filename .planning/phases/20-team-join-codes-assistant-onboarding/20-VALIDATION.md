# Phase 20 Validation: Team Join Codes & Assistant Onboarding

## Goal backward Verification

### Observable Truths
- [ ] A Head Coach can see a 6-character Join Code in Team Settings.
- [ ] A Head Coach can regenerate the Join Code, which invalidates the old one.
- [ ] A user can enter a Join Code on the dashboard to join a team.
- [ ] After joining, the user appears in the team's membership list as an Assistant.
- [ ] Assistant coaches can see and manage team rosters and games.
- [ ] Assistant coaches CANNOT delete the team.
- [ ] Assistant coaches CANNOT regenerate the Join Code.
- [ ] The application continues to function for existing teams (no breaking changes to `coach_id` dependency).

### Required Artifacts
- **Shared Models:** `libs/shared/util/models/src/lib/team-member.model.ts` (TeamRole, TeamMember).
- **Backend Entities:** `apps/api/src/entities/team-member.entity.ts`.
- **Backend Services:** 
  - `apps/api/src/memberships/membership.service.ts` (Shared membership checks).
  - `apps/api/src/teams/teams.join-code.service.ts` (nanoid generation).
- **Backend Guards:** `apps/api/src/auth/guards/team-role.guard.ts`.
- **Frontend Components:**
  - `apps/frontend/src/app/teams/join-team/join-team-modal.ts`.
- **Frontend Services:**
  - `libs/client/data-access/team/src/lib/team.service.ts`.

### Key Links
- **RBAC Enforcement:** `TeamsController` methods for delete/regenerate are decorated with `@TeamRole(TeamRole.HEAD_COACH)`.
- **Membership Check:** `MembershipService` is used by other services (eventually) to verify access.
- **Join Flow:** `JoinTeamModal` calls `TeamService.joinTeam`, which hits `POST /api/teams/join`.

## Automated Tests
- [ ] **Backend Unit:** `npx vitest apps/api/src/teams` (Tests join logic and RBAC).
- [ ] **Backend Unit:** `npx vitest apps/api/src/memberships` (Tests membership service).
- [ ] **E2E:** `npx playwright test apps/frontend-e2e/src/team-join-flow.spec.ts` (Simulates full invite/join flow).

## Manual Verification Steps
1. **Coach A:** Create Team "Alpha".
2. **Coach A:** Go to Settings -> Observe Join Code (e.g. "XJ3K2P").
3. **Coach B:** Login. On Dashboard, click "Join Team".
4. **Coach B:** Enter "XJ3K2P" -> Success.
5. **Coach B:** Open Team "Alpha" -> Verify access to Roster.
6. **Coach B:** Go to Settings -> Verify "Delete Team" and "Regenerate Code" are HIDDEN.
7. **Coach A:** Regenerate Code -> Verify it changes to a new code.
8. **Coach B:** Try to join again with OLD code -> Verify failure.
