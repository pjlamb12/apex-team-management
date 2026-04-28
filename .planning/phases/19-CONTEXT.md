# Context: Phase 19 — Tactical Polish & Alerts

## Phase Goal
Refine tactical interactions and implement high-visibility rotation alerts while maintaining the established layout and interaction accuracy.

## Implementation Decisions

### 1. Interaction Model (SUBS-03)
- **Decision**: No Drag-and-Drop.
- **Rationale**: Tap-tap is confirmed as more accurate and sufficient for high-speed game environments.
- **Requirement Update**: SUBS-03 is fulfilled by existing tap-tap logic; focus shifts to ensuring "high-performance" feel (minimizing lag/latency in selection).

### 2. Rotation Alerts (ROTN-04)
- **UI Element**: A top-of-screen banner/toast hybrid.
- **Interactions**:
    - **Apply Button**: Stages the engine's suggestions into the Sub-Queue.
    - **Dismiss Button**: Clears the alert without staging suggestions.
- **Persistence**: The alert remains visible until the coach clicks either button.
- **Haptics**: Continue using the existing haptic trigger on interval hit.

### 3. Engine Conflict Resolution (ROTN-05)
- **Rule**: Manual Staging > Auto-Suggestions.
- **Logic**: 
    - When an interval hits, the engine checks `stagedSubs()`.
    - If **any** manual subs are staged, the engine **skips** auto-staging suggestions for this interval.
    - The engine "acts like it happened" by updating its `lastIntervalTriggered` state, ensuring the next alert triggers at the correct future interval.

### 4. Layout & UI
- **Constraint**: No changes to the current console wrapper layout. 
- **Sub-Queue**: Remains a fixed panel/column as dialed in during Phase 17/18.

## Out of Scope
- Drag-and-drop implementation.
- Expandable bottom sheets or tray layouts.
- Lineup "Preview" overlays.

## Downstream Guidance
- **Researcher**: Investigate if the current `RotationService` needs an explicit "peek" or "simulate" mode to support the "Apply" button workflow vs the current auto-staging behavior.
- **Planner**: Ensure the Banner UI doesn't obscure the scoreboard or clock on mobile devices.
