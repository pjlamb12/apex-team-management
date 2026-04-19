---
status: testing
phase: 06-live-game-console
source: [06-01-SUMMARY.md, 06-02-PLAN.md, 06-03-PLAN.md]
started: 2026-04-18T00:00:00Z
updated: 2026-04-18T00:00:00Z
---

## Current Test

number: 1
name: Cold Start Smoke Test
expected: |
  Kill any running server/service. Clear ephemeral state. Start the API and frontend from scratch. Server boots without errors, the event_definitions migration completes, and a basic API call returns live data.
awaiting: user response

## Tests

### 1. Cold Start Smoke Test
expected: Kill any running server/service. Clear ephemeral state. Start the API and frontend from scratch. Server boots without errors, the event_definitions migration completes, and a basic API call returns live data.
result: [pending]

### 2. Event Logging API — Valid Payload
expected: Send POST /api/games/:gameId/events with body { "type": "GOAL", "playerId": "<valid-player-id>", "minuteOccurred": 23 }. The API returns 201 with the persisted event object. Sending an invalid type (e.g., "TOUCHDOWN") returns a 400 error.
result: [pending]

### 3. Console Route Navigation
expected: Navigate to /teams/:teamId/games/:gameId/console (or tap "Go Live" from the game detail/lineup screen). The Live Game Console screen loads without errors showing the game header with the team/opponent name.
result: [pending]

### 4. Clock Starts and Displays Elapsed Time
expected: On the console screen, tap the Play button. The clock starts counting up in MM:SS format (e.g., 00:01, 00:02…). The display updates every second without freezing or drifting.
result: [pending]

### 5. Clock Pauses
expected: While the clock is running, tap the Pause button. The clock stops at its current time. Tapping Play again resumes from where it paused (does not reset to 00:00).
result: [pending]

### 6. Soccer Pitch View Shows Starting Lineup
expected: The console shows a soccer pitch diagram with players placed at their assigned positions (GK at the back, defenders/midfielders/forwards in their rows). Each player marker shows the player's name or jersey number.
result: [pending]

### 7. Bench View Shows Bench Players
expected: Below or beside the pitch, a Bench section lists players who are not in the starting lineup. Their names/numbers are visible.
result: [pending]

### 8. Substitution by Tapping Active + Bench Player
expected: Tap an active (on-pitch) player — they become selected (highlighted). Then tap a bench player. The two players swap: the bench player moves to the pitch (same position), the active player moves to the bench. The swap is reflected immediately in both pitch and bench views.
result: [pending]

### 9. Tapping Active Player Shows Action Menu
expected: Tap an on-pitch player. A popover/action menu appears with options such as Goal, Card, etc. Tapping an action (e.g., "Goal") records that event and dismisses the menu.
result: [pending]

### 10. Event Log Shows Logged Events
expected: After recording a goal or substitution, the Event Log section (or tab) lists the event with the player name, event type, and game minute (e.g., "23' — GOAL — Alex Smith").
result: [pending]

### 11. Events Persist Across Page Refresh
expected: Record 2–3 events (goals, subs). Refresh the browser (or reopen the console URL). The event log still shows the previously recorded events — they were saved to localStorage and restored on load.
result: [pending]

## Summary

total: 11
passed: 0
issues: 0
pending: 11
skipped: 0

## Gaps

[none yet]
