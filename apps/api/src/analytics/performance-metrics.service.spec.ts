import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PerformanceMetricsService } from './performance-metrics.service';
import { GameEventEntity } from '../entities/game-event.entity';
import { PlayerEntity } from '../entities/player.entity';
import { EventEntity } from '../entities/event.entity';
import { AttendanceEntity } from '../entities/attendance.entity';
import { LineupEntryEntity } from '../entities/lineup-entry.entity';
import { vi } from 'vitest';

describe('PerformanceMetricsService', () => {
  let service: PerformanceMetricsService;
  let gameEventRepo: Repository<GameEventEntity>;
  let playerRepo: Repository<PlayerEntity>;
  let eventRepo: Repository<EventEntity>;
  let attendanceRepo: Repository<AttendanceEntity>;
  let lineupRepo: Repository<LineupEntryEntity>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PerformanceMetricsService,
        {
          provide: getRepositoryToken(GameEventEntity),
          useValue: {
            find: vi.fn().mockResolvedValue([]),
          },
        },
        {
          provide: getRepositoryToken(PlayerEntity),
          useValue: {
            find: vi.fn().mockResolvedValue([]),
          },
        },
        {
          provide: getRepositoryToken(EventEntity),
          useValue: {
            find: vi.fn().mockResolvedValue([]),
          },
        },
        {
          provide: getRepositoryToken(AttendanceEntity),
          useValue: {
            find: vi.fn().mockResolvedValue([]),
          },
        },
        {
          provide: getRepositoryToken(LineupEntryEntity),
          useValue: {
            find: vi.fn().mockResolvedValue([]),
          },
        },
      ],
    }).compile();

    service = module.get<PerformanceMetricsService>(PerformanceMetricsService);
    gameEventRepo = module.get<Repository<GameEventEntity>>(getRepositoryToken(GameEventEntity));
    playerRepo = module.get<Repository<PlayerEntity>>(getRepositoryToken(PlayerEntity));
    eventRepo = module.get<Repository<EventEntity>>(getRepositoryToken(EventEntity));
    attendanceRepo = module.get<Repository<AttendanceEntity>>(getRepositoryToken(AttendanceEntity));
    lineupRepo = module.get<Repository<LineupEntryEntity>>(getRepositoryToken(LineupEntryEntity));
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

    it('should only give guest players appearance credit if they actually participated in lineup or events', async () => {
      const regularPlayer = { id: 'p1', firstName: 'Regular', isGuest: false };
      const guestPlayerParticipated = { id: 'g1', firstName: 'Guest1', isGuest: true };
      const guestPlayerUnparticipated = { id: 'g2', firstName: 'Guest2', isGuest: true };

      vi.spyOn(playerRepo, 'find').mockResolvedValue([regularPlayer, guestPlayerParticipated, guestPlayerUnparticipated] as any);
      vi.spyOn(eventRepo, 'find').mockResolvedValue([{ id: 'e1' }] as any);
      // All 3 were marked present in attendance
      vi.spyOn(attendanceRepo, 'find').mockResolvedValue([
        { playerId: 'p1', eventId: 'e1', status: 'present' },
        { playerId: 'g1', eventId: 'e1', status: 'present' },
        { playerId: 'g2', eventId: 'e1', status: 'present' },
      ] as any);
      // Only g1 was in the lineup for e1
      vi.spyOn(lineupRepo, 'find').mockResolvedValue([
        { playerId: 'p1', eventId: 'e1' },
        { playerId: 'g1', eventId: 'e1' },
      ] as any);
      vi.spyOn(gameEventRepo, 'find').mockResolvedValue([] as any);

      const result = await service.getTeamMetrics(teamId);

      const reg = result.find(r => r.playerId === 'p1');
      const g1 = result.find(r => r.playerId === 'g1');
      const g2 = result.find(r => r.playerId === 'g2');

      expect(reg?.gamesPlayed).toBe(1);
      expect(g1?.gamesPlayed).toBe(1);
      // g2 did not participate, so gamesPlayed is 0 and they are filtered out
      expect(g2).toBeUndefined();
    });
  });
});

