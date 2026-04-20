---
phase: 06-live-game-console
plan: 01
subsystem: live-game-console
tags: [backend, events, validation]
requires: [LIVE-06, LIVE-07, LIVE-08, INFR-03]
provides: [event-logging-backend]
affects: [GamesController, GamesService, SportEntity]
tech-stack: [NestJS, TypeORM, AJV]
key-files:
  - apps/api/src/games/games.controller.ts
  - apps/api/src/games/games.service.ts
  - apps/api/src/entities/sport.entity.ts
  - apps/api/src/migrations/1776510000000-AddEventDefinitionsToSport.ts
decisions:
  - Use AJV for runtime validation of sport-specific JSON payloads to ensure schema adherence.
  - Store event definitions on the Sport entity to allow for sport-agnostic event logging.
metrics:
  duration: 15m
  completed_date: "2026-04-18T00:30:00Z"
---

# Phase 06 Plan 01: Live Game Console Backend Foundation Summary

## Objective
Update the backend foundation to support sport-specific event logging and dynamic schema-driven validation.

## One-liner
Implemented the `POST /api/games/:gameId/events` endpoint with schema-based validation for sport-specific events (goals, assists, cards, subs).

## Key Changes

### Backend
- **GamesController**: Added `logEvent` method to handle `POST /api/games/:gameId/events`.
- **GamesService**: Implemented `logEvent` logic, including ownership verification and payload validation using AJV against sport-specific schemas.
- **SportEntity**: Added `event_definitions` JSONB field to store supported event types and their validation schemas.
- **Migrations**: Added a migration to update the `sports` table and seed the "Soccer" sport with standard event definitions (GOAL, ASSIST, SUB, CARD).
- **DTOs**: Created `CreateEventDto` for incoming event data.

### Dependencies
- Added `ajv`, `ajv-formats`, and `date-fns` to `package.json`.

## Deviations from Plan
None - plan executed exactly as written.

## Verification Results

### Automated Tests
- Ran `npx nx test api --testFile=apps/api/src/games/games.service.spec.ts`: **PASSED** (13 tests)
- Ran `npx nx test api`: **PASSED** (28 tests)

### Success Criteria Check
- [x] Database schema includes `event_definitions` on `sports`.
- [x] Soccer sport has valid event definitions.
- [x] API endpoint `/api/games/:id/events` successfully persists events.

## Self-Check: PASSED
- [x] Created files exist and are correctly implemented.
- [x] Commits made for all changes.
- [x] All tests passing.
