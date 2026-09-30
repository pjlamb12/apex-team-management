# Quick Task Plan: User Account Settings, Logout, and Account Deletion (#41)

## Problem
1. **Missing Account & Logout in Shell**:
   - Logged-in coaches currently have no way to view their account info (email, display name) or log out from `teams-list` or the app shell (`shell.html`).
   - The only logout button existed in a legacy `/home` component which is permanently redirected to `/teams`.
2. **Missing Profile Management**:
   - Coaches cannot view their registered email, edit their display name, or change their password while logged in.
3. **App Store Guideline 5.1.1(v) & GDPR Compliance**:
   - Apple App Store Guideline 5.1.1(v) strictly mandates that apps supporting account creation must provide an in-app account deletion mechanism. Currently no `DELETE /auth/account` endpoint or UI flow exists.

## Solution Architecture

### 1. Backend (`apps/api/src/auth`)
- **DTOs (`apps/api/src/auth/dto`)**:
  - `UpdateProfileDto`: `displayName` (string, min 2 chars).
  - `ChangePasswordDto`: `currentPassword` (string), `newPassword` (string, min 8 chars).
- **`AuthService` Enhancements**:
  - `getProfile(userId: string)`: returns `{ id, email, displayName, createdAt }`.
  - `updateProfile(userId: string, dto: UpdateProfileDto)`: updates `displayName` and returns updated profile.
  - `changePassword(userId: string, currentPass: string, newPass: string)`: compares `currentPass` with bcrypt; hashes and updates `newPass`.
  - `deleteAccount(userId: string)`:
    - Finds all teams owned by coach (`coachId === userId`) and invokes `teamsService.remove(team.id, userId)`.
    - Deletes user records from `team_members`, `event_notes`, `candidate_evaluations`, `candidate_notes`, `drills`, `tactic_plays`, `tags`.
    - Removes `UserEntity` record.
- **`AuthController`**:
  - `GET /auth/me`: guarded with `AuthGuard('jwt')`.
  - `PATCH /auth/profile`: guarded with `AuthGuard('jwt')`.
  - `POST /auth/change-password`: guarded with `AuthGuard('jwt')`, throttled (5 req / 60s).
  - `DELETE /auth/account`: guarded with `AuthGuard('jwt')`.
- **`AuthModule`**:
  - Imports `TeamsModule` for `TeamsService`.

### 2. Frontend (`apps/frontend/src/app`)
- **`AuthService` (`apps/frontend/src/app/auth/auth.service.ts`)**:
  - Add `getProfile()`, `updateProfile(name: string)`, `changePassword(...)`, and `deleteAccount()`.
- **Navigation & Routing**:
  - Add 4th tab button to `apps/frontend/src/app/shell/shell.html`: `tab="account"`, `href="/account"`, with `person-circle-outline` icon and `Account` label.
  - Add account icon button to `apps/frontend/src/app/teams/teams-list/teams-list.html` toolbar.
  - Register `/account` route in `apps/frontend/src/app/app.routes.ts` under authenticated shell children.
- **`AccountSettings` Component (`apps/frontend/src/app/account/`)**:
  - Profile Info: Display name, email, member since, inline display name editing.
  - Change Password Card: current password, new password, confirm password inputs with validation and error/success handling.
  - Session & Preferences: Quick theme toggle and working "Log Out" button.
  - Danger Zone: Clear warning and "Delete Account" button triggering confirmation dialog before executing account purge.

### 3. Verification
- **API Tests**:
  - Update `apps/api/src/auth/auth.controller.spec.ts` with tests for `getProfile`, `updateProfile`, `changePassword`, `deleteAccount`.
  - Add tests in `apps/api/src/auth/auth.service.spec.ts`.
  - Run `npx nx test api --run`.
- **Frontend Tests**:
  - Create `apps/frontend/src/app/account/account.spec.ts`.
  - Run `npx nx test frontend --watch=false`.
