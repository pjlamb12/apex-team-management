# Phase 11 Context: Practice Management & Unified Schedule

**Status:** Decided
**Last Updated:** 2026-04-20

## 1. Goal
Integrate practice sessions into the team workflow and provide a single "Schedule" view for all team events (Games and Practices), using a unified data structure.

## 2. Implementation Decisions

### 2.1 Unified Data Model (Database)
- **Table Rename:** The `games` table will be renamed to `events`.
- **New Entity:** `EventEntity` replaces `GameEntity`.
- **Type Field:** Add `type` column (`'game' | 'practice'`) to distinguish records.
- **Practice-Specific Fields:**
  - `durationMinutes`: (integer, nullable) Default 60/90 for practices.
  - `notes`: (text, nullable) For practice plans or general reminders.
- **Game-Specific Fields:** (remain but nullable for practices)
  - `opponent`, `uniformColor`, `isHomeGame`, `status`.
- **Foreign Keys:** Update `LineupEntry` and `GameEvent` to point to `eventId` (was `gameId`).

### 2.2 Backend Service Refactor
- **EventsService:** Replaces `GamesService`.
- **CRUD Operations:** Supports both games and practices by setting the `type` field.
- **Schedule Filtering:**
  - `GET /teams/:id/events?scope=upcoming`: Returns events where `scheduledAt` >= `now`, sorted ASC.
  - `GET /teams/:id/events?scope=past`: Returns events where `scheduledAt` < `now`, sorted DESC.
  - `GET /teams/:id/events?type=game|practice`: Optional filtering by type.
- **Active Season Inheritance:**
  - Creating a **Practice**: Inherit `location` from `season.defaultPracticeLocation`.
  - Creating a **Game**: Inherit `location` and `uniformColor` from `season` defaults (Phase 12 logic start, but we can do it now).

### 2.3 Frontend Refactor
- **EventsService:** Frontend service for all event types.
- **Unified Schedule View:**
  - Replaces "Games" tab on Team Dashboard with "Schedule".
  - Shows "Upcoming" by default with a toggle/button to view "Past".
  - Chronological list merging both types.
- **Item Identification:**
  - Games: Show "vs Opponent", color dot, and link to Lineup/Console.
  - Practices: Show "Practice", duration, and link to Practice Detail/Edit (no live console).
  - Use distinct icons: `calendar-outline` (Game) vs `fitness-outline` (Practice).

### 2.4 UI/UX Details
- **New Practice Modal:** Similar to Game creation but with fields for duration and notes.
- **Inheritance:** Pre-fill location from active season default when opening the "New Practice" form.
- **Filter Toggle:** Simple toggle on the Schedule list: [Upcoming | Past].

## 3. Technical Patterns
- **Database Migration:** Create a migration to rename `games` -> `events`, add columns, and update constraints.
- **Entity Update:** Use `@Entity('events')` and rename class to `EventEntity`.
- **Path Aliases:** Continue using relative imports for now, but ensure `EventsService` is exported properly.

## 4. Requirement Mapping
- **PRAC-01:** Practice creation via `EventEntity` with `type='practice'`.
- **PRAC-02:** Edit/Delete practices via `EventsService`.
- **SCHD-02:** Unified Schedule tab in `TeamDashboard` using merged `events` list.
- **SEAS-07:** Auto-populate practice location from `season.defaultPracticeLocation`.
