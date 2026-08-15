import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AwardBadgeModalComponent } from './award-badge-modal';
import { AwardsService, PlayersService } from '@apex-team/client/data-access/team';
import { ModalController } from '@ionic/angular/standalone';
import { RuntimeConfigLoaderService } from 'runtime-config-loader';
import { PlayerAward, Player, DEFAULT_BADGE_PRESETS } from '@apex-team/shared/util/models';

describe('AwardBadgeModalComponent', () => {
  let component: AwardBadgeModalComponent;
  let fixture: ComponentFixture<AwardBadgeModalComponent>;

  const mockPlayers: Player[] = [
    {
      id: 'p1',
      teamId: 'team-123',
      firstName: 'Lucas',
      lastName: 'Silva',
      jerseyNumber: 10,
      preferredPosition: 'CM',
      isActive: true,
      isGuest: false,
    },
    {
      id: 'p2',
      teamId: 'team-123',
      firstName: 'Alex',
      lastName: 'Morgan',
      jerseyNumber: 13,
      preferredPosition: 'ST',
      isActive: true,
      isGuest: false,
    },
  ];

  const mockAwards: PlayerAward[] = [
    {
      id: 'a1',
      teamId: 'team-123',
      playerId: 'p1',
      eventId: 'event-456',
      badgeType: 'player_of_the_match',
      title: 'Player of the Match',
      category: 'mvp',
      icon: 'star-outline',
      color: 'amber',
      notes: 'Outstanding leadership and game-winning goal',
      awardedAt: new Date().toISOString(),
      player: {
        id: 'p1',
        firstName: 'Lucas',
        lastName: 'Silva',
        jerseyNumber: 10,
      },
    },
  ];

  const mockAwardsService = {
    getEventAwards: vi.fn().mockReturnValue(of(mockAwards)),
    createAward: vi.fn().mockReturnValue(
      of({
        id: 'a2',
        teamId: 'team-123',
        playerId: 'p2',
        eventId: 'event-456',
        badgeType: 'iron_defender',
        title: 'Iron Defender',
        category: 'defense',
        icon: 'shield-outline',
        color: 'blue',
        notes: 'Lockdown defending',
        awardedAt: new Date().toISOString(),
        player: {
          id: 'p2',
          firstName: 'Alex',
          lastName: 'Morgan',
          jerseyNumber: 13,
        },
      }),
    ),
    deleteAward: vi.fn().mockReturnValue(of(undefined)),
  };

  const mockPlayersService = {
    getPlayers: vi.fn().mockReturnValue(of(mockPlayers)),
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
      imports: [AwardBadgeModalComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AwardsService, useValue: mockAwardsService },
        { provide: PlayersService, useValue: mockPlayersService },
        { provide: ModalController, useValue: mockModalCtrl },
        { provide: RuntimeConfigLoaderService, useValue: mockRuntimeConfig },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AwardBadgeModalComponent);
    component = fixture.componentInstance;
    component.teamId = 'team-123';
    component.eventId = 'event-456';
    fixture.detectChanges();
  });

  it('should create the component and load active players and awards', () => {
    expect(component).toBeTruthy();
    expect(mockPlayersService.getPlayers).toHaveBeenCalledWith('team-123');
    expect(mockAwardsService.getEventAwards).toHaveBeenCalledWith('team-123', 'event-456');
    expect((component as any).players()).toHaveLength(2);
    expect((component as any).eventAwards()).toHaveLength(1);
  });

  it('should select player and badge definition', () => {
    (component as any).selectPlayer('p2');
    expect((component as any).selectedPlayerId()).toBe('p2');

    const ironDefender = DEFAULT_BADGE_PRESETS.find((b) => b.type === 'iron_defender')!;
    (component as any).selectBadge(ironDefender);
    expect((component as any).selectedBadge().type).toBe('iron_defender');
  });

  it('should submit award and prepend to eventAwards list', async () => {
    (component as any).selectPlayer('p2');
    (component as any).selectBadge(DEFAULT_BADGE_PRESETS[1]);
    (component as any).coachNotes.set('Lockdown defending');

    await (component as any).submitAward();

    expect(mockAwardsService.createAward).toHaveBeenCalledWith('team-123', expect.objectContaining({
      playerId: 'p2',
      eventId: 'event-456',
      badgeType: 'iron_defender',
      notes: 'Lockdown defending',
    }));
    expect((component as any).eventAwards()).toHaveLength(2);
  });

  it('should delete award and filter from eventAwards list', async () => {
    await (component as any).deleteAward('a1');
    expect(mockAwardsService.deleteAward).toHaveBeenCalledWith('team-123', 'a1');
    expect((component as any).eventAwards()).toHaveLength(0);
  });

  it('should dismiss modal when dismiss is called', () => {
    (component as any).dismiss();
    expect(mockModalCtrl.dismiss).toHaveBeenCalled();
  });
});
