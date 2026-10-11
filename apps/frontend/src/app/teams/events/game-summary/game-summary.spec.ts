import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { GameSummary } from './game-summary';
import { EventsService, TeamService, AwardsService, OpponentsService } from '@apex-team/client/data-access/team';
import { RuntimeConfigLoaderService } from 'runtime-config-loader';
import { ModalController, ActionSheetController, AlertController, ToastController } from '@ionic/angular/standalone';
import { LiveGameStateService, EventSyncService } from '@apex-team/client/feature/game-console';

describe('GameSummary Event Sorting', () => {
  let component: GameSummary;
  let fixture: ComponentFixture<GameSummary>;

  beforeEach(async () => {
    const mockRuntimeConfig = {
      getConfigObjectKey: vi.fn().mockReturnValue('http://api.test'),
    };

    const mockEventsService = {
      getEvent: vi.fn().mockReturnValue(of({ id: 'g1', type: 'GAME' })),
      getGameEvents: vi.fn().mockReturnValue(of([])),
      getPlayingTime: vi.fn().mockReturnValue(of({})),
      getLineup: vi.fn().mockReturnValue(of([])),
      updateGameEvent: vi.fn().mockReturnValue(of({})),
      logGameEvent: vi.fn().mockReturnValue(of({})),
    };

    const mockAwardsService = {
      getEventAwards: vi.fn().mockReturnValue(of([])),
    };

    const mockTeamService = {
      getTeam: vi.fn().mockReturnValue(Promise.resolve({ id: 't1', sport: { name: 'Soccer' } })),
    };

    const mockOpponentsService = {
      getOpponent: vi.fn().mockReturnValue(of(null)),
      getOpponents: vi.fn().mockReturnValue(of([])),
      findOrCreateOpponent: vi.fn().mockReturnValue(of({ id: 'opp-created', name: 'Thunder FC', headToHead: { wins: 0, draws: 0, losses: 0, winPercentage: 0 } })),
    };

    const mockLiveGameStateService = {
      setEvents: vi.fn(),
      events: vi.fn().mockReturnValue([]),
    };

    const mockEventSyncService = {
      deleteEvent: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [GameSummary],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: RuntimeConfigLoaderService, useValue: mockRuntimeConfig },
        { provide: EventsService, useValue: mockEventsService },
        { provide: AwardsService, useValue: mockAwardsService },
        { provide: TeamService, useValue: mockTeamService },
        { provide: OpponentsService, useValue: mockOpponentsService },
        { provide: LiveGameStateService, useValue: mockLiveGameStateService },
        { provide: EventSyncService, useValue: mockEventSyncService },
        { provide: ModalController, useValue: { create: vi.fn().mockResolvedValue({ present: vi.fn(), onDidDismiss: vi.fn().mockResolvedValue({ data: null }) }) } },
        { provide: ActionSheetController, useValue: { create: vi.fn().mockResolvedValue({ present: vi.fn() }) } },
        { provide: AlertController, useValue: { create: vi.fn().mockResolvedValue({ present: vi.fn() }) } },
        { provide: ToastController, useValue: { create: vi.fn().mockResolvedValue({ present: vi.fn() }) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GameSummary);
    component = fixture.componentInstance;
  });

  it('should sort game events by period ascending first, then minuteOccurred ascending', () => {
    const events = [
      { id: 'e1', eventType: 'GOAL', minuteOccurred: 10, payload: { period: 2 } },
      { id: 'e2', eventType: 'GOAL', minuteOccurred: 25, payload: { period: 1 } },
      { id: 'e3', eventType: 'SUB', minuteOccurred: 5, payload: { period: 2 } },
      { id: 'e4', eventType: 'GOAL', minuteOccurred: 12, payload: { period: 1 } },
    ];

    (component as any).gameEvents.set(events);

    const sorted = (component as any).sortedGameEvents();
    expect(sorted.map((e: any) => e.id)).toEqual(['e4', 'e2', 'e3', 'e1']);
  });

  it('should sort highlights/goals by period ascending first, then minuteOccurred ascending', () => {
    const events = [
      { id: 'g1', eventType: 'GOAL', minuteOccurred: 5, payload: { period: 2 } },
      { id: 'g2', eventType: 'GOAL', minuteOccurred: 30, payload: { period: 1 } },
      { id: 'g3', eventType: 'OPPONENT_GOAL', minuteOccurred: 15, payload: { period: 1 } },
    ];

    (component as any).gameEvents.set(events);

    const sortedGoals = (component as any).goals();
    expect(sortedGoals.map((g: any) => g.id)).toEqual(['g3', 'g2', 'g1']);
  });

  it('should include OPPONENT_OWN_GOAL in team score and OWN_GOAL in opponent score', () => {
    (component as any).game.set({ status: 'in_progress', goalsFor: null, goalsAgainst: null });
    (component as any).gameEvents.set([
      { id: 'g1', eventType: 'GOAL', minuteOccurred: 5, payload: { period: 1, scorerId: 'p1' } },
      { id: 'g2', eventType: 'OPPONENT_OWN_GOAL', minuteOccurred: 10, payload: { period: 1 } },
      { id: 'g3', eventType: 'OPPONENT_GOAL', minuteOccurred: 20, payload: { period: 1 } },
      { id: 'g4', eventType: 'OWN_GOAL', minuteOccurred: 30, payload: { period: 1, playerId: 'p1' } },
    ]);

    const score = (component as any).score();
    expect(score).toEqual({ team: 2, opponent: 2 });
  });

  it('should correctly populate edit fields when opening edit modal for POSITION_SWAP event', () => {
    const swapEvent = {
      id: 'swap-1',
      eventType: 'POSITION_SWAP',
      minuteOccurred: 14,
      payload: {
        playerIdA: 'p1',
        playerIdB: 'p2',
        positionNameA: 'FWD',
        positionNameB: 'MID',
      },
    };

    (component as any).openEditModal(swapEvent);

    expect((component as any).editEvent()).toBe(swapEvent);
    expect((component as any).editPeriod()).toBe(1);
    expect((component as any).editMinute()).toBe(14);
    expect((component as any).editPlayerA()).toBe('p1');
    expect((component as any).editPlayerB()).toBe('p2');
    expect((component as any).editPositionA()).toBe('FWD');
    expect((component as any).editPositionB()).toBe('MID');
    expect((component as any).isEditModalOpen()).toBe(true);
  });

  it('should call updateGameEvent with correct payload when saving edit for POSITION_SWAP', async () => {
    const eventsService = TestBed.inject(EventsService);
    const updateSpy = vi.spyOn(eventsService, 'updateGameEvent').mockReturnValue(of({} as any));
    vi.spyOn(eventsService, 'getEvent').mockReturnValue(of({ id: 'g1', type: 'GAME' } as any));
    vi.spyOn(eventsService, 'getGameEvents').mockReturnValue(of([]));
    vi.spyOn(eventsService, 'getPlayingTime').mockReturnValue(of({}));
    vi.spyOn(eventsService, 'getLineup').mockReturnValue(of([]));

    (component as any)._teamId.set('team-1');
    (component as any)._eventId.set('event-1');

    const swapEvent = {
      id: 'swap-1',
      eventType: 'POSITION_SWAP',
      minuteOccurred: 14,
      payload: {
        period: 1,
        playerIdA: 'p1',
        playerIdB: 'p2',
      },
    };

    (component as any).openEditModal(swapEvent);
    (component as any).editPeriod.set(2);
    (component as any).editMinute.set(29);
    (component as any).editPlayerA.set('p3');
    (component as any).editPlayerB.set('p4');
    (component as any).editPositionA.set('DEF');
    (component as any).editPositionB.set('MID');

    await (component as any).saveEdit();

    expect(updateSpy).toHaveBeenCalledWith('team-1', 'event-1', 'swap-1', {
      minuteOccurred: 29,
      payload: {
        period: 2,
        playerIdA: 'p3',
        playerIdB: 'p4',
        positionNameA: 'DEF',
        positionNameB: 'MID',
      },
    });
  });

  it('should call logGameEvent with correct payload when creating a new POSITION_SWAP event', async () => {
    const eventsService = TestBed.inject(EventsService);
    const logSpy = vi.spyOn(eventsService, 'logGameEvent').mockReturnValue(of({} as any));
    vi.spyOn(eventsService, 'getEvent').mockReturnValue(of({ id: 'g1', type: 'GAME' } as any));
    vi.spyOn(eventsService, 'getGameEvents').mockReturnValue(of([]));
    vi.spyOn(eventsService, 'getPlayingTime').mockReturnValue(of({}));
    vi.spyOn(eventsService, 'getLineup').mockReturnValue(of([]));

    (component as any)._teamId.set('team-1');
    (component as any)._eventId.set('event-1');

    (component as any).openCreateModal();
    (component as any).createEventType.set('POSITION_SWAP');
    (component as any).editPeriod.set(2);
    (component as any).editMinute.set(29);
    (component as any).editPlayerA.set('p1');
    (component as any).editPlayerB.set('p2');
    (component as any).editPositionA.set('MID');
    (component as any).editPositionB.set('FWD');

    await (component as any).saveCreate();

    expect(logSpy).toHaveBeenCalledWith('team-1', 'event-1', {
      eventType: 'POSITION_SWAP',
      minuteOccurred: 29,
      payload: {
        period: 2,
        playerIdA: 'p1',
        playerIdB: 'p2',
        positionNameA: 'MID',
        positionNameB: 'FWD',
      },
    });
  });

  it('should correctly format period labels and short labels for Soccer and Volleyball', () => {
    (component as any).sportName.set('Soccer');
    (component as any).game.set({ id: 'g1', periodCount: 2 } as any);

    expect((component as any).getPeriodLabel(1)).toBe('1st Half');
    expect((component as any).getPeriodLabel(2)).toBe('2nd Half');
    expect((component as any).getPeriodLabel(3)).toBe('Extra Time 1 (OT1)');
    expect((component as any).getPeriodLabel(4)).toBe('Extra Time 2 (OT2)');

    expect((component as any).getPeriodShortLabel(1)).toBe('1H');
    expect((component as any).getPeriodShortLabel(2)).toBe('2H');
    expect((component as any).getPeriodShortLabel(3)).toBe('OT1');

    (component as any).sportName.set('Volleyball');
    expect((component as any).getPeriodLabel(1)).toBe('Set 1');
    expect((component as any).getPeriodLabel(2)).toBe('Set 2');
    expect((component as any).getPeriodShortLabel(1)).toBe('S1');
    expect((component as any).getPeriodShortLabel(2)).toBe('S2');
  });

  it('should present MatchRecapModalComponent when openAiRecapModal is called', async () => {
    const modalCtrl = TestBed.inject(ModalController);
    (component as any)._teamId.set('team-1');
    (component as any)._eventId.set('event-1');

    await (component as any).openAiRecapModal();

    expect(modalCtrl.create).toHaveBeenCalledWith(expect.objectContaining({
      componentProps: {
        teamId: 'team-1',
        eventId: 'event-1',
      },
    }));
  });

  it('should present AwardBadgeModalComponent when openAwardBadgesModal is called', async () => {
    const modalCtrl = TestBed.inject(ModalController);
    (component as any)._teamId.set('team-1');
    (component as any)._eventId.set('event-1');

    await (component as any).openAwardBadgesModal();

    expect(modalCtrl.create).toHaveBeenCalledWith(expect.objectContaining({
      componentProps: {
        teamId: 'team-1',
        eventId: 'event-1',
        seasonId: undefined,
      },
    }));
  });

  it('should return UNFINISHED (WEATHER) and warning color for abandoned_weather games', () => {
    const weatherGame = {
      id: 'g-weather',
      type: 'game',
      status: 'abandoned_weather',
      goalsFor: 1,
      goalsAgainst: 0,
    } as any;

    expect((component as any).getResult(weatherGame)).toBe('UNFINISHED (WEATHER)');
    expect((component as any).getResultColor(weatherGame)).toBe('warning');
  });

  it('should call findOrCreateOpponent and set opponentDossier when createOpponentDossier is invoked', async () => {
    const oppService = TestBed.inject(OpponentsService);
    (component as any)._teamId.set('team-1');
    (component as any).game.set({ id: 'g1', type: 'game', opponent: 'Thunder FC' } as any);

    await (component as any).createOpponentDossier();

    expect(oppService.findOrCreateOpponent).toHaveBeenCalledWith('team-1', {
      name: 'Thunder FC',
      eventId: 'g1',
    });
    expect((component as any).opponentDossier()).toEqual(expect.objectContaining({
      id: 'opp-created',
      name: 'Thunder FC',
    }));
  });

  describe('Basketball Game Summary Box Scores & Shot Chart', () => {
    beforeEach(() => {
      (component as any).sportName.set('Basketball');
      (component as any).game.set({
        id: 'g-bball',
        type: 'GAME',
        status: 'completed',
        periodCount: 4,
      });
    });

    it('should format basketball period labels as quarters and overtime', () => {
      expect((component as any).getPeriodLabel(1)).toBe('1st Quarter');
      expect((component as any).getPeriodLabel(2)).toBe('2nd Quarter');
      expect((component as any).getPeriodLabel(3)).toBe('3rd Quarter');
      expect((component as any).getPeriodLabel(4)).toBe('4th Quarter');
      expect((component as any).getPeriodLabel(5)).toBe('Overtime');
      expect((component as any).getPeriodLabel(6)).toBe('Overtime 2');

      expect((component as any).getPeriodShortLabel(1)).toBe('Q1');
      expect((component as any).getPeriodShortLabel(2)).toBe('Q2');
      expect((component as any).getPeriodShortLabel(3)).toBe('Q3');
      expect((component as any).getPeriodShortLabel(4)).toBe('Q4');
      expect((component as any).getPeriodShortLabel(5)).toBe('OT');
      expect((component as any).getPeriodShortLabel(6)).toBe('2OT');
    });

    it('should compute basketball team score from MADE_1PT, MADE_2PT, MADE_3PT and opponent score from OPPONENT_SCORE', () => {
      (component as any).game.set({ status: 'completed', goalsFor: null, goalsAgainst: null });
      (component as any).gameEvents.set([
        { id: 'b1', eventType: 'MADE_2PT', minuteOccurred: 2, payload: { period: 1, playerId: 'p1' } },
        { id: 'b2', eventType: 'MADE_3PT', minuteOccurred: 4, payload: { period: 1, playerId: 'p2' } },
        { id: 'b3', eventType: 'MADE_1PT', minuteOccurred: 6, payload: { period: 1, playerId: 'p1' } },
        { id: 'b4', eventType: 'OPPONENT_SCORE', minuteOccurred: 8, payload: { period: 1, points: 2 } },
        { id: 'b5', eventType: 'OPPONENT_SCORE', minuteOccurred: 10, payload: { period: 2, points: 3 } },
      ]);

      const score = (component as any).score();
      // Team: 2 + 3 + 1 = 6; Opponent: 2 + 3 = 5
      expect(score).toEqual({ team: 6, opponent: 5 });
    });

    it('should compute basketballPeriodScores broken down by quarter', () => {
      (component as any).gameEvents.set([
        { id: 'b1', eventType: 'MADE_2PT', minuteOccurred: 2, payload: { period: 1, playerId: 'p1' } },
        { id: 'b2', eventType: 'OPPONENT_SCORE', minuteOccurred: 3, payload: { period: 1, points: 3 } },
        { id: 'b3', eventType: 'MADE_3PT', minuteOccurred: 12, payload: { period: 2, playerId: 'p2' } },
        { id: 'b4', eventType: 'OPPONENT_SCORE', minuteOccurred: 14, payload: { period: 2, points: 2 } },
      ]);

      const periodScores = (component as any).basketballPeriodScores();
      expect(periodScores.length).toBe(4);
      // Q1: Team 2, Opponent 3
      expect(periodScores[0]).toEqual(expect.objectContaining({ period: 1, label: 'Q1', teamScore: 2, opponentScore: 3 }));
      // Q2: Team 3, Opponent 2
      expect(periodScores[1]).toEqual(expect.objectContaining({ period: 2, label: 'Q2', teamScore: 3, opponentScore: 2 }));
      // Q3: Team 0, Opponent 0
      expect(periodScores[2]).toEqual(expect.objectContaining({ period: 3, label: 'Q3', teamScore: 0, opponentScore: 0 }));
      // Q4: Team 0, Opponent 0
      expect(periodScores[3]).toEqual(expect.objectContaining({ period: 4, label: 'Q4', teamScore: 0, opponentScore: 0 }));
    });

    it('should calculate player box score statistics and team totals accurately', () => {
      (component as any).lineup.set([
        {
          id: 'l1',
          playerId: 'p1',
          status: 'starting',
          positionName: 'PG',
          player: { id: 'p1', firstName: 'Stephen', lastName: 'Curry', jerseyNumber: 30 },
        },
        {
          id: 'l2',
          playerId: 'p2',
          status: 'starting',
          positionName: 'SG',
          player: { id: 'p2', firstName: 'Klay', lastName: 'Thompson', jerseyNumber: 11 },
        },
      ]);

      (component as any).gameEvents.set([
        // p1: 3PT made (3 pts), 2PT missed, 1PT made (1 pt), offensive rebound, assist
        { id: 'e1', eventType: 'MADE_3PT', minuteOccurred: 2, payload: { period: 1, playerId: 'p1' } },
        { id: 'e2', eventType: 'MISSED_2PT', minuteOccurred: 3, payload: { period: 1, playerId: 'p1' } },
        { id: 'e3', eventType: 'MADE_1PT', minuteOccurred: 4, payload: { period: 1, playerId: 'p1' } },
        { id: 'e4', eventType: 'REBOUND_OFFENSIVE', minuteOccurred: 5, payload: { period: 1, playerId: 'p1' } },
        { id: 'e5', eventType: 'ASSIST', minuteOccurred: 6, payload: { period: 1, playerId: 'p1' } },
        { id: 'e6', eventType: 'STEAL', minuteOccurred: 7, payload: { period: 1, playerId: 'p1' } },
        // p2: 2PT made (2 pts), assist attributed via shot
        { id: 'e7', eventType: 'MADE_2PT', minuteOccurred: 8, payload: { period: 1, playerId: 'p2', assistorId: 'p1' } },
        { id: 'e8', eventType: 'BLOCK', minuteOccurred: 9, payload: { period: 1, playerId: 'p2' } },
        { id: 'e9', eventType: 'TURNOVER', minuteOccurred: 10, payload: { period: 1, playerId: 'p2' } },
        { id: 'e10', eventType: 'FOUL', minuteOccurred: 11, payload: { period: 1, playerId: 'p2' } },
        { id: 'e11', eventType: 'OPPONENT_SCORE', minuteOccurred: 12, payload: { period: 1, points: 2 } },
      ]);

      const boxScores = (component as any).basketballBoxScore();
      const p1Stats = boxScores.find((b: any) => b.player.id === 'p1');
      const p2Stats = boxScores.find((b: any) => b.player.id === 'p2');

      expect(p1Stats).toBeDefined();
      expect(p1Stats.points).toBe(4); // 3PT + 1PT
      expect(p1Stats.fgMade).toBe(1); // 3PT made
      expect(p1Stats.fgAttempted).toBe(2); // 3PT made + 2PT missed
      expect(p1Stats.fg3Made).toBe(1);
      expect(p1Stats.fg3Attempted).toBe(1);
      expect(p1Stats.ftMade).toBe(1);
      expect(p1Stats.ftAttempted).toBe(1);
      expect(p1Stats.reboundsOffensive).toBe(1);
      expect(p1Stats.reboundsTotal).toBe(1);
      expect(p1Stats.assists).toBe(2); // 1 ASSIST event + 1 assistorId on e7
      expect(p1Stats.steals).toBe(1);

      expect(p2Stats).toBeDefined();
      expect(p2Stats.points).toBe(2);
      expect(p2Stats.fgMade).toBe(1);
      expect(p2Stats.fgAttempted).toBe(1);
      expect(p2Stats.blocks).toBe(1);
      expect(p2Stats.turnovers).toBe(1);
      expect(p2Stats.fouls).toBe(1);

      const totals = (component as any).basketballTotals();
      expect(totals.points).toBe(6); // 4 + 2
      expect(totals.fgMade).toBe(2);
      expect(totals.fgAttempted).toBe(3);
      expect(totals.fgPct).toBeCloseTo(0.667, 2);
      expect(totals.fg3Made).toBe(1);
      expect(totals.fg3Attempted).toBe(1);
      expect(totals.ftMade).toBe(1);
      expect(totals.ftAttempted).toBe(1);
      expect(totals.assists).toBe(2);
      expect(totals.steals).toBe(1);
      expect(totals.blocks).toBe(1);
      expect(totals.turnovers).toBe(1);
      expect(totals.fouls).toBe(1);
    });

    it('should extract basketballShots with coordinates and make/miss details', () => {
      (component as any).gameEvents.set([
        {
          id: 's1',
          eventType: 'MADE_2PT',
          minuteOccurred: 3,
          payload: { period: 1, playerId: 'p1', coordinates: { x: 50, y: 35 } },
        },
        {
          id: 's2',
          eventType: 'MISSED_3PT',
          minuteOccurred: 7,
          payload: { period: 1, playerId: 'p2', coordinates: { x: 80, y: 75 } },
        },
      ]);

      const shots = (component as any).basketballShots();
      expect(shots.length).toBe(2);
      expect(shots[0]).toEqual(expect.objectContaining({
        id: 's1',
        type: 'MADE_2PT',
        playerId: 'p1',
        period: 1,
        minuteOccurred: 3,
        x: 50,
        y: 35,
      }));
      expect(shots[1]).toEqual(expect.objectContaining({
        id: 's2',
        type: 'MISSED_3PT',
        playerId: 'p2',
        period: 1,
        minuteOccurred: 7,
        x: 80,
        y: 75,
      }));
    });
  });
});
