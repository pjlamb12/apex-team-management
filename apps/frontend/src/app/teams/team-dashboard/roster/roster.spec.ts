import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { signal } from '@angular/core';
import { Roster } from './roster';
import {
  PlayersService,
  AnalyticsService,
  SeasonsService,
  CandidatesService,
  TeamService,
} from '@apex-team/client/data-access/team';
import { RuntimeConfigLoaderService } from 'runtime-config-loader';
import { ModalController, AlertController } from '@ionic/angular/standalone';

describe('Roster', () => {
  let component: Roster;
  let fixture: ComponentFixture<Roster>;

  const mockPlayers = [
    { id: 'p1', firstName: 'Alex', lastName: 'Morgan', jerseyNumber: 13, isActive: true, teamId: 't1' },
    { id: 'p2', firstName: 'Megan', lastName: 'Rapinoe', jerseyNumber: 15, isActive: false, teamId: 't1' },
    { id: 'p3', firstName: 'Rose', lastName: 'Lavelle', jerseyNumber: 16, isActive: true, teamId: 't1' },
  ];

  const mockPlayersService = {
    getPlayers: vi.fn().mockReturnValue(of(mockPlayers)),
    getPlayersForSeason: vi.fn().mockReturnValue(of(mockPlayers)),
    deactivatePlayer: vi.fn().mockReturnValue(of({ id: 'p1', isActive: false })),
    reactivatePlayer: vi.fn().mockReturnValue(of({ id: 'p2', isActive: true })),
    deletePlayer: vi.fn().mockReturnValue(of(undefined)),
    removePlayerFromSeason: vi.fn().mockReturnValue(of(undefined)),
  };

  const mockSeasonsService = {
    seasons: signal([]),
    selectedSeasonId: signal<string | null>(null),
    initialize: vi.fn().mockResolvedValue(undefined),
  };

  const mockAnalyticsService = {
    getParticipationStats: vi.fn().mockReturnValue(of([])),
  };

  const mockCandidatesService = {
    getCandidates: vi.fn().mockReturnValue(of([])),
  };

  const mockTeamService = {
    getTeam: vi.fn().mockReturnValue(Promise.resolve({ id: 't1', sport: { positionTypes: [] } })),
  };

  beforeEach(async () => {
    const mockRuntimeConfig = {
      getConfigObjectKey: vi.fn().mockReturnValue('http://api.test'),
    };

    await TestBed.configureTestingModule({
      imports: [Roster],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: RuntimeConfigLoaderService, useValue: mockRuntimeConfig },
        { provide: PlayersService, useValue: mockPlayersService },
        { provide: SeasonsService, useValue: mockSeasonsService },
        { provide: AnalyticsService, useValue: mockAnalyticsService },
        { provide: CandidatesService, useValue: mockCandidatesService },
        { provide: TeamService, useValue: mockTeamService },
        { provide: ModalController, useValue: { create: vi.fn() } },
        { provide: AlertController, useValue: { create: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Roster);
    component = fixture.componentInstance;
  });

  it('should initialize and load all players into state', async () => {
    component.id = 't1';
    await component['loadPlayers']('t1', null);

    expect(mockPlayersService.getPlayers).toHaveBeenCalledWith('t1', true);
    expect(component['players']().length).toBe(3);
    expect(component['activePlayerCount']()).toBe(2);
    expect(component['inactivePlayerCount']()).toBe(1);
  });

  it('should filter sortedPlayers based on activeFilter', () => {
    component['players'].set(mockPlayers as any);

    component['activeFilter'].set('active');
    expect(component['sortedPlayers']().map((p) => p.id)).toEqual(['p1', 'p3']);

    component['activeFilter'].set('inactive');
    expect(component['sortedPlayers']().map((p) => p.id)).toEqual(['p2']);

    component['activeFilter'].set('all');
    expect(component['sortedPlayers']().map((p) => p.id)).toEqual(['p1', 'p2', 'p3']);
  });
});
