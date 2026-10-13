import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlayerAnalyticsService } from './player-analytics.service';
import { PlayerEntity } from '../entities/player.entity';
import { EventEntity } from '../entities/event.entity';
import { AttendanceEntity } from '../entities/attendance.entity';
import { GameEventEntity } from '../entities/game-event.entity';
import { LineupEntryEntity } from '../entities/lineup-entry.entity';
import { PlayingTimeService } from './playing-time.service';
import { NotFoundException } from '@nestjs/common';
import { vi } from 'vitest';

describe('PlayerAnalyticsService', () => {
  let service: PlayerAnalyticsService;
  let playerRepo: Repository<PlayerEntity>;
  let eventRepo: Repository<EventEntity>;
  let attendanceRepo: Repository<AttendanceEntity>;
  let gameEventRepo: Repository<GameEventEntity>;
  let lineupRepo: Repository<LineupEntryEntity>;
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
          provide: getRepositoryToken(LineupEntryEntity),
          useValue: { find: vi.fn().mockResolvedValue([]) },
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
    lineupRepo = module.get<Repository<LineupEntryEntity>>(getRepositoryToken(LineupEntryEntity));
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
      const event = { id: 'event-1', type: 'game', status: 'completed', opponent: 'Rivals', scheduledAt: new Date() };
      
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

    it('should exclude abandoned_weather games from aggregate totals while preserving in match history', async () => {
      const player = { id: playerId, firstName: 'John', lastName: 'Doe', teamId };
      const event = { id: 'event-weather', type: 'game', status: 'abandoned_weather', opponent: 'Storm FC', scheduledAt: new Date() };
      
      vi.spyOn(playerRepo, 'findOne').mockResolvedValue(player as any);
      vi.spyOn(eventRepo, 'find').mockResolvedValue([event] as any);
      vi.spyOn(attendanceRepo, 'find').mockResolvedValue([
        { eventId: 'event-weather', status: 'present' }
      ] as any);
      vi.spyOn(gameEventRepo, 'find').mockResolvedValue([
        { eventId: 'event-weather', eventType: 'GOAL', payload: { scorerId: playerId } }
      ] as any);
      vi.spyOn(playingTimeService, 'calculateForEvent').mockResolvedValue({
        [playerId]: { totalSeconds: 600, positionSeconds: { 'FWD': 600 } }
      } as any);

      const result = await service.getPlayerProfile(playerId, teamId);

      expect(result.totalGamesPlayed).toBe(0);
      expect(result.totalGoals).toBe(0);
      expect(result.totalMinutes).toBe(0);
      expect(result.history).toHaveLength(1);
      expect(result.history[0].eventId).toBe('event-weather');
      expect(result.history[0].goals).toBe(1);
      expect(result.history[0].playingTimeSeconds).toBe(600);
    });

    it('should not give gamesPlayed credit to guest player who was marked present but did not participate', async () => {
      const guestPlayer = { id: playerId, firstName: 'Kobyn', lastName: 'Bryant', isGuest: true, teamId };
      const event = { id: 'event-1', type: 'game', status: 'completed', opponent: 'Rivals', scheduledAt: new Date() };

      vi.spyOn(playerRepo, 'findOne').mockResolvedValue(guestPlayer as any);
      vi.spyOn(eventRepo, 'find').mockResolvedValue([event] as any);
      // Errant attendance record marked present
      vi.spyOn(attendanceRepo, 'find').mockResolvedValue([
        { eventId: 'event-1', status: 'present' }
      ] as any);
      // No game events
      vi.spyOn(gameEventRepo, 'find').mockResolvedValue([] as any);
      // Not in lineup
      vi.spyOn(lineupRepo, 'find').mockResolvedValue([] as any);
      // 0 playtime
      vi.spyOn(playingTimeService, 'calculateForEvent').mockResolvedValue({
        [playerId]: { totalSeconds: 0, positionSeconds: {} }
      } as any);

      const result = await service.getPlayerProfile(playerId, teamId);

      expect(result.player.isGuest).toBe(true);
      expect(result.totalGamesPlayed).toBe(0);
    });

    it('should aggregate basketball metrics, per-game averages, shooting splits and history', async () => {
      const bballPlayer = { id: playerId, firstName: 'Luka', lastName: 'Doncic', teamId };
      const event = { id: 'event-1', type: 'game', status: 'completed', opponent: 'Suns', scheduledAt: new Date() };

      vi.spyOn(playerRepo, 'findOne').mockResolvedValue(bballPlayer as any);
      vi.spyOn(eventRepo, 'find').mockResolvedValue([event] as any);
      vi.spyOn(attendanceRepo, 'find').mockResolvedValue([
        { eventId: 'event-1', status: 'present' }
      ] as any);
      vi.spyOn(gameEventRepo, 'find').mockResolvedValue([
        { eventId: 'event-1', eventType: 'MADE_3PT', payload: { playerId, assistorId: 'other' } },
        { eventId: 'event-1', eventType: 'MADE_2PT', payload: { playerId } },
        { eventId: 'event-1', eventType: 'MADE_1PT', payload: { playerId } },
        { eventId: 'event-1', eventType: 'MISSED_3PT', payload: { playerId } },
        { eventId: 'event-1', eventType: 'MISSED_2PT', payload: { playerId } },
        { eventId: 'event-1', eventType: 'MISSED_1PT', payload: { playerId } },
        { eventId: 'event-1', eventType: 'MADE_2PT', payload: { playerId: 'other', assistorId: playerId } },
        { eventId: 'event-1', eventType: 'REBOUND_DEFENSIVE', payload: { playerId } },
        { eventId: 'event-1', eventType: 'REBOUND_OFFENSIVE', payload: { playerId } },
        { eventId: 'event-1', eventType: 'STEAL', payload: { playerId } },
        { eventId: 'event-1', eventType: 'BLOCK', payload: { playerId } },
        { eventId: 'event-1', eventType: 'TURNOVER', payload: { playerId } },
        { eventId: 'event-1', eventType: 'FOUL', payload: { playerId } },
      ] as any);
      vi.spyOn(lineupRepo, 'find').mockResolvedValue([{ playerId, eventId: 'event-1' }] as any);
      vi.spyOn(playingTimeService, 'calculateForEvent').mockResolvedValue({
        [playerId]: { totalSeconds: 1920, positionSeconds: { 'PG': 1920 } }
      } as any);

      const result = await service.getPlayerProfile(playerId, teamId);

      expect(result.totalGamesPlayed).toBe(1);
      // 3 + 2 + 1 = 6 points
      expect(result.totalPoints).toBe(6);
      expect(result.ppg).toBe(6);
      expect(result.totalReboundsTotal).toBe(2);
      expect(result.rpg).toBe(2);
      expect(result.totalAssists).toBe(1);
      expect(result.apg).toBe(1);
      expect(result.totalSteals).toBe(1);
      expect(result.spg).toBe(1);
      expect(result.totalBlocks).toBe(1);
      expect(result.bpg).toBe(1);
      expect(result.totalTurnovers).toBe(1);
      expect(result.totalPersonalFouls).toBe(1);

      // Shooting: FGM=2, FGA=4 (50%), 3PM=1, 3PA=2 (50%), FTM=1, FTA=2 (50%)
      expect(result.totalFgMade).toBe(2);
      expect(result.totalFgAttempted).toBe(4);
      expect(result.fgPct).toBe(50);
      expect(result.totalFg3Made).toBe(1);
      expect(result.totalFg3Attempted).toBe(2);
      expect(result.fg3Pct).toBe(50);
      expect(result.totalFtMade).toBe(1);
      expect(result.totalFtAttempted).toBe(2);
      expect(result.ftPct).toBe(50);

      // Match history
      expect(result.history).toHaveLength(1);
      const h0 = result.history[0];
      expect(h0.points).toBe(6);
      expect(h0.reboundsTotal).toBe(2);
      expect(h0.assists).toBe(1);
      expect(h0.steals).toBe(1);
      expect(h0.blocks).toBe(1);
    });
  });
});

