# Phase 5: Games & Lineup - Pattern Map

**Mapped:** 2026-04-17
**Files analyzed:** 18 new/modified files
**Analogs found:** 16 / 18

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `apps/api/src/migrations/TIMESTAMP-GamesLineupPhase.ts` | migration | batch | `apps/api/src/migrations/1776466961975-AddParentEmailToPlayer.ts` | exact |
| `apps/api/src/entities/lineup-entry.entity.ts` | model | CRUD | `apps/api/src/entities/game-event.entity.ts` | exact |
| `apps/api/src/entities/game.entity.ts` (modified) | model | CRUD | `apps/api/src/entities/game.entity.ts` (self) | self |
| `apps/api/src/games/games.module.ts` | config | — | `apps/api/src/players/players.module.ts` | exact |
| `apps/api/src/games/games.controller.ts` | controller | request-response | `apps/api/src/players/players.controller.ts` | exact |
| `apps/api/src/games/games.service.ts` | service | CRUD | `apps/api/src/players/players.service.ts` | exact |
| `apps/api/src/games/lineup-entries.service.ts` | service | CRUD | `apps/api/src/players/players.service.ts` | role-match |
| `apps/api/src/games/dto/create-game.dto.ts` | utility | transform | `apps/api/src/players/dto/create-player.dto.ts` | exact |
| `apps/api/src/games/dto/update-game.dto.ts` | utility | transform | `apps/api/src/players/dto/update-player.dto.ts` | exact |
| `apps/api/src/games/dto/save-lineup.dto.ts` | utility | transform | `apps/api/src/players/dto/create-player.dto.ts` | role-match |
| `apps/api/src/app/app.module.ts` (modified) | config | — | `apps/api/src/app/app.module.ts` (self) | self |
| `apps/api/src/data-source.ts` (modified) | config | — | `apps/api/src/data-source.ts` (self) | self |
| `apps/frontend/src/app/teams/games/games.service.ts` | service | request-response | `apps/frontend/src/app/teams/players.service.ts` | exact |
| `apps/frontend/src/app/teams/team-dashboard/team-dashboard.ts` (modified) | component | event-driven | `apps/frontend/src/app/teams/team-dashboard/team-dashboard.ts` (self) | self |
| `apps/frontend/src/app/teams/team-dashboard/team-dashboard.html` (modified) | component | event-driven | `apps/frontend/src/app/teams/team-dashboard/team-dashboard.html` (self) | self |
| `apps/frontend/src/app/teams/games/create-game/create-game.ts` | component | request-response | `apps/frontend/src/app/teams/create-team/create-team.ts` | exact |
| `apps/frontend/src/app/teams/games/edit-game/edit-game.ts` | component | request-response | `apps/frontend/src/app/teams/edit-team/edit-team.ts` | exact |
| `apps/frontend/src/app/teams/games/lineup-editor/lineup-editor.ts` | component | CRUD | `apps/frontend/src/app/teams/team-dashboard/team-dashboard.ts` | role-match |
| `apps/frontend/src/app/app.routes.ts` (modified) | config | — | `apps/frontend/src/app/app.routes.ts` (self) | self |

---

## Pattern Assignments

### `apps/api/src/migrations/TIMESTAMP-GamesLineupPhase.ts` (migration, batch)

**Analog:** `apps/api/src/migrations/1776466961975-AddParentEmailToPlayer.ts`

**Imports pattern** (lines 1-3):
```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';
```

**Class name pattern** (lines 3-4):
```typescript
export class GamesLineupPhase1776466961976 implements MigrationInterface {
  name = 'GamesLineupPhase1776466961976';
```
Note: Replace `1776466961976` with `Date.now()` at the time of writing. The latest existing timestamp is `1776466961975`, so the new value must be larger.

**Core migration pattern — ALTER existing table** (from `AddParentEmailToPlayer`, lines 6-11):
```typescript
public async up(queryRunner: QueryRunner): Promise<void> {
  await queryRunner.query(`
    ALTER TABLE "games"
      ADD COLUMN IF NOT EXISTS "location" character varying,
      ADD COLUMN IF NOT EXISTS "uniform_color" character varying,
      ADD COLUMN IF NOT EXISTS "status" character varying NOT NULL DEFAULT 'scheduled'
  `);
```

**Core migration pattern — CREATE new table** (from `InitialSchema`, lines 58-82 pattern, adapted for lineup_entries):
```typescript
  await queryRunner.query(`
    CREATE TABLE IF NOT EXISTS "lineup_entries" (
      "id" uuid DEFAULT gen_random_uuid() NOT NULL,
      "game_id" uuid NOT NULL,
      "player_id" uuid NOT NULL,
      "position_name" character varying,
      "status" character varying NOT NULL DEFAULT 'bench',
      CONSTRAINT "PK_lineup_entries" PRIMARY KEY ("id"),
      CONSTRAINT "FK_lineup_entries_game" FOREIGN KEY ("game_id")
        REFERENCES "games"("id") ON DELETE CASCADE,
      CONSTRAINT "FK_lineup_entries_player" FOREIGN KEY ("player_id")
        REFERENCES "players"("id") ON DELETE CASCADE
    )
  `);
}
```

**Down method pattern** (from `AddParentEmailToPlayer`, lines 13-18):
```typescript
public async down(queryRunner: QueryRunner): Promise<void> {
  await queryRunner.query(`DROP TABLE IF EXISTS "lineup_entries"`);
  await queryRunner.query(`
    ALTER TABLE "games"
      DROP COLUMN IF EXISTS "status",
      DROP COLUMN IF EXISTS "uniform_color",
      DROP COLUMN IF EXISTS "location"
  `);
}
```

**Key rules:**
- Always `IF NOT EXISTS` / `IF EXISTS` for idempotency
- Use `character varying` not PostgreSQL ENUM (avoids ALTER TYPE complexity on future changes)
- Foreign key `ON DELETE CASCADE` on `lineup_entries` so deleting a game removes its lineup entries automatically

---

### `apps/api/src/entities/lineup-entry.entity.ts` (model, CRUD)

**Analog:** `apps/api/src/entities/game-event.entity.ts`

**Imports pattern** (lines 1-3):
```typescript
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { GameEntity } from './game.entity';
import { PlayerEntity } from './player.entity';
```

**Core entity pattern** (modeled on `game-event.entity.ts` lines 5-24):
```typescript
@Entity('lineup_entries')
export class LineupEntryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => GameEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'game_id' })
  game: GameEntity;

  @Column({ name: 'game_id' })
  gameId: string;

  @ManyToOne(() => PlayerEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'player_id' })
  player: PlayerEntity;

  @Column({ name: 'player_id' })
  playerId: string;

  @Column({ name: 'position_name', nullable: true })
  positionName: string | null;

  @Column({ default: 'bench' })
  status: 'starting' | 'bench';
}
```

**Note on `game.entity.ts` modification:** Add three new `@Column` decorators following the existing column pattern in `apps/api/src/entities/game.entity.ts` (lines 18-21):
```typescript
@Column({ nullable: true })
location: string | null;

@Column({ name: 'uniform_color', nullable: true })
uniformColor: string | null;

@Column({ default: 'scheduled' })
status: 'scheduled' | 'in_progress' | 'completed';
```

---

### `apps/api/src/games/games.module.ts` (config)

**Analog:** `apps/api/src/players/players.module.ts`

**Exact pattern** (lines 1-13):
```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameEntity } from '../entities/game.entity';
import { SeasonEntity } from '../entities/season.entity';
import { LineupEntryEntity } from '../entities/lineup-entry.entity';
import { GamesController } from './games.controller';
import { GamesService } from './games.service';
import { LineupEntriesService } from './lineup-entries.service';

@Module({
  imports: [TypeOrmModule.forFeature([GameEntity, SeasonEntity, LineupEntryEntity])],
  controllers: [GamesController],
  providers: [GamesService, LineupEntriesService],
  exports: [GamesService],
})
export class GamesModule {}
```

**Registration in app.module.ts:** Add `GamesModule` to the `imports` array in `apps/api/src/app/app.module.ts` alongside `PlayersModule` (line 7 pattern). Also add `LineupEntryEntity` to the entities array in `apps/api/src/data-source.ts` (line 21).

---

### `apps/api/src/games/games.controller.ts` (controller, request-response)

**Analog:** `apps/api/src/players/players.controller.ts`

**Imports pattern** (lines 1-6):
```typescript
import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GamesService } from './games.service';
import { LineupEntriesService } from './lineup-entries.service';
import { CreateGameDto } from './dto/create-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';
import { SaveLineupDto } from './dto/save-lineup.dto';
```

**Auth guard pattern** (lines 7-8 of players.controller.ts — apply identically):
```typescript
@UseGuards(AuthGuard('jwt'))
@Controller('teams/:teamId/games')
export class GamesController {
  constructor(
    private readonly gamesService: GamesService,
    private readonly lineupEntriesService: LineupEntriesService,
  ) {}
```

**Core CRUD routes pattern** (modeled on players.controller.ts lines 13-31):
```typescript
  @Get()
  findAll(@Param('teamId') teamId: string) {
    return this.gamesService.findAllForTeam(teamId);
  }

  @Post()
  create(@Param('teamId') teamId: string, @Body() data: CreateGameDto) {
    return this.gamesService.create(teamId, data);
  }
```

**Standalone game routes (different base path):**
```typescript
// These go on a second controller or use a separate @Controller('games')
  @Patch(':gameId')
  update(@Param('gameId', ParseUUIDPipe) gameId: string, @Body() data: UpdateGameDto) {
    return this.gamesService.update(gameId, data);
  }

  @Delete(':gameId')
  remove(@Param('gameId', ParseUUIDPipe) gameId: string) {
    return this.gamesService.remove(gameId);
  }

  @Get(':gameId/lineup')
  getLineup(@Param('gameId', ParseUUIDPipe) gameId: string) {
    return this.lineupEntriesService.findByGame(gameId);
  }

  @Post(':gameId/lineup')
  saveLineup(@Param('gameId', ParseUUIDPipe) gameId: string, @Body() data: SaveLineupDto) {
    return this.lineupEntriesService.saveLineup(gameId, data.entries);
  }
```

**Note:** Use `ParseUUIDPipe` on `:gameId` params to guard against malformed UUIDs crashing TypeORM (RESEARCH.md security section).

---

### `apps/api/src/games/games.service.ts` (service, CRUD)

**Analog:** `apps/api/src/players/players.service.ts`

**Imports pattern** (lines 1-6 of players.service.ts, adapted):
```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GameEntity } from '../entities/game.entity';
import { SeasonEntity } from '../entities/season.entity';
import { CreateGameDto } from './dto/create-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';
```

**Repository injection pattern** (lines 10-13 of players.service.ts):
```typescript
@Injectable()
export class GamesService {
  constructor(
    @InjectRepository(GameEntity)
    private readonly gameRepo: Repository<GameEntity>,
    @InjectRepository(SeasonEntity)
    private readonly seasonRepo: Repository<SeasonEntity>,
  ) {}
```

**findAllForTeam — query via season join** (new pattern — no direct teamId column on games):
```typescript
  findAllForTeam(teamId: string): Promise<GameEntity[]> {
    return this.gameRepo
      .createQueryBuilder('g')
      .innerJoin('g.season', 's')
      .where('s.teamId = :teamId AND s.isActive = true', { teamId })
      .orderBy('g.scheduledAt', 'ASC')
      .getMany();
  }
```

**create — auto-season pattern** (new for Phase 5, no existing analog):
```typescript
  async create(teamId: string, dto: CreateGameDto): Promise<GameEntity> {
    let season = await this.seasonRepo.findOne({
      where: { teamId, isActive: true },
    });
    if (!season) {
      const year = new Date().getFullYear();
      season = this.seasonRepo.create({
        teamId,
        name: `${year} Season`,
        isActive: true,
      });
      season = await this.seasonRepo.save(season);
    }
    const game = this.gameRepo.create({ ...dto, seasonId: season.id });
    return this.gameRepo.save(game);
  }
```

**update / remove pattern** (lines 27-38 of players.service.ts):
```typescript
  async update(gameId: string, data: UpdateGameDto): Promise<GameEntity> {
    const game = await this.gameRepo.findOne({ where: { id: gameId } });
    if (!game) throw new NotFoundException(`Game ${gameId} not found`);
    Object.assign(game, data);
    return this.gameRepo.save(game);
  }

  async remove(gameId: string): Promise<void> {
    const game = await this.gameRepo.findOne({ where: { id: gameId } });
    if (!game) throw new NotFoundException(`Game ${gameId} not found`);
    await this.gameRepo.remove(game);
  }
```

---

### `apps/api/src/games/lineup-entries.service.ts` (service, CRUD)

**Analog:** `apps/api/src/players/players.service.ts` (role-match; bulk-replace is a new data flow)

**Imports + constructor pattern:**
```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LineupEntryEntity } from '../entities/lineup-entry.entity';
import { SaveLineupEntryDto } from './dto/save-lineup.dto';

@Injectable()
export class LineupEntriesService {
  constructor(
    @InjectRepository(LineupEntryEntity)
    private readonly lineupRepo: Repository<LineupEntryEntity>,
  ) {}
```

**findByGame pattern** (modeled on players.service.ts `findAllForTeam`, lines 15-19):
```typescript
  findByGame(gameId: string): Promise<LineupEntryEntity[]> {
    return this.lineupRepo.find({ where: { gameId } });
  }
```

**saveLineup — bulk replace pattern** (new; no existing analog):
```typescript
  async saveLineup(gameId: string, entries: SaveLineupEntryDto[]): Promise<LineupEntryEntity[]> {
    await this.lineupRepo.delete({ gameId });
    const created = this.lineupRepo.create(
      entries.map((e) => ({ ...e, gameId }))
    );
    return this.lineupRepo.save(created);
  }
```

---

### `apps/api/src/games/dto/create-game.dto.ts` (utility, transform)

**Analog:** `apps/api/src/players/dto/create-player.dto.ts`

**Imports pattern** (line 1 of create-player.dto.ts):
```typescript
import { IsString, IsNotEmpty, IsOptional, IsDateString, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
```

**Class-validator decorator pattern** (lines 3-19 of create-player.dto.ts, adapted):
```typescript
export class CreateGameDto {
  @IsString()
  @IsNotEmpty()
  opponent: string;

  @IsDateString()
  @IsNotEmpty()
  scheduledAt: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  uniformColor?: string;
}
```

---

### `apps/api/src/games/dto/update-game.dto.ts` (utility, transform)

**Analog:** `apps/api/src/players/dto/update-player.dto.ts`

**Pattern** (lines 1-23 of update-player.dto.ts — all fields `@IsOptional()`):
```typescript
import { IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';

export class UpdateGameDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  opponent?: string;

  @IsDateString()
  @IsOptional()
  scheduledAt?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  uniformColor?: string;
}
```

---

### `apps/api/src/games/dto/save-lineup.dto.ts` (utility, transform)

**Analog:** `apps/api/src/players/dto/create-player.dto.ts` (role-match; array wrapper is new)

```typescript
import { IsArray, IsString, IsNotEmpty, IsOptional, IsIn, ValidateNested, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';

export class SaveLineupEntryDto {
  @IsString()
  @IsNotEmpty()
  playerId: string;

  @IsString()
  @IsOptional()
  positionName?: string;

  @IsIn(['starting', 'bench'])
  status: 'starting' | 'bench';
}

export class SaveLineupDto {
  @IsArray()
  @ArrayMaxSize(11)
  @ValidateNested({ each: true })
  @Type(() => SaveLineupEntryDto)
  entries: SaveLineupEntryDto[];
}
```

---

### `apps/frontend/src/app/teams/games/games.service.ts` (service, request-response)

**Analog:** `apps/frontend/src/app/teams/players.service.ts`

**Imports pattern** (lines 1-4 of players.service.ts):
```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RuntimeConfigLoaderService } from 'runtime-config-loader';
```

**Injectable + inject() pattern** (lines 32-41 of players.service.ts):
```typescript
@Injectable({
  providedIn: 'root',
})
export class GamesService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(RuntimeConfigLoaderService);

  private get apiUrl(): string {
    return this.config.getConfigObjectKey('apiBaseUrl') as string;
  }
```

**Interface + HTTP method pattern** (lines 7-61 of players.service.ts — define interfaces above class, return Observables):
```typescript
export interface Game {
  id: string;
  seasonId: string;
  opponent: string;
  scheduledAt: string;
  location: string | null;
  uniformColor: string | null;
  status: 'scheduled' | 'in_progress' | 'completed';
}

export interface LineupEntry {
  id: string;
  gameId: string;
  playerId: string;
  positionName: string | null;
  status: 'starting' | 'bench';
}

// Service methods follow players.service.ts lines 43-60 pattern:
  getGames(teamId: string): Observable<Game[]> {
    return this.http.get<Game[]>(`${this.apiUrl}/teams/${teamId}/games`);
  }

  createGame(teamId: string, data: Partial<Game>): Observable<Game> {
    return this.http.post<Game>(`${this.apiUrl}/teams/${teamId}/games`, data);
  }

  updateGame(gameId: string, data: Partial<Game>): Observable<Game> {
    return this.http.patch<Game>(`${this.apiUrl}/games/${gameId}`, data);
  }

  deleteGame(gameId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/games/${gameId}`);
  }

  getLineup(gameId: string): Observable<LineupEntry[]> {
    return this.http.get<LineupEntry[]>(`${this.apiUrl}/games/${gameId}/lineup`);
  }

  saveLineup(gameId: string, entries: object[]): Observable<LineupEntry[]> {
    return this.http.post<LineupEntry[]>(`${this.apiUrl}/games/${gameId}/lineup`, { entries });
  }
```

---

### `apps/frontend/src/app/teams/team-dashboard/team-dashboard.ts` (modified, component, event-driven)

**Analog:** self — `apps/frontend/src/app/teams/team-dashboard/team-dashboard.ts`

**Add to imports array** (following lines 48-69 pattern — add new Ionic standalone components):
```typescript
import {
  IonSegment,
  IonSegmentButton,
  IonCard,
  IonCardContent,
  // ... existing imports
} from '@ionic/angular/standalone';
```

**Add to class** (following `protected players = signal<PlayerEntity[]>([])` on line 81):
```typescript
protected readonly gamesService = inject(GamesService);
protected selectedSegment = signal<'roster' | 'games'>('roster');
protected games = signal<Game[]>([]);
protected isGamesLoading = signal(false);
protected gamesError = signal<string | null>(null);
private gamesLoaded = false;

// Add computed signals for grouping (new pattern — computed() from Angular Signals):
protected upcomingGames = computed(() => {
  const now = new Date();
  return this.games()
    .filter(g => new Date(g.scheduledAt) >= now)
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
});

protected pastGames = computed(() => {
  const now = new Date();
  return this.games()
    .filter(g => new Date(g.scheduledAt) < now)
    .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());
});
```

**Segment change handler (new pattern):**
```typescript
protected onSegmentChange(event: CustomEvent): void {
  const val = event.detail.value as 'roster' | 'games';
  this.selectedSegment.set(val);
  if (val === 'games' && !this.gamesLoaded) {
    void this.loadGames(this.teamId);
    this.gamesLoaded = true;
  }
}
```

**loadGames method — follows `loadDashboard` pattern** (lines 103-118):
```typescript
protected async loadGames(teamId: string): Promise<void> {
  this.isGamesLoading.set(true);
  this.gamesError.set(null);
  try {
    const games = await firstValueFrom(this.gamesService.getGames(teamId));
    this.games.set(games);
  } catch {
    this.gamesError.set('Failed to load games. Please refresh.');
  } finally {
    this.isGamesLoading.set(false);
  }
}
```

**deleteGame — follows `deletePlayer` AlertController pattern** (lines 120-145):
```typescript
protected async deleteGame(gameId: string): Promise<void> {
  const alert = await this.alertCtrl.create({
    header: 'Delete Game?',
    message: 'This will also delete the starting lineup for this game.',
    buttons: [
      'Cancel',
      {
        text: 'Delete',
        role: 'confirm',
        handler: async () => {
          try {
            await firstValueFrom(this.gamesService.deleteGame(gameId));
            this.games.update((list) => list.filter((g) => g.id !== gameId));
          } catch {
            this.gamesError.set('Failed to delete game. Please try again.');
          }
        },
      },
    ],
  });
  await alert.present();
}
```

**Template changes — team-dashboard.html:**
Add `IonSegment` above the list (following team-dashboard.html line 15 pattern). Use `(ionChange)` not `(change)`:
```html
<ion-segment [value]="selectedSegment()" (ionChange)="onSegmentChange($event)">
  <ion-segment-button value="roster">Roster</ion-segment-button>
  <ion-segment-button value="games">Games</ion-segment-button>
</ion-segment>

@if (selectedSegment() === 'roster') {
  <!-- existing ion-list for players -->
}

@if (selectedSegment() === 'games') {
  @if (isGamesLoading()) {
    <ion-spinner name="crescent" />
  } @else {
    <!-- upcoming / past dividers using @if blocks -->
    <!-- IonItemSliding for each game (same pattern as players) -->
  }
  <!-- FAB or header button for creating a new game -->
}
```

Game list items follow `IonItemSliding` pattern from team-dashboard.html lines 29-51.

---

### `apps/frontend/src/app/teams/games/create-game/create-game.ts` (component, request-response)

**Analog:** `apps/frontend/src/app/teams/create-team/create-team.ts`

**Imports pattern** (lines 1-26 of create-team.ts — identical structure, add IonDatetime imports):
```typescript
import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import {
  IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonItem, IonInput, IonSelect, IonSelectOption, IonButton, IonText,
  IonSpinner, IonBackButton, IonButtons, IonHeader, IonToolbar, IonTitle,
  IonDatetime, IonDatetimeButton, IonModal, IonLabel,
} from '@ionic/angular/standalone';
import { ControlErrorsDisplayComponent } from 'ngx-reactive-forms-utils';
import { RuntimeConfigLoaderService } from 'runtime-config-loader';
import { GamesService } from '../games.service';
```

**Component decorator pattern** (lines 34-60 of create-team.ts):
```typescript
@Component({
  selector: 'app-create-game',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonItem, IonInput, IonSelect, IonSelectOption, IonButton, IonText,
    IonSpinner, IonBackButton, IonButtons, IonHeader, IonToolbar, IonTitle,
    IonDatetime, IonDatetimeButton, IonModal, IonLabel,
    ControlErrorsDisplayComponent,
  ],
  templateUrl: './create-game.html',
  styleUrl: './create-game.scss',
})
```

**Class body — inject() + signals + form pattern** (lines 61-80 of create-team.ts):
```typescript
export class CreateGame implements OnInit {
  private readonly config = inject(RuntimeConfigLoaderService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly gamesService = inject(GamesService);
  protected readonly fb = inject(FormBuilder);

  protected isSaving = signal(false);
  protected errorMessage = signal<string | null>(null);

  protected form = this.fb.group({
    opponent: ['', [Validators.required]],
    scheduledAt: ['', [Validators.required]],
    location: [''],
    uniformColor: [''],
  });
```

**submit() method pattern** (lines 103-121 of create-team.ts — note post-creation navigation to lineup):
```typescript
  protected async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const teamId = this.route.snapshot.paramMap.get('id');
    if (!teamId) return;

    this.isSaving.set(true);
    this.errorMessage.set(null);
    try {
      const data = this.form.getRawValue();
      const game = await firstValueFrom(this.gamesService.createGame(teamId, data));
      // Navigate to lineup editor immediately after creation (Claude's Discretion)
      await this.router.navigate(['/teams', teamId, 'games', game.id, 'lineup']);
    } catch {
      this.errorMessage.set('Failed to create game. Please try again.');
    } finally {
      this.isSaving.set(false);
    }
  }
```

**Template pattern for IonDatetime** (new Ionic pattern, not yet in codebase):
```html
<ion-item>
  <ion-label>Date & Time</ion-label>
  <ion-datetime-button datetime="game-datetime"></ion-datetime-button>
</ion-item>
<ion-modal [keepContentsMounted]="true">
  <ng-template>
    <ion-datetime
      id="game-datetime"
      presentation="date-time"
      formControlName="scheduledAt"
    ></ion-datetime>
  </ng-template>
</ion-modal>
```

All other form fields use `ngx-control-errors-display` wrapper — copy exact pattern from `apps/frontend/src/app/teams/create-team/create-team.html` lines 24-49.

---

### `apps/frontend/src/app/teams/games/edit-game/edit-game.ts` (component, request-response)

**Analog:** `apps/frontend/src/app/teams/edit-team/edit-team.ts`

**This is the closest exact match.** Copy the full structure from edit-team.ts.

**Key differences from edit-team:**
- `loadGame()` instead of `loadTeam()` — GET `/games/:gameId` (via GamesService)
- `form` has fields: `opponent`, `scheduledAt`, `location`, `uniformColor` (not just `name`)
- `submit()` calls `gamesService.updateGame(gameId, data)` (PATCH)
- Route param is `gameId` (from `:gameId`), not `id`

**Imports pattern** (lines 1-26 of edit-team.ts — add IonDatetime family):
```typescript
import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
// ... same Ionic imports as create-game.ts
import { GamesService } from '../games.service';
```

**loadGame — pre-populate form pattern** (lines 94-108 of edit-team.ts):
```typescript
  protected async loadGame(gameId: string): Promise<void> {
    this.isLoading.set(true);
    try {
      const data = await firstValueFrom(this.gamesService.getGame(gameId));
      this.form.patchValue({
        opponent: data.opponent,
        scheduledAt: data.scheduledAt,
        location: data.location ?? '',
        uniformColor: data.uniformColor ?? '',
      });
    } catch {
      this.errorMessage.set('Failed to load game. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }
```

---

### `apps/frontend/src/app/teams/games/lineup-editor/lineup-editor.ts` (component, CRUD)

**Analog:** `apps/frontend/src/app/teams/team-dashboard/team-dashboard.ts` (role-match — signal state + data loading)

**Imports pattern** (lines 1-31 of team-dashboard.ts, adapted for lineup-specific Ionic components):
```typescript
import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonButton, IonList, IonItem, IonLabel, IonSelect, IonSelectOption,
  IonText, IonSpinner,
} from '@ionic/angular/standalone';
import { RuntimeConfigLoaderService } from 'runtime-config-loader';
import { GamesService, LineupEntry } from '../games.service';
import { PlayersService, PlayerEntity } from '../../players.service';
```

**Signal state pattern** (lines 80-83 of team-dashboard.ts):
```typescript
protected players = signal<PlayerEntity[]>([]);
protected slots = signal<LineupSlot[]>(
  Array.from({ length: 11 }, (_, i) => ({ slotIndex: i, positionName: null, playerId: null }))
);
protected isLoading = signal(false);
protected isSaving = signal(false);
protected errorMessage = signal<string | null>(null);
```

**computed() signals — bench derivation (new pattern):**
```typescript
protected assignedPlayerIds = computed(() =>
  new Set(this.slots().map(s => s.playerId).filter(Boolean))
);

protected benchPlayers = computed(() =>
  this.players().filter(p => !this.assignedPlayerIds().has(p.id))
);
```

**Data loading — Promise.all pattern** (lines 107-117 of team-dashboard.ts):
```typescript
protected async loadData(teamId: string, gameId: string): Promise<void> {
  this.isLoading.set(true);
  try {
    const [lineup, players] = await Promise.all([
      firstValueFrom(this.gamesService.getLineup(gameId)),
      firstValueFrom(this.playersService.getPlayers(teamId)),
    ]);
    this.players.set(players);
    // Map lineup entries back onto slots
    if (lineup.length > 0) {
      this.slots.set(lineup
        .filter(e => e.status === 'starting')
        .map((e, i) => ({ slotIndex: i, positionName: e.positionName, playerId: e.playerId }))
      );
    }
  } catch {
    this.errorMessage.set('Failed to load lineup data. Please try again.');
  } finally {
    this.isLoading.set(false);
  }
}
```

**saveLineup — firstValueFrom pattern** (follows team-dashboard.ts lines 134-143 for try/catch shape):
```typescript
protected async saveLineup(): Promise<void> {
  const teamId = this.route.snapshot.paramMap.get('id') ?? '';
  const gameId = this.route.snapshot.paramMap.get('gameId') ?? '';

  this.isSaving.set(true);
  try {
    const starters = this.slots()
      .filter(s => s.playerId)
      .map(s => ({ playerId: s.playerId!, positionName: s.positionName, status: 'starting' as const }));
    const bench = this.benchPlayers()
      .map(p => ({ playerId: p.id, positionName: null, status: 'bench' as const }));

    await firstValueFrom(this.gamesService.saveLineup(gameId, [...starters, ...bench]));
    await this.router.navigate(['/teams', teamId]);
  } catch {
    this.errorMessage.set('Failed to save lineup. Please try again.');
  } finally {
    this.isSaving.set(false);
  }
}
```

---

### `apps/frontend/src/app/app.routes.ts` (modified, config)

**Analog:** self — `apps/frontend/src/app/app.routes.ts`

**Add inside the authenticated shell's `children` array** (lines 28-46 of app.routes.ts — follow the exact `loadComponent` pattern):
```typescript
{
  path: 'teams/:id/games/new',
  loadComponent: () =>
    import('./teams/games/create-game/create-game').then((m) => m.CreateGame),
},
{
  path: 'teams/:id/games/:gameId/edit',
  loadComponent: () =>
    import('./teams/games/edit-game/edit-game').then((m) => m.EditGame),
},
{
  path: 'teams/:id/games/:gameId/lineup',
  loadComponent: () =>
    import('./teams/games/lineup-editor/lineup-editor').then((m) => m.LineupEditor),
},
```

Note: These three routes must be placed **before** the `teams/:id` catch-all route (currently line 36) to prevent the dashboard route matching `:id` as `games`.

---

## Shared Patterns

### Authentication Guard
**Source:** `apps/api/src/players/players.controller.ts` lines 7-8
**Apply to:** `GamesController` (all routes)
```typescript
@UseGuards(AuthGuard('jwt'))
```

### Error Handling (NestJS service)
**Source:** `apps/api/src/players/players.service.ts` lines 28-37
**Apply to:** `GamesService`, `LineupEntriesService`
```typescript
const entity = await this.repo.findOne({ where: { id } });
if (!entity) throw new NotFoundException(`Entity ${id} not found`);
```

### Error Handling (Angular component)
**Source:** `apps/frontend/src/app/teams/team-dashboard/team-dashboard.ts` lines 103-118
**Apply to:** All Angular component async methods
```typescript
try {
  // await firstValueFrom(...)
} catch {
  this.errorMessage.set('Failed to [action]. Please try again.');
} finally {
  this.isLoading.set(false);
}
```

### inject() dependency injection
**Source:** `apps/frontend/src/app/teams/team-dashboard/team-dashboard.ts` lines 74-91
**Apply to:** ALL Angular components and services — no constructor injection
```typescript
private readonly router = inject(Router);
private readonly route = inject(ActivatedRoute);
private readonly config = inject(RuntimeConfigLoaderService);
```

### Signal-based state
**Source:** `apps/frontend/src/app/teams/team-dashboard/team-dashboard.ts` lines 80-83
**Apply to:** All Angular components with async data
```typescript
protected data = signal<T[]>([]);
protected isLoading = signal(false);
protected errorMessage = signal<string | null>(null);
```

### AlertController for destructive actions
**Source:** `apps/frontend/src/app/teams/team-dashboard/team-dashboard.ts` lines 120-145
**Apply to:** `team-dashboard.ts` deleteGame method
```typescript
const alert = await this.alertCtrl.create({
  header: '...',
  message: '...',
  buttons: ['Cancel', { text: 'Delete', role: 'confirm', handler: async () => { ... } }],
});
await alert.present();
```

### IonItemSliding for swipe-to-delete
**Source:** `apps/frontend/src/app/teams/team-dashboard/team-dashboard.html` lines 29-51
**Apply to:** Game list items in `team-dashboard.html`
```html
<ion-item-sliding>
  <ion-item>...</ion-item>
  <ion-item-options side="end">
    <ion-item-option color="danger" (click)="deleteGame(game.id)">
      <ion-icon slot="icon-only" name="trash-outline"></ion-icon>
    </ion-item-option>
  </ion-item-options>
</ion-item-sliding>
```

### Form validation error display
**Source:** `apps/frontend/src/app/teams/create-team/create-team.html` lines 24-35
**Apply to:** All form field `IonInput` and `IonSelect` elements in create-game and edit-game templates
```html
<ngx-control-errors-display>
  <ion-item>
    <ion-input label="..." labelPlacement="floating" formControlName="..." />
  </ion-item>
</ngx-control-errors-display>
```

### TypeORM Repository injection (API)
**Source:** `apps/api/src/players/players.service.ts` lines 10-13
**Apply to:** `GamesService`, `LineupEntriesService`
```typescript
constructor(
  @InjectRepository(EntityClass)
  private readonly repo: Repository<EntityClass>,
) {}
```

### apiUrl getter pattern (Angular service)
**Source:** `apps/frontend/src/app/teams/players.service.ts` lines 38-40
**Apply to:** `GamesService` (Angular)
```typescript
private get apiUrl(): string {
  return this.config.getConfigObjectKey('apiBaseUrl') as string;
}
```

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `apps/api/src/games/lineup-entries.service.ts` (bulk-replace method) | service | batch | No existing bulk delete+insert pattern in codebase — new pattern for Phase 5 |
| IonSegment tab-switch in template | component | event-driven | `IonSegment` + `(ionChange)` not yet used anywhere in codebase (ASSUMED from Ionic docs) |
| IonDatetime + IonDatetimeButton + IonModal combo | component | request-response | Not yet in codebase — no date picker exists (ASSUMED from Ionic docs) |

---

## Metadata

**Analog search scope:** `apps/api/src/`, `apps/frontend/src/`
**Files scanned:** 19 source files read directly
**Pattern extraction date:** 2026-04-17
**Migration timestamp note:** Latest existing migration is `1776466961975`. New migration must use a timestamp > this value. Use `Date.now()` at time of file creation.
