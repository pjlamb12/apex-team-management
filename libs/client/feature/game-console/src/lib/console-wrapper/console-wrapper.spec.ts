import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConsoleWrapper } from './console-wrapper';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { LiveClockService } from '../live-clock.service';
import { LiveGameStateService } from '../live-game-state.service';
import { RuntimeConfigLoaderService } from 'runtime-config-loader';
import { of } from 'rxjs';
import { signal, NO_ERRORS_SCHEMA } from '@angular/core';

describe('ConsoleWrapper', () => {
  let component: ConsoleWrapper;
  let fixture: ComponentFixture<ConsoleWrapper>;
  let clockServiceMock: any;
  let httpMock: any;
  let routeMock: any;
  let configMock: any;
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
    };

    httpMock = {
      get: vi.fn((url: string) => {
        if (url.endsWith('/lineup')) return of(mockLineup);
        return of({ opponent: 'Test Opponent' });
      }),
    };

    routeMock = {
      paramMap: of({
        get: (key: string) => {
          if (key === 'gameId') return 'game-123';
          if (key === 'id') return 'team-456';
          return null;
        },
      }),
    };

    configMock = {
      getConfigObjectKey: vi.fn().mockReturnValue('http://api.test'),
    };

    await TestBed.configureTestingModule({
      imports: [ConsoleWrapper],
      providers: [
        { provide: ActivatedRoute, useValue: routeMock },
        { provide: HttpClient, useValue: httpMock },
        { provide: LiveClockService, useValue: clockServiceMock },
        { provide: RuntimeConfigLoaderService, useValue: configMock },
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

  it('should load game data and lineup on init', () => {
    expect(httpMock.get).toHaveBeenCalledWith('http://api.test/games/game-123');
    expect(httpMock.get).toHaveBeenCalledWith('http://api.test/games/game-123/lineup');
    expect(component['game']()?.opponent).toBe('Test Opponent');
    expect(stateService.activePlayers().length).toBe(2);
    expect(stateService.benchPlayers().length).toBe(1);
  });

  it('should handle player selection', () => {
    const player1 = mockLineup[0].player as any;
    const mockEvent = new MouseEvent('click');
    component['handlePlayerSelection']({ player: player1, event: mockEvent });
    expect(component['selectedPlayerId']()).toBe('p1');

    // Deselect if tapping again
    component['handlePlayerSelection']({ player: player1, event: mockEvent });
    expect(component['selectedPlayerId']()).toBe(null);
  });

  it('should trigger SUB event when swapping bench and active player', () => {
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
});
