# Phase 3: Teams & Sport Configuration - Pattern Map

**Mapped:** 2026-04-16
**Files analyzed:** 19 new/modified files
**Analogs found:** 17 / 19

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `apps/api/src/teams/teams.module.ts` | module | — | `apps/api/src/auth/auth.module.ts` | exact |
| `apps/api/src/teams/teams.controller.ts` | controller | request-response | `apps/api/src/auth/auth.controller.ts` | role-match |
| `apps/api/src/teams/teams.service.ts` | service | CRUD | `apps/api/src/auth/auth.service.ts` | role-match |
| `apps/api/src/teams/dto/create-team.dto.ts` | model/dto | — | `apps/api/src/auth/dto/signup.dto.ts` | exact |
| `apps/api/src/teams/dto/update-team.dto.ts` | model/dto | — | `apps/api/src/auth/dto/login.dto.ts` | exact |
| `apps/api/src/sports/sports.module.ts` | module | — | `apps/api/src/auth/auth.module.ts` | role-match |
| `apps/api/src/sports/sports.controller.ts` | controller | request-response | `apps/api/src/auth/auth.controller.ts` | role-match |
| `apps/api/src/sports/sports.service.ts` | service | CRUD | `apps/api/src/auth/auth.service.ts` | role-match |
| `apps/api/src/entities/team.entity.ts` | model | — | `apps/api/src/entities/season.entity.ts` | exact (modify) |
| `apps/api/src/entities/season.entity.ts` | model | — | `apps/api/src/entities/team.entity.ts` | exact (modify) |
| `apps/api/src/migrations/{ts}-MoveFormatFieldsToSeasons.ts` | migration | batch | `apps/api/src/migrations/1744990000000-AddAuthColumns.ts` | exact |
| `apps/frontend/src/app/shell/shell.ts` | component | request-response | `apps/frontend/src/app/home/home.ts` | partial-match |
| `apps/frontend/src/app/shell/shell.html` | template | — | `apps/frontend/src/app/home/home.ts` | partial-match |
| `apps/frontend/src/app/teams/teams-list/teams-list.ts` | component | CRUD | `apps/frontend/src/app/home/home.ts` | partial-match |
| `apps/frontend/src/app/teams/teams-list/teams-list.html` | template | — | `apps/frontend/src/app/auth/login/login.html` | role-match |
| `apps/frontend/src/app/teams/create-team/create-team.ts` | component | CRUD | `apps/frontend/src/app/auth/signup/signup.ts` | exact |
| `apps/frontend/src/app/teams/create-team/create-team.html` | template | — | `apps/frontend/src/app/auth/signup/signup.html` | exact |
| `apps/frontend/src/app/teams/edit-team/edit-team.ts` | component | CRUD | `apps/frontend/src/app/auth/signup/signup.ts` | role-match |
| `apps/frontend/src/app/app.routes.ts` | config | — | `apps/frontend/src/app/app.routes.ts` | exact (modify) |

---

## Pattern Assignments

### `apps/api/src/teams/teams.module.ts` (module)

**Analog:** `apps/api/src/auth/auth.module.ts`

**Imports pattern** (lines 1-5):
```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeamsController } from './teams.controller';
import { TeamsService } from './teams.service';
import { TeamEntity } from '../entities/team.entity';
```

**Core module pattern** (lines 1-29):
```typescript
// apps/api/src/auth/auth.module.ts lines 1-29
@Module({
  imports: [
    PassportModule,
    TypeOrmModule.forFeature([UserEntity]),
    JwtModule.registerAsync({ ... }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, PasswordResetService],
  exports: [AuthService],
})
export class AuthModule {}
```

For TeamsModule: swap `TypeOrmModule.forFeature([TeamEntity, SportEntity])`, no JwtModule/PassportModule needed (those stay in AuthModule), no exports needed.

---

### `apps/api/src/teams/teams.controller.ts` (controller, request-response)

**Analog:** `apps/api/src/auth/auth.controller.ts`

**Imports pattern** (lines 1-8):
```typescript
// apps/api/src/auth/auth.controller.ts lines 1-7
import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { PasswordResetService } from './password-reset.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { JwtPayload } from './jwt.strategy';
```

For TeamsController: replace with `Get, Patch, Delete, Param` from `@nestjs/common`; import `CreateTeamDto`, `UpdateTeamDto`, `TeamsService`.

**Auth guard pattern** (lines 9-14):
```typescript
// apps/api/src/auth/auth.controller.ts lines 9-14
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly passwordResetService: PasswordResetService,
  ) {}
```

For TeamsController: `@Controller('teams')` with `@UseGuards(AuthGuard('jwt'))` at class level (apply to all endpoints). Constructor takes only `TeamsService`.

**Core CRUD pattern** — TeamsController needs GET/POST/GET:id/PATCH:id/DELETE:id. Auth controller only has POST endpoints. The RESEARCH.md code example is the definitive pattern:
```typescript
// RESEARCH.md "teams.controller.ts pattern" (lines 437-474)
@Controller('teams')
@UseGuards(AuthGuard('jwt'))
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get()
  findAll(@Request() req: { user: { sub: string } }) {
    return this.teamsService.findAllByCoach(req.user.sub);
  }

  @Post()
  create(@Body() dto: CreateTeamDto, @Request() req: { user: { sub: string } }) {
    return this.teamsService.create(dto, req.user.sub);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.teamsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTeamDto) {
    return this.teamsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.teamsService.remove(id);
  }
}
```

**Note:** `@UseGuards(AuthGuard('jwt'))` is placed at class level, not per-method — covers all endpoints at once. This differs from `auth.controller.ts` which applies it per-method (`@Post('refresh') @UseGuards(...)`).

---

### `apps/api/src/teams/teams.service.ts` (service, CRUD)

**Analog:** `apps/api/src/auth/auth.service.ts`

**Imports pattern** (lines 1-9):
```typescript
// apps/api/src/auth/auth.service.ts lines 1-9
import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserEntity } from '../entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { JwtPayload } from './jwt.strategy';
```

For TeamsService: replace with `NotFoundException` from `@nestjs/common`; `@InjectRepository(TeamEntity)` + `Repository<TeamEntity>`; no JwtService or bcrypt.

**Service class pattern** (lines 10-17):
```typescript
// apps/api/src/auth/auth.service.ts lines 10-17
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly jwtService: JwtService,
  ) {}
```

For TeamsService: `@InjectRepository(TeamEntity) private readonly teamRepo: Repository<TeamEntity>`.

**CRUD operation pattern** (lines 19-31):
```typescript
// apps/api/src/auth/auth.service.ts lines 19-31
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
  ...
}
```

For TeamsService, follow same `repo.create()` + `repo.save()` pattern. Add `findOne` with `NotFoundException` for not-found cases:
```typescript
// Pattern: throw NotFoundException when entity not found
const team = await this.teamRepo.findOne({ where: { id }, relations: ['sport'] });
if (!team) throw new NotFoundException(`Team ${id} not found`);
```

---

### `apps/api/src/teams/dto/create-team.dto.ts` (model/dto)

**Analog:** `apps/api/src/auth/dto/signup.dto.ts`

**Full pattern** (lines 1-15):
```typescript
// apps/api/src/auth/dto/signup.dto.ts lines 1-15
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

For CreateTeamDto: `@IsString() @IsNotEmpty() name: string;` and `@IsUUID() sportId: string;`. Import `IsString, IsNotEmpty, IsUUID` from `class-validator`.

---

### `apps/api/src/teams/dto/update-team.dto.ts` (model/dto)

**Analog:** `apps/api/src/auth/dto/login.dto.ts`

**Full pattern** (lines 1-10):
```typescript
// apps/api/src/auth/dto/login.dto.ts lines 1-10
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}
```

For UpdateTeamDto: single field `@IsString() @IsNotEmpty() @IsOptional() name?: string;`. Only `name` is editable — `sportId` is intentionally excluded (D-08).

---

### `apps/api/src/sports/sports.module.ts` (module)

**Analog:** `apps/api/src/auth/auth.module.ts`

**Core module pattern** (lines 1-29):
```typescript
// apps/api/src/auth/auth.module.ts lines 1-29
@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    ...
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
```

For SportsModule: `TypeOrmModule.forFeature([SportEntity])`, `SportsController`, `SportsService`. No PassportModule or JwtModule.

---

### `apps/api/src/sports/sports.controller.ts` (controller, request-response)

**Analog:** `apps/api/src/auth/auth.controller.ts`

**Imports + class pattern** (lines 1-14):
```typescript
// apps/api/src/auth/auth.controller.ts lines 1-14
import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
...
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService, ...) {}
```

For SportsController: `@Controller('sports') @UseGuards(AuthGuard('jwt'))`, single `@Get()` method calling `sportsService.findAllEnabled()`.

---

### `apps/api/src/sports/sports.service.ts` (service, CRUD)

**Analog:** `apps/api/src/auth/auth.service.ts`

**Service class + repo pattern** (lines 10-17):
```typescript
// apps/api/src/auth/auth.service.ts lines 10-17
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    ...
  ) {}
```

For SportsService: `@InjectRepository(SportEntity) private readonly sportRepo: Repository<SportEntity>`. Single method:
```typescript
findAllEnabled(): Promise<SportEntity[]> {
  return this.sportRepo.find({ where: { isEnabled: true } });
}
```

---

### `apps/api/src/entities/team.entity.ts` (model — modify existing)

**Existing file:** `apps/api/src/entities/team.entity.ts`

**Current state** (lines 1-31) — remove `playersOnField`, `periodCount`, `periodLengthMinutes` columns. Add `coachId`/`coach` relation. Final shape follows `season.entity.ts` relation pattern:

```typescript
// apps/api/src/entities/season.entity.ts lines 1-10 — relation pattern to copy
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { TeamEntity } from './team.entity';

@Entity('seasons')
export class SeasonEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => TeamEntity, (team) => team.seasons)
  @JoinColumn({ name: 'team_id' })
  team: TeamEntity;

  @Column({ name: 'team_id' })
  teamId: string;
```

For TeamEntity `coachId` addition: copy the `@ManyToOne` + `@JoinColumn` + scalar `@Column` pattern from `SeasonEntity` lines 9-13, referencing `UserEntity` instead.

---

### `apps/api/src/entities/season.entity.ts` (model — modify existing)

**Existing file:** `apps/api/src/entities/season.entity.ts`

**Column pattern to follow for new fields** (lines 17-21 of team.entity.ts — columns being moved):
```typescript
// apps/api/src/entities/team.entity.ts lines 20-28 — columns being MOVED to SeasonEntity
@Column({ name: 'players_on_field', default: 11 })
playersOnField: number;

@Column({ name: 'period_count', default: 2 })
periodCount: number;

@Column({ name: 'period_length_minutes', default: 45 })
periodLengthMinutes: number;
```

New seasons columns use `{ nullable: true }` instead of `default: X` because no season creation UI exists in Phase 3 and existing season rows must not break. Copy the `@Column` decorator style from `team.entity.ts` but change default to nullable:
```typescript
@Column({ name: 'players_on_field', nullable: true })
playersOnField: number | null;
```

---

### `apps/api/src/migrations/{timestamp}-MoveFormatFieldsToSeasons.ts` (migration, batch)

**Analog:** `apps/api/src/migrations/1744990000000-AddAuthColumns.ts`

**Full migration pattern** (lines 1-29):
```typescript
// apps/api/src/migrations/1744990000000-AddAuthColumns.ts lines 1-29
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAuthColumns1744990000000 implements MigrationInterface {
  name = 'AddAuthColumns1744990000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
        ADD COLUMN "password_hash" character varying NOT NULL DEFAULT '',
        ...
    `);
    await queryRunner.query(`
      ALTER TABLE "users" ALTER COLUMN "password_hash" DROP DEFAULT
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
        DROP COLUMN IF EXISTS "password_hash",
        ...
    `);
  }
}
```

Key pattern details:
- Class name includes timestamp suffix matching the file name
- `name` property set to same string as class name
- Raw SQL via `queryRunner.query()` template literals
- `down()` uses `DROP COLUMN IF EXISTS` to be idempotent
- Multi-column ALTER done in single `queryRunner.query()` call

For the new migration: ADD columns to `seasons` first (nullable — no NOT NULL two-step needed since nullable), then DROP columns from `teams`, then ADD `coach_id` column to `teams` (with two-step NOT NULL pattern from `AddAuthColumns` if required, or nullable FK initially).

---

### `apps/frontend/src/app/shell/shell.ts` (component)

**Analog:** `apps/frontend/src/app/home/home.ts`

**Imports + component decorator pattern** (lines 1-21):
```typescript
// apps/frontend/src/app/home/home.ts lines 1-21
import { Component, inject } from '@angular/core';
import {
  IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton,
} from '@ionic/angular/standalone';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-home',
  imports: [
    IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton,
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  protected readonly authService = inject(AuthService);
  ...
}
```

For Shell: replace Ionic imports with `IonTabs, IonTabBar, IonTabButton, IonRouterOutlet, IonIcon, IonLabel` from `@ionic/angular/standalone`. Component class body is minimal — shell is a layout-only component with no data fetching.

---

### `apps/frontend/src/app/shell/shell.html` (template)

**Analog:** None in codebase — first `IonTabs` usage. Use RESEARCH.md Pattern 3 as template:

```html
<!-- RESEARCH.md Pattern 3 (IonTabs Shell Route) -->
<ion-tabs>
  <ion-tab-bar slot="bottom">
    <ion-tab-button tab="teams" href="/teams">
      <ion-icon name="people-outline"></ion-icon>
      <ion-label>Teams</ion-label>
    </ion-tab-button>
  </ion-tab-bar>
</ion-tabs>
```

**Note from RESEARCH.md Pitfall 2:** The `tab` attribute value must exactly match the child route `path` value. With shell at `path: ''` (Open Question 3 resolution), `href="/teams"` maps to child `{ path: 'teams', ... }` and `tab="teams"` matches.

---

### `apps/frontend/src/app/teams/teams-list/teams-list.ts` (component, CRUD)

**Analog:** `apps/frontend/src/app/home/home.ts` (closest existing component) + login pattern for signal state

**Component decorator + inject() pattern** (home.ts lines 1-21):
```typescript
// apps/frontend/src/app/home/home.ts lines 1-21
import { Component, inject } from '@angular/core';
import {
  IonContent, IonCard, ...
} from '@ionic/angular/standalone';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-home',
  imports: [ IonContent, IonCard, ... ],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  protected readonly authService = inject(AuthService);
```

**Signal state pattern** (login.ts lines 32-34):
```typescript
// apps/frontend/src/app/auth/login/login.ts lines 32-34
protected errorMessage = signal<string | null>(null);
protected isLoading = signal(false);
```

**HTTP + firstValueFrom pattern** (auth.service.ts lines 28-35):
```typescript
// apps/frontend/src/app/auth/auth.service.ts lines 28-35
async login(email: string, password: string): Promise<void> {
  const response = await firstValueFrom(
    this.http.post<{ accessToken: string }>(`${this.apiUrl}/auth/login`, { email, password })
  );
```

**AlertController inject pattern** — `AlertController` is from `@ionic/angular/standalone` and injected via `inject()`, NOT added to `imports[]`:
```typescript
protected readonly alertCtrl = inject(AlertController);
```

For TeamsListComponent full shape:
```typescript
import { Component, inject, signal, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { RuntimeConfigLoaderService } from 'runtime-config-loader';
import { AlertController, IonContent, IonList, IonCard, IonCardHeader,
         IonCardTitle, IonCardContent, IonBadge, IonButton, IonFab,
         IonFabButton, IonIcon, IonSkeletonText, IonText } from '@ionic/angular/standalone';

@Component({
  selector: 'app-teams-list',
  standalone: true,
  imports: [IonContent, IonList, IonCard, IonCardHeader, IonCardTitle,
            IonCardContent, IonBadge, IonButton, IonFab, IonFabButton,
            IonIcon, IonSkeletonText, IonText],
  templateUrl: './teams-list.html',
  styleUrl: './teams-list.scss',
})
export class TeamsList implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly config = inject(RuntimeConfigLoaderService);
  private readonly router = inject(Router);
  protected readonly alertCtrl = inject(AlertController);

  protected teams = signal<Team[]>([]);
  protected isLoading = signal(false);
  protected errorMessage = signal<string | null>(null);

  get apiUrl(): string {
    return this.config.getConfigObjectKey('apiBaseUrl');
  }

  ngOnInit(): void { this.loadTeams(); }
  ...
}
```

---

### `apps/frontend/src/app/teams/teams-list/teams-list.html` (template)

**Analog:** `apps/frontend/src/app/auth/login/login.html`

**Ionic component usage pattern** (login.html lines 1-62):
- `<ion-content class="ion-padding">` as root wrapper
- Tailwind classes for layout (`class="min-h-screen flex items-center justify-center"`)
- `@if (signal())` for conditional rendering (Angular control flow)
- `@for (item of items(); track item.id)` for list rendering

**IonCard pattern for list items** (login.html lines 3-8):
```html
<!-- apps/frontend/src/app/auth/login/login.html lines 2-8 -->
<div class="min-h-screen flex items-center justify-center">
  <ion-card class="w-full max-w-sm">
    <ion-card-header class="text-center">
      <ion-card-title class="text-2xl font-bold tracking-tight">...</ion-card-title>
    </ion-card-header>
    <ion-card-content>...</ion-card-content>
  </ion-card>
</div>
```

For teams list: each team renders as an `<ion-card>` with `IonBadge` for sport badge. Empty state uses `@if (teams().length === 0 && !isLoading())` block with centered icon + message + create button.

---

### `apps/frontend/src/app/teams/create-team/create-team.ts` (component, CRUD)

**Analog:** `apps/frontend/src/app/auth/signup/signup.ts` — exact match

**Full pattern** (signup.ts lines 1-57):
```typescript
// apps/frontend/src/app/auth/signup/signup.ts lines 1-57
import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonItem, IonInput, IonButton, IonText,
} from '@ionic/angular/standalone';
import { ControlErrorsDisplayComponent } from 'ngx-reactive-forms-utils';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-signup',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonItem, IonInput, IonButton, IonText,
    ControlErrorsDisplayComponent,
  ],
  templateUrl: './signup.html',
  styleUrl: './signup.scss',
})
export class Signup {
  protected readonly fb = inject(FormBuilder);
  protected readonly authService = inject(AuthService);

  protected form = this.fb.group({
    displayName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  protected errorMessage = signal<string | null>(null);
  protected isLoading = signal(false);

  protected async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      ...
    } catch (err: unknown) {
      ...
    } finally {
      this.isLoading.set(false);
    }
  }
}
```

For CreateTeam: same structure. Add `sports = signal<Sport[]>([])` for dropdown data. Form group: `name` + `sportId` only. Add `IonSelect, IonSelectOption` to imports array. Inject `HttpClient` + `RuntimeConfigLoaderService` for sports fetch and team create calls. After successful submit navigate to `/teams` via `inject(Router)`.

---

### `apps/frontend/src/app/teams/create-team/create-team.html` (template)

**Analog:** `apps/frontend/src/app/auth/signup/signup.html` — exact match

**Form field pattern with validation** (signup.html lines 11-45):
```html
<!-- apps/frontend/src/app/auth/signup/signup.html lines 11-45 -->
<form [formGroup]="form" (ngSubmit)="submit()">
  <ngx-control-errors-display>
    <ion-item>
      <ion-input
        label="Display Name"
        labelPlacement="floating"
        type="text"
        formControlName="displayName"
        autocomplete="name"
      />
    </ion-item>
  </ngx-control-errors-display>
  ...
  @if (errorMessage()) {
    <ion-text color="danger">
      <p class="text-sm mt-2">{{ errorMessage() }}</p>
    </ion-text>
  }
  <ion-button type="submit" expand="block" class="mt-4" [disabled]="isLoading()">
    {{ isLoading() ? 'Creating...' : 'Create Team' }}
  </ion-button>
</form>
```

For sport dropdown, wrap `IonSelect` in `ngx-control-errors-display` + `ion-item` identical to text inputs. Use `@for` inside `ion-select` per RESEARCH.md code example.

---

### `apps/frontend/src/app/teams/edit-team/edit-team.ts` (component, CRUD)

**Analog:** `apps/frontend/src/app/auth/signup/signup.ts` (form/submit pattern) + `auth.service.ts` for HTTP

**Route param via inject()** — RESEARCH.md code example:
```typescript
// RESEARCH.md "ActivatedRoute param via inject()" — Angular 21 pattern
private readonly route = inject(ActivatedRoute);

ngOnInit(): void {
  const id = this.route.snapshot.paramMap.get('id');
  if (id) this.loadTeam(id);
}
```

**Form + submit pattern** (signup.ts lines 27-50):
```typescript
// apps/frontend/src/app/auth/signup/signup.ts lines 27-50
protected form = this.fb.group({
  displayName: ['', [Validators.required, Validators.minLength(2)]],
  ...
});

protected async submit(): Promise<void> {
  if (this.form.invalid) {
    this.form.markAllAsTouched();
    return;
  }
  this.isLoading.set(true);
  this.errorMessage.set(null);
  try { ... }
  catch (err: unknown) { ... }
  finally { this.isLoading.set(false); }
}
```

For EditTeam: form group has only `name` field. On `ngOnInit`, fetch team by id, patch form with `this.form.patchValue({ name: team.name })`. Sport shown as read-only text, not a form control. Delete button calls `confirmDelete()` with `AlertController` (same component — no separate route).

**AlertController delete pattern** (RESEARCH.md Pattern 5):
```typescript
// RESEARCH.md Pattern 5 — AlertController
protected async confirmDelete(team: Team): Promise<void> {
  const alert = await this.alertCtrl.create({
    header: 'Delete Team',
    message: `Are you sure you want to delete ${team.name}? This cannot be undone.`,
    buttons: [
      { text: 'Keep Team', role: 'cancel' },
      {
        text: 'Delete Team',
        role: 'destructive',
        cssClass: 'text-danger',
        handler: () => this.deleteTeam(team.id),
      },
    ],
  });
  await alert.present();
}
```

---

### `apps/frontend/src/app/app.routes.ts` (config — modify existing)

**Existing file** (lines 1-24):
```typescript
// apps/frontend/src/app/app.routes.ts lines 1-24
import { Route } from '@angular/router';
import { authGuard } from './auth/auth.guard';

export const appRoutes: Route[] = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login').then((m) => m.Login),
  },
  ...
  {
    path: 'home',
    loadComponent: () => import('./home/home').then((m) => m.Home),
    canActivate: [authGuard],
  },
];
```

**Lazy-loaded route pattern** (lines 8-10):
```typescript
// apps/frontend/src/app/app.routes.ts lines 8-10
{
  path: 'login',
  loadComponent: () => import('./auth/login/login').then((m) => m.Login),
},
```

For shell route addition: same `loadComponent` lazy pattern, add `canActivate: [authGuard]` and `children[]` array. Replace the `home` entry with a redirect. Shell at `path: ''` (Open Question 3 recommendation) keeps URLs clean at `/teams`.

---

## Shared Patterns

### inject() Function (Dependency Injection)
**Source:** `apps/frontend/src/app/auth/login/login.ts` lines 24-25
**Apply to:** All Angular component files (shell, teams-list, create-team, edit-team)
```typescript
protected readonly fb = inject(FormBuilder);
protected readonly authService = inject(AuthService);
```
No `constructor(private x: X)` syntax. All services obtained via `inject()` at field declaration.

---

### firstValueFrom() HTTP Calls
**Source:** `apps/frontend/src/app/auth/auth.service.ts` lines 29-32
**Apply to:** teams-list.ts, create-team.ts, edit-team.ts
```typescript
const response = await firstValueFrom(
  this.http.post<{ accessToken: string }>(`${this.apiUrl}/auth/login`, { email, password })
);
```
Never `.subscribe()` directly. Never `.toPromise()`. Only `firstValueFrom()` for one-shot HTTP.

---

### RuntimeConfigLoaderService for API URL
**Source:** `apps/frontend/src/app/auth/auth.service.ts` lines 18-22
**Apply to:** teams-list.ts, create-team.ts, edit-team.ts, any Angular file making HTTP calls
```typescript
private readonly config = inject(RuntimeConfigLoaderService);

get apiUrl(): string {
  return this.config.getConfigObjectKey('apiBaseUrl');
}
```

---

### Signal State Triad (loading / error / data)
**Source:** `apps/frontend/src/app/auth/login/login.ts` lines 32-34
**Apply to:** teams-list.ts, create-team.ts, edit-team.ts
```typescript
protected errorMessage = signal<string | null>(null);
protected isLoading = signal(false);
// For list components, add:
protected teams = signal<Team[]>([]);
```

---

### Try/Catch/Finally Async Pattern
**Source:** `apps/frontend/src/app/auth/login/login.ts` lines 35-50
**Apply to:** All component async methods that call HTTP
```typescript
protected async submit(): Promise<void> {
  if (this.form.invalid) {
    this.form.markAllAsTouched();
    return;
  }
  this.isLoading.set(true);
  this.errorMessage.set(null);
  try {
    // HTTP call
  } catch {
    this.errorMessage.set('Error message here.');
  } finally {
    this.isLoading.set(false);
  }
}
```

---

### NestJS JWT Auth Guard
**Source:** `apps/api/src/auth/auth.controller.ts` lines 27-28
**Apply to:** teams.controller.ts, sports.controller.ts
```typescript
@Post('refresh')
@UseGuards(AuthGuard('jwt'))
```
For teams/sports: apply at class level `@UseGuards(AuthGuard('jwt'))` on the `@Controller` class to protect all endpoints at once.

---

### NestJS Repository CRUD
**Source:** `apps/api/src/auth/auth.service.ts` lines 19-31
**Apply to:** teams.service.ts, sports.service.ts
```typescript
const existing = await this.userRepo.findOne({ where: { email: dto.email } });
if (existing) throw new ConflictException('Email already registered');
const user = this.userRepo.create({ ... });
await this.userRepo.save(user);
```
Pattern: `repo.findOne({ where })` for lookup, `repo.create()` + `repo.save()` for insert, `repo.save(Object.assign(entity, dto))` for update, `repo.remove(entity)` for delete.

---

### External Template + StyleUrl
**Source:** `apps/frontend/src/app/auth/login/login.ts` lines 14-15
**Apply to:** All new Angular components
```typescript
templateUrl: './login.html',
styleUrl: './login.scss',
```
No inline templates or styles. Always external files.

---

### Protected Access Modifier for Template Members
**Source:** `apps/frontend/src/app/auth/login/login.ts` lines 24-34
**Apply to:** All new Angular components
```typescript
protected readonly fb = inject(FormBuilder);
protected errorMessage = signal<string | null>(null);
protected isLoading = signal(false);
```
All fields and methods used in templates use `protected`, not `public` or `private`.

---

### Ionic Standalone Component Imports
**Source:** `apps/frontend/src/app/auth/login/login.ts` lines 6-8
**Apply to:** All new Angular components
```typescript
import {
  IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonItem, IonInput, IonButton, IonText,
} from '@ionic/angular/standalone';
```
Each Ionic component imported individually per-component. No `IonicModule`. `AlertController` is NOT in the `imports[]` array — it is only `inject()`-ed.

---

### ControlErrorsDisplayComponent Wrapper
**Source:** `apps/frontend/src/app/auth/login/login.html` lines 11-21
**Apply to:** All form fields in create-team.html, edit-team.html
```html
<ngx-control-errors-display>
  <ion-item>
    <ion-input
      label="Email"
      labelPlacement="floating"
      formControlName="email"
    />
  </ion-item>
</ngx-control-errors-display>
```
Every form control wrapped in `<ngx-control-errors-display>`. Import `ControlErrorsDisplayComponent` from `ngx-reactive-forms-utils` in the component's `imports[]`.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `apps/frontend/src/app/shell/shell.html` | template | — | No `IonTabs` component used anywhere in codebase yet; use RESEARCH.md Pattern 3 |

---

## Metadata

**Analog search scope:** `apps/api/src/auth/`, `apps/api/src/entities/`, `apps/api/src/migrations/`, `apps/frontend/src/app/auth/`, `apps/frontend/src/app/home/`, `apps/frontend/src/app/app.routes.ts`
**Files scanned:** 21
**Pattern extraction date:** 2026-04-16
