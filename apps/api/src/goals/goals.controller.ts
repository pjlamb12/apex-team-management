import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GoalsService } from './goals.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { CreateGoalNoteDto } from './dto/create-goal-note.dto';
import { TeamRoleGuard } from '../auth/guards/team-role.guard';
import { TeamRoles } from '../auth/decorators/team-role.decorator';
import { TeamRole } from '@apex-team/shared/util/models';

@UseGuards(AuthGuard('jwt'), TeamRoleGuard)
@Controller('teams/:teamId')
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Get('goals')
  @TeamRoles(TeamRole.HEAD_COACH, TeamRole.ASSISTANT)
  findAll(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Query('seasonId') seasonId?: string,
    @Query('playerId') playerId?: string,
    @Query('category') category?: string,
    @Query('status') status?: string,
  ) {
    return this.goalsService.findAll(teamId, {
      seasonId,
      playerId,
      category,
      status,
    });
  }

  @Get('goals/summary')
  @TeamRoles(TeamRole.HEAD_COACH, TeamRole.ASSISTANT)
  getSummary(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Query('seasonId') seasonId?: string,
  ) {
    return this.goalsService.getSummary(teamId, seasonId);
  }

  @Get('players/:playerId/goals')
  @TeamRoles(TeamRole.HEAD_COACH, TeamRole.ASSISTANT)
  findByPlayer(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Param('playerId', ParseUUIDPipe) playerId: string,
    @Query('seasonId') seasonId?: string,
  ) {
    return this.goalsService.findByPlayer(teamId, playerId, seasonId);
  }

  @Get('goals/:goalId')
  @TeamRoles(TeamRole.HEAD_COACH, TeamRole.ASSISTANT)
  findOne(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Param('goalId', ParseUUIDPipe) goalId: string,
  ) {
    return this.goalsService.findOne(teamId, goalId);
  }

  @Post('players/:playerId/goals')
  @TeamRoles(TeamRole.HEAD_COACH, TeamRole.ASSISTANT)
  create(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Param('playerId', ParseUUIDPipe) playerId: string,
    @Body() dto: CreateGoalDto,
  ) {
    return this.goalsService.create(teamId, playerId, dto);
  }

  @Patch('goals/:goalId')
  @TeamRoles(TeamRole.HEAD_COACH, TeamRole.ASSISTANT)
  update(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Param('goalId', ParseUUIDPipe) goalId: string,
    @Body() dto: UpdateGoalDto,
  ) {
    return this.goalsService.update(teamId, goalId, dto);
  }

  @Delete('goals/:goalId')
  @TeamRoles(TeamRole.HEAD_COACH, TeamRole.ASSISTANT)
  delete(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Param('goalId', ParseUUIDPipe) goalId: string,
  ) {
    return this.goalsService.remove(teamId, goalId);
  }

  @Post('goals/:goalId/notes')
  @TeamRoles(TeamRole.HEAD_COACH, TeamRole.ASSISTANT)
  addNote(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Param('goalId', ParseUUIDPipe) goalId: string,
    @Body() dto: CreateGoalNoteDto,
  ) {
    return this.goalsService.addNote(teamId, goalId, dto);
  }

  @Delete('goals/:goalId/notes/:noteId')
  @TeamRoles(TeamRole.HEAD_COACH, TeamRole.ASSISTANT)
  deleteNote(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Param('goalId', ParseUUIDPipe) goalId: string,
    @Param('noteId', ParseUUIDPipe) noteId: string,
  ) {
    return this.goalsService.removeNote(teamId, goalId, noteId);
  }
}
