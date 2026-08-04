# Quick Task Plan: Fix Game Highlights Sorting

## Problem
In game summary/highlights, events from Period 1 and Period 2 are mixed together because sorting was performed strictly on `minuteOccurred` without evaluating `period` ascending first.

## Solution
1. Update `sortedGameEvents` computed signal in `game-summary.ts` to sort by `period` ascending first, then `minuteOccurred` ascending.
2. Update `goals` computed signal in `game-summary.ts` to sort by `period` ascending first, then `minuteOccurred` ascending.
3. Update `canMoveUp`, `canMoveDown`, `moveEventUp`, `moveEventDown`, and `swapEventOrder` in `game-summary.ts` to filter by both `period` and `minuteOccurred`.
4. Update `game-summary.html` to display `goal.period || goal.payload?.period || 1`.

## Plan
- Modify `game-summary.ts` with updated sort functions and event-moving logic.
- Modify `game-summary.html` for period fallback rendering.
- Run build & unit tests to verify no regressions.
