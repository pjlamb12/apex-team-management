---
plan: 04-05
phase: 04-roster-management
status: complete
gap_closure: true
requirements:
  - ROST-03
---

## Summary

Added `AlertController` confirmation gate to the `deletePlayer()` flow in `TeamDashboard`. The coach must now explicitly confirm "Remove" before any DELETE API call is made. Cancelling the alert leaves the roster unchanged.

## What Was Built

- Imported `AlertController` from `@ionic/angular/standalone` in `team-dashboard.ts`
- Injected `AlertController` as `alertCtrl` private field (NOT added to `imports[]` — it is root-provided)
- Replaced the direct-delete `deletePlayer()` with an async version that presents an alert first
- Alert header: "Remove Player?" with Cancel and Remove (role: confirm) buttons
- Delete logic (API call + Signal update + error handling) moved into the confirm handler

## Key Files

### Modified
- `apps/frontend/src/app/teams/team-dashboard/team-dashboard.ts` — AlertController injection and gated deletePlayer()

## Verification

All automated acceptance criteria passed:
- `AlertController` present in import statement ✓
- `alertCtrl = inject(AlertController)` present ✓
- `alertCtrl.create(...)` called in deletePlayer() ✓
- Alert header "Remove Player?" present ✓
- `role: 'confirm'` button present ✓
- `playersService.deletePlayer` called inside handler ✓
- `AlertController` NOT in component `imports[]` array ✓
- `nx build frontend` completes without TypeScript errors ✓

## Self-Check: PASSED

No regressions to add-player or edit-player flows (no other methods modified).
