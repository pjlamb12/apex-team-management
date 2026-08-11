import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { GameSummary } from './game-summary';
import { EventsService, TeamService } from '@apex-team/client/data-access/team';
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

    const mockTeamService = {
      getTeam: vi.fn().mockReturnValue(Promise.resolve({ id: 't1', sport: { name: 'Soccer' } })),
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
        { provide: TeamService, useValue: mockTeamService },
        { provide: LiveGameStateService, useValue: mockLiveGameStateService },
        { provide: EventSyncService, useValue: mockEventSyncService },
        { provide: ModalController, useValue: { create: vi.fn().mockResolvedValue({ present: vi.fn() }) } },
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
        playerIdA: 'p1',
        playerIdB: 'p2',
      },
    };

    (component as any).openEditModal(swapEvent);
    (component as any).editMinute.set(16);
    (component as any).editPlayerA.set('p3');
    (component as any).editPlayerB.set('p4');
    (component as any).editPositionA.set('DEF');
    (component as any).editPositionB.set('MID');

    await (component as any).saveEdit();

    expect(updateSpy).toHaveBeenCalledWith('team-1', 'event-1', 'swap-1', {
      minuteOccurred: 16,
      payload: {
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
    (component as any).editMinute.set(22);
    (component as any).editPlayerA.set('p1');
    (component as any).editPlayerB.set('p2');
    (component as any).editPositionA.set('MID');
    (component as any).editPositionB.set('FWD');

    await (component as any).saveCreate();

    expect(logSpy).toHaveBeenCalledWith('team-1', 'event-1', {
      eventType: 'POSITION_SWAP',
      minuteOccurred: 22,
      payload: {
        period: 1,
        playerIdA: 'p1',
        playerIdB: 'p2',
        positionNameA: 'MID',
        positionNameB: 'FWD',
      },
    });
  });
});
