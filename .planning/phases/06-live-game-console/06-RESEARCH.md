# Phase 6: Live Game Console - Research

**Researched:** 2026-05-20
**Domain:** Live Game Management / Real-time UI / Event Sourcing
**Confidence:** HIGH

## Summary

This phase focuses on the **Live Game Console**, a mobile-optimized interface for coaches to manage running games. The core technical challenges involve high-precision clock management, dynamic sport-specific visualizations (e.g., a soccer pitch), and a robust, undoable event logging system that supports sport-agnostic stats via PostgreSQL JSONB.

We will leverage **Angular 21 Signals** for a reactive, persistent game state and **NestJS + AJV** for dynamic schema validation of sport-specific events.

**Primary recommendation:** Use a **History-Index Event Sourcing** pattern for local state management (Undo/Redo) and **JSON Schema (AJV)** for validating dynamic payloads in the backend.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Running Game Clock | Browser / Client | — | Real-time accuracy and UI reactivity. |
| Event Undo/Redo | Browser / Client | API / Backend | Immediate local response; later sync to DB for persistent log. |
| Sport-Specific View | Browser / Client | — | UI visualization of field/pitch (Soccer Pitch, Court, etc.). |
| Event Payload Validation | API / Backend | Browser / Client | Backend enforces schema-driven data integrity; Frontend uses same schema for UI hints. |
| Game State Persistence | Browser / Client | API / Backend | Local persistence (localStorage) for crash recovery; DB for permanent record. |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Angular | ~21.2.0 | Frontend framework | Project standard; Signals provide perfect reactivity for live stats. |
| NestJS | ^11.1.19 | Backend API | Project standard; Supports flexible middleware for dynamic validation. |
| PostgreSQL | 16 | Database | Supports `JSONB` for schema-agnostic event payloads. |
| TypeORM | ^0.3.28 | ORM | Handles JSONB interaction and entity mapping. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|--------------|
| `ajv` | 8.18.0 | JSON Schema Validator | For validating dynamic payloads against sport-specific schemas. [VERIFIED: npm registry] |
| `ajv-formats` | 3.0.1 | AJV Format plugins | Adds UUID and ISO Date support to JSON Schema. [VERIFIED: npm registry] |
| `date-fns` | 4.1.0 | Date Utility | Managing durations and interval math for the game clock. [VERIFIED: npm registry] |
| `@ionic/angular` | ^8.8.4 | UI Components | Optimized mobile touch targets and layout components. [VERIFIED: package.json] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| JSON Schema | Class-Validator | Class-Validator is static; sport-agnostic payloads need runtime schema loading. |
| Drag-and-Drop | 2-Tap Selection | Drag-and-drop is error-prone on sweaty/shaking mobile hands during a live game. |

**Installation:**
```bash
npm install ajv ajv-formats date-fns
```

## Architecture Patterns

### Recommended Project Structure
```
libs/domain/live-console/
├── features/
│   ├── console/              # Main console wrapper
│   ├── clock/                # Signal-based clock logic
│   ├── pitch-view/           # Soccer specific visualization
│   └── event-log/            # Undo/Redo and history view
├── data-access/
│   ├── live-game-state.service.ts
│   └── event-sync.service.ts
└── ui/
    ├── player-card/
    └── field-slot/
```

### Pattern 1: History-Index Event Sourcing (Undo/Redo)
**What:** Storing an array of `GameEvents` and a `historyIndex` signal.
**When to use:** For all live console actions (Subs, Goals, Cards).
**Implementation:**
- `events = signal<GameEvent[]>([])`
- `historyIndex = signal<number>(-1)`
- `state = computed(() => replay(events().slice(0, historyIndex() + 1)))`

### Pattern 2: Persistent Running Clock
**What:** A clock that survives refresh by storing `startTime` (server-synced timestamp) and `accumulatedTime`.
**When to use:** Game clock management.
**Implementation:**
- Use `effect()` to sync to `localStorage` on every tick or state change.
- On load: `if (startTime) elapsed = Date.now() - startTime + accumulated`.

### Pattern 3: Dynamic View Injection
**What:** Using `ngComponentOutlet` with `inputs` binding to load a "Pitch View" or "Court View" based on `SportEntity.metadata`.
**When to use:** Sport-specific visualization.
**Example:**
```typescript
// Angular 21 Pattern
@Component({
  template: `<ng-container *ngComponentOutlet="viewComponent(); inputs: { slots: pitchSlots() }" />`
})
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSON Validation | Custom validation logic | `ajv` | Robust, standardized, and handles complex conditional logic. |
| Interval Drift | `totalMs += 10` | `Date.now() - startTime` | `setInterval` drifts over time; absolute timestamps do not. |
| Formatted Durations | Custom string splicing | `date-fns` (`formatDuration` or `intervalToDuration`) | Handles edge cases and standard formatting. |

## Common Pitfalls

### Pitfall 1: Browser Throttling
**What goes wrong:** `setInterval` slows down when the tab is in the background or the screen is off.
**How to avoid:** Always use absolute timestamps (`Date.now()`) for calculations. When the app returns to the foreground, the clock will "snap" to the correct time.

### Pitfall 2: Optimistic UI Desync
**What goes wrong:** A coach undos an action locally, but the sync to the API fails, leaving the DB with the "deleted" event.
**How to avoid:** Ensure the undo action sends a `DELETE` or a `COMPENSATING_EVENT` to the API with a retry policy.

### Pitfall 3: Mobile Touch "Ghost" Clicks
**What goes wrong:** Tapping a player on the bench triggers a second tap on the field slot unintentionally.
**How to avoid:** Add a small debounce (e.g., 100ms) or use Ionic's `ion-ripple-effect` to provide tactile feedback that consumes the touch.

## Code Examples

### Signal-based Stopwatch (Angular 21)
```typescript
// Source: Community Standard for Precise Timers
export class LiveClockService {
  private startTime = signal<number | null>(null);
  private accumulatedMs = signal(0);
  
  public elapsedMs = computed(() => {
    const start = this.startTime();
    if (!start) return this.accumulatedMs();
    return Date.now() - start + this.accumulatedMs();
  });

  start() {
    this.startTime.set(Date.now());
  }

  stop() {
    this.accumulatedMs.set(this.elapsedMs());
    this.startTime.set(null);
  }
}
```

### Dynamic AJV Validation (NestJS)
```typescript
// Pattern: Dynamic Schema Validation for JSONB
@Injectable()
export class EventValidationPipe implements PipeTransform {
  private ajv = new Ajv();
  constructor(private sportService: SportService) {}

  async transform(value: any) {
    const sport = await this.sportService.getSport(value.sportId);
    const schema = sport.eventDefinitions.find(e => e.type === value.eventType)?.payloadSchema;
    
    if (schema && !this.ajv.validate(schema, value.payload)) {
      throw new BadRequestException(this.ajv.errors);
    }
    return value;
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `ComponentFactoryResolver` | `ngComponentOutlet` + `inputs` | Angular 17+ | Dramatically simplified dynamic components. |
| Manual `.subscribe()` | Signals (`toSignal`, `computed`) | Angular 16+ | Memory safe, predictable reactivity. |
| Storing raw strings | PostgreSQL `JSONB` | Postgres 9.4+ | Searchable, performant semi-structured data. |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Coaches prefer 2-tap swap over Drag-and-Drop. | Interaction Flow | UX friction if Drag-and-Drop was expected. |
| A2 | LocalStorage is sufficient for session persistence. | Persistence | Data loss if browser clears cache mid-game. |
| A3 | `Date.now()` is precise enough for sports tracking. | Code Examples | Millisecond-level errors in high-speed sports (less relevant for soccer). |

## Open Questions

1. **How to handle "Injury Time" (Stoppage Time)?**
   - Recommendation: Simple running clock for v1; add a "Stoppage" field in v2.
2. **What happens if two coaches track the same game?**
   - Recommendation: Out of scope for v1 (Deferred Item: WebSockets). v1 assumes single coach.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| PostgreSQL | Data layer | ✓ | 16.0 | — |
| Node.js | Backend | ✓ | 20.x | — |
| npm | Dependencies | ✓ | 10.x | — |

**Missing dependencies:**
- `ajv`, `ajv-formats`, `date-fns` (Need `npm install`)

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (Unit) / Playwright (E2E) |
| Quick run command | `npx vitest run libs/domain/live-console` |
| Full suite command | `npx nx test frontend` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command |
|--------|----------|-----------|-------------------|
| CLK-01 | Clock persists after refresh | E2E | `npx playwright test --grep "clock persistence"` |
| EVENT-01| Undo reverts last event | Unit | `npx vitest live-game-state.service.spec.ts` |
| SUB-01 | 2-tap substitution logs SUB event | E2E | `npx playwright test --grep "2-tap sub"` |

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V5 Input Validation | Yes | AJV JSON Schema validation for all event payloads. |
| V12 Data Protection | Yes | Ensure game events are owned by the authenticated coach. |

### Known Threat Patterns for NestJS/PostgreSQL

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Insecure JSONB injection | Tampering | Use AJV to enforce strict schema (no extra properties). |
| Session hijacking | Spoofing | JWT with short expiry (already in Phase 2). |

## Sources

### Primary (HIGH confidence)
- Angular.dev - [ngComponentOutlet Documentation](https://angular.dev/api/common/NgComponentOutlet)
- NestJS Docs - [Custom Pipes & Validation](https://docs.nestjs.com/pipes)
- AJV Official - [JSON Schema Validation](https://ajv.js.org/)

### Secondary (MEDIUM confidence)
- "Stopwatch implementation patterns with Signals" - Community blog posts.
- "Undo/Redo with Event Sourcing in Angular" - Community patterns.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Verified registry versions.
- Architecture: HIGH - Built on core Angular 21 patterns.
- Pitfalls: MEDIUM - Based on common browser timing behaviors.

**Research date:** 2026-05-20
**Valid until:** 2026-06-20
