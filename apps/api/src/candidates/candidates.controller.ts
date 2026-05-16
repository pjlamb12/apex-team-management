import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { CandidatesService } from './candidates.service';
import { CandidateEntity } from '../entities/candidate.entity';
import { CandidateAttendanceStatus } from '../entities/candidate-attendance.entity';

@Controller('teams/:teamId/candidates')
export class CandidatesController {
  constructor(private readonly candidatesService: CandidatesService) {}

  @Get()
  async findAll(@Param('teamId') teamId: string): Promise<CandidateEntity[]> {
    return this.candidatesService.findAll(teamId);
  }

  @Post()
  async create(
    @Param('teamId') teamId: string,
    @Body() data: Partial<CandidateEntity>,
  ): Promise<CandidateEntity> {
    return this.candidatesService.create(teamId, data);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<CandidateEntity> {
    return this.candidatesService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() data: Partial<CandidateEntity>,
  ): Promise<CandidateEntity> {
    return this.candidatesService.update(id, data);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.candidatesService.remove(id);
  }

  @Post(':id/promote')
  async promote(@Param('teamId') teamId: string, @Param('id') id: string): Promise<any> {
    return this.candidatesService.promote(teamId, id);
  }

  @Get('events/:eventId/attendance')
  async getAttendance(@Param('eventId') eventId: string) {
    return this.candidatesService.getAttendance(eventId);
  }

  @Post(':id/events/:eventId/attendance')
  async markAttendance(
    @Param('id') id: string,
    @Param('eventId') eventId: string,
    @Body('status') status: CandidateAttendanceStatus,
    @Body('notes') notes?: string,
  ) {
    return this.candidatesService.markAttendance(id, eventId, status, notes);
  }
}
