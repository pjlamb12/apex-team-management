import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ScoutingService } from './scouting.service';
import { ScoutingRubricEntity } from '../entities/scouting-rubric.entity';
import { CandidateEvaluationEntity } from '../entities/candidate-evaluation.entity';
import { CandidateNoteEntity } from '../entities/candidate-note.entity';
import { TeamRoleGuard } from '../auth/guards/team-role.guard';
import { TeamRoles } from '../auth/decorators/team-role.decorator';
import { TeamRole } from '@apex-team/shared/util/models';

@UseGuards(AuthGuard('jwt'), TeamRoleGuard)
@Controller('teams/:teamId/scouting')
export class ScoutingController {
  constructor(private readonly scoutingService: ScoutingService) {}

  // Rubrics
  @Get('rubrics')
  @TeamRoles(TeamRole.HEAD_COACH, TeamRole.ASSISTANT)
  async findAllRubrics(@Param('teamId') teamId: string): Promise<ScoutingRubricEntity[]> {
    return this.scoutingService.findAllRubrics(teamId);
  }

  @Post('rubrics')
  @TeamRoles(TeamRole.HEAD_COACH, TeamRole.ASSISTANT)
  async createRubric(
    @Param('teamId') teamId: string,
    @Body() data: Partial<ScoutingRubricEntity>,
  ): Promise<ScoutingRubricEntity> {
    return this.scoutingService.createRubric(teamId, data);
  }

  @Put('rubrics/:id')
  @TeamRoles(TeamRole.HEAD_COACH, TeamRole.ASSISTANT)
  async updateRubric(
    @Param('id') id: string,
    @Body() data: Partial<ScoutingRubricEntity>,
  ): Promise<ScoutingRubricEntity> {
    return this.scoutingService.updateRubric(id, data);
  }

  @Delete('rubrics/:id')
  @TeamRoles(TeamRole.HEAD_COACH)
  async removeRubric(@Param('id') id: string): Promise<void> {
    return this.scoutingService.removeRubric(id);
  }

  // Evaluations
  @Get('candidates/:candidateId/evaluations')
  @TeamRoles(TeamRole.HEAD_COACH, TeamRole.ASSISTANT)
  async findEvaluationsForCandidate(@Param('candidateId') candidateId: string): Promise<CandidateEvaluationEntity[]> {
    return this.scoutingService.findEvaluationsForCandidate(candidateId);
  }

  @Post('evaluations')
  @TeamRoles(TeamRole.HEAD_COACH, TeamRole.ASSISTANT)
  async recordEvaluation(
    @Request() req: any,
    @Body() data: Partial<CandidateEvaluationEntity>,
  ): Promise<CandidateEvaluationEntity> {
    return this.scoutingService.recordEvaluation(req.user.sub, data);
  }

  // Candidate Notes
  @Get('candidates/:candidateId/notes')
  @TeamRoles(TeamRole.HEAD_COACH, TeamRole.ASSISTANT)
  async findNotes(
    @Param('candidateId') candidateId: string,
  ): Promise<CandidateNoteEntity[]> {
    return this.scoutingService.findNotesForCandidate(candidateId);
  }

  @Post('candidates/:candidateId/notes')
  @TeamRoles(TeamRole.HEAD_COACH, TeamRole.ASSISTANT)
  async recordNote(
    @Param('candidateId') candidateId: string,
    @Body() data: { eventId?: string; content: string },
    @Request() req: any,
  ): Promise<CandidateNoteEntity> {
    return this.scoutingService.recordCandidateNote(req.user.sub, candidateId, data);
  }

  @Delete('notes/:id')
  @TeamRoles(TeamRole.HEAD_COACH, TeamRole.ASSISTANT)
  async deleteNote(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<void> {
    return this.scoutingService.deleteCandidateNote(req.user.sub, id);
  }
}
