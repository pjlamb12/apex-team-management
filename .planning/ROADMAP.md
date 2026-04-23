# Roadmap: Apex Team v1.2

**Created:** 2026-04-21
**Milestone:** v1.2 — Practice Planning & Drill Library
**Phases:** 3
**Requirements:** 6

## Phase Overview

- [x] **Phase 14: Drill Library Foundation** - Coaches can create, tag, and browse a library of drills with instructions and media links.
- [x] **Phase 15: Practice Drills Integration** - Add drills to practice sessions with sequencing and time allocation.
- [ ] **Phase 16: Practice Execution (Pacer)** - Use a pacer timer during practice to keep the team on schedule with the planned drills.

## Phase Details

### Phase 14: Drill Library Foundation
**Goal**: Build the repository of team knowledge by allowing coaches to document their favorite drills.
**Requirements**: DRIL-01, DRIL-02, DRIL-04
**Plans**: 4 plans
- [x] 14-01-PLAN.md — Backend Foundation (Entities, Service, Controller)
- [x] 14-02-PLAN.md — Client Infrastructure & Tagging UI (Data-Access, TagInput)
- [x] 14-03-PLAN.md — Drill Library Browser (Search, Filtering, Integration)
- [x] 14-04-PLAN.md — Drill Details & Editor (Steps, Media, CRUD)
**Success Criteria**:
  1. Coach can create a drill with name, description, and multi-step instructions.
  2. Coach can add tags to drills and filter the library by these tags.
  3. Coach can browse the library in a dedicated "Drills" tab.

### Phase 15: Practice Drills Integration
**Goal**: Transform a practice session from a simple event into a structured plan.
**Requirements**: PRAC-03, DRIL-03
**Plans**: 5 plans
- [x] 15-01-PLAN.md — Data Model & DTOs
- [x] 15-02-PLAN.md — Service Logic & Tests
- [x] 15-03-PLAN.md — Controller & Module Integration
- [x] 15-04-PLAN.md — Client Data Access & Library Setup
- [x] 15-05-PLAN.md — Practice Console UI & Plan Management
**Success Criteria**:
  1. Coach can select drills from the library and add them to a specific practice session.
  2. Coach can reorder drills within a practice.
  3. Coach can assign a duration (minutes) to each drill in the plan.

### Phase 16: Practice Execution (Pacer)
**Goal**: Assist the coach during the live session to ensure all drills are covered within the allotted time.
**Requirements**: PRAC-04
**Success Criteria**:
  1. "Start Practice" mode showing the current drill and a countdown timer.
  2. Audio or haptic alerts when a drill duration is complete.
  3. "Next Drill" button to advance the plan.

## Progress Table

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 14. Drill Library Foundation | 4/4 | Completed | 2026-04-21 |
| 15. Practice Drills Integration | 5/5 | Completed | 2026-04-23 |
| 16. Practice Execution (Pacer) | 0/0 | Planned | - |

---

## Roadmap Archives

- [v1.1 — Season Management & Schedule](.planning/archive/v1.1/ROADMAP.md)
- [v1.0 — MVP Core](.planning/archive/v1.0/ROADMAP.md)
