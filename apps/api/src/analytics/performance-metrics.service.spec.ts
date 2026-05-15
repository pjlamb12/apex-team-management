import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PerformanceMetricsService } from './performance-metrics.service';
import { GameEventEntity } from '../entities/game-event.entity';
import { PlayerEntity } from '../entities/player.entity';
import { EventEntity } from '../entities/event.entity';
import { AttendanceEntity } from '../entities/attendance.entity';
import { vi } from 'vitest';

describe('PerformanceMetricsService', () => {
  let service: PerformanceMetricsService;
  let gameEventRepo: Repository<GameEventEntity>;
  let playerRepo: Repository<PlayerEntity>;
  let eventRepo: Repository<EventEntity>;
  let attendanceRepo: Repository<AttendanceEntity>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PerformanceMetricsService,
        {
          provide: getRepositoryToken(GameEventEntity),
          useValue: {
            find: vi.fn(),
          },
        },
        {
          provide: getRepositoryToken(PlayerEntity),
          useValue: {
            find: vi.fn(),
          },
        },
        {
          provide: getRepositoryToken(EventEntity),
          useValue: {
            find: vi.fn(),
          },
        },
        {
          provide: getRepositoryToken(AttendanceEntity),
          useValue: {
            find: vi.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PerformanceMetricsService>(PerformanceMetricsService);
    gameEventRepo = module.get<Repository<GameEventEntity>>(getRepositoryToken(GameEventEntity));
    playerRepo = module.get<Repository<PlayerEntity>>(getRepositoryToken(PlayerEntity));
    eventRepo = module.get<Repository<EventEntity>>(getRepositoryToken(EventEntity));
    attendanceRepo = module.get<Repository<AttendanceEntity>>(getRepositoryToken(AttendanceEntity));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getTeamMetrics', () => {
    const teamId = 'team-1';
    const player1 = { id: 'p1', firstName: 'John', lastName: 'Doe' };

    it('should aggregate metrics correctly', async () => {
      vi.spyOn(playerRepo, 'find').mockResolvedValue([player1] as any);
      vi.spyOn(eventRepo, 'find').mockResolvedValue([{ id: 'e1' }] as any);
      vi.spyOn(attendanceRepo, 'find').mockResolvedValue([
        { playerId: 'p1', eventId: 'e1', status: 'present' }
      ] as any);
      vi.spyOn(gameEventRepo, 'find').mockResolvedValue([
        { eventType: 'GOAL', payload: { scorerId: 'p1', assistorId: 'p2' } },
        { eventType: 'YELLOW_CARD', payload: { playerId: 'p1' } },
      ] as any);

      const result = await service.getTeamMetrics(teamId);
      
      expect(result).toHaveLength(1);
      const m1 = result.find(r => r.playerId === 'p1');
      expect(m1?.goals).toBe(1);
      expect(m1?.yellowCards).toBe(1);
      expect(m1?.gamesPlayed).toBe(1);
    });

    it('should handle goals with assistorId', async () => {
      vi.spyOn(playerRepo, 'find').mockResolvedValue([
        { id: 'p1', firstName: 'Scorer' },
        { id: 'p2', firstName: 'Assistor' }
      ] as any);
      vi.spyOn(eventRepo, 'find').mockResolvedValue([{ id: 'e1' }] as any);
      vi.spyOn(attendanceRepo, 'find').mockResolvedValue([] as any);
      vi.spyOn(gameEventRepo, 'find').mockResolvedValue([
        { eventType: 'GOAL', payload: { scorerId: 'p1', assistorId: 'p2' } },
      ] as any);

      const result = await service.getTeamMetrics(teamId);
      
      const m1 = result.find(r => r.playerId === 'p1');
      const m2 = result.find(r => r.playerId === 'p2');
      expect(m1?.goals).toBe(1);
      expect(m2?.assists).toBe(1);
    });

    it('should handle red cards', async () => {
      vi.spyOn(playerRepo, 'find').mockResolvedValue([player1] as any);
      vi.spyOn(eventRepo, 'find').mockResolvedValue([{ id: 'e1' }] as any);
      vi.spyOn(attendanceRepo, 'find').mockResolvedValue([] as any);
      vi.spyOn(gameEventRepo, 'find').mockResolvedValue([
        { eventType: 'RED_CARD', payload: { playerId: 'p1' } },
      ] as any);

      const result = await service.getTeamMetrics(teamId);
      expect(result[0].redCards).toBe(1);
    });
  });
});
