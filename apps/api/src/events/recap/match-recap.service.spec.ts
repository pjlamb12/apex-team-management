import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MatchRecapService } from './match-recap.service';
import { Repository } from 'typeorm';
import { EventEntity } from '../../entities/event.entity';
import { GameEventEntity } from '../../entities/game-event.entity';
import { EventNoteEntity } from '../../entities/event-note.entity';
import { LineupEntryEntity } from '../../entities/lineup-entry.entity';
import { PlayerEntity } from '../../entities/player.entity';
import { AttendanceEntity } from '../../entities/attendance.entity';
import { OpponentEntity } from '../../entities/opponent.entity';
import { PlayerAwardEntity } from '../../entities/player-award.entity';
import { PlayingTimeService } from '../../analytics/playing-time.service';
import { GeminiService } from './gemini.service';

describe('MatchRecapService', () => {
  let service: MatchRecapService;
  let eventRepo: Partial<Repository<EventEntity>>;
  let gameEventRepo: Partial<Repository<GameEventEntity>>;
  let eventNoteRepo: Partial<Repository<EventNoteEntity>>;
  let lineupRepo: Partial<Repository<LineupEntryEntity>>;
  let playerRepo: Partial<Repository<PlayerEntity>>;
  let attendanceRepo: Partial<Repository<AttendanceEntity>>;
  let opponentRepo: Partial<Repository<OpponentEntity>>;
  let awardRepo: Partial<Repository<PlayerAwardEntity>>;
  let playingTimeService: Partial<PlayingTimeService>;
  let geminiService: Partial<GeminiService>;

  const mockTeamId = 'team-123';
  const mockEventId = 'event-456';

  const mockEvent: any = {
    id: mockEventId,
    type: 'game',
    opponent: 'Storm FC',
    goalsFor: 3,
    goalsAgainst: 1,
    location: 'Central Park Pitch 2',
    isHomeGame: true,
    scheduledAt: new Date('2026-08-15T10:00:00Z'),
    season: {
      id: 'season-1',
      teamId: mockTeamId,
      team: {
        id: mockTeamId,
        name: 'Apex Strikers',
        sport: { name: 'Soccer' },
      },
    },
    notes: 'Great second-half pressing.',
  };

  const mockPlayers: any[] = [
    { id: 'p1', firstName: 'Leo', lastName: 'Messi', jerseyNumber: 10, teamId: mockTeamId },
    { id: 'p2', firstName: 'Julian', lastName: 'Alvarez', jerseyNumber: 9, teamId: mockTeamId },
    { id: 'p3', firstName: 'Emi', lastName: 'Martinez', jerseyNumber: 1, teamId: mockTeamId },
  ];

  const mockAwards: any[] = [
    {
      id: 'award-1',
      teamId: mockTeamId,
      playerId: 'p1',
      player: { id: 'p1', firstName: 'Leo', lastName: 'Messi', jerseyNumber: 10 },
      eventId: mockEventId,
      title: 'Player of the Match',
      category: 'mvp',
      badgePresetId: 'potm',
      notes: 'Spectacular opening goal and created 3 chances',
    },
    {
      id: 'award-2',
      teamId: mockTeamId,
      playerId: 'p3',
      player: { id: 'p3', firstName: 'Emi', lastName: 'Martinez', jerseyNumber: 1 },
      eventId: mockEventId,
      title: 'The Wall',
      category: 'goalkeeping',
      badgePresetId: 'golden_gloves',
      notes: 'Crucial penalty save in the 40th minute',
    },
  ];

  const mockGameEvents: any[] = [
    {
      id: 'ge1',
      eventId: mockEventId,
      eventType: 'goal',
      minuteOccurred: 14,
      payload: { playerId: 'p1', playerName: 'Leo Messi', assistPlayerId: 'p2', assistPlayerName: 'Julian Alvarez' },
      createdAt: new Date('2026-08-15T10:14:00Z'),
    },
    {
      id: 'ge2',
      eventId: mockEventId,
      eventType: 'goal',
      minuteOccurred: 38,
      payload: { playerId: 'p2', playerName: 'Julian Alvarez' },
      createdAt: new Date('2026-08-15T10:38:00Z'),
    },
    {
      id: 'ge3',
      eventId: mockEventId,
      eventType: 'goal',
      minuteOccurred: 55,
      payload: { isOpponent: true },
      createdAt: new Date('2026-08-15T10:55:00Z'),
    },
  ];

  const mockAttendances: any[] = [
    { id: 'a1', eventId: mockEventId, playerId: 'p1', status: 'present' },
    { id: 'a2', eventId: mockEventId, playerId: 'p2', status: 'present' },
    { id: 'a3', eventId: mockEventId, playerId: 'p3', status: 'present' },
  ];

  const mockNotes: any[] = [
    { id: 'n1', eventId: mockEventId, content: 'Excellent ball circulation in the first half.' },
  ];

  beforeEach(() => {
    eventRepo = {
      findOne: vi.fn().mockResolvedValue(mockEvent),
      createQueryBuilder: vi.fn().mockReturnValue({
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        getOne: vi.fn().mockResolvedValue({
          id: 'event-next',
          type: 'game',
          opponent: 'Thunder SC',
          scheduledAt: new Date('2026-08-22T14:00:00Z'),
          location: 'Regional Sports Complex',
          uniformColor: 'Navy',
        }),
      }),
    };

    gameEventRepo = {
      find: vi.fn().mockResolvedValue(mockGameEvents),
    };

    eventNoteRepo = {
      find: vi.fn().mockResolvedValue(mockNotes),
    };

    lineupRepo = {
      find: vi.fn().mockResolvedValue([]),
    };

    playerRepo = {
      find: vi.fn().mockResolvedValue(mockPlayers),
    };

    attendanceRepo = {
      find: vi.fn().mockResolvedValue(mockAttendances),
    };

    opponentRepo = {
      findOne: vi.fn().mockResolvedValue(null),
    };

    awardRepo = {
      find: vi.fn().mockResolvedValue(mockAwards),
    };

    playingTimeService = {
      calculateForEvent: vi.fn().mockResolvedValue({
        p1: { playerId: 'p1', totalSeconds: 3000, positionSeconds: {} },
        p2: { playerId: 'p2', totalSeconds: 2700, positionSeconds: {} },
      }),
    };

    geminiService = {
      isConfigured: vi.fn().mockReturnValue(true),
      generateText: vi.fn().mockResolvedValue({
        text: 'Subject: Match Recap: Apex Strikers vs Storm FC\n\nGreat win today! Leo Messi won Player of the Match.',
        model: 'gemini-3.6-flash',
      }),
    };

    service = new MatchRecapService(
      eventRepo as Repository<EventEntity>,
      gameEventRepo as Repository<GameEventEntity>,
      eventNoteRepo as Repository<EventNoteEntity>,
      lineupRepo as Repository<LineupEntryEntity>,
      playerRepo as Repository<PlayerEntity>,
      attendanceRepo as Repository<AttendanceEntity>,
      opponentRepo as Repository<OpponentEntity>,
      awardRepo as Repository<PlayerAwardEntity>,
      playingTimeService as PlayingTimeService,
      geminiService as GeminiService,
    );
  });

  it('should generate an AI recap using GeminiService when configured', async () => {
    const result = await service.generateRecap(mockTeamId, mockEventId, {
      tone: 'youth_encouraging',
      format: 'email',
      includeNextEvent: true,
      includePlayerShoutouts: true,
    });

    expect(result.isAiGenerated).toBe(true);
    expect(result.model).toBe('gemini-3.6-flash');
    expect(result.recap).toContain('Player of the Match');
    expect(geminiService.generateText).toHaveBeenCalled();
    expect(result.prompt).toContain('MATCH HONORS & COACH BADGES AWARDED');
    expect(result.prompt).toContain('Leo Messi (#10): Awarded "Player of the Match"');
    expect(result.prompt).toContain('The Wall');
    expect(result.nextEvent).toBeDefined();
    expect(result.nextEvent?.opponent).toBe('Thunder SC');
  });

  it('should fall back to template generation when Gemini is not configured and include honors', async () => {
    (geminiService.isConfigured as any).mockReturnValue(false);

    const result = await service.generateRecap(mockTeamId, mockEventId, {
      tone: 'youth_encouraging',
      format: 'email',
      includePlayerShoutouts: true,
    });

    expect(result.isAiGenerated).toBe(false);
    expect(result.recap).toContain('Apex Strikers');
    expect(result.recap).toContain('Storm FC');
    expect(result.recap).toContain('🏆 **Match Honors & Badges:**');
    expect(result.recap).toContain('Leo Messi (#10) — **Player of the Match**');
    expect(result.recap).toContain('Crucial penalty save');
    expect(result.prompt).toBeDefined();
  });

  it('should return prompt and system instruction via getPromptOnly including honors context', async () => {
    const result = await service.getPromptOnly(mockTeamId, mockEventId, {
      tone: 'tactical_competitive',
      format: 'chat',
      includePlayerShoutouts: true,
    });

    expect(result.prompt).toContain('Apex Strikers');
    expect(result.prompt).toContain('Storm FC');
    expect(result.prompt).toContain('Player of the Match');
    expect(result.systemInstruction).toContain('WhatsApp');
    expect(result.context.teamName).toBe('Apex Strikers');
    expect(result.context.awards).toHaveLength(2);
  });
});
