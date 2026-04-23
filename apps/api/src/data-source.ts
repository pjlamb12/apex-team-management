import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import { SportEntity } from './entities/sport.entity';
import { UserEntity } from './entities/user.entity';
import { TeamEntity } from './entities/team.entity';
import { PlayerEntity } from './entities/player.entity';
import { SeasonEntity } from './entities/season.entity';
import { EventEntity } from './entities/event.entity';
import { GameEventEntity } from './entities/game-event.entity';
import { LineupEntryEntity } from './entities/lineup-entry.entity';
import { DrillEntity } from './entities/drill.entity';
import { TagEntity } from './entities/tag.entity';

export default new DataSource({
  type: 'postgres',
  host: process.env['DB_HOST'] || 'localhost',
  port: parseInt(process.env['DB_PORT'] || '5433', 10),
  username: process.env['DB_USERNAME'] || 'postgres',
  password: process.env['DB_PASSWORD'] || 'postgres',
  database: process.env['DB_NAME'] || 'apex_team',
  entities: [
    SportEntity,
    UserEntity,
    TeamEntity,
    PlayerEntity,
    SeasonEntity,
    EventEntity,
    GameEventEntity,
    LineupEntryEntity,
    DrillEntity,
    TagEntity,
  ],
  migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
  synchronize: false,
  migrationsTableName: 'migrations',
});
