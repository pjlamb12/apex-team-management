import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PlayerProfileAnalyticsComponent } from './player-profile';
import { AnalyticsService, TeamService, AwardsService } from '@apex-team/client/data-access/team';
import { ModalController } from '@ionic/angular/standalone';
import { RuntimeConfigLoaderService } from 'runtime-config-loader';
import { PlayerAward } from '@apex-team/shared/util/models';

describe('PlayerProfileAnalyticsComponent', () => {
  let component: PlayerProfileAnalyticsComponent;
  let fixture: ComponentFixture<PlayerProfileAnalyticsComponent>;

  const mockProfile = {
    playerId: 'p1',
    firstName: 'Lucas',
    lastName: 'Silva',
    jerseyNumber: 10,
    preferredPosition: 'CM',
    isGuest: false,
    goals: 5,
    assists: 3,
    gamesPlayed: 6,
    practicesAttended: 8,
    totalPlayingTimeSeconds: 14400,
    positions: [],
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

  const mockAnalyticsService = {
    getPlayerProfile: vi.fn().mockReturnValue(of(mockProfile)),
  };

  const mockAwardsService = {
    getPlayerAwards: vi.fn().mockReturnValue(of(mockAwards)),
  };

  const mockTeamService = {
    getTeam: vi.fn().mockReturnValue(Promise.resolve({ id: 't1', sport: { name: 'Soccer' } })),
  };

  const mockModalCtrl = {
    dismiss: vi.fn().mockResolvedValue(true),
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
        { provide: AnalyticsService, useValue: mockAnalyticsService },
        { provide: AwardsService, useValue: mockAwardsService },
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

  it('should initialize and fetch player profile, team, and awards', async () => {
    await (component as any).loadData();

    expect(mockAnalyticsService.getPlayerProfile).toHaveBeenCalledWith('t1', 'p1');
    expect(mockAwardsService.getPlayerAwards).toHaveBeenCalledWith('t1', 'p1');
    expect((component as any).profile()).toEqual(mockProfile);
    expect((component as any).playerAwards()).toEqual(mockAwards);
  });

  it('should dismiss modal when dismiss is called', async () => {
    await (component as any).dismiss();
    expect(mockModalCtrl.dismiss).toHaveBeenCalled();
  });
});
