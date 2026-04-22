import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, LessThan } from 'typeorm';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { EventEntity } from '../entities/event.entity';
import { SeasonEntity } from '../entities/season.entity';
import { TeamEntity } from '../entities/team.entity';
import { GameEventEntity } from '../entities/game-event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

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
  ) {
    this.ajv = new Ajv();
    addFormats(this.ajv);
  }

  async create(teamId: string, dto: CreateEventDto, userId?: string): Promise<EventEntity> {
    // Optional ownership check if userId is provided
    if (userId) {
      const team = await this.teamRepo.findOne({ where: { id: teamId } });
      if (!team) throw new NotFoundException(`Team ${teamId} not found`);
      if (team.coachId !== userId) {
        throw new ForbiddenException('Not authorized to create events for this team');
      }
    }

    // 1. Check for an active season on the team.
    let activeSeason = await this.seasonRepo.findOne({
      where: { teamId, isActive: true },
    });

    // 2. If no active season exists, create one named "YYYY Season".
    if (!activeSeason) {
      const year = new Date().getFullYear();
      activeSeason = this.seasonRepo.create({
        teamId,
        name: `${year} Season`,
        isActive: true,
      });
      activeSeason = await this.seasonRepo.save(activeSeason);
    }

    const type = dto.type ?? 'game';
    let location = dto.location;
    let periodCount = dto.periodCount;
    let periodLengthMinutes = dto.periodLengthMinutes;

    // 3. Inherit defaults from active season
    if (type === 'practice' && !location) {
      location = activeSeason.defaultPracticeLocation;
    }
    if (type === 'game') {
      if (periodCount === undefined) {
        periodCount = activeSeason.periodCount;
      }
      if (periodLengthMinutes === undefined) {
        periodLengthMinutes = activeSeason.periodLengthMinutes;
      }
    }

    // 4. Create the event with the seasonId.
    const event = this.eventRepo.create({
      ...dto,
      type,
      location,
      periodCount,
      periodLengthMinutes,
      seasonId: activeSeason.id,
      status: 'scheduled',
      isHomeGame: dto.isHomeGame ?? true,
    });

    // 5. Save the event.
    return this.eventRepo.save(event);
  }

  async findAllForTeam(
    teamId: string,
    scope: 'upcoming' | 'past' = 'upcoming',
    seasonId?: string,
  ): Promise<EventEntity[]> {
    let targetSeasonId = seasonId;

    if (!targetSeasonId) {
      // Find the active season for the team.
      const activeSeason = await this.seasonRepo.findOne({
        where: { teamId, isActive: true },
      });

      // If none, return empty array.
      if (!activeSeason) {
        return [];
      }
      targetSeasonId = activeSeason.id;
    }

    const now = new Date();
    const whereCondition: any = { seasonId: targetSeasonId };

    if (scope === 'upcoming') {
      whereCondition.scheduledAt = MoreThanOrEqual(now);
    } else {
      whereCondition.scheduledAt = LessThan(now);
    }

    // Find all events for that season with chronological sorting.
    return this.eventRepo.find({
      where: whereCondition,
      order: { scheduledAt: scope === 'upcoming' ? 'ASC' : 'DESC' },
    });
  }

  async findOne(eventId: string): Promise<EventEntity & { goalEventCount?: number }> {
    const event = await this.eventRepo.findOne({ where: { id: eventId } });
    if (!event) {
      throw new NotFoundException(`Event ${eventId} not found`);
    }

    if (event.type === 'game') {
      const goalEventCount = await this.gameEventRepo.count({
        where: { eventId, eventType: 'GOAL' },
      });
      return { ...event, goalEventCount };
    }

    return event;
  }

  async update(eventId: string, dto: UpdateEventDto): Promise<EventEntity> {
    const event = await this.findOne(eventId);
    Object.assign(event, dto);
    return this.eventRepo.save(event);
  }

  async remove(eventId: string): Promise<void> {
    const event = await this.findOne(eventId);
    await this.eventRepo.remove(event);
  }

  async getGameEvents(eventId: string): Promise<GameEventEntity[]> {
    return this.gameEventRepo.find({
      where: { eventId },
      order: { minuteOccurred: 'ASC' },
    });
  }

  async logEvent(
    eventId: string,
    dto: any, // Using any for the CreateGameEventDto to avoid complex renames right now
    userId: string,
  ): Promise<GameEventEntity> {
    const event = await this.eventRepo.findOne({
      where: { id: eventId },
      relations: ['season', 'season.team', 'season.team.sport'],
    });

    if (!event) {
      throw new NotFoundException(`Event ${eventId} not found`);
    }

    if (!event.season?.team) {
      throw new BadRequestException('Event data incomplete (missing season or team)');
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

    return this.gameEventRepo.save(gameEvent as any);
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
  }
}
