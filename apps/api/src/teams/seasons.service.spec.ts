import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { SeasonsService } from './seasons.service';
import { SeasonEntity } from '../entities/season.entity';
import { EventEntity } from '../entities/event.entity';
import { GameEventEntity } from '../entities/game-event.entity';
import { vi } from 'vitest';

describe('SeasonsService', () => {
  let service: SeasonsService;
  let repo: Repository<SeasonEntity>;
  let dataSource: DataSource;

  const mockSeasonRepo = {
    create: vi.fn(),
    save: vi.fn(),
    find: vi.fn(),
    findOne: vi.fn(),
    remove: vi.fn(),
  };

  const mockEventRepo = {
    count: vi.fn(),
    find: vi.fn(),
  };

  const mockGameEventRepo = {
    find: vi.fn().mockResolvedValue([]),
  };

  const mockEntityManager = {
    create: vi.fn(),
    save: vi.fn(),
    findOne: vi.fn(),
    update: vi.fn(),
  };

  const mockDataSource = {
    transaction: vi.fn().mockImplementation((cb) => cb(mockEntityManager)),
    getRepository: vi.fn().mockImplementation((entity) => {
      if (entity === EventEntity) return mockEventRepo;
      if (entity === GameEventEntity) return mockGameEventRepo;
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeasonsService,
        {
          provide: getRepositoryToken(SeasonEntity),
          useValue: mockSeasonRepo,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<SeasonsService>(SeasonsService);
    repo = module.get<Repository<SeasonEntity>>(getRepositoryToken(SeasonEntity));
    dataSource = module.get<DataSource>(DataSource);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('update', () => {
    it('setting isActive=true deactivates other seasons', async () => {
      const teamId = 'team-123';
      const seasonId = 'season-123';
      const season = { id: seasonId, teamId, isActive: false };
      
      mockEntityManager.findOne.mockResolvedValue(season);
      mockEntityManager.save.mockImplementation((s) => Promise.resolve(s));
      
      await service.update(seasonId, { isActive: true });
      
      expect(mockEntityManager.update).toHaveBeenCalledWith(
        SeasonEntity,
        { teamId },
        { isActive: false },
      );
      expect(mockEntityManager.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: seasonId, isActive: true }),
      );
    });
  });

  describe('remove', () => {
    it('throws ConflictException if season has events', async () => {
      const seasonId = 'season-123';
      const season = { id: seasonId };
      
      mockSeasonRepo.findOne.mockResolvedValue(season);
      mockEventRepo.count.mockResolvedValue(1);
      
      await expect(service.remove(seasonId)).rejects.toThrow(ConflictException);
      expect(mockSeasonRepo.remove).not.toHaveBeenCalled();
    });

    it('succeeds if season has no events', async () => {
      const seasonId = 'season-123';
      const season = { id: seasonId };
      
      mockSeasonRepo.findOne.mockResolvedValue(season);
      mockEventRepo.count.mockResolvedValue(0);
      
      await service.remove(seasonId);
      expect(mockSeasonRepo.remove).toHaveBeenCalledWith(season);
    });
  });

  describe('getSeasonStats', () => {
    const teamId = 'team-123';
    const seasonId = 'season-123';

    it('throws NotFoundException if season does not exist for team', async () => {
      mockSeasonRepo.findOne.mockResolvedValue(null);
      await expect(service.getSeasonStats(teamId, seasonId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns empty stats if no completed games found', async () => {
      mockSeasonRepo.findOne.mockResolvedValue({ id: seasonId, teamId });
      mockEventRepo.find.mockResolvedValue([]);

      const result = await service.getSeasonStats(teamId, seasonId);

      expect(result).toEqual({
        wins: 0,
        losses: 0,
        draws: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
      });
      expect(mockEventRepo.find).toHaveBeenCalledWith({
        where: { seasonId, type: 'game' },
      });
    });

    it('aggregates stats correctly for wins, losses, and draws', async () => {
      mockSeasonRepo.findOne.mockResolvedValue({ id: seasonId, teamId });
      const games = [
        { goalsFor: 2, goalsAgainst: 1 }, // Win
        { goalsFor: 0, goalsAgainst: 2 }, // Loss
        { goalsFor: 1, goalsAgainst: 1 }, // Draw
        { goalsFor: 3, goalsAgainst: 0 }, // Win
        { goalsFor: null, goalsAgainst: 0 }, // Skip
        { goalsFor: 1, goalsAgainst: null }, // Skip
      ];
      mockEventRepo.find.mockResolvedValue(games);

      const result = await service.getSeasonStats(teamId, seasonId);

      expect(result).toEqual({
        wins: 2,
        losses: 1,
        draws: 1,
        goalsFor: 6,
        goalsAgainst: 4,
        goalDifference: 2,
      });
    });
  });
});
