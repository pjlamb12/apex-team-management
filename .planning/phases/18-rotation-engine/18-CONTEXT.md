---
phase: 18
topic: Rotation Rule Engine & Playtime Tracking
status: decided
last_updated: 2026-04-24
---

# Phase 18 Context: Rotation Rule Engine

## Objective
Implement real-time playtime tracking (minutes played) and an automated rotation engine that suggests substitutions to maintain equal playtime across the roster.

## Core Decisions

### 1. Playtime Tracking
- **Precision:** Continuous (Seconds). Playtime is tracked at the second-level for maximum precision.
- **Display:** Flexible. The system will provide total duration in seconds, allowing the UI to show `MM:SS` or round to minutes as needed.
- **Calculation:** Cumulative. Minutes/seconds are calculated by summing the time segments a player is on the field across all periods of the game.
- **Internal Storage:** Store total active seconds per player in the game state.

### 2. Rotation Algorithm
- **Modes Supported:**
    - **Pure Rotation:** Prioritizes swapping the player with the most field time for the player with the most bench time, regardless of position.
    - **Position-Locked:** Only suggests swaps between players in the same position group (e.g., Forward for Forward).
    - **Constraint-Based:** Incorporates coach-defined limits (e.g., "Min 5 mins on bench", "Max 15 mins on field").
- **Goalie Handling:** **Protected (Manual Only)**. The rotation engine will exclude the Goalkeeper (GK) position from automated suggestions. Swapping the keeper remains a manual coaching decision.
- **Dynamic Switching:** The coach can toggle between these modes in real-time within the Live Console.

### 3. UX & Automation
- **Auto-Stage Timing:** **True Auto (Hands-free)**. When the rotation interval is reached, the engine will automatically populate the "Staged Subs" queue with its optimal suggestion.
- **Manual Override:** The coach can always modify or clear the staged suggestions before tapping "Apply".
- **Alerts:** Visual/audible notification when the rotation interval is reached and suggestions are staged.

### 4. Configuration Persistence
- **Hierarchy:**
    - **Season Default:** Set in Season settings (Interval, Mode, Constraints).
    - **Game Override:** Set during game scheduling/editing.
    - **Live Console:** Temporary overrides during active play.
- **New Fields:**
    - `rotationIntervalMinutes` (int)
    - `rotationMode` (enum: PURE, POSITION, CONSTRAINED)
    - `minBenchMinutes` (int, optional)
    - `maxFieldMinutes` (int, optional)

## Reusable Assets & Patterns
- **LiveGameStateService:** Use as the source of truth for events and lineup state.
- **LiveClockService:** Use for tracking game time and triggering interval events.
- **Sub-Queue Component:** Already handles `stagedSubs`. The engine will simply push to the `stagedSubs` signal.
- **Event-Driven Architecture:** All playtime calculations must derive from the stream of `GameEvent` objects to ensure persistence and "Undo" compatibility.

## Risks & Constraints
- **Multi-Period Sync:** Ensure minutes correctly accumulate when transitioning between periods (Halftime, etc.).
- **Manual Swap Interference:** If a coach performs manual subs mid-interval, the engine must recalculate from the *current* state at the next interval mark.
- **Performance:** Avoid heavy recalculations on every clock tick; recalculate on-demand or at minute boundaries.
