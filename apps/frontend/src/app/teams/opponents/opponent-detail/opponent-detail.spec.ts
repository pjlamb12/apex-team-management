import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { OpponentDetail } from './opponent-detail';
import { OpponentsService } from '@apex-team/client/data-access/team';
import { ModalController, AlertController } from '@ionic/angular/standalone';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OpponentWithStats } from '@apex-team/shared/util/models';

describe('OpponentDetail', () => {
  let component: OpponentDetail;
  let fixture: ComponentFixture<OpponentDetail>;
  let mockOpponentsService: any;
  let mockModalCtrl: any;
  let mockAlertCtrl: any;

  const mockOpponent: OpponentWithStats = {
    id: 'opp-1',
    teamId: 'team-123',
    name: 'Thunder FC',
    coachName: 'Coach Dave',
    contactInfo: '555-1234',
    primaryColor: 'Navy',
    secondaryColor: 'White',
    formation: '4-3-3',
    threatLevel: 'high',
    tendencies: 'High pressing in first half',
    notes: 'Very fast wingers',
    dangerPlayers: [
      {
        id: 'dp-1',
        jerseyNumber: 10,
        name: 'Lucas',
        position: 'Forward',
        threatLevel: 'high',
        notes: 'Pacey left winger',
        tags: ['Left-Footed', 'Fast'],
      },
    ],
    scoutingNotes: [
      {
        id: 'note-1',
        date: '2026-08-01T00:00:00Z',
        authorName: 'Coach Mike',
        content: 'Vulnerable on set piece defending',
        tags: ['Set Pieces'],
      },
    ],
    headToHead: {
      totalGames: 2,
      wins: 1,
      draws: 0,
      losses: 1,
      winPercentage: 50,
      goalsFor: 4,
      goalsAgainst: 3,
      goalDifference: 1,
      avgGoalsFor: 2.0,
      avgGoalsAgainst: 1.5,
      cleanSheets: 1,
      homeRecord: { wins: 1, draws: 0, losses: 0, total: 1 },
      awayRecord: { wins: 0, draws: 0, losses: 1, total: 1 },
      lastPlayedDate: '2026-08-01T10:00:00Z',
    },
    recentMatches: [
      {
        id: 'match-1',
        scheduledAt: '2026-08-01T10:00:00Z',
        isHomeGame: true,
        location: 'Field 1',
        goalsFor: 3,
        goalsAgainst: 1,
        result: 'win',
        status: 'completed',
        seasonName: 'Fall 2026',
        leagueName: 'Premier League',
        notes: 'Great match',
      },
    ],
  };

  beforeEach(async () => {
    mockOpponentsService = {
      getOpponent: vi.fn().mockReturnValue(of(mockOpponent)),
      updateOpponent: vi.fn().mockReturnValue(of(mockOpponent)),
      deleteOpponent: vi.fn().mockReturnValue(of(undefined)),
      addScoutingNote: vi.fn().mockReturnValue(
        of({
          id: 'new-note-id',
          date: '2026-08-13T00:00:00Z',
          content: 'New test observation',
          tags: [],
        }),
      ),
      deleteScoutingNote: vi.fn().mockReturnValue(of(undefined)),
    };

    mockModalCtrl = {
      create: vi.fn().mockResolvedValue({
        present: vi.fn().mockResolvedValue(undefined),
        onWillDismiss: vi.fn().mockResolvedValue({ data: null, role: 'cancel' }),
      }),
    };

    mockAlertCtrl = {
      create: vi.fn().mockResolvedValue({
        present: vi.fn().mockResolvedValue(undefined),
      }),
    };

    await TestBed.configureTestingModule({
      imports: [OpponentDetail],
      providers: [
        provideRouter([]),
        { provide: OpponentsService, useValue: mockOpponentsService },
        { provide: ModalController, useValue: mockModalCtrl },
        { provide: AlertController, useValue: mockAlertCtrl },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => {
                  if (key === 'id') return 'team-123';
                  if (key === 'opponentId') return 'opp-1';
                  return null;
                },
              },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OpponentDetail);
    component = fixture.componentInstance;
    component.id = 'team-123';
    component.opponentId = 'opp-1';
    fixture.detectChanges();
  });

  it('should create and load opponent dossier', () => {
    expect(component).toBeTruthy();
    expect(mockOpponentsService.getOpponent).toHaveBeenCalledWith('team-123', 'opp-1');
    expect((component as any).opponent()?.name).toBe('Thunder FC');
    expect((component as any).opponent()?.headToHead.totalGames).toBe(2);
  });

  it('should open edit modal', async () => {
    await (component as any).openEditModal();
    expect(mockModalCtrl.create).toHaveBeenCalled();
  });

  it('should add a scouting note', async () => {
    (component as any).newScoutingNoteContent.set('New test observation');
    await (component as any).addScoutingNote();
    expect(mockOpponentsService.addScoutingNote).toHaveBeenCalledWith('team-123', 'opp-1', {
      content: 'New test observation',
    });
    expect((component as any).newScoutingNoteContent()).toBe('');
  });

  it('should delete a scouting note', async () => {
    await (component as any).deleteScoutingNote('note-1');
    expect(mockOpponentsService.deleteScoutingNote).toHaveBeenCalledWith('team-123', 'opp-1', 'note-1');
  });

  it('should open add dangerous player modal', async () => {
    await (component as any).openAddDangerPlayerModal();
    expect(mockModalCtrl.create).toHaveBeenCalled();
  });
});
