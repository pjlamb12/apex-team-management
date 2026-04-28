# Phase 18 Validation: Rotation Engine & Playtime

This document defines the success criteria and verification plan for Phase 18.

## Must-Have Truths (UAT)

| ID | Truth | Verification Method |
|----|-------|---------------------|
| ROTN-V-01 | Each player has an accurate count of total seconds played in the UI. | Start clock, observe seconds incrementing on player cards. |
| ROTN-V-02 | Playtime stops accumulating when the clock is paused. | Pause clock, observe seconds stop incrementing. |
| ROTN-V-03 | Playtime is preserved across page refreshes. | Start clock, let time pass, refresh page, observe time is maintained. |
| ROTN-V-04 | Goalkeeper (slot 0) is never suggested for rotation out. | Set interval, wait for trigger, check sub-queue, GK should not be there. |
| ROTN-V-05 | Rotation interval triggers a haptic alert and auto-stages subs. | Set interval to 1 min, wait 60s, confirm haptic (if device) and staged subs. |
| ROTN-V-06 | PURE, POSITION, and CONSTRAINT modes generate valid suggestions. | Toggle modes, confirm suggestions follow mode-specific logic. |

## Required Artifacts

| Path | Purpose | Verification |
|------|---------|--------------|
| `libs/client/feature/game-console/src/lib/rotation-engine/playtime.service.ts` | Playtime accumulation logic | File exists, `npx nx test client-feature-game-console` passes. |
| `libs/client/feature/game-console/src/lib/rotation-engine/rotation.service.ts` | Rotation suggestion algorithm | File exists, `npx nx test client-feature-game-console` passes. |
| `libs/client/feature/game-console/src/lib/live-game-state.service.ts` | Configuration state management | `RotationConfig` interface present and initialized. |

## Critical Wiring (Key Links)

- **PlaytimeService -> LiveClockService**: Real-time updates depend on the clock signal.
- **RotationService -> PlaytimeService**: Suggestions depend on accurate playtime data.
- **ConsoleWrapper -> RotationService**: Automatic triggers happen in the console wrapper.
- **ConsoleWrapper -> Haptics**: Alerts are physically triggered on the device.

## Automated Verification

```bash
# Run all unit tests for the game console feature
npx nx test client-feature-game-console
```

## Manual Verification Flow

1. **Setup:** Go to an active game in the Live Console.
2. **Configure:** Open Rotation Settings, set interval to 2 minutes, mode to PURE.
3. **Run:** Start the game clock.
4. **Observe:**
   - Watch playtime counters on players; confirm they match real time.
   - Wait for the 2-minute mark.
   - Confirm haptic/visual alert occurs.
   - Confirm the Sub-Queue is automatically populated with suggestions.
5. **Verify Modes:** Change mode to POSITION. Confirm suggestions now respect position slots.
6. **Verify Persistence:** Refresh the page. Confirm playtime counters and rotation settings remain.
