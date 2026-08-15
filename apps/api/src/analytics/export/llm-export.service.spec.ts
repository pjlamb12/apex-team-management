import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LlmExportService } from './llm-export.service';
import { PerformanceMetricsService } from '../performance-metrics.service';
import { PlayingTimeService } from '../playing-time.service';
import { TeamEntity } from '../../entities/team.entity';
import { SeasonEntity } from '../../entities/season.entity';
import { LeagueEntity } from '../../entities/league.entity';
import { PlayerEntity } from '../../entities/player.entity';
import { EventEntity } from '../../entities/event.entity';
import { GameEventEntity } from '../../entities/game-event.entity';
import { AttendanceEntity } from '../../entities/attendance.entity';
import { PracticeDrillEntity } from '../../entities/practice-drill.entity';
import { DrillEntity } from '../../entities/drill.entity';
import { EventNoteEntity } from '../../entities/event-note.entity';
import { PlayerAwardEntity } from '../../entities/player-award.entity';
import { LlmPromptTemplate } from '../dto/llm-export-options.dto';

describe('LlmExportService', () => {
  let service: LlmExportService;
  let teamRepo: any;
  let seasonRepo: any;
  let leagueRepo: any;
  let playerRepo: any;
  let eventRepo: any;
  let gameEventRepo: any;
  let attendanceRepo: any;
  let practiceDrillRepo: any;
  let drillRepo: any;
  let eventNoteRepo: any;
  let awardRepo: any;
  let playingTimeService: any;
  let performanceMetricsService: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LlmExportService,
        {
          provide: getRepositoryToken(TeamEntity),
          useValue: { findOne: vi.fn() },
        },
        {
          provide: getRepositoryToken(SeasonEntity),
          useValue: { findOne: vi.fn(), find: vi.fn() },
        },
        {
          provide: getRepositoryToken(LeagueEntity),
          useValue: { findOne: vi.fn() },
        },
        {
          provide: getRepositoryToken(PlayerEntity),
          useValue: { find: vi.fn() },
        },
        {
          provide: getRepositoryToken(EventEntity),
          useValue: { find: vi.fn() },
        },
        {
          provide: getRepositoryToken(GameEventEntity),
          useValue: { find: vi.fn() },
        },
        {
          provide: getRepositoryToken(AttendanceEntity),
          useValue: { find: vi.fn() },
        },
        {
          provide: getRepositoryToken(PracticeDrillEntity),
          useValue: { find: vi.fn() },
        },
        {
          provide: getRepositoryToken(DrillEntity),
          useValue: { find: vi.fn() },
        },
        {
          provide: getRepositoryToken(EventNoteEntity),
          useValue: { find: vi.fn() },
        },
        {
          provide: getRepositoryToken(PlayerAwardEntity),
          useValue: { find: vi.fn().mockResolvedValue([]) },
        },
        {
          provide: PlayingTimeService,
          useValue: { calculateForTeam: vi.fn() },
        },
        {
          provide: PerformanceMetricsService,
          useValue: { getTeamMetrics: vi.fn() },
        },
      ],
    }).compile();

    service = module.get<LlmExportService>(LlmExportService);
    teamRepo = module.get(getRepositoryToken(TeamEntity));
    seasonRepo = module.get(getRepositoryToken(SeasonEntity));
    leagueRepo = module.get(getRepositoryToken(LeagueEntity));
    playerRepo = module.get(getRepositoryToken(PlayerEntity));
    eventRepo = module.get(getRepositoryToken(EventEntity));
    gameEventRepo = module.get(getRepositoryToken(GameEventEntity));
    attendanceRepo = module.get(getRepositoryToken(AttendanceEntity));
    practiceDrillRepo = module.get(getRepositoryToken(PracticeDrillEntity));
    drillRepo = module.get(getRepositoryToken(DrillEntity));
    eventNoteRepo = module.get(getRepositoryToken(EventNoteEntity));
    awardRepo = module.get(getRepositoryToken(PlayerAwardEntity));
    playingTimeService = module.get(PlayingTimeService);
    performanceMetricsService = module.get(PerformanceMetricsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generate', () => {
    const mockTeam = {
      id: 'team-1',
      name: 'Apex Raptors',
      sport: { name: 'Soccer' },
    };

    const mockPlayers = [
      { id: 'p1', firstName: 'Leo', lastName: 'Messi', jerseyNumber: 10, preferredPosition: 'FWD', isGuest: false, isActive: true },
      { id: 'p2', firstName: 'Virgil', lastName: 'van Dijk', jerseyNumber: 4, preferredPosition: 'DEF', isGuest: false, isActive: true },
    ];

    const mockGames = [
      {
        id: 'g1',
        type: 'game',
        opponent: 'Thunder FC',
        goalsFor: 2,
        goalsAgainst: 1,
        isHomeGame: true,
        scheduledAt: new Date('2026-08-01T10:00:00Z'),
        durationMinutes: 50,
        notes: 'Great second half pressing.',
        notesList: [],
      },
    ];

    const mockPractices = [
      {
        id: 'pr1',
        type: 'practice',
        scheduledAt: new Date('2026-08-03T18:00:00Z'),
        durationMinutes: 60,
        notes: 'Focused on possession under pressure.',
        practiceDrills: [
          {
            sequence: 0,
            customName: '3v1 Rondo',
            durationMinutes: 15,
            teamRating: 4,
            notes: 'High intensity',
            drill: { name: 'Rondo', tags: [{ name: 'passing' }, { name: 'possession' }] },
          },
        ],
      },
    ];

    beforeEach(() => {
      teamRepo.findOne.mockResolvedValue(mockTeam);
      seasonRepo.find.mockResolvedValue([{ id: 's1', teamId: 'team-1', name: 'Fall 2026' }]);
      playerRepo.find.mockResolvedValue(mockPlayers);
      eventRepo.find.mockResolvedValue([...mockGames, ...mockPractices]);
      gameEventRepo.find.mockResolvedValue([
        {
          id: 'ge1',
          eventId: 'g1',
          eventType: 'GOAL',
          minuteOccurred: 24,
          payload: { scorerId: 'p1' },
        },
      ]);
      attendanceRepo.find.mockResolvedValue([
        { playerId: 'p1', eventId: 'g1', status: 'present' },
        { playerId: 'p2', eventId: 'g1', status: 'present' },
      ]);
      practiceDrillRepo.find.mockResolvedValue([
        {
          id: 'pd1',
          eventId: 'pr1',
          sequence: 0,
          customName: '3v1 Rondo',
          durationMinutes: 15,
          teamRating: 4,
          notes: 'High intensity',
          drill: { name: 'Rondo', tags: [{ name: 'passing' }, { name: 'possession' }] },
        },
      ]);
      eventNoteRepo.find.mockResolvedValue([]);
      performanceMetricsService.getTeamMetrics.mockResolvedValue([
        { playerId: 'p1', goals: 1, assists: 0, gamesPlayed: 1 },
        { playerId: 'p2', goals: 0, assists: 0, gamesPlayed: 1 },
      ]);
      playingTimeService.calculateForTeam.mockResolvedValue({
        p1: { totalSeconds: 3000, positionSeconds: { FWD: 3000 } },
        p2: { totalSeconds: 3000, positionSeconds: { DEF: 3000 } },
      });
    });

    it('should generate Practice Plan prompt markdown', async () => {
      const result = await service.generate('team-1', {
        template: LlmPromptTemplate.PRACTICE_PLAN,
      });

      expect(result.template).toBe(LlmPromptTemplate.PRACTICE_PLAN);
      expect(result.title).toContain('Practice Plan Generator Prompt');
      expect(result.prompt).toContain('# System Role: Master Youth Soccer Tactical Coach & Technical Director');
      expect(result.prompt).toContain('Apex Raptors');
      expect(result.prompt).toContain('Leo Messi');
      expect(result.prompt).toContain('Thunder FC');
      expect(result.prompt).toContain('3v1 Rondo');
      expect(result.prompt).toContain('#passing');
      expect(result.prompt).toContain('4/5 ⭐');
    });

    it('should generate Game Strategy prompt markdown', async () => {
      const result = await service.generate('team-1', {
        template: LlmPromptTemplate.GAME_STRATEGY,
      });

      expect(result.template).toBe(LlmPromptTemplate.GAME_STRATEGY);
      expect(result.title).toContain('Game Strategy & Lineup Optimizer Prompt');
      expect(result.prompt).toContain('# System Role: Youth Soccer Matchday Strategist & Tactical Analyst');
      expect(result.prompt).toContain('Minute-by-Minute Substitution Plan');
    });

    it('should generate Player Evaluation prompt markdown', async () => {
      const result = await service.generate('team-1', {
        template: LlmPromptTemplate.PLAYER_EVAL,
      });

      expect(result.template).toBe(LlmPromptTemplate.PLAYER_EVAL);
      expect(result.title).toContain('Player Evaluation & Feedback Prompt');
      expect(result.prompt).toContain('# System Role: Youth Sports Development Coach & Player Mentor');
      expect(result.prompt).toContain('Individual Player Development Profiles');
      expect(result.prompt).toContain('Player Dossier: Leo Messi (#10)');
    });

    it('should include custom coach instructions when provided', async () => {
      const result = await service.generate('team-1', {
        template: LlmPromptTemplate.PRACTICE_PLAN,
        customInstructions: 'Focus on defending corner kicks and aerial duels.',
      });

      expect(result.prompt).toContain('## Coach Focus & Specific Instructions');
      expect(result.prompt).toContain('Focus on defending corner kicks and aerial duels.');
    });

    it('should exclude guest players for forward-looking practice plan prompts', async () => {
      playerRepo.find.mockResolvedValue([
        { id: 'p1', firstName: 'Leo', lastName: 'Messi', jerseyNumber: 10, preferredPosition: 'FWD', isGuest: false, isActive: true },
        { id: 'p_guest', firstName: 'Guest', lastName: 'Player', jerseyNumber: 99, preferredPosition: 'FWD', isGuest: true, isActive: true },
      ]);

      const result = await service.generate('team-1', {
        template: LlmPromptTemplate.PRACTICE_PLAN,
      });

      expect(result.prompt).toContain('Leo Messi');
      expect(result.prompt).not.toContain('Guest Player');
      expect(result.metadata.playerCount).toBe(1);
    });

    it('should include guest players for retrospective season-debrief prompts', async () => {
      playerRepo.find.mockResolvedValue([
        { id: 'p1', firstName: 'Leo', lastName: 'Messi', jerseyNumber: 10, preferredPosition: 'FWD', isGuest: false, isActive: true },
        { id: 'p_guest', firstName: 'Guest', lastName: 'Player', jerseyNumber: 99, preferredPosition: 'FWD', isGuest: true, isActive: true },
      ]);

      const result = await service.generate('team-1', {
        template: LlmPromptTemplate.SEASON_DEBRIEF,
      });

      expect(result.prompt).toContain('Leo Messi');
      expect(result.prompt).toContain('Guest Player');
      expect(result.metadata.playerCount).toBe(2);
    });

    it('should include team honors and player awards in prompt exports', async () => {
      playerRepo.find.mockResolvedValue(mockPlayers);
      eventRepo.find.mockResolvedValue(mockGames);
      awardRepo.find.mockResolvedValue([
        {
          id: 'aw-1',
          teamId: 'team-1',
          playerId: 'p1',
          player: { id: 'p1', firstName: 'Leo', lastName: 'Messi' },
          eventId: 'g1',
          title: 'Player of the Match',
          notes: 'Great match winner',
        },
      ]);

      const result = await service.generate('team-1', {
        template: LlmPromptTemplate.PLAYER_EVAL,
      });

      expect(result.prompt).toContain('Team Honors & Gamified Recognition');
      expect(result.prompt).toContain('**Total Awards Conferred**: 1');
      expect(result.prompt).toContain('Match Honors Awarded');
      expect(result.prompt).toContain('Leo Messi — "Player of the Match"');
      expect(result.prompt).toContain('Honors & Badges Earned (1)');
    });
  });
});
