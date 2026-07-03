import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlayingTimeValidationService } from './playing-time-validation.service';
import { EventEntity } from '../entities/event.entity';
import { GameEventEntity } from '../entities/game-event.entity';
import { LineupEntryEntity } from '../entities/lineup-entry.entity';
import { PlayerEntity } from '../entities/player.entity';
import { NotFoundException } from '@nestjs/common';
import { vi } from 'vitest';

describe('PlayingTimeValidationService', () => {
  let service: PlayingTimeValidationService;
  let eventRepo: Repository<EventEntity>;
  let gameEventRepo: Repository<GameEventEntity>;
  let lineupRepo: Repository<LineupEntryEntity>;
  let playerRepo: Repository<PlayerEntity>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlayingTimeValidationService,
        {
          provide: getRepositoryToken(EventEntity),
          useValue: { findOne: vi.fn() },
        },
        {
          provide: getRepositoryToken(GameEventEntity),
          useValue: { find: vi.fn() },
        },
        {
          provide: getRepositoryToken(LineupEntryEntity),
          useValue: { find: vi.fn() },
        },
        {
          provide: getRepositoryToken(PlayerEntity),
          useValue: { find: vi.fn() },
        },
      ],
    }).compile();

    service = module.get<PlayingTimeValidationService>(PlayingTimeValidationService);
    eventRepo = module.get<Repository<EventEntity>>(getRepositoryToken(EventEntity));
    gameEventRepo = module.get<Repository<GameEventEntity>>(getRepositoryToken(GameEventEntity));
    lineupRepo = module.get<Repository<LineupEntryEntity>>(getRepositoryToken(LineupEntryEntity));
    playerRepo = module.get<Repository<PlayerEntity>>(getRepositoryToken(PlayerEntity));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateForEvent', () => {
    const eventId = 'event-1';

    it('should throw NotFoundException if event does not exist', async () => {
      vi.spyOn(eventRepo, 'findOne').mockResolvedValue(null);
      await expect(service.validateForEvent(eventId)).rejects.toThrow(NotFoundException);
    });

    it('should report no violations for a clean, correctly-alternating game', async () => {
      const p1 = 'p1';
      const p2 = 'p2';
      vi.spyOn(eventRepo, 'findOne').mockResolvedValue({ id: eventId } as any);
      vi.spyOn(lineupRepo, 'find').mockResolvedValue([
        { playerId: p1, status: 'starting' },
      ] as any);
      vi.spyOn(gameEventRepo, 'find').mockResolvedValue([
        {
          id: 'g1',
          eventType: 'SUB',
          minuteOccurred: 10,
          payload: { period: 1, gameTimeMs: 10 * 60 * 1000, outPlayerId: p1, inPlayerId: p2 },
        },
        {
          id: 'g2',
          eventType: 'SUB',
          minuteOccurred: 20,
          payload: { period: 1, gameTimeMs: 20 * 60 * 1000, outPlayerId: p2, inPlayerId: p1 },
        },
        {
          id: 'g3',
          eventType: 'SUB',
          minuteOccurred: 5,
          payload: { period: 2, gameTimeMs: 5 * 60 * 1000, outPlayerId: p1, inPlayerId: p2 },
        },
      ] as any);

      const report = await service.validateForEvent(eventId);
      expect(report.isValid).toBe(true);
      expect(report.violations).toEqual([]);
      expect(report.suggestedCorrections).toEqual([]);
    });

    it('should detect and suggest a fix for a mis-attributed outgoing player (Hayes/Ryder regression)', async () => {
      const hayes = 'hayes-id';
      const ryder = 'ryder-id';
      const playerC = 'player-c-id';
      const playerD = 'player-d-id';
      const playerE = 'player-e-id';

      vi.spyOn(eventRepo, 'findOne').mockResolvedValue({ id: eventId } as any);
      vi.spyOn(lineupRepo, 'find').mockResolvedValue([
        { playerId: hayes, status: 'starting' },
        { playerId: ryder, status: 'starting' },
        { playerId: playerE, status: 'starting' },
      ] as any);
      vi.spyOn(playerRepo, 'find').mockResolvedValue([
        { id: hayes, firstName: 'Hayes', lastName: 'Gray' },
        { id: ryder, firstName: 'Ryder', lastName: 'King' },
      ] as any);

      // ge-4 ("b91a5ae6") wrongly records Hayes as the outgoing player at minute 29 of
      // period 1 -- it should have been Ryder, who re-entered at ge-3 (minute 18) and was
      // never actually subbed off until this substitution.
      const events = [
        {
          id: 'ge-1',
          eventType: 'SUB',
          minuteOccurred: 8,
          payload: { period: 1, gameTimeMs: 8 * 60 * 1000, outPlayerId: hayes, inPlayerId: playerC },
        },
        {
          id: 'ge-2',
          eventType: 'SUB',
          minuteOccurred: 11,
          payload: { period: 1, gameTimeMs: 11 * 60 * 1000, outPlayerId: ryder, inPlayerId: hayes },
        },
        {
          id: 'ge-3',
          eventType: 'SUB',
          minuteOccurred: 18,
          payload: { period: 1, gameTimeMs: 18 * 60 * 1000, outPlayerId: playerC, inPlayerId: ryder },
        },
        {
          id: 'ge-4',
          eventType: 'SUB',
          minuteOccurred: 29,
          payload: { period: 1, gameTimeMs: 29 * 60 * 1000, outPlayerId: hayes, inPlayerId: playerD },
        },
        {
          id: 'ge-6',
          eventType: 'SUB',
          minuteOccurred: 12,
          payload: { period: 2, gameTimeMs: 12 * 60 * 1000, outPlayerId: playerE, inPlayerId: ryder },
        },
        {
          id: 'ge-5',
          eventType: 'SUB',
          minuteOccurred: 22,
          payload: { period: 2, gameTimeMs: 22 * 60 * 1000, outPlayerId: hayes, inPlayerId: playerE },
        },
      ] as any;

      vi.spyOn(gameEventRepo, 'find').mockResolvedValue(events);

      const report = await service.validateForEvent(eventId);

      expect(report.isValid).toBe(false);
      expect(report.suggestedCorrections).toHaveLength(1);
      expect(report.suggestedCorrections[0]).toMatchObject({
        gameEventId: 'ge-4',
        field: 'outPlayerId',
        currentPlayerId: hayes,
        correctedPlayerId: ryder,
      });
      expect(report.suggestedCorrections[0].reason).toContain('Hayes Gray');
      expect(report.suggestedCorrections[0].reason).toContain('Ryder King');
    });

    it('should reach the same result regardless of the order game_events are returned in (createdAt drift)', async () => {
      const hayes = 'hayes-id';
      const ryder = 'ryder-id';
      const playerC = 'player-c-id';
      const playerD = 'player-d-id';
      const playerE = 'player-e-id';

      vi.spyOn(eventRepo, 'findOne').mockResolvedValue({ id: eventId } as any);
      vi.spyOn(lineupRepo, 'find').mockResolvedValue([
        { playerId: hayes, status: 'starting' },
        { playerId: ryder, status: 'starting' },
        { playerId: playerE, status: 'starting' },
      ] as any);
      vi.spyOn(playerRepo, 'find').mockResolvedValue([
        { id: hayes, firstName: 'Hayes', lastName: 'Gray' },
        { id: ryder, firstName: 'Ryder', lastName: 'King' },
      ] as any);

      const events = [
        {
          id: 'ge-5',
          eventType: 'SUB',
          minuteOccurred: 22,
          payload: { period: 2, gameTimeMs: 22 * 60 * 1000, outPlayerId: hayes, inPlayerId: playerE },
        },
        {
          id: 'ge-3',
          eventType: 'SUB',
          minuteOccurred: 18,
          payload: { period: 1, gameTimeMs: 18 * 60 * 1000, outPlayerId: playerC, inPlayerId: ryder },
        },
        {
          id: 'ge-6',
          eventType: 'SUB',
          minuteOccurred: 12,
          payload: { period: 2, gameTimeMs: 12 * 60 * 1000, outPlayerId: playerE, inPlayerId: ryder },
        },
        {
          id: 'ge-1',
          eventType: 'SUB',
          minuteOccurred: 8,
          payload: { period: 1, gameTimeMs: 8 * 60 * 1000, outPlayerId: hayes, inPlayerId: playerC },
        },
        {
          id: 'ge-4',
          eventType: 'SUB',
          minuteOccurred: 29,
          payload: { period: 1, gameTimeMs: 29 * 60 * 1000, outPlayerId: hayes, inPlayerId: playerD },
        },
        {
          id: 'ge-2',
          eventType: 'SUB',
          minuteOccurred: 11,
          payload: { period: 1, gameTimeMs: 11 * 60 * 1000, outPlayerId: ryder, inPlayerId: hayes },
        },
      ] as any;

      vi.spyOn(gameEventRepo, 'find').mockResolvedValue(events);

      const report = await service.validateForEvent(eventId);

      expect(report.suggestedCorrections).toHaveLength(1);
      expect(report.suggestedCorrections[0]).toMatchObject({
        gameEventId: 'ge-4',
        field: 'outPlayerId',
        currentPlayerId: hayes,
        correctedPlayerId: ryder,
      });
    });

    it('should not suggest a fix when no clean trial swap resolves a violation', async () => {
      const p1 = 'p1';
      const p2 = 'p2';
      const p3 = 'p3';

      vi.spyOn(eventRepo, 'findOne').mockResolvedValue({ id: eventId } as any);
      vi.spyOn(lineupRepo, 'find').mockResolvedValue([
        { playerId: p1, status: 'starting' },
      ] as any);
      vi.spyOn(playerRepo, 'find').mockResolvedValue([]);

      // p1 is (wrongly) recorded as subbed out twice in a row, with no other player in the
      // game ever showing a compatible unresolved "double IN" to swap against.
      vi.spyOn(gameEventRepo, 'find').mockResolvedValue([
        {
          id: 'g1',
          eventType: 'SUB',
          minuteOccurred: 10,
          payload: { period: 1, gameTimeMs: 10 * 60 * 1000, outPlayerId: p1, inPlayerId: p2 },
        },
        {
          id: 'g2',
          eventType: 'SUB',
          minuteOccurred: 20,
          payload: { period: 1, gameTimeMs: 20 * 60 * 1000, outPlayerId: p1, inPlayerId: p3 },
        },
      ] as any);

      const report = await service.validateForEvent(eventId);

      expect(report.isValid).toBe(false);
      expect(report.violations.length).toBeGreaterThan(0);
      expect(report.suggestedCorrections).toEqual([]);
    });
  });
});
