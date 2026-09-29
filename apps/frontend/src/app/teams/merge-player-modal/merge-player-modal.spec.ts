import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MergePlayerModal } from './merge-player-modal';
import { PlayersService, PlayerEntity } from '@apex-team/client/data-access/team';
import { ModalController } from '@ionic/angular/standalone';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('MergePlayerModal', () => {
  let component: MergePlayerModal;
  let fixture: ComponentFixture<MergePlayerModal>;
  let mockPlayersService: any;
  let mockModalCtrl: any;

  const mockRosterPlayers: PlayerEntity[] = [
    {
      id: 'p1',
      teamId: 'team-1',
      firstName: 'Gwen',
      lastName: 'Stacy',
      jerseyNumber: 10,
      isGuest: false,
      isActive: true,
    },
  ];

  const mockGuestPlayers: PlayerEntity[] = [
    {
      id: 'p2',
      teamId: 'team-1',
      firstName: 'Gwen',
      lastName: 'Guest',
      jerseyNumber: 10,
      isGuest: true,
      isActive: true,
    },
    {
      id: 'p3',
      teamId: 'team-1',
      firstName: 'Kobyn',
      lastName: 'Smith',
      jerseyNumber: 15,
      isGuest: true,
      isActive: true,
    },
  ];

  beforeEach(async () => {
    mockPlayersService = {
      getPlayers: vi.fn().mockReturnValue(of(mockRosterPlayers)),
      getGuestPlayers: vi.fn().mockReturnValue(of(mockGuestPlayers)),
      mergePlayers: vi.fn().mockReturnValue(of({ ...mockRosterPlayers[0] })),
    };

    mockModalCtrl = {
      dismiss: vi.fn().mockResolvedValue(true),
    };

    await TestBed.configureTestingModule({
      imports: [MergePlayerModal],
      providers: [
        { provide: PlayersService, useValue: mockPlayersService },
        { provide: ModalController, useValue: mockModalCtrl },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MergePlayerModal);
    component = fixture.componentInstance;
    component.teamId = 'team-1';
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should load regular and guest players on init', async () => {
    await component.ngOnInit();
    expect(mockPlayersService.getPlayers).toHaveBeenCalledWith('team-1', true);
    expect(mockPlayersService.getGuestPlayers).toHaveBeenCalledWith('team-1');
    expect((component as any).players().length).toBe(3);
  });

  it('should filter players by guests when filterMode is guests', async () => {
    await component.ngOnInit();
    (component as any).filterMode.set('guests');
    const filtered = (component as any).filteredPlayers();
    expect(filtered.length).toBe(2);
    expect(filtered.every((p: PlayerEntity) => p.isGuest)).toBe(true);
  });

  it('should swap target and source players', async () => {
    await component.ngOnInit();
    (component as any).targetPlayerId.set('p1');
    (component as any).sourcePlayerId.set('p2');

    (component as any).swapSelection();

    expect((component as any).targetPlayerId()).toBe('p2');
    expect((component as any).sourcePlayerId()).toBe('p1');
  });

  it('should execute merge successfully and dismiss', async () => {
    await component.ngOnInit();
    (component as any).targetPlayerId.set('p1');
    (component as any).sourcePlayerId.set('p2');

    await (component as any).executeMerge();

    expect(mockPlayersService.mergePlayers).toHaveBeenCalledWith('team-1', 'p1', 'p2');
    expect(mockModalCtrl.dismiss).toHaveBeenCalledWith(
      {
        merged: true,
        targetPlayerId: 'p1',
        sourcePlayerId: 'p2',
      },
      'confirm'
    );
  });

  it('should handle error when merge fails', async () => {
    mockPlayersService.mergePlayers.mockReturnValue(
      throwError(() => ({ error: { message: 'Database constraint failure' } }))
    );

    await component.ngOnInit();
    (component as any).targetPlayerId.set('p1');
    (component as any).sourcePlayerId.set('p2');

    await (component as any).executeMerge();

    expect((component as any).errorMessage()).toBe('Database constraint failure');
    expect(mockModalCtrl.dismiss).not.toHaveBeenCalled();
  });
});
