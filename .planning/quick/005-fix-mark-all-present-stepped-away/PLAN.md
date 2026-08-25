# Quick Task Plan: Fix "Mark All Present" Re-inserting Stepped-Away Players

## Problem
Clicking "Mark All Present" on an event attendance list (such as a practice) calls `batchUpdateAttendance` without specifying `playerIds`. 
The backend defaults to querying all players on the team (`this.playerRepo.find({ where: { teamId: event.season.teamId } })`), including stepped-away players (`isActive: false`) who had no attendance record for that event.
This creates a new attendance record for the stepped-away player (e.g. Paxton), marking them as 'present'. Because an attendance record now exists, `combinedList` in `AttendanceList` displays the stepped-away player, re-inserting them into the attendance list and practice roster.

## Solution Architecture

1. **Frontend (`libs/client/ui/attendance/src/lib/attendance-list.ts`)**:
   - Update `markAllPresent()` to pass `playerIds: this.combinedList().map(p => p.id)`.
   - This ensures that only players currently visible in the UI (active players + players with pre-existing attendance records for this event) are marked present.

2. **Backend (`apps/api/src/attendance/attendance.service.ts`)**:
   - In `batchUpdate()`, when `playerIds` is omitted, filter `playerRepo.find` to `isActive: true` so inactive/stepped-away players without explicit IDs are never included in bulk attendance updates.

3. **Testing**:
   - Add/update unit tests in `apps/api/src/attendance/attendance.service.spec.ts` covering `batchUpdate`.
   - Create/update unit tests for `AttendanceList` if applicable.
   - Run vitest tests for `api` and `frontend`.
