import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CandidatesService } from './candidates.service';
import { CandidateEntity } from '../entities/candidate.entity';
import { CandidateAttendanceStatus } from '../entities/candidate-attendance.entity';
import { TeamRoleGuard } from '../auth/guards/team-role.guard';
import { TeamRoles } from '../auth/decorators/team-role.decorator';
import { TeamRole } from '@apex-team/shared/util/models';

@UseGuards(AuthGuard('jwt'), TeamRoleGuard)
@Controller('teams/:teamId/candidates')
export class CandidatesController {
  constructor(private readonly candidatesService: CandidatesService) {}

  @Get()
  @TeamRoles(TeamRole.HEAD_COACH, TeamRole.ASSISTANT)
  async findAll(@Param('teamId') teamId: string): Promise<CandidateEntity[]> {
    return this.candidatesService.findAll(teamId);
  }

  @Post()
  @TeamRoles(TeamRole.HEAD_COACH, TeamRole.ASSISTANT)
  async create(
    @Param('teamId') teamId: string,
    @Body() data: Partial<CandidateEntity>,
  ): Promise<CandidateEntity> {
    return this.candidatesService.create(teamId, data);
  }

  @Get(':id')
  @TeamRoles(TeamRole.HEAD_COACH, TeamRole.ASSISTANT)
  async findOne(@Param('id') id: string): Promise<CandidateEntity> {
    return this.candidatesService.findOne(id);
  }

  @Put(':id')
  @TeamRoles(TeamRole.HEAD_COACH, TeamRole.ASSISTANT)
  async update(
    @Param('id') id: string,
    @Body() data: Partial<CandidateEntity>,
  ): Promise<CandidateEntity> {
    return this.candidatesService.update(id, data);
  }

  @Delete(':id')
  @TeamRoles(TeamRole.HEAD_COACH)
  async remove(@Param('id') id: string): Promise<void> {
    return this.candidatesService.remove(id);
  }

  @Post(':id/promote')
  @TeamRoles(TeamRole.HEAD_COACH, TeamRole.ASSISTANT)
  async promote(
    @Param('teamId') teamId: string, 
    @Param('id') id: string,
    @Body('seasonId') seasonId?: string
  ): Promise<any> {
    return this.candidatesService.promote(teamId, id, seasonId);
  }

  @Get('events/:eventId/attendance')
  @TeamRoles(TeamRole.HEAD_COACH, TeamRole.ASSISTANT)
  async getAttendance(@Param('eventId') eventId: string) {
    return this.candidatesService.getAttendance(eventId);
  }

  @Post(':id/events/:eventId/attendance')
  @TeamRoles(TeamRole.HEAD_COACH, TeamRole.ASSISTANT)
  async markAttendance(
    @Param('id') id: string,
    @Param('eventId') eventId: string,
    @Body('status') status: CandidateAttendanceStatus,
    @Body('notes') notes?: string,
  ) {
    return this.candidatesService.markAttendance(id, eventId, status, notes);
  }
}
