---
phase: 06-live-game-console
verified: 2026-04-18T12:00:00Z
status: gaps_found
score: 4/5 roadmap success criteria verified
overrides_applied: 0
gaps:
  - truth: "Game state (lineup, events, substitutions) persists to localStorage and survives page refresh"
    status: partial
    reason: "Events persist to localStorage via LiveGameStateService, but LiveClockService state (accumulatedMs, startTime) is held only in memory — clock resets to 00:00 on page reload. The E2E test at live-console.spec.ts:97 asserts app-clock-display is not '00:00' after page.reload(), which will consistently fail. The 06-REVIEW.md identifies this as WR-03."
    artifacts:
      - path: "libs/client/feature/game-console/src/lib/live-clock.service.ts"
        issue: "accumulatedMs and startTime are in-memory signals with no localStorage persistence or rehydration. stop() never writes to localStorage; constructor never reads from it."
    missing:
      - "Persist accumulatedMs to localStorage on stop() and reset()"
      - "Rehydrate accumulatedMs from localStorage in LiveClockService constructor or initialize method"
      - "Fix E2E assertion at live-console.spec.ts:97 if clock persistence is not implemented (change assertion to only check event log)"

  - truth: "Events are optimistically synced to the backend (LIVE-06, LIVE-07)"
    status: failed
    reason: "Two blocking mismatches prevent successful backend sync: (1) Front-end emits YELLOW_CARD/RED_CARD event types but backend only defines CARD — API will throw BadRequestException. (2) GOAL event uses playerId field but backend schema requires scorerId; ASSIST uses playerId but backend schema requires assistorId — both will fail AJV validation once CR-01 is fixed. These are identified as WR-01 and WR-02 in 06-REVIEW.md."
    artifacts:
      - path: "libs/client/feature/game-console/src/lib/player-action-menu/player-action-menu.html"
        issue: "Emits YELLOW_CARD and RED_CARD event types (lines 19-23) but backend migration only registers CARD type."
      - path: "libs/client/feature/game-console/src/lib/console-wrapper/console-wrapper.ts"
        issue: "handleAction at line 179-188 passes playerId in event; EventSyncService sends this as payload. Backend GOAL schema requires scorerId, ASSIST requires assistorId — field names do not match."
      - path: "libs/client/feature/game-console/src/lib/event-sync.service.ts"
        issue: "syncAdd (lines 51-58) builds payload by deleting known system fields and sending the remainder. playerId key remains but backend expects scorerId/assistorId. Also mutates signal-owned event objects directly (event.id = response.id, event.synced = true) — violates Angular signal reactivity contract (CR-02 from REVIEW.md)."
    missing:
      - "Either: add YELLOW_CARD and RED_CARD to the sport event definitions migration, OR map YELLOW_CARD/RED_CARD to CARD with color payload in ConsoleWrapper.handleAction"
      - "Map playerId to scorerId (GOAL) and assistorId (ASSIST) before posting to API in EventSyncService.syncAdd, or align backend schemas to accept playerId"
      - "Replace direct mutation (event.id = response.id) with an immutable update via a new stateService.markEventSynced() method"

human_verification:
  - test: "Mobile touch target audit"
    expected: "Touch targets for player cards and pitch slots are at minimum 44x44px; selected player has sufficient contrast; 10 fast substitutions produce no ghost clicks"
    why_human: "Plan 06-06 includes an explicit human-verify checkpoint gate for mobile responsiveness and touch target compliance. Cannot verify pixel dimensions or interaction quality programmatically."
  - test: "E2E suite execution"
    expected: "All Playwright tests in apps/frontend-e2e/src/live-console.spec.ts pass against a running dev server with a live database"
    why_human: "E2E tests require a running dev server and backend. Playwright tests were verified by static code review only (per 06-06 SUMMARY note). The clock persistence assertion at line 97 is currently expected to fail (WR-03 gap)."
---

# Phase 6: Live Game Console Verification Report

**Phase Goal:** During a live game, coach can make substitutions, undo swaps, and log game events (goals, assists) — all with fast, touch-optimized UI. Game state survives page refresh.
**Verified:** 2026-04-18T12:00:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths (Roadmap Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | Coach can swap a bench player with an on-field player in 2 taps | VERIFIED | `BenchViewComponent` emits playerSelected; `ConsoleWrapper.handlePlayerSelection` detects bench→active swap and calls `stateService.pushEvent({ type: 'SUB' })`. SUB event dispatched on second tap. |
| 2 | Coach can view full substitution history with timestamps for the current game | VERIFIED | `EventLogViewComponent` reads `stateService.events()` reversed, shows `minuteOccurred` badge per event. Component wired in `console-wrapper.html` as `<app-event-log>`. |
| 3 | Coach can undo the last substitution | VERIFIED | `stateService.undo()` soft-deletes the last active event (marks `status: 'deleted'`). `EventLogViewComponent.undo()` delegates to stateService. EventSyncService effect detects status=deleted and sends DELETE to backend. |
| 4 | Coach can tap a player to log a goal or assist with automatic timestamp | VERIFIED (local) | `PlayerActionMenuComponent` emits GOAL/ASSIST; `ConsoleWrapper.handleAction` calls `stateService.pushEvent` with `minuteOccurred` from `clockService.currentMinute()`. Local state updates correctly. **Backend sync is broken** — see gaps (WR-01, WR-02). |
| 5 | Game state (lineup, events, substitutions) persists to localStorage and survives page refresh | PARTIAL — FAILED | Events persist (LiveGameStateService writes to localStorage on every pushEvent/undo). Clock does NOT persist — LiveClockService holds `accumulatedMs` in an in-memory signal only. Page reload resets clock to 00:00, breaking the E2E assertion at live-console.spec.ts:97. |

**Score:** 3.5/5 (3 full passes, 1 local-only pass with broken sync, 1 partial)

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `apps/api/src/entities/sport.entity.ts` | Event definitions schema | VERIFIED | `eventDefinitions: any[]` JSONB column present |
| `apps/api/src/games/games.controller.ts` | Event logging + removal endpoints | VERIFIED | `POST /games/:gameId/events` and `DELETE /games/:gameId/events/:eventId` both implemented, JWT-guarded |
| `apps/api/src/games/games.service.ts` | logEvent + removeEvent with ownership checks | VERIFIED (with known bug) | Ownership verified; AJV validation present but guarded incorrectly — skips validation when payload is absent even if schema has required fields (CR-01 from REVIEW.md) |
| `apps/api/src/migrations/1776510000000-AddEventDefinitionsToSport.ts` | Event definitions migration | VERIFIED | Adds event_definitions column and seeds Soccer sport with GOAL, ASSIST, SUB, CARD definitions |
| `libs/client/feature/game-console/src/lib/live-clock.service.ts` | Precise game timer | VERIFIED (memory only) | Signal-based stopwatch with absolute timestamps. No localStorage persistence — clock resets on reload. |
| `libs/client/feature/game-console/src/lib/live-game-state.service.ts` | Event-sourced game state | VERIFIED | pushEvent, undo, initialize, save all implemented. localStorage keyed by gameId. |
| `libs/client/feature/game-console/src/lib/console-wrapper/console-wrapper.ts` | Main layout shell | VERIFIED | Imports and renders all child components; wires LiveClockService, LiveGameStateService, EventSyncService |
| `libs/client/feature/game-console/src/lib/clock-display/clock-display.ts` | Formatted time visualization | VERIFIED | Uses date-fns intervalToDuration for MM:SS / HH:MM:SS formatting |
| `libs/client/feature/game-console/src/lib/soccer-pitch-view/soccer-pitch-view.ts` | Tactical soccer field UI | VERIFIED | Computed positionedPlayers groups by GK/DEF/MID/FWD with x/y coordinates |
| `libs/client/feature/game-console/src/lib/bench-view/bench-view.ts` | Bench player list | VERIFIED | Renders players input, emits playerSelected output |
| `libs/client/feature/game-console/src/lib/event-log/event-log.ts` | Visual history of game actions | VERIFIED | Reads stateService.events() reversed; undo button delegates to stateService.undo() |
| `libs/client/feature/game-console/src/lib/player-action-menu/player-action-menu.ts` | Contextual player stats logging | VERIFIED (with type mismatch) | Emits GOAL, ASSIST, YELLOW_CARD, RED_CARD — YELLOW_CARD and RED_CARD will be rejected by API |
| `libs/client/feature/game-console/src/lib/event-sync.service.ts` | Backend synchronization | PARTIAL — STUB | Effect-based sync with retry(3) implemented. But: direct signal mutation (CR-02), GOAL/ASSIST payload field mismatch (WR-02) mean synced events will fail or produce corrupt state |
| `apps/frontend-e2e/src/live-console.spec.ts` | Automated regression suite | VERIFIED (not run) | Full game flow spec written and committed. Not actually executed against running server. Clock persistence assertion at line 97 expected to fail. |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `POST /api/games/:gameId/events` | GameEventEntity | GamesService.logEvent | WIRED | Controller delegates to service; service verifies ownership, validates against sport event definitions, saves entity |
| `DELETE /api/games/:gameId/events/:eventId` | GameEventEntity removal | GamesService.removeEvent | WIRED | Controller delegates to service; service verifies ownership then removes entity |
| `/teams/:id/games/:gameId/console` route | ConsoleWrapper | app.routes.ts lazy load | WIRED | Route present at line 56-59 in app.routes.ts, lazy-loads from `@apex-team/client/feature/game-console` |
| ConsoleWrapper | LiveClockService | inject() | WIRED | clockService injected; startClock/stopClock wired to template buttons |
| ConsoleWrapper | LiveGameStateService | inject() | WIRED | stateService injected; activePlayers/benchPlayers bound to child components |
| ConsoleWrapper | EventSyncService | inject() | WIRED | syncService injected (constructor runs effect automatically) |
| BenchViewComponent | ConsoleWrapper.handlePlayerSelection | (playerSelected) output | WIRED | console-wrapper.html line 38-42 |
| SoccerPitchViewComponent | ConsoleWrapper.handlePlayerSelection | (playerSelected) output | WIRED | console-wrapper.html line 31-35 |
| PlayerActionMenuComponent | ConsoleWrapper.handleAction | (actionSelected) output | WIRED | console-wrapper.html line 54-57 |
| EventSyncService | POST /api/games/:gameId/events | HttpClient.post | WIRED (broken payload) | syncAdd posts to correct URL with retry; payload field names do not match backend schema |
| EventSyncService | DELETE /api/games/:gameId/events/:eventId | HttpClient.delete | WIRED | syncDelete sends DELETE to correct URL when event.status='deleted' and event.id exists |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| SoccerPitchViewComponent | players input | stateService.activePlayers() (computed) | Yes — derived from initialLineup + SUB events | FLOWING |
| BenchViewComponent | players input | stateService.benchPlayers() (computed) | Yes — derived from lineup minus active players | FLOWING |
| EventLogViewComponent | events computed | stateService.events() signal | Yes — populated by pushEvent; real signal not static | FLOWING |
| ClockDisplayComponent | formattedTime computed | clockService.elapsedMs() signal | Yes — updated every 100ms by interval | FLOWING (memory only — not persisted) |

---

### Behavioral Spot-Checks

Step 7b: SKIPPED — no runnable entry points in this environment (requires running dev server and database for meaningful behavioral checks). Code review and static analysis used instead.

---

### Requirements Coverage

| Requirement | Source Plans | Description | Status | Evidence |
|-------------|-------------|-------------|--------|---------|
| LIVE-02 | 06-04-PLAN | Coach can see who's on the field and bench at a glance | VERIFIED | SoccerPitchViewComponent renders activePlayers(); BenchViewComponent renders benchPlayers() — both wired in ConsoleWrapper. Note: REQUIREMENTS.md traceability maps LIVE-02 to Phase 5, not Phase 6. The 06-04 PLAN frontmatter claims it. Feature is implemented here regardless. |
| LIVE-03 | 06-04-PLAN | Coach can swap players in/out during a live game | VERIFIED | handlePlayerSelection in ConsoleWrapper dispatches SUB event on bench→active swap |
| LIVE-04 | 06-05-PLAN | Coach can view substitution history for current game | VERIFIED | EventLogViewComponent shows all events including SUB with minuteOccurred |
| LIVE-05 | 06-02-PLAN, 06-05-PLAN | Coach can undo the last substitution | VERIFIED | stateService.undo() + EventSyncService DELETE path |
| LIVE-06 | 06-01-PLAN, 06-05-PLAN | Coach can log a goal with scoring player and timestamp | PARTIAL | Local state updates correctly. Backend sync broken: GOAL payload uses playerId but API schema requires scorerId (WR-02). |
| LIVE-07 | 06-01-PLAN, 06-05-PLAN | Coach can log an assist with assisting player and timestamp | PARTIAL | Local state updates correctly. Backend sync broken: ASSIST payload uses playerId but API schema requires assistorId (WR-02). |
| LIVE-08 | 06-03-PLAN, 06-05-PLAN | Coach can view game event log (goals, assists, substitutions) | VERIFIED | EventLogViewComponent displays full history with type icons, minuteOccurred badge, and undo support |
| INFR-03 | 06-02-PLAN, 06-06-PLAN | Game console state persists locally (survives accidental page refresh) | PARTIAL | Events persist to localStorage. Clock does NOT persist (WR-03 gap). |

**Orphaned requirements check:** REQUIREMENTS.md traceability table maps LIVE-02 to Phase 5 (In Progress). Phase 6 plans claim it in requirements frontmatter. No requirements mapped to Phase 6 in REQUIREMENTS.md are missing from plans.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `apps/api/src/games/games.service.ts` | 137 | `if (definition.payloadSchema && dto.payload)` — validation skipped when payload absent | Blocker | GOAL events with no payload bypass required-field validation; events with missing required fields (scorerId) persisted to DB with null payload |
| `libs/client/feature/game-console/src/lib/event-sync.service.ts` | 76-77, 99 | `event.id = response.id; event.synced = true` — direct mutation of signal-owned object | Blocker | Angular signal reactivity not triggered; view never updates to show synced state; stateService.save() may serialize stale data |
| `libs/client/feature/game-console/src/lib/player-action-menu/player-action-menu.html` | 19-23 | YELLOW_CARD / RED_CARD event types | Blocker | Backend event definitions only register CARD; any card event will throw BadRequestException on sync |
| `libs/client/feature/game-console/src/lib/console-wrapper/console-wrapper.ts` | 179-188 | handleAction sends playerId; backend GOAL requires scorerId, ASSIST requires assistorId | Blocker | Backend will reject GOAL and ASSIST events on sync (after CR-01 fix) |
| `libs/client/feature/game-console/src/lib/live-clock.service.ts` | 1-81 | No localStorage write in stop(); no read in constructor | Blocker (for INFR-03) | Clock resets to 00:00 on page reload; E2E assertion at live-console.spec.ts:97 will fail |
| `libs/client/feature/game-console/src/lib/event-sync.service.ts` | 69, 98 | console.error() in production code | Info | Not a functional blocker; should be replaced with structured logging before production |
| `libs/client/feature/game-console/src/lib/console-wrapper/console-wrapper.ts` | 106-108 | Empty ngOnInit body | Info | Dead code; ngOnInit can be removed |
| `apps/api/src/entities/sport.entity.ts` | 15 | `eventDefinitions: any[]` | Info | No type safety on event definitions; causes (d: any) casts in games.service.ts |

---

### Human Verification Required

#### 1. Mobile Touch Target Audit

**Test:** Open the app on a mobile device (or responsive emulator at 375px width). Open a game console. Verify touch targets for player cards in bench view and slots in soccer pitch view are at minimum 44x44px. Verify selected player has sufficient contrast. Perform 10 fast substitutions and check for ghost clicks.
**Expected:** All touch targets meet 44px minimum; no ghost clicks during rapid tapping; selected state is visually clear.
**Why human:** Plan 06-06 includes an explicit human-verify checkpoint gate. Cannot verify pixel dimensions, contrast ratios, or interaction timing programmatically without running device.

#### 2. E2E Suite Execution

**Test:** Start the dev server (frontend + API + PostgreSQL). Run `npx nx run frontend-e2e:e2e` and observe all tests in `apps/frontend-e2e/src/live-console.spec.ts`.
**Expected:** All steps pass except the clock persistence assertion at line 97 (which will fail until the WR-03 clock persistence gap is fixed).
**Why human:** E2E tests require a running server and live database. Static code review confirms the test structure is correct, but actual execution cannot be verified in this context.

---

### Gaps Summary

**Gap 1 — Clock state not persisted (INFR-03 partial failure)**

The phase goal states "game state survives page refresh." Events survive via localStorage, but the game clock does not. `LiveClockService` holds `accumulatedMs` and `startTime` in Angular signals with no localStorage write on `stop()` and no localStorage read on initialization. After `page.reload()`, the clock always shows `00:00`. The E2E test at line 97 asserts the clock is not `00:00` after reload — this assertion will fail consistently in CI. The code review (WR-03) documents the fix: write `accumulatedMs` to localStorage on `stop()` and rehydrate on init.

**Gap 2 — Backend sync broken for GOAL, ASSIST, and card events (LIVE-06, LIVE-07 partial)**

Three field mismatches prevent events from reaching the backend successfully:

- **Card events (WR-01):** `PlayerActionMenuComponent` emits `YELLOW_CARD` and `RED_CARD`. The backend migration only defines one `CARD` event type. Posting `YELLOW_CARD` to the API throws `BadRequestException: Event type YELLOW_CARD not supported for this sport`. Card logging is locally visible but never synced.

- **Goal/assist payload fields (WR-02):** `ConsoleWrapper.handleAction` constructs the event with `playerId`. `EventSyncService.syncAdd` strips system fields and sends the remainder as `payload`. The GOAL schema requires `scorerId`; ASSIST requires `assistorId`. The field names do not match. Even after fixing the payload validation bypass (CR-01), these events will fail AJV validation.

- **Signal mutation in EventSyncService (CR-02):** `syncAdd` and `syncDelete` mutate `event.id` and `event.synced` directly on the object reference retrieved from the signal array. Angular signals require a new reference to trigger change detection. After a successful POST, the view never updates to reflect the synced state, and `stateService.save()` may serialize the pre-mutation version of the event due to timing.

These three issues together mean that while local game state is functional, the backend receives no accurate record of goals, assists, or cards. Substitutions (SUB events) use a different payload structure (`playerIdIn`, `playerIdOut`) — however, the SUB event definition in the migration also requires `positionName` which is not included in the ConsoleWrapper SUB dispatch.

---

_Verified: 2026-04-18T12:00:00Z_
_Verifier: Claude (gsd-verifier)_
