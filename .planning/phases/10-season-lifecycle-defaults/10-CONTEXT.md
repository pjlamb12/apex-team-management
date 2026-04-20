# Phase 10 Context: Season Lifecycle & Defaults

**Status:** Decided
**Last Updated:** 2026-04-20

## 1. Goal
Establish explicit season management for teams, allowing coaches to create, edit, and archive seasons while maintaining default settings for venues and jersey colors.

## 2. Implementation Decisions

### 2.1 Active Season Policy (Exactly Zero or One)
- **Automatic Deactivation:** If a season is updated to `isActive = true`, the system MUST automatically set `isActive = false` for all other seasons belonging to the same team.
- **Manual Deactivation:** Coaches can manually set a season to `isActive = false` to represent a "between seasons" state.
- **Scope:** This logic resides in the `SeasonsService` using a transaction to ensure atomicity.

### 2.2 Deletion Policy (Safety First)
- **Restricted Hard Delete:** Hard deletion of a season is BLOCKED if any games or events are associated with it.
- **UX Flow:** If games exist, the UI should inform the user they must either delete the games first or simply deactivate/archive the season.
- **Archiving:** `isActive = false` will serve as the primary "Archived" indicator for v1.1.

### 2.3 UI Entry Point
- **Location:** "Manage Seasons" lives under **Team Settings** (`/teams/:id/settings/seasons`).
- **Team Dashboard:** Stays focused on the **Active Season** context (Schedule/Roster).
- **Navigation:** Team Dashboard Settings Gear -> Seasons List -> Create/Edit Season.

### 2.4 Practice Defaults
- **Field:** `defaultPracticeLocation` (string, nullable).
- **Functionality:** This field auto-populates the `location` input when creating a new practice (Phase 11).
- **Backend:** Add `default_practice_location` to `seasons` table.

## 3. Technical Patterns
- **Backend Entities:** Update `SeasonEntity` to include `defaultPracticeLocation`.
- **Backend DTOs:** Update `CreateSeasonDto` and `UpdateSeasonDto`.
- **Frontend Models:** Update `Season` interface in `libs/shared/util/models`.
- **Frontend Components:** 
    - Create `SeasonsList` component.
    - Create `SeasonDetail` component (Create/Edit).

## 4. Requirement Mapping
- **SEAS-03:** Explicit creation via `SeasonsList` -> `SeasonDetail`.
- **SEAS-04:** Editing via `SeasonDetail`.
- **SEAS-05:** Active toggle in `SeasonDetail` with auto-deactivation logic.
- **SEAS-06:** Delete button in `SeasonsList` with dependency check.
- **SEAS-07:** New field `defaultPracticeLocation`.
