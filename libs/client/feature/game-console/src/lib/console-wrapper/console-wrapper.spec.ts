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
    },
    {
      playerId: 'p2',
      player: { id: 'p2', firstName: 'Player', lastName: 'Two', jerseyNumber: '2' },
      status: 'bench',
      positionName: null,
    },
  ];

  beforeEach(async () => {
    localStorage.clear();
    clockServiceMock = {
      isRunning: signal(false),
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
    expect(stateService.activePlayers().length).toBe(1);
    expect(stateService.benchPlayers().length).toBe(1);
  });

  it('should handle player selection', () => {
    const player1 = mockLineup[0].player as any;
    component['handlePlayerSelection'](player1);
    expect(component['selectedPlayerId']()).toBe('p1');

    // Deselect if tapping again
    component['handlePlayerSelection'](player1);
    expect(component['selectedPlayerId']()).toBe(null);
  });

  it('should trigger SUB event when swapping bench and active player', () => {
    const activePlayer = mockLineup[0].player as any;
    const benchPlayer = mockLineup[1].player as any;

    // Select bench player
    component['handlePlayerSelection'](benchPlayer);
    expect(component['selectedPlayerId']()).toBe('p2');

    // Tap active player
    component['handlePlayerSelection'](activePlayer);

    // Selection should be cleared
    expect(component['selectedPlayerId']()).toBe(null);

    // Event should be logged
    const events = stateService.events();
    expect(events.length).toBe(1);
    expect(events[0].type).toBe('SUB');
    expect(events[0].playerIdIn).toBe('p2');
    expect(events[0].playerIdOut).toBe('p1');

    // State should update
    expect(stateService.activePlayers()[0].id).toBe('p2');
    expect(stateService.benchPlayers()[0].id).toBe('p1');
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
