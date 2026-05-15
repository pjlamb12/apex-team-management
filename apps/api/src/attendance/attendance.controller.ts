import { Controller, Get, Post, Body, Param, UseGuards, ParseUUIDPipe, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AttendanceService } from './attendance.service';
import { UpdateAttendanceDto, BatchUpdateAttendanceDto } from './dto/update-attendance.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('teams/:teamId')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get('events/:eventId/attendance')
  findAll(@Param('eventId', ParseUUIDPipe) eventId: string) {
    return this.attendanceService.findAllForEvent(eventId);
  }

  @Post('events/:eventId/attendance')
  update(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Body() dto: UpdateAttendanceDto,
  ) {
    return this.attendanceService.update(eventId, dto);
  }

  @Post('events/:eventId/attendance/batch')
  batchUpdate(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Body() dto: BatchUpdateAttendanceDto,
  ) {
    return this.attendanceService.batchUpdate(eventId, dto);
  }

  @Post('events/:eventId/attendance/sync')
  syncFromLineup(@Param('eventId', ParseUUIDPipe) eventId: string) {
    return this.attendanceService.syncFromLineup(eventId);
  }

  @Get('participation')
  getParticipation(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Query('seasonId') seasonId?: string,
  ) {
    return this.attendanceService.getParticipationStats(teamId, seasonId);
  }
}
