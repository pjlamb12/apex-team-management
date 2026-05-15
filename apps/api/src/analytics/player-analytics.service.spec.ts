import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlayerAnalyticsService } from './player-analytics.service';
import { PlayerEntity } from '../entities/player.entity';
import { EventEntity } from '../entities/event.entity';
import { AttendanceEntity } from '../entities/attendance.entity';
import { GameEventEntity } from '../entities/game-event.entity';
import { PlayingTimeService } from './playing-time.service';
import { NotFoundException } from '@nestjs/common';
import { vi } from 'vitest';

describe('PlayerAnalyticsService', () => {
  let service: PlayerAnalyticsService;
  let playerRepo: Repository<PlayerEntity>;
  let eventRepo: Repository<EventEntity>;
  let attendanceRepo: Repository<AttendanceEntity>;
  let gameEventRepo: Repository<GameEventEntity>;
  let playingTimeService: PlayingTimeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlayerAnalyticsService,
        {
          provide: getRepositoryToken(PlayerEntity),
          useValue: { findOne: vi.fn() },
        },
        {
          provide: getRepositoryToken(EventEntity),
          useValue: { find: vi.fn() },
        },
        {
          provide: getRepositoryToken(AttendanceEntity),
          useValue: { find: vi.fn() },
        },
        {
          provide: getRepositoryToken(GameEventEntity),
          useValue: { find: vi.fn() },
        },
        {
          provide: PlayingTimeService,
          useValue: { calculateForEvent: vi.fn() },
        },
      ],
    }).compile();

    service = module.get<PlayerAnalyticsService>(PlayerAnalyticsService);
    playerRepo = module.get<Repository<PlayerEntity>>(getRepositoryToken(PlayerEntity));
    eventRepo = module.get<Repository<EventEntity>>(getRepositoryToken(EventEntity));
    attendanceRepo = module.get<Repository<AttendanceEntity>>(getRepositoryToken(AttendanceEntity));
    gameEventRepo = module.get<Repository<GameEventEntity>>(getRepositoryToken(GameEventEntity));
    playingTimeService = module.get<PlayingTimeService>(PlayingTimeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPlayerProfile', () => {
    const teamId = 'team-1';
    const playerId = 'player-1';

    it('should throw NotFoundException if player does not exist', async () => {
      vi.spyOn(playerRepo, 'findOne').mockResolvedValue(null);
      await expect(service.getPlayerProfile(playerId, teamId)).rejects.toThrow(NotFoundException);
    });

    it('should aggregate player stats correctly', async () => {
      const player = { id: playerId, firstName: 'John', lastName: 'Doe', teamId };
      const event = { id: 'event-1', type: 'game', opponent: 'Rivals', scheduledAt: new Date() };
      
      vi.spyOn(playerRepo, 'findOne').mockResolvedValue(player as any);
      vi.spyOn(eventRepo, 'find').mockResolvedValue([event] as any);
      vi.spyOn(attendanceRepo, 'find').mockResolvedValue([
        { eventId: 'event-1', status: 'present' }
      ] as any);
      vi.spyOn(gameEventRepo, 'find').mockResolvedValue([
        { eventId: 'event-1', eventType: 'GOAL', payload: { scorerId: playerId } }
      ] as any);
      vi.spyOn(playingTimeService, 'calculateForEvent').mockResolvedValue({
        [playerId]: { totalSeconds: 3000, positionSeconds: { 'FWD': 3000 } }
      } as any);

      const result = await service.getPlayerProfile(playerId, teamId);

      expect(result.player.firstName).toBe('John');
      expect(result.totalGoals).toBe(1);
      expect(result.totalMinutes).toBe(50);
      expect(result.history).toHaveLength(1);
      expect(result.history[0].status).toBe('present');
    });
  });
});
