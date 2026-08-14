import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsService } from './events.service';
import { LineupEntriesService } from './lineup-entries.service';
import { ICalService } from './ical.service';
import { WeatherService } from './weather.service';
import { GeminiService } from './recap/gemini.service';
import { MatchRecapService } from './recap/match-recap.service';
import { EventsController } from './events.controller';
import { EventEntity } from '../entities/event.entity';
import { EventNoteEntity } from '../entities/event-note.entity';
import { OpponentEntity } from '../entities/opponent.entity';
import { AttendanceEntity } from '../entities/attendance.entity';

import { SeasonEntity } from '../entities/season.entity';
import { TeamEntity } from '../entities/team.entity';
import { LocationEntity } from '../entities/location.entity';
import { LineupEntryEntity } from '../entities/lineup-entry.entity';
import { PlayerEntity } from '../entities/player.entity';
import { GameEventEntity } from '../entities/game-event.entity';
import { LeagueEntity } from '../entities/league.entity';
import { SocketModule } from '../socket/socket.module';
import { LocationsModule } from '../locations/locations.module';
import { AttendanceModule } from '../attendance/attendance.module';
import { MembershipsModule } from '../memberships/memberships.module';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EventEntity,
      SeasonEntity,
      TeamEntity,
      LocationEntity,
      LineupEntryEntity,
      PlayerEntity,
      GameEventEntity,
      EventNoteEntity,
      LeagueEntity,
      OpponentEntity,
      AttendanceEntity,
    ]),
    SocketModule,
    LocationsModule,
    AttendanceModule,
    MembershipsModule,
    AnalyticsModule,
  ],
  controllers: [EventsController],
  providers: [
    EventsService,
    LineupEntriesService,
    ICalService,
    WeatherService,
    GeminiService,
    MatchRecapService,
  ],
  exports: [
    EventsService,
    LineupEntriesService,
    ICalService,
    WeatherService,
    GeminiService,
    MatchRecapService,
  ],
})
export class EventsModule {}
