import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TacticsService } from './tactics.service';
import { NotFoundException } from '@nestjs/common';

describe('TacticsService', () => {
  let service: TacticsService;
  let mockTacticPlayRepo: any;

  beforeEach(() => {
    mockTacticPlayRepo = {
      createQueryBuilder: vi.fn(),
      findOne: vi.fn(),
      create: vi.fn((entity) => ({ id: 'play-1', ...entity })),
      save: vi.fn((entity) => Promise.resolve({ id: entity.id || 'play-1', ...entity })),
      remove: vi.fn().mockResolvedValue(true),
    };

    service = new TacticsService(mockTacticPlayRepo);
  });

  describe('findAll', () => {
    it('should query plays with filters', async () => {
      const mockQb = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue([
          {
            id: 'play-1',
            title: '4-3-3 Balanced',
            sport: 'soccer',
            category: 'formation',
          },
        ]),
      };
      mockTacticPlayRepo.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.findAll('coach-1', 'soccer', 'formation', '4-3-3');

      expect(mockTacticPlayRepo.createQueryBuilder).toHaveBeenCalledWith('play');
      expect(mockQb.where).toHaveBeenCalledWith('play.coachId = :coachId', { coachId: 'coach-1' });
      expect(mockQb.andWhere).toHaveBeenCalledWith('LOWER(play.sport) = LOWER(:sport)', { sport: 'soccer' });
      expect(mockQb.andWhere).toHaveBeenCalledWith('LOWER(play.category) = LOWER(:category)', { category: 'formation' });
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('4-3-3 Balanced');
    });
  });

  describe('findOne', () => {
    it('should return play if found', async () => {
      const mockPlay = { id: 'play-1', coachId: 'coach-1', title: '5-1 System' };
      mockTacticPlayRepo.findOne.mockResolvedValue(mockPlay);

      const result = await service.findOne('play-1', 'coach-1');
      expect(result).toEqual(mockPlay);
    });

    it('should throw NotFoundException if not found', async () => {
      mockTacticPlayRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('play-999', 'coach-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create and save a new tactic play', async () => {
      const dto = {
        title: 'Corner Kick Flick',
        sport: 'soccer',
        category: 'set_piece',
        pitchType: 'half_pitch',
        tags: ['Corner'],
        canvasData: { pitchType: 'half_pitch', tokens: [], drawings: [] },
      };

      const result = await service.create('coach-1', dto);

      expect(mockTacticPlayRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          coachId: 'coach-1',
          title: 'Corner Kick Flick',
          sport: 'soccer',
          category: 'set_piece',
        })
      );
      expect(result.id).toBe('play-1');
      expect(result.title).toBe('Corner Kick Flick');
    });
  });

  describe('update', () => {
    it('should update existing play', async () => {
      const existing = {
        id: 'play-1',
        coachId: 'coach-1',
        title: 'Old Title',
        sport: 'soccer',
        category: 'formation',
      };
      mockTacticPlayRepo.findOne.mockResolvedValue(existing);

      const result = await service.update('play-1', 'coach-1', {
        title: 'New Title',
      });

      expect(result.title).toBe('New Title');
      expect(mockTacticPlayRepo.save).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove play if found', async () => {
      const existing = { id: 'play-1', coachId: 'coach-1' };
      mockTacticPlayRepo.findOne.mockResolvedValue(existing);

      await service.remove('play-1', 'coach-1');
      expect(mockTacticPlayRepo.remove).toHaveBeenCalledWith(existing);
    });
  });

  describe('seedPresets', () => {
    it('should seed soccer presets', async () => {
      const result = await service.seedPresets('coach-1', 'soccer');
      expect(result.length).toBeGreaterThan(0);
      expect(mockTacticPlayRepo.save).toHaveBeenCalled();
    });

    it('should seed volleyball presets', async () => {
      const result = await service.seedPresets('coach-1', 'volleyball');
      expect(result.length).toBeGreaterThan(0);
      expect(mockTacticPlayRepo.save).toHaveBeenCalled();
    });
  });
});
