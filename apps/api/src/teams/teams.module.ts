import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeamsController } from './teams.controller';
import { SeasonsController } from './seasons.controller';
import { TeamsService } from './teams.service';
import { TeamsJoinCodeService } from './teams.join-code.service';
import { SeasonsService } from './seasons.service';
import { TeamEntity } from '../entities/team.entity';
import { TeamMemberEntity } from '../entities/team-member.entity';
import { SeasonEntity } from '../entities/season.entity';
import { LocationEntity } from '../entities/location.entity';
import { MembershipsModule } from '../memberships/memberships.module';
import { EventsModule } from '../events/events.module';
import { LocationsModule } from '../locations/locations.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TeamEntity, TeamMemberEntity, SeasonEntity, LocationEntity]),
    MembershipsModule,
    EventsModule,
    LocationsModule,
  ],
  controllers: [TeamsController, SeasonsController],
  providers: [TeamsService, TeamsJoinCodeService, SeasonsService],
  exports: [TeamsService, SeasonsService],
})
export class TeamsModule {}
