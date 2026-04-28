# Phase 20 Plan 02: Membership Service & RBAC Guard Summary

Implemented `MembershipService` and `TeamRoleGuard` to provide a robust RBAC system for team-scoped resources. This foundation allows the API to enforce that only authorized members with specific roles (Head Coach or Assistant) can access or modify team data.

## Changes

### Memberships
- Created `MembershipService` in `apps/api/src/memberships/membership.service.ts`:
  - `isMember(userId, teamId)`: Checks if a user belongs to a team.
  - `getRole(userId, teamId)`: Returns the user's role in a team.
  - `hasRole(userId, teamId, roles)`: Verifies if a user has one of the specified roles in a team.
- Created `MembershipsModule` in `apps/api/src/memberships/memberships.module.ts`.
- Registered `MembershipsModule` in `AppModule`.

### Authentication & Authorization
- Created `TeamRoles` decorator in `apps/api/src/auth/decorators/team-role.decorator.ts`.
- Created `TeamRoleGuard` in `apps/api/src/auth/guards/team-role.guard.ts`:
  - Extracts `teamId` from request (params, query, or body).
  - Uses `MembershipService` to verify the authenticated user's permissions for the specified team.
  - Throws `ForbiddenException` if the user is not a member or lacks the required role.

## Verification Results

### Unit Tests
- `MembershipService`: 8/8 tests passed.
- `TeamRoleGuard`: 6/6 tests passed.

```bash
npx vitest -c apps/api/vitest.config.mts apps/api/src/memberships/membership.service.spec.ts apps/api/src/auth/guards/team-role.guard.spec.ts --run
```

## Deviations from Plan

- Used `TeamRoles` as the decorator name instead of `TeamRole` to avoid collision with the `TeamRole` enum and follow NestJS conventions for plural decorators.
- Guard looks for `teamId` in `request.params`, `request.query`, and `request.body` to provide flexibility across different endpoint types.

## Self-Check: PASSED
- [x] MembershipService correctly identifies user roles in teams.
- [x] TeamRoleGuard blocks access when user role doesn't match decorator.
- [x] Unit tests added and passing.
