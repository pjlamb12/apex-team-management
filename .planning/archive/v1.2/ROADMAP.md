# Roadmap: Apex Team

## Milestone v1.3: Rotation Engine & Tactical Subs

**Goal**: Transform the game day console with high-performance tactical substitution workflows and an automated rotation engine for equal playtime management.

## Phases

- [ ] **Phase 17: Tactical Sub-Queue** - Staged substitutions and bulk execution.
- [ ] **Phase 18: Rotation Engine & Playtime** - Equal playtime logic and real-time minutes tracking.
- [ ] **Phase 19: Tactical Polish & Alerts** - Audible/visual notifications and high-performance manual swaps.

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
**Plans**: TBD
**UI hint**: yes

### Phase 18: Rotation Engine & Playtime
**Goal**: Calculate player minutes in real-time and generate optimal rotation suggestions.
**Depends on**: Phase 17
**Requirements**: ROTN-01, ROTN-02, ROTN-03, ROTN-05
**Success Criteria** (what must be TRUE):
  1. The system tracks "minutes played" for every rostered player based on SUB and PERIOD events.
  2. Coach can configure a "Rotation Interval" (e.g., 8 minutes) for the active game.
  3. At each interval, the engine suggests a set of substitutions that balances playtime across the roster.
  4. Coach can load these suggestions into the Sub-Queue with one tap for final review.
**Plans**: TBD
**UI hint**: yes

### Phase 19: Tactical Polish & Alerts
**Goal**: Enhance the game day experience with timely alerts and refined tactical interactions.
**Depends on**: Phase 18
**Requirements**: ROTN-04, SUBS-03
**Success Criteria** (what must be TRUE):
  1. The app provides a visual countdown and an audible/vibration alert when the next rotation window is reached.
  2. High-performance "Field-to-Field" position swaps are implemented with intuitive gestures (tap-tap or drag).
  3. The Game Console UI remains responsive and fluid even with complex sub-queue overlays.
**Plans**: TBD
**UI hint**: yes

## Progress Table

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 17. Tactical Sub-Queue | 0/1 | Not started | - |
| 18. Rotation Engine & Playtime | 0/1 | Not started | - |
| 19. Tactical Polish & Alerts | 0/1 | Not started | - |
