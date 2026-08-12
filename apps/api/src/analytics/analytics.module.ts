import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { PlayingTimeService } from './playing-time.service';
import { PlayingTimeValidationService } from './playing-time-validation.service';
import { PerformanceMetricsService } from './performance-metrics.service';
import { PlayerAnalyticsService } from './player-analytics.service';
import { CsvExportService } from './export/csv-export.service';
import { PdfExportService } from './export/pdf-export.service';
import { LlmExportService } from './export/llm-export.service';
import { EventEntity } from '../entities/event.entity';
import { GameEventEntity } from '../entities/game-event.entity';
import { LineupEntryEntity } from '../entities/lineup-entry.entity';
import { PlayerEntity } from '../entities/player.entity';
import { AttendanceEntity } from '../entities/attendance.entity';
import { PracticeDrillEntity } from '../entities/practice-drill.entity';
import { DrillEntity } from '../entities/drill.entity';
import { EventNoteEntity } from '../entities/event-note.entity';
import { TeamEntity } from '../entities/team.entity';
import { SeasonEntity } from '../entities/season.entity';
import { LeagueEntity } from '../entities/league.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EventEntity,
      GameEventEntity,
      LineupEntryEntity,
      PlayerEntity,
      AttendanceEntity,
      PracticeDrillEntity,
      DrillEntity,
      EventNoteEntity,
      TeamEntity,
      SeasonEntity,
      LeagueEntity,
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [
    PlayingTimeService,
    PlayingTimeValidationService,
    PerformanceMetricsService,
    PlayerAnalyticsService,
    CsvExportService,
    PdfExportService,
    LlmExportService,
  ],
  exports: [
    PlayingTimeService,
    PlayingTimeValidationService,
    PerformanceMetricsService,
    PlayerAnalyticsService,
    CsvExportService,
    PdfExportService,
    LlmExportService,
  ],
})
export class AnalyticsModule {}

