import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { PlayingTimeService } from './playing-time.service';
import { PlayingTimeValidationService } from './playing-time-validation.service';
import { PerformanceMetricsService } from './performance-metrics.service';
import { PlayerAnalyticsService } from './player-analytics.service';
import { CsvExportService } from './export/csv-export.service';
import { PdfExportService } from './export/pdf-export.service';
import { EventEntity } from '../entities/event.entity';
import { GameEventEntity } from '../entities/game-event.entity';
import { LineupEntryEntity } from '../entities/lineup-entry.entity';
import { PlayerEntity } from '../entities/player.entity';
import { AttendanceEntity } from '../entities/attendance.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EventEntity, 
      GameEventEntity, 
      LineupEntryEntity, 
      PlayerEntity, 
      AttendanceEntity
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [
    PlayingTimeService,
    PlayingTimeValidationService,
    PerformanceMetricsService,
    PlayerAnalyticsService,
    CsvExportService,
    PdfExportService
  ],
  exports: [
    PlayingTimeService,
    PlayingTimeValidationService,
    PerformanceMetricsService,
    PlayerAnalyticsService,
    CsvExportService,
    PdfExportService
  ],
})
export class AnalyticsModule {}
