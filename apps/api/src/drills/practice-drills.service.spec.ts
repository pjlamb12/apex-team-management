import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PracticeDrillsService } from './practice-drills.service';
import { PracticeDrillEntity } from '../entities/practice-drill.entity';
import { EventEntity } from '../entities/event.entity';
import { DrillEntity } from '../entities/drill.entity';

describe('PracticeDrillsService', () => {
  let service: PracticeDrillsService;
  let practiceDrillRepo: any;
  let eventRepo: any;
  let drillRepo: any;
  let dataSource: any;

  const mockUser = { id: 'user-1' };
  const mockEvent = {
    id: 'event-1',
    type: 'practice',
    status: 'scheduled',
    season: {
      team: {
        coachId: 'user-1',
      },
    },
  };
  const mockDrill = {
    id: 'drill-1',
    coachId: 'user-1',
  };

  beforeEach(async () => {
    practiceDrillRepo = {
      find: vi.fn(),
      findOne: vi.fn(),
      create: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
      maximum: vi.fn(),
    };
    eventRepo = {
      findOne: vi.fn(),
    };
    drillRepo = {
      findOne: vi.fn(),
    };
    dataSource = {
      transaction: vi.fn().mockImplementation((cb) => cb({ update: vi.fn() })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PracticeDrillsService,
        {
          provide: getRepositoryToken(PracticeDrillEntity),
          useValue: practiceDrillRepo,
        },
        {
          provide: getRepositoryToken(EventEntity),
          useValue: eventRepo,
        },
        {
          provide: getRepositoryToken(DrillEntity),
          useValue: drillRepo,
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
      ],
    }).compile();

    service = module.get<PracticeDrillsService>(PracticeDrillsService);
  });

  describe('findAllForEvent', () => {
    it('should return drills for the event if owned by coach', async () => {
      eventRepo.findOne.mockResolvedValue(mockEvent);
      practiceDrillRepo.find.mockResolvedValue([{ id: 'pd-1' }]);

      const result = await service.findAllForEvent(mockUser.id, mockEvent.id);

      expect(result).toEqual([{ id: 'pd-1' }]);
      expect(eventRepo.findOne).toHaveBeenCalledWith(expect.objectContaining({ where: { id: mockEvent.id } }));
    });

    it('should throw ForbiddenException if coach does not own the event', async () => {
      eventRepo.findOne.mockResolvedValue({
        ...mockEvent,
        season: { team: { coachId: 'other-user' } },
      });

      await expect(service.findAllForEvent(mockUser.id, mockEvent.id)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('addDrillToPlan', () => {
    it('should add a drill to the practice plan', async () => {
      eventRepo.findOne.mockResolvedValue(mockEvent);
      drillRepo.findOne.mockResolvedValue(mockDrill);
      practiceDrillRepo.maximum.mockResolvedValue(5);
      practiceDrillRepo.create.mockReturnValue({ id: 'pd-new' });
      practiceDrillRepo.save.mockResolvedValue({ id: 'pd-new', sequence: 6 });

      const dto = { drillId: 'drill-1', durationMinutes: 15 };
      const result = await service.addDrillToPlan(mockUser.id, mockEvent.id, dto);

      expect(result.id).toBe('pd-new');
      expect(practiceDrillRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        sequence: 6,
        durationMinutes: 15,
      }));
    });

    it('should throw BadRequestException if event is not a practice', async () => {
      eventRepo.findOne.mockResolvedValue({ ...mockEvent, type: 'game' });

      const dto = { drillId: 'drill-1', durationMinutes: 15 };
      await expect(service.addDrillToPlan(mockUser.id, mockEvent.id, dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if drill is not found or not owned', async () => {
      eventRepo.findOne.mockResolvedValue(mockEvent);
      drillRepo.findOne.mockResolvedValue(null);

      const dto = { drillId: 'drill-1', durationMinutes: 15 };
      await expect(service.addDrillToPlan(mockUser.id, mockEvent.id, dto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update practice drill metadata', async () => {
      eventRepo.findOne.mockResolvedValue(mockEvent);
      practiceDrillRepo.findOne.mockResolvedValue({ id: 'pd-1', notes: 'old' });
      practiceDrillRepo.save.mockImplementation((pd) => pd);

      const dto = { notes: 'new', durationMinutes: 20 };
      const result = await service.update(mockUser.id, mockEvent.id, 'pd-1', dto);

      expect(result.notes).toBe('new');
      expect(result.durationMinutes).toBe(20);
    });

    it('should throw BadRequestException if setting rating for scheduled practice', async () => {
      eventRepo.findOne.mockResolvedValue(mockEvent); // status: scheduled
      practiceDrillRepo.findOne.mockResolvedValue({ id: 'pd-1' });

      const dto = { teamRating: 5 };
      await expect(service.update(mockUser.id, mockEvent.id, 'pd-1', dto)).rejects.toThrow(BadRequestException);
    });

    it('should allow setting rating for in-progress practice', async () => {
      eventRepo.findOne.mockResolvedValue({ ...mockEvent, status: 'in_progress' });
      practiceDrillRepo.findOne.mockResolvedValue({ id: 'pd-1' });
      practiceDrillRepo.save.mockImplementation((pd) => pd);

      const dto = { teamRating: 5 };
      const result = await service.update(mockUser.id, mockEvent.id, 'pd-1', dto);

      expect(result.teamRating).toBe(5);
    });
  });

  describe('remove', () => {
    it('should remove the drill association', async () => {
      eventRepo.findOne.mockResolvedValue(mockEvent);
      practiceDrillRepo.delete.mockResolvedValue({ affected: 1 });

      await service.remove(mockUser.id, mockEvent.id, 'pd-1');

      expect(practiceDrillRepo.delete).toHaveBeenCalledWith({ id: 'pd-1', eventId: mockEvent.id });
    });

    it('should throw NotFoundException if association does not exist', async () => {
      eventRepo.findOne.mockResolvedValue(mockEvent);
      practiceDrillRepo.delete.mockResolvedValue({ affected: 0 });

      await expect(service.remove(mockUser.id, mockEvent.id, 'pd-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('reorder', () => {
    it('should update sequences in a transaction', async () => {
      eventRepo.findOne.mockResolvedValue(mockEvent);
      practiceDrillRepo.find.mockResolvedValue([{ id: 'pd-1' }, { id: 'pd-2' }]);
      
      const manager = { update: vi.fn() };
      dataSource.transaction.mockImplementation(async (cb) => cb(manager));

      const dto = { ids: ['pd-1', 'pd-2'] };
      await service.reorder(mockUser.id, mockEvent.id, dto);

      expect(manager.update).toHaveBeenCalledTimes(2);
      expect(manager.update).toHaveBeenNthCalledWith(1, PracticeDrillEntity, { id: 'pd-1', eventId: mockEvent.id }, { sequence: 1 });
      expect(manager.update).toHaveBeenNthCalledWith(2, PracticeDrillEntity, { id: 'pd-2', eventId: mockEvent.id }, { sequence: 2 });
    });

    it('should throw BadRequestException if some IDs are missing', async () => {
      eventRepo.findOne.mockResolvedValue(mockEvent);
      practiceDrillRepo.find.mockResolvedValue([{ id: 'pd-1' }]); // Only 1 found

      const dto = { ids: ['pd-1', 'pd-2'] };
      await expect(service.reorder(mockUser.id, mockEvent.id, dto)).rejects.toThrow(BadRequestException);
    });
  });
});
