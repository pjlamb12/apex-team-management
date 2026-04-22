import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DrillsService } from './drills.service';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { DrillEntity } from '../entities/drill.entity';
import { TagEntity } from '../entities/tag.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';

describe('DrillsService', () => {
  let service: DrillsService;
  let drillRepo: Partial<Record<keyof Repository<DrillEntity>, ReturnType<typeof vi.fn>>>;
  let tagRepo: Partial<Record<keyof Repository<TagEntity>, ReturnType<typeof vi.fn>>>;

  beforeEach(async () => {
    drillRepo = {
      find: vi.fn(),
      findOne: vi.fn(),
      create: vi.fn(),
      save: vi.fn(),
      remove: vi.fn(),
      createQueryBuilder: vi.fn(),
    };

    tagRepo = {
      find: vi.fn(),
      findOneBy: vi.fn(),
      create: vi.fn(),
      save: vi.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        DrillsService,
        { provide: getRepositoryToken(DrillEntity), useValue: drillRepo },
        { provide: getRepositoryToken(TagEntity), useValue: tagRepo },
      ],
    }).compile();

    service = module.get<DrillsService>(DrillsService);
  });

  describe('findAll', () => {
    it('should return drills for a coach', async () => {
      const coachId = 'coach-1';
      const drills = [{ id: 'drill-1', name: 'Drill 1', coachId }];
      
      const queryBuilder: any = {
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue(drills),
      };
      drillRepo.createQueryBuilder!.mockReturnValue(queryBuilder);

      const result = await service.findAll(coachId);

      expect(drillRepo.createQueryBuilder).toHaveBeenCalledWith('drill');
      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('drill.tags', 'tag');
      expect(queryBuilder.where).toHaveBeenCalledWith('drill.coachId = :coachId', { coachId });
      expect(result).toEqual(drills);
    });

    it('should filter by tagIds using double join', async () => {
      const coachId = 'coach-1';
      const tagIds = ['tag-1'];
      const drills = [{ id: 'drill-1', name: 'Drill 1', coachId, tags: [{ id: 'tag-1' }] }];

      const queryBuilder: any = {
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue(drills),
      };
      drillRepo.createQueryBuilder!.mockReturnValue(queryBuilder);

      await service.findAll(coachId, tagIds);

      expect(queryBuilder.innerJoin).toHaveBeenCalledWith('drill.tags', 'filterTag');
      expect(queryBuilder.andWhere).toHaveBeenCalledWith('filterTag.id IN (:...tagIds)', { tagIds });
    });
  });

  describe('create', () => {
    it('should create a drill with tags', async () => {
      const coachId = 'coach-1';
      const dto = {
        name: 'New Drill',
        description: 'Desc',
        instructions: { steps: [] },
        tagIds: ['tag-1'],
      };
      const tags = [{ id: 'tag-1', name: 'Shooting' }];
      const drill = { id: 'drill-1', ...dto, coachId, tags };

      tagRepo.find!.mockResolvedValue(tags);
      drillRepo.create!.mockReturnValue(drill);
      drillRepo.save!.mockResolvedValue(drill);

      const result = await service.create(coachId, dto);

      expect(tagRepo.find).toHaveBeenCalled();
      const { tagIds, ...expectedDrillData } = dto;
      expect(drillRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        ...expectedDrillData,
        coachId,
        tags,
      }));
      expect(result).toEqual(drill);
    });
  });

  describe('findOne', () => {
    it('should return a drill if owned by coach', async () => {
      const drillId = 'drill-1';
      const coachId = 'coach-1';
      const drill = { id: drillId, coachId, tags: [] };

      drillRepo.findOne!.mockResolvedValue(drill);

      const result = await service.findOne(drillId, coachId);

      expect(drillRepo.findOne).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: drillId, coachId },
        relations: ['tags'],
      }));
      expect(result).toEqual(drill);
    });

    it('should throw NotFoundException if drill not found or not owned', async () => {
      drillRepo.findOne!.mockResolvedValue(null);
      await expect(service.findOne('bad-id', 'coach-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a drill if owned by coach', async () => {
      const drillId = 'drill-1';
      const coachId = 'coach-1';
      const existing = { id: drillId, coachId, name: 'Old', tags: [] };
      const dto = { name: 'New', tagIds: ['tag-2'] };
      const newTags = [{ id: 'tag-2', name: 'Passing' }];
      const updated = { ...existing, ...dto, tags: newTags };

      drillRepo.findOne!.mockResolvedValue(existing);
      tagRepo.find!.mockResolvedValue(newTags);
      drillRepo.save!.mockResolvedValue(updated);

      const result = await service.update(drillId, coachId, dto);

      expect(result.name).toBe('New');
      expect(result.tags).toEqual(newTags);
    });
  });

  describe('remove', () => {
    it('should delete a drill if owned by coach', async () => {
      const drillId = 'drill-1';
      const coachId = 'coach-1';
      const drill = { id: drillId, coachId };

      drillRepo.findOne!.mockResolvedValue(drill);
      drillRepo.remove!.mockResolvedValue(drill);

      await service.remove(drillId, coachId);

      expect(drillRepo.remove).toHaveBeenCalledWith(drill);
    });
  });
});
