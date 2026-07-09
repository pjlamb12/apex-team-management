import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { NotFoundException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventEntity } from '../entities/event.entity';
import { SeasonEntity } from '../entities/season.entity';
import { TeamEntity } from '../entities/team.entity';
import { GameEventEntity } from '../entities/game-event.entity';
import { EventNoteEntity } from '../entities/event-note.entity';
import { LeagueEntity } from '../entities/league.entity';

import { CreateEventDto } from './dto/create-event.dto';
import { SocketGateway } from '../socket/socket.gateway';
import { WeatherService } from './weather.service';
import { AttendanceService } from '../attendance/attendance.service';
import { PlayingTimeValidationService } from '../analytics/playing-time-validation.service';
import { TeamRole } from '@apex-team/shared/util/models';
import { vi } from 'vitest';

describe('EventsService', () => {
  let service: EventsService;
  let eventRepo: Repository<EventEntity>;
  let seasonRepo: Repository<SeasonEntity>;
  let teamRepo: Repository<TeamEntity>;
  let gameEventRepo: Repository<GameEventEntity>;
  let eventNoteRepo: Repository<EventNoteEntity>;
  let socketGateway: { server: { to: ReturnType<typeof vi.fn>; emit: ReturnType<typeof vi.fn> } };
  let playingTimeValidationService: PlayingTimeValidationService;
  let dataSource: DataSource;


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
            find: vi.fn(),
            findOne: vi.fn(),
            remove: vi.fn(),
            count: vi.fn(),
          },
        },
        {
          provide: getRepositoryToken(EventNoteEntity),
          useValue: {
            create: vi.fn().mockImplementation((dto) => dto),
            save: vi.fn().mockImplementation((note) => Promise.resolve({ id: 'note-1', ...note })),
            find: vi.fn(),
            findOne: vi.fn(),
            remove: vi.fn(),
          },
        },
        {
          provide: getRepositoryToken(LeagueEntity),
          useValue: {
            create: vi.fn().mockImplementation((dto) => dto),
            save: vi.fn().mockImplementation((league) => Promise.resolve({ id: 'league-1', ...league })),
            find: vi.fn(),
            findOne: vi.fn(),
          },
        },
        {
          provide: SocketGateway,
          useValue: {
            server: {
              to: vi.fn().mockReturnThis(),
              emit: vi.fn(),
            },
          },
        },
        {
          provide: WeatherService,
          useValue: {
            getForecastForEvent: vi.fn(),
          },
        },
        {
          provide: AttendanceService,
          useValue: {
            syncFromLineup: vi.fn(),
          },
        },
        {
          provide: PlayingTimeValidationService,
          useValue: {
            validateForEvent: vi.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {
            transaction: vi.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
    eventRepo = module.get<Repository<EventEntity>>(getRepositoryToken(EventEntity));
    seasonRepo = module.get<Repository<SeasonEntity>>(getRepositoryToken(SeasonEntity));
    teamRepo = module.get<Repository<TeamEntity>>(getRepositoryToken(TeamEntity));
    gameEventRepo = module.get<Repository<GameEventEntity>>(getRepositoryToken(GameEventEntity));
    eventNoteRepo = module.get<Repository<EventNoteEntity>>(getRepositoryToken(EventNoteEntity));
    socketGateway = module.get(SocketGateway);
    playingTimeValidationService = module.get<PlayingTimeValidationService>(PlayingTimeValidationService);
    dataSource = module.get<DataSource>(DataSource);
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

    it('should save leagueId if provided', async () => {
      vi.spyOn(teamRepo, 'findOne').mockResolvedValue({ id: teamId, coachId: userId } as any);
      vi.spyOn(seasonRepo, 'findOne').mockResolvedValue({ id: 'season-1', teamId, isActive: true } as any);

      const result = await service.create(teamId, { ...dto, leagueId: 'league-1' }, userId);

      expect(result.leagueId).toBe('league-1');
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
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      vi.spyOn(eventRepo, 'find').mockResolvedValue([{ id: 'event-1', scheduledAt: futureDate }] as any);

      const result = await service.findAllForTeam('team-1');

      expect(result).toHaveLength(1);
      expect(eventRepo.find).toHaveBeenCalledWith(expect.objectContaining({
        order: { scheduledAt: 'ASC' },
      }));
    });

    it('should return past events when scope is past', async () => {
      vi.spyOn(seasonRepo, 'findOne').mockResolvedValue({ id: 'season-1' } as any);
      const pastDate = new Date();
      pastDate.setFullYear(pastDate.getFullYear() - 1);
      vi.spyOn(eventRepo, 'find').mockResolvedValue([{ id: 'event-past', scheduledAt: pastDate }] as any);

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
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      vi.spyOn(seasonRepo, 'findOne').mockResolvedValue({ id: 'season-2' } as any);
      vi.spyOn(eventRepo, 'find').mockResolvedValue([{ id: 'event-season-2', scheduledAt: futureDate }] as any);

      const result = await service.findAllForTeam('team-1', 'upcoming', 'season-2');

      expect(result).toHaveLength(1);
      expect(eventRepo.find).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ seasonId: 'season-2' }),
      }));
      expect(seasonRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'season-2' }
      });
    });

    it('should keep ongoing events (start time + duration) in the upcoming filter', async () => {
      vi.spyOn(seasonRepo, 'findOne').mockResolvedValue({ id: 'season-1' } as any);
      
      const now = new Date();
      // Started 30 mins ago, 60 min duration -> ends in 30 mins (should be upcoming)
      const scheduledAt = new Date(now.getTime() - 30 * 60 * 1000);
      
      vi.spyOn(eventRepo, 'find').mockResolvedValue([
        { id: 'ongoing-practice', type: 'practice', scheduledAt, durationMinutes: 60 }
      ] as any);

      const upcomingResult = await service.findAllForTeam('team-1', 'upcoming');
      expect(upcomingResult).toHaveLength(1);
      expect(upcomingResult[0].id).toBe('ongoing-practice');

      const pastResult = await service.findAllForTeam('team-1', 'past');
      expect(pastResult).toHaveLength(0);
    });

    it('should move ended events (start time + duration) to the past filter', async () => {
      vi.spyOn(seasonRepo, 'findOne').mockResolvedValue({ id: 'season-1' } as any);
      
      const now = new Date();
      // Started 70 mins ago, 60 min duration -> ended 10 mins ago (should be past)
      const scheduledAt = new Date(now.getTime() - 70 * 60 * 1000);
      
      vi.spyOn(eventRepo, 'find').mockResolvedValue([
        { id: 'ended-practice', type: 'practice', scheduledAt, durationMinutes: 60 }
      ] as any);

      const upcomingResult = await service.findAllForTeam('team-1', 'upcoming');
      expect(upcomingResult).toHaveLength(0);

      const pastResult = await service.findAllForTeam('team-1', 'past');
      expect(pastResult).toHaveLength(1);
      expect(pastResult[0].id).toBe('ended-practice');
    });

    it('should fall back to standard type durations if durationMinutes is not provided', async () => {
      vi.spyOn(seasonRepo, 'findOne').mockResolvedValue({ id: 'season-1' } as any);
      
      const now = new Date();
      // Started 45 mins ago, no duration:
      // - Game: default 90 mins -> ends in 45 mins (upcoming)
      // - Practice: default 60 mins -> ends in 15 mins (upcoming)
      // - Practice ended: started 75 mins ago, default 60 mins -> ended (past)
      const start45Ago = new Date(now.getTime() - 45 * 60 * 1000);
      const start75Ago = new Date(now.getTime() - 75 * 60 * 1000);

      vi.spyOn(eventRepo, 'find').mockResolvedValue([
        { id: 'game-45', type: 'game', scheduledAt: start45Ago, durationMinutes: null },
        { id: 'practice-45', type: 'practice', scheduledAt: start45Ago, durationMinutes: null },
        { id: 'practice-75', type: 'practice', scheduledAt: start75Ago, durationMinutes: null }
      ] as any);

      const upcomingResult = await service.findAllForTeam('team-1', 'upcoming');
      const upcomingIds = upcomingResult.map(e => e.id);
      expect(upcomingIds).toContain('game-45');
      expect(upcomingIds).toContain('practice-45');
      expect(upcomingIds).not.toContain('practice-75');

      const pastResult = await service.findAllForTeam('team-1', 'past');
      const pastIds = pastResult.map(e => e.id);
      expect(pastIds).toContain('practice-75');
      expect(pastIds).not.toContain('game-45');
      expect(pastIds).not.toContain('practice-45');
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
      const event = { id: 'event-1', opponent: 'Old', season: { teamId: 'team-1' } };
      vi.spyOn(eventRepo, 'findOne').mockResolvedValue(event as any);

      const result = await service.update('event-1', { opponent: 'New' });

      expect(result.opponent).toBe('New');
      expect(eventRepo.save).toHaveBeenCalled();
    });

    it('should update leagueId field and return the updated event', async () => {
      const event = { id: 'event-1', opponent: 'Old', leagueId: 'old-league', season: { teamId: 'team-1' } };
      vi.spyOn(eventRepo, 'findOne').mockResolvedValue(event as any);

      const result = await service.update('event-1', { leagueId: 'new-league' });

      expect(result.leagueId).toBe('new-league');
      expect(eventRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if event does not exist', async () => {
      vi.spyOn(eventRepo, 'findOne').mockResolvedValue(null);

      await expect(service.update('event-1', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete the event', async () => {
      const event = { id: 'event-1', season: { teamId: 'team-1' } };
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

    it('should create a game event if logged in user is an assistant coach', async () => {
      const mockEvent = {
        id: eventId,
        season: {
          team: {
            coachId: 'other-user',
            members: [
              { userId, role: TeamRole.ASSISTANT }
            ],
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

    it('should throw ForbiddenException if user is on team but not coach/assistant role', async () => {
      const mockEvent = {
        id: eventId,
        season: {
          team: {
            coachId: 'other-user',
            members: [
              { userId, role: 'PLAYER' }
            ],
          },
        },
      };
      vi.spyOn(eventRepo, 'findOne').mockResolvedValue(mockEvent as any);

      await expect(service.logEvent(eventId, dto, userId)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('removeEvent', () => {
    const eventId = 'event-1';
    const gameEventId = 'game-event-1';
    const userId = 'user-1';

    it('should successfully remove event if user is the head coach', async () => {
      const mockGameEvent = {
        id: gameEventId,
        eventId,
        event: {
          season: {
            team: {
              coachId: userId,
            },
          },
        },
      };
      vi.spyOn(gameEventRepo, 'findOne').mockResolvedValue(mockGameEvent as any);

      await service.removeEvent(eventId, gameEventId, userId);
      expect(gameEventRepo.remove).toHaveBeenCalledWith(mockGameEvent);
    });

    it('should successfully remove event if user is an assistant coach', async () => {
      const mockGameEvent = {
        id: gameEventId,
        eventId,
        event: {
          season: {
            team: {
              coachId: 'other-coach',
              members: [
                { userId, role: TeamRole.ASSISTANT }
              ],
            },
          },
        },
      };
      vi.spyOn(gameEventRepo, 'findOne').mockResolvedValue(mockGameEvent as any);

      await service.removeEvent(eventId, gameEventId, userId);
      expect(gameEventRepo.remove).toHaveBeenCalledWith(mockGameEvent);
    });

    it('should throw ForbiddenException if user is not authorized to remove event', async () => {
      const mockGameEvent = {
        id: gameEventId,
        eventId,
        event: {
          season: {
            team: {
              coachId: 'other-coach',
              members: [],
            },
          },
        },
      };
      vi.spyOn(gameEventRepo, 'findOne').mockResolvedValue(mockGameEvent as any);

      await expect(service.removeEvent(eventId, gameEventId, userId)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('notes management', () => {
    const eventId = 'event-1';
    const userId = 'user-1';

    it('should find notes for authorized user', async () => {
      const mockEvent = {
        id: eventId,
        season: {
          team: {
            coachId: userId,
            members: [],
          },
        },
      };
      vi.spyOn(eventRepo, 'findOne').mockResolvedValue(mockEvent as any);
      vi.spyOn(eventNoteRepo, 'find').mockResolvedValue([{ id: 'note-1', content: 'test note' }] as any);

      const result = await service.findNotes(eventId, userId);
      expect(result).toHaveLength(1);
      expect(result[0].content).toBe('test note');
    });

    it('should create note for authorized user', async () => {
      const mockEvent = {
        id: eventId,
        season: {
          team: {
            coachId: userId,
            members: [],
          },
        },
      };
      const mockNote = { id: 'note-1', eventId, userId, content: 'test note' };
      vi.spyOn(eventRepo, 'findOne').mockResolvedValue(mockEvent as any);
      vi.spyOn(eventNoteRepo, 'create').mockReturnValue(mockNote as any);
      vi.spyOn(eventNoteRepo, 'save').mockResolvedValue(mockNote as any);
      vi.spyOn(eventNoteRepo, 'findOne').mockResolvedValue(mockNote as any);

      const result = await service.createNote(eventId, 'test note', userId);
      expect(result.content).toBe('test note');
    });

    it('should update note if user is the author', async () => {
      const mockNote = { id: 'note-1', eventId, userId, content: 'original content' };
      vi.spyOn(eventNoteRepo, 'findOne').mockResolvedValueOnce(mockNote as any);
      vi.spyOn(eventNoteRepo, 'save').mockImplementation(async (n: any) => n);
      vi.spyOn(eventNoteRepo, 'findOne').mockResolvedValueOnce({ ...mockNote, content: 'updated content' } as any);

      const result = await service.updateNote(eventId, 'note-1', 'updated content', userId);
      expect(result.content).toBe('updated content');
    });

    it('should throw ForbiddenException if user tries to update another user\'s note', async () => {
      const mockNote = { id: 'note-1', eventId, userId: 'other-user', content: 'original content' };
      vi.spyOn(eventNoteRepo, 'findOne').mockResolvedValue(mockNote as any);

      await expect(service.updateNote(eventId, 'note-1', 'updated content', userId)).rejects.toThrow(ForbiddenException);
    });

    it('should delete note if user is the author or head coach', async () => {
      const mockNote = {
        id: 'note-1',
        eventId,
        userId,
        event: {
          season: {
            team: {
              coachId: 'head-coach',
              members: [],
            },
          },
        },
      };
      vi.spyOn(eventNoteRepo, 'findOne').mockResolvedValue(mockNote as any);
      vi.spyOn(eventNoteRepo, 'remove').mockResolvedValue({} as any);

      await service.deleteNote(eventId, 'note-1', userId);
      expect(eventNoteRepo.remove).toHaveBeenCalledWith(mockNote);
    });
  });

  describe('applyPlayingTimeCorrections', () => {
    const eventId = 'event-1';
    const userId = 'user-1';
    const correction = { gameEventId: 'ge-1', field: 'outPlayerId' as const, currentPlayerId: 'p1', correctedPlayerId: 'p2' };
    const dto = { corrections: [correction] };

    it('should apply corrections that match the freshly-recomputed suggestions and emit a socket update', async () => {
      const mockEvent = {
        id: eventId,
        season: { team: { coachId: userId, members: [] } },
      };
      vi.spyOn(eventRepo, 'findOne').mockResolvedValue(mockEvent as any);

      vi.spyOn(playingTimeValidationService, 'validateForEvent')
        .mockResolvedValueOnce({
          eventId,
          isValid: false,
          violations: [],
          suggestedCorrections: [{ ...correction, reason: 'because' }],
        } as any)
        .mockResolvedValueOnce({ eventId, isValid: true, violations: [], suggestedCorrections: [] } as any);

      const gameEventRow = { id: 'ge-1', eventId, payload: { outPlayerId: 'p1' } };
      const manager = {
        findOne: vi.fn().mockResolvedValue(gameEventRow),
        save: vi.fn().mockImplementation(async (_entity: unknown, row: any) => row),
      };
      vi.spyOn(dataSource, 'transaction').mockImplementation(async (cb: any) => cb(manager));

      const result = await service.applyPlayingTimeCorrections(eventId, dto as any, userId);

      expect(manager.findOne).toHaveBeenCalledWith(GameEventEntity, { where: { id: 'ge-1', eventId } });
      expect(manager.save).toHaveBeenCalledWith(
        GameEventEntity,
        expect.objectContaining({ id: 'ge-1', payload: { outPlayerId: 'p2' } }),
      );
      expect(socketGateway.server.to).toHaveBeenCalledWith(`event:${eventId}`);
      expect(socketGateway.server.emit).toHaveBeenCalledWith('gameEventUpdated', expect.objectContaining({ id: 'ge-1' }));
      expect(result.appliedCorrections).toHaveLength(1);
      expect(result.report.isValid).toBe(true);
    });

    it('should throw ConflictException if submitted corrections no longer match the freshly-recomputed suggestions', async () => {
      const mockEvent = {
        id: eventId,
        season: { team: { coachId: userId, members: [] } },
      };
      vi.spyOn(eventRepo, 'findOne').mockResolvedValue(mockEvent as any);
      vi.spyOn(playingTimeValidationService, 'validateForEvent').mockResolvedValue({
        eventId,
        isValid: true,
        violations: [],
        suggestedCorrections: [],
      } as any);

      await expect(service.applyPlayingTimeCorrections(eventId, dto as any, userId)).rejects.toThrow(ConflictException);
    });

    it('should throw ForbiddenException if user is not authorized for the event', async () => {
      const mockEvent = {
        id: eventId,
        season: { team: { coachId: 'other-coach', members: [] } },
      };
      vi.spyOn(eventRepo, 'findOne').mockResolvedValue(mockEvent as any);

      await expect(service.applyPlayingTimeCorrections(eventId, dto as any, userId)).rejects.toThrow(ForbiddenException);
    });
  });
});

