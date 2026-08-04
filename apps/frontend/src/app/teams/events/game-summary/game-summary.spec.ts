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
        { provide: ModalController, useValue: { create: vi.fn() } },
        { provide: ActionSheetController, useValue: { create: vi.fn() } },
        { provide: AlertController, useValue: { create: vi.fn() } },
        { provide: ToastController, useValue: { create: vi.fn() } },
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
});
