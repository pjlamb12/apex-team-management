# Requirements: Apex Team

**Defined:** 2026-04-14
**Core Value:** A coach shows up to a game and can instantly see who's on the field, swap players, and track what happened — no paper lineups, no mental math.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Authentication

- [ ] **AUTH-01**: Coach can create account with email and password
- [ ] **AUTH-02**: Coach can log in and stay logged in across sessions
- [ ] **AUTH-03**: Coach can log out from any page
- [ ] **AUTH-04**: Coach can reset password via email link

### Teams

- [ ] **TEAM-01**: Coach can create a new team with a name
- [ ] **TEAM-02**: Coach can select a sport when creating a team (soccer for v1)
- [ ] **TEAM-03**: Sport selection configures positions and field size automatically
- [ ] **TEAM-04**: Coach can view and edit team details
- [ ] **TEAM-05**: Coach can delete a team

### Roster

- [ ] **ROST-01**: Coach can add a player with name, jersey number, and contact email
- [ ] **ROST-02**: Coach can edit player details
- [ ] **ROST-03**: Coach can remove a player from the roster
- [ ] **ROST-04**: Coach can view the full roster at a glance

### Games

- [/] **GAME-01**: Coach can create a new game with opponent, location, date/time, and uniform color
- [/] **GAME-02**: Coach can view list of past and upcoming games
- [/] **GAME-03**: Coach can edit game details before kickoff
- [/] **GAME-04**: Coach can delete a game

### Live Console

- [/] **LIVE-01**: Coach can set a starting lineup by assigning players to positions
- [/] **LIVE-02**: Coach can see who's on the field and who's on the bench at a glance
- [ ] **LIVE-03**: Coach can swap players in/out during a live game
- [ ] **LIVE-04**: Coach can view substitution history for the current game
- [ ] **LIVE-05**: Coach can undo the last substitution
- [ ] **LIVE-06**: Coach can log a goal with the scoring player and timestamp
- [ ] **LIVE-07**: Coach can log an assist with the assisting player and timestamp
- [ ] **LIVE-08**: Coach can view game event log (goals, assists, substitutions)

### Infrastructure

- [ ] **INFR-01**: App is mobile-first responsive (works well on phone browsers)
- [ ] **INFR-02**: App uses "Athletic Professional" design with dark mode support
- [ ] **INFR-03**: Game console state persists locally (survives accidental page refresh)
- [ ] **INFR-04**: App is an installable PWA with service worker and manifest
- [ ] **INFR-05**: App builds for Android via Capacitor
- [ ] **INFR-06**: App builds for iOS via Capacitor

## v1.1 Requirements

Deferred to next minor release. Not in current roadmap.

### Practice Planning

- **PRAC-01**: Coach can create a practice session with date, time, and location
- **PRAC-02**: Coach can add drills to a practice with sequencing and time allocation
- **PRAC-03**: Coach can use a pacer timer during practice

### Drill Library

- **DRIL-01**: Coach can create drills with name, description, source URL, and multi-step instructions
- **DRIL-02**: Coach can tag drills (e.g., #Defense, #U10, #Dribbling)
- **DRIL-03**: Coach can rate drills per practice (1-5 star team rating)
- **DRIL-04**: Coach can browse and search the drill library

## v1.3 Requirements

### Rotation Engine

- **ROTN-01**: Coach can set a sub-interval (e.g., every 8 minutes) for auto-rotation prompts
- **ROTN-02**: App generates equal-playing-time rotations based on players present
- **ROTN-03**: Coach can override auto-generated rotations

## v2 Requirements

Deferred to second major version.

### Parent & Sync Layer

- **PRNT-01**: Parent can register and claim a player profile via claim token
- **PRNT-02**: Multiple guardians per player supported
- **SYNC-01**: Coach can invite assistant coaches to share team management
- **SYNC-02**: Real-time WebSocket sync between coach devices during games
- **ICAL-01**: Personalized iCal feeds for external calendars
- **SCHD-01**: Game scheduling with calendar view and recurring events

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Messaging / team chat | v3 feature — core coaching tool first |
| Media hub (photos/videos) | v3 feature — storage/bandwidth costs |
| Analytics dashboards | v3 feature — need data before analysis |
| Payment/fee collection | Different product category, compliance complexity |
| League/tournament management | Different product category |
| Video replay / analysis | Storage-heavy, different UX paradigm |
| GPS/fitness tracking | Requires wearable integration |
| AI lineup suggestions | Need historical data first |
| Custom sport designer UI | Over-engineering risk; add sports via config |
| OAuth/social login | Email/password sufficient for v1 |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 2 | Pending |
| AUTH-02 | Phase 2 | Pending |
| AUTH-03 | Phase 2 | Pending |
| AUTH-04 | Phase 2 | Pending |
| TEAM-01 | Phase 3 | Pending |
| TEAM-02 | Phase 3 | Pending |
| TEAM-03 | Phase 1 | Pending |
| TEAM-04 | Phase 3 | Pending |
| TEAM-05 | Phase 3 | Pending |
| ROST-01 | Phase 4 | Pending |
| ROST-02 | Phase 4 | Pending |
| ROST-03 | Phase 4 | Pending |
| ROST-04 | Phase 4 | Pending |
| GAME-01 | Phase 5 | In Progress |
| GAME-02 | Phase 5 | In Progress |
| GAME-03 | Phase 5 | In Progress |
| GAME-04 | Phase 5 | In Progress |
| LIVE-01 | Phase 5 | In Progress |
| LIVE-02 | Phase 5 | In Progress |
| LIVE-03 | Phase 6 | Pending |
| LIVE-04 | Phase 6 | Pending |
| LIVE-05 | Phase 6 | Pending |
| LIVE-06 | Phase 6 | Pending |
| LIVE-07 | Phase 6 | Pending |
| LIVE-08 | Phase 6 | Pending |
| INFR-01 | Phase 1 | Pending |
| INFR-02 | Phase 1 | Pending |
| INFR-03 | Phase 6 | Pending |
| INFR-04 | Phase 7 | Pending |
| INFR-05 | Phase 7 | Pending |
| INFR-06 | Phase 7 | Pending |

**Coverage:**
- v1 requirements: 31 total
- Mapped to phases: 31
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-14*
*Last updated: 2026-04-14 after initial definition*
