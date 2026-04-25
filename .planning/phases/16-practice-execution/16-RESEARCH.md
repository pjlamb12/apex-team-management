# Research: Phase 16 - Practice Execution (Pacer)

## Goal
Implement a live "Pacer" mode in the Practice Console that guides coaches through their planned drills with countdown timers and alerts.

## Requirements (from REQUIREMENTS.md)
- **PRAC-04**: Coach can use a pacer timer during practice.
- **Success Criteria**:
  1. "Start Practice" mode showing the current drill and a countdown timer.
  2. Audio or haptic alerts when a drill duration is complete.
  3. "Next Drill" button to advance the plan.

## Technical Considerations

### 1. State Management (PracticePacerService)
A dedicated service is needed to manage the active state of a practice session.
- **activeDrillIndex**: The index of the drill currently being executed.
- **remainingSeconds**: Countdown for the current drill.
- **isPaused**: Play/Pause state.
- **Persistence**: Similar to `LiveClockService`, the active drill and elapsed time should survive page refreshes. Key: `apex_pacer_{practiceId}`.

### 2. Alerts (Haptics & Audio)
- **Haptics**: Use `@capacitor/haptics` for vibrating the device when a drill ends.
- **Audio**: Use the browser's `Audio` API to play a "beep" or "whistle" sound. 
  - *Challenge*: Autoplay policies might block audio if the user hasn't interacted with the page. Since the user must tap "Start Practice", we will have the necessary interaction.

### 3. UI/UX (PracticeConsoleWrapper)
- **Execution Tab**: A new tab in the segment for live execution.
- **Primary View**: Large countdown timer, current drill name, and description.
- **Secondary View**: "Up Next" preview of the following drill.
- **Controls**: Start/Pause, Skip Drill, Previous Drill, Reset.

### 4. Integration
- The pacer should automatically use the `durationMinutes` from the practice plan.
- If a drill has no duration, it should act as an open-ended timer (counting up) or have a default (e.g., 5 mins).

## Proposed Components

### libs/client/data-access/drill/src/lib/practice-pacer.service.ts
- `initialize(practiceId, drills)`
- `start()`
- `pause()`
- `next()`
- `previous()`
- `signals`: `currentDrill`, `remainingTime`, `isFinished`.

### libs/client/feature/practice-console/src/lib/practice-execution-tab/
- Displays the large timer and drill details.
- Animates transitions between drills.

## Open Questions
- **Should we support "overtime" for drills?** Yes, if the timer hits zero, it should show negative time or change color to indicate the coach is running behind.
- **Audio file source?** Use a base64 encoded whistle sound or a small public asset.
