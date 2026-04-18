import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GamesService } from './games.service';
import { LineupEntriesService } from './lineup-entries.service';
import { GamesController } from './games.controller';
import { GameEntity } from '../entities/game.entity';
import { SeasonEntity } from '../entities/season.entity';
import { TeamEntity } from '../entities/team.entity';
import { LineupEntryEntity } from '../entities/lineup-entry.entity';
import { PlayerEntity } from '../entities/player.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GameEntity,
      SeasonEntity,
      TeamEntity,
      LineupEntryEntity,
      PlayerEntity,
    ]),
  ],
  controllers: [GamesController],
  providers: [GamesService, LineupEntriesService],
  exports: [GamesService, LineupEntriesService],
})
export class GamesModule {}
