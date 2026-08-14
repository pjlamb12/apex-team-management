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
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OpponentsService } from './opponents.service';
import { CreateOpponentDto } from './dto/create-opponent.dto';
import { UpdateOpponentDto } from './dto/update-opponent.dto';
import { CreateScoutingNoteDto } from './dto/create-scouting-note.dto';
import { TeamRoleGuard } from '../auth/guards/team-role.guard';
import { TeamRoles } from '../auth/decorators/team-role.decorator';
import { TeamRole } from '@apex-team/shared/util/models';

@UseGuards(AuthGuard('jwt'))
@Controller('teams/:teamId/opponents')
export class OpponentsController {
  constructor(private readonly opponentsService: OpponentsService) {}

  @Get()
  findAll(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Query('search') search?: string,
    @Query('threatLevel') threatLevel?: string,
  ) {
    return this.opponentsService.findAllForTeam(teamId, { search, threatLevel });
  }

  @Post()
  @UseGuards(TeamRoleGuard)
  @TeamRoles(TeamRole.HEAD_COACH, TeamRole.ASSISTANT)
  create(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Body() dto: CreateOpponentDto,
  ) {
    return this.opponentsService.create(teamId, dto);
  }

  @Get(':opponentId')
  findOne(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Param('opponentId', ParseUUIDPipe) opponentId: string,
  ) {
    return this.opponentsService.findOne(teamId, opponentId);
  }

  @Patch(':opponentId')
  @UseGuards(TeamRoleGuard)
  @TeamRoles(TeamRole.HEAD_COACH, TeamRole.ASSISTANT)
  update(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Param('opponentId', ParseUUIDPipe) opponentId: string,
    @Body() dto: UpdateOpponentDto,
  ) {
    return this.opponentsService.update(teamId, opponentId, dto);
  }

  @Delete(':opponentId')
  @UseGuards(TeamRoleGuard)
  @TeamRoles(TeamRole.HEAD_COACH)
  remove(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Param('opponentId', ParseUUIDPipe) opponentId: string,
  ) {
    return this.opponentsService.remove(teamId, opponentId);
  }

  @Post(':opponentId/scouting-notes')
  @UseGuards(TeamRoleGuard)
  @TeamRoles(TeamRole.HEAD_COACH, TeamRole.ASSISTANT)
  addScoutingNote(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Param('opponentId', ParseUUIDPipe) opponentId: string,
    @Request() req: { user?: { displayName?: string; email?: string } },
    @Body() dto: CreateScoutingNoteDto,
  ) {
    const authorName = req.user?.displayName || req.user?.email || 'Coach';
    return this.opponentsService.addScoutingNote(teamId, opponentId, authorName, dto);
  }

  @Delete(':opponentId/scouting-notes/:noteId')
  @UseGuards(TeamRoleGuard)
  @TeamRoles(TeamRole.HEAD_COACH, TeamRole.ASSISTANT)
  deleteScoutingNote(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Param('opponentId', ParseUUIDPipe) opponentId: string,
    @Param('noteId') noteId: string,
  ) {
    return this.opponentsService.deleteScoutingNote(teamId, opponentId, noteId);
  }
}
