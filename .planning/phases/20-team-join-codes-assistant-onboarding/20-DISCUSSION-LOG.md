# Phase 20: Team Join Codes & Assistant Onboarding - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-27
**Phase:** 20-Team Join Codes & Assistant Onboarding
**Areas discussed:** Code Lifecycle & Management, Join Flow UX, Assistant Permissions

---

## Code Lifecycle & Management

| Option | Description | Selected |
|--------|-------------|----------|
| Manual refresh | Coach explicitly generates a new code, invalidating the old one. Recommended: balances simplicity and security. | ✓ |
| Static code | One permanent code per team that never changes. | |
| Auto-expiring | Code is only valid for 24-48 hours. | |

**User's choice:** Manual refresh

## Format

| Option | Description | Selected |
|--------|-------------|----------|
| 6-character alphanumeric | e.g. A4K9X2. Recommended: simple to share and type. | ✓ |
| Word phrase | e.g. blue-tiger-kick. Easy to remember. | |
| Long UUID | e.g. a1b2c3d4... Secure but hard to type. | |

**User's choice:** 6-character alphanumeric

## Join Flow UX

| Option | Description | Selected |
|--------|-------------|----------|
| Dedicated /join route | Recommended: Allows direct link sharing (e.g. app.com/join?code=XYZ) for seamless onboarding. | |
| Dashboard modal | User signs up first, then clicks 'Join Team' to enter the code. | ✓ |
| Inline on signup | Special input field during the initial signup flow. | |

**User's choice:** Dashboard modal

## Assistant Permissions

| Option | Description | Selected |
|--------|-------------|----------|
| Full access except deletion | Assistant can do everything the head coach can do, except delete the team. Recommended for simple RBAC. | ✓ |
| Equal full access | Assistant has exact same permissions as head coach. | |
| Live game only | Can run games but cannot edit roster or team details. | |

**User's choice:** Full access except deletion

---