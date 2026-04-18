import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { GamesService } from './games.service';
import { GameEntity } from '../entities/game.entity';
import { SeasonEntity } from '../entities/season.entity';
import { TeamEntity } from '../entities/team.entity';
import { GameEventEntity } from '../entities/game-event.entity';
import { CreateGameDto } from './dto/create-game.dto';
import { CreateEventDto } from './dto/create-event.dto';

describe('GamesService', () => {
  let service: GamesService;
  let gameRepo: Repository<GameEntity>;
  let seasonRepo: Repository<SeasonEntity>;
  let teamRepo: Repository<TeamEntity>;
  let eventRepo: Repository<GameEventEntity>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GamesService,
        {
          provide: getRepositoryToken(GameEntity),
          useValue: {
            create: vi.fn().mockImplementation((dto) => dto),
            save: vi.fn().mockImplementation((game) => Promise.resolve({ id: 'game-1', ...game })),
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
            save: vi.fn().mockImplementation((event) => Promise.resolve({ id: 'event-1', ...event })),
          },
        },
      ],
    }).compile();

    service = module.get<GamesService>(GamesService);
    gameRepo = module.get<Repository<GameEntity>>(getRepositoryToken(GameEntity));
    seasonRepo = module.get<Repository<SeasonEntity>>(getRepositoryToken(SeasonEntity));
    teamRepo = module.get<Repository<TeamEntity>>(getRepositoryToken(TeamEntity));
    eventRepo = module.get<Repository<GameEventEntity>>(getRepositoryToken(GameEventEntity));
  });

  describe('create', () => {
    const teamId = 'team-1';
    const userId = 'user-1';
    const dto: CreateGameDto = {
      opponent: 'Rivals',
      scheduledAt: new Date().toISOString(),
    };

    it('should create a game and return it', async () => {
      vi.spyOn(teamRepo, 'findOne').mockResolvedValue({ id: teamId, coachId: userId } as any);
      vi.spyOn(seasonRepo, 'findOne').mockResolvedValue({ id: 'season-1', teamId, isActive: true } as any);

      const result = await service.create(teamId, dto, userId);

      expect(result).toBeDefined();
      expect(result.opponent).toBe(dto.opponent);
      expect(gameRepo.save).toHaveBeenCalled();
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
      expect(gameRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        seasonId: 'existing-season',
      }));
    });

    it('should throw ForbiddenException if team does not belong to the requesting coach', async () => {
      vi.spyOn(teamRepo, 'findOne').mockResolvedValue({ id: teamId, coachId: 'other-user' } as any);

      await expect(service.create(teamId, dto, userId)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findAllForTeam', () => {
    it('should return games for the active season of a team', async () => {
      vi.spyOn(seasonRepo, 'findOne').mockResolvedValue({ id: 'season-1' } as any);
      vi.spyOn(gameRepo, 'find').mockResolvedValue([{ id: 'game-1' }] as any);

      const result = await service.findAllForTeam('team-1');

      expect(result).toHaveLength(1);
      expect(gameRepo.find).toHaveBeenCalledWith(expect.objectContaining({
        where: { seasonId: 'season-1' },
      }));
    });

    it('should return an empty array if no active season exists', async () => {
      vi.spyOn(seasonRepo, 'findOne').mockResolvedValue(null);

      const result = await service.findAllForTeam('team-1');

      expect(result).toEqual([]);
    });
  });

  describe('update', () => {
    it('should update game fields and return the updated game', async () => {
      const game = { id: 'game-1', opponent: 'Old' };
      vi.spyOn(gameRepo, 'findOne').mockResolvedValue(game as any);

      const result = await service.update('game-1', { opponent: 'New' });

      expect(result.opponent).toBe('New');
      expect(gameRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if game does not exist', async () => {
      vi.spyOn(gameRepo, 'findOne').mockResolvedValue(null);

      await expect(service.update('game-1', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete the game', async () => {
      const game = { id: 'game-1' };
      vi.spyOn(gameRepo, 'findOne').mockResolvedValue(game as any);

      await service.remove('game-1');

      expect(gameRepo.remove).toHaveBeenCalledWith(game);
    });
  });

  describe('logEvent', () => {
    const gameId = 'game-1';
    const userId = 'user-1';
    const dto: CreateEventDto = {
      eventType: 'GOAL',
      minuteOccurred: 10,
      payload: { scorerId: 'player-1' },
    };

    it('should create a game event if game exists and belongs to coach and payload is valid', async () => {
      const mockGame = {
        id: gameId,
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
      vi.spyOn(gameRepo, 'findOne').mockResolvedValue(mockGame as any);

      const result = await service.logEvent(gameId, dto, userId);

      expect(result).toBeDefined();
      expect(result.eventType).toBe('GOAL');
      expect(eventRepo.save).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if game team does not belong to coach', async () => {
      const mockGame = {
        id: gameId,
        season: {
          team: {
            coachId: 'other-user',
          },
        },
      };
      vi.spyOn(gameRepo, 'findOne').mockResolvedValue(mockGame as any);

      await expect(service.logEvent(gameId, dto, userId)).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if event type is not valid for the sport', async () => {
      const mockGame = {
        id: gameId,
        season: {
          team: {
            coachId: userId,
            sport: {
              eventDefinitions: [{ type: 'ASSIST' }],
            },
          },
        },
      };
      vi.spyOn(gameRepo, 'findOne').mockResolvedValue(mockGame as any);

      await expect(service.logEvent(gameId, dto, userId)).rejects.toThrow('Event type GOAL not supported for this sport');
    });

    it('should throw BadRequestException if payload does not match schema', async () => {
      const mockGame = {
        id: gameId,
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
      vi.spyOn(gameRepo, 'findOne').mockResolvedValue(mockGame as any);

      const invalidDto: CreateEventDto = {
        eventType: 'GOAL',
        payload: { invalidField: 'value' },
      };

      await expect(service.logEvent(gameId, invalidDto, userId)).rejects.toThrow(BadRequestException);
    });
  });
});
