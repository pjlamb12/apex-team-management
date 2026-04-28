import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeamsController } from './teams.controller';
import { SeasonsController } from './seasons.controller';
import { TeamsService } from './teams.service';
import { TeamsJoinCodeService } from './teams.join-code.service';
import { SeasonsService } from './seasons.service';
import { TeamEntity } from '../entities/team.entity';
import { SeasonEntity } from '../entities/season.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TeamEntity, SeasonEntity])],
  controllers: [TeamsController, SeasonsController],
  providers: [TeamsService, TeamsJoinCodeService, SeasonsService],
  exports: [SeasonsService],
})
export class TeamsModule {}
