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
import { PracticeDrillEntity } from './entities/practice-drill.entity';
import { TeamMemberEntity } from './entities/team-member.entity';
import { LocationEntity } from './entities/location.entity';
import { AttendanceEntity } from './entities/attendance.entity';
import { LeagueEntity } from './entities/league.entity';
import { CandidateEntity } from './entities/candidate.entity';
import { CandidateAttendanceEntity } from './entities/candidate-attendance.entity';
import { CandidateEvaluationEntity } from './entities/candidate-evaluation.entity';
import { ScoutingRubricEntity } from './entities/scouting-rubric.entity';
import { SeasonPlayerEntity } from './entities/season-player.entity';
import { ALL_MIGRATIONS } from '../migrations';

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
    PracticeDrillEntity,
    TeamMemberEntity,
    LocationEntity,
    AttendanceEntity,
    LeagueEntity,
    CandidateEntity,
    CandidateAttendanceEntity,
    CandidateEvaluationEntity,
    ScoutingRubricEntity,
    SeasonPlayerEntity,
  ],
  migrations: ALL_MIGRATIONS,
  synchronize: false,
  migrationsTableName: 'migrations',
});
