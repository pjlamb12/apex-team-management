# Phase 12: Season-Integrated Games & Analytics - Context

**Gathered:** 2026-04-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Automate game-season association (already done), add a season picker to the Schedule tab, track game outcomes via score fields, and surface aggregate season stats on the season detail screen.

Requirements: GAME-06, GAME-07, GAME-08

</domain>

<decisions>
## Implementation Decisions

### GAME-07: Auto-association (Already Implemented)
- **D-01:** `EventsService.create()` already finds the active season and sets `seasonId` on every new event. GAME-07 is complete — no action needed.
- **D-02:** The fallback behavior (auto-create a `"YYYY Season"` if none exists) is acceptable. Do not change it to an error.

### GAME-06: Season Filter on Schedule
- **D-03:** Add a season picker (compact `ion-select` dropdown) above the Upcoming/Past segment on the Schedule tab. Defaults to the active season.
- **D-04:** All seasons for the team should be listed in the picker so coaches can browse past seasons without leaving the Schedule tab.
- **D-05:** The picker should pre-select the active season on load. When a non-active season is selected, the schedule shows events for that season.

### Game Outcome Tracking (for GAME-08 stats)
- **D-06:** Add `goalsFor` (integer, nullable) and `goalsAgainst` (integer, nullable) columns to `EventEntity`. These only apply to `type = 'game'` records.
- **D-07:** Win/loss/draw is derived from `goalsFor` vs `goalsAgainst` — no separate `result` field needed.
- **D-08:** When a game transitions to `status = 'completed'`, pre-populate `goalsFor` from the count of logged GOAL `GameEventEntity` records for that game. Coach confirms and can adjust. `goalsAgainst` must be entered manually (no automated source).
- **D-09:** Both `goalsFor` and `goalsAgainst` are also editable from the Edit Event screen after the fact.

### GAME-08: Season Stats Dashboard
- **D-10:** Aggregate stats (wins, losses, draws, goals for, goals against) are displayed on a per-season detail screen, accessible by tapping a season from the Seasons list.
- **D-11:** Stats are computed server-side — a dedicated endpoint (e.g., `GET /teams/:teamId/seasons/:seasonId/stats`) returns the aggregate totals.
- **D-12:** A game counts as a win if `goalsFor > goalsAgainst`, loss if `goalsFor < goalsAgainst`, draw if equal. Games with null scores are excluded from win/loss/draw counts but can still be listed.
- **D-13:** Stats shown: Wins, Losses, Draws, Goals For, Goals Against, Goal Difference.

### Claude's Discretion
- Exact UI layout of the stats section on the season detail screen (cards, list, etc.)
- Loading/empty states for stats when no completed games exist

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Data Model
- `apps/api/src/entities/event.entity.ts` — Current EventEntity; needs goalsFor/goalsAgainst columns added
- `apps/api/src/entities/game-event.entity.ts` — GameEventEntity; GOAL events used to pre-populate goalsFor
- `apps/api/src/entities/season.entity.ts` — SeasonEntity; stats endpoint queries events by seasonId

### Backend Services
- `apps/api/src/events/events.service.ts` — EventsService; create() already sets seasonId; findAllForTeam() filters by active season (needs season picker support)
- `apps/api/src/teams/seasons.service.ts` — SeasonsService; stats endpoint should live here or in EventsService

### Frontend
- `apps/frontend/src/app/teams/events/schedule/schedule.ts` — Schedule component; needs season picker added
- `apps/frontend/src/app/teams/events/events.service.ts` — Frontend EventsService; getEvents() needs season filter param
- `apps/frontend/src/app/teams/seasons/seasons-list/seasons-list.html` — Seasons list; tapping a season leads to detail screen
- `apps/frontend/src/app/teams/events/edit-event/edit-event.ts` — Edit Event form; needs goalsFor/goalsAgainst fields

### Requirements
- `apps/api/src/entities/event.entity.ts` — Migration needed for new columns
- `.planning/REQUIREMENTS.md` — GAME-06, GAME-07, GAME-08 definitions

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `EventsService.findAllForTeam()` — already filters by active season via `seasonId`; needs to accept an optional `seasonId` param to support the season picker
- `SeasonsService.findAllForTeam()` — returns all seasons for a team; used to populate the season picker
- `ion-select` — Ionic component already used in the app; appropriate for the season picker dropdown
- Edit Event form — already handles all event fields; extend with goalsFor/goalsAgainst

### Established Patterns
- NestJS backend uses TypeORM with Repository pattern; new stats endpoint follows same pattern
- Angular frontend uses Signals + `firstValueFrom()` for async data; schedule component already does this
- Season active-flag pattern: only one season is active at a time; picker should visually indicate which is active

### Integration Points
- `GET /teams/:teamId/seasons` — already exists; used to populate picker
- `GET /teams/:teamId/events?scope=upcoming` — needs `seasonId` query param added
- New: `GET /teams/:teamId/seasons/:seasonId/stats` — aggregate stats endpoint to create
- `EventEntity` migration — TypeORM migration file needed for `goals_for` / `goals_against` columns

</code_context>

<specifics>
## Specific Ideas

- Score confirmation flow: when game status transitions to `completed`, show a score confirmation UI pre-filled with GOAL event count for goalsFor, empty for goalsAgainst. Coach confirms before saving.
- Season picker on Schedule: `ion-select` with season name labels; active season shown with a visual indicator (e.g., "(Active)" suffix or distinct styling).
- Stats layout on season detail: compact stat cards or a summary row showing W / L / D / GF / GA / GD.

</specifics>

<deferred>
## Deferred Ideas

- Season comparison view (compare stats across two seasons) — future phase
- Per-player stats aggregation (goals, assists per player per season) — deferred to v1.2 analytics
- Game scheduling calendar view (SCHD-01) — deferred to v1.3

</deferred>

---

*Phase: 12-season-integrated-games-analytics*
*Context gathered: 2026-04-20*
