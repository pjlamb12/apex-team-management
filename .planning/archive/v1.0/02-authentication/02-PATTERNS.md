# Phase 2: Authentication - Pattern Map

**Mapped:** 2026-04-15
**Files analyzed:** 17 (new/modified)
**Analogs found:** 12 / 17

---

## Codebase State Note

Phase 1 is complete. The codebase now has:
- A working NestJS API at `apps/api/src/` with `AppModule`, `AppController`, `AppService`, `DataSource`, 7 entities, and 1 migration.
- A working Angular frontend at `apps/frontend/src/` with Ionic, Tailwind, router, and `ThemeService`.
- `libs/client/ui/theme/` — the first Angular library (component + service + spec).
- `libs/shared/util/models/` — shared TypeScript interfaces.

Auth packages (`@nestjs/jwt`, `@nestjs/passport`, `passport-jwt`, `bcrypt`, `class-validator`, `class-transformer`) are **not yet installed**. The planner must include `npm install` steps before implementing NestJS auth files.

No `libs/client/feature/` directory exists yet. The first feature lib will be created by the planner via `nx g`. Pattern for feature libs must be inferred from the existing `libs/client/ui/theme/` library.

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `apps/api/src/auth/auth.module.ts` | config | request-response | `apps/api/src/app/app.module.ts` | role-match |
| `apps/api/src/auth/auth.controller.ts` | controller | request-response | `apps/api/src/app/app.controller.ts` | role-match |
| `apps/api/src/auth/auth.service.ts` | service | CRUD | `apps/api/src/app/app.service.ts` | role-match |
| `apps/api/src/auth/jwt.strategy.ts` | service | request-response | `apps/api/src/app/app.service.ts` | partial-match |
| `apps/api/src/auth/password-reset.service.ts` | service | CRUD | `apps/api/src/app/app.service.ts` | role-match |
| `apps/api/src/auth/dto/login.dto.ts` | model | request-response | none | no analog |
| `apps/api/src/auth/dto/signup.dto.ts` | model | request-response | none | no analog |
| `apps/api/src/migrations/TIMESTAMP-AddAuthColumns.ts` | migration | CRUD | `apps/api/src/migrations/1744934400000-InitialSchema.ts` | exact |
| `apps/api/src/entities/user.entity.ts` | model | CRUD | `apps/api/src/entities/user.entity.ts` | exact (modify) |
| `apps/api/src/data-source.ts` | config | CRUD | `apps/api/src/data-source.ts` | exact (modify) |
| `apps/frontend/src/app/app.routes.ts` | config | request-response | `apps/frontend/src/app/app.routes.ts` | exact (modify) |
| `apps/frontend/src/app/app.config.ts` | config | request-response | `apps/frontend/src/app/app.config.ts` | exact (modify) |
| Login page component | component | request-response | `libs/client/ui/theme/src/lib/theme/theme.ts` | role-match |
| Signup page component | component | request-response | `libs/client/ui/theme/src/lib/theme/theme.ts` | role-match |
| Reset-password page component | component | request-response | `libs/client/ui/theme/src/lib/theme/theme.ts` | role-match |
| `apps/frontend/src/app/auth/auth.service.ts` (or lib) | service | request-response | `libs/client/ui/theme/src/lib/theme.service.ts` | role-match |
| `apps/frontend/src/app/auth/auth.guard.ts` | middleware | request-response | none | no analog |
| `apps/frontend/src/app/auth/auth.interceptor.ts` | middleware | request-response | none | no analog |

---

## Pattern Assignments

### `apps/api/src/auth/auth.module.ts` (config, request-response)

**Analog:** `apps/api/src/app/app.module.ts`

**Existing analog** (`apps/api/src/app/app.module.ts`, lines 1-27):
```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({ ... }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AppController],
})
export class AppModule {}
```

**Auth module target pattern** (extends analog with JWT + TypeORM feature registration):
```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { PasswordResetService } from './password-reset.service';
import { UserEntity } from '../entities/user.entity';

@Module({
  imports: [
    PassportModule,
    TypeOrmModule.forFeature([UserEntity]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '30d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, PasswordResetService],
  exports: [AuthService],
})
export class AuthModule {}
```

**How to register in AppModule:** Add `AuthModule` to `AppModule.imports[]`. `AuthModule` self-registers via `TypeOrmModule.forFeature([UserEntity])` — no changes to `autoLoadEntities` needed.

---

### `apps/api/src/auth/auth.controller.ts` (controller, request-response)

**Analog:** `apps/api/src/app/app.controller.ts` (lines 1-9)

**Existing analog** (`apps/api/src/app/app.controller.ts`):
```typescript
import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('health')
  health(): { status: string } {
    return { status: 'ok' };
  }
}
```

**Auth controller target pattern** (expand analog with POST routes, Body/Param, DI, guard):
```typescript
import { Controller, Post, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { PasswordResetService } from './password-reset.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';

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
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @UseGuards(AuthGuard('jwt'))
  refresh() {
    // JWT guard validates current token; service issues a fresh one
    return this.authService.refresh();
  }

  @Post('forgot-password')
  forgotPassword(@Body('email') email: string) {
    return this.passwordResetService.createResetToken(email);
  }

  @Post('reset-password')
  resetPassword(
    @Body('token') token: string,
    @Body('newPassword') newPassword: string,
  ) {
    return this.passwordResetService.resetPassword(token, newPassword);
  }
}
```

**Key deviations from analog:** `@Controller('auth')` prefixes all routes. Constructor injection replaces no-arg class. No `@Get` — auth endpoints are exclusively `@Post`.

---

### `apps/api/src/auth/auth.service.ts` (service, CRUD)

**Analog:** `apps/api/src/app/app.service.ts` (lines 1-8)

**Existing analog** (`apps/api/src/app/app.service.ts`):
```typescript
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getData(): { message: string } {
    return { message: 'Hello API' };
  }
}
```

**Auth service target pattern** (same `@Injectable()` decorator, adds constructor DI, async methods, error throwing):
```typescript
import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserEntity } from '../entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly jwtService: JwtService,
  ) {}

  async signup(dto: SignupDto): Promise<{ accessToken: string }> {
    const existing = await this.userRepo.findOne({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = this.userRepo.create({
      email: dto.email,
      displayName: dto.displayName,
      passwordHash,
    });
    await this.userRepo.save(user);
    return { accessToken: this.jwtService.sign({ sub: user.id, email: user.email }) };
  }

  async login(dto: LoginDto): Promise<{ accessToken: string }> {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');
    return { accessToken: this.jwtService.sign({ sub: user.id, email: user.email }) };
  }

  async refresh(): Promise<{ accessToken: string }> {
    // Called after JwtAuthGuard validates — re-sign to reset 30-day window
    // The guard injects the user via @Request() or via getUser() — see controller
    throw new Error('TODO: inject current user from request context');
  }
}
```

**bcrypt work factor:** 12 rounds (per CONTEXT.md Discretion). `bcrypt.hash(password, 12)`.

---

### `apps/api/src/auth/jwt.strategy.ts` (service, request-response)

**Analog:** `apps/api/src/app/app.service.ts` (partial — same `@Injectable()` base; no codebase analog for Passport strategy)

**Target pattern** (NestJS Passport JWT strategy — no existing analog):
```typescript
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
  sub: string;
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  validate(payload: JwtPayload): JwtPayload {
    // Return value is attached to req.user by Passport
    return { sub: payload.sub, email: payload.email };
  }
}
```

**Key constraint:** `PassportStrategy(Strategy)` uses `passport-jwt`'s `Strategy`. The string `'jwt'` in `AuthGuard('jwt')` must match this strategy's name (default when using `passport-jwt` Strategy).

---

### `apps/api/src/auth/password-reset.service.ts` (service, CRUD)

**Analog:** `apps/api/src/app/app.service.ts` (same `@Injectable()` base pattern)

**Target pattern** (same decorator base, async CRUD + console stub for email):
```typescript
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { UserEntity } from '../entities/user.entity';

@Injectable()
export class PasswordResetService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  async createResetToken(email: string): Promise<{ message: string }> {
    const user = await this.userRepo.findOne({ where: { email } });
    // Always return success to avoid email enumeration
    if (!user) return { message: 'If that email exists, a reset link has been sent.' };
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour (D-10)
    user.passwordResetToken = token;
    user.passwordResetExpiry = expiry;
    await this.userRepo.save(user);
    // TODO: replace with email provider (D-11)
    // Injectable EmailService interface goes here
    const resetUrl = `http://localhost:4200/reset-password?token=${token}`;
    console.log(`[PasswordResetService] Reset URL: ${resetUrl}`);
    return { message: 'If that email exists, a reset link has been sent.' };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const user = await this.userRepo.findOne({
      where: { passwordResetToken: token },
    });
    if (!user || !user.passwordResetExpiry || user.passwordResetExpiry < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }
    user.passwordHash = await bcrypt.hash(newPassword, 12);
    user.passwordResetToken = null;
    user.passwordResetExpiry = null;
    await this.userRepo.save(user);
    return { message: 'Password reset successful' };
  }
}
```

**D-11 stub requirement:** Console log must be present with `[PasswordResetService] Reset URL:` prefix so dev can copy the link during manual testing.

---

### `apps/api/src/auth/dto/login.dto.ts` (model, request-response)

**Analog:** None in codebase. Use `class-validator` decorators — standard NestJS pattern.

**Target pattern:**
```typescript
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}
```

**Prerequisite:** `ValidationPipe` must be registered globally in `apps/api/src/main.ts`:
```typescript
app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
```

---

### `apps/api/src/auth/dto/signup.dto.ts` (model, request-response)

**Analog:** None. Same `class-validator` pattern as `login.dto.ts`.

**Target pattern:**
```typescript
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

---

### `apps/api/src/migrations/TIMESTAMP-AddAuthColumns.ts` (migration, CRUD)

**Analog:** `apps/api/src/migrations/1744934400000-InitialSchema.ts` (exact role match)

**Existing analog structure** (`apps/api/src/migrations/1744934400000-InitialSchema.ts`, lines 1-5):
```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1744934400000 implements MigrationInterface {
  name = 'InitialSchema1744934400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`...`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS ...`);
  }
}
```

**Auth columns migration target pattern** (ALTER TABLE, not CREATE TABLE):
```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAuthColumnsTIMESTAMP implements MigrationInterface {
  name = 'AddAuthColumnsTIMESTAMP';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
        ADD COLUMN "password_hash" character varying NOT NULL DEFAULT '',
        ADD COLUMN "password_reset_token" character varying,
        ADD COLUMN "password_reset_expiry" TIMESTAMP
    `);
    // Remove DEFAULT '' after adding (column was added with placeholder to satisfy NOT NULL)
    await queryRunner.query(`
      ALTER TABLE "users" ALTER COLUMN "password_hash" DROP DEFAULT
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
        DROP COLUMN IF EXISTS "password_hash",
        DROP COLUMN IF EXISTS "password_reset_token",
        DROP COLUMN IF EXISTS "password_reset_expiry"
    `);
  }
}
```

**Migration command:** `nx run api:migration:generate --name=AddAuthColumns`
**Run command:** `nx run api:migration:run`
**Migration executor pattern:** `TS_NODE_PROJECT=apps/api/tsconfig.app.json npx typeorm-ts-node-commonjs` (per `apps/api/project.json` targets).

---

### `apps/api/src/entities/user.entity.ts` (model, CRUD) — MODIFY

**Analog:** `apps/api/src/entities/user.entity.ts` — this IS the file being modified.

**Existing content** (`apps/api/src/entities/user.entity.ts`, lines 1-16):
```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  displayName: string;

  @CreateDateColumn()
  createdAt: Date;
}
```

**Target additions** (add 3 new `@Column` properties after existing columns):
```typescript
  @Column()
  passwordHash: string;

  @Column({ nullable: true })
  passwordResetToken: string | null;

  @Column({ type: 'timestamp', nullable: true })
  passwordResetExpiry: Date | null;
```

**Column naming convention:** camelCase property name → TypeORM snake_case column name automatically (`passwordHash` → `password_hash`). Explicit `name:` option not required unless overriding.

---

### `apps/api/src/data-source.ts` (config, CRUD) — MODIFY (no change needed)

**Analog:** `apps/api/src/data-source.ts` — this IS the file.

**Existing content** (`apps/api/src/data-source.ts`, lines 1-25) — already imports `UserEntity`. No changes required because `UserEntity` is already in the entities array. The new migration file is picked up automatically via the glob `__dirname + '/migrations/**/*{.ts,.js}'`.

**No edit needed** to `data-source.ts` for Phase 2.

---

### `apps/frontend/src/app/app.routes.ts` (config, request-response) — MODIFY

**Analog:** `apps/frontend/src/app/app.routes.ts` — this IS the file being modified.

**Existing content** (`apps/frontend/src/app/app.routes.ts`, lines 1-3):
```typescript
import { Route } from '@angular/router';

export const appRoutes: Route[] = [];
```

**Target pattern** (lazy-loaded auth routes with guard):
```typescript
import { Route } from '@angular/router';
import { authGuard } from './auth/auth.guard';

export const appRoutes: Route[] = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () =>
      import('./auth/login/login').then((m) => m.Login),
  },
  {
    path: 'signup',
    loadComponent: () =>
      import('./auth/signup/signup').then((m) => m.Signup),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./auth/reset-password/reset-password').then((m) => m.ResetPassword),
  },
  {
    path: 'home',
    loadComponent: () =>
      import('./home/home').then((m) => m.Home), // Phase 3 placeholder
    canActivate: [authGuard],
  },
];
```

**Route path convention:** Export name matches filename (e.g., `Login` from `login.ts`). Lazy-loaded via `loadComponent` (Angular standalone, no module needed).

---

### `apps/frontend/src/app/app.config.ts` (config, request-response) — MODIFY

**Analog:** `apps/frontend/src/app/app.config.ts` — this IS the file being modified.

**Existing content** (`apps/frontend/src/app/app.config.ts`, lines 1-13):
```typescript
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, RouteReuseStrategy } from '@angular/router';
import { provideIonicAngular, IonicRouteStrategy } from '@ionic/angular/standalone';
import { appRoutes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular({}),
    provideRouter(appRoutes),
  ],
};
```

**Target additions** (add `provideHttpClient` with interceptors):
```typescript
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './auth/auth.interceptor';

// In providers array, add:
provideHttpClient(withInterceptors([authInterceptor])),
```

**Full target providers array:**
```typescript
providers: [
  provideBrowserGlobalErrorListeners(),
  { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
  provideIonicAngular({}),
  provideRouter(appRoutes),
  provideHttpClient(withInterceptors([authInterceptor])),
],
```

---

### Login, Signup, Reset-Password page components (component, request-response)

**Analog:** `libs/client/ui/theme/src/lib/theme/theme.ts` (lines 1-9) — closest Angular component in codebase

**Existing analog** (`libs/client/ui/theme/src/lib/theme/theme.ts`):
```typescript
import { Component } from '@angular/core';

@Component({
  selector: 'lib-theme',
  imports: [],
  templateUrl: './theme.html',
  styleUrl: './theme.css',
})
export class Theme {}
```

**Auth page component target pattern** (extends analog with `inject()`, reactive form, Ionic components):
```typescript
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { IonContent, IonCard, IonCardContent, IonInput, IonButton } from '@ionic/angular/standalone';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, IonContent, IonCard, IonCardContent, IonInput, IonButton],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  protected readonly fb = inject(FormBuilder);
  protected readonly authService = inject(AuthService);
  protected readonly router = inject(Router);

  protected form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  protected async submit(): Promise<void> {
    if (this.form.invalid) return;
    // call authService, navigate on success
  }
}
```

**Key conventions from codebase:**
1. No `standalone: true` flag needed (Angular 21 default — matches existing `theme.ts` and `app.ts`)
2. External templates and stylesheets (not inline) — matches `theme.ts` (`templateUrl`, `styleUrl`)
3. `protected` access for template-bound fields — matches `app.ts` line 12 (`protected title = 'frontend'`)
4. `inject()` function pattern (not constructor injection) — per PROJECT.md constraint
5. Selector prefix for app components: `app-` (vs `lib-` for lib components)
6. File extension: `.scss` for app components (`.css` for lib components — see `theme.ts`)

**Auth form validation:** Use `ngx-reactive-forms-utils` per CONTEXT.md D-08. Research npm API before implementing error display.

---

### `apps/frontend/src/app/auth/auth.service.ts` (service, request-response)

**Analog:** `libs/client/ui/theme/src/lib/theme.service.ts` (closest Angular service in codebase)

**Existing analog** (`libs/client/ui/theme/src/lib/theme.service.ts`, lines 1-34):
```typescript
import { Injectable, signal, effect } from '@angular/core';

type Theme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  protected theme = signal<Theme>(this.getInitialTheme());

  constructor() {
    effect(() => {
      // ... side effects ...
    });
  }

  toggle(): void {
    this.theme.update(t => (t === 'dark' ? 'light' : 'dark'));
  }

  isDark(): boolean {
    return this.theme() === 'dark';
  }

  private getInitialTheme(): Theme { ... }
}
```

**Auth service target pattern** (same Signal-based service, adds `HttpClient` via `inject()`, localStorage read on init):
```typescript
import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { User } from '@apex-team/shared/util/models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  // Signal<User | null> — reads from localStorage on init (D-01)
  protected readonly currentUser = signal<User | null>(this.loadUserFromStorage());

  readonly isAuthenticated = computed(() => this.currentUser() !== null);

  async login(email: string, password: string): Promise<void> {
    const response = await firstValueFrom(
      this.http.post<{ accessToken: string }>('/api/auth/login', { email, password })
    );
    this.storeToken(response.accessToken);
    this.currentUser.set(this.decodeUser(response.accessToken));
    await this.router.navigate(['/home']);
  }

  async signup(email: string, password: string, displayName: string): Promise<void> {
    const response = await firstValueFrom(
      this.http.post<{ accessToken: string }>('/api/auth/signup', { email, password, displayName })
    );
    this.storeToken(response.accessToken);
    this.currentUser.set(this.decodeUser(response.accessToken));
    await this.router.navigate(['/home']);
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  private storeToken(token: string): void {
    localStorage.setItem('auth_token', token);
  }

  private loadUserFromStorage(): User | null {
    const token = localStorage.getItem('auth_token');
    if (!token) return null;
    try {
      return this.decodeUser(token);
    } catch {
      return null;
    }
  }

  private decodeUser(token: string): User {
    // JWT payload is base64url encoded in the second segment
    const payload = JSON.parse(atob(token.split('.')[1]));
    return { id: payload.sub, email: payload.email, displayName: payload.displayName ?? '', createdAt: '' };
  }
}
```

**Signal conventions** (from `theme.service.ts` analog):
- `protected` signal for internal state read by templates
- `computed()` for derived readonly signals exposed publicly
- `effect()` for side effects (optional here — localStorage writes happen imperatively in auth flow)
- `providedIn: 'root'` — same as ThemeService

**`inject()` pattern:** Uses `inject()` (not constructor injection) per PROJECT.md constraint.

**Token storage key:** `'auth_token'` in localStorage (D-01). Keep consistent across service, guard, and interceptor.

---

### `apps/frontend/src/app/auth/auth.guard.ts` (middleware, request-response)

**Analog:** None in codebase. Angular functional guard pattern.

**Target pattern** (functional `CanActivate` guard — Angular 15+ style):
```typescript
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  // D-03: clear stale token and redirect to login
  authService.logout();
  return router.createUrlTree(['/login']);
};
```

**Key convention:** Functional guard (not class-based) — this is the Angular 15+ idiomatic style. Registered in `app.routes.ts` as `canActivate: [authGuard]`.

---

### `apps/frontend/src/app/auth/auth.interceptor.ts` (middleware, request-response)

**Analog:** None in codebase. Angular functional HTTP interceptor pattern.

**Target pattern** (functional interceptor — Angular 15+ style):
```typescript
import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  if (!token) return next(req);

  // D-02: Sliding window — refresh if token nears expiry (< 7 days remaining)
  // Token expiry check: decode exp from JWT payload
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiresAt = payload.exp * 1000;  // exp is in seconds
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    if (expiresAt - Date.now() < sevenDaysMs) {
      // Trigger refresh in background — do not block current request
      authService.refresh().catch(() => authService.logout());
    }
  } catch {
    // Malformed token — let request proceed without header; guard will redirect
  }

  const authReq = req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  });

  return next(authReq);
};
```

**Registered in:** `apps/frontend/src/app/app.config.ts` via `provideHttpClient(withInterceptors([authInterceptor]))`.

---

## Shared Patterns

### NestJS Injectable Service Convention

**Source:** `apps/api/src/app/app.service.ts` (lines 1-8)
**Apply to:** `auth.service.ts`, `password-reset.service.ts`

```typescript
import { Injectable } from '@nestjs/common';

@Injectable()
export class MyService {
  // Constructor injection for repositories and other services
  constructor(
    @InjectRepository(SomeEntity)
    private readonly repo: Repository<SomeEntity>,
  ) {}
}
```

### NestJS Module Structure Convention

**Source:** `apps/api/src/app/app.module.ts` (lines 1-27)
**Apply to:** `auth.module.ts`

```typescript
@Module({
  imports: [ /* external modules */ ],
  controllers: [ /* controllers */ ],
  providers: [ /* services */ ],
  exports: [ /* services to share outside module */ ],
})
export class SomeModule {}
```

### Angular Component Convention (Standalone, External Templates)

**Source:** `libs/client/ui/theme/src/lib/theme/theme.ts` (lines 1-9) and `apps/frontend/src/app/app.ts` (lines 1-13)
**Apply to:** All auth page components (Login, Signup, ResetPassword)

```typescript
// No standalone: true needed (Angular 21 default)
// External template + stylesheet (not inline)
// protected access for all template-bound members
// inject() not constructor injection (PROJECT.md constraint)
@Component({
  selector: 'app-{name}',
  imports: [ /* explicit imports, no NgModule */ ],
  templateUrl: './{name}.html',
  styleUrl: './{name}.scss',
})
export class {Name} {
  protected readonly someService = inject(SomeService);
  protected someField = 'value';
}
```

### Angular Signal Service Convention

**Source:** `libs/client/ui/theme/src/lib/theme.service.ts` (lines 1-34)
**Apply to:** `apps/frontend/src/app/auth/auth.service.ts`

```typescript
@Injectable({ providedIn: 'root' })
export class SomeService {
  protected someState = signal<SomeType>(this.loadInitialState());
  readonly derivedState = computed(() => this.someState() !== null);

  private loadInitialState(): SomeType {
    // Read from localStorage, validate, return default
  }
}
```

### Vitest Service Test Convention

**Source:** `libs/client/ui/theme/src/lib/theme.service.spec.ts` (lines 1-102)
**Apply to:** Auth service spec files

```typescript
import { TestBed } from '@angular/core/testing';
import { SomeService } from './some.service';

describe('SomeService', () => {
  let service: SomeService;

  beforeEach(() => {
    vi.stubGlobal('localStorage', createLocalStorageMock());
    TestBed.configureTestingModule({});
    service = TestBed.inject(SomeService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should ...', () => {
    expect(service.someMethod()).toBe(expectedValue);
  });
});
```

**Key patterns from existing spec:**
- `vi.stubGlobal('localStorage', mockStorage)` for localStorage isolation
- `TestBed.flushEffects()` to synchronously flush Angular `effect()` callbacks
- `TestBed.resetTestingModule()` before re-testing init-time behavior
- `vi.unstubAllGlobals()` in `afterEach`

### Vitest Component Test Convention

**Source:** `libs/client/ui/theme/src/lib/theme/theme.spec.ts` (lines 1-21)
**Apply to:** Auth page component spec files

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SomeComponent } from './some-component';

describe('SomeComponent', () => {
  let component: SomeComponent;
  let fixture: ComponentFixture<SomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SomeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SomeComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
```

### TypeORM Migration Convention

**Source:** `apps/api/src/migrations/1744934400000-InitialSchema.ts` (lines 1-121)
**Apply to:** `TIMESTAMP-AddAuthColumns.ts`

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class MigrationNameTIMESTAMP implements MigrationInterface {
  name = 'MigrationNameTIMESTAMP';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "table_name" ADD COLUMN ...`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "table_name" DROP COLUMN IF EXISTS ...`);
  }
}
```

**Run via:** `nx run api:migration:run` (uses `TS_NODE_PROJECT=apps/api/tsconfig.app.json npx typeorm-ts-node-commonjs`)

### TypeScript Path Alias Convention

**Source:** `tsconfig.base.json` paths (lines 16-19)
**Apply to:** Any imports of shared lib code in auth files

```typescript
// Use path alias, not relative path across lib boundaries
import { User } from '@apex-team/shared/util/models';
// NOT: import { User } from '../../../../libs/shared/util/models/src/lib/user.model';
```

### Environment Variable Convention

**Source:** `apps/api/src/app/app.module.ts` (ConfigService pattern), `apps/api/src/data-source.ts` (dotenv pattern)
**Apply to:** `apps/api/src/auth/auth.module.ts` (JWT_SECRET), `apps/api/.env`

- NestJS services: use `ConfigService.get<string>('KEY')` (DI context)
- `data-source.ts`: use `process.env['KEY']` (CLI context, no DI)
- New env vars for Phase 2: `JWT_SECRET` (required), `JWT_EXPIRY` (optional, default `30d`)

---

## Library Placement Decision

**CONTEXT.md** references both `apps/frontend/src/app/auth/` and `libs/client/feature/auth/`. The **codebase convention** (based on `libs/client/ui/theme/`) is:

- Reusable UI components and services → `libs/client/{type}/{name}/`
- App-specific wiring (routes, config) → `apps/frontend/src/app/`

**Recommendation for planner:** Place `AuthService`, `AuthGuard`, and `AuthInterceptor` in **`apps/frontend/src/app/auth/`** for Phase 2 (simpler, no Nx lib generation needed). If Phase 3 requires sharing auth state across micro-frontends, migrate to `libs/client/feature/auth/`. The pattern for a new feature lib is identical to `libs/client/ui/theme/` — run `nx g @nx/angular:lib --name=auth --directory=libs/client/feature/auth --importPath=@apex-team/client/feature/auth --tags=scope:client,type:feature`.

---

## No Analog Found

Files with no close codebase match — planner should use established NestJS/Angular patterns from npm documentation:

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `apps/api/src/auth/dto/login.dto.ts` | model | request-response | No `class-validator` DTOs exist in codebase yet |
| `apps/api/src/auth/dto/signup.dto.ts` | model | request-response | No `class-validator` DTOs exist in codebase yet |
| `apps/api/src/auth/jwt.strategy.ts` | service | request-response | No Passport strategy exists — use `@nestjs/passport` docs |
| `apps/frontend/src/app/auth/auth.guard.ts` | middleware | request-response | No Angular guards exist — use Angular docs for `CanActivateFn` |
| `apps/frontend/src/app/auth/auth.interceptor.ts` | middleware | request-response | No Angular interceptors exist — use Angular docs for `HttpInterceptorFn` |

---

## Package Installation Required Before Implementation

The following packages must be installed before any auth files can be written. Include as the first plan step:

**NestJS auth packages:**
```bash
npm install @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt class-validator class-transformer
npm install -D @types/passport-jwt @types/bcrypt
```

**Angular form validation:**
```bash
npm install ngx-reactive-forms-utils
```

**`main.ts` update (ValidationPipe):**
```typescript
// apps/api/src/main.ts — add after NestFactory.create()
import { ValidationPipe } from '@nestjs/common';
app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
```

---

## Metadata

**Analog search scope:** `apps/api/src/`, `apps/frontend/src/`, `libs/client/ui/theme/src/`, `libs/shared/util/models/src/`, `tsconfig.base.json`, `apps/api/project.json`
**Files scanned:** 22
**Pattern extraction date:** 2026-04-15
**Codebase maturity:** Post-Phase-1 — NestJS API, Angular + Ionic frontend, and two libs all scaffolded and operational
