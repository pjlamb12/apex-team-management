---
phase: 06-live-game-console
plan: "07"
subsystem: backend-event-validation
tags: [events, ajv, migration, payload-mapping, soccer]
dependency_graph:
  requires: ["06-01", "06-02", "06-03", "06-04", "06-05", "06-06"]
  provides: ["correct-event-payload-routing", "ajv-bypass-fix", "card-event-types"]
  affects: ["games.service.ts", "migration-soccer-events", "console-wrapper"]
tech_stack:
  added: []
  patterns: ["AJV payload validation with schema presence guard", "event-type-based payload field mapping"]
key_files:
  created: []
  modified:
    - apps/api/src/migrations/1776510000000-AddEventDefinitionsToSport.ts
    - apps/api/src/games/games.service.ts
    - libs/client/feature/game-console/src/lib/console-wrapper/console-wrapper.ts
decisions:
  - "YELLOW_CARD and RED_CARD added as separate event types (not variants of CARD) so type name encodes color; no color field needed in payload"
  - "AJV validates against empty object when payload absent, ensuring required fields always enforced"
  - "SUB positionName falls back to 'Unknown' rather than blocking the event if active player lookup fails"
metrics:
  duration: "~10 minutes"
  completed: "2026-04-19"
  tasks_completed: 3
  tasks_total: 3
  files_modified: 3
---

# Phase 06 Plan 07: Backend Sync Mismatch Fixes Summary

Fix three backend sync mismatches — YELLOW_CARD/RED_CARD event types registered in Soccer migration, AJV bypass closed by validating against empty object when payload absent, and GOAL/ASSIST/SUB payload fields remapped in ConsoleWrapper to match backend schema field names.

## Tasks Completed

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Add YELLOW_CARD and RED_CARD to Soccer migration | cb4860c | apps/api/src/migrations/1776510000000-AddEventDefinitionsToSport.ts |
| 2 | Fix AJV validation bypass in games.service.ts | c274407 | apps/api/src/games/games.service.ts |
| 3 | Fix payload field mapping in ConsoleWrapper | 53498dc | libs/client/feature/game-console/src/lib/console-wrapper/console-wrapper.ts |

## What Was Built

**Task 1 — YELLOW_CARD and RED_CARD event types:**
Added two new event definition objects to the `soccerEvents` array in the migration. Each carries a `payloadSchema` requiring `playerId` (UUID format). The existing `CARD` type was preserved unchanged. Soccer now accepts 6 event types: GOAL, ASSIST, SUB, CARD, YELLOW_CARD, RED_CARD.

**Task 2 — AJV validation bypass fix:**
Changed the guard from `if (definition.payloadSchema && dto.payload)` to `if (definition.payloadSchema)`. When `dto.payload` is undefined or null, AJV now validates against `{}` (empty object), which correctly triggers required-field failures. Previously, omitting `dto.payload` entirely bypassed schema validation, allowing malformed events to be stored.

**Task 3 — ConsoleWrapper payload field mapping:**
`handleAction` now maps event type to the correct field name: GOAL uses `scorerId`, ASSIST uses `assistorId`, all others (YELLOW_CARD, RED_CARD, CARD) use `playerId`. The SUB event push in `handlePlayerSelection` now looks up the outgoing player's `preferredPosition` from `activePlayers()` and includes it as `positionName` in the event payload, matching the backend's `required: ['inPlayerId', 'outPlayerId', 'positionName']` schema.

## Verification Results

- `grep 'YELLOW_CARD' migration` — match found
- `grep 'RED_CARD' migration` — match found
- `grep 'if (definition.payloadSchema)' games.service.ts` — 1 match (old `&& dto.payload` guard removed)
- `grep 'payloadToValidate = dto.payload' games.service.ts` — 1 match
- `grep 'scorerId|assistorId|positionName' console-wrapper.ts` — 4 matches
- `npx tsc --noEmit -p apps/api/tsconfig.app.json` — exit 0
- `npx tsc --noEmit -p libs/client/feature/game-console/tsconfig.lib.json` — exit 0

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all payload field changes are wired to real runtime data.

## Threat Surface Scan

No new network endpoints or auth paths introduced. Changes are:
1. Migration adds rows to an existing JSONB column in the sports table — no new surface.
2. AJV guard change tightens existing validation — reduces attack surface (T-06-07-01 mitigated).
3. Client payload field renaming is a correctness fix — no new surface.

## Self-Check: PASSED

- cb4860c exists: confirmed in git log
- c274407 exists: confirmed in git log
- 53498dc exists: confirmed in git log
- apps/api/src/migrations/1776510000000-AddEventDefinitionsToSport.ts: file exists with YELLOW_CARD and RED_CARD
- apps/api/src/games/games.service.ts: file exists with `if (definition.payloadSchema)` guard
- libs/client/feature/game-console/src/lib/console-wrapper/console-wrapper.ts: file exists with scorerId/assistorId/positionName mappings
