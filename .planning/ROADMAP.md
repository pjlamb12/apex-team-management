# Roadmap: Apex Team

## Milestone v1.5: Real-time Synchronization

**Goal**: Implement real-time synchronization between coaches and assistants using Socket.io, ensuring game console state, event logs, and status changes are consistent across all devices.

## Phases

- [x] **Phase 21: Socket.io Foundation** - Setup Socket.io on backend and frontend with room logic and authentication.
- [x] **Phase 22: Live Game Synchronization** - Real-time sync for substitutions, goals, and game status changes.

## Phase Details

### Phase 21: Socket.io Foundation
**Goal**: Establish a secure Socket.io infrastructure for both backend and frontend.
**Depends on**: Milestone v1.4
**Requirements**: SYNC-03
**Success Criteria** (what must be TRUE):
  1. Socket.io dependencies installed on backend and frontend.
  2. `SocketGateway` implemented on backend with JWT authentication.
  3. `SocketService` implemented on frontend with automatic reconnection and event handling.
  4. Room-based synchronization logic (Join `team:{teamId}` and `event:{eventId}` rooms).
**Plans**:
- [ ] 21-01-PLAN.md — Socket.io Backend & Authentication
- [ ] 21-02-PLAN.md — Socket.io Frontend Service & Room Logic

### Phase 22: Live Game Synchronization
**Goal**: Broadcast and receive game state changes in real-time.
**Depends on**: Phase 21
**Requirements**: SYNC-03
**Success Criteria** (what must be TRUE):
  1. `EventsService` broadcasts new game events (subs, goals) to the `event:{eventId}` room.
  2. `EventsService` broadcasts game status changes (Start/End/Period) to the room.
  3. `LiveGameStateService` on the frontend updates its internal signal state when remote events are received.
  4. State remains consistent across devices even with intermittent connectivity.
**Plans**:
- [ ] 22-01-PLAN.md — Backend Event Broadcasting
- [ ] 22-02-PLAN.md — Frontend Real-time State Updates

## Progress Table

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 21. Socket.io Foundation | 2/2 | Completed | 2026-05-13 |
| 22. Live Game Synchronization | 2/2 | Completed | 2026-05-13 |
