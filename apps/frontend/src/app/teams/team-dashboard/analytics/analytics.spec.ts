import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { TeamAnalytics } from './analytics';
import { AnalyticsService, SeasonsService, LeaguesService, TeamService } from '@apex-team/client/data-access/team';
import { RuntimeConfigLoaderService } from 'runtime-config-loader';
import { ModalController } from '@ionic/angular/standalone';
import { signal } from '@angular/core';

describe('TeamAnalytics', () => {
  let component: TeamAnalytics;
  let fixture: ComponentFixture<TeamAnalytics>;

  const mockSeasonsService = {
    seasons: signal([{ id: 's1', name: 'Fall 2026', isActive: true }]),
    selectedSeasonId: signal<string | null>('s1'),
    initialize: vi.fn().mockResolvedValue(undefined),
    getSeasonStats: vi.fn().mockReturnValue(of({
      wins: 3,
      losses: 1,
      draws: 2,
      goalsFor: 10,
      goalsAgainst: 5,
      goalDifference: 5
    })),
  };

  const mockAnalyticsService = {
    getPerformanceMetrics: vi.fn().mockReturnValue(of([])),
    getParticipationStats: vi.fn().mockReturnValue(of([])),
    getTeamPlayingTime: vi.fn().mockReturnValue(of({})),
  };

  const mockLeaguesService = {
    findAllForSeason: vi.fn().mockReturnValue(of([{ id: 'l1', name: 'Premier League' }])),
  };

  const mockTeamService = {
    getTeam: vi.fn().mockReturnValue(Promise.resolve({ id: 't1', sport: { name: 'Soccer' } })),
  };

  beforeEach(async () => {
    const mockRuntimeConfig = {
      getConfigObjectKey: vi.fn().mockReturnValue('http://api.test'),
    };

    await TestBed.configureTestingModule({
      imports: [TeamAnalytics],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: RuntimeConfigLoaderService, useValue: mockRuntimeConfig },
        { provide: AnalyticsService, useValue: mockAnalyticsService },
        { provide: SeasonsService, useValue: mockSeasonsService },
        { provide: LeaguesService, useValue: mockLeaguesService },
        { provide: TeamService, useValue: mockTeamService },
        { provide: ModalController, useValue: { create: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TeamAnalytics);
    component = fixture.componentInstance;
  });

  it('should initialize and fetch team record stats for selected season', async () => {
    (component as any).id = 't1';
    await (component as any).loadData('t1', 's1', undefined, 'game');

    expect(mockSeasonsService.getSeasonStats).toHaveBeenCalledWith('t1', 's1', undefined);
    expect((component as any).teamStats()).toEqual({
      wins: 3,
      losses: 1,
      draws: 2,
      goalsFor: 10,
      goalsAgainst: 5,
      goalDifference: 5
    });
    expect((component as any).getRecordScopeLabel()).toBe('Overall Record (All Competitions)');
  });

  it('should update record scope label when competition filter is set', async () => {
    (component as any).id = 't1';
    (component as any).leagues.set([{ id: 'l1', name: 'Tournament Cup' }]);
    (component as any).selectedLeagueId.set('l1');

    expect((component as any).getRecordScopeLabel()).toBe('Tournament Cup Record');
  });

  it('should exclude guest players from mostCommitted list', () => {
    (component as any).participationStats.set([
      { playerId: 'p1', firstName: 'Regular', lastName: 'Player', percentage: 90, totalEvents: 10, present: 9, isGuest: false },
      { playerId: 'p2', firstName: 'Guest', lastName: 'Player', percentage: 100, totalEvents: 1, present: 1, isGuest: true },
      { playerId: 'p3', firstName: 'Another', lastName: 'Regular', percentage: 80, totalEvents: 10, present: 8 },
    ]);

    const committed = (component as any).mostCommitted();
    expect(committed.length).toBe(2);
    expect(committed.map((p: any) => p.playerId)).toEqual(['p1', 'p3']);
  });

  it('should include inactive players who participated in games, but filter inactive players with 0 games unless toggled', () => {
    (component as any).performanceMetrics.set([
      { playerId: 'p1', firstName: 'Active', lastName: 'Player', gamesPlayed: 2, isActive: true, goals: 1 },
      { playerId: 'p2', firstName: 'SteppedAway', lastName: 'WithGames', gamesPlayed: 3, isActive: false, goals: 2 },
      { playerId: 'p3', firstName: 'SteppedAway', lastName: 'ZeroGames', gamesPlayed: 0, isActive: false, goals: 0 },
    ]);

    (component as any).includeInactive.set(false);
    let metrics = (component as any).filteredPerformanceMetrics();
    expect(metrics.map((m: any) => m.playerId)).toEqual(['p1', 'p2']);

    (component as any).includeInactive.set(true);
    metrics = (component as any).filteredPerformanceMetrics();
    expect(metrics.map((m: any) => m.playerId)).toEqual(['p1', 'p2', 'p3']);
  });
});
