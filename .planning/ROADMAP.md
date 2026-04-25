# Roadmap: Apex Team

## Milestone v1.3: Rotation Engine & Tactical Subs

**Goal**: Transform the game day console with high-performance tactical substitution workflows and an automated rotation engine for equal playtime management.

## Phases

- [x] **Phase 17: Tactical Sub-Queue** - Staged substitutions and bulk execution.
- [x] **Phase 18: Rotation Engine & Playtime** - Equal playtime logic and real-time minutes tracking.
- [ ] **Phase 19: Tactical Polish & Alerts** - Refined tactical interactions and UI polish.

## Phase Details

### Phase 17: Tactical Sub-Queue
**Goal**: Implement the core UI and logic for staging and executing multiple substitutions.
**Depends on**: Milestone v1.2
**Requirements**: SUBS-01, SUBS-02, SUBS-04
**Success Criteria** (what must be TRUE):
  1. Coach can tap a bench player and a field player to "stage" a substitution without immediately changing the lineup.
  2. The UI clearly displays "staged" players overlaying or replacing their target positions in a pending state.
  3. Coach can stage multiple substitutions simultaneously.
  4. A single "Apply Subs" button executes all staged changes, updating the live lineup and logging events.
**Plans**:
- [x] 17-01-PLAN.md — Live Game State Sub-Queue Core
- [x] 17-02-PLAN.md — Sub-Queue UI & View Indicators
- [x] 17-03-PLAN.md — Console Integration & Workflow
**UI hint**: yes

### Phase 18: Rotation Engine & Playtime
**Goal**: Calculate player minutes in real-time and generate optimal rotation suggestions.
**Depends on**: Phase 17
**Requirements**: ROTN-01, ROTN-02, ROTN-03, ROTN-04, ROTN-05
**Success Criteria** (what must be TRUE):
  1. The system tracks "minutes played" for every rostered player based on SUB and PERIOD events.
  2. Coach can configure a "Rotation Interval" (e.g., 8 minutes) and "Rotation Mode" for the active game.
  3. Cumulative playtime (MM:SS) is visible for all players in the Live Console.
  4. At each interval, the engine suggests a set of substitutions that balances playtime across the roster, automatically staging them into the Sub-Queue.
  5. The coach receives a haptic/visual alert when rotation suggestions are ready.
**Plans**:
- [x] 18-01-PLAN.md — Real-time Playtime Tracking
- [x] 18-02-PLAN.md — Rotation Engine Logic
- [x] 18-03-PLAN.md — Configuration & Live Integration
**UI hint**: yes

### Phase 19: Tactical Polish & Alerts
**Goal**: Enhance the game day experience with refined tactical interactions and UI polish.
**Depends on**: Phase 18
**Requirements**: SUBS-03, ROTN-04, ROTN-05
**Success Criteria** (what must be TRUE):
  1. High-performance "Field-to-Field" position swaps are implemented with intuitive gestures (tap-tap).
  2. A rotation alert banner appears at interval boundaries with Apply/Dismiss options.
  3. Rotation interval state persists across page refreshes.
  4. Automation skips alerts if manual substitutions are already staged.
**Plans**:
- [ ] 19-01-PLAN.md — Rotation Alert Logic & Persistence
- [ ] 19-02-PLAN.md — Rotation Alert UI & Performance Polish
**UI hint**: yes

## Progress Table

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 17. Tactical Sub-Queue | 3/3 | Completed | 2026-05-10 |
| 18. Rotation Engine & Playtime | 3/3 | Completed | 2026-05-12 |
| 19. Tactical Polish & Alerts | 0/2 | In Progress | - |
