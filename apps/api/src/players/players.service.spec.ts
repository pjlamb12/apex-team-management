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
  let mockEntityManager: any;

  beforeEach(async () => {
    mockEntityManager = {
      findOne: vi.fn(),
      find: vi.fn(),
      save: vi.fn((e) => Promise.resolve(e)),
      delete: vi.fn(),
      update: vi.fn(),
    };

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
        {
          provide: DataSource,
          useValue: {
            transaction: vi.fn(async (cb) => cb(mockEntityManager)),
          },
        },
      ],
    }).compile();

    service = module.get<PlayersService>(PlayersService);
    playerRepo = module.get<Repository<PlayerEntity>>(getRepositoryToken(PlayerEntity));
    seasonPlayerRepo = module.get<Repository<SeasonPlayerEntity>>(getRepositoryToken(SeasonPlayerEntity));
    dataSource = module.get<DataSource>(DataSource);
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

    it('should filter out any inactive players if returned with isActive: false when includeInactive is false', async () => {
      vi.spyOn(seasonPlayerRepo, 'find').mockResolvedValue([
        { id: 'sp1', player: { id: 'p1', jerseyNumber: 10, isActive: true } },
        { id: 'sp2', player: { id: 'p2', jerseyNumber: 12, isActive: false } },
      ] as any);
      const result = await service.findAllForSeason('s1');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('p1');
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

  describe('findAllGuestsForTeam', () => {
    it('should query for guest players only', async () => {
      vi.spyOn(playerRepo, 'find').mockResolvedValue([
        { id: 'g1', firstName: 'Gwen', lastName: 'Stacy', isGuest: true },
      ] as any);
      const result = await service.findAllGuestsForTeam('t1');
      expect(playerRepo.find).toHaveBeenCalledWith({
        where: { teamId: 't1', isGuest: true },
        order: { jerseyNumber: 'ASC', lastName: 'ASC' },
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('findGuestPlayersForSeason', () => {
    it('should query active guest players in season', async () => {
      vi.spyOn(seasonPlayerRepo, 'find').mockResolvedValue([
        { id: 'sp1', player: { id: 'g1', firstName: 'Gwen', jerseyNumber: 12, isGuest: true, isActive: true } },
      ] as any);
      const result = await service.findGuestPlayersForSeason('s1');
      expect(seasonPlayerRepo.find).toHaveBeenCalledWith({
        where: { seasonId: 's1', player: { isGuest: true, isActive: true } },
        relations: ['player'],
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('g1');
    });
  });

  describe('mergePlayers', () => {
    it('should reject merging player into itself', async () => {
      await expect(service.mergePlayers('t1', 'p1', 'p1')).rejects.toThrow('Target player and source player cannot be the same');
    });

    it('should throw if target player not found', async () => {
      mockEntityManager.findOne.mockResolvedValueOnce(null);
      await expect(service.mergePlayers('t1', 'target-1', 'source-1')).rejects.toThrow('Target player target-1 not found');
    });

    it('should throw if source player not found', async () => {
      mockEntityManager.findOne
        .mockResolvedValueOnce({ id: 'target-1', teamId: 't1' })
        .mockResolvedValueOnce(null);
      await expect(service.mergePlayers('t1', 'target-1', 'source-1')).rejects.toThrow('Source player source-1 not found');
    });

    it('should relink attendance, lineups, game events, and delete source player', async () => {
      const targetPlayer = { id: 'target-1', teamId: 't1', firstName: 'Gwen', lastName: 'Stacy', jerseyNumber: null };
      const sourcePlayer = { id: 'source-1', teamId: 't1', firstName: 'Gwen', lastName: 'Stacy', jerseyNumber: 15 };

      mockEntityManager.findOne
        .mockResolvedValueOnce(targetPlayer) // find target
        .mockResolvedValueOnce(sourcePlayer) // find source
        .mockResolvedValueOnce(null) // target attendance check
        .mockResolvedValueOnce(null) // target lineup check
        .mockResolvedValueOnce(null); // target season check

      mockEntityManager.find
        .mockResolvedValueOnce([{ id: 'att-1', eventId: 'e-1', playerId: 'source-1', status: 'present' }]) // source attendance
        .mockResolvedValueOnce([{ id: 'le-1', eventId: 'e-1', playerId: 'source-1', status: 'bench' }]) // source lineup
        .mockResolvedValueOnce([
          { id: 'ge-1', eventId: 'e-1', eventType: 'GOAL', payload: { scorerId: 'source-1' } },
        ]) // all game events
        .mockResolvedValueOnce([{ id: 'sp-1', seasonId: 's-1', playerId: 'source-1' }]) // source season players
        .mockResolvedValueOnce([]); // source checklist

      const result = await service.mergePlayers('t1', 'target-1', 'source-1');

      expect(mockEntityManager.save).toHaveBeenCalled();
      expect(mockEntityManager.delete).toHaveBeenCalledWith(PlayerEntity, { id: 'source-1' });
      expect(result.jerseyNumber).toBe(15);
    });
  });
});

