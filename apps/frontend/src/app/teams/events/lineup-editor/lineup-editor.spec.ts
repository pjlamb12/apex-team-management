import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { LineupEditor } from './lineup-editor';
import { EventsService, TeamService, PlayersService, AttendanceService, OpponentsService } from '@apex-team/client/data-access/team';
import { RuntimeConfigLoaderService } from 'runtime-config-loader';
import { ToastController } from '@ionic/angular/standalone';

describe('LineupEditor Pitch Layout Slot Assignment', () => {
  let component: LineupEditor;
  let fixture: ComponentFixture<LineupEditor>;

  beforeEach(async () => {
    const mockRuntimeConfig = {
      getConfigObjectKey: vi.fn().mockReturnValue('http://api.test'),
    };

    const mockEventsService = {
      getEvent: vi.fn().mockReturnValue(of({ id: 'e1', seasonId: 's1', playersOnField: 9 })),
      getLineup: vi.fn().mockReturnValue(of([
        { id: 'l1', eventId: 'e1', playerId: 'p1', slotIndex: 0, status: 'starting', positionName: 'GK', player: { id: 'p1', firstName: 'Goal', lastName: 'Keeper', jerseyNumber: 1 } },
        { id: 'l2', eventId: 'e1', playerId: 'p2', slotIndex: 2, status: 'starting', positionName: 'DEF', player: { id: 'p2', firstName: 'Def', lastName: 'One', jerseyNumber: 2 } },
        { id: 'l3', eventId: 'e1', playerId: 'p3', slotIndex: 3, status: 'starting', positionName: 'DEF', player: { id: 'p3', firstName: 'Def', lastName: 'Two', jerseyNumber: 3 } },
        { id: 'l4', eventId: 'e1', playerId: 'p4', slotIndex: 4, status: 'starting', positionName: 'DEF', player: { id: 'p4', firstName: 'Def', lastName: 'Three', jerseyNumber: 4 } },
        { id: 'l5', eventId: 'e1', playerId: 'p5', slotIndex: 7, status: 'starting', positionName: 'MID', player: { id: 'p5', firstName: 'Mid', lastName: 'One', jerseyNumber: 5 } },
        { id: 'l6', eventId: 'e1', playerId: 'p6', slotIndex: 8, status: 'starting', positionName: 'MID', player: { id: 'p6', firstName: 'Mid', lastName: 'Two', jerseyNumber: 6 } },
        { id: 'l7', eventId: 'e1', playerId: 'p7', slotIndex: 9, status: 'starting', positionName: 'MID', player: { id: 'p7', firstName: 'Mid', lastName: 'Three', jerseyNumber: 7 } },
        { id: 'l8', eventId: 'e1', playerId: 'p8', slotIndex: 12, status: 'starting', positionName: 'FWD', player: { id: 'p8', firstName: 'Fwd', lastName: 'One', jerseyNumber: 8 } },
        { id: 'l9', eventId: 'e1', playerId: 'p9', slotIndex: 14, status: 'starting', positionName: 'FWD', player: { id: 'p9', firstName: 'Fwd', lastName: 'Two', jerseyNumber: 9 } },
      ])),
      getGameEvents: vi.fn().mockReturnValue(of([])),
      saveLineup: vi.fn().mockReturnValue(of([])),
    };

    const mockTeamService = {
      getTeam: vi.fn().mockReturnValue(Promise.resolve({ id: 't1', sport: { name: 'Soccer' } })),
    };

    const mockPlayersService = {
      getPlayersForSeason: vi.fn().mockReturnValue(of([
        { id: 'p1', firstName: 'Goal', lastName: 'Keeper', jerseyNumber: 1, isActive: true },
        { id: 'p2', firstName: 'Def', lastName: 'One', jerseyNumber: 2, isActive: true },
        { id: 'p3', firstName: 'Def', lastName: 'Two', jerseyNumber: 3, isActive: true },
        { id: 'p4', firstName: 'Def', lastName: 'Three', jerseyNumber: 4, isActive: true },
        { id: 'p5', firstName: 'Mid', lastName: 'One', jerseyNumber: 5, isActive: true },
        { id: 'p6', firstName: 'Mid', lastName: 'Two', jerseyNumber: 6, isActive: true },
        { id: 'p7', firstName: 'Mid', lastName: 'Three', jerseyNumber: 7, isActive: true },
        { id: 'p8', firstName: 'Fwd', lastName: 'One', jerseyNumber: 8, isActive: true },
        { id: 'p9', firstName: 'Fwd', lastName: 'Two', jerseyNumber: 9, isActive: true },
        { id: 'p10', firstName: 'Bench', lastName: 'Player', jerseyNumber: 10, isActive: true },
      ])),
      getPlayers: vi.fn().mockReturnValue(of([])),
      getGuestPlayersForLeague: vi.fn().mockReturnValue(of([])),
    };

    const mockAttendanceService = {
      getAttendance: vi.fn().mockReturnValue(of([])),
    };

    const mockOpponentsService = {
      getOpponents: vi.fn().mockReturnValue(of([])),
    };

    await TestBed.configureTestingModule({
      imports: [LineupEditor],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        ToastController,
        { provide: RuntimeConfigLoaderService, useValue: mockRuntimeConfig },
        { provide: EventsService, useValue: mockEventsService },
        { provide: TeamService, useValue: mockTeamService },
        { provide: PlayersService, useValue: mockPlayersService },
        { provide: AttendanceService, useValue: mockAttendanceService },
        { provide: OpponentsService, useValue: mockOpponentsService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LineupEditor);
    component = fixture.componentInstance;
    component.id = 't1';
    component.eventId = 'e1';
    fixture.detectChanges();
  });

  it('should allow moving a starting forward (p9 at slot 14) to a 4th midfielder position (slot 6) without disappearing', async () => {
    await fixture.whenStable();

    // Select forward p9 (currently at slot 14)
    component['selectedPlayerId'].set('p9');

    // Click plus icon for empty slot 6 (MID row)
    component['handlePitchEmptySlotSelected'](6);

    const slots = component['slots']();
    const p9Slot = slots.find(s => s.playerId === 'p9');

    expect(p9Slot).toBeDefined();
    expect(p9Slot?.slotIndex).toBe(6);
    expect(p9Slot?.positionName).toBe('MID');
    expect(p9Slot?.playerId).toBe('p9');
  });

  it('should allow placing a bench player (p10) into an empty starting spot at slot 6', async () => {
    await fixture.whenStable();

    // Clear slot 14 (now 8 players starting, 1 empty spot)
    component['slots'].update(slots => slots.map(s => s.slotIndex === 14 ? { ...s, playerId: null } : s));

    // Select bench player p10
    component['selectedPlayerId'].set('p10');

    // Click plus icon for empty slot 6
    component['handlePitchEmptySlotSelected'](6);

    const slots = component['slots']();
    const p10Slot = slots.find(s => s.playerId === 'p10');

    expect(p10Slot).toBeDefined();
    expect(p10Slot?.slotIndex).toBe(6);
    expect(p10Slot?.positionName).toBe('MID');
    expect(p10Slot?.playerId).toBe('p10');
  });
});
