import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlayersService } from './players.service';
import { PlayerEntity } from '../entities/player.entity';
import { SeasonPlayerEntity } from '../entities/season-player.entity';

describe('PlayersService', () => {
  let service: PlayersService;
  let playerRepo: Repository<PlayerEntity>;
  let seasonPlayerRepo: Repository<SeasonPlayerEntity>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlayersService,
        {
          provide: getRepositoryToken(PlayerEntity),
          useValue: {
            find: vi.fn(),
            findOne: vi.fn(),
            create: vi.fn((dto) => ({ id: 'p1', ...dto })),
            save: vi.fn((entity) => Promise.resolve(entity)),
            remove: vi.fn(),
          },
        },
        {
          provide: getRepositoryToken(SeasonPlayerEntity),
          useValue: {
            find: vi.fn(),
            findOne: vi.fn(),
            create: vi.fn(),
            save: vi.fn(),
            delete: vi.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PlayersService>(PlayersService);
    playerRepo = module.get<Repository<PlayerEntity>>(getRepositoryToken(PlayerEntity));
    seasonPlayerRepo = module.get<Repository<SeasonPlayerEntity>>(getRepositoryToken(SeasonPlayerEntity));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAllForTeam', () => {
    it('should query for only active players by default', async () => {
      vi.spyOn(playerRepo, 'find').mockResolvedValue([{ id: 'p1', firstName: 'John', lastName: 'Doe', isActive: true }] as any);
      const result = await service.findAllForTeam('t1');
      expect(playerRepo.find).toHaveBeenCalledWith({
        where: { teamId: 't1', isGuest: false, isActive: true },
        order: { jerseyNumber: 'ASC', lastName: 'ASC' },
      });
      expect(result).toHaveLength(1);
    });

    it('should query for all players when includeInactive is true', async () => {
      vi.spyOn(playerRepo, 'find').mockResolvedValue([
        { id: 'p1', firstName: 'John', lastName: 'Doe', isActive: true },
        { id: 'p2', firstName: 'Jane', lastName: 'Smith', isActive: false },
      ] as any);
      const result = await service.findAllForTeam('t1', true);
      expect(playerRepo.find).toHaveBeenCalledWith({
        where: { teamId: 't1', isGuest: false },
        order: { jerseyNumber: 'ASC', lastName: 'ASC' },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('findAllForSeason', () => {
    it('should query only active season players by default', async () => {
      vi.spyOn(seasonPlayerRepo, 'find').mockResolvedValue([
        { id: 'sp1', player: { id: 'p1', jerseyNumber: 10, isActive: true } },
      ] as any);
      const result = await service.findAllForSeason('s1');
      expect(seasonPlayerRepo.find).toHaveBeenCalledWith({
        where: { seasonId: 's1', player: { isGuest: false, isActive: true } },
        relations: ['player'],
      });
      expect(result).toHaveLength(1);
    });

    it('should query all season players when includeInactive is true', async () => {
      vi.spyOn(seasonPlayerRepo, 'find').mockResolvedValue([
        { id: 'sp1', player: { id: 'p1', jerseyNumber: 10, isActive: true } },
        { id: 'sp2', player: { id: 'p2', jerseyNumber: 12, isActive: false } },
      ] as any);
      const result = await service.findAllForSeason('s1', true);
      expect(seasonPlayerRepo.find).toHaveBeenCalledWith({
        where: { seasonId: 's1', player: { isGuest: false } },
        relations: ['player'],
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('create and update with isActive', () => {
    it('should default isActive to true when creating', async () => {
      await service.create('t1', { firstName: 'Alex', lastName: 'Morgan', jerseyNumber: 13 });
      expect(playerRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: 'Alex',
          lastName: 'Morgan',
          jerseyNumber: 13,
          isActive: true,
          teamId: 't1',
        })
      );
    });

    it('should allow updating isActive to false (deactivate)', async () => {
      const existing = { id: 'p1', teamId: 't1', firstName: 'Alex', lastName: 'Morgan', isActive: true };
      vi.spyOn(playerRepo, 'findOne').mockResolvedValue(existing as any);
      await service.update('t1', 'p1', { isActive: false });
      expect(playerRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'p1',
          isActive: false,
        })
      );
    });
  });
});
