# Pitfalls Research: Youth Sports Team Management

## Overview

Common mistakes and pitfalls when building youth sports team management applications, with specific prevention strategies.

## Critical Pitfalls

### 1. Over-Engineering the Sport Configuration

**The Mistake:** Building a fully generic "sport designer" that lets coaches define custom sports, custom field layouts, custom scoring rules — before shipping anything.

**Warning Signs:**
- Spending more than 1 phase on sport configuration
- Building a visual field editor for v1
- Creating abstract "rule engines" before having one working sport

**Prevention:**
- Seed soccer configuration as data (positions, field size, event types)
- Use JSONB for positions — flexible enough to add sports later
- Hard-code only the soccer visual layout for v1
- Build the abstraction after you have 2-3 sports to generalize from

**Phase impact:** Phase 1 (workspace setup) — get the schema right, but keep the implementation simple.

### 2. Ignoring Offline/Unreliable Connectivity

**The Mistake:** Building the live game console as a purely online experience. Youth sports fields often have poor cellular reception.

**Warning Signs:**
- Every button tap makes a blocking API call
- No local state management during gameplay
- App becomes unusable when signal drops

**Prevention:**
- Design the game console to work with **local-first state** (Signals/in-memory)
- Sync to backend optimistically (fire-and-forget with retry queue)
- For v1: auto-save game state to localStorage as backup
- For v2: full offline support with background sync

**Phase impact:** Phase 5-6 (Game Console) — design API calls as non-blocking from the start.

### 3. Complex Substitution State Management

**The Mistake:** Tracking lineup state as mutable object that's updated in place. This makes undo impossible, playing time calculation unreliable, and debugging painful.

**Warning Signs:**
- `lineup.players[position] = newPlayer` (direct mutation)
- No substitution history
- Can't calculate playing time accurately
- "Who played where?" is unanswerable after the game

**Prevention:**
- Use **event sourcing** for game state: every action creates an immutable event
- Current lineup = derived state from replaying events
- Undo = remove latest event
- Playing time = diff between events per player
- Substitution history = the event log itself

**Phase impact:** Phase 5 (Data modeling) — choose the event-sourced approach from the start.

### 4. Premature Multi-Device Sync

**The Mistake:** Building real-time WebSocket sync between head coach and assistant coach devices before the single-coach experience works perfectly.

**Warning Signs:**
- Spending time on conflict resolution in v1
- Building "shared sessions" before solo sessions work
- Socket.io integration before CRUD is solid

**Prevention:**
- v1 is single-coach, single-device. Period.
- Design the event-sourced game state so it CAN be synced later
- v2 adds Socket.io on top of the same event model
- Reference: The event-sourced approach naturally becomes the "sync stream" in v2

**Phase impact:** All phases — resist the temptation to add sync early.

### 5. Authentication Scope Creep

**The Mistake:** Building full role-based access control, parent onboarding, team invitations, and multi-guardian support in v1.

**Warning Signs:**
- More than 2 roles in v1 (just COACH for now)
- Building invitation workflows before the app does anything useful
- Implementing parent-facing features before coach features are solid

**Prevention:**
- v1 auth: signup, login, password reset. One role: COACH
- Store `role` field for future expansion, but only implement coach logic
- Parent onboarding (claim tokens) is explicitly v2
- Assistant coaches are explicitly v2

**Phase impact:** Phase 2 (Auth) — keep it simple: email/password + JWT.

### 6. UI/UX Pitfalls for Game Day

**The Mistake:** Building the game console like a standard CRUD app instead of a pressure-tested coaching tool. A coach using the app during a game needs to make changes in 2-3 taps, not navigate through forms.

**Warning Signs:**
- Substitution requires more than 3 taps
- Logging a goal requires typing anything
- Small tap targets on mobile
- No visual distinction between on-field and bench players

**Prevention:**
- **Large touch targets** (minimum 44px, preferably 56px for game-critical buttons)
- **One-tap event logging:** Tap player → tap event type (Goal, Assist) → done
- **Visual field layout** showing who's where, with bench clearly separated
- **Haptic feedback** on key actions (substitution confirmed, goal logged)
- **No confirmations** during live play (use undo instead of "are you sure?")

**Phase impact:** Phase 6 (Live Console UI) — test with actual game-day scenarios.

### 7. Database Schema Rigidity

**The Mistake:** Using ENUMs everywhere instead of configurable data. When you want to add basketball, you discover positions are hard-coded as `'GK' | 'DEF' | 'MID' | 'FWD'`.

**Warning Signs:**
- Position types as database ENUMs
- Event types as database ENUMs
- Period types as database ENUMs
- Any sport-specific logic in the schema itself

**Prevention:**
- Positions stored as JSONB on the `sports` table (already in TRD schema)
- Event types as JSONB or configurable per sport
- Period info as data, not code structure
- Use ENUMs only for truly universal concepts (user roles, game status)

**Phase impact:** Phase 1 (Schema design) — get this right from the start.

## Medium-Risk Pitfalls

### 8. Monorepo Library Explosion

**The Mistake:** Creating too many small libraries in the Nx monorepo, making the dependency graph hard to navigate and slowing down builds.

**Prevention:** 
- Start with 1 library per feature area, split later if needed
- Don't create `util` libraries until you have code to put in them
- Group related functionality (e.g., `libs/client/feature/roster` not `libs/client/feature/player-list` + `libs/client/feature/player-card` + `libs/client/feature/player-form`)

### 9. Tailwind + Ionic CSS Conflicts

**The Mistake:** Tailwind's reset styles conflict with Ionic's Shadow DOM components, creating visual inconsistencies.

**Prevention:**
- Use Tailwind's `preflight: false` or scope resets carefully
- Use Ionic CSS variables for component theming
- Use Tailwind only for layout/spacing/utilities outside Ionic components
- Test dark mode with both systems early

### 10. Testing the Wrong Things

**The Mistake:** Writing unit tests for simple CRUD operations while ignoring the complex game state logic.

**Prevention:**
- **Must test:** Game event sourcing, lineup derivation, playing time calculation, substitution validation
- **Skip testing:** Simple getters, basic component rendering, trivial service wrappers
- **E2E test:** The full game day flow (create game → set lineup → make subs → log events)

---
*Researched: 2026-04-14*
