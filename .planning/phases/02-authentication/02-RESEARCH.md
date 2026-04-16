# Phase 2: Authentication - Research

**Researched:** 2026-04-15
**Domain:** NestJS JWT Auth + Angular Signal-based Auth State
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** JWT stored in **localStorage**. XSS risk acceptable for personal-use single-coach tool.
- **D-02:** **30-day sliding window expiry.** JWT has a 30-day TTL. HTTP interceptor silently refreshes the token if < 7 days remain.
- **D-03:** Expired session clears localStorage and redirects to `/login` with message "Your session expired, please log in again."
- **D-04:** Signup collects **email, password, and displayName** — all three upfront.
- **D-05:** **No email confirmation.** Account is active immediately after signup.
- **D-06:** Auth pages use **full-screen centered card layout**: dark background, centered card with Apex Team name/logo, form fields and CTA below. "Athletic Professional" dark mode theme.
- **D-07:** Login and signup are **separate routes** (`/login`, `/signup`). Each page links to the other.
- **D-08:** Form validation errors use **`ngx-reactive-forms-utils`** (npm, developer-maintained). Do NOT hand-roll error display.
- **D-09:** Reset flow: "Forgot password" → enter email → receive link → click link → `/reset-password?token=...` → enter new password → redirect to `/login`.
- **D-10:** Password reset tokens expire after **1 hour**.
- **D-11:** **Email sending is STUBBED.** `PasswordResetService` logs the reset URL to console. No real email. Mark injection point with `// TODO: replace with email provider`.

### Claude's Discretion

- Password hashing: bcrypt with 10–12 rounds.
- NestJS `@nestjs/jwt` + `@nestjs/passport` for JWT strategy.
- Route guard: Angular `CanActivateFn` reads JWT from localStorage, checks expiry; redirects to `/login` if missing/expired.
- After login or signup, redirect to `/teams` (placeholder if route doesn't exist yet).
- Auth module structure: `apps/api/src/auth/` with `AuthController`, `AuthService`, `JwtStrategy`. Separate `PasswordResetService` for reset flow.
- Angular auth state: `Signal<Coach | null>` in injectable `AuthService`, reads from localStorage on init.
- Passwords: minimum 8 characters enforced on both client (ngx-reactive-forms-utils via Angular Validators.minLength) and server (class-validator `@MinLength(8)`).

### Deferred Ideas (OUT OF SCOPE)

- Real email provider (Nodemailer/Resend/SendGrid) — Phase 2 stubs with console log.
- OAuth/social login — email/password only for v1.
- Multi-device logout / token revocation — stateless JWTs, blacklist is a v2 concern.
- Rate limiting on auth endpoints — deferred for personal tool v1.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUTH-01 | Coach can create account with email and password | NestJS signup endpoint + bcrypt hashing + TypeORM user creation + Angular signup form |
| AUTH-02 | Coach can log in and stay logged in across sessions | NestJS login endpoint + JWT issuance + Angular localStorage persistence + sliding window refresh interceptor |
| AUTH-03 | Coach can log out from any page | Angular AuthService.logout() clears localStorage + redirects, backend is stateless (no endpoint needed) |
| AUTH-04 | Coach can reset password via email link | NestJS password reset token generation + TypeORM columns + Angular reset-password form |
</phase_requirements>

---

## Summary

This phase delivers full coach authentication: signup, login, persistent JWT session, logout, and password reset. The backend is a NestJS `auth` module at `apps/api/src/auth/` that uses `@nestjs/jwt` (v11.0.2) directly — **not** `@nestjs/passport` with a Passport strategy — because the project uses NestJS 11 where the modern pattern is a plain `JwtAuthGuard` that calls `jwtService.verifyAsync()` directly, skipping the Passport abstraction. The frontend is Angular 21 with a Signal-based `AuthService` that reads/writes localStorage, a functional HTTP interceptor for token attachment and silent refresh, and a `CanActivateFn` guard for route protection.

The primary challenge in this phase is the data-flow between the frontend interceptor and the backend refresh endpoint. The interceptor must not cause infinite refresh loops (i.e., it must not attach itself to the `/auth/refresh` request), and it must handle token expiry gracefully before making the network call. The secondary challenge is keeping the `AuthService` signal state synchronized with localStorage — write to localStorage first, then update the signal.

The `ngx-reactive-forms-utils` package is at v5.1.0 (updated 2026-02-13) and supports Angular 19+. Its `ControlErrorsDisplayComponent` is a standalone component with selector `ngx-control-errors-display` that wraps form inputs and automatically displays validation error messages. It is imported directly into Angular component `imports` arrays.

**Primary recommendation:** Build a self-contained `AuthModule` in `apps/api/src/auth/`, register `JwtModule.registerAsync()` globally in `AppModule`, and use a functional Angular `CanActivateFn` guard with localStorage-based JWT expiry check. No Passport, no separate auth lib — everything lives in `apps/api/src/auth/`.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| JWT signing and verification | API / Backend | — | Secrets live server-side; verification happens in NestJS guard |
| Password hashing (bcrypt) | API / Backend | — | Never client-side; CPU-bound operation |
| Password reset token generation | API / Backend | — | Requires cryptographic randomness and server-side expiry enforcement |
| JWT storage | Browser / Client | — | localStorage per D-01 |
| Auth state (Signal<Coach\|null>) | Frontend Service | — | In-memory derived from localStorage; not persisted separately |
| Token attachment on requests | Frontend Server (interceptor) | — | Functional HTTP interceptor runs in Angular's HTTP pipeline |
| Route access control | Browser / Client | — | `CanActivateFn` reads localStorage, no server round-trip on guard |
| Silent token refresh | Frontend + API | — | Interceptor detects near-expiry and calls `/auth/refresh`; API issues new JWT |
| Form validation (client-side) | Browser / Client | — | Angular Validators + ngx-reactive-forms-utils |
| Form validation (server-side) | API / Backend | — | class-validator DTOs enforce same rules server-side |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@nestjs/jwt` | 11.0.2 | JWT signing, verification, JwtService | Official NestJS JWT package; integrates with DI |
| `bcrypt` | 6.0.0 | Password hashing | Industry standard, bcrypt-specific constant-time comparison |
| `@types/bcrypt` | 6.0.0 | TypeScript types for bcrypt | Required for TS projects |
| `class-validator` | 0.15.1 | DTO validation decorators (`@IsEmail`, `@MinLength`) | Already in NestJS ecosystem; used with ValidationPipe |
| `class-transformer` | 0.5.1 | Transform plain objects to class instances | Required by class-validator with NestJS ValidationPipe |
| `ngx-reactive-forms-utils` | 5.1.0 | Angular form error display (ControlErrorsDisplayComponent) | D-08: developer-maintained, required by CONTEXT.md |

**Version verification:** Confirmed via `npm view` on 2026-04-15.
[VERIFIED: npm registry]

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@nestjs/passport` | 11.0.5 | Passport.js DI integration | **NOT USED in Phase 2** — the modern NestJS JWT pattern uses JwtService directly |
| `passport-jwt` | 4.0.1 | Passport JWT strategy | **NOT USED** — see above |
| `crypto` (Node built-in) | built-in | `crypto.randomBytes()` for password reset tokens | No install needed; use for secure token generation |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@nestjs/jwt` direct guard | `@nestjs/passport` + `JwtStrategy` | Passport adds abstraction overhead not needed for a single-strategy app; NestJS docs now recommend the direct guard approach |
| `bcrypt` | `argon2` | argon2 is more modern but requires native bindings; bcrypt is simpler and sufficient for this scale |
| `crypto.randomBytes()` | `uuid` / nanoid | crypto is built-in; no extra dependency needed for reset tokens |

**Installation (packages not yet in project):**
```bash
npm install @nestjs/jwt bcrypt @types/bcrypt ngx-reactive-forms-utils
```

Note: `class-validator` and `class-transformer` are not in the current `package.json` — they must be installed.
```bash
npm install class-validator class-transformer
```

---

## Architecture Patterns

### System Architecture Diagram

```
FRONTEND (Angular 21)                      BACKEND (NestJS 11)
═══════════════════════════════════════    ════════════════════════════════════

  /login, /signup pages                     AppModule
  [ReactiveForm + ngx-control-errors]         └─ JwtModule (global, registerAsync)
         │                                    └─ AuthModule
         │ HTTP POST                              ├─ AuthController
         ▼                                        │   POST /auth/signup
  provideHttpClient                              │   POST /auth/login
    withInterceptors([authInterceptor])          │   POST /auth/refresh
         │                                        │   POST /auth/forgot-password
         │ Adds: Authorization: Bearer <jwt>      │   POST /auth/reset-password
         ▼                                        │
  HTTP Layer ──────────────────────────────►  JwtAuthGuard
         │                                        │   jwtService.verifyAsync(token)
         │ if token < 7 days to expiry            │
         │ calls POST /auth/refresh               │
         ▼                                    AuthService
  AuthService (injectable)                       │   signup(dto) → bcrypt.hash → save
    signal<Coach | null>                         │   login(dto) → bcrypt.compare → JWT
         │                                        │   refresh(oldJwt) → new JWT (30d)
         │ reads/writes                       PasswordResetService
         ▼                                        │   forgotPassword(email) → token (1h)
  localStorage                                    │   console.log(resetUrl) [STUB]
    'auth_token': <jwt>                          │   resetPassword(token, newPass) → hash
    'auth_user': <json>                          │
                                             UserEntity (PostgreSQL via TypeORM)
  /reset-password?token=...                       users table + password_hash column
    ResetPasswordPage                             + reset_token, reset_token_expiry columns
```

### Recommended Project Structure

**Backend (`apps/api/src/auth/`):**
```
apps/api/src/auth/
├── auth.module.ts          # Imports JwtModule, TypeOrmModule.forFeature([UserEntity])
├── auth.controller.ts      # POST /auth/signup, /login, /refresh, /forgot-password, /reset-password
├── auth.service.ts         # signup(), login(), refresh()
├── auth.guard.ts           # JwtAuthGuard implements CanActivate
├── password-reset.service.ts  # forgotPassword(), resetPassword()
├── dto/
│   ├── signup.dto.ts       # email, password, displayName
│   ├── login.dto.ts        # email, password
│   ├── refresh.dto.ts      # token
│   ├── forgot-password.dto.ts  # email
│   └── reset-password.dto.ts   # token, newPassword
└── auth.service.spec.ts    # Jest unit tests
```

**Frontend:**

The TRD (Section 3) specifies `libs/client/feature/auth` for auth feature libs. However, CONTEXT.md D-07 puts auth pages at `/login`, `/signup`, `/reset-password` in the main app router. The pattern from Phase 1 is to keep pages in `apps/frontend/src/app/` for app-level routing and use `libs/client/` for reusable services.

Recommended split:
```
apps/frontend/src/app/
├── auth/
│   ├── login/
│   │   ├── login.ts            # LoginPage component
│   │   ├── login.html
│   │   └── login.scss
│   ├── signup/
│   │   ├── signup.ts           # SignupPage component
│   │   ├── signup.html
│   │   └── signup.scss
│   └── reset-password/
│       ├── reset-password.ts   # ResetPasswordPage component
│       ├── reset-password.html
│       └── reset-password.scss

libs/client/feature/auth/src/lib/
├── auth.service.ts             # Signal<Coach|null>, login(), logout(), read localStorage
├── auth.interceptor.ts         # Functional HTTP interceptor
└── auth.guard.ts               # CanActivateFn
libs/client/feature/auth/src/index.ts
```

[ASSUMED] — The libs split above follows TRD Section 3 conventions but the exact directory structure for Phase 2 auth pages has not been confirmed by the user. Simpler alternative: put AuthService, interceptor, and guard directly in `apps/frontend/src/app/auth/` if no lib generation step is wanted.

### Pattern 1: NestJS AuthModule with JwtModule (global)

**What:** Register `JwtModule` globally in `AppModule` so `JwtService` is injectable everywhere. Keep auth-specific logic in `AuthModule`.

**When to use:** Single-app NestJS backends where JWT is used across multiple feature modules.

```typescript
// Source: https://github.com/nestjs/jwt/blob/master/README.md (VERIFIED)
// apps/api/src/app/app.module.ts — MODIFY: add JwtModule and AuthModule imports

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
        autoLoadEntities: true,
        synchronize: false,
        migrations: [__dirname + '/../migrations/**/*{.ts,.js}'],
        migrationsRun: false,
      }),
      inject: [ConfigService],
    }),
    JwtModule.registerAsync({
      global: true,   // Makes JwtService available in all modules without re-importing
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '30d' },
      }),
      inject: [ConfigService],
    }),
    AuthModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
```

### Pattern 2: NestJS AuthService (signup, login, refresh)

**What:** Service methods for each auth operation. Uses `bcrypt` for hashing, `JwtService` for token operations, `TypeORM` for user persistence.

**When to use:** Every NestJS JWT auth implementation.

```typescript
// Source: Context7 /nestjs/jwt (VERIFIED)
// apps/api/src/auth/auth.service.ts

import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserEntity } from '../entities/user.entity';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';

export interface JwtPayload {
  sub: string;   // user id
  email: string;
  displayName: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly jwtService: JwtService,
  ) {}

  async signup(dto: SignupDto): Promise<{ token: string; user: Omit<UserEntity, 'passwordHash' | 'resetToken' | 'resetTokenExpiry'> }> {
    const existing = await this.userRepo.findOne({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = this.userRepo.create({
      email: dto.email,
      displayName: dto.displayName,
      passwordHash,
    });
    const saved = await this.userRepo.save(user);

    const token = await this.signToken(saved);
    const { passwordHash: _, resetToken: __, resetTokenExpiry: ___, ...safeUser } = saved;
    return { token, user: safeUser };
  }

  async login(dto: LoginDto): Promise<{ token: string; user: Omit<UserEntity, 'passwordHash' | 'resetToken' | 'resetTokenExpiry'> }> {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const token = await this.signToken(user);
    const { passwordHash: _, resetToken: __, resetTokenExpiry: ___, ...safeUser } = user;
    return { token, user: safeUser };
  }

  async refresh(oldToken: string): Promise<{ token: string }> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(oldToken);
      const user = await this.userRepo.findOne({ where: { id: payload.sub } });
      if (!user) throw new UnauthorizedException();
      const token = await this.signToken(user);
      return { token };
    } catch {
      throw new UnauthorizedException('Cannot refresh token');
    }
  }

  private async signToken(user: UserEntity): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      displayName: user.displayName,
    };
    return this.jwtService.signAsync(payload);
    // expiresIn: '30d' is set at module registration level
  }
}
```

### Pattern 3: NestJS JwtAuthGuard (no Passport)

**What:** Inline guard that extracts Bearer token from Authorization header and verifies it with `JwtService.verifyAsync()`. Used on all protected endpoints.

**When to use:** Any NestJS 10+ project — avoids Passport dependency for single-strategy JWT.

```typescript
// Source: Context7 /nestjs/jwt (VERIFIED)
// apps/api/src/auth/auth.guard.ts

import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { JwtPayload } from './auth.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);
    if (!token) throw new UnauthorizedException('No token provided');

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      request['user'] = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private extractToken(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
```

### Pattern 4: Password Reset Token — TypeORM Columns

**What:** Two nullable columns on `UserEntity`: `resetToken` (random hex string) and `resetTokenExpiry` (timestamp). Cleared after use.

**When to use:** Stateless password reset without a separate tokens table.

```typescript
// apps/api/src/entities/user.entity.ts — MODIFY: add passwordHash + reset columns

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  displayName: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({ name: 'reset_token', nullable: true, type: 'varchar' })
  resetToken: string | null;

  @Column({ name: 'reset_token_expiry', nullable: true, type: 'timestamp' })
  resetTokenExpiry: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
```

### Pattern 5: TypeORM Migration — Add Auth Columns

**What:** A new migration file adds `password_hash`, `reset_token`, and `reset_token_expiry` columns to the existing `users` table.

**When to use:** Modifying an already-deployed table. Never use `synchronize: true`.

```typescript
// apps/api/src/migrations/TIMESTAMP-AddAuthColumns.ts

import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAuthColumnsTIMESTAMP implements MigrationInterface {
  name = 'AddAuthColumnsTIMESTAMP';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
        ADD COLUMN "password_hash" character varying NOT NULL DEFAULT '',
        ADD COLUMN "reset_token" character varying,
        ADD COLUMN "reset_token_expiry" TIMESTAMP
    `);
    // Remove DEFAULT '' constraint after adding (column can't be NOT NULL without default during ALTER)
    await queryRunner.query(`
      ALTER TABLE "users" ALTER COLUMN "password_hash" DROP DEFAULT
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
        DROP COLUMN "password_hash",
        DROP COLUMN "reset_token",
        DROP COLUMN "reset_token_expiry"
    `);
  }
}
```

**Generate with:** `nx run api:migration:generate --name=AddAuthColumns`

### Pattern 6: PasswordResetService (stubbed email)

**What:** Generates a cryptographically secure reset token, stores it with 1-hour expiry in the DB, logs the reset URL to console (stub). Separate service from `AuthService` per CONTEXT.md.

```typescript
// apps/api/src/auth/password-reset.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { UserEntity } from '../entities/user.entity';

@Injectable()
export class PasswordResetService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  async forgotPassword(email: string): Promise<void> {
    const user = await this.userRepo.findOne({ where: { email } });
    // Always return 200 — don't reveal whether email exists (timing-safe)
    if (!user) return;

    const token = randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.userRepo.update(user.id, {
      resetToken: token,
      resetTokenExpiry: expiry,
    });

    const resetUrl = `http://localhost:4200/reset-password?token=${token}`;
    // TODO: replace with email provider (EmailService injectable)
    console.log(`[PasswordResetService] Reset URL: ${resetUrl}`);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await this.userRepo.findOne({ where: { resetToken: token } });
    if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      throw new NotFoundException('Invalid or expired reset token');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.userRepo.update(user.id, {
      passwordHash,
      resetToken: null,
      resetTokenExpiry: null,
    });
  }
}
```

### Pattern 7: Angular AuthService with Signal<Coach | null>

**What:** Injectable service that reads JWT from localStorage on init, exposes `Signal<Coach | null>`, and provides `login()`, `logout()`, `getToken()` methods.

**When to use:** Angular app-level auth state — replaces NgRx store for this personal tool.

```typescript
// Source: Angular.dev signals documentation (VERIFIED)
// libs/client/feature/auth/src/lib/auth.service.ts

import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

export interface Coach {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';

  private readonly _coach = signal<Coach | null>(this.readCoachFromStorage());
  readonly coach = this._coach.asReadonly();
  readonly isAuthenticated = computed(() => this._coach() !== null);

  constructor(private readonly http: HttpClient, private readonly router: Router) {}

  async login(email: string, password: string): Promise<void> {
    const res = await firstValueFrom(
      this.http.post<{ token: string; user: Coach }>('/api/auth/login', { email, password })
    );
    this.persistSession(res.token, res.user);
  }

  async signup(email: string, password: string, displayName: string): Promise<void> {
    const res = await firstValueFrom(
      this.http.post<{ token: string; user: Coach }>('/api/auth/signup', { email, password, displayName })
    );
    this.persistSession(res.token, res.user);
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this._coach.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  updateToken(newToken: string): void {
    localStorage.setItem(this.TOKEN_KEY, newToken);
  }

  private persistSession(token: string, user: Coach): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this._coach.set(user);
  }

  private readCoachFromStorage(): Coach | null {
    try {
      const json = localStorage.getItem(this.USER_KEY);
      return json ? (JSON.parse(json) as Coach) : null;
    } catch {
      return null;
    }
  }
}
```

**Key:** Uses `firstValueFrom()` instead of `.subscribe()` — consistent with trd.md "No manual .subscribe() in TypeScript files (except side-effect post actions)." The form submission is a side-effect post action where `firstValueFrom` is the right pattern.

### Pattern 8: Angular Functional HTTP Interceptor (JWT attach + refresh)

**What:** Adds `Authorization: Bearer <token>` to all requests. If the decoded JWT has < 7 days remaining, calls `/api/auth/refresh` first and updates localStorage.

**When to use:** Any Angular app with JWT auth and sliding session.

```typescript
// Source: angular.dev/api/common/http/withInterceptors (VERIFIED)
// libs/client/feature/auth/src/lib/auth.interceptor.ts

import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { switchMap, from } from 'rxjs';
import { AuthService } from './auth.service';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const REFRESH_URL = '/api/auth/refresh';

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  const authService = inject(AuthService);

  // Do not intercept the refresh endpoint itself (prevents infinite loops)
  if (req.url.includes(REFRESH_URL)) {
    return next(req);
  }

  const token = authService.getToken();
  if (!token) return next(req);

  // Decode JWT without verification (guard already verified on protected routes)
  const payload = decodeJwtPayload(token);
  if (!payload) return next(attachToken(req, token));

  const expiresAt = payload.exp * 1000;
  const now = Date.now();

  // Token fully expired — let the request fail naturally; guard handles redirect
  if (expiresAt < now) return next(req);

  // Token expiring within 7 days — refresh first
  if (expiresAt - now < SEVEN_DAYS_MS) {
    return from(
      fetch(REFRESH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ token }),
      })
        .then(r => r.json() as Promise<{ token: string }>)
        .then(res => {
          authService.updateToken(res.token);
          return res.token;
        })
        .catch(() => token)
    ).pipe(switchMap(newToken => next(attachToken(req, newToken))));
  }

  return next(attachToken(req, token));
};

function attachToken(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({ headers: req.headers.set('Authorization', `Bearer ${token}`) });
}

function decodeJwtPayload(token: string): { exp: number } | null {
  try {
    const base64 = token.split('.')[1];
    return JSON.parse(atob(base64)) as { exp: number };
  } catch {
    return null;
  }
}
```

**Critical:** The interceptor bypasses Angular's `HttpClient` for the refresh call (uses native `fetch`) to avoid re-entering the interceptor chain. This is the standard pattern for preventing interceptor re-entrance on the refresh call.

### Pattern 9: Angular CanActivateFn Route Guard

**What:** Functional guard that reads JWT from localStorage, decodes it client-side, and redirects to `/login` if missing or expired.

**When to use:** All protected Angular routes.

```typescript
// Source: angular.dev/api/router/CanActivateFn (VERIFIED)
// libs/client/feature/auth/src/lib/auth.guard.ts

import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const token = authService.getToken();
  if (!token) {
    return router.createUrlTree(['/login'], {
      queryParams: { reason: 'session-expired' }
    });
  }

  // Decode and check expiry client-side — no network call
  try {
    const payload = JSON.parse(atob(token.split('.')[1])) as { exp: number };
    if (payload.exp * 1000 < Date.now()) {
      authService.logout();
      return router.createUrlTree(['/login'], {
        queryParams: { reason: 'session-expired' }
      });
    }
  } catch {
    authService.logout();
    return router.createUrlTree(['/login']);
  }

  return true;
};
```

### Pattern 10: Angular Route Configuration

**What:** Auth routes registered in `app.routes.ts`. Protected routes use `canActivate: [authGuard]`.

```typescript
// Source: angular.dev (VERIFIED)
// apps/frontend/src/app/app.routes.ts

import { Route } from '@angular/router';
import { authGuard } from '../../libs/client/feature/auth/src/lib/auth.guard';
// Or use path alias: import { authGuard } from '@apex-team/client/feature/auth';

export const appRoutes: Route[] = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./auth/login/login').then(m => m.LoginPage) },
  { path: 'signup', loadComponent: () => import('./auth/signup/signup').then(m => m.SignupPage) },
  {
    path: 'reset-password',
    loadComponent: () => import('./auth/reset-password/reset-password').then(m => m.ResetPasswordPage),
  },
  {
    path: 'teams',
    canActivate: [authGuard],
    loadComponent: () => import('./teams/teams-placeholder').then(m => m.TeamsPlaceholderPage),
  },
];
```

### Pattern 11: ngx-reactive-forms-utils Error Display

**What:** `ControlErrorsDisplayComponent` wraps form inputs and automatically shows validation errors based on the touched state.

**When to use:** All auth forms (login, signup, reset-password).

**Import:**
```typescript
// Source: unpkg.com/ngx-reactive-forms-utils@5.1.0/index.d.ts (VERIFIED)
import { ControlErrorsDisplayComponent } from 'ngx-reactive-forms-utils';
```

**Usage in component:**
```typescript
// apps/frontend/src/app/auth/login/login.ts

import { Component } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ControlErrorsDisplayComponent } from 'ngx-reactive-forms-utils';
import { AuthService } from '@apex-team/client/feature/auth';

@Component({
  imports: [ReactiveFormsModule, RouterModule, ControlErrorsDisplayComponent],
  selector: 'app-login',
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class LoginPage {
  protected readonly form = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(8)] }),
  });

  protected loading = false;
  protected error = '';

  constructor(private readonly authService: AuthService) {}

  async onSubmit(): Promise<void> {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';
    try {
      await this.authService.login(this.form.value.email!, this.form.value.password!);
    } catch {
      this.error = 'Invalid email or password';
    } finally {
      this.loading = false;
    }
  }
}
```

**Usage in template:**
```html
<!-- apps/frontend/src/app/auth/login/login.html -->
<div class="flex min-h-screen items-center justify-center bg-gray-950 dark:bg-gray-950">
  <div class="w-full max-w-md rounded-2xl bg-gray-900 p-8 shadow-xl">
    <h1 class="mb-8 text-center text-2xl font-bold text-white">Apex Team</h1>
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <ngx-control-errors-display errorClasses="text-red-400 text-sm mt-1">
        <input
          type="email"
          formControlName="email"
          class="w-full rounded-lg bg-gray-800 px-4 py-3 text-white"
          placeholder="Email"
        />
      </ngx-control-errors-display>

      <ngx-control-errors-display errorClasses="text-red-400 text-sm mt-1" class="mt-4 block">
        <input
          type="password"
          formControlName="password"
          class="w-full rounded-lg bg-gray-800 px-4 py-3 text-white"
          placeholder="Password"
        />
      </ngx-control-errors-display>

      @if (error) {
        <p class="mt-3 text-red-400 text-sm">{{ error }}</p>
      }

      <button
        type="submit"
        [disabled]="form.invalid || loading"
        class="mt-6 w-full rounded-lg bg-blue-600 py-3 font-semibold text-white disabled:opacity-50"
      >
        {{ loading ? 'Signing in...' : 'Sign In' }}
      </button>

      <p class="mt-4 text-center text-gray-400 text-sm">
        No account? <a routerLink="/signup" class="text-blue-400">Sign up</a>
      </p>
      <p class="mt-2 text-center text-gray-400 text-sm">
        <a routerLink="/reset-password" class="text-blue-400">Forgot password?</a>
      </p>
    </form>
  </div>
</div>
```

**Available built-in error messages:** `required`, `minlength`, `maxlength`, `min`, `max`, `email`, `number`, `minAge`, `maxAge`
[VERIFIED: unpkg.com/ngx-reactive-forms-utils@5.1.0]

**Custom error message example (if needed):**
```typescript
// Source: unpkg.com/ngx-reactive-forms-utils@5.1.0/fesm2022/ngx-reactive-forms-utils.mjs (VERIFIED)
import { addCustomErrorMessage } from 'ngx-reactive-forms-utils';

// In app.config.ts or a bootstrap effect:
addCustomErrorMessage('required', () => 'This field is required');
```

### Pattern 12: app.config.ts — Add HTTP Provider + Interceptor

```typescript
// Source: angular.dev/api/common/http/provideHttpClient (VERIFIED)
// apps/frontend/src/app/app.config.ts — MODIFY

import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, RouteReuseStrategy } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideIonicAngular, IonicRouteStrategy } from '@ionic/angular/standalone';
import { appRoutes } from './app.routes';
import { authInterceptor } from '@apex-team/client/feature/auth';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular({}),
    provideRouter(appRoutes),
    provideHttpClient(withInterceptors([authInterceptor])),
  ],
};
```

### Anti-Patterns to Avoid

- **Using `@nestjs/passport` + `PassportStrategy`:** The modern NestJS JWT pattern (documented in official NestJS JWT docs and Context7) injects `JwtService` directly into a guard. Passport adds a layer of abstraction not needed for single-strategy apps.
- **Storing JWT in httpOnly cookie without CORS config:** The decision (D-01) is localStorage. Do not change this.
- **Using `jwtService.sign()` (synchronous):** Always use `jwtService.signAsync()` to avoid blocking the event loop.
- **Intercepting the refresh endpoint:** The auth interceptor MUST skip requests to `/api/auth/refresh` to prevent infinite loops.
- **Setting `synchronize: true` on TypeORM:** This is D-10 from Phase 1. Always false, always migrations.
- **Calling `.subscribe()` in component TypeScript for form submission:** Use `firstValueFrom()` inside an `async` method per trd.md conventions.
- **Returning the token in `forgotPassword` response:** Even in dev mode, log to console only. Returning in the HTTP response is a security anti-pattern even for stubs.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Form validation error display | Custom `*ngIf` error blocks per field | `ControlErrorsDisplayComponent` from `ngx-reactive-forms-utils` | D-08; library handles touched/dirty rules, built-in messages for standard validators |
| JWT signing/verification | `jsonwebtoken` calls directly | `JwtService` from `@nestjs/jwt` | Integrates with NestJS DI, handles async, has proper error types |
| Password hashing | SHA256/MD5 or custom | `bcrypt.hash()` / `bcrypt.compare()` | bcrypt has built-in salt and constant-time comparison |
| Cryptographic reset tokens | `Math.random()` | `crypto.randomBytes(32).toString('hex')` | `Math.random()` is not cryptographically secure |
| Client-side JWT decode | `jsonwebtoken` in frontend | `atob(token.split('.')[1])` | No library needed; JWT payload is just base64 |

**Key insight:** The only client-side JWT operation needed is payload decode for expiry checking — this is a one-liner with `atob()`. Never install `jsonwebtoken` in the Angular app.

---

## Common Pitfalls

### Pitfall 1: JwtModule Not Global — `JwtService` Not Found in AuthModule
**What goes wrong:** `AuthModule` imports `JwtModule` locally but `PasswordResetService` in a separate module can't inject `JwtService`.
**Why it happens:** Non-global `JwtModule` is not exported to the entire application.
**How to avoid:** Register `JwtModule.registerAsync({ global: true, ... })` in `AppModule`, not in `AuthModule`. Then `AuthModule` does not need to import `JwtModule` at all.
**Warning signs:** `Nest can't resolve dependencies of the PasswordResetService` at startup.

### Pitfall 2: `bcrypt.compare()` Wrong Argument Order
**What goes wrong:** `bcrypt.compare(hash, plaintext)` instead of `bcrypt.compare(plaintext, hash)` — always returns false.
**Why it happens:** API is `compare(data, encrypted)` — "encrypted" is the hash.
**How to avoid:** First arg is always the user-supplied plaintext; second is the stored hash from DB.
**Warning signs:** Login always fails even with correct password.

### Pitfall 3: Interceptor Re-entrance on Refresh Call
**What goes wrong:** The auth interceptor calls `/auth/refresh`, which the interceptor also intercepts, causing an infinite loop.
**Why it happens:** Interceptors apply to all `HttpClient` requests by default.
**How to avoid:** Use native `fetch()` for the refresh call inside the interceptor, bypassing `HttpClient`. OR check `req.url.includes(REFRESH_URL)` as a bypass — both are shown in Pattern 8.
**Warning signs:** Browser DevTools shows infinite network requests to `/auth/refresh`.

### Pitfall 4: Migration Column NOT NULL Without Default
**What goes wrong:** `ALTER TABLE users ADD COLUMN password_hash VARCHAR NOT NULL` fails on a table with existing rows.
**Why it happens:** PostgreSQL cannot add a NOT NULL column to existing rows without a default value.
**How to avoid:** Add `DEFAULT ''` during the `ALTER`, then `ALTER COLUMN DROP DEFAULT` in the same migration (see Pattern 5). OR add as nullable first, backfill, then add NOT NULL constraint.
**Warning signs:** Migration fails with `ERROR: column "password_hash" of relation "users" contains null values`.

### Pitfall 5: `atob()` Throws on Malformed JWT
**What goes wrong:** `atob(token.split('.')[1])` throws `InvalidCharacterError` if the token is malformed or a non-JWT string is in localStorage.
**Why it happens:** `atob()` is strict about base64 padding.
**How to avoid:** Always wrap in try/catch. If decode fails, treat as expired — clear localStorage and redirect.
**Warning signs:** Guard crashes instead of redirecting on corrupted localStorage.

### Pitfall 6: `ngx-control-errors-display` Misses Errors When Using `nonNullable`
**What goes wrong:** The error display component shows no errors even when the field is invalid.
**Why it happens:** The default `rules: ['touched']` requires the control to be touched. Programmatic `setValue()` does not mark the control as touched.
**How to avoid:** Call `form.markAllAsTouched()` before checking validity on submit. The `ngx-control-errors-display` will then show errors.
**Warning signs:** Errors are invisible after submit-button click.

### Pitfall 7: data-source.ts Must Import New UserEntity Columns
**What goes wrong:** Migration generates with no changes because TypeORM diff compares entity classes, not DB state.
**Why it happens:** `data-source.ts` imports entity classes directly. If `UserEntity` is not updated before running `migration:generate`, the diff is empty.
**How to avoid:** Update `UserEntity` with the new columns FIRST, then run `migration:generate`. The generated migration will contain the `ALTER TABLE` statements.
**Warning signs:** Migration file is empty or contains only a `name` property.

---

## Code Examples

### NestJS signup DTO with class-validator
```typescript
// Source: NestJS docs (class-validator pattern) [ASSUMED — standard NestJS convention]
// apps/api/src/auth/dto/signup.dto.ts

import { IsEmail, IsString, MinLength } from 'class-validator';

export class SignupDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @MinLength(2)
  displayName: string;
}
```

### NestJS AuthController endpoints
```typescript
// apps/api/src/auth/auth.controller.ts
import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PasswordResetService } from './password-reset.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly passwordResetService: PasswordResetService,
  ) {}

  @Post('signup')
  signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() body: { token: string }) {
    return this.authService.refresh(body.token);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.passwordResetService.forgotPassword(dto.email);
    return { message: 'If that email is registered, a reset link has been sent.' };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.passwordResetService.resetPassword(dto.token, dto.newPassword);
    return { message: 'Password reset successful' };
  }
}
```

### AuthModule definition
```typescript
// apps/api/src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../entities/user.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PasswordResetService } from './password-reset.service';
import { JwtAuthGuard } from './auth.guard';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  controllers: [AuthController],
  providers: [AuthService, PasswordResetService, JwtAuthGuard],
  exports: [JwtAuthGuard, AuthService],  // Export guard for use in other modules
})
export class AuthModule {}
```

### Enable ValidationPipe globally in main.ts
```typescript
// apps/api/src/main.ts — MODIFY: add ValidationPipe
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors({ origin: 'http://localhost:4200' });  // Angular dev server
  const port = process.env['PORT'] ?? 3000;
  await app.listen(port);
}
bootstrap();
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@nestjs/passport` + `JwtStrategy` for JWT | `JwtService.verifyAsync()` in custom guard (no Passport) | NestJS 10+ | Simpler, less boilerplate, no Passport dependency needed for single-strategy apps |
| `@angular/common/http` class-based interceptors | `HttpInterceptorFn` (functional) with `withInterceptors()` | Angular 15+ | No DI class boilerplate; used with `provideHttpClient()` |
| `CanActivate` class-based guards | `CanActivateFn` functional guards | Angular 14+ | Direct `inject()` usage, no class overhead |
| `subscribe()` in component TS for HTTP | `firstValueFrom()` / `toSignal()` | Angular 16+ (Signals) | No manual unsubscribe, fits async/await component pattern |

**Deprecated/outdated:**
- `JwtModule.register({ secret: 'hardcoded' })`: Use `registerAsync` + `ConfigService` to read from env.
- `@nestjs/passport` `PassportStrategy` extend: Not deprecated but unnecessary for this project's single-strategy JWT use case.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `AuthService`, interceptor, and guard live in `libs/client/feature/auth/` (separate lib) | Architecture Patterns | Low — can also live in `apps/frontend/src/app/auth/`; only import path changes |
| A2 | ValidationPipe is not yet registered in `main.ts` | Code Examples | Low — if already there, just verify `whitelist: true` is set |
| A3 | `class-validator` and `class-transformer` are not yet installed | Standard Stack | Low — if already present, skip install step |
| A4 | The frontend base URL for API calls is `/api` (proxied from Angular dev server at port 3000) | Pattern 7 | Medium — if proxy is not configured, HTTP requests will fail; proxy config is needed |

---

## Open Questions

1. **Frontend-to-API proxy configuration**
   - What we know: Angular dev server (port 4200) needs to proxy `/api/*` to NestJS (port 3000).
   - What's unclear: Whether a proxy config exists (`proxy.conf.json`) or if the Angular build config sets the API base URL via environment.
   - Recommendation: Wave 0 of plan should create `apps/frontend/proxy.conf.json` and register it in `project.json` serve target's `proxyConfig`.

2. **`libs/client/feature/auth` Nx lib generation**
   - What we know: TRD Section 3 specifies `libs/client/feature/auth` for the auth feature.
   - What's unclear: Whether the planner should include an Nx generator step (`nx g @nx/angular:library`) or just create the files manually (as Phase 1 did for theme).
   - Recommendation: Create files manually in the lib path; add `tsconfig.base.json` path alias `@apex-team/client/feature/auth`.

3. **Sliding session: refresh on every request vs. at boot**
   - What we know: CONTEXT.md (Specific Ideas) says "check on each outbound HTTP request, refresh if < 7 days remain."
   - What's unclear: Whether this means checking in the interceptor on EVERY request (causing a burst of parallel refreshes on page load) or once at app boot.
   - Recommendation: Intercept on each request but use a module-level `refreshPromise` variable to deduplicate concurrent refresh calls. If a refresh is already in-flight, wait for it rather than firing another.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Docker | PostgreSQL container | ✓ | 20.10.23 | — |
| Node.js | NestJS, Angular CLI | ✓ | (via npm check) | — |
| PostgreSQL (via Docker) | TypeORM migrations | ✓ | 16-alpine in docker-compose | — |

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework (frontend) | Vitest (via `@angular/build:unit-test`) |
| Framework (backend) | No Jest config found — need to add or use Vitest |
| Config file (frontend) | `apps/frontend/project.json` target `test` |
| Quick run command (frontend) | `nx run frontend:test` |
| Full suite command | `nx run-many --target=test` |

**Note on backend testing:** No Jest config or test target was found in `apps/api/project.json`. The project uses `@nx/vitest` at the workspace level. The planner should create a `test` target in `apps/api/project.json` for Jest (as stated in the phase context: "Jest (backend)"). [ASSUMED — backend test runner setup is incomplete per repo inspection]

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | Signup creates user with hashed password | unit (service) | `nx run api:test --testFile=auth.service.spec.ts` | ❌ Wave 0 |
| AUTH-01 | Signup rejects duplicate email | unit (service) | same | ❌ Wave 0 |
| AUTH-02 | Login returns JWT for valid credentials | unit (service) | same | ❌ Wave 0 |
| AUTH-02 | Login rejects wrong password | unit (service) | same | ❌ Wave 0 |
| AUTH-02 | JWT guard allows valid token | unit (guard) | `nx run api:test --testFile=auth.guard.spec.ts` | ❌ Wave 0 |
| AUTH-02 | JWT guard rejects expired/missing token | unit (guard) | same | ❌ Wave 0 |
| AUTH-03 | logout() clears localStorage and redirects | unit (frontend service) | `nx run frontend:test` | ❌ Wave 0 |
| AUTH-04 | forgotPassword() stores token with 1h expiry | unit (service) | `nx run api:test --testFile=password-reset.service.spec.ts` | ❌ Wave 0 |
| AUTH-04 | resetPassword() rejects expired token | unit (service) | same | ❌ Wave 0 |
| AUTH-04 | resetPassword() clears token after use | unit (service) | same | ❌ Wave 0 |

### Wave 0 Gaps

- [ ] `apps/api/src/auth/auth.service.spec.ts` — covers AUTH-01, AUTH-02
- [ ] `apps/api/src/auth/auth.guard.spec.ts` — covers AUTH-02 (guard)
- [ ] `apps/api/src/auth/password-reset.service.spec.ts` — covers AUTH-04
- [ ] Backend test infrastructure: add `test` target to `apps/api/project.json` (Jest or Vitest)
- [ ] `libs/client/feature/auth/src/lib/auth.service.spec.ts` — covers AUTH-03 (logout)

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | bcrypt 12 rounds, constant-time compare, generic "Invalid credentials" on both wrong email and wrong password |
| V3 Session Management | yes | 30-day JWT TTL, sliding window refresh, localStorage clear on logout |
| V4 Access Control | yes | `JwtAuthGuard` on all non-auth endpoints; `CanActivateFn` on all Angular protected routes |
| V5 Input Validation | yes | class-validator DTOs server-side; Angular Validators client-side; `ValidationPipe({ whitelist: true })` strips unknown fields |
| V6 Cryptography | yes | `crypto.randomBytes(32)` for reset tokens; bcrypt for passwords (never hand-roll) |

### Known Threat Patterns for NestJS JWT + Angular

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Email enumeration via forgotPassword | Information Disclosure | Return identical 200 response whether email exists or not (Pattern 6) |
| Brute force login | Elevation of Privilege | Deferred per CONTEXT.md deferred section; acceptable for personal tool |
| JWT stored in localStorage | Information Disclosure | Accepted risk (D-01); mitigated by Angular's built-in XSS sanitization |
| Reset token not invalidated after use | Elevation of Privilege | Clear `resetToken` and `resetTokenExpiry` to null after successful reset (Pattern 6) |
| Sensitive data in JWT payload | Information Disclosure | Only `sub`, `email`, `displayName` in payload — no password hash or sensitive fields |
| Interceptor re-entrance on refresh | Availability (DoS loop) | Skip interceptor for REFRESH_URL (Pattern 8 critical note) |

---

## Sources

### Primary (HIGH confidence)
- Context7 `/nestjs/jwt` — JwtModule registration, JwtService, async sign/verify patterns
- `angular.dev/api/common/http/withInterceptors` — functional interceptor API
- `angular.dev/api/router/CanActivateFn` — guard function signature
- `angular.dev/guide/signals/effect` — localStorage + signal effect pattern
- `unpkg.com/ngx-reactive-forms-utils@5.1.0/fesm2022/ngx-reactive-forms-utils.mjs` — ControlErrorsDisplayComponent selector, inputs, exports
- `unpkg.com/ngx-reactive-forms-utils@5.1.0/index.d.ts` — public API exports
- `npm view` on 2026-04-15 — confirmed versions: `@nestjs/jwt@11.0.2`, `bcrypt@6.0.0`, `ngx-reactive-forms-utils@5.1.0`, `class-validator@0.15.1`

### Secondary (MEDIUM confidence)
- GitHub README `pjlamb12/ngx-reactive-forms-utils` — ControlErrorsDisplayComponent usage examples, addCustomErrorMessage function
- NestJS docs (via Context7) — global JwtModule pattern, AuthGuard with verifyAsync

### Tertiary (LOW confidence — flagged)
- [ASSUMED] `libs/client/feature/auth/` lib split vs inline in app (no explicit decision in CONTEXT.md)
- [ASSUMED] Backend test runner needs setup (no `test` target in `apps/api/project.json` found)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified via npm registry on 2026-04-15
- Architecture: HIGH — follows verified NestJS JWT and Angular functional guard patterns
- ngx-reactive-forms-utils API: HIGH — verified via unpkg.com package inspection
- Pitfalls: HIGH — based on known NestJS/Angular patterns; interceptor re-entrance is a well-documented issue
- Backend test setup: LOW — no test target found in api/project.json; needs investigation

**Research date:** 2026-04-15
**Valid until:** 2026-05-15 (stable libraries; ngx-reactive-forms-utils is developer-maintained and could update)
