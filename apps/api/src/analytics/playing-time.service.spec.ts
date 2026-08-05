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
            find: vi.fn(),
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

    it('should return zero playtime for all players if there are no game events', async () => {
      vi.spyOn(eventRepo, 'findOne').mockResolvedValue({ id: eventId, status: 'completed', durationMinutes: 90 } as any);
      vi.spyOn(lineupRepo, 'find').mockResolvedValue([
        { playerId: player1, status: 'starting', positionName: 'GK' },
      ] as any);
      vi.spyOn(gameEventRepo, 'find').mockResolvedValue([]);

      const result = await service.calculateForEvent(eventId);
      expect(result[player1].totalSeconds).toBe(0);
      expect(result[player1].positionSeconds['GK']).toBeUndefined();
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

    it('should ignore duplicate PERIOD_END events for the same period without double counting playing time', async () => {
      vi.spyOn(eventRepo, 'findOne').mockResolvedValue({ id: eventId, status: 'completed', durationMinutes: 50, periodLengthMinutes: 25 } as any);
      vi.spyOn(lineupRepo, 'find').mockResolvedValue([
        { playerId: player1, status: 'starting', positionName: 'MID' },
      ] as any);

      // Period 1 ends at 25m, Period 2 ends at 25m, and a duplicate PERIOD_END for period 2 exists 7 seconds later
      vi.spyOn(gameEventRepo, 'find').mockResolvedValue([
        {
          eventType: 'PERIOD_END',
          minuteOccurred: 25,
          payload: { period: 1, gameTimeMs: 25 * 60 * 1000 },
        },
        {
          eventType: 'PERIOD_END',
          minuteOccurred: 25,
          payload: { period: 2, gameTimeMs: 25 * 60 * 1000 },
        },
        {
          eventType: 'PERIOD_END',
          minuteOccurred: 25,
          payload: { period: 2, gameTimeMs: (25 * 60 + 7) * 1000 },
        },
      ] as any);

      const result = await service.calculateForEvent(eventId);
      // P1 (25m) + P2 (25m) = 50m total (3000s), NOT 75m (4500s)
      expect(result[player1].totalSeconds).toBe(50 * 60);
    });

    it('should correctly assign halftime substitution events logged after period 1 end to period 2', async () => {
      vi.spyOn(eventRepo, 'findOne').mockResolvedValue({ id: eventId, status: 'completed', durationMinutes: 50, periodLengthMinutes: 25 } as any);
      vi.spyOn(lineupRepo, 'find').mockResolvedValue([
        { playerId: player1, status: 'starting', positionName: 'MID' },
        { playerId: player2, status: 'bench', positionName: 'MID' },
      ] as any);

      const pe1Time = new Date('2026-08-04T22:09:44Z');
      const halftimeSubTime = new Date('2026-08-04T22:15:24Z');

      vi.spyOn(gameEventRepo, 'find').mockResolvedValue([
        {
          eventType: 'PERIOD_END',
          minuteOccurred: 25,
          payload: { period: 1, gameTimeMs: 25 * 60 * 1000, timestamp: pe1Time.getTime() },
          createdAt: pe1Time,
        },
        // Halftime sub created 6 min after P1 end, carrying period 1 and gameTimeMs 0
        {
          eventType: 'SUB',
          minuteOccurred: 1,
          payload: { period: 1, gameTimeMs: 0, outPlayerId: player1, inPlayerId: player2, positionName: 'MID', timestamp: halftimeSubTime.getTime() },
          createdAt: halftimeSubTime,
        },
        {
          eventType: 'PERIOD_END',
          minuteOccurred: 25,
          payload: { period: 2, gameTimeMs: 25 * 60 * 1000, timestamp: pe1Time.getTime() + 30 * 60 * 1000 },
          createdAt: new Date(pe1Time.getTime() + 30 * 60 * 1000),
        },
      ] as any);

      const result = await service.calculateForEvent(eventId);
      // player1 started P1 and played all 25 mins of P1; was subbed off for P2 at halftime -> 25 mins (1500s)
      expect(result[player1].totalSeconds).toBe(25 * 60);
      // player2 played all 25 mins of P2 -> 25 mins (1500s)
      expect(result[player2].totalSeconds).toBe(25 * 60);
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

    it('should correctly calculate position time when POSITION_SWAP uses slotIndexA and slotIndexB', async () => {
      const p1 = 'player-1';
      const p2 = 'player-2';

      vi.spyOn(eventRepo, 'findOne').mockResolvedValue({ id: eventId, status: 'completed', durationMinutes: 90 } as any);
      vi.spyOn(lineupRepo, 'find').mockResolvedValue([
        { playerId: p1, status: 'starting', slotIndex: 1, positionName: 'DEF' },
        { playerId: p2, status: 'starting', slotIndex: 8, positionName: 'MID' },
      ] as any);

      // Swap slots 1 (DEF) and 8 (MID) at 30:00 without explicit player IDs
      vi.spyOn(gameEventRepo, 'find').mockResolvedValue([
        {
          eventType: 'POSITION_SWAP',
          minuteOccurred: 31,
          payload: { slotIndexA: 1, slotIndexB: 8, positionNameA: 'MID', positionNameB: 'DEF', gameTimeMs: 30 * 60 * 1000 },
        },
      ] as any);

      const result = await service.calculateForEvent(eventId);

      // p1: 30m in DEF, 60m in MID
      expect(result[p1].totalSeconds).toBe(90 * 60);
      expect(result[p1].positionSeconds['DEF']).toBe(30 * 60);
      expect(result[p1].positionSeconds['MID']).toBe(60 * 60);

      // p2: 30m in MID, 60m in DEF
      expect(result[p2].totalSeconds).toBe(90 * 60);
      expect(result[p2].positionSeconds['MID']).toBe(30 * 60);
      expect(result[p2].positionSeconds['DEF']).toBe(60 * 60);
    });

    it('should correctly sort POSITION_SWAP events when createdAt is later than game events (out-of-order / backfilled)', async () => {
      const p1 = 'player-1';
      const p2 = 'player-2';

      vi.spyOn(eventRepo, 'findOne').mockResolvedValue({ id: eventId, status: 'completed', durationMinutes: 90, periodLengthMinutes: 45 } as any);
      vi.spyOn(lineupRepo, 'find').mockResolvedValue([
        { playerId: p1, status: 'starting', slotIndex: 1, positionName: 'DEF' },
        { playerId: p2, status: 'starting', slotIndex: 7, positionName: 'MID' },
      ] as any);

      // PERIOD_END created earlier, but POSITION_SWAP inserted later via SQL query with gameTimeMs: 0 in period 2
      vi.spyOn(gameEventRepo, 'find').mockResolvedValue([
        {
          eventType: 'PERIOD_END',
          minuteOccurred: 45,
          payload: { period: 1, gameTimeMs: 45 * 60 * 1000 },
          createdAt: new Date('2026-08-04T01:00:00Z'),
        },
        {
          eventType: 'PERIOD_END',
          minuteOccurred: 45,
          payload: { period: 2, gameTimeMs: 45 * 60 * 1000 },
          createdAt: new Date('2026-08-04T01:45:00Z'),
        },
        {
          eventType: 'POSITION_SWAP',
          minuteOccurred: 1,
          payload: { period: 2, gameTimeMs: 0, slotIndexA: 1, slotIndexB: 7, playerIdA: p1, playerIdB: p2, positionNameA: 'MID', positionNameB: 'DEF' },
          createdAt: new Date('2026-08-04T03:57:00Z'), // Inserted hours later!
        },
      ] as any);

      const result = await service.calculateForEvent(eventId);

      // p1: 45m in DEF in P1; 45m in MID in P2 (after swap at P2 gameTimeMs 0)
      expect(result[p1].totalSeconds).toBe(90 * 60);
      expect(result[p1].positionSeconds['DEF']).toBe(45 * 60);
      expect(result[p1].positionSeconds['MID']).toBe(45 * 60);

      // p2: 45m in MID in P1; 45m in DEF in P2 (after swap at P2 gameTimeMs 0)
      expect(result[p2].totalSeconds).toBe(90 * 60);
      expect(result[p2].positionSeconds['MID']).toBe(45 * 60);
      expect(result[p2].positionSeconds['DEF']).toBe(45 * 60);
    });

    it('should handle duplicate sub ins without losing playing time', async () => {
      vi.spyOn(eventRepo, 'findOne').mockResolvedValue({ id: eventId, status: 'completed', durationMinutes: 90 } as any);
      vi.spyOn(lineupRepo, 'find').mockResolvedValue([
        { playerId: player1, status: 'starting', positionName: 'MID' },
      ] as any);

      // player 1 starts (0), subbed out at 10.
      // player 1 subbed back in at 20.
      // player 1 subbed in again at 30 (without an explicit sub out in between).
      // player 1 plays to end (90).
      vi.spyOn(gameEventRepo, 'find').mockResolvedValue([
        {
          eventType: 'SUB',
          minuteOccurred: 11,
          payload: { outPlayerId: player1, inPlayerId: 'p2', positionName: 'MID', gameTimeMs: 10 * 60 * 1000 },
        },
        {
          eventType: 'SUB',
          minuteOccurred: 21,
          payload: { outPlayerId: 'p2', inPlayerId: player1, positionName: 'MID', gameTimeMs: 20 * 60 * 1000 },
        },
        {
          eventType: 'SUB',
          minuteOccurred: 31,
          payload: { outPlayerId: 'p3', inPlayerId: player1, positionName: 'MID', gameTimeMs: 30 * 60 * 1000 },
        },
      ] as any);

      const result = await service.calculateForEvent(eventId);
      // player 1 should get:
      // stint 1: 0 to 10 (10 mins)
      // stint 2: 20 to 30 (10 mins)
      // stint 3: 30 to 90 (60 mins)
      // total = 80 mins
      expect(result[player1].totalSeconds).toBe(80 * 60);
    });

    it('should calculate points-based playtime correctly for Volleyball events', async () => {
      const p1 = 'player-v1';
      const p2 = 'player-v2';
      
      vi.spyOn(eventRepo, 'findOne').mockResolvedValue({
        id: eventId,
        season: {
          team: {
            sport: {
              name: 'Volleyball'
            }
          }
        }
      } as any);

      vi.spyOn(lineupRepo, 'find').mockResolvedValue([
        { playerId: p1, status: 'starting', positionName: 'Setter' },
        { playerId: p2, status: 'bench', positionName: 'Libero' },
      ] as any);

      vi.spyOn(gameEventRepo, 'find').mockResolvedValue([
        { eventType: 'KILL', payload: {} },
        { eventType: 'ACE', payload: {} },
        { eventType: 'SUB', payload: { outPlayerId: p1, inPlayerId: p2, positionName: 'Libero' } },
        { eventType: 'BLOCK', payload: {} },
        { eventType: 'POINT_WON', payload: {} },
      ] as any);

      const result = await service.calculateForEvent(eventId);

      expect(result[p1].totalSeconds).toBe(2);
      expect(result[p1].positionSeconds['Setter']).toBe(2);

      expect(result[p2].totalSeconds).toBe(2);
      expect(result[p2].positionSeconds['Libero']).toBe(2);
    });
  });

  describe('calculateForTeam', () => {
    const teamId = 'team-1';

    it('should aggregate playing time for team games but skip games with ignorePlayingTime: true', async () => {
      const event1 = { id: 'event-1', type: 'game', ignorePlayingTime: false };
      const event2 = { id: 'event-2', type: 'game', ignorePlayingTime: true };

      vi.spyOn(eventRepo, 'find').mockResolvedValue([event1, event2] as any);
      
      const calcMock = vi.spyOn(service, 'calculateForEvent');
      calcMock.mockImplementation(async (id) => {
        if (id === 'event-1') {
          return {
            'p1': { playerId: 'p1', totalSeconds: 1200, positionSeconds: { 'FWD': 1200 } }
          };
        }
        if (id === 'event-2') {
          return {
            'p1': { playerId: 'p1', totalSeconds: 1800, positionSeconds: { 'FWD': 1800 } }
          };
        }
        return {};
      });

      const result = await service.calculateForTeam(teamId);
      
      expect(calcMock).toHaveBeenCalledWith('event-1');
      expect(calcMock).not.toHaveBeenCalledWith('event-2');
      
      expect(result['p1']).toBeDefined();
      expect(result['p1'].totalSeconds).toBe(1200);
    });
  });
});
