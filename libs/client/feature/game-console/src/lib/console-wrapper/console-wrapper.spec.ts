import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConsoleWrapper } from './console-wrapper';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { LiveClockService } from '../live-clock.service';
import { LiveGameStateService } from '../live-game-state.service';
import { RuntimeConfigLoaderService } from 'runtime-config-loader';
import { AlertController, ToastController } from '@ionic/angular/standalone';
import { of } from 'rxjs';
import { PlaytimeService } from '../rotation-engine/playtime.service';
import { EventsService } from '@apex-team/client/data-access/team';
import { signal, NO_ERRORS_SCHEMA } from '@angular/core';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('ConsoleWrapper', () => {
  let component: ConsoleWrapper;
  let fixture: ComponentFixture<ConsoleWrapper>;
  let clockServiceMock: any;
  let httpMock: any;
  let routeMock: any;
  let configMock: any;
  let alertControllerMock: any;
  let toastControllerMock: any;
  let stateService: LiveGameStateService;

  const mockLineup = [
    {
      playerId: 'p1',
      player: { id: 'p1', firstName: 'Player', lastName: 'One', jerseyNumber: '1' },
      status: 'starting',
      positionName: 'Forward',
      slotIndex: 0,
    },
    {
      playerId: 'p2',
      player: { id: 'p2', firstName: 'Player', lastName: 'Two', jerseyNumber: '2' },
      status: 'bench',
      positionName: null,
      slotIndex: null,
    },
    {
      playerId: 'p3',
      player: { id: 'p3', firstName: 'Player', lastName: 'Three', jerseyNumber: '3' },
      status: 'starting',
      positionName: 'Midfielder',
      slotIndex: 1,
    },
  ];

  beforeEach(async () => {
    localStorage.clear();
    clockServiceMock = {
      isRunning: signal(false),
      elapsedMs: signal(0),
      currentMinute: vi.fn().mockReturnValue(0),
      start: vi.fn(),
      stop: vi.fn(),
      reset: vi.fn().mockImplementation(() => Promise.resolve()),
      initialize: vi.fn(),
    };

    httpMock = {
      get: vi.fn((url: string) => {
        if (url.endsWith('/lineup')) return of(mockLineup);
        return of({ opponent: 'Test Opponent' });
      }),
      patch: vi.fn(() => of({})),
    };

    routeMock = {
      paramMap: of({
        get: (key: string) => {
          if (key === 'eventId') return 'event-123';
          if (key === 'id') return 'team-456';
          return null;
        },
      }),
    };

    configMock = {
      getConfigObjectKey: vi.fn().mockReturnValue('http://api.test'),
    };

    alertControllerMock = {
      create: vi.fn().mockImplementation(() => Promise.resolve({
        present: vi.fn().mockImplementation(() => Promise.resolve())
      }))
    };

    toastControllerMock = {
      create: vi.fn().mockImplementation(() => Promise.resolve({
        present: vi.fn().mockImplementation(() => Promise.resolve())
      }))
    };

    await TestBed.configureTestingModule({
      imports: [ConsoleWrapper],
      providers: [
        { provide: ActivatedRoute, useValue: routeMock },
        { provide: HttpClient, useValue: httpMock },
        { provide: LiveClockService, useValue: clockServiceMock },
        { provide: RuntimeConfigLoaderService, useValue: configMock },
        { provide: AlertController, useValue: alertControllerMock },
        { provide: ToastController, useValue: toastControllerMock },
        LiveGameStateService,
      ],
    })
      .overrideComponent(ConsoleWrapper, {
        set: { schemas: [NO_ERRORS_SCHEMA] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ConsoleWrapper);
    component = fixture.componentInstance;
    stateService = TestBed.inject(LiveGameStateService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load event data and lineup on init', () => {
    expect(httpMock.get).toHaveBeenCalledWith('http://api.test/teams/team-456/events/event-123');
    expect(httpMock.get).toHaveBeenCalledWith('http://api.test/teams/team-456/events/event-123/lineup');
    expect(component['event']()?.opponent).toBe('Test Opponent');
    expect(stateService.activePlayers().length).toBe(2);
    expect(stateService.benchPlayers().length).toBe(1);
  });

  it('should handle player selection', () => {
    const player1 = mockLineup[0].player as any;
    const mockEvent = new MouseEvent('click');
    component['handlePlayerSelection']({ player: player1, event: mockEvent });
    expect(component['selectedPlayerId']()).toBe('p1');

    // Tapping active player again opens actions popover instead of deselecting
    component['handlePlayerSelection']({ player: player1, event: mockEvent });
    expect(component['selectedPlayerId']()).toBe('p1');
    expect(component['actionPlayer']()).toBe(player1);
    expect(component['popoverEvent']()).toBe(mockEvent);
  });

  it('should deselect a bench player when clicked a second time', () => {
    const benchPlayer = mockLineup[1].player as any;
    const mockEvent = new MouseEvent('click');
    component['handlePlayerSelection']({ player: benchPlayer, event: mockEvent });
    expect(component['selectedPlayerId']()).toBe('p2');

    // Clicking the bench player a second time deselects them
    component['handlePlayerSelection']({ player: benchPlayer, event: mockEvent });
    expect(component['selectedPlayerId']()).toBeNull();
  });

  it('should deselect a basketball active player when clicked a second time', () => {
    const player1 = mockLineup[0].player as any;
    component['handleBasketballPlayerSelected'](player1);
    expect(component['selectedPlayerId']()).toBe('p1');

    // Clicking the active player a second time deselects them
    component['handleBasketballPlayerSelected'](player1);
    expect(component['selectedPlayerId']()).toBeNull();
  });

  it('should stage a sub when swapping bench and active player', () => {
    const activePlayer = mockLineup[0].player as any;
    const benchPlayer = mockLineup[1].player as any;
    const mockEvent = new MouseEvent('click');

    // Select bench player
    component['handlePlayerSelection']({ player: benchPlayer, event: mockEvent });
    expect(component['selectedPlayerId']()).toBe('p2');

    // Tap active player
    component['handlePlayerSelection']({ player: activePlayer, event: mockEvent });

    // Selection should be cleared
    expect(component['selectedPlayerId']()).toBe(null);

    // Sub should be staged
    const staged = stateService.stagedSubs();
    expect(staged.length).toBe(1);
    expect(staged[0].inPlayerId).toBe('p2');
    expect(staged[0].outPlayerId).toBe('p1');

    // Apply subs
    component['handleApplySubs']();

    // Event should be logged
    const events = stateService.events();
    expect(events.length).toBe(1);
    expect(events[0].type).toBe('SUB');
    expect(events[0].playerIdIn).toBe('p2');
    expect(events[0].playerIdOut).toBe('p1');
    expect(events[0].slotIndex).toBe(0);

    // State should update
    expect(stateService.activePlayers().find(p => p.id === 'p2')).toBeTruthy();
    expect(stateService.benchPlayers().find(p => p.id === 'p1')).toBeTruthy();
  });

  it('should ignore and clear staged subs in handleApplySubs if the players are no longer valid', () => {
    const activePlayer = mockLineup[0].player as any;
    const benchPlayer = mockLineup[1].player as any;
    const mockEvent = new MouseEvent('click');

    // Stage (p2, p1)
    component['handlePlayerSelection']({ player: benchPlayer, event: mockEvent });
    component['handlePlayerSelection']({ player: activePlayer, event: mockEvent });
    expect(stateService.stagedSubs().length).toBe(1);

    // Simulate p1 (outgoing) becoming bench via some other event
    stateService.pushEvent({ type: 'SUB', playerIdIn: 'p3', playerIdOut: 'p1', slotIndex: 0, timestamp: Date.now(), minuteOccurred: 5 });
    
    // Applying subs should now clear the staged sub without pushing any new sub events (since it is invalid now)
    const initialEventsCount = stateService.events().length;
    component['handleApplySubs']();

    expect(stateService.stagedSubs().length).toBe(0);
    expect(stateService.events().length).toBe(initialEventsCount);
  });

  it('should trigger POSITION_SWAP event when tapping two active players', () => {
    const player1 = mockLineup[0].player as any;
    const player3 = mockLineup[2].player as any;
    const mockEvent = new MouseEvent('click');

    // Select first player
    component['handlePlayerSelection']({ player: player1, event: mockEvent });
    expect(component['selectedPlayerId']()).toBe('p1');

    // Tap second active player
    component['handlePlayerSelection']({ player: player3, event: mockEvent });

    // Selection should be cleared
    expect(component['selectedPlayerId']()).toBe(null);

    // Event should be logged
    const events = stateService.events();
    expect(events.length).toBe(1);
    expect(events[0].type).toBe('POSITION_SWAP');
    expect(events[0].slotIndexA).toBe(0);
    expect(events[0].slotIndexB).toBe(1);

    // Players should have swapped positions in the signal
    const active = stateService.activePlayers();
    const p1InActive = active.find(p => p.id === 'p1') as any;
    const p3InActive = active.find(p => p.id === 'p3') as any;
    expect(p1InActive.slotIndex).toBe(1);
    expect(p3InActive.slotIndex).toBe(0);
  });

  it('should call clockService.start when startClock is called', () => {
    component['startClock']();
    expect(clockServiceMock.start).toHaveBeenCalled();
  });

  it('should call clockService.stop when stopClock is called', () => {
    component['stopClock']();
    expect(clockServiceMock.stop).toHaveBeenCalled();
  });

  it('should push SHOT event when addTeamShot is called', () => {
    component['addTeamShot']();
    const events = stateService.events();
    expect(events.find(e => e.type === 'SHOT')).toBeDefined();
  });

  it('should push CORNER_KICK event when addTeamCorner is called', () => {
    component['addTeamCorner']();
    const events = stateService.events();
    expect(events.find(e => e.type === 'CORNER_KICK')).toBeDefined();
  });

  it('should push OPPONENT_SHOT event when addOpponentShot is called', () => {
    component['addOpponentShot']();
    const events = stateService.events();
    expect(events.find(e => e.type === 'OPPONENT_SHOT')).toBeDefined();
  });

  it('should push OPPONENT_CORNER_KICK event when addOpponentCorner is called', () => {
    component['addOpponentCorner']();
    const events = stateService.events();
    expect(events.find(e => e.type === 'OPPONENT_CORNER_KICK')).toBeDefined();
  });

  it('should push OPPONENT_OWN_GOAL event when addOpponentOwnGoal is called', () => {
    component['addOpponentOwnGoal']();
    const events = stateService.events();
    const ownGoalEvent = events.find(e => e.type === 'OPPONENT_OWN_GOAL');
    expect(ownGoalEvent).toBeDefined();
    expect(ownGoalEvent?.playerId).toBeUndefined();
    expect(stateService.score().team).toBe(1);
    expect(stateService.score().opponent).toBe(0);
  });

  it('should push SUB event with playerIdOut when handleMoveActiveToBench is called', () => {
    component['selectedPlayerId'].set('p1');
    component['handleMoveActiveToBench']();

    const events = stateService.events();
    const subEvent = events.find(e => e.type === 'SUB' && e.playerIdOut === 'p1');
    expect(subEvent).toBeDefined();
    expect(subEvent?.playerIdIn).toBeUndefined();
    expect(component['selectedPlayerId']()).toBeNull();
  });

  it('should push SUB event with playerIdOut when MOVE_TO_BENCH action is received', () => {
    component['handleAction']({ type: 'MOVE_TO_BENCH', playerId: 'p1' });

    const events = stateService.events();
    const subEvent = events.find(e => e.type === 'SUB' && e.playerIdOut === 'p1');
    expect(subEvent).toBeDefined();
  });

  it('should sub bench player directly into empty slot when emptySlotSelected is called', () => {
    // Select bench player p2
    component['selectedPlayerId'].set('p2');
    component['handleEmptySlotSelection'](5);

    const events = stateService.events();
    const subInEvent = events.find(e => e.type === 'SUB' && e.playerIdIn === 'p2');
    expect(subInEvent).toBeDefined();
    expect(subInEvent?.slotIndex).toBe(5);
    expect(component['selectedPlayerId']()).toBeNull();
  });

  it('should not sub bench player into empty slot if active players count is already at playersOnField', () => {
    // Set playersOnField to 2 (equal to current active count)
    (stateService as any)._playersOnField.set(2);
    expect(stateService.activePlayers().length).toBe(2);

    // Select bench player p2 and try to add to empty slot 5
    component['selectedPlayerId'].set('p2');
    component['handleEmptySlotSelection'](5);

    const events = stateService.events();
    const subInEvent = events.find(e => e.type === 'SUB' && e.playerIdIn === 'p2');
    expect(subInEvent).toBeUndefined();
    expect(component['selectedPlayerId']()).toBeNull();
  });

  it('should update event status to in_progress and start clock', () => {
    const eventsService = TestBed.inject(EventsService);
    const updateSpy = vi.spyOn(eventsService, 'updateEvent').mockReturnValue(of({} as any));

    component['startClock']();

    expect(clockServiceMock.start).toHaveBeenCalled();
    expect(updateSpy).toHaveBeenCalledWith('team-456', 'event-123', expect.objectContaining({
      status: 'in_progress',
    }));
  });

  it('should not render soccer-pitch-view and show loading skeleton when sportName is null or not Soccer', () => {
    stateService.setSportName(null);
    fixture.detectChanges();
    let soccerPitch = fixture.nativeElement.querySelector('app-soccer-pitch-view');
    expect(soccerPitch).toBeNull();

    stateService.setSportName('Basketball');
    fixture.detectChanges();
    soccerPitch = fixture.nativeElement.querySelector('app-soccer-pitch-view');
    expect(soccerPitch).toBeNull();
  });

  it('should render soccer-pitch-view only when sportName is Soccer', () => {
    stateService.setSportName('Soccer');
    fixture.detectChanges();
    const soccerPitch = fixture.nativeElement.querySelector('app-soccer-pitch-view');
    expect(soccerPitch).not.toBeNull();
  });

  describe('Basketball Courtside UX', () => {
    beforeEach(() => {
      stateService.initialize(
        'event-123',
        mockLineup as any,
        'team-456',
        5,
        'Apex Team',
        'Basketball',
        { periodCount: 4, periodLengthMinutes: 8 }
      );
      fixture.detectChanges();
    });

    it('should render basketball court view, active player strip, and rapid action keypad when sportName is Basketball', () => {
      const courtView = fixture.nativeElement.querySelector('app-basketball-court-view');
      const playerStrip = fixture.nativeElement.querySelector('app-active-player-strip');
      const rapidKeypad = fixture.nativeElement.querySelector('app-rapid-action-keypad');

      expect(courtView).not.toBeNull();
      expect(playerStrip).not.toBeNull();
      expect(rapidKeypad).not.toBeNull();
    });

    it('should log a basketball shot event when handleBasketballShot is called', () => {
      component['handleBasketballShot']({
        type: 'MADE_3PT',
        playerId: 'p1',
        x: 25.5,
        y: 42.0,
        distanceFeet: 23.8,
        assistorId: 'p3',
      });

      const events = stateService.events();
      const shotEvent = events.find((e) => e.type === 'MADE_3PT');
      expect(shotEvent).toBeDefined();
      expect(shotEvent?.playerId).toBe('p1');
      expect(shotEvent?.['x']).toBe(25.5);
      expect(shotEvent?.['y']).toBe(42.0);
      expect(shotEvent?.['distanceFeet']).toBe(23.8);
      expect(shotEvent?.['assistorId']).toBe('p3');
      expect(component['selectedPlayerId']()).toBeNull();
    });

    it('should log a basketball keypad action event when handleKeypadAction is called', () => {
      component['handleKeypadAction']({
        type: 'DEFENSIVE_REBOUND',
        playerId: 'p3',
      });

      const events = stateService.events();
      const rebEvent = events.find((e) => e.type === 'DEFENSIVE_REBOUND');
      expect(rebEvent).toBeDefined();
      expect(rebEvent?.playerId).toBe('p3');
      expect(component['selectedPlayerId']()).toBeNull();
    });

    it('should fulfill armed stat or select player when handleBasketballPlayerSelected is called', () => {
      const player = { id: 'p1', firstName: 'Player', lastName: 'One' };
      component['handleBasketballPlayerSelected'](player as any);

      // No armed stat on keypad mock, so player should become selected
      expect(component['selectedPlayerId']()).toBe('p1');
    });

    it('should undo last event when handleUndoAction is called', () => {
      component['handleKeypadAction']({
        type: 'STEAL',
        playerId: 'p1',
      });
      const activeBefore = stateService.events().filter((e) => e.status !== 'deleted');
      expect(activeBefore.length).toBe(1);

      component['handleUndoAction']();
      const activeAfter = stateService.events().filter((e) => e.status !== 'deleted');
      expect(activeAfter.length).toBe(0);
    });

    it('should log opponent basketball score when addOpponentBasketballScore is called', () => {
      component['addOpponentBasketballScore'](3);

      const events = stateService.events();
      const oppScore = events.find((e) => e.type === 'OPPONENT_SCORE');
      expect(oppScore).toBeDefined();
      expect(oppScore?.['points']).toBe(3);
      expect(stateService.score().opponent).toBe(3);
    });

    it('should log opponent basketball foul when addOpponentBasketballFoul is called', () => {
      component['addOpponentBasketballFoul']();

      const events = stateService.events();
      const oppFoul = events.find((e) => e.type === 'OPPONENT_FOUL');
      expect(oppFoul).toBeDefined();
    });

    it('should call team basketball timeout when callTeamBasketballTimeout is called', () => {
      component['callTeamBasketballTimeout']();

      const events = stateService.events();
      const toEvent = events.find((e) => e.type === 'TIMEOUT');
      expect(toEvent).toBeDefined();
      expect(toEvent?.['payload']?.team).toBe('us');
      expect(stateService.basketballTimeouts().teamUsed).toBe(1);
    });

    it('should log opponent basketball timeout when addOpponentBasketballTimeout is called', () => {
      component['addOpponentBasketballTimeout']();

      const events = stateService.events();
      const toEvent = events.find((e) => e.type === 'TIMEOUT');
      expect(toEvent).toBeDefined();
      expect(toEvent?.['payload']?.team).toBe('opponent');
      expect(stateService.basketballTimeouts().opponentUsed).toBe(1);
    });

    it('should toggle box score expanded state when toggleBoxScore is called', () => {
      expect(component['isBoxScoreExpanded']()).toBe(true);
      component['toggleBoxScore']();
      expect(component['isBoxScoreExpanded']()).toBe(false);
      component['toggleBoxScore']();
      expect(component['isBoxScoreExpanded']()).toBe(true);
    });

    it('should format player minutes correctly', () => {
      Object.defineProperty(component['playtimeService'], 'playtimeMap', {
        value: () => ({ p1: 125, p2: 5 }),
        configurable: true,
      });
      expect(component['getPlayerMinutes']('p1')).toBe('2:05');
      expect(component['getPlayerMinutes']('p2')).toBe('0:05');
      expect(component['getPlayerMinutes']('unknown')).toBe('0:00');
    });

    it('should determine when overtime can be added', () => {
      // In period 1, tied 0-0 -> cannot add overtime (game is still in regulation)
      expect(component['canAddBasketballOvertime']()).toBe(false);

      // Advance to period 4 (regulation end)
      stateService.pushEvents([
        { type: 'PERIOD_END', timestamp: 1 },
        { type: 'PERIOD_END', timestamp: 2 },
        { type: 'PERIOD_END', timestamp: 3 },
      ]);
      expect(stateService.currentPeriod()).toBe(4);
      expect(component['isRegulationEnd']()).toBe(true);

      // Score is tied (0-0), regulation is finished -> can add overtime!
      expect(component['canAddBasketballOvertime']()).toBe(true);

      // One team scores -> not tied anymore
      component['handleKeypadAction']({ type: 'MADE_2PT', playerId: 'p1' });
      expect(component['canAddBasketballOvertime']()).toBe(false);

      // Opponent scores to tie -> can add overtime again
      component['addOpponentBasketballScore'](2);
      expect(component['canAddBasketballOvertime']()).toBe(true);
    });

    it('should format basketball period action label correctly across regulation and overtime', () => {
      // Period 1
      expect(component['basketballPeriodActionLabel']()).toBe('Next Quarter');

      // Period 4, tied
      stateService.pushEvents([
        { type: 'PERIOD_END', timestamp: 1 },
        { type: 'PERIOD_END', timestamp: 2 },
        { type: 'PERIOD_END', timestamp: 3 },
      ]);
      expect(component['basketballPeriodActionLabel']()).toBe('Add Overtime');

      // Period 4, team ahead
      component['handleKeypadAction']({ type: 'MADE_2PT', playerId: 'p1' });
      expect(component['basketballPeriodActionLabel']()).toBe('End Game');

      // Period 5 (OT1), tied
      stateService.pushEvent({ type: 'OPPONENT_SCORE', points: 2, timestamp: 4 } as any);
      stateService.pushEvent({ type: 'PERIOD_END', timestamp: 5 });
      expect(stateService.currentPeriod()).toBe(5);
      expect(component['basketballPeriodActionLabel']()).toBe('Add OT 2');
    });

    it('should open prompt to add overtime when promptAddOvertime is called', async () => {
      await component['promptAddOvertime']();
      expect(alertControllerMock.create).toHaveBeenCalled();
    });

    it('should execute overtime transition when executeStartOvertime is called', async () => {
      // Advance to period 4
      stateService.pushEvents([
        { type: 'PERIOD_END', timestamp: 1 },
        { type: 'PERIOD_END', timestamp: 2 },
        { type: 'PERIOD_END', timestamp: 3 },
      ]);

      await component['executeStartOvertime'](4);

      expect(stateService.currentPeriod()).toBe(5);
      expect(stateService.isOvertime()).toBe(true);
      expect(stateService.overtimePeriodLengthMinutes()).toBe(4);
      expect(clockServiceMock.stop).toHaveBeenCalled();
      expect(clockServiceMock.reset).toHaveBeenCalled();
      expect(httpMock.patch).toHaveBeenCalled();
      expect(toastControllerMock.create).toHaveBeenCalled();
    });

    it('should trigger promptAddOvertime via nextPeriod if game is tied at regulation end', async () => {
      const promptSpy = vi.spyOn(component as any, 'promptAddOvertime');
      stateService.pushEvents([
        { type: 'PERIOD_END', timestamp: 1 },
        { type: 'PERIOD_END', timestamp: 2 },
        { type: 'PERIOD_END', timestamp: 3 },
      ]);
      expect(component['canAddBasketballOvertime']()).toBe(true);

      await component['nextPeriod']();
      expect(promptSpy).toHaveBeenCalled();
    });
  });

  describe('Lifecycle and Stale Event Protection', () => {
    it('should reset stateService when component is destroyed', () => {
      stateService.initialize('event-123', mockLineup, 'team-456', 11, 'My Team', 'Soccer');
      expect(stateService.eventId()).toBe('event-123');

      component.ngOnDestroy();

      expect(stateService.eventId()).toBeNull();
      expect(stateService.status()).toBe('in_progress');
    });

    it('should not navigate to summary when stateService has completed status from another event', () => {
      const router = TestBed.inject(Router);
      const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true as any);

      // State service holds a completed game from a DIFFERENT event
      stateService.initialize('other-event-789', mockLineup, 'team-456');
      stateService.endGame('completed');
      expect(stateService.status()).toBe('completed');
      expect(stateService.eventId()).toBe('other-event-789');

      TestBed.flushEffects();

      expect(navigateSpy).not.toHaveBeenCalled();
    });

    it('should navigate to summary when stateService status becomes completed for the current event', () => {
      const router = TestBed.inject(Router);
      const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true as any);

      // State service initialized for THIS event ('event-123')
      stateService.initialize('event-123', mockLineup, 'team-456');
      stateService.endGame('completed');
      expect(stateService.status()).toBe('completed');
      expect(stateService.eventId()).toBe('event-123');

      TestBed.flushEffects();

      expect(navigateSpy).toHaveBeenCalledWith(
        ['/teams', 'team-456', 'events', 'event-123', 'summary'],
        { replaceUrl: true }
      );
    });
  });

  describe('Volleyball Courtside UX', () => {
    const vballLineup: LineupEntry[] = [
      { playerId: 'p1', player: { id: 'p1', firstName: 'John', lastName: 'Server', jerseyNumber: 1 }, status: 'starting', slotIndex: 0 },
      { playerId: 'p2', player: { id: 'p2', firstName: 'Jane', lastName: 'Hitter', jerseyNumber: 2 }, status: 'starting', slotIndex: 1 },
      { playerId: 'p3', player: { id: 'p3', firstName: 'Bob', lastName: 'Middle', jerseyNumber: 3, preferredPosition: 'Middle Blocker' }, status: 'starting', slotIndex: 4 },
      { playerId: 'p4', player: { id: 'p4', firstName: 'Lucy', lastName: 'Libero', jerseyNumber: 99, preferredPosition: 'Libero' }, status: 'bench' },
    ];

    beforeEach(() => {
      stateService.initialize('event-123', vballLineup, 'team-456', 6, 'Volleyball Team', 'Volleyball');
      stateService.setLiberoId('p4');
      fixture.detectChanges();
    });

    it('should render volleyball rotation strip and stat pad when sportName is Volleyball', () => {
      const rotationStrip = fixture.nativeElement.querySelector('app-volleyball-rotation-strip');
      const statPad = fixture.nativeElement.querySelector('app-volleyball-stat-pad');
      expect(rotationStrip).toBeTruthy();
      expect(statPad).toBeTruthy();
    });

    it('should select player without opening popover when volleyball player is selected', () => {
      component['handleVolleyballPlayerSelected'](vballLineup[0].player);
      expect(component['selectedPlayerId']()).toBe('p1');
      expect(component['actionPlayer']()).toBeNull();
    });

    it('should log stat and update score when handleKeypadAction is called for volleyball', () => {
      expect(stateService.score().team).toBe(0);

      // Log KILL (+Pt)
      component['handleKeypadAction']({
        type: 'KILL',
        playerId: 'p2',
      });

      expect(stateService.score().team).toBe(1);
      expect(stateService.playerStats()['p2'].kills).toBe(1);

      // Log BLOCK (+Pt)
      component['handleKeypadAction']({
        type: 'BLOCK',
        playerId: 'p3',
      });
      expect(stateService.score().team).toBe(2);

      // Log SERVICE_ERROR (Opp Pt)
      component['handleKeypadAction']({
        type: 'SERVICE_ERROR',
        playerId: 'p1',
      });
      expect(stateService.score().opponent).toBe(1);

      // Log SERVE_RECEIVE 0 (Ace Against / Opp Pt)
      component['handleKeypadAction']({
        type: 'SERVE_RECEIVE',
        playerId: 'p2',
        payload: { score: 0 },
      });
      expect(stateService.score().opponent).toBe(2);
    });

    it('should perform rotateActivePlayers and create clockwise rotation swaps', () => {
      const pushSpy = vi.spyOn(stateService, 'pushEvents');
      component['rotateActivePlayers']();
      expect(pushSpy).toHaveBeenCalled();
      const pushedSwaps = pushSpy.mock.calls[0][0];
      expect(pushedSwaps.length).toBe(5);
      expect(pushedSwaps.every((s: any) => s.type === 'POSITION_SWAP')).toBe(true);
    });

    it('should execute quickLiberoSwap to swap Libero in and out', () => {
      const quickSwapSpy = vi.spyOn(stateService, 'quickLiberoSwap');
      component['handleQuickLiberoSwap']();
      expect(quickSwapSpy).toHaveBeenCalled();
    });

    it('should revert last event on handleUndoAction', () => {
      component['handleKeypadAction']({ type: 'ACE', playerId: 'p1' });
      expect(stateService.score().team).toBe(1);
      expect(stateService.canUndo()).toBe(true);

      component['handleUndoAction']();
      expect(stateService.score().team).toBe(0);
    });
  });
});
