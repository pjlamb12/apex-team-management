import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { OpponentsList } from './opponents-list';
import { OpponentsService } from '@apex-team/client/data-access/team';
import { ModalController } from '@ionic/angular/standalone';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OpponentWithStats } from '@apex-team/shared/util/models';

describe('OpponentsList', () => {
  let component: OpponentsList;
  let fixture: ComponentFixture<OpponentsList>;
  let mockOpponentsService: any;
  let mockModalCtrl: any;

  const mockOpponents: OpponentWithStats[] = [
    {
      id: 'opp-1',
      teamId: 'team-123',
      name: 'Thunder FC',
      threatLevel: 'high',
      formation: '4-3-3',
      dangerPlayers: [
        {
          id: 'dp-1',
          jerseyNumber: 10,
          name: 'Lucas',
          position: 'Forward',
          threatLevel: 'high',
        },
      ],
      headToHead: {
        totalGames: 3,
        wins: 2,
        draws: 1,
        losses: 0,
        winPercentage: 67,
        goalsFor: 7,
        goalsAgainst: 3,
        goalDifference: 4,
        avgGoalsFor: 2.3,
        avgGoalsAgainst: 1.0,
        cleanSheets: 1,
        homeRecord: { wins: 1, draws: 0, losses: 0, total: 1 },
        awayRecord: { wins: 1, draws: 1, losses: 0, total: 2 },
        lastPlayedDate: '2026-08-01T10:00:00Z',
      },
    },
    {
      id: 'opp-2',
      teamId: 'team-123',
      name: 'Real Salt Lake 2012',
      threatLevel: 'critical',
      formation: '3-5-2',
      dangerPlayers: [],
      headToHead: {
        totalGames: 2,
        wins: 0,
        draws: 1,
        losses: 1,
        winPercentage: 0,
        goalsFor: 2,
        goalsAgainst: 4,
        goalDifference: -2,
        avgGoalsFor: 1.0,
        avgGoalsAgainst: 2.0,
        cleanSheets: 0,
        homeRecord: { wins: 0, draws: 1, losses: 0, total: 1 },
        awayRecord: { wins: 0, draws: 0, losses: 1, total: 1 },
        lastPlayedDate: '2026-07-15T10:00:00Z',
      },
    },
  ];

  beforeEach(async () => {
    mockOpponentsService = {
      getOpponents: vi.fn().mockReturnValue(of(mockOpponents)),
    };

    mockModalCtrl = {
      create: vi.fn().mockResolvedValue({
        present: vi.fn().mockResolvedValue(undefined),
        onWillDismiss: vi.fn().mockResolvedValue({ data: null, role: 'cancel' }),
      }),
    };

    await TestBed.configureTestingModule({
      imports: [OpponentsList],
      providers: [
        provideRouter([]),
        { provide: OpponentsService, useValue: mockOpponentsService },
        { provide: ModalController, useValue: mockModalCtrl },
        {
          provide: ActivatedRoute,
          useValue: {
            parent: {
              snapshot: {
                paramMap: {
                  get: (key: string) => (key === 'id' ? 'team-123' : null),
                },
              },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OpponentsList);
    component = fixture.componentInstance;
    component.id = 'team-123';
    fixture.detectChanges();
  });

  it('should create and load opponents', () => {
    expect(component).toBeTruthy();
    expect(mockOpponentsService.getOpponents).toHaveBeenCalledWith('team-123');
    expect((component as any).opponents().length).toBe(2);
  });

  it('should compute aggregated metrics correctly', () => {
    expect((component as any).totalOpponents()).toBe(2);
    expect((component as any).totalMatches()).toBe(5);
    expect((component as any).totalWins()).toBe(2);
    expect((component as any).totalGoalsFor()).toBe(9);
    expect((component as any).totalGoalsAgainst()).toBe(7);
    expect((component as any).overallWinPercentage()).toBe(40);
  });

  it('should filter opponents by search query', () => {
    (component as any).onSearchChange({ detail: { value: 'thunder' } });
    expect((component as any).filteredOpponents().length).toBe(1);
    expect((component as any).filteredOpponents()[0].name).toBe('Thunder FC');
  });

  it('should filter opponents by threat level', () => {
    (component as any).setThreatFilter('critical');
    expect((component as any).filteredOpponents().length).toBe(1);
    expect((component as any).filteredOpponents()[0].name).toBe('Real Salt Lake 2012');
  });

  it('should open new opponent modal', async () => {
    await (component as any).openNewOpponentModal();
    expect(mockModalCtrl.create).toHaveBeenCalled();
  });
});
