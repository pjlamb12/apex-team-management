---
phase: 17-tactical-sub-queue
plan: 02
subsystem: game-console
tags: [ui, components, angular-signals]
dependency_graph:
  requires: [17-01]
  provides: [SubQueueComponent]
  affects: [SoccerPitchView, BenchView]
tech_stack: [Angular Signals, Tailwind CSS, Ionic]
key_files:
  - libs/client/feature/game-console/src/lib/sub-queue/sub-queue.ts
  - libs/client/feature/game-console/src/lib/soccer-pitch-view/soccer-pitch-view.ts
  - libs/client/feature/game-console/src/lib/bench-view/bench-view.ts
decisions:
  - SoccerPitchView uses slot lookup from activePlayers to position staged-in players.
  - SubQueueComponent uses a horizontal scrollable list for multiple pending subs.
metrics:
  duration: 20m
  completed_date: "2026-05-10"
---

# Phase 17 Plan 02: UI Components Summary

## Substantive Summary
Implemented the visual layer for the tactical sub-queue. This includes dynamic staging indicators on the pitch (showing who is coming in and where), bench highlights for pending players, and a persistent sub-queue footer component for managing staged substitutions.

## Key Changes
- **SoccerPitchView**:
    - Added `stagedSubs` and `initialLineup` inputs.
    - Added `stagedInPlayers` computed signal that overlays incoming players on the pitch using the slot index of the player they are replacing.
    - Added `stagedOutIds` to apply grayscale/reduced opacity to outgoing players.
- **BenchView**:
    - Added `stagedInIds` input to highlight players already selected to enter.
- **SubQueueComponent**:
    - New component that displays pending sub pairs with metadata lookup.
    - Provides "Apply", "Clear", and "Remove" actions.
    - Styled as a modern, high-contrast footer panel.

## Deviations from Plan
None - plan executed exactly as written.

## Self-Check: PASSED
- [x] Pitch view renders incoming players at correct slots.
- [x] Bench view highlights staged-in players.
- [x] SubQueue component displays human-readable pairs.
- [x] All new files created and committed.
