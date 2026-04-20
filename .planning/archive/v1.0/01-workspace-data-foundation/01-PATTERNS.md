# Phase 1: Workspace & Data Foundation - Pattern Map

**Mapped:** 2026-04-15
**Files analyzed:** 35 (new/modified)
**Analogs found:** 7 / 35 (codebase is a fresh scaffold; most files have no prior analog — RESEARCH.md patterns are authoritative)

---

## Codebase State Note

This is a fresh Nx scaffold. The only application code is `apps/frontend/`. There is no NestJS API, no `libs/` directory, no Tailwind CSS, no Ionic, and no TypeORM. As a result:

- **Frontend modifications** have direct analogs in existing `apps/frontend/src/` files.
- **All NestJS, TypeORM entity, migration, service, and shared model files** have NO codebase analog — the planner MUST use RESEARCH.md patterns as the canonical reference.
- **Config file modifications** (`tsconfig.base.json`, `eslint.config.mjs`) have partial analogs (the files exist but lack the target content).

---

## File Classification

| New / Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---------------------|------|-----------|----------------|---------------|
| `apps/api/src/main.ts` | config | request-response | `apps/frontend/src/main.ts` | structural-only |
| `apps/api/src/app.module.ts` | config | request-response | none | no analog |
| `apps/api/src/app.controller.ts` | controller | request-response | none | no analog |
| `apps/api/src/data-source.ts` | config | CRUD | none | no analog |
| `apps/api/src/entities/sport.entity.ts` | model | CRUD | none | no analog |
| `apps/api/src/entities/user.entity.ts` | model | CRUD | none | no analog |
| `apps/api/src/entities/team.entity.ts` | model | CRUD | none | no analog |
| `apps/api/src/entities/player.entity.ts` | model | CRUD | none | no analog |
| `apps/api/src/entities/season.entity.ts` | model | CRUD | none | no analog |
| `apps/api/src/entities/game.entity.ts` | model | CRUD | none | no analog |
| `apps/api/src/entities/game-event.entity.ts` | model | CRUD | none | no analog |
| `apps/api/src/migrations/TIMESTAMP-InitialSchema.ts` | migration | CRUD | none | no analog |
| `apps/api/src/seeds/sport.seeder.ts` | utility | CRUD | none | no analog |
| `apps/api/.env.example` | config | — | none | no analog |
| `apps/api/project.json` | config | — | `apps/frontend/project.json` | partial-match |
| `libs/shared/util/models/src/lib/sport.model.ts` | model | — | none | no analog |
| `libs/shared/util/models/src/lib/user.model.ts` | model | — | none | no analog |
| `libs/shared/util/models/src/lib/team.model.ts` | model | — | none | no analog |
| `libs/shared/util/models/src/lib/player.model.ts` | model | — | none | no analog |
| `libs/shared/util/models/src/lib/season.model.ts` | model | — | none | no analog |
| `libs/shared/util/models/src/lib/game.model.ts` | model | — | none | no analog |
| `libs/shared/util/models/src/lib/game-event.model.ts` | model | — | none | no analog |
| `libs/shared/util/models/src/index.ts` | config | — | none | no analog |
| `libs/client/ui/theme/src/lib/theme.service.ts` | service | event-driven | none | no analog |
| `libs/client/ui/theme/src/lib/theme.service.spec.ts` | test | — | `apps/frontend/src/app/app.spec.ts` | structural-only |
| `libs/client/ui/theme/src/index.ts` | config | — | none | no analog |
| `apps/frontend/src/app/app.config.ts` | config | request-response | `apps/frontend/src/app/app.config.ts` | exact (modify) |
| `apps/frontend/src/styles.scss` | config | — | `apps/frontend/src/styles.scss` | exact (modify) |
| `apps/frontend/.postcssrc.json` | config | — | none | no analog |
| `tsconfig.base.json` | config | — | `tsconfig.base.json` | exact (modify) |
| `eslint.config.mjs` | config | — | `eslint.config.mjs` | exact (modify) |
| `docker-compose.yml` | config | — | none | no analog |

---

## Pattern Assignments

### `apps/api/src/main.ts` (config, request-response)

**Analog:** `apps/frontend/src/main.ts` (structural reference only — different framework)

**Existing analog** (`apps/frontend/src/main.ts`, lines 1-5):
```typescript
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
```

**NestJS bootstrap pattern** (from RESEARCH.md Pitfall 5 — no codebase analog):
```typescript
import 'reflect-metadata';   // MUST be first line — Pitfall 5
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
}
bootstrap();
```

**Key constraint:** `import 'reflect-metadata'` must be the first import. Omitting it causes `TypeError: Reflect.metadata is not a function` at startup (RESEARCH.md Pitfall 5).

---

### `apps/api/src/app.module.ts` (config, request-response)

**Analog:** None in codebase. Use RESEARCH.md Pattern 3 exclusively.

**Core pattern** (RESEARCH.md Pattern 3):
```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

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
        autoLoadEntities: true,   // Use this instead of glob — Pitfall 1
        synchronize: false,       // D-10: NEVER true
        migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
        migrationsRun: false,
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
```

**Critical deviation from RESEARCH.md Pattern 3:** Use `autoLoadEntities: true` (not `entities: [glob]`) to avoid the Nx/Webpack bundle resolution issue (RESEARCH.md Pitfall 1). Each entity feature module registers entities via `TypeOrmModule.forFeature([EntityClass])`.

---

### `apps/api/src/app.controller.ts` (controller, request-response)

**Analog:** None in codebase. Minimal health check pattern.

**Core pattern:**
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

---

### `apps/api/src/data-source.ts` (config, CRUD)

**Analog:** None in codebase. Use RESEARCH.md Pattern 4 exclusively.

**Core pattern** (RESEARCH.md Pattern 4 — CLI-only, outside NestJS DI):
```typescript
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config({ path: __dirname + '/../.env' });

// Import entity classes explicitly — do NOT use glob (Pitfall 1)
import { Sport } from './entities/sport.entity';
import { User } from './entities/user.entity';
import { Team } from './entities/team.entity';
import { Player } from './entities/player.entity';
import { Season } from './entities/season.entity';
import { Game } from './entities/game.entity';
import { GameEvent } from './entities/game-event.entity';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'apex_team',
  entities: [Sport, User, Team, Player, Season, Game, GameEvent],
  migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
  synchronize: false,
  migrationsTableName: 'migrations',
});
```

**Why separate from AppModule:** TypeORM CLI cannot invoke the NestJS DI container. `data-source.ts` reads env vars directly via `dotenv`. `AppModule` uses `ConfigService` (DI-injectable). They serve different callers — keep both.

---

### `apps/api/src/entities/sport.entity.ts` (model, CRUD)

**Analog:** None in codebase. Use RESEARCH.md Code Examples section.

**Core pattern** (RESEARCH.md Code Examples — Sport Entity):
```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('sports')
export class SportEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ type: 'jsonb', default: [] })
  positionTypes: string[];

  @Column({ default: true })
  isEnabled: boolean;
}
```

**Naming convention:** Class name uses `Entity` suffix (`SportEntity`) to distinguish from the shared interface `Sport` in `libs/shared/util/models`. All entity classes follow this suffix pattern.

**D-11 constraint:** `@Entity` decorator lives here (API layer), NOT in `libs/shared/util/models` (interfaces only).

---

### `apps/api/src/entities/user.entity.ts` (model, CRUD)

**Analog:** `apps/api/src/entities/sport.entity.ts` (sibling entity — exact role match once sport.entity.ts is created).

**Core pattern** (same structure as sport.entity.ts with user-specific columns):
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

---

### `apps/api/src/entities/team.entity.ts` (model, CRUD)

**Analog:** `apps/api/src/entities/sport.entity.ts` (sibling, once created). Use RESEARCH.md Code Examples.

**Core pattern** (RESEARCH.md Code Examples — Team Entity):
```typescript
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { SportEntity } from './sport.entity';
import { SeasonEntity } from './season.entity';

@Entity('teams')
export class TeamEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @ManyToOne(() => SportEntity)
  @JoinColumn({ name: 'sport_id' })
  sport: SportEntity;

  @Column({ name: 'sport_id' })
  sportId: string;

  @Column({ name: 'players_on_field', default: 11 })
  playersOnField: number;

  @Column({ name: 'period_count', default: 2 })
  periodCount: number;

  @Column({ name: 'period_length_minutes', default: 45 })
  periodLengthMinutes: number;

  @OneToMany(() => SeasonEntity, (season) => season.team)
  seasons: SeasonEntity[];
}
```

**D-03 constraint:** `playersOnField`, `periodCount`, `periodLengthMinutes` are team-level fields, NOT sport-level.

---

### `apps/api/src/entities/player.entity.ts` (model, CRUD)

**Analog:** `apps/api/src/entities/sport.entity.ts` (sibling pattern, once created).

**Core pattern:**
```typescript
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { TeamEntity } from './team.entity';

@Entity('players')
export class PlayerEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ nullable: true })
  jerseyNumber: number;

  @Column({ nullable: true })
  preferredPosition: string;

  @ManyToOne(() => TeamEntity)
  @JoinColumn({ name: 'team_id' })
  team: TeamEntity;

  @Column({ name: 'team_id' })
  teamId: string;
}
```

---

### `apps/api/src/entities/season.entity.ts` (model, CRUD)

**Analog:** `apps/api/src/entities/sport.entity.ts` (sibling pattern, once created).

**D-06 constraint:** Season belongs to a Team; Games belong to Season.

**Core pattern:**
```typescript
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
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

  @Column()
  name: string;

  @Column({ type: 'date', nullable: true })
  startDate: string;

  @Column({ type: 'date', nullable: true })
  endDate: string;

  @Column({ default: false })
  isActive: boolean;
}
```

---

### `apps/api/src/entities/game.entity.ts` (model, CRUD)

**Analog:** `apps/api/src/entities/season.entity.ts` (sibling pattern, once created).

**Core pattern:**
```typescript
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { SeasonEntity } from './season.entity';

@Entity('games')
export class GameEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => SeasonEntity)
  @JoinColumn({ name: 'season_id' })
  season: SeasonEntity;

  @Column({ name: 'season_id' })
  seasonId: string;

  @Column({ nullable: true })
  opponent: string;

  @Column({ type: 'timestamp', nullable: true })
  scheduledAt: Date;
}
```

---

### `apps/api/src/entities/game-event.entity.ts` (model, CRUD)

**Analog:** `apps/api/src/entities/game.entity.ts` (sibling pattern, once created).

**Core pattern:**
```typescript
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { GameEntity } from './game.entity';

@Entity('game_events')
export class GameEventEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => GameEntity)
  @JoinColumn({ name: 'game_id' })
  game: GameEntity;

  @Column({ name: 'game_id' })
  gameId: string;

  @Column()
  eventType: string;

  @Column({ type: 'int', nullable: true })
  minuteOccurred: number;

  @Column({ type: 'jsonb', default: {} })
  payload: Record<string, unknown>;
}
```

---

### `apps/api/src/migrations/TIMESTAMP-InitialSchema.ts` (migration, CRUD)

**Analog:** None in codebase. Use RESEARCH.md Pattern 4 and Code Examples (Soccer Seed).

**Core pattern** (TypeORM migration structure):
```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchemaTIMESTAMP implements MigrationInterface {
  name = 'InitialSchemaTIMESTAMP';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // CREATE TABLE statements for all 7 entities
    // D-04: Soccer seed inserted here (ON CONFLICT DO NOTHING)
    await queryRunner.query(`
      CREATE TABLE "sports" (
        "id" uuid DEFAULT gen_random_uuid() NOT NULL,
        "name" character varying NOT NULL,
        "position_types" jsonb NOT NULL DEFAULT '[]',
        "is_enabled" boolean NOT NULL DEFAULT true,
        CONSTRAINT "UQ_sports_name" UNIQUE ("name"),
        CONSTRAINT "PK_sports" PRIMARY KEY ("id")
      )
    `);
    // ... remaining CREATE TABLE statements ...

    // Soccer seed (D-04)
    await queryRunner.query(`
      INSERT INTO sports (id, name, position_types, is_enabled)
      VALUES (
        gen_random_uuid(),
        'Soccer',
        '["Goalkeeper", "Defender", "Midfielder", "Forward"]'::jsonb,
        true
      )
      ON CONFLICT (name) DO NOTHING;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // DROP TABLE statements in reverse dependency order
    await queryRunner.query(`DROP TABLE IF EXISTS "game_events"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "games"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "seasons"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "players"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "teams"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sports"`);
  }
}
```

**D-10 constraint:** Migration is the ONLY way schema changes happen. `synchronize: false` always.

---

### `apps/api/src/seeds/sport.seeder.ts` (utility, CRUD)

**Analog:** None in codebase. Optional — soccer seed can be embedded in the migration's `up()` method instead (see migration pattern above). If using `typeorm-extension`:

**Core pattern** (RESEARCH.md Code Examples):
```typescript
import { DataSource } from 'typeorm';
import { Seeder } from 'typeorm-extension';
import { SportEntity } from '../entities/sport.entity';

export default class SportSeeder implements Seeder {
  async run(dataSource: DataSource): Promise<void> {
    const repo = dataSource.getRepository(SportEntity);
    const existing = await repo.findOne({ where: { name: 'Soccer' } });
    if (!existing) {
      await repo.save({
        name: 'Soccer',
        positionTypes: ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'],
        isEnabled: true,
      });
    }
  }
}
```

**Planner note:** Embedding the soccer seed in the migration `up()` method (via raw SQL) is simpler and avoids the `typeorm-extension` dependency. Either approach is valid per RESEARCH.md Alternatives Considered. Prefer the migration approach for Phase 1 to keep dependencies minimal.

---

### `apps/api/.env.example` (config, —)

**Analog:** None in codebase. Simple template file.

**Core pattern:**
```
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=apex_team
PORT=3000
```

**Security constraint (RESEARCH.md Security Domain):** `.env` is gitignored. Only `.env.example` (with placeholder values) is committed.

---

### `apps/api/project.json` (config, —)

**Analog:** `apps/frontend/project.json` (same file role, different app). Add migration targets to the Nx-generated scaffold.

**Existing frontend analog** (`apps/frontend/project.json`, lines 1-10 — structure to copy):
```json
{
  "name": "api",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "projectType": "application",
  "sourceRoot": "apps/api/src",
  "tags": ["scope:api"],
  "targets": {
    "build": { ... },
    "serve": { ... }
  }
}
```

**Migration targets to add** (RESEARCH.md Pattern 5):
```json
"migration:generate": {
  "executor": "nx:run-commands",
  "options": {
    "command": "npx typeorm-ts-node-esm migration:generate apps/api/src/migrations/{args.name} -d apps/api/src/data-source.ts",
    "cwd": "{workspaceRoot}"
  }
},
"migration:run": {
  "executor": "nx:run-commands",
  "options": {
    "command": "npx typeorm-ts-node-esm migration:run -d apps/api/src/data-source.ts",
    "cwd": "{workspaceRoot}"
  }
},
"migration:revert": {
  "executor": "nx:run-commands",
  "options": {
    "command": "npx typeorm-ts-node-esm migration:revert -d apps/api/src/data-source.ts",
    "cwd": "{workspaceRoot}"
  }
}
```

**Open Question from RESEARCH.md (A1):** After `nx g @nx/nest:app apps/api`, inspect the generated `tsconfig.app.json` — if `"module": "commonjs"`, replace `typeorm-ts-node-esm` with `typeorm-ts-node-commonjs`.

---

### `libs/shared/util/models/src/lib/sport.model.ts` (model, —)

**Analog:** None in codebase. Use RESEARCH.md Pattern 9.

**Core pattern** (RESEARCH.md Pattern 9 — pure TypeScript interface, NO `@Entity`):
```typescript
// D-11: No @Entity decorators here — interfaces only
export interface Sport {
  id: string;
  name: string;
  positionTypes: string[];   // D-04: ["Goalkeeper", "Defender", "Midfielder", "Forward"]
  isEnabled: boolean;
}
```

---

### `libs/shared/util/models/src/lib/team.model.ts` (model, —)

**Analog:** `libs/shared/util/models/src/lib/sport.model.ts` (sibling, once created).

**Core pattern** (RESEARCH.md Pattern 9):
```typescript
import type { Season } from './season.model';

export interface Team {
  id: string;
  name: string;
  sportId: string;
  playersOnField: number;    // D-03: team-level setting
  periodCount: number;       // D-03: team-level setting
  periodLengthMinutes: number; // D-03: team-level setting
  seasons?: Season[];
}
```

---

### `libs/shared/util/models/src/lib/season.model.ts` (model, —)

**Analog:** `libs/shared/util/models/src/lib/sport.model.ts` (sibling, once created).

**Core pattern** (RESEARCH.md Pattern 9):
```typescript
export interface Season {
  id: string;
  teamId: string;
  name: string;
  startDate: string;   // ISO date string
  endDate: string;
  isActive: boolean;
}
```

---

### `libs/shared/util/models/src/lib/user.model.ts` (model, —)

**Core pattern:**
```typescript
export interface User {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;   // ISO date string
}
```

---

### `libs/shared/util/models/src/lib/player.model.ts` (model, —)

**Core pattern:**
```typescript
export interface Player {
  id: string;
  teamId: string;
  firstName: string;
  lastName: string;
  jerseyNumber?: number;
  preferredPosition?: string;
}
```

---

### `libs/shared/util/models/src/lib/game.model.ts` (model, —)

**Core pattern:**
```typescript
export interface Game {
  id: string;
  seasonId: string;
  opponent?: string;
  scheduledAt?: string;   // ISO datetime string
}
```

---

### `libs/shared/util/models/src/lib/game-event.model.ts` (model, —)

**Core pattern:**
```typescript
export interface GameEvent {
  id: string;
  gameId: string;
  eventType: string;
  minuteOccurred?: number;
  payload: Record<string, unknown>;
}
```

---

### `libs/shared/util/models/src/index.ts` (config, —)

**Analog:** None. Standard barrel export pattern.

**Core pattern:**
```typescript
export * from './lib/sport.model';
export * from './lib/user.model';
export * from './lib/team.model';
export * from './lib/player.model';
export * from './lib/season.model';
export * from './lib/game.model';
export * from './lib/game-event.model';
```

---

### `libs/client/ui/theme/src/lib/theme.service.ts` (service, event-driven)

**Analog:** None in codebase. Use RESEARCH.md Pattern 8 exclusively.

**Core pattern** (RESEARCH.md Pattern 8 — Signal-based service):
```typescript
import { Injectable, signal, effect } from '@angular/core';

type Theme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  protected theme = signal<Theme>(this.getInitialTheme());

  constructor() {
    effect(() => {
      const isDark = this.theme() === 'dark';
      // Pitfall 2: must apply BOTH classes simultaneously
      document.documentElement.classList.toggle('dark', isDark);           // Tailwind
      document.documentElement.classList.toggle('ion-palette-dark', isDark); // Ionic 8
      localStorage.setItem('theme', this.theme());
    });
  }

  toggle(): void {
    this.theme.update(t => (t === 'dark' ? 'light' : 'dark'));
  }

  isDark(): boolean {
    return this.theme() === 'dark';
  }

  private getInitialTheme(): Theme {
    const stored = localStorage.getItem('theme') as Theme | null;
    if (stored) return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
}
```

**Class member access:** Template-bound fields use `protected` (established convention in `apps/frontend/src/app/app.ts` line 12).

**Pitfall 2 (CRITICAL):** `.ion-palette-dark` is the Ionic 8 dark palette class, NOT `.dark`. Apply both when enabling dark mode. `.dark` alone has no effect on Ionic components.

---

### `libs/client/ui/theme/src/lib/theme.service.spec.ts` (test, —)

**Analog:** `apps/frontend/src/app/app.spec.ts` — closest existing test file, structural reference for Vitest + Angular TestBed pattern.

**Existing test analog** (`apps/frontend/src/app/app.spec.ts`, lines 1-18):
```typescript
import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { NxWelcome } from './nx-welcome';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App, NxWelcome],
    }).compileComponents();
  });

  it('should render title', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Welcome frontend');
  });
});
```

**ThemeService test pattern** (adapts the above for a service, not a component):
```typescript
import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    // Reset localStorage before each test
    localStorage.clear();
    // Mock matchMedia for OS preference tests
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    });

    TestBed.configureTestingModule({});
    service = TestBed.inject(ThemeService);
  });

  it('should default to light theme when no stored preference and OS is light', () => {
    expect(service.isDark()).toBe(false);
  });

  it('should apply .dark and .ion-palette-dark classes on toggle', () => {
    service.toggle();
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('ion-palette-dark')).toBe(true);
  });

  it('should persist theme to localStorage on toggle', () => {
    service.toggle();
    expect(localStorage.getItem('theme')).toBe('dark');
  });
});
```

---

### `libs/client/ui/theme/src/index.ts` (config, —)

**Core pattern:**
```typescript
export * from './lib/theme.service';
```

---

### `apps/frontend/src/app/app.config.ts` (config, request-response) — MODIFY

**Analog:** `apps/frontend/src/app/app.config.ts` — this IS the file being modified.

**Existing content** (`apps/frontend/src/app/app.config.ts`, lines 1-7):
```typescript
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { appRoutes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [provideBrowserGlobalErrorListeners(), provideRouter(appRoutes)],
};
```

**Target pattern** (RESEARCH.md Pattern 7 — add Ionic providers):
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

**What changes:** Add `RouteReuseStrategy` override and `provideIonicAngular({})`. ThemeService is `providedIn: 'root'` so no explicit registration needed here.

---

### `apps/frontend/src/styles.scss` (config, —) — MODIFY

**Analog:** `apps/frontend/src/styles.scss` — this IS the file being modified.

**Existing content** (`apps/frontend/src/styles.scss`, lines 1-2):
```scss
/* You can add global styles to this file, and also import other style files */
```

**Target pattern** (RESEARCH.md Pattern 6):
```scss
@import "tailwindcss";

// Tailwind v4: override dark variant to use .dark class on <html> (D-09)
@custom-variant dark (&:where(.dark, .dark *));

// Tailwind v4: explicit source paths for Nx libs (Pitfall 3)
@source "../../../libs/client/ui/theme/src";

// Ionic core CSS
@import "@ionic/angular/css/core.css";
@import "@ionic/angular/css/normalize.css";
@import "@ionic/angular/css/structure.css";
@import "@ionic/angular/css/typography.css";

// Ionic dark palette — class-based, triggered by .ion-palette-dark on <html>
@import "@ionic/angular/css/palettes/dark.class.css";
```

**Pitfall 6:** Use `@import "tailwindcss"` NOT `@use "tailwindcss"`. SCSS `@use` syntax is not processed by Tailwind v4 PostCSS.
**Pitfall 3:** The `@source` directive ensures Tailwind scans lib templates and doesn't purge their classes in production.

---

### `apps/frontend/.postcssrc.json` (config, —) — NEW

**Analog:** None in codebase.

**Core pattern** (RESEARCH.md Pattern 6):
```json
{
  "plugins": {
    "@tailwindcss/postcss": {}
  }
}
```

---

### `tsconfig.base.json` (config, —) — MODIFY

**Analog:** `tsconfig.base.json` — this IS the file being modified.

**Existing `paths` object** (`tsconfig.base.json`, line 17):
```json
"paths": {}
```

**Target content** (RESEARCH.md Code Examples — after both libs are generated):
```json
"paths": {
  "@apex-team/shared/util/models": ["libs/shared/util/models/src/index.ts"],
  "@apex-team/client/ui/theme": ["libs/client/ui/theme/src/index.ts"]
}
```

**Pitfall 4:** Nx generators add path aliases automatically ONLY if `--importPath` is specified during `nx g`. Verify `tsconfig.base.json` `paths` after each generator runs. Add manually if missing.

---

### `eslint.config.mjs` (config, —) — MODIFY

**Analog:** `eslint.config.mjs` — this IS the file being modified.

**Existing wildcard constraint** (`eslint.config.mjs`, lines 19-23):
```javascript
depConstraints: [
  {
    sourceTag: '*',
    onlyDependOnLibsWithTags: ['*'],
  },
],
```

**Target pattern** (RESEARCH.md Pattern 2 — scope-specific constraints):
```javascript
depConstraints: [
  {
    sourceTag: 'scope:shared',
    onlyDependOnLibsWithTags: ['scope:shared'],
  },
  {
    sourceTag: 'scope:api',
    onlyDependOnLibsWithTags: ['scope:shared', 'scope:api'],
  },
  {
    sourceTag: 'scope:client',
    onlyDependOnLibsWithTags: ['scope:shared', 'scope:client'],
  },
],
```

**What changes:** Replace the single wildcard `sourceTag: '*'` entry with three scope-specific entries. All other `eslint.config.mjs` content remains unchanged.

---

### `docker-compose.yml` (config, —) — NEW

**Analog:** None in codebase. Standard PostgreSQL container config.

**Core pattern** (RESEARCH.md Open Questions — dedicated container to avoid port conflict):
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    container_name: apex-team-db
    ports:
      - '5433:5432'   # Map to 5433 to avoid conflict with existing container on 5432
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: apex_team
    volumes:
      - apex-team-db-data:/var/lib/postgresql/data

volumes:
  apex-team-db-data:
```

**Note:** Port `5433` on host maps to `5432` in container. The `.env` file must use `DB_PORT=5433` accordingly.

---

## Shared Patterns

### Angular Component Convention (applies to any Angular files created in libs)

**Source:** `apps/frontend/src/app/app.ts` (lines 1-13)
**Apply to:** Any Angular component created in `libs/client/ui/theme/`

```typescript
// NO standalone: true flag needed (Angular 21 default)
// External templates and styles (not inline)
// protected access for template-bound members
@Component({
  imports: [],
  selector: 'app-{name}',
  templateUrl: './{name}.html',
  styleUrl: './{name}.scss',
})
export class {Name} {
  protected someField = value;
}
```

### Vitest Test Convention (applies to all spec files in libs)

**Source:** `apps/frontend/src/app/app.spec.ts` (lines 1-18)
**Apply to:** `libs/client/ui/theme/src/lib/theme.service.spec.ts`

```typescript
import { TestBed } from '@angular/core/testing';

describe('{Subject}', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ ... }).compileComponents();
  });

  it('should ...', async () => {
    // arrange, act, assert
  });
});
```

### TypeScript Strict Mode (applies to all new TypeScript files)

**Source:** `apps/frontend/tsconfig.json` (strict mode settings from CONVENTIONS.md)
**Apply to:** All new TypeScript files

- `strict: true` — no implicit any, strict null checks
- `noImplicitOverride: true` — explicit `override` keyword required
- `noImplicitReturns: true` — all code paths must return
- Single quotes, 2-space indent (`.prettierrc`)

### TypeORM Entity Convention (applies to all entity files)

**Source:** RESEARCH.md Code Examples (no codebase analog exists)
**Apply to:** All `apps/api/src/entities/*.entity.ts` files

- Class name uses `Entity` suffix (`SportEntity`, not `Sport`) to distinguish from shared interfaces
- `@PrimaryGeneratedColumn('uuid')` for all primary keys
- Snake case column names via `name:` option (e.g., `{ name: 'sport_id' }`)
- `@JoinColumn({ name: 'x_id' })` on owning side of all relations
- `synchronize: false` enforced via DataSource config — entities alone do not affect DB schema

---

## No Analog Found

Files with no close match in the codebase — planner MUST use RESEARCH.md patterns as the primary reference:

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `apps/api/src/main.ts` | config | request-response | No NestJS bootstrap exists — use RESEARCH.md |
| `apps/api/src/app.module.ts` | config | request-response | No NestJS module exists — use RESEARCH.md Pattern 3 |
| `apps/api/src/app.controller.ts` | controller | request-response | No NestJS controller exists |
| `apps/api/src/data-source.ts` | config | CRUD | No TypeORM DataSource exists — use RESEARCH.md Pattern 4 |
| All `apps/api/src/entities/*.entity.ts` | model | CRUD | No TypeORM entities exist — use RESEARCH.md Code Examples |
| `apps/api/src/migrations/TIMESTAMP-InitialSchema.ts` | migration | CRUD | No migrations exist — use RESEARCH.md Pattern 3/Code Examples |
| `apps/api/src/seeds/sport.seeder.ts` | utility | CRUD | No seeds exist — prefer embedding in migration `up()` |
| `apps/api/.env.example` | config | — | No environment config exists |
| All `libs/shared/util/models/src/lib/*.model.ts` | model | — | `libs/` does not exist — use RESEARCH.md Pattern 9 |
| `libs/client/ui/theme/src/lib/theme.service.ts` | service | event-driven | No Angular services in codebase — use RESEARCH.md Pattern 8 |
| `apps/frontend/.postcssrc.json` | config | — | No PostCSS config exists — use RESEARCH.md Pattern 6 |
| `docker-compose.yml` | config | — | No Docker config exists — use RESEARCH.md Open Questions |

---

## Metadata

**Analog search scope:** `apps/frontend/src/`, `tsconfig.base.json`, `eslint.config.mjs`, `nx.json`, `apps/frontend/project.json`
**Files scanned:** 12
**Pattern extraction date:** 2026-04-15
**Codebase maturity:** Pre-Phase 1 scaffold — most patterns sourced from RESEARCH.md, not existing code
