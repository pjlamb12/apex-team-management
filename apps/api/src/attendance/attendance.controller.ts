import { Controller, Get, Post, Body, Param, UseGuards, ParseUUIDPipe, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AttendanceService } from './attendance.service';
import { UpdateAttendanceDto, BatchUpdateAttendanceDto } from './dto/update-attendance.dto';
import { TeamRoleGuard } from '../auth/guards/team-role.guard';
import { TeamRoles } from '../auth/decorators/team-role.decorator';
import { TeamRole } from '@apex-team/shared/util/models';

@UseGuards(AuthGuard('jwt'), TeamRoleGuard)
@Controller('teams/:teamId')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get('events/:eventId/attendance')
  @TeamRoles(TeamRole.HEAD_COACH, TeamRole.ASSISTANT)
  findAll(@Param('eventId', ParseUUIDPipe) eventId: string) {
    return this.attendanceService.findAllForEvent(eventId);
  }

  @Post('events/:eventId/attendance')
  @TeamRoles(TeamRole.HEAD_COACH, TeamRole.ASSISTANT)
  update(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Body() dto: UpdateAttendanceDto,
  ) {
    return this.attendanceService.update(eventId, dto);
  }

  @Post('events/:eventId/attendance/batch')
  @TeamRoles(TeamRole.HEAD_COACH, TeamRole.ASSISTANT)
  batchUpdate(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Body() dto: BatchUpdateAttendanceDto,
  ) {
    return this.attendanceService.batchUpdate(eventId, dto);
  }

  @Post('events/:eventId/attendance/sync')
  @TeamRoles(TeamRole.HEAD_COACH, TeamRole.ASSISTANT)
  syncFromLineup(@Param('eventId', ParseUUIDPipe) eventId: string) {
    return this.attendanceService.syncFromLineup(eventId);
  }

  @Get('participation')
  @TeamRoles(TeamRole.HEAD_COACH, TeamRole.ASSISTANT)
  getParticipation(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Query('seasonId') seasonId?: string,
    @Query('leagueId') leagueId?: string,
    @Query('eventType') eventType?: 'game' | 'practice' | 'all',
  ) {
    return this.attendanceService.getParticipationStats(teamId, seasonId, leagueId, eventType);
  }
}
