# Phase 6 Context: Live Game Console

**Status:** Decisions Locked
**Last Updated:** 2026-04-18

## 1. Interaction Flow: Selection-Based Swap

The "Live Console" must prioritize speed and accuracy for substitutions on a mobile device.

- **Interaction Pattern:** "Bench Player -> On-field Player".
    1.  **Step 1:** Coach taps a player in the "Bench" section. This selects the player (high-contrast visual indicator).
    2.  **Step 2:** Coach taps a player (or position slot) on the "Field".
    3.  **Result:** The swap is immediately committed locally and an event is logged.
- **Visual Feedback:** 
    - Selected bench player must be "elevated" (shadow, border, or glow).
    - Invalid swap targets (e.g., swapping a bench player with another bench player) should be visually distinct or handled gracefully.
- **Success Metric:** 2 taps per substitution.

## 2. Game Clock Management: Running Clock

- **Model:** Manual "Running Clock" (Stopwatch).
- **Controls:** Start, Stop (Pause), and Reset (End Period).
- **Sport Support (Soccer):** 
    - Support for multiple periods (e.g., 2 halves of 45 minutes).
    - "Minute Occurred" for events is calculated as `(current_period - 1) * period_length + current_elapsed_time`.
- **Persistence:** The start timestamp and elapsed time must be persisted to survive page refresh.

## 3. Visualization: Sport-Specific "Field View"

The console must support a plugin-style visualization layer. While "List View" and "Categorized Grid" are generic fallbacks, specialized views are loaded based on the sport:

1.  **Generic Fallbacks (Always Available):**
    - **List View:** High-density vertical list of active players.
    - **Categorized Grid:** Players grouped by general position (GK, DEF, MID, FWD).
2.  **Sport-Specific View (e.g., Soccer Pitch):**
    - **Soccer:** A tactical SVG/CSS representation of a soccer field ("Pitch View").
    - **Basketball (Future):** A tactical court view.
    - **Architecture:** The `SportEntity` (or a related config) defines which "Field View" component to load. Slots in these views are mapped to relative (X, Y) coordinates defined in the sport's metadata.

## 4. Event Logging: Sport-Specific "Stats Add-ons"

Event logging is split into core system events and sport-specific tactical events:

1.  **Core Events (System-wide):**
    - `SUB`: Substitution (In/Out/Position).
    - `START_PERIOD / END_PERIOD`: Clock management.
2.  **Sport-Specific Events (Soccer v1):**
    - **Scoring:** Goal (Scorer), Assist (Assistor).
    - **Discipline:** Yellow Card, Red Card.
    - **Tactical:** Corner Kick, Shot on Goal.
3.  **Data Structure:**
    - The `SportEntity` defines the available `eventTypes` and their required payload schemas (e.g., a "Goal" requires an `assistorId` while a "Card" does not).

## 5. Persistence Strategy

- **Local Persistence:** 
    - `LiveGameStateService` uses `localStorage` (or `IndexedDB` via `StorageService`) to store the current game state: running clock, active lineup, and event stack for the current session.
    - Resilience: Accidental page refresh or browser crash must return the coach to the exact state of the live game.
- **API Sync:** 
    - Events are synced to the backend using "Optimistic UI" (rendered immediately, synced in background).
    - Bulk sync on "End Game" to finalize the state, though incremental sync is preferred for data safety.

## 6. Undo Functionality

- **Stack-based Undo:** The console must provide a "Undo Last Action" button.
- **Scope:** Reverts the last entry in the session's event log (e.g., accidentally logged a goal or swapped the wrong player).
- **Visual History:** A scrollable "Event Log" view allows the coach to verify what has happened.

## 7. Deferred Items (v1.1+)

- Real-time WebSocket sync between devices (PRNT-02, SYNC-01).
- Automatic "Fair Play" rotation suggestions (ROTN-01).
- Advanced analytics (heatmaps, average position).
- Multi-game simultaneous tracking.
