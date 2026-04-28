# Phase 20: Team Join Codes & Assistant Onboarding - Research

**Researched:** 2026-04-27
**Domain:** Team Collaboration / RBAC
**Confidence:** HIGH

## Summary

This phase transitions the application from a single-user "silo" model to a collaborative multi-coach model. The core mechanism is a 6-character alphanumeric `joinCode` that coaches can share with assistants. Assistants enter this code on their dashboard to gain access to the team's roster, games, and practices.

**Primary recommendation:** Implement a `TeamMemberEntity` to manage many-to-many relationships between users and teams, and add a `joinCode` column to the `TeamEntity` with a unique index.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Membership Management | API / Backend | Database | Persists roles and relationships. |
| Join Code Generation | API / Backend | — | Logic should reside on server to ensure uniqueness/security. |
| Access Control (RBAC) | API / Backend | — | Enforces that only Head Coaches can delete or regenerate codes. |
| Join Flow UI | Browser / Client | — | Captures user input and displays status. |
| UI Visibility (conditional) | Browser / Client | — | Hides deletion/settings based on user role. |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `nanoid` | ^5.0.0 | Code generation | Industry standard for secure, compact IDs. [VERIFIED: npm registry] |
| `typeorm` | ~0.3.0 | Database ORM | Existing project standard. [VERIFIED: codebase] |

**Installation:**
```bash
npm install nanoid
```

## Architecture Patterns

### Recommended Project Structure
```
libs/shared/util/models/src/lib/
└── team-member.model.ts # Role enum and member interface

apps/api/src/entities/
└── team-member.entity.ts # Database entity
```

### Pattern 1: Membership Role-Based Access
Instead of checking `team.coachId`, the system will now check `teamMember.role`.
**What:** Define roles `HEAD_COACH` and `ASSISTANT`.
**When to use:** On every sensitive endpoint (Delete, Regenerate Code).

### Anti-Patterns to Avoid
- **Hardcoded Strings:** Use an `enum` for roles to avoid typos.
- **Client-side Authorization:** Never trust the UI to hide buttons as security; the API must verify the role.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| ID Generation | Random string loops | `nanoid` or `crypto.randomBytes` | Collision resistance and bias prevention. |
| Multi-tenancy | Custom filtering logic | TypeORM QueryBuilder with join | Centralize membership checks in a reusable method/guard. |

## Runtime State Inventory

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | `TeamEntity.coach_id` | Data migration to `team_members` table. |
| Live service config | None | N/A |
| OS-registered state | None | N/A |
| Secrets/env vars | None | N/A |
| Build artifacts | None | N/A |

## Common Pitfalls

### Pitfall 1: Join Code Collision
**What goes wrong:** Two teams get the same 6-character code.
**Why it happens:** Birthday paradox; 6 alphanumeric characters (base-36) has ~2.1 billion combinations, but collisions happen sooner than expected.
**How to avoid:** Use a `unique` constraint in DB and a retry loop in the service if a collision occurs on save.

### Pitfall 2: Orphaning Teams
**What goes wrong:** Head Coach leaves a team, leaving no one with management rights.
**How to avoid:** For v1, prevent the last `HEAD_COACH` from leaving or being demoted.

## Code Examples

### Join Code Generation (NestJS Service)
```typescript
// Source: [ASSUMED] - Standard nanoid usage
import { customAlphabet } from 'nanoid';

const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // Avoid 0, 1, O, I, L
const generateCode = customAlphabet(alphabet, 6);

// Inside TeamsService
async regenerateJoinCode(teamId: string): Promise<string> {
  const code = generateCode();
  await this.teamRepo.update(teamId, { joinCode: code });
  return code;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `coach_id` on Team | `TeamMember` mapping | Phase 20 | Supports multi-coach teams. |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Existing `coachId` is only used for one coach per team. | Runtime State | Migration logic might miss edge cases if multiple users share an ID somehow. |

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| PostgreSQL | Data layer | ✓ | 15.4 | — |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest |
| Config file | `vitest.workspace.ts` |
| Quick run command | `npx vitest apps/api/src/teams` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-JOIN-01 | Assistant joins with valid code | Integration | `npx vitest ...` | ❌ Wave 0 |
| REQ-RBAC-01 | Assistant cannot delete team | Unit | `npx vitest ...` | ❌ Wave 0 |

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V4 Access Control | yes | Verify user has `HEAD_COACH` role for management actions. |
| V5 Input Validation | yes | Sanitize and validate 6-char code input (uppercase, length). |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Code Guessing | Spoofing | Rate limiting on `/teams/join` endpoint. |

## Sources

### Primary (HIGH confidence)
- `apps/api/src/entities/team.entity.ts` - Checked existing schema.
- `apps/api/src/teams/teams.service.ts` - Checked existing service logic.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH
- Architecture: HIGH
- Pitfalls: MEDIUM

**Research date:** 2026-04-27
**Valid until:** 2026-05-27
