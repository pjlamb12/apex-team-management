# Phase 5: Games & Lineup - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-17
**Phase:** 05-games-lineup
**Areas discussed:** Season handling, Games navigation, Lineup storage model, Lineup assignment UX

---

## Season Handling

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-create default season | Backend creates a season on first game if none active | ✓ |
| Quick season step first | Prompt coach to name a season before first game | |
| Games directly on teams | Bypass season, add teamId FK to games | |

**User's choice:** Auto-create default season

| Option | Description | Selected |
|--------|-------------|----------|
| Named by year, backend auto-creates | "2026 Season", created by API | ✓ |
| Named "Default Season", backend auto-creates | Simpler placeholder name | |
| Frontend detects and creates | Angular checks/creates season on Games tab load | |

**User's choice:** Named by year (e.g., "2026 Season") — backend auto-creates

---

## Games Navigation

| Option | Description | Selected |
|--------|-------------|----------|
| Games tab in bottom nav | Top-level tab, per Phase 3's original plan | |
| Games inside Team Dashboard | Sub-section of Team Dashboard, consistent with Roster | ✓ |
| Games in Team Dashboard via tab strip | IonSegment within Team Dashboard | |

**User's choice:** Games inside Team Dashboard

| Option | Description | Selected |
|--------|-------------|----------|
| IonSegment tab strip | [Roster] [Games] segment within Team Dashboard | ✓ |
| Two separate buttons/cards | Tappable cards navigating to sub-routes | |
| Scrollable sections | Both on same page, scrollable | |

**User's choice:** IonSegment tab strip

---

## Lineup Storage Model

| Option | Description | Selected |
|--------|-------------|----------|
| Separate LineupEntry rows | lineup_entries table: game_id + player_id + position_name + status | ✓ |
| JSONB column on GameEntity | lineupConfig JSONB blob on game record | |
| GameEvent-based | Lineup as events, replayed for current state | |

**User's choice:** Separate LineupEntry rows

| Option | Description | Selected |
|--------|-------------|----------|
| Both on-field and bench rows stored | All players get a row; bench has positionName=null | ✓ |
| Only on-field players stored | Bench = roster minus lineup_entries | |

**User's choice:** Both on-field and bench rows stored

---

## Lineup Assignment UX

| Option | Description | Selected |
|--------|-------------|----------|
| Position list + player picker | N slots, each row has position picker + player picker | ✓ |
| Tap slot → pick from list | Tap empty slot, player sheet slides up | |
| Visual field diagram | Top-down field with drag-and-drop zones | |

**User's choice:** Position list + player picker

**Notes:** User noted that some games have different position counts (4 DEF + 1 FWD vs default distribution). This led to an additional question about per-slot flexibility.

| Option | Description | Selected |
|--------|-------------|----------|
| Per-slot position assignment | Each slot has independent position AND player pickers | ✓ |
| Formation first, then assign players | Two-step: set formation counts, then assign | |
| Default from sport config, manually adjust | Start with defaults, add/remove slots | |

**User's choice:** Per-slot position assignment (each slot fully independent)

| Option | Description | Selected |
|--------|-------------|----------|
| Default 11 slots (hardcoded), editable | 11 slots for Phase 5; dynamic count deferred | ✓ |
| Read from Season.playersOnField | Use season entity field, fall back to default | |
| Coach sets slot count on game creation form | Number input on New Game form | |

**User's choice:** Default 11 slots (soccer standard), editable later

---

## Claude's Discretion

- Game creation form: full-page route (not a modal) — more fields than player creation
- Game list ordering: upcoming first, past below, with divider
- NestJS module: `apps/api/src/games/`
- Post-creation navigation: go directly to lineup editor after game is created

## Deferred Ideas

- Season management UI — named seasons, season switching, archiving
- Dynamic player count per game (7v7 vs 11v11) — hardcoded 11 for Phase 5
- Top-level Games tab in bottom nav — superseded by Team Dashboard IonSegment
- Game status transitions UI — Phase 6 concern
