import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlayingTimeService } from './playing-time.service';
import { EventEntity } from '../entities/event.entity';
import { GameEventEntity } from '../entities/game-event.entity';
import { LineupEntryEntity } from '../entities/lineup-entry.entity';
import { NotFoundException } from '@nestjs/common';
import { vi } from 'vitest';

describe('PlayingTimeService', () => {
  let service: PlayingTimeService;
  let eventRepo: Repository<EventEntity>;
  let gameEventRepo: Repository<GameEventEntity>;
  let lineupRepo: Repository<LineupEntryEntity>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlayingTimeService,
        {
          provide: getRepositoryToken(EventEntity),
          useValue: {
            findOne: vi.fn(),
          },
        },
        {
          provide: getRepositoryToken(GameEventEntity),
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

    service = module.get<PlayingTimeService>(PlayingTimeService);
    eventRepo = module.get<Repository<EventEntity>>(getRepositoryToken(EventEntity));
    gameEventRepo = module.get<Repository<GameEventEntity>>(getRepositoryToken(GameEventEntity));
    lineupRepo = module.get<Repository<LineupEntryEntity>>(getRepositoryToken(LineupEntryEntity));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateForEvent', () => {
    const eventId = 'event-1';
    const player1 = 'p1';
    const player2 = 'p2';

    it('should throw NotFoundException if event does not exist', async () => {
      vi.spyOn(eventRepo, 'findOne').mockResolvedValue(null);
      await expect(service.calculateForEvent(eventId)).rejects.toThrow(NotFoundException);
    });

    it('should calculate time for starting players with no events', async () => {
      vi.spyOn(eventRepo, 'findOne').mockResolvedValue({ id: eventId, status: 'completed', durationMinutes: 90 } as any);
      vi.spyOn(lineupRepo, 'find').mockResolvedValue([
        { playerId: player1, status: 'starting', positionName: 'GK' },
      ] as any);
      vi.spyOn(gameEventRepo, 'find').mockResolvedValue([]);

      const result = await service.calculateForEvent(eventId);
      expect(result[player1].totalSeconds).toBe(90 * 60);
      expect(result[player1].positionSeconds['GK']).toBe(90 * 60);
    });

    it('should handle substitutions', async () => {
      vi.spyOn(eventRepo, 'findOne').mockResolvedValue({ id: eventId, status: 'completed', durationMinutes: 90 } as any);
      vi.spyOn(lineupRepo, 'find').mockResolvedValue([
        { playerId: player1, status: 'starting', positionName: 'FWD' },
        { playerId: player2, status: 'bench', positionName: 'FWD' },
      ] as any);
      
      // Sub at minute 30
      vi.spyOn(gameEventRepo, 'find').mockResolvedValue([
        {
          eventType: 'SUB',
          minuteOccurred: 31, // In 31st minute means 30:00
          payload: { outPlayerId: player1, inPlayerId: player2, positionName: 'FWD', gameTimeMs: 30 * 60 * 1000 },
        },
      ] as any);

      const result = await service.calculateForEvent(eventId);
      expect(result[player1].totalSeconds).toBe(30 * 60);
      expect(result[player2].totalSeconds).toBe(60 * 60);
    });

    it('should handle period ends', async () => {
      vi.spyOn(eventRepo, 'findOne').mockResolvedValue({ id: eventId, status: 'completed', durationMinutes: 90, periodLengthMinutes: 45 } as any);
      vi.spyOn(lineupRepo, 'find').mockResolvedValue([
        { playerId: player1, status: 'starting', positionName: 'MID' },
      ] as any);

      // Period ends at 45:00. P2 starts.
      vi.spyOn(gameEventRepo, 'find').mockResolvedValue([
        {
          eventType: 'PERIOD_END',
          minuteOccurred: 45,
          payload: { period: 1, gameTimeMs: 45 * 60 * 1000 },
        },
      ] as any);

      const result = await service.calculateForEvent(eventId);
      // P1 (45m) + P2 (45m remaining) = 90m
      expect(result[player1].totalSeconds).toBe(90 * 60);
    });

    it('should handle position swaps', async () => {
      const p1 = 'p1';
      const p2 = 'p2';
      vi.spyOn(eventRepo, 'findOne').mockResolvedValue({ id: eventId, status: 'completed', durationMinutes: 90 } as any);
      vi.spyOn(lineupRepo, 'find').mockResolvedValue([
        { playerId: p1, status: 'starting', positionName: 'DEF' },
        { playerId: p2, status: 'starting', positionName: 'MID' },
      ] as any);

      // Swap at 20:00
      vi.spyOn(gameEventRepo, 'find').mockResolvedValue([
        {
          eventType: 'POSITION_SWAP',
          minuteOccurred: 21,
          payload: { playerIdA: p1, playerIdB: p2, gameTimeMs: 20 * 60 * 1000 },
        },
      ] as any);

      const result = await service.calculateForEvent(eventId);
      
      // p1: 20m in DEF, 70m in MID
      expect(result[p1].totalSeconds).toBe(90 * 60);
      expect(result[p1].positionSeconds['DEF']).toBe(20 * 60);
      expect(result[p1].positionSeconds['MID']).toBe(70 * 60);

      // p2: 20m in MID, 70m in DEF
      expect(result[p2].totalSeconds).toBe(90 * 60);
      expect(result[p2].positionSeconds['MID']).toBe(20 * 60);
      expect(result[p2].positionSeconds['DEF']).toBe(70 * 60);
    });
  });
});
