# Phase 3: Teams & Sport Configuration - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-16
**Phase:** 03-teams-sport-configuration
**Areas discussed:** Teams list layout, Sport selector behavior, Team format overrides, App navigation shell

---

## Teams list layout

| Option | Description | Selected |
|--------|-------------|----------|
| /teams route, card layout | Create /teams route. Teams shown as cards with name, sport badge, action buttons. Matches Phase 2 CONTEXT target. | ✓ |
| /home becomes teams list | Repurpose existing /home route as teams list. Less restructuring but contradicts Phase 2 CONTEXT. | |

**User's choice:** /teams route, card layout

---

| Option | Description | Selected |
|--------|-------------|----------|
| Friendly prompt + CTA | Centered icon/illustration, message, prominent Create Team button for empty state. | ✓ |
| Just the Create button | Minimal empty state — just a + Create Team button. | |

**User's choice:** Friendly prompt + CTA

---

## Sport selector behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Dropdown, pre-selected soccer | Real sport dropdown loaded from sports table. Soccer pre-selected and only option in v1. Future-proof. | ✓ |
| Hidden, auto-assigned soccer | No sport field on form. Soccer silently assigned on create. | |

**User's choice:** Dropdown, pre-selected soccer

---

| Option | Description | Selected |
|--------|-------------|----------|
| Sport badge on card + label in detail | Small badge on team card, read-only "Sport: Soccer" label on detail page. | ✓ |
| Only on detail view | No sport shown on team list cards. | |

**User's choice:** Sport badge on card + label in detail

---

## Team format overrides

**User clarification (freeform):** "These settings should be determined when a coach creates a season/tournament. The same team might play in different seasons/tournaments/leagues with different rules."

This changed the entire direction of this gray area — format fields belong on SeasonEntity, not TeamEntity.

| Option | Description | Selected |
|--------|-------------|----------|
| Move to SeasonEntity now | Migration drops format columns from teams, adds to seasons. Clean model from the start. | ✓ |
| Leave on Team, also add to Season | Team keeps columns as defaults, Season can override. Adds ambiguity. | |

**User's choice:** Move to SeasonEntity now

---

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — name and sport only | Team detail/edit page shows name (editable) and sport (read-only). No format fields. | ✓ |
| Add a team color or other identity fields | Include team color/jersey color on team record. | |

**User's choice:** Yes — name and sport only

---

## App navigation shell

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — build the shell in Phase 3 | Phase 3 creates bottom tab bar shell. Teams is first tab. Future phases add their tabs. | ✓ |
| Bare routes for now | Just add /teams routes. No nav shell. Unified later. | |

**User's choice:** Yes — build the shell in Phase 3

---

| Option | Description | Selected |
|--------|-------------|----------|
| Bottom tab bar | IonTabs + IonTabBar at bottom. Standard mobile-first pattern. | ✓ |
| Side drawer / hamburger menu | IonMenu with hamburger trigger. Less thumb-friendly on mobile. | |
| Header nav only | Top header with nav links. Less native feel on mobile. | |

**User's choice:** Bottom tab bar

---

| Option | Description | Selected |
|--------|-------------|----------|
| Hidden until their phase ships | Only Teams tab visible in Phase 3. Others appear when implemented. | ✓ |
| Visible but disabled | All tabs shown, unimplemented ones greyed out. | |

**User's choice:** Hidden until their phase ships

---

## Claude's Discretion

- NestJS teams module structure — follows existing auth/ pattern
- Angular teams route structure — /teams, /teams/new, /teams/:id
- Sport dropdown loaded from GET /sports filtered by isEnabled
- Delete uses Ionic AlertController (not a separate route)
- Shell component location at apps/frontend/src/app/shell/

## Deferred Ideas

- Season management UI (where format fields now live)
- Team color/branding (useful for live console — Phase 6)
- Sport management admin UI (out of scope v1)
