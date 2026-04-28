# Phase 18: Rotation Engine & Playtime - Research

**Researched:** 2026-05-10
**Domain:** Real-time substitution logic and playtime equalization
**Confidence:** HIGH

## Summary

This research establishes the architectural and algorithmic foundation for the Apex Team Rotation Engine. The primary challenge is maintaining accurate, seconds-level playtime tracking across device suspends and period transitions, while providing transparent, "fair" substitution suggestions. 

The core recommendation is an **Event-Sourced Accumulator** pattern: playtime is never "stored" as a mutable number, but always derived from the history of `SUB_IN`, `SUB_OUT`, and `CLOCK_PAUSE/RESUME` events. Real-time display is achieved by combining this historical baseline with a Signal-based "Live" offset. For the rotation logic, a **Position-Aware Greedy Matching** algorithm is recommended over complex optimization solvers to ensure coach trust through simplicity and predictability.

**Primary recommendation:** Use an RxJS-driven "Tick" signal to drive a computed playtime accumulator that derives state entirely from the `GameEvent` log, ensuring 100% "Undo" compatibility and state persistence.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Playtime Tracking | Browser (Live) | API (Persistence) | High-frequency UI updates happen locally; API stores event log as the source of truth. |
| Rotation Suggestions | Browser (Client) | — | Instant feedback loop for the coach; no network latency required for rule-based heuristics. |
| Configuration Persistence | API | Browser | Settings (interval, mode) stored in DB; loaded into local state at game start. |
| Audible/Visual Alerts | Browser | — | Device-level notifications for rotation intervals. |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `date-fns` | ^4.1.0 | Duration formatting | Already in project; better than hand-rolling "MM:SS" logic. [VERIFIED: package.json] |
| `rxjs` | ~7.8.0 | Timing and streams | Standard for high-frequency "ticks" and event processing. [VERIFIED: package.json] |
| `@capacitor/haptics` | ^8.0.2 | Physical alerts | Provides tactile feedback when rotation intervals are hit. [VERIFIED: package.json] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|--------------|
| `Angular Signals` | ^21.x | State management | Recommended for high-frequency UI updates (playtime counters). [CITED: Angular 21 Docs] |

**Installation:**
```bash
# No new packages required. Existing stack covers all needs.
```

## Architecture Patterns

### Real-Time Playtime Accumulator (Event-Sourced)
Playtime is calculated by iterating through the `GameEvent` log and summing durations between `SUB_IN` and `SUB_OUT` events, adjusted for `CLOCK_PAUSE` periods.

**Pattern: The "Active Stint" Calculation**
1. **History Sum:** Sum of all completed stints in the event log.
2. **Current Offset:** If player is `on-field` and clock is `running`, add `(now - lastEventTimestamp)`.

### Rotation Suggestion: Position-Aware Greedy Matching
To maintain tactical formation, the engine matches the "least-played" bench player with the "most-played" field player *within the same position group*.

1. **Group** all players by their current assigned position.
2. **Sort** bench players by cumulative playtime (ascending).
3. **Sort** field players by cumulative playtime (descending).
4. **Pair** the top $N$ from each list to generate suggestions.

### Recommended Project Structure
```
libs/client/feature/game-console/src/lib/
└── rotation-engine/
    ├── rotation.service.ts        # Pure logic: algorithms & suggestions
    ├── rotation.service.spec.ts   # Unit tests for logic
    ├── playtime.service.ts        # State management: accumulating seconds from events
    └── playtime.service.spec.ts   # Unit tests for calculation
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Duration Strings | `min + ":" + sec` | `date-fns/formatDuration` | Handles edge cases, zero-padding, and localized units. |
| High-Frequency Ticks | `setInterval` | RxJS `timer(0, 1000)` | Integrated with Angular's zone/signals, easier to clean up and test. |
| Linear Optimization | Custom solver | `jsLPSolver` | **(Deferred)** Only use if "Equal Playtime" is superseded by complex multi-constraint skill balancing. |

## Common Pitfalls

### Pitfall 1: Clock Drift and Background Throttling
**What goes wrong:** `setInterval` or `setTimeout` are throttled by browsers when the app is in the background or the screen is locked.
**How to avoid:** Never rely on the *count* of intervals. Always calculate time as the difference between `Date.now()` and a persisted `startTime`.
**Warning signs:** Playtime is significantly lower than real time after the phone was in a pocket.

### Pitfall 2: The "Goalie Paradox"
**What goes wrong:** In most youth sports, goalies are not rotated at the same frequency as field players. Including them in "Pure" rotation leads to weird suggestions.
**How to avoid:** Explicitly protect "GK" positions (or sport-specific equivalents) from the engine, as per Phase 18 context. [CITED: 18-CONTEXT.md]

### Pitfall 3: Period Transition "Ghost Minutes"
**What goes wrong:** Minutes continue to accumulate during halftime or between quarters because the "Clock Pause" event wasn't fired or handled.
**How to avoid:** The accumulator must treat `PERIOD_END` and `GAME_PAUSE` as hard stops for all active stints.

## Code Examples

### Signal-based "Live" Game Clock
```typescript
// Source: Community Pattern [VERIFIED: Angular Signals Best Practices]
@Injectable({ providedIn: 'root' })
export class GameClockService {
  private readonly _state = signal({
    isRunning: false,
    elapsedSeconds: 0,
    lastStartedAt: null as number | null
  });

  // Tick every second to drive computed signals
  private readonly _now = toSignal(interval(1000).pipe(map(() => Date.now())));

  public readonly totalSeconds = computed(() => {
    const s = this._state();
    if (!s.isRunning || !s.lastStartedAt) return s.elapsedSeconds;
    return s.elapsedSeconds + Math.floor((this._now()! - s.lastStartedAt) / 1000);
  });
}
```

### Playtime Accumulator (Simplified)
```typescript
// Source: Custom Algorithm for Apex Team [CITED: 18-CONTEXT.md]
function calculatePlaytime(events: GameEvent[], playerId: string, now: number): number {
  let total = 0;
  let stintStart: number | null = null;

  for (const event of events) {
    if (event.type === 'SUB_IN' && event.playerId === playerId) {
      stintStart = event.timestamp;
    } else if (event.type === 'SUB_OUT' && event.playerId === playerId && stintStart) {
      total += (event.timestamp - stintStart);
      stintStart = null;
    }
    // Handle Game Pause/Resume similarly...
  }

  // Add active stint
  if (stintStart) total += (now - stintStart);
  return Math.floor(total / 1000);
}
```

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Position slots are used for rotation mapping. | Architecture Patterns | If sports don't use position slots, "Position-Locked" mode is impossible. |
| A2 | `Date.now()` is reliable for duration tracking. | Pitfalls | Minimal risk; only breaks if system clock is manually changed mid-game. |
| A3 | Capacitor Haptics work in PWA mode. | Standard Stack | Might fall back to no-op in some browsers; visual alerts are primary. |

## Open Questions

1. **Multiple Positions:** How should the engine handle players who are marked as "Midfield" but currently playing "Forward"?
   - *Recommendation:* Suggestion should be based on the **Position Slot** they are currently occupying, not their roster preference.
   - **RESOLVED:** Strategy adopted.
2. **Sub-Interval Manual Subs:** If a coach makes a manual sub at 4:00 in an 8:00 interval, should the timer reset?
   - *Recommendation:* Do not reset the interval timer; simply recalculate the "best next" sub at the original 8:00 mark based on the new state.
   - **RESOLVED:** No reset; recalculated based on current state at interval mark.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Angular 21 | Core Logic | ✓ | 21.2.0 | — |
| date-fns | Formatting | ✓ | 4.1.0 | — |
| Haptics API | Alerts | ✓ | 8.0.2 | Visual only |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest |
| Config file | `apps/frontend/vitest.config.mts` |
| Quick run command | `npx nx test frontend` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ROTN-01 | Set rotation interval | unit | `vitest rotation.service.spec.ts` | ❌ Wave 0 |
| ROTN-02 | Calculate real-time mins | unit | `vitest playtime.service.spec.ts` | ❌ Wave 0 |
| ROTN-03 | Generate suggestions | unit | `vitest rotation.engine.spec.ts` | ❌ Wave 0 |

## Security Domain

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V5 Input Validation | yes | Validate `rotationIntervalMinutes` > 0 and `rotationMode` enum values in API. |

## Sources

### Primary (HIGH confidence)
- [Angular 21 Docs] - Signals and Computed Patterns
- [18-CONTEXT.md] - Phase specific decisions
- [TRD] - Technical stack and library structure

### Secondary (MEDIUM confidence)
- [US Youth Soccer Guidelines] - The "50% Rule" and unlimited sub standards

## Metadata
**Confidence breakdown:**
- Standard stack: HIGH
- Architecture: HIGH
- Pitfalls: MEDIUM (PWA background behavior varies)

**Research date:** 2026-05-10
**Valid until:** 2026-06-10
