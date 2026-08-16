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
import { CandidateNoteEntity } from './entities/candidate-note.entity';
import { ScoutingRubricEntity } from './entities/scouting-rubric.entity';
import { SeasonPlayerEntity } from './entities/season-player.entity';
import { EventNoteEntity } from './entities/event-note.entity';
import { SeasonChecklistItemEntity } from './entities/season-checklist-item.entity';
import { SeasonChecklistValueEntity } from './entities/season-checklist-value.entity';
import { OpponentEntity } from './entities/opponent.entity';
import { PlayerAwardEntity } from './entities/player-award.entity';
import { PlayerGoalEntity } from './entities/player-goal.entity';
import { PlayerGoalNoteEntity } from './entities/player-goal-note.entity';

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
    CandidateNoteEntity,
    ScoutingRubricEntity,
    SeasonPlayerEntity,
    EventNoteEntity,
    SeasonChecklistItemEntity,
    SeasonChecklistValueEntity,
    OpponentEntity,
    PlayerAwardEntity,
    PlayerGoalEntity,
    PlayerGoalNoteEntity,
  ],
  migrations: ALL_MIGRATIONS,
  synchronize: false,
  migrationsTableName: 'migrations',
});
