import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AttendanceService } from './attendance.service';
import { AttendanceEntity } from '../entities/attendance.entity';
import { EventEntity } from '../entities/event.entity';
import { PlayerEntity } from '../entities/player.entity';
import { LineupEntryEntity } from '../entities/lineup-entry.entity';
import { vi } from 'vitest';

describe('AttendanceService', () => {
  let service: AttendanceService;
  let attendanceRepo: Repository<AttendanceEntity>;
  let eventRepo: Repository<EventEntity>;
  let playerRepo: Repository<PlayerEntity>;
  let lineupRepo: Repository<LineupEntryEntity>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendanceService,
        {
          provide: getRepositoryToken(AttendanceEntity),
          useValue: {
            find: vi.fn(),
            findOne: vi.fn(),
            create: vi.fn(),
            save: vi.fn(),
          },
        },
        {
          provide: getRepositoryToken(EventEntity),
          useValue: {
            findOne: vi.fn(),
          },
        },
        {
          provide: getRepositoryToken(PlayerEntity),
          useValue: {
            find: vi.fn(),
          },
        },
        {
          provide: getRepositoryToken(LineupEntryEntity),
          useValue: {
            find: vi.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AttendanceService>(AttendanceService);
    attendanceRepo = module.get<Repository<AttendanceEntity>>(getRepositoryToken(AttendanceEntity));
    eventRepo = module.get<Repository<EventEntity>>(getRepositoryToken(EventEntity));
    playerRepo = module.get<Repository<PlayerEntity>>(getRepositoryToken(PlayerEntity));
    lineupRepo = module.get<Repository<LineupEntryEntity>>(getRepositoryToken(LineupEntryEntity));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('update', () => {
    it('should create new attendance if none exists', async () => {
      const dto = { playerId: 'p1', status: 'present' as const };
      vi.spyOn(attendanceRepo, 'findOne').mockResolvedValue(null);
      vi.spyOn(attendanceRepo, 'create').mockReturnValue({ ...dto, eventId: 'e1' } as any);
      vi.spyOn(attendanceRepo, 'save').mockResolvedValue({ id: 'a1', ...dto, eventId: 'e1' } as any);

      const result = await service.update('e1', dto);
      expect(result.id).toBe('a1');
      expect(attendanceRepo.create).toHaveBeenCalled();
    });

    it('should update existing attendance', async () => {
      const dto = { playerId: 'p1', status: 'tardy' as const };
      const existing = { id: 'a1', playerId: 'p1', eventId: 'e1', status: 'present' };
      vi.spyOn(attendanceRepo, 'findOne').mockResolvedValue(existing as any);
      vi.spyOn(attendanceRepo, 'save').mockResolvedValue({ ...existing, status: 'tardy' } as any);

      const result = await service.update('e1', dto);
      expect(result.status).toBe('tardy');
      expect(attendanceRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('getParticipationStats', () => {
    it('should calculate percentages correctly', async () => {
      const players = [{ id: 'p1', firstName: 'John', lastName: 'Doe' }];
      const attendance = [
        { id: 'a1', status: 'present', event: { seasonId: 's1' } },
        { id: 'a2', status: 'absent', event: { seasonId: 's1' } },
      ];
      vi.spyOn(playerRepo, 'find').mockResolvedValue(players as any);
      vi.spyOn(attendanceRepo, 'find').mockResolvedValue(attendance as any);

      const stats = await service.getParticipationStats('t1', 's1');
      expect(stats[0].totalEvents).toBe(2);
      expect(stats[0].present).toBe(1);
      expect(stats[0].percentage).toBe(50);
    });
  });
});
