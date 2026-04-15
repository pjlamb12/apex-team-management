# Integrations

## Overview

No external integrations exist yet. The codebase is a freshly scaffolded Nx+Angular workspace with no backend, database, or third-party service connections.

## External APIs

None configured.

## Databases

None configured. The TRD specifies PostgreSQL as the target database.

## Authentication Providers

None configured. The TRD specifies Passport.js with JWT strategy.

## Real-Time Communication

None configured. The TRD specifies Socket.io for real-time coaching sync.

## Third-Party Libraries (Planned, Not Yet Integrated)

| Integration             | TRD Reference                     | Status        |
|-------------------------|-----------------------------------|---------------|
| PostgreSQL              | Database layer                    | Not started   |
| Passport.js (JWT)       | Authentication                    | Not started   |
| Socket.io               | Real-time sync                    | Not started   |
| Ionic/Capacitor         | PWA/Mobile                        | Not started   |
| Tailwind CSS            | Styling                           | Not started   |
| `runtime-config-loader` | Runtime environment config        | Not started   |
| `ngx-circuit`           | Feature flags                     | Not started   |
| iCal (.ics generation)  | Calendar sync (v2)                | Not started   |

## CDN / Asset Hosting

None configured. Static assets are served from `apps/frontend/public/`.

## Environment Configuration

No environment files (`.env`, `environment.ts`) exist yet. The TRD references `runtime-config-loader` for runtime environment variable management.

## Webhooks / Event Systems

None configured.
