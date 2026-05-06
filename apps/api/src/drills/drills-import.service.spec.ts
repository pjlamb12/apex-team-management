import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DrillEntity } from '../entities/drill.entity';
import { TagEntity } from '../entities/tag.entity';
import { DrillsService } from './drills.service';
import { Repository } from 'typeorm';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('DrillsService (Import)', () => {
  let service: DrillsService;
  let drillRepo: Repository<DrillEntity>;
  let tagRepo: Repository<TagEntity>;

  const mockDrillRepo = {
    create: vi.fn(),
    save: vi.fn(),
  };

  const mockTagRepo = {
    find: vi.fn(),
    create: vi.fn(),
    save: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DrillsService,
        {
          provide: getRepositoryToken(DrillEntity),
          useValue: mockDrillRepo,
        },
        {
          provide: getRepositoryToken(TagEntity),
          useValue: mockTagRepo,
        },
      ],
    }).compile();

    service = module.get<DrillsService>(DrillsService);
    drillRepo = module.get<Repository<DrillEntity>>(getRepositoryToken(DrillEntity));
    tagRepo = module.get<Repository<TagEntity>>(getRepositoryToken(TagEntity));
  });

  it('should import a drill with new tags', async () => {
    const coachId = 'coach-123';
    const importData = {
      name: 'AI Drill',
      description: 'Imported from AI',
      instructions: [{ step: 1, text: 'Run' }],
      tagNames: ['AI', 'NewTag'],
    };

    mockTagRepo.find.mockResolvedValue([]); // No tags exist
    mockTagRepo.create.mockImplementation((dto) => dto);
    mockTagRepo.save.mockImplementation((tag) => Promise.resolve({ id: 'tag-id', ...tag }));
    
    mockDrillRepo.create.mockImplementation((dto) => dto);
    mockDrillRepo.save.mockImplementation((drill) => Promise.resolve({ id: 'drill-id', ...drill }));

    const result = await service.import(coachId, importData);

    expect(result.name).toBe('AI Drill');
    expect(result.tags).toHaveLength(2);
    expect(mockTagRepo.save).toHaveBeenCalledTimes(2);
    expect(mockDrillRepo.save).toHaveBeenCalled();
  });

  it('should reuse existing tags during import', async () => {
    const coachId = 'coach-123';
    const importData = {
      name: 'AI Drill',
      description: 'Imported from AI',
      instructions: [{ step: 1, text: 'Run' }],
      tagNames: ['Existing'],
    };

    mockTagRepo.find.mockResolvedValue([{ id: 't1', name: 'Existing', coachId }]);
    mockDrillRepo.create.mockImplementation((dto) => dto);
    mockDrillRepo.save.mockImplementation((drill) => Promise.resolve({ id: 'drill-id', ...drill }));

    const result = await service.import(coachId, importData);

    expect(result.tags).toHaveLength(1);
    expect(result.tags[0].id).toBe('t1');
    expect(mockTagRepo.save).not.toHaveBeenCalled();
  });
});
