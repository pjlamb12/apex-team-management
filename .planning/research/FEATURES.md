# Features Research: Youth Sports Team Management

## Overview

Analysis of features in youth sports team management applications. Categorized by table stakes (users expect these), differentiators, and anti-features.

## Table Stakes (Must Have or Users Leave)

### Authentication & Account Management
- Coach signup/login with email/password
- Password reset flow
- Session persistence across browser refresh
- Secure JWT-based API authentication

### Team & Roster Management
- Create a team with sport selection
- Add/edit/remove players from roster
- Player basic info: name, jersey number, contact
- View full roster at a glance

### Game Day Basics
- Create a game event (opponent, location, date/time)
- Set a starting lineup before the game
- Assign players to positions
- View who's on the field vs. bench
- Make substitutions during gameplay

### Multi-Sport Support (Architecture)
- Configurable positions per sport
- Configurable number of players on field
- Sport-specific terminology (periods, quarters, halves, sets)

## Differentiators (Competitive Advantage)

### Real-Time Game Console
- **Live substitution tracking** with visual field/court representation
- **One-tap event logging** (goals, assists, fouls) with timestamps
- **Substitution history** — see all subs made during game with timestamps
- **Playing time tracking** — automatic calculation of minutes per player
- **Position heat map** — which positions each player has played (future)

### Smart Lineup Management
- **Bench visibility** — always see who's waiting to play
- **Player status indicators** — on field, bench, injured, absent
- **Quick swap UI** — tap two players to swap positions instantly
- **Visual field/court layout** — see lineup spatially, not just as a list

### Coaching Intelligence (v1.1+)
- **Practice planner** with drill sequencing and pacing timers
- **Drill library** with ratings and tags
- **Equal time calculator** — automated rotation for fair playing time

### Team Communication (v2+)
- Parent onboarding via claim tokens
- Personalized iCal feeds with arrival buffers
- Multi-coach real-time sync
- Team messaging

## Anti-Features (Things to Deliberately NOT Build in v1)

| Anti-Feature | Reason |
|-------------|--------|
| Social media integration | Distracts from core coaching tool |
| Player statistics aggregation dashboards | Premature optimization — log events first, analyze later |
| Payment/fee collection | Complex compliance domain, not core value |
| League management / tournament brackets | Different product category entirely |
| Video replay / analysis | Storage-heavy, different UX paradigm |
| GPS/fitness tracking | Requires wearable integration, out of scope |
| AI-generated lineup suggestions | Need data first; manual coaching preferred |

## Feature Dependencies

```
Auth ──→ Teams ──→ Roster ──→ Games ──→ Live Console
                                           │
                                    ┌──────┼──────┐
                                    │      │      │
                               Lineups  Subs   Events
                              (positions) (swap) (goals)
```

**Critical path:** Auth → Teams → Roster → Games → Live Console

Each feature depends on the previous. No feature can be built in isolation.

## Complexity Assessment

| Feature | Complexity | Notes |
|---------|-----------|-------|
| Auth (signup/login/JWT) | Medium | Standard NestJS Passport pattern |
| Team CRUD | Low | Basic entity with sport FK |
| Roster management | Low | Player CRUD with team FK |
| Game creation | Low | Event entity with optional fields |
| Starting lineup | Medium | Position assignment UI, sport-specific positions |
| Live substitutions | High | Real-time state tracking, visual UI, undo capability |
| Event logging | Low-Medium | Tap-to-log with timestamp, player FK |
| Multi-sport config | Medium | JSONB positions, configurable field sizes |

---
*Researched: 2026-04-14*
