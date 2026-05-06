import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request, Header, Response } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response as ExpressResponse } from 'express';
import { TeamsService } from './teams.service';
import { EventsService } from '../events/events.service';
import { ICalService } from '../events/ical.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { JoinTeamDto } from './dto/join-team.dto';
import { TeamRoleGuard } from '../auth/guards/team-role.guard';
import { TeamRoles } from '../auth/decorators/team-role.decorator';
import { TeamRole } from '@apex-team/shared/util/models';

@Controller('teams')
export class TeamsController {
  constructor(
    private readonly teamsService: TeamsService,
    private readonly eventsService: EventsService,
    private readonly icalService: ICalService,
  ) {}

  @Get('calendar/:secret.ics')
  @Header('Content-Type', 'text/calendar')
  async getCalendar(@Param('secret') secret: string, @Response() res: ExpressResponse) {
    const team = await this.teamsService.findByCalendarSecret(secret);
    const events = await this.eventsService.findAllForTeamBySecret(secret);
    const ical = this.icalService.generate(team.name, events);
    res.send(ical);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  findAll(@Request() req: { user: { sub: string } }) {
    return this.teamsService.findAllByCoach(req.user.sub);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  create(@Body() dto: CreateTeamDto, @Request() req: { user: { sub: string } }) {
    return this.teamsService.create(dto, req.user.sub);
  }

  @Post('join')
  @UseGuards(AuthGuard('jwt'))
  join(@Body() dto: JoinTeamDto, @Request() req: { user: { sub: string } }) {
    return this.teamsService.join(req.user.sub, dto.code);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  findOne(@Param('id') id: string, @Request() req: { user: { sub: string } }) {
    return this.teamsService.findOne(id, req.user.sub);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), TeamRoleGuard)
  @TeamRoles(TeamRole.HEAD_COACH, TeamRole.ASSISTANT)
  update(@Param('id') id: string, @Body() dto: UpdateTeamDto, @Request() req: { user: { sub: string } }) {
    return this.teamsService.update(id, dto, req.user.sub);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), TeamRoleGuard)
  @TeamRoles(TeamRole.HEAD_COACH)
  remove(@Param('id') id: string, @Request() req: { user: { sub: string } }) {
    return this.teamsService.remove(id, req.user.sub);
  }

  @Post(':id/code/regenerate')
  @UseGuards(AuthGuard('jwt'), TeamRoleGuard)
  @TeamRoles(TeamRole.HEAD_COACH)
  regenerateCode(@Param('id') id: string) {
    return this.teamsService.regenerateCode(id);
  }

  @Post(':id/calendar/regenerate')
  @UseGuards(AuthGuard('jwt'), TeamRoleGuard)
  @TeamRoles(TeamRole.HEAD_COACH)
  regenerateCalendarSecret(@Param('id') id: string) {
    return this.teamsService.regenerateCalendarSecret(id);
  }
}
