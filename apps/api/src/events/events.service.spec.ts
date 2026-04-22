import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventEntity } from '../entities/event.entity';
import { SeasonEntity } from '../entities/season.entity';
import { TeamEntity } from '../entities/team.entity';
import { GameEventEntity } from '../entities/game-event.entity';
import { CreateEventDto } from './dto/create-event.dto';

describe('EventsService', () => {
  let service: EventsService;
  let eventRepo: Repository<EventEntity>;
  let seasonRepo: Repository<SeasonEntity>;
  let teamRepo: Repository<TeamEntity>;
  let gameEventRepo: Repository<GameEventEntity>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: getRepositoryToken(EventEntity),
          useValue: {
            create: vi.fn().mockImplementation((dto) => dto),
            save: vi.fn().mockImplementation((event) => Promise.resolve({ id: 'event-1', ...event })),
            find: vi.fn(),
            findOne: vi.fn(),
            remove: vi.fn(),
          },
        },
        {
          provide: getRepositoryToken(SeasonEntity),
          useValue: {
            create: vi.fn().mockImplementation((dto) => dto),
            save: vi.fn().mockImplementation((season) => Promise.resolve({ id: 'season-1', ...season })),
            findOne: vi.fn(),
          },
        },
        {
          provide: getRepositoryToken(TeamEntity),
          useValue: {
            findOne: vi.fn(),
          },
        },
        {
          provide: getRepositoryToken(GameEventEntity),
          useValue: {
            create: vi.fn().mockImplementation((dto) => dto),
            save: vi.fn().mockImplementation((event) => Promise.resolve({ id: 'game-event-1', ...event })),
            findOne: vi.fn(),
            remove: vi.fn(),
            count: vi.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
    eventRepo = module.get<Repository<EventEntity>>(getRepositoryToken(EventEntity));
    seasonRepo = module.get<Repository<SeasonEntity>>(getRepositoryToken(SeasonEntity));
    teamRepo = module.get<Repository<TeamEntity>>(getRepositoryToken(TeamEntity));
    gameEventRepo = module.get<Repository<GameEventEntity>>(getRepositoryToken(GameEventEntity));
  });

  describe('create', () => {
    const teamId = 'team-1';
    const userId = 'user-1';
    const dto: CreateEventDto = {
      type: 'game',
      opponent: 'Rivals',
      scheduledAt: new Date().toISOString(),
    };

    it('should create an event and return it', async () => {
      vi.spyOn(teamRepo, 'findOne').mockResolvedValue({ id: teamId, coachId: userId } as any);
      vi.spyOn(seasonRepo, 'findOne').mockResolvedValue({ id: 'season-1', teamId, isActive: true } as any);

      const result = await service.create(teamId, dto, userId);

      expect(result).toBeDefined();
      expect(result.opponent).toBe(dto.opponent);
      expect(eventRepo.save).toHaveBeenCalled();
    });

    it('should create a default active season if none exists for the team', async () => {
      vi.spyOn(teamRepo, 'findOne').mockResolvedValue({ id: teamId, coachId: userId } as any);
      vi.spyOn(seasonRepo, 'findOne').mockResolvedValue(null);

      await service.create(teamId, dto, userId);

      expect(seasonRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        teamId,
        isActive: true,
      }));
      expect(seasonRepo.save).toHaveBeenCalled();
    });

    it('should reuse the existing active season if one exists', async () => {
      vi.spyOn(teamRepo, 'findOne').mockResolvedValue({ id: teamId, coachId: userId } as any);
      vi.spyOn(seasonRepo, 'findOne').mockResolvedValue({ id: 'existing-season', teamId, isActive: true } as any);

      await service.create(teamId, dto, userId);

      expect(seasonRepo.create).not.toHaveBeenCalled();
      expect(eventRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        seasonId: 'existing-season',
      }));
    });

    it('should throw ForbiddenException if team does not belong to the requesting coach', async () => {
      vi.spyOn(teamRepo, 'findOne').mockResolvedValue({ id: teamId, coachId: 'other-user' } as any);

      await expect(service.create(teamId, dto, userId)).rejects.toThrow(ForbiddenException);
    });

    it('should inherit default practice location for practices', async () => {
      vi.spyOn(teamRepo, 'findOne').mockResolvedValue({ id: teamId, coachId: userId } as any);
      vi.spyOn(seasonRepo, 'findOne').mockResolvedValue({ 
        id: 'season-1', 
        teamId, 
        isActive: true,
        defaultPracticeLocation: 'The Park'
      } as any);

      const practiceDto: CreateEventDto = {
        type: 'practice',
        scheduledAt: new Date().toISOString(),
      };

      const result = await service.create(teamId, practiceDto, userId);

      expect(result.type).toBe('practice');
      expect(result.location).toBe('The Park');
    });

    it('should not override provided location for practices', async () => {
      vi.spyOn(teamRepo, 'findOne').mockResolvedValue({ id: teamId, coachId: userId } as any);
      vi.spyOn(seasonRepo, 'findOne').mockResolvedValue({ 
        id: 'season-1', 
        teamId, 
        isActive: true,
        defaultPracticeLocation: 'The Park'
      } as any);

      const practiceDto: CreateEventDto = {
        type: 'practice',
        location: 'Gym',
        scheduledAt: new Date().toISOString(),
      };

      const result = await service.create(teamId, practiceDto, userId);

      expect(result.location).toBe('Gym');
    });

    it('should inherit game format fields from season for games', async () => {
      vi.spyOn(teamRepo, 'findOne').mockResolvedValue({ id: teamId, coachId: userId } as any);
      vi.spyOn(seasonRepo, 'findOne').mockResolvedValue({ 
        id: 'season-1', 
        teamId, 
        isActive: true,
        periodCount: 2,
        periodLengthMinutes: 45
      } as any);

      const gameDto: CreateEventDto = {
        type: 'game',
        scheduledAt: new Date().toISOString(),
      };

      const result = await service.create(teamId, gameDto, userId);

      expect(result.type).toBe('game');
      expect(result.periodCount).toBe(2);
      expect(result.periodLengthMinutes).toBe(45);
    });

    it('should not override provided game format fields for games', async () => {
      vi.spyOn(teamRepo, 'findOne').mockResolvedValue({ id: teamId, coachId: userId } as any);
      vi.spyOn(seasonRepo, 'findOne').mockResolvedValue({ 
        id: 'season-1', 
        teamId, 
        isActive: true,
        periodCount: 2,
        periodLengthMinutes: 45
      } as any);

      const gameDto: CreateEventDto = {
        type: 'game',
        periodCount: 4,
        periodLengthMinutes: 12,
        scheduledAt: new Date().toISOString(),
      };

      const result = await service.create(teamId, gameDto, userId);

      expect(result.periodCount).toBe(4);
      expect(result.periodLengthMinutes).toBe(12);
    });
  });

  describe('findAllForTeam', () => {
    it('should return upcoming events by default', async () => {
      vi.spyOn(seasonRepo, 'findOne').mockResolvedValue({ id: 'season-1' } as any);
      vi.spyOn(eventRepo, 'find').mockResolvedValue([{ id: 'event-1' }] as any);

      const result = await service.findAllForTeam('team-1');

      expect(result).toHaveLength(1);
      expect(eventRepo.find).toHaveBeenCalledWith(expect.objectContaining({
        order: { scheduledAt: 'ASC' },
      }));
    });

    it('should return past events when scope is past', async () => {
      vi.spyOn(seasonRepo, 'findOne').mockResolvedValue({ id: 'season-1' } as any);
      vi.spyOn(eventRepo, 'find').mockResolvedValue([{ id: 'event-past' }] as any);

      const result = await service.findAllForTeam('team-1', 'past');

      expect(result).toHaveLength(1);
      expect(eventRepo.find).toHaveBeenCalledWith(expect.objectContaining({
        order: { scheduledAt: 'DESC' },
      }));
    });

    it('should return an empty array if no active season exists', async () => {
      vi.spyOn(seasonRepo, 'findOne').mockResolvedValue(null);

      const result = await service.findAllForTeam('team-1');

      expect(result).toEqual([]);
    });

    it('should use provided seasonId for filtering', async () => {
      vi.spyOn(eventRepo, 'find').mockResolvedValue([{ id: 'event-season-2' }] as any);

      const result = await service.findAllForTeam('team-1', 'upcoming', 'season-2');

      expect(result).toHaveLength(1);
      expect(eventRepo.find).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ seasonId: 'season-2' }),
      }));
      expect(seasonRepo.findOne).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return event and include goalEventCount for games', async () => {
      const event = { id: 'event-1', type: 'game' };
      vi.spyOn(eventRepo, 'findOne').mockResolvedValue(event as any);
      vi.spyOn(gameEventRepo, 'count').mockResolvedValue(3);

      const result = await service.findOne('event-1');

      expect(result.id).toBe('event-1');
      expect(result.goalEventCount).toBe(3);
      expect(gameEventRepo.count).toHaveBeenCalledWith({
        where: { eventId: 'event-1', eventType: 'GOAL' },
      });
    });

    it('should return event without goalEventCount for practices', async () => {
      const event = { id: 'event-1', type: 'practice' };
      vi.spyOn(eventRepo, 'findOne').mockResolvedValue(event as any);

      const result = await service.findOne('event-1');

      expect(result.id).toBe('event-1');
      expect(result.goalEventCount).toBeUndefined();
      expect(gameEventRepo.count).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if event does not exist', async () => {
      vi.spyOn(eventRepo, 'findOne').mockResolvedValue(null);

      await expect(service.findOne('event-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update event fields and return the updated event', async () => {
      const event = { id: 'event-1', opponent: 'Old' };
      vi.spyOn(eventRepo, 'findOne').mockResolvedValue(event as any);

      const result = await service.update('event-1', { opponent: 'New' });

      expect(result.opponent).toBe('New');
      expect(eventRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if event does not exist', async () => {
      vi.spyOn(eventRepo, 'findOne').mockResolvedValue(null);

      await expect(service.update('event-1', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete the event', async () => {
      const event = { id: 'event-1' };
      vi.spyOn(eventRepo, 'findOne').mockResolvedValue(event as any);

      await service.remove('event-1');

      expect(eventRepo.remove).toHaveBeenCalledWith(event);
    });
  });

  describe('logEvent', () => {
    const eventId = 'event-1';
    const userId = 'user-1';
    const dto = {
      eventType: 'GOAL',
      minuteOccurred: 10,
      payload: { scorerId: 'player-1' },
    };

    it('should create a game event if event exists and belongs to coach and payload is valid', async () => {
      const mockEvent = {
        id: eventId,
        season: {
          team: {
            coachId: userId,
            sport: {
              eventDefinitions: [
                {
                  type: 'GOAL',
                  payloadSchema: {
                    type: 'object',
                    properties: { scorerId: { type: 'string' } },
                    required: ['scorerId'],
                  },
                },
              ],
            },
          },
        },
      };
      vi.spyOn(eventRepo, 'findOne').mockResolvedValue(mockEvent as any);

      const result = await service.logEvent(eventId, dto, userId);

      expect(result).toBeDefined();
      expect(result.eventType).toBe('GOAL');
      expect(gameEventRepo.save).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if event team does not belong to coach', async () => {
      const mockEvent = {
        id: eventId,
        season: {
          team: {
            coachId: 'other-user',
          },
        },
      };
      vi.spyOn(eventRepo, 'findOne').mockResolvedValue(mockEvent as any);

      await expect(service.logEvent(eventId, dto, userId)).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if event type is not valid for the sport', async () => {
      const mockEvent = {
        id: eventId,
        season: {
          team: {
            coachId: userId,
            sport: {
              eventDefinitions: [{ type: 'ASSIST' }],
            },
          },
        },
      };
      vi.spyOn(eventRepo, 'findOne').mockResolvedValue(mockEvent as any);

      await expect(service.logEvent(eventId, dto, userId)).rejects.toThrow('Event type GOAL not supported for this sport');
    });

    it('should throw BadRequestException if payload does not match schema', async () => {
      const mockEvent = {
        id: eventId,
        season: {
          team: {
            coachId: userId,
            sport: {
              eventDefinitions: [
                {
                  type: 'GOAL',
                  payloadSchema: {
                    type: 'object',
                    properties: { scorerId: { type: 'string' } },
                    required: ['scorerId'],
                  },
                },
              ],
            },
          },
        },
      };
      vi.spyOn(eventRepo, 'findOne').mockResolvedValue(mockEvent as any);

      const invalidDto = {
        eventType: 'GOAL',
        payload: { invalidField: 'value' },
      };

      await expect(service.logEvent(eventId, invalidDto, userId)).rejects.toThrow(BadRequestException);
    });
  });
});
