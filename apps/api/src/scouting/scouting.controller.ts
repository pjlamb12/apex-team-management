import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ScoutingService } from './scouting.service';
import { ScoutingRubricEntity } from '../entities/scouting-rubric.entity';
import { CandidateEvaluationEntity } from '../entities/candidate-evaluation.entity';
import { AuthGuard } from '@nestjs/passport';

@Controller('teams/:teamId/scouting')
export class ScoutingController {
  constructor(private readonly scoutingService: ScoutingService) {}

  // Rubrics
  @Get('rubrics')
  async findAllRubrics(@Param('teamId') teamId: string): Promise<ScoutingRubricEntity[]> {
    return this.scoutingService.findAllRubrics(teamId);
  }

  @Post('rubrics')
  async createRubric(
    @Param('teamId') teamId: string,
    @Body() data: Partial<ScoutingRubricEntity>,
  ): Promise<ScoutingRubricEntity> {
    return this.scoutingService.createRubric(teamId, data);
  }

  @Put('rubrics/:id')
  async updateRubric(
    @Param('id') id: string,
    @Body() data: Partial<ScoutingRubricEntity>,
  ): Promise<ScoutingRubricEntity> {
    return this.scoutingService.updateRubric(id, data);
  }

  @Delete('rubrics/:id')
  async removeRubric(@Param('id') id: string): Promise<void> {
    return this.scoutingService.removeRubric(id);
  }

  // Evaluations
  @Get('candidates/:candidateId/evaluations')
  async findEvaluationsForCandidate(@Param('candidateId') candidateId: string): Promise<CandidateEvaluationEntity[]> {
    return this.scoutingService.findEvaluationsForCandidate(candidateId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('evaluations')
  async recordEvaluation(
    @Request() req: any,
    @Body() data: Partial<CandidateEvaluationEntity>,
  ): Promise<CandidateEvaluationEntity> {
    return this.scoutingService.recordEvaluation(req.user.sub, data);
  }
}
