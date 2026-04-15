import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import { SportEntity } from './entities/sport.entity';
import { UserEntity } from './entities/user.entity';
import { TeamEntity } from './entities/team.entity';
import { PlayerEntity } from './entities/player.entity';
import { SeasonEntity } from './entities/season.entity';
import { GameEntity } from './entities/game.entity';
import { GameEventEntity } from './entities/game-event.entity';

export default new DataSource({
  type: 'postgres',
  host: process.env['DB_HOST'] || 'localhost',
  port: parseInt(process.env['DB_PORT'] || '5433', 10),
  username: process.env['DB_USERNAME'] || 'postgres',
  password: process.env['DB_PASSWORD'] || 'postgres',
  database: process.env['DB_NAME'] || 'apex_team',
  entities: [SportEntity, UserEntity, TeamEntity, PlayerEntity, SeasonEntity, GameEntity, GameEventEntity],
  migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
  synchronize: false,
  migrationsTableName: 'migrations',
});
