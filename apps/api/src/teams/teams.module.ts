import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeamsController } from './teams.controller';
import { SeasonsController } from './seasons.controller';
import { LeaguesController } from './leagues.controller';
import { TeamsService } from './teams.service';
import { TeamsJoinCodeService } from './teams.join-code.service';
import { SeasonsService } from './seasons.service';
import { LeaguesService } from './leagues.service';
import { SeasonChecklistController } from './season-checklist.controller';
import { SeasonChecklistService } from './season-checklist.service';
import { TeamEntity } from '../entities/team.entity';
import { TeamMemberEntity } from '../entities/team-member.entity';
import { SeasonEntity } from '../entities/season.entity';
import { LocationEntity } from '../entities/location.entity';
import { LeagueEntity } from '../entities/league.entity';
import { SeasonChecklistItemEntity } from '../entities/season-checklist-item.entity';
import { SeasonChecklistValueEntity } from '../entities/season-checklist-value.entity';
import { MembershipsModule } from '../memberships/memberships.module';
import { EventsModule } from '../events/events.module';
import { LocationsModule } from '../locations/locations.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TeamEntity, 
      TeamMemberEntity, 
      SeasonEntity, 
      LocationEntity,
      LeagueEntity,
      SeasonChecklistItemEntity,
      SeasonChecklistValueEntity,
    ]),
    MembershipsModule,
    EventsModule,
    LocationsModule,
  ],
  controllers: [TeamsController, SeasonsController, LeaguesController, SeasonChecklistController],
  providers: [TeamsService, TeamsJoinCodeService, SeasonsService, LeaguesService, SeasonChecklistService],
  exports: [TeamsService, SeasonsService, LeaguesService, SeasonChecklistService],
})
export class TeamsModule {}
