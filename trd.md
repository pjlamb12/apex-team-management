# Technical Requirements Document: Apex Team

## 1. Project Vision

**Apex Team** is a high-performance team management ecosystem designed for the modern coach. It bridges the gap between tactical on-field tools (automated rotations, practice pacing) and administrative logistics (scheduling, parent communication, and iCal syncing).

---

## 2. Technical Stack

- **Monorepo:** Nx Workspace (Domain-driven structure: `libs/domain/type/name`).
- **Frontend:** Modern Angular (Signals, RxJS, `inject()` pattern) + Ionic/Capacitor (PWA/Mobile focus).
- **Styling:** Tailwind CSS (Primary) with Ionic CSS variables for theme consistency.
- **Backend:** NestJS + Passport.js (JWT Strategy).
- **Database:** PostgreSQL.
- **Communication:** Socket.io (for real-time coaching sync and future chat).
- **Infrastructure:** `runtime-config-loader` (runtime envs), `ngx-circuit` (Feature Flags).
- **Testing:** Jest (Unit), Playwright (E2E).

---

## 3. Library Architecture (`libs/domain/type/name`)

### `libs/shared`

- **`shared/util/models`**: Global TypeScript interfaces (Player, User, Team, SportConfig, GameEvent).
- **`shared/util/logic-rotation`**: Pure logic engine for shift-based equal playtime rotations.
- **`shared/util/analytics`**: Aggregation logic for drill frequency and performance trends.

### `libs/api` (NestJS)

- **`api/feature/auth`**: Passport implementation and "Claim Token" logic for parent onboarding.
- **`api/feature/drill-library`**: Global drill CRUD, tagging, and YouTube/FB metadata scraping.
- **`api/feature/calendar-sync`**: iCal (.ics) generation service for Google/Apple Calendar.
- **`api/data-access/teams`**: Repository/Service layer for Team, Player, and Roster management.

### `libs/client` (Angular/Ionic)

- **`client/feature/dashboard`**: High-level "Team Pulse" and upcoming schedule overview.
- **`client/feature/game-console`**: The "Live Mode" interface (Clocks, Scores, Subs, Positions).
- **`client/feature/practice-planner`**: Drag-and-drop sequencing with the drill pacer timer.
- **`client/ui/theme`**: Tailwind configuration, Dark Mode toggle, and "Athletic-Professional" CSS.

---

## 4. Feature Set by Version

### v1: The Coaching Foundation

- **Roster Entry:** "Quick Add" players with name, jersey #, and primary contact email (used as a placeholder for v2 linking).
- **Shift-Based Rotation Engine:** \* Manual sub-intervals (e.g., every 8 mins).
  - Automated "Equal Playing Time" generator based on players present.
  - Manual override for injuries/teaching moments.
- **Game Day "Live Mode":** \* Dual Clocks: Arrival time vs. Start time.
  - Event Logging: Single-tap scoring (Goal, Assist) with timestamps.
  - Flexible Positions: Game-specific assignments with mid-game "Swap" capability.
- **Enhanced Drill Library:** \* Fields: Name, Description, Source URL, and **Multi-Step Instructions** (Array of objects).
  - Tagging: Many-to-many (#Defense, #U10, #Dribbling).
  - Performance: 1-5 star "Team Rating" per drill per practice.

### v2: The Parent & Sync Layer

- **Parent "Adoption":** Claim-token workflow. Parents register and "claim" the placeholder player profile created by the coach in v1.
- **Guardian Identity:** Support for multiple guardians (e.g., Mom and Dad) per player.
- **iCal Syncing:** Personalized schedule feeds for external calendars including uniform colors and arrival buffers.
- **Coach Sync:** Real-time WebSocket updates between Head and Assistant coach devices.

### v3: Full Management Ecosystem

- **Messaging:** Threaded Team Chat.
- **Media Hub:** Shared photo/video uploads for events.
- **Analytics Pro:** Long-term reports on player position distribution and development trends.

---

## 5. Design & UI/UX

- **Aesthetic:** "Athletic Professional"—clean, dashboard-style, high-contrast.
- **Dark Mode:** Signal-based theme toggle utilizing Tailwind `dark:` classes.
- **Mojo-Inspired Scheduling:** Visual timeline with color-coded borders for Event Types.
- **Haptics:** Ionic/Capacitor haptic feedback for timer transitions.

---

## 6. Engineering Standards

- **State Management:** Signals for UI-bound state; Observables for data streams.
- **Declarative Components:** Use `toSignal` and `async` pipe. No manual `.subscribe()` in TypeScript files (except for side-effect post actions).
- **Styling:** Tailwind for layout/spacing; Ionic for Shadow DOM components.

---

## 7. Database Schema (Postgres)

- **`sports`**: `id, name, positions (JSONB), default_players_on_field, period_type, is_enabled`
- **`users`**: `id, email, password_hash, role (COACH, PARENT)`
- **`players`**: `id, first_name, last_name, birth_date, invite_email, claim_token`
- **`guardianships`**: `user_id, player_id, relationship_type, status (PENDING, ACTIVE)`
- **`drills`**: `id, title, description, source_url, instructions (JSONB), avg_rating, is_public`
- **`events`**: `id, team_id, type (GAME, PRACTICE), start_time, arrival_time, opponent, uniform_color, location, recurrence_rule`
- **`game_events`**: `id, game_id, player_id, event_type (GOAL, ASSIST), timestamp`
- **`practice_performance`**: `id, practice_id, drill_id, team_rating, notes`
