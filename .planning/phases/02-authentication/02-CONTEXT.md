# Phase 2: Authentication - Context

**Gathered:** 2026-04-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver the full coach authentication flow: sign up with email/password/display name, log in, maintain a persistent session across browser refreshes, log out, and reset password via email link.

This phase covers both the NestJS backend (auth endpoints, JWT issuance, password hashing, password reset token management) and the Angular frontend (auth forms, route guards, token storage, HTTP interceptor for silent refresh).

No team or roster UI in this phase. After a successful login, the coach lands on a dashboard/home placeholder — navigation to teams starts in Phase 3.

</domain>

<decisions>
## Implementation Decisions

### JWT Storage & Session
- **D-01:** JWT stored in **localStorage**. Simpler, works seamlessly in Capacitor/PWA. XSS risk is acceptable given Angular's built-in sanitization and the single-coach personal use context.
- **D-02:** **30-day sliding window expiry.** The JWT has a 30-day TTL. An HTTP interceptor silently refreshes the token on each request (or at app boot) to reset the 30-day clock as long as the coach is actively using the app.
- **D-03:** When the session expires (coach hasn't used app in 30+ days), the guard clears localStorage and **redirects to `/login`** with a brief message: "Your session expired, please log in again." No inline modal — full redirect.

### Signup Flow
- **D-04:** Signup collects **email, password, and display name** — all three up front. `UserEntity` already has a `displayName` column; collecting it at signup avoids an incomplete-profile state.
- **D-05:** **No email confirmation.** Account is active immediately after signup. Matches personal-tool UX; no verification gate.

### Auth Page Design
- **D-06:** Auth pages use a **full-screen centered card layout**: dark background, centered card with the Apex Team name/logo at top, form fields and CTA below. "Athletic Professional" dark mode theme from Phase 1 applies.
- **D-07:** Login and signup are **separate routes** (`/login`, `/signup`), not a single toggle. Each page has a link to the other at the bottom.
- **D-08:** Form validation errors use **`ngx-reactive-forms-utils`** (npm package, developer-maintained). Errors display inline under each field using the library's built-in pattern. Do NOT hand-roll error display logic.

### Password Reset
- **D-09:** Reset flow: coach clicks "Forgot password" → enters email → receives link → clicks link → lands on a `/reset-password?token=...` page in the app → enters new password → submits → redirected to `/login`.
- **D-10:** Password reset tokens expire after **1 hour**.
- **D-11:** **Email sending is stubbed.** The `PasswordResetService` generates and stores the token, logs the reset URL to the console (or returns it in a dev-only response field), but does NOT send a real email. Real email integration is deferred. The stub must be clearly marked for future replacement (e.g., a `// TODO: replace with email provider` comment and an injectable `EmailService` interface).

### Claude's Discretion
- Password hashing: bcrypt with a standard work factor (10-12 rounds). Standard NestJS convention.
- NestJS `@nestjs/jwt` + `@nestjs/passport` for JWT strategy — standard approach.
- Route guard: Angular `CanActivate` guard that reads the JWT from localStorage and checks expiry. If token missing or expired, redirects to `/login`.
- After successful login or signup, redirect to `/teams` (Phase 3 route) — use a placeholder if that route doesn't exist yet.
- Auth module structure: `apps/api/src/auth/` with `AuthController`, `AuthService`, `JwtStrategy`. Separate `PasswordResetService` for the reset flow.
- Angular auth state: a `Signal<Coach | null>` in an `AuthService` (injectable), reads from localStorage on init. Not a full store — signals are sufficient.
- Passwords: minimum 8 characters enforced on both client (ngx-reactive-forms-utils validator) and server (class-validator).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Spec
- `trd.md` — Full stack and library architecture. Section 3 (Library Architecture: `libs/domain/type/name`) defines where auth libs live.

### Planning Artifacts
- `.planning/ROADMAP.md` §Phase 2 — Success criteria (4 items) define the acceptance bar.
- `.planning/REQUIREMENTS.md` — AUTH-01, AUTH-02, AUTH-03, AUTH-04 are the requirements this phase satisfies.
- `.planning/PROJECT.md` — Constraints section (Angular Signals, inject() pattern, no manual .subscribe(), Tailwind + Ionic, "Athletic Professional" design).

### Prior Phase Artifacts
- `.planning/phases/01-workspace-data-foundation/01-CONTEXT.md` — D-07 (dark mode class strategy), D-08 (ThemeService), D-09 (Tailwind darkMode: 'class'), D-10 (synchronize: false, migrations only), D-11 (entity location conventions).
- `.planning/phases/01-workspace-data-foundation/01-PATTERNS.md` — Existing Angular patterns (standalone components, external templates, protected members, Vitest).

### Libraries
- `ngx-reactive-forms-utils` (npm) — Developer-managed Angular reactive forms utility library. Use for inline form error display. Look up current API from npm before implementing.

### Existing Code
- `apps/api/src/entities/user.entity.ts` — Existing UserEntity (has `id`, `email`, `displayName`, `createdAt` — needs `passwordHash` column added).
- `apps/frontend/src/app/app.routes.ts` — Currently empty. Auth routes (`/login`, `/signup`, `/reset-password`) added here.
- `apps/frontend/src/app/app.config.ts` — Where `provideHttpClient(withInterceptors([...]))` and auth guard providers go.

</canonical_refs>

<specifics>
## Specific Ideas

- **Stubbed email service:** The reset URL should be visible in the NestJS console log during development so the dev can manually test the reset flow without a real email provider. Something like: `[PasswordResetService] Reset URL: http://localhost:4200/reset-password?token=<token>`.
- **ngx-reactive-forms-utils:** The developer maintains this library. It handles inline error display for Angular reactive forms. Research its current npm API before building auth forms.
- **Sliding session:** The interceptor should check token age on each outbound HTTP request and call `/auth/refresh` if the token is within N days of expiry (e.g., refresh if < 7 days remain of the 30). This avoids a refresh on every request.

</specifics>

<deferred>
## Deferred Ideas

- **Real email provider** — Nodemailer/Resend/SendGrid integration deferred. Phase 2 stubs the email with console logging. Mark the `EmailService` injection point clearly for future implementation.
- **OAuth/social login** — Explicitly out of scope per REQUIREMENTS.md. Email/password only for v1.
- **Multi-device logout / token revocation** — Currently tokens are stateless JWTs. A token blacklist or revocation endpoint is a v2 concern.
- **Rate limiting on auth endpoints** — Good security practice but deferred. The API is a personal tool; aggressive brute-force protection is low priority for v1.

</deferred>

---

*Phase: 02-authentication*
*Context gathered: 2026-04-15*
