import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsService } from './events.service';
import { LineupEntriesService } from './lineup-entries.service';
import { ICalService } from './ical.service';
import { WeatherService } from './weather.service';
import { EventsController } from './events.controller';
import { EventEntity } from '../entities/event.entity';
import { SeasonEntity } from '../entities/season.entity';
import { TeamEntity } from '../entities/team.entity';
import { LocationEntity } from '../entities/location.entity';
import { LineupEntryEntity } from '../entities/lineup-entry.entity';
import { PlayerEntity } from '../entities/player.entity';
import { GameEventEntity } from '../entities/game-event.entity';
import { SocketModule } from '../socket/socket.module';
import { LocationsModule } from '../locations/locations.module';
import { AttendanceModule } from '../attendance/attendance.module';
import { MembershipsModule } from '../memberships/memberships.module';

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
    ]),
    SocketModule,
    LocationsModule,
    AttendanceModule,
    MembershipsModule,
  ],
  controllers: [EventsController],
  providers: [EventsService, LineupEntriesService, ICalService, WeatherService],
  exports: [EventsService, LineupEntriesService, ICalService, WeatherService],
})
export class EventsModule {}
