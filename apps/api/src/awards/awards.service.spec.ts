import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AwardsService } from './awards.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('AwardsService', () => {
  let service: AwardsService;
  let mockAwardRepo: any;
  let mockPlayerRepo: any;
  let mockEventRepo: any;

  beforeEach(() => {
    mockAwardRepo = {
      createQueryBuilder: vi.fn(),
      find: vi.fn(),
      findOne: vi.fn(),
      create: vi.fn((entity) => ({ id: 'award-1', ...entity })),
      save: vi.fn((entity) => Promise.resolve({ id: 'award-1', ...entity })),
      remove: vi.fn().mockResolvedValue(true),
    };

    mockPlayerRepo = {
      find: vi.fn(),
      findOne: vi.fn(),
    };

    mockEventRepo = {
      findOne: vi.fn(),
    };

    service = new AwardsService(mockAwardRepo, mockPlayerRepo, mockEventRepo);
  });

  describe('findAll', () => {
    it('should query awards with filters', async () => {
      const mockQb = {
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue([
          { id: 'award-1', title: 'Player of the Match', category: 'mvp', awardedAt: new Date() },
        ]),
      };
      mockAwardRepo.createQueryBuilder.mockReturnValue(mockQb);

      const res = await service.findAll('team-1', { seasonId: 'season-1', category: 'mvp' });

      expect(mockAwardRepo.createQueryBuilder).toHaveBeenCalledWith('award');
      expect(mockQb.where).toHaveBeenCalledWith('award.team_id = :teamId', { teamId: 'team-1' });
      expect(mockQb.andWhere).toHaveBeenCalledWith('award.season_id = :seasonId', { seasonId: 'season-1' });
      expect(mockQb.andWhere).toHaveBeenCalledWith('award.category = :category', { category: 'mvp' });
      expect(res).toHaveLength(1);
    });
  });

  describe('findByPlayer', () => {
    it('should return awards for specific player', async () => {
      mockAwardRepo.find.mockResolvedValue([{ id: 'award-1', title: 'Iron Defender' }]);
      const res = await service.findByPlayer('team-1', 'player-1');
      expect(mockAwardRepo.find).toHaveBeenCalledWith({
        where: { teamId: 'team-1', playerId: 'player-1' },
        relations: ['event', 'player'],
        order: { awardedAt: 'DESC' },
      });
      expect(res).toHaveLength(1);
    });
  });

  describe('findByEvent', () => {
    it('should return awards for specific match or event', async () => {
      mockAwardRepo.find.mockResolvedValue([{ id: 'award-1', title: 'Player of the Match' }]);
      const res = await service.findByEvent('team-1', 'event-1');
      expect(mockAwardRepo.find).toHaveBeenCalledWith({
        where: { teamId: 'team-1', eventId: 'event-1' },
        relations: ['player'],
        order: { awardedAt: 'DESC' },
      });
      expect(res).toHaveLength(1);
    });
  });

  describe('getSummary', () => {
    it('should calculate team award metrics and player recognition distribution', async () => {
      mockPlayerRepo.find.mockResolvedValue([
        { id: 'p1', firstName: 'Lucas', lastName: 'Silva', jerseyNumber: 10 },
        { id: 'p2', firstName: 'Alex', lastName: 'Morgan', jerseyNumber: 13 },
      ]);

      const mockQb = {
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue([
          {
            id: 'a1',
            teamId: 'team-1',
            playerId: 'p1',
            badgeType: 'player_of_the_match',
            title: 'Player of the Match',
            category: 'mvp',
            icon: 'star-outline',
            color: 'amber',
            awardedAt: new Date('2026-08-10T12:00:00Z'),
          },
          {
            id: 'a2',
            teamId: 'team-1',
            playerId: 'p1',
            badgeType: 'iron_defender',
            title: 'Iron Defender',
            category: 'defense',
            icon: 'shield-outline',
            color: 'blue',
            awardedAt: new Date('2026-08-12T12:00:00Z'),
          },
        ]),
      };
      mockAwardRepo.createQueryBuilder.mockReturnValue(mockQb);

      const summary = await service.getSummary('team-1', 'season-1');

      expect(summary.totalAwards).toBe(2);
      expect(summary.awardsByCategory['mvp']).toBe(1);
      expect(summary.awardsByCategory['defense']).toBe(1);
      expect(summary.playerAwardCounts).toHaveLength(2);
      expect(summary.playerAwardCounts[0].playerId).toBe('p1');
      expect(summary.playerAwardCounts[0].awardCount).toBe(2);
      expect(summary.playerAwardCounts[1].playerId).toBe('p2');
      expect(summary.playerAwardCounts[1].awardCount).toBe(0); // Unrecognized kid tracked with 0 awards
    });
  });

  describe('create', () => {
    it('should throw NotFoundException if player not found', async () => {
      mockPlayerRepo.findOne.mockResolvedValue(null);

      await expect(
        service.create('team-1', {
          playerId: 'p-none',
          badgeType: 'player_of_the_match',
          title: 'Player of the Match',
          category: 'mvp',
          icon: 'star-outline',
          color: 'amber',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create and link award with event and season', async () => {
      mockPlayerRepo.findOne.mockResolvedValue({ id: 'p1', firstName: 'Lucas', teamId: 'team-1' });
      mockEventRepo.findOne.mockResolvedValue({ id: 'e1', seasonId: 'season-10' });

      const res = await service.create('team-1', {
        playerId: 'p1',
        eventId: 'e1',
        badgeType: 'player_of_the_match',
        title: 'Player of the Match',
        category: 'mvp',
        icon: 'star-outline',
        color: 'amber',
        notes: 'Hat-trick hero!',
      });

      expect(mockAwardRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          teamId: 'team-1',
          playerId: 'p1',
          eventId: 'e1',
          seasonId: 'season-10',
          badgeType: 'player_of_the_match',
          notes: 'Hat-trick hero!',
        }),
      );
      expect(res.id).toBe('award-1');
    });
  });

  describe('createBatch', () => {
    it('should throw BadRequestException if array is empty', async () => {
      await expect(service.createBatch('team-1', [])).rejects.toThrow(BadRequestException);
    });

    it('should create multiple awards in batch', async () => {
      mockPlayerRepo.findOne.mockResolvedValue({ id: 'p1', firstName: 'Lucas', teamId: 'team-1' });
      const dtos = [
        {
          playerId: 'p1',
          badgeType: 'player_of_the_match',
          title: 'Player of the Match',
          category: 'mvp' as const,
          icon: 'star-outline',
          color: 'amber',
        },
        {
          playerId: 'p1',
          badgeType: 'iron_defender',
          title: 'Iron Defender',
          category: 'defense' as const,
          icon: 'shield-outline',
          color: 'blue',
        },
      ];

      const res = await service.createBatch('team-1', dtos);
      expect(res).toHaveLength(2);
    });
  });

  describe('delete', () => {
    it('should delete award if found', async () => {
      mockAwardRepo.findOne.mockResolvedValue({ id: 'a1', teamId: 'team-1' });
      await service.delete('team-1', 'a1');
      expect(mockAwardRepo.remove).toHaveBeenCalled();
    });

    it('should throw NotFoundException if award not found', async () => {
      mockAwardRepo.findOne.mockResolvedValue(null);
      await expect(service.delete('team-1', 'a-none')).rejects.toThrow(NotFoundException);
    });
  });
});
