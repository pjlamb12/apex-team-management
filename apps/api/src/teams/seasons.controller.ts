import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, ParseUUIDPipe, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SeasonsService } from './seasons.service';
import { CreateSeasonDto } from './dto/create-season.dto';
import { UpdateSeasonDto } from './dto/update-season.dto';
import { TeamRoleGuard } from '../auth/guards/team-role.guard';
import { TeamRoles } from '../auth/decorators/team-role.decorator';
import { TeamRole } from '@apex-team/shared/util/models';

@UseGuards(AuthGuard('jwt'), TeamRoleGuard)
@Controller()
export class SeasonsController {
  constructor(private readonly seasonsService: SeasonsService) {}

  @Post('teams/:teamId/seasons')
  @TeamRoles(TeamRole.HEAD_COACH)
  create(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Body() dto: CreateSeasonDto,
  ) {
    return this.seasonsService.create({ ...dto, teamId });
  }

  @Get('teams/:teamId/seasons')
  @TeamRoles(TeamRole.HEAD_COACH, TeamRole.ASSISTANT)
  findAll(@Param('teamId', ParseUUIDPipe) teamId: string) {
    return this.seasonsService.findAllForTeam(teamId);
  }

  @Get('seasons/:id')
  @TeamRoles(TeamRole.HEAD_COACH, TeamRole.ASSISTANT)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.seasonsService.findOne(id);
  }

  @Patch('seasons/:id')
  @TeamRoles(TeamRole.HEAD_COACH)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSeasonDto,
  ) {
    return this.seasonsService.update(id, dto);
  }

  @Delete('seasons/:id')
  @TeamRoles(TeamRole.HEAD_COACH)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.seasonsService.remove(id);
  }

  @Get('teams/:teamId/seasons/active')
  @TeamRoles(TeamRole.HEAD_COACH, TeamRole.ASSISTANT)
  findActive(@Param('teamId', ParseUUIDPipe) teamId: string) {
    return this.seasonsService.findActiveForTeam(teamId);
  }

  @Get('teams/:teamId/seasons/:seasonId/stats')
  @TeamRoles(TeamRole.HEAD_COACH, TeamRole.ASSISTANT)
  getStats(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Param('seasonId', ParseUUIDPipe) seasonId: string,
    @Query('leagueId') leagueId?: string,
  ) {
    return this.seasonsService.getSeasonStats(teamId, seasonId, leagueId);
  }
}
