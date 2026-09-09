import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PlayersService } from './players.service';
import { CreatePlayerDto } from './dto/create-player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';
import { TeamRoleGuard } from '../auth/guards/team-role.guard';
import { TeamRoles } from '../auth/decorators/team-role.decorator';
import { TeamRole } from '@apex-team/shared/util/models';

@UseGuards(AuthGuard('jwt'), TeamRoleGuard)
@Controller('teams/:teamId/players')
export class PlayersController {
  constructor(private readonly playersService: PlayersService) {}

  @Get()
  @TeamRoles(TeamRole.HEAD_COACH, TeamRole.ASSISTANT)
  findAll(@Param('teamId') teamId: string, @Query('includeInactive') includeInactive?: string) {
    return this.playersService.findAllForTeam(teamId, includeInactive === 'true');
  }

  @Get('seasons/:seasonId')
  @TeamRoles(TeamRole.HEAD_COACH, TeamRole.ASSISTANT)
  findAllForSeason(@Param('seasonId') seasonId: string, @Query('includeInactive') includeInactive?: string) {
    return this.playersService.findAllForSeason(seasonId, includeInactive === 'true');
  }

  @Get('leagues/:leagueId')
  @TeamRoles(TeamRole.HEAD_COACH, TeamRole.ASSISTANT)
  findAllForLeague(@Param('leagueId') leagueId: string) {
    return this.playersService.findAllForLeague(leagueId);
  }

  @Post()
  @TeamRoles(TeamRole.HEAD_COACH, TeamRole.ASSISTANT)
  create(@Param('teamId') teamId: string, @Body() data: CreatePlayerDto & { seasonId?: string; leagueId?: string }) {
    return this.playersService.create(teamId, data);
  }

  @Post('leagues/:leagueId')
  @TeamRoles(TeamRole.HEAD_COACH, TeamRole.ASSISTANT)
  createForLeague(
    @Param('teamId') teamId: string,
    @Param('leagueId') leagueId: string,
    @Body() data: CreatePlayerDto,
  ) {
    return this.playersService.create(teamId, { ...data, leagueId, isGuest: true });
  }

  @Post('seasons/:seasonId/:playerId')
  @TeamRoles(TeamRole.HEAD_COACH, TeamRole.ASSISTANT)
  addPlayerToSeason(@Param('seasonId') seasonId: string, @Param('playerId') playerId: string) {
    return this.playersService.addPlayerToSeason(seasonId, playerId);
  }

  @Delete('seasons/:seasonId/:playerId')
  @TeamRoles(TeamRole.HEAD_COACH)
  removePlayerFromSeason(@Param('seasonId') seasonId: string, @Param('playerId') playerId: string) {
    return this.playersService.removePlayerFromSeason(seasonId, playerId);
  }

  @Patch(':id')
  @TeamRoles(TeamRole.HEAD_COACH, TeamRole.ASSISTANT)
  update(@Param('teamId') teamId: string, @Param('id') id: string, @Body() data: UpdatePlayerDto) {
    return this.playersService.update(teamId, id, data);
  }

  @Delete(':id')
  @TeamRoles(TeamRole.HEAD_COACH)
  remove(@Param('teamId') teamId: string, @Param('id') id: string) {
    return this.playersService.remove(teamId, id);
  }
}
