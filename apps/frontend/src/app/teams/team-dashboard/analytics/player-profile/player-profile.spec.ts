import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PlayerProfileAnalyticsComponent } from './player-profile';
import {
  AnalyticsService,
  TeamService,
  AwardsService,
  GoalsService,
} from '@apex-team/client/data-access/team';
import { ModalController } from '@ionic/angular/standalone';
import { RuntimeConfigLoaderService } from 'runtime-config-loader';
import { PlayerAward, PlayerGoal } from '@apex-team/shared/util/models';

describe('PlayerProfileAnalyticsComponent', () => {
  let component: PlayerProfileAnalyticsComponent;
  let fixture: ComponentFixture<PlayerProfileAnalyticsComponent>;

  const mockProfile = {
    playerId: 'p1',
    player: {
      id: 'p1',
      firstName: 'Lucas',
      lastName: 'Silva',
      jerseyNumber: 10,
      preferredPosition: 'CM',
    },
    totalGoals: 5,
    totalAssists: 3,
    totalGamesPlayed: 6,
    totalMinutes: 240,
    positionDistribution: {},
    history: [],
  };

  const mockAwards: PlayerAward[] = [
    {
      id: 'a1',
      teamId: 't1',
      playerId: 'p1',
      eventId: 'e1',
      badgeType: 'player_of_the_match',
      title: 'Player of the Match',
      category: 'mvp',
      icon: 'star-outline',
      color: 'amber',
      notes: 'Game winner!',
      awardedAt: '2026-08-10',
    },
  ];

  const mockGoals: PlayerGoal[] = [
    {
      id: 'g1',
      teamId: 't1',
      playerId: 'p1',
      title: 'Scan Field Before Receiving',
      category: 'tactical',
      status: 'in_progress',
      masteryStage: 'developing',
      timeframe: 'mid_season',
      createdAt: '2026-04-01',
      updatedAt: '2026-04-01',
      notes: [],
    },
  ];

  const mockAnalyticsService = {
    getPlayerProfile: vi.fn().mockReturnValue(of(mockProfile)),
  };

  const mockAwardsService = {
    getPlayerAwards: vi.fn().mockReturnValue(of(mockAwards)),
  };

  const mockGoalsService = {
    getPlayerGoals: vi.fn().mockReturnValue(of(mockGoals)),
    updateGoal: vi.fn().mockReturnValue(of({ id: 'g1', masteryStage: 'mastered' })),
    deleteGoal: vi.fn().mockReturnValue(of({ success: true, id: 'g1' })),
    deleteGoalNote: vi.fn().mockReturnValue(of({ success: true, id: 'n1' })),
  };

  const mockTeamService = {
    getTeam: vi.fn().mockReturnValue(Promise.resolve({ id: 't1', name: 'Apex FC', sport: { name: 'Soccer' } })),
  };

  const mockModalCtrl = {
    dismiss: vi.fn().mockResolvedValue(true),
    create: vi.fn().mockResolvedValue({
      present: vi.fn().mockResolvedValue(true),
      onWillDismiss: vi.fn().mockResolvedValue({ data: undefined }),
    }),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const mockRuntimeConfig = {
      getConfigObjectKey: vi.fn().mockReturnValue('http://api.test'),
    };

    await TestBed.configureTestingModule({
      imports: [PlayerProfileAnalyticsComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AnalyticsService, useValue: mockAnalyticsService },
        { provide: AwardsService, useValue: mockAwardsService },
        { provide: GoalsService, useValue: mockGoalsService },
        { provide: TeamService, useValue: mockTeamService },
        { provide: ModalController, useValue: mockModalCtrl },
        { provide: RuntimeConfigLoaderService, useValue: mockRuntimeConfig },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PlayerProfileAnalyticsComponent);
    component = fixture.componentInstance;
    component.teamId = 't1';
    component.playerId = 'p1';
  });

  it('should initialize and fetch player profile, team, awards, and goals', async () => {
    await (component as any).loadData();

    expect(mockAnalyticsService.getPlayerProfile).toHaveBeenCalledWith('t1', 'p1');
    expect(mockAwardsService.getPlayerAwards).toHaveBeenCalledWith('t1', 'p1');
    expect(mockGoalsService.getPlayerGoals).toHaveBeenCalledWith('t1', 'p1', undefined);
    expect((component as any).profile()).toEqual(mockProfile);
    expect((component as any).playerAwards()).toEqual(mockAwards);
    expect((component as any).playerGoals()).toEqual(mockGoals);
  });

  it('should switch tabs', () => {
    (component as any).setTab('idp');
    expect((component as any).activeTab()).toBe('idp');

    (component as any).setTab('history');
    expect((component as any).activeTab()).toBe('history');
  });

  it('should update goal stage when advanceStage is called', async () => {
    (component as any).playerGoals.set(mockGoals);
    await (component as any).advanceStage(mockGoals[0], 'mastered');

    expect(mockGoalsService.updateGoal).toHaveBeenCalledWith(
      't1',
      'g1',
      { masteryStage: 'mastered' },
    );
  });

  it('should delete goal when deleteGoal is called', async () => {
    (component as any).playerGoals.set(mockGoals);
    await (component as any).deleteGoal(mockGoals[0]);

    expect(mockGoalsService.deleteGoal).toHaveBeenCalledWith('t1', 'g1');
  });

  it('should dismiss modal when dismiss is called', async () => {
    await (component as any).dismiss();
    expect(mockModalCtrl.dismiss).toHaveBeenCalled();
  });
});
