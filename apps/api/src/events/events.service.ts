import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, LessThan } from 'typeorm';
import { RRule } from 'rrule';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { EventEntity } from '../entities/event.entity';
import { SeasonEntity } from '../entities/season.entity';
import { TeamEntity } from '../entities/team.entity';
import { GameEventEntity } from '../entities/game-event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { SocketGateway } from '../socket/socket.gateway';
import { WeatherService } from './weather.service';
import { AttendanceService } from '../attendance/attendance.service';

@Injectable()
export class EventsService {
  private readonly ajv: Ajv;

  constructor(
    @InjectRepository(EventEntity)
    private readonly eventRepo: Repository<EventEntity>,
    @InjectRepository(SeasonEntity)
    private readonly seasonRepo: Repository<SeasonEntity>,
    @InjectRepository(TeamEntity)
    private readonly teamRepo: Repository<TeamEntity>,
    @InjectRepository(GameEventEntity)
    private readonly gameEventRepo: Repository<GameEventEntity>,
    private readonly socketGateway: SocketGateway,
    private readonly weatherService: WeatherService,
    private readonly attendanceService: AttendanceService,
  ) {
    this.ajv = new Ajv();
    addFormats(this.ajv);
  }

  async create(teamId: string, dto: CreateEventDto, userId: string): Promise<EventEntity> {
    const team = await this.teamRepo.findOne({ where: { id: teamId } });
    if (!team) throw new NotFoundException('Team not found');
    if (team.coachId !== userId) throw new ForbiddenException('Not authorized');

    let activeSeason = await this.seasonRepo.findOne({
      where: { teamId, isActive: true },
    });

    if (!activeSeason) {
      activeSeason = this.seasonRepo.create({
        teamId,
        name: 'Default Season',
        isActive: true,
      });
      activeSeason = await this.seasonRepo.save(activeSeason);
    }

    const event = this.eventRepo.create({
      ...dto,
      seasonId: activeSeason.id,
      status: 'scheduled',
      isHomeGame: dto.isHomeGame ?? true,
      recurrenceRule: dto.recurrenceRule,
    });

    // Inherit defaults from season if not provided
    if (event.type === 'practice') {
      event.location = dto.location ?? activeSeason.defaultPracticeLocation;
    } else if (event.type === 'game') {
      event.periodCount = dto.periodCount ?? activeSeason.periodCount;
      event.periodLengthMinutes = dto.periodLengthMinutes ?? activeSeason.periodLengthMinutes;
      event.playersOnField = dto.playersOnField ?? activeSeason.playersOnField;
    }

    // Automatically calculate duration for games
    if (event.type === 'game' && event.periodCount && event.periodLengthMinutes) {
      event.durationMinutes = event.periodCount * event.periodLengthMinutes;
    }

    const savedEvent = await this.eventRepo.save(event);
    this.socketGateway.server.to(`team:${teamId}`).emit('eventCreated', savedEvent);
    return savedEvent;
  }

  async findAllForTeam(
    teamId: string,
    scope: 'upcoming' | 'past' = 'upcoming',
    seasonId?: string,
  ): Promise<(EventEntity & { virtualId?: string })[]> {
    let targetSeasonId = seasonId;
    let season: SeasonEntity | null = null;

    if (targetSeasonId) {
      season = await this.seasonRepo.findOne({ where: { id: targetSeasonId } });
    } else {
      season = await this.seasonRepo.findOne({
        where: { teamId, isActive: true },
      });
      if (season) targetSeasonId = season.id;
    }

    if (!targetSeasonId || !season) {
      return [];
    }

    const now = new Date();
    
    const baseEvents = await this.eventRepo.find({
      where: { seasonId: targetSeasonId },
      relations: ['locationRef'],
      order: { scheduledAt: scope === 'upcoming' ? 'ASC' : 'DESC' },
    });

    const masters = baseEvents.filter(e => e.recurrenceRule && !e.parentEventId);
    const overrides = baseEvents.filter(e => e.parentEventId);
    const singletons = baseEvents.filter(e => !e.recurrenceRule && !e.parentEventId);

    const expandedEvents: (EventEntity & { virtualId?: string })[] = [...singletons];

    for (const master of masters) {
      try {
        const rule = RRule.fromString(master.recurrenceRule!);
        const seasonStart = season.startDate ? new Date(season.startDate) : master.scheduledAt!;
        const seasonEnd = season.endDate ? new Date(season.endDate) : new Date(seasonStart.getTime() + 365 * 24 * 60 * 60 * 1000);
        
        const occurrences = rule.all((date, i) => i < 100 && date <= seasonEnd);

        for (const occurrence of occurrences) {
          const occurrenceTime = occurrence.getTime();
          const override = overrides.find(o => 
            o.parentEventId === master.id && 
            o.scheduledAt?.getTime() === occurrenceTime
          );

          if (override) {
            if (!expandedEvents.find(e => e.id === override.id)) {
              expandedEvents.push(override);
            }
          } else {
            expandedEvents.push({
              ...master,
              id: master.id,
              virtualId: `${master.id}_${occurrenceTime}`,
              scheduledAt: occurrence,
            } as any);
          }
        }
      } catch (err) {
        console.error(`Failed to parse RRule for event ${master.id}:`, err);
        expandedEvents.push(master);
      }
    }

    let filtered = expandedEvents.filter(e => {
      if (scope === 'upcoming') {
        return (e.scheduledAt?.getTime() || 0) >= now.getTime();
      } else {
        return (e.scheduledAt?.getTime() || 0) < now.getTime();
      }
    });

    const sorted = filtered.sort((a, b) => {
      const timeA = a.scheduledAt?.getTime() || 0;
      const timeB = b.scheduledAt?.getTime() || 0;
      return scope === 'upcoming' ? timeA - timeB : timeB - timeA;
    });

    if (scope === 'upcoming') {
      const weatherPromises = sorted.slice(0, 10).map(async (event) => {
        event.weatherData = await this.weatherService.getForecastForEvent(event.id, event.scheduledAt);
      });
      await Promise.all(weatherPromises);
    }

    return sorted;
  }

  async findOne(eventId: string): Promise<EventEntity & { goalEventCount?: number }> {
    const event = await this.eventRepo.findOne({ 
      where: { id: eventId },
      relations: ['locationRef', 'season', 'season.team', 'season.team.homeLocation'] 
    });
    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    event.weatherData = await this.weatherService.getForecastForEvent(eventId);

    let goalEventCount: number | undefined = undefined;
    if (event.type === 'game') {
      goalEventCount = await this.gameEventRepo.count({
        where: { eventId, eventType: 'GOAL' },
      });
    }

    return { ...event, goalEventCount };
  }

  async update(eventId: string, dto: UpdateEventDto): Promise<EventEntity> {
    const event = await this.eventRepo.findOne({ 
      where: { id: eventId },
      relations: ['season']
    });
    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    Object.assign(event, dto);

    // Automatically calculate duration for games if period info is provided and durationMinutes is not explicitly updated
    if (event.type === 'game' && event.periodCount && event.periodLengthMinutes && dto.durationMinutes === undefined) {
      event.durationMinutes = event.periodCount * event.periodLengthMinutes;
    }

    const updated = await this.eventRepo.save(event);

    // Trigger attendance sync if game is completed
    if (updated.type === 'game' && updated.status === 'completed') {
      await this.attendanceService.syncFromLineup(updated.id);
    }

    this.socketGateway.server.to(`team:${event.season.teamId}`).emit('eventUpdated', updated);
    this.socketGateway.server.to(`event:${eventId}`).emit('eventUpdated', updated);
    return updated;
  }

  async remove(eventId: string): Promise<void> {
    const event = await this.eventRepo.findOne({ 
      where: { id: eventId },
      relations: ['season']
    });
    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }
    const teamId = event.season.teamId;
    await this.eventRepo.remove(event);
    this.socketGateway.server.to(`team:${teamId}`).emit('eventRemoved', { id: eventId });
  }

  async getGameEvents(eventId: string): Promise<GameEventEntity[]> {
    return this.gameEventRepo.find({
      where: { eventId },
      order: { createdAt: 'ASC' },
    });
  }

  async logEvent(
    eventId: string,
    dto: any,
    userId: string,
  ): Promise<GameEventEntity> {
    const event = await this.eventRepo.findOne({
      where: { id: eventId },
      relations: ['season', 'season.team', 'season.team.sport'],
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    if (event.season.team.coachId !== userId) {
      throw new ForbiddenException('Not authorized to log events for this event');
    }

    const eventDefinitions = event.season.team.sport?.eventDefinitions || [];
    const definition = eventDefinitions.find((d: any) => d.type === dto.eventType);

    if (!definition) {
      throw new BadRequestException(
        `Event type ${dto.eventType} not supported for this sport`,
      );
    }

    if (definition.payloadSchema) {
      const payloadToValidate = dto.payload ?? {};
      const validate = this.ajv.compile(definition.payloadSchema);
      const valid = validate(payloadToValidate);
      if (!valid) {
        throw new BadRequestException(
          `Invalid payload for event type ${dto.eventType}: ${this.ajv.errorsText(
            validate.errors,
          )}`,
        );
      }
    }

    const gameEvent = this.gameEventRepo.create({
      ...dto,
      eventId,
    });

    const saved = await this.gameEventRepo.save(gameEvent as any);
    this.socketGateway.server.to(`event:${eventId}`).emit('gameEventLogged', saved);
    return saved as any;
  }

  async removeEvent(eventId: string, gameEventId: string, userId: string): Promise<void> {
    const gameEvent = await this.gameEventRepo.findOne({
      where: { id: gameEventId, eventId },
      relations: ['event', 'event.season', 'event.season.team'],
    });

    if (!gameEvent) {
      throw new NotFoundException(`Game event ${gameEventId} not found for event ${eventId}`);
    }

    if (gameEvent.event?.season?.team?.coachId !== userId) {
      throw new ForbiddenException('Not authorized to remove events for this event');
    }

    await this.gameEventRepo.remove(gameEvent);
    this.socketGateway.server.to(`event:${eventId}`).emit('gameEventRemoved', { id: gameEventId });
  }

  async findAllForTeamBySecret(secret: string): Promise<EventEntity[]> {
    const team = await this.teamRepo.findOne({
      where: { calendarSecret: secret },
      relations: ['seasons', 'seasons.events'],
    });

    if (!team) {
      throw new NotFoundException('Invalid calendar secret');
    }

    const allEvents = team.seasons.flatMap((season) => season.events || []);
    
    return allEvents.sort((a, b) => 
      (a.scheduledAt?.getTime() || 0) - (b.scheduledAt?.getTime() || 0)
    );
  }
}
