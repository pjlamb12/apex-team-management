import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { EventsService } from './events.service';
import { LineupEntriesService } from './lineup-entries.service';
import { WeatherService } from './weather.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { SaveLineupDto } from './dto/save-lineup.dto';
import { CreateGameEventDto } from './dto/create-game-event.dto';
import { TeamRoleGuard } from '../auth/guards/team-role.guard';
import { TeamRoles } from '../auth/decorators/team-role.decorator';
import { TeamRole } from '@apex-team/shared/util/models';

@UseGuards(AuthGuard('jwt'), TeamRoleGuard)
@Controller('teams/:teamId/events')
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly lineupEntriesService: LineupEntriesService,
    private readonly weatherService: WeatherService,
  ) {}

  @Post(':eventId/weather/refresh')
  @TeamRoles(TeamRole.HEAD_COACH, TeamRole.ASSISTANT)
  refreshWeather(
    @Param('eventId', ParseUUIDPipe) eventId: string,
  ) {
    return this.weatherService.getForecastForEvent(eventId, undefined, true);
  }

  @Post()
  @TeamRoles(TeamRole.HEAD_COACH)
  create(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Body() dto: CreateEventDto,
    @Request() req: { user: { sub: string } },
  ) {
    return this.eventsService.create(teamId, dto, req.user.sub);
  }

  @Get()
  @TeamRoles(TeamRole.HEAD_COACH, TeamRole.ASSISTANT)
  findAll(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Query('scope') scope?: 'upcoming' | 'past',
    @Query('seasonId') seasonId?: string,
  ) {
    return this.eventsService.findAllForTeam(teamId, scope, seasonId);
  }

  @Get(':eventId')
  @TeamRoles(TeamRole.HEAD_COACH, TeamRole.ASSISTANT)
  findOne(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Param('eventId', ParseUUIDPipe) eventId: string,
  ) {
    return this.eventsService.findOne(eventId);
  }

  @Patch(':eventId')
  @TeamRoles(TeamRole.HEAD_COACH, TeamRole.ASSISTANT)
  update(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Body() dto: UpdateEventDto,
  ) {
    return this.eventsService.update(eventId, dto);
  }

  @Delete(':eventId')
  @TeamRoles(TeamRole.HEAD_COACH)
  remove(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Param('eventId', ParseUUIDPipe) eventId: string,
  ) {
    return this.eventsService.remove(eventId);
  }

  @Get(':eventId/lineup')
  @TeamRoles(TeamRole.HEAD_COACH, TeamRole.ASSISTANT)
  getLineup(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Param('eventId', ParseUUIDPipe) eventId: string,
  ) {
    return this.lineupEntriesService.findByGame(eventId);
  }

  @Post(':eventId/lineup')
  @TeamRoles(TeamRole.HEAD_COACH, TeamRole.ASSISTANT)
  saveLineup(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Body() dto: SaveLineupDto,
  ) {
    return this.lineupEntriesService.saveLineup(eventId, dto);
  }

  @Get(':eventId/game-events')
  @TeamRoles(TeamRole.HEAD_COACH, TeamRole.ASSISTANT)
  getEvents(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Param('eventId', ParseUUIDPipe) eventId: string,
  ) {
    return this.eventsService.getGameEvents(eventId);
  }

  @Post(':eventId/game-events')
  @TeamRoles(TeamRole.HEAD_COACH, TeamRole.ASSISTANT)
  logEvent(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Body() dto: CreateGameEventDto,
    @Request() req: { user: { sub: string } },
  ) {
    return this.eventsService.logEvent(eventId, dto, req.user.sub);
  }

  @Delete(':eventId/game-events/:gameEventId')
  @TeamRoles(TeamRole.HEAD_COACH, TeamRole.ASSISTANT)
  removeEvent(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Param('gameEventId', ParseUUIDPipe) gameEventId: string,
    @Request() req: { user: { sub: string } },
  ) {
    return this.eventsService.removeEvent(eventId, gameEventId, req.user.sub);
  }
}
