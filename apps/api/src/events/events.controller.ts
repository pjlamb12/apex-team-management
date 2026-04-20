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
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { SaveLineupDto } from './dto/save-lineup.dto';
import { CreateEventDto as CreateGameEventDto } from './dto/create-event.dto'; // This might need a better name later

@UseGuards(AuthGuard('jwt'))
@Controller('teams/:teamId/events')
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly lineupEntriesService: LineupEntriesService,
  ) {}

  @Post()
  create(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Body() dto: CreateEventDto,
    @Request() req: { user: { sub: string } },
  ) {
    return this.eventsService.create(teamId, dto, req.user.sub);
  }

  @Get()
  findAll(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Query('scope') scope?: 'upcoming' | 'past',
  ) {
    return this.eventsService.findAllForTeam(teamId, scope);
  }

  @Get(':eventId')
  findOne(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Param('eventId', ParseUUIDPipe) eventId: string,
  ) {
    // Note: teamId is currently not used in findOne but kept for URL consistency
    return this.eventsService.findOne(eventId);
  }

  @Patch(':eventId')
  update(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Body() dto: UpdateEventDto,
  ) {
    return this.eventsService.update(eventId, dto);
  }

  @Delete(':eventId')
  remove(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Param('eventId', ParseUUIDPipe) eventId: string,
  ) {
    return this.eventsService.remove(eventId);
  }

  @Get(':eventId/lineup')
  getLineup(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Param('eventId', ParseUUIDPipe) eventId: string,
  ) {
    return this.lineupEntriesService.findByGame(eventId);
  }

  @Post(':eventId/lineup')
  saveLineup(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Body() dto: SaveLineupDto,
  ) {
    return this.lineupEntriesService.saveLineup(eventId, dto);
  }

  @Post(':eventId/game-events') // Renamed from /events to avoid confusion with parent /events
  logEvent(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Body() dto: CreateGameEventDto,
    @Request() req: { user: { sub: string } },
  ) {
    return this.eventsService.logEvent(eventId, dto, req.user.sub);
  }

  @Delete(':eventId/game-events/:gameEventId')
  removeEvent(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Param('gameEventId', ParseUUIDPipe) gameEventId: string,
    @Request() req: { user: { sub: string } },
  ) {
    return this.eventsService.removeEvent(eventId, gameEventId, req.user.sub);
  }
}
