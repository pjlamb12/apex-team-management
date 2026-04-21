# Phase 12: Season-Integrated Games & Analytics - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-20
**Phase:** 12-season-integrated-games-analytics
**Areas discussed:** Game outcome tracking, Stats dashboard location, Season filter on Schedule, GAME-07 confirmation

---

## Game Outcome Tracking

| Option | Description | Selected |
|--------|-------------|----------|
| Score fields | Add goalsFor and goalsAgainst integer columns to EventEntity | ✓ |
| Result + goals-against only | Add result field + goalsAgainst; goals-for derived from events | |
| Derive everything from events | No new DB columns; accept incomplete stats | |

**User's choice:** Score fields — add `goalsFor` and `goalsAgainst` to `EventEntity`

**Score entry:**

| Option | Description | Selected |
|--------|-------------|----------|
| Edit event form | Add score fields to Edit Event screen | ✓ |
| End-of-game prompt | Prompt when game is marked completed | ✓ |
| You decide | Leave to Claude | |

**User's choice:** Both — pre-populate goalsFor from GOAL events when game completes, coach confirms; also editable from Edit Event form.

**Notes:** User specifically wants the end-of-game score confirmation to pre-populate goalsFor from the logged GOAL events so the coach just needs to enter goalsAgainst and confirm.

---

## Stats Dashboard Location

| Option | Description | Selected |
|--------|-------------|----------|
| Season detail screen | Stats on per-season screen, tap from Seasons list | ✓ |
| Inline on Seasons list | Compact stats summary on each season row | |
| New Stats tab on Team Dashboard | Third segment tab on main dashboard | |

**User's choice:** Season detail screen

---

## Season Filter on Schedule

| Option | Description | Selected |
|--------|-------------|----------|
| Active season only | No picker; change active season via Settings | |
| Season picker on Schedule | Dropdown above the schedule list | ✓ |
| You decide | Leave to Claude | |

**User's choice:** Season picker on Schedule

**Picker style:**

| Option | Description | Selected |
|--------|-------------|----------|
| Dropdown / select | Compact ion-select above Upcoming/Past segment | ✓ |
| Horizontal chips/pills | Scrollable season chips | |
| You decide | Leave to Claude | |

**User's choice:** Dropdown / select (ion-select)

---

## GAME-07 Confirmation

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, mark it done | Auto-creating fallback season is acceptable | ✓ |
| No — require active season | Reject event creation if no active season | |

**User's choice:** Mark GAME-07 as done — no changes needed to existing behavior.

---

## Claude's Discretion

- Exact stats UI layout on season detail screen
- Loading/empty states when no completed games exist

## Deferred Ideas

- Season comparison view — future phase
- Per-player stats aggregation — v1.2
- Calendar scheduling view — v1.3
