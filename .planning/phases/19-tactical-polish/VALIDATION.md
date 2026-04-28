# Phase 19 Validation: Tactical Polish & Alerts

## Phase Goal
Refine tactical interactions and implement high-visibility rotation alerts while maintaining interaction accuracy.

## Requirements Checklist
- [ ] **ROTN-04**: Rotation alerts via banner + haptics at interval hit.
- [ ] **ROTN-05**: Apply/Dismiss workflow for engine suggestions.
- [ ] **SUBS-03**: High-performance "tap-tap" interaction feel.
- [ ] **Logic**: Skip alert if manual subs staged, update timeline regardless.
- [ ] **Persistence**: `lastIntervalTriggered` survives page refreshes.

## Automated Tests

### Unit Tests
| Component | Test Case | File |
|-----------|-----------|------|
| `LiveGameStateService` | `lastIntervalTriggered` persistence | `live-game-state.service.spec.ts` |
| `RotationService` | Suggestion generation accuracy | `rotation.service.spec.ts` |

### Integration Tests
| Component | Test Case | File |
|-----------|-----------|------|
| `ConsoleWrapper` | Alert banner appears at interval | `console-wrapper.spec.ts` |
| `ConsoleWrapper` | Alert skipped when manual subs staged | `console-wrapper.spec.ts` |
| `ConsoleWrapper` | Apply button stages suggestions | `console-wrapper.spec.ts` |

## Manual Verification
1. **Interval Hit**: Start game, set interval to 1 min. Wait for 1:00. Confirm banner appears and phone vibrates (if physical device).
2. **Conflict Resolution**: Stage a manual sub at 0:45. Wait for 1:00. Confirm banner does NOT appear.
3. **Persistence**: Wait for banner at 1:00. Refresh page. Confirm banner still appears.
4. **Action**: Click "Apply". Confirm suggestions appear in Sub-Queue. Confirm banner disappears.
5. **High Speed**: Rapidly swap 3 pairs of players. Confirm zero UI lag.

## Success Verdict: PENDING
