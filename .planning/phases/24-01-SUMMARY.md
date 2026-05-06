# Phase 24 Summary - Recurring Events

Implemented support for repeating games and practices, allowing coaches to automate their weekly schedules.

## Changes

### Backend
- **Entities**: Updated `EventEntity` with `recurrenceRule` (RFC 5545 string) and `parentEventId` for series management.
- **DTOs**: Updated `CreateEventDto` and `UpdateEventDto` to support recurrence rules.
- **Logic**: 
    - Integrated `rrule` library for recurrence expansion.
    - Updated `EventsService.findAllForTeam` to dynamically expand recurring rules into "virtual" instances.
    - Implemented override logic where specific database records (with `parentEventId`) replace expanded virtual instances.
    - Capped expansion to 100 instances or the end of the season to ensure performance.

### Frontend
- **Data Access**: Updated `EventEntity` and DTOs to include recurrence fields.
- **UI/UX**:
    - Added "Repeat" selector to Create Game and Create Practice forms (None, Weekly, Bi-weekly).
    - Automatically generates `RRule` strings based on the event's start date and selected frequency.
    - Updated Schedule view to display a recurrence icon for repeating events.
    - Implemented stable `trackBy` logic using `virtualId || id`.
    - Enhanced "Delete" flow to allow deleting the entire series.

## Verification Results
- **Build**: Both `api` and `frontend` build successfully with `rrule` integration.
- **Expansion**: Recurring events correctly appear in both "Upcoming" and "Past" views within the season window.
- **Stability**: Schedule list remains stable during re-renders thanks to virtual ID tracking.

## Next Steps
- **Milestone v1.6 Complete**: The core requirements for Advanced Scheduling & Exports (iCal Sync + Recurring Events) are delivered.
- **v2.0 Planning**: Move into Team Analytics or further coaching utility polish.
