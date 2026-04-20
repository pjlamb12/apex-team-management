import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { SeasonsService } from './seasons.service';
import { SeasonEntity } from '../entities/season.entity';
import { EventEntity } from '../entities/event.entity';
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
});
