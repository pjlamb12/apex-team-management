# Phase 19: Tactical Polish & Alerts - Research

**Researched:** 2026-05-12
**Domain:** UI/UX Interactions & Rotation Engine Logic
**Confidence:** HIGH

## Summary

Phase 19 focuses on bridging the gap between the automated Rotation Engine and the coach's manual control. The primary challenge is delivering high-priority alerts without obstructing the dense information display of the game console (scoreboard, clock, and pitch). 

The research confirms that an **Inline Toolbar Banner** approach is superior to standard overlay toasts for this specific use case, as it maintains layout integrity while providing persistent, non-obstructive action points. The "peek" logic is elegantly handled by leveraging the existing Sub-Queue as the refinement area, transforming the engine's output from "automatic application" to "suggested staging."

**Primary recommendation:** Use a conditional `ion-toolbar` within the `ion-header` for the rotation alert banner to ensure it pushes content down rather than obscuring the clock or scoreboard.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **No Drag-and-Drop**: Tap-tap is confirmed as more accurate and sufficient for high-speed game environments.
- **Rotation Alert UI**: A top-of-screen banner/toast hybrid with Apply/Dismiss buttons.
- **Persistence**: Alert remains visible until the coach clicks either button.
- **Engine Conflict Resolution**: Manual Staging > Auto-Suggestions. If manual subs are staged, skip auto-staging suggestions but "act like it happened" on the timeline.
- **Layout**: No changes to the current console wrapper layout or Sub-Queue fixed panel.

### the agent's Discretion
- Implementation details for the non-obstructive banner (recommending `ion-toolbar`).
- "Peek" logic implementation (recommending "Apply to Queue" pattern).

### Deferred Ideas (OUT OF SCOPE)
- Drag-and-drop implementation.
- Expandable bottom sheets or tray layouts.
- Lineup "Preview" overlays.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ROTN-04 | Coach receives visual/audible alerts when rotation interval is reached | Investigated `ion-toolbar` banner and Capacitor Haptics integration [CITED: ionic-docs]. |
| ROTN-05 | Coach can load engine suggestions directly into the Sub-Queue | Defined the "Apply/Dismiss" workflow and "Apply then Refine" pattern using `RotationService.generateSuggestions()`. |
| SUBS-03 | High-performance manual position swaps via tap-tap | Existing logic is sound; polish focused on minimal latency via Signal-based state. |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Rotation Alerts | Browser / Client | — | Triggered by local clock, interacts with local state. |
| Suggestion Generation | Browser / Client | — | Engine logic runs on client data. |
| Suggestion Staging | Browser / Client | — | Updates `LiveGameStateService` local state. |
| Interval Skipping | Browser / Client | — | Guard logic within the interval effect in `ConsoleWrapper`. |
| State Persistence | Browser / Client | Local Storage | `lastIntervalTriggered` must survive refresh per INFR-03. |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @ionic/angular | ^8.8.4 | UI Components | Provides `ion-toolbar` and `ion-toast` with `positionAnchor` [VERIFIED: npm registry]. |
| @capacitor/haptics | ^8.0.2 | Physical Alerts | Established pattern for game-critical events [VERIFIED: npm registry]. |
| Angular Signals | 21.x | State Management | Minimizes latency in high-performance UI (SUBS-03). |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|--------------|
| @ionic/angular/standalone | ^8.8.4 | Component Imports | Use for `IonToolbar`, `IonButton`, `IonLabel`. |

**Installation:**
```bash
# All packages already present in project
npm install
```

## Architecture Patterns

### Pattern 1: Inline Header Banner
Instead of an overlaying toast that blocks the "Pause/Start" buttons, use a secondary `ion-toolbar` in the `ion-header`.

**What:** An extra `ion-toolbar` conditionally rendered inside `<ion-header>`.
**Why:**
- **Visibility:** High-contrast background in the header is impossible to miss.
- **Non-Obstructive:** It pushes the `ion-content` down rather than covering it, keeping the clock and pitch visible [CITED: ionic-docs/toolbar].
- **Persistence:** Remains in the DOM until the condition is cleared.

### Pattern 2: Discrete Interval Gate
To maintain the timeline even when alerts are skipped or dismissed, use a "catch-up" gate pattern.

**Example:**
```typescript
// Pattern: Discrete Interval Gate
effect(() => {
  const elapsed = clock.elapsedMs();
  const interval = config.intervalMinutes * 60000;
  const currentInterval = Math.floor(elapsed / interval);

  if (currentInterval > state.lastIntervalTriggered()) {
    // 1. Mark as triggered immediately to act like it happened
    state.setLastIntervalTriggered(currentInterval);
    
    // 2. Conditional alert logic
    if (state.stagedSubs().length > 0) return; // Skip if manual subs present
    
    showBanner();
  }
});
```

### Anti-Patterns to Avoid
- **Overlaying critical controls:** Never use a toast that blocks the game clock or "Pause" button during active play.
- **Manual timing management:** Avoid using `setInterval` for game logic; always derive from `LiveClockService.elapsedMs()`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Banner Overlay | Custom `absolute` div | `ion-toolbar` in `ion-header` | Handles safe areas and layout shifting automatically. |
| Suggestion "Peek" | Custom Modal | Sub-Queue Staging | The Sub-Queue is already designed for "refining" subs before application. |
| Interval Logic | `setInterval` | `LiveClockService.elapsedMs()` | Service handles pauses and period resets correctly. |

## Common Pitfalls

### Pitfall 1: Content Occlusion
**What goes wrong:** A `top` position toast covers the Scoreboard or the Clock bar, preventing the coach from seeing the score while deciding on a rotation.
**How to avoid:** Use the Inline Toolbar Banner pattern to push content down rather than overlaying.

### Pitfall 2: Refresh State Reset
**What goes wrong:** `lastIntervalTriggered` is kept in component memory. Refreshing causes the alert to re-fire if the clock is past the interval.
**How to avoid:** Move `lastIntervalTriggered` to `LiveGameStateService` which is persisted to local storage [VERIFIED: codebase grep].

### Pitfall 3: Stale Suggestions
**What goes wrong:** Suggestions are generated when the alert fires, but field state changes before "Apply" is clicked (e.g., a goal or injury).
**How to avoid:** Call `RotationService.generateSuggestions()` inside the "Apply" button handler to use the freshest state.

## Code Examples

### Non-Obstructive Banner Template
```html
<!-- libs/client/feature/game-console/src/lib/console-wrapper/console-wrapper.html -->
<ion-header>
  <ion-toolbar>
    <ion-title>Scoreboard...</ion-title>
  </ion-toolbar>
  
  <ion-toolbar color="warning" *ngIf="rotationAlertVisible()">
    <div class="flex items-center justify-between px-4 py-1">
      <span class="text-sm font-bold">Rotation Interval Reached</span>
      <div class="flex gap-2">
        <ion-button size="small" fill="solid" (click)="handleApplySuggestions()">
          Apply
        </ion-button>
        <ion-button size="small" fill="clear" (click)="handleDismissAlert()">
          Dismiss
        </ion-button>
      </div>
    </div>
  </ion-toolbar>
</ion-header>
```

### Apply/Dismiss Logic
```typescript
// libs/client/feature/game-console/src/lib/console-wrapper/console-wrapper.ts
protected handleApplySuggestions() {
  const config = this.stateService.rotationConfig();
  const suggestions = this.rotationService.generateSuggestions(config);
  
  suggestions.forEach(s => {
    this.stateService.stageSub(s.inPlayerId, s.outPlayerId);
  });
  
  this.rotationAlertVisible.set(false);
}
```

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `lastIntervalTriggered` resetting on refresh is undesirable. | Pitfalls | Coach gets duplicate alerts after a browser crash. |
| A2 | `ion-toolbar` in header is acceptable "Banner/Toast hybrid" UI. | Patterns | User might expect a floating toast (addressed by adding color/haptics). |

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| @ionic/angular | UI Framework | ✓ | 8.8.4 | — |
| @capacitor/haptics | Alert Feel | ✓ | 8.0.2 | No physical alert |
| Nx | Build/Test | ✓ | 22.6.5 | — |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest + Playwright |
| Config file | `vitest.workspace.ts` |
| Quick run command | `nx test client-feature-game-console` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ROTN-04 | Banner appears at interval | integration | `nx test client-feature-game-console` | ✅ ConsoleWrapper spec |
| ROTN-05 | Suggestions stage on Apply | integration | `nx test client-feature-game-console` | ❌ Wave 0 |
| ROTN-05 | Skip if manual subs staged | unit | `nx test client-feature-game-console` | ❌ Wave 0 |

### Wave 0 Gaps
- [ ] `console-wrapper.spec.ts` update to test interval skip logic.
- [ ] `live-game-state.service.spec.ts` update to verify `lastIntervalTriggered` persistence.

## Security Domain

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V5 Input Validation | yes | Validate that suggested player IDs belong to the current roster. |

### Known Threat Patterns
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| UI Interference | Denial of Service | Ensure alert cannot be triggered repeatedly in a loop by corrupt clock state. |

## Sources

### Primary (HIGH confidence)
- `/ionic-team/ionic-docs` - `ion-toolbar` behavior and standalone usage.
- `libs/client/feature/game-console/src/lib/live-game-state.service.ts` - Local state structure.
- `libs/client/feature/game-console/src/lib/rotation-engine/rotation.service.ts` - Purity of suggestion engine.

## Metadata
**Confidence breakdown:**
- Standard stack: HIGH
- Architecture: HIGH
- Pitfalls: HIGH
**Research date:** 2026-05-12
**Valid until:** 2026-06-12
