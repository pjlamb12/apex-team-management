import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsService } from './events.service';
import { LineupEntriesService } from './lineup-entries.service';
import { EventsController } from './events.controller';
import { EventEntity } from '../entities/event.entity';
import { SeasonEntity } from '../entities/season.entity';
import { TeamEntity } from '../entities/team.entity';
import { LineupEntryEntity } from '../entities/lineup-entry.entity';
import { PlayerEntity } from '../entities/player.entity';
import { GameEventEntity } from '../entities/game-event.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EventEntity,
      SeasonEntity,
      TeamEntity,
      LineupEntryEntity,
      PlayerEntity,
      GameEventEntity,
    ]),
  ],
  controllers: [EventsController],
  providers: [EventsService, LineupEntriesService],
  exports: [EventsService, LineupEntriesService],
})
export class EventsModule {}
