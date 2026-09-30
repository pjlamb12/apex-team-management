import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LeaguesService } from './leagues.service';
import { CreateLeagueDto } from './dto/create-league.dto';
import { UpdateLeagueDto } from './dto/update-league.dto';
import { TeamRoleGuard } from '../auth/guards/team-role.guard';
import { TeamRoles } from '../auth/decorators/team-role.decorator';
import { TeamRole } from '@apex-team/shared/util/models';

@UseGuards(AuthGuard('jwt'), TeamRoleGuard)
@Controller()
export class LeaguesController {
  constructor(private readonly leaguesService: LeaguesService) {}

  @Post('seasons/:seasonId/leagues')
  @TeamRoles(TeamRole.HEAD_COACH)
  create(
    @Param('seasonId', ParseUUIDPipe) seasonId: string,
    @Body() dto: CreateLeagueDto,
  ) {
    return this.leaguesService.create(seasonId, dto);
  }

  @Get('seasons/:seasonId/leagues')
  @TeamRoles(TeamRole.HEAD_COACH, TeamRole.ASSISTANT)
  findAll(@Param('seasonId', ParseUUIDPipe) seasonId: string) {
    return this.leaguesService.findAllForSeason(seasonId);
  }

  @Get('leagues/:id')
  @TeamRoles(TeamRole.HEAD_COACH, TeamRole.ASSISTANT)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.leaguesService.findOne(id);
  }

  @Patch('leagues/:id')
  @TeamRoles(TeamRole.HEAD_COACH)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLeagueDto,
  ) {
    return this.leaguesService.update(id, dto);
  }

  @Delete('leagues/:id')
  @TeamRoles(TeamRole.HEAD_COACH)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.leaguesService.remove(id);
  }
}
