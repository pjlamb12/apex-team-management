import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SoccerPitchViewComponent } from './soccer-pitch-view';
import { Player } from '@apex-team/shared/util/models';

describe('SoccerPitchViewComponent', () => {
  let component: SoccerPitchViewComponent;
  let fixture: ComponentFixture<SoccerPitchViewComponent>;

  const mockPlayers: Player[] = [
    { id: '1', teamId: 't1', firstName: 'John', lastName: 'Doe', jerseyNumber: 1, preferredPosition: 'Goalkeeper' },
    { id: '2', teamId: 't1', firstName: 'Jane', lastName: 'Smith', jerseyNumber: 4, preferredPosition: 'Defender' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SoccerPitchViewComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SoccerPitchViewComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('players', mockPlayers);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render all players', () => {
    const playerSlots = fixture.nativeElement.querySelectorAll('.player-slot');
    expect(playerSlots.length).toBe(mockPlayers.length);
  });

  it('should render players at slot-based coordinates', () => {
    const players = [
      { id: '1', teamId: 't1', firstName: 'P1', lastName: 'L1', jerseyNumber: 1, slotIndex: 0 }, // GK: 50, 90
      { id: '2', teamId: 't1', firstName: 'P2', lastName: 'L2', jerseyNumber: 10, slotIndex: 9 }, // Midfielder: 67.5, 44
    ];
    fixture.componentRef.setInput('players', players);
    fixture.detectChanges();

    const playerElements = fixture.nativeElement.querySelectorAll('.player-slot');
    
    // Check GK (Slot 0)
    const gk = Array.from(playerElements).find((el: any) => el.textContent.includes('L1')) as HTMLElement;
    expect(gk.style.left).toBe('50%');
    expect(gk.style.top).toBe('91%');

    // Check Midfielder (Slot 9)
    const lf = Array.from(playerElements).find((el: any) => el.textContent.includes('L2')) as HTMLElement;
    expect(lf.style.left).toBe('67.5%');
    expect(lf.style.top).toBe('44%');
  });

  it('should emit playerSelected when a player is clicked', () => {
    const spy = vi.spyOn(component.playerSelected, 'emit');
    const playerSlot = fixture.nativeElement.querySelector('.player-slot');
    playerSlot.click();
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({
      player: expect.objectContaining({ id: '1' }),
      event: expect.any(Object)
    }));
  });

  it('should highlight the selected player', () => {
    fixture.componentRef.setInput('selectedPlayerId', '1');
    fixture.detectChanges();
    const selectedSlot = fixture.nativeElement.querySelector('.player-slot.selected');
    expect(selectedSlot).toBeTruthy();
    expect(selectedSlot.textContent).toContain('1');
    expect(selectedSlot.textContent).toContain('Doe');
  });

  it('should render jersey number 0 correctly on the pitch', () => {
    const players = [
      { id: '3', teamId: 't1', firstName: 'Zero', lastName: 'Hero', jerseyNumber: 0, slotIndex: 1 },
    ];
    fixture.componentRef.setInput('players', players);
    fixture.detectChanges();
    const playerSlots = fixture.nativeElement.querySelectorAll('.player-slot');
    expect(playerSlots.length).toBe(1);
    expect(playerSlots[0].textContent).toContain('0');
    expect(playerSlots[0].textContent).not.toContain('?');
  });

  it('should render empty formation slots even when no player is selected', () => {
    fixture.componentRef.setInput('players', []);
    fixture.componentRef.setInput('selectedPlayerId', null);
    fixture.componentRef.setInput('formationSlots', [
      { slotIndex: 0, positionName: 'GK', playerId: null },
      { slotIndex: 2, positionName: 'DEF', playerId: null },
      { slotIndex: 7, positionName: 'MID', playerId: null },
    ]);
    fixture.detectChanges();

    const emptySlots = fixture.nativeElement.querySelectorAll('.empty-formation-slot');
    expect(emptySlots.length).toBe(3);
    expect(emptySlots[0].textContent).toContain('GK');
    expect(emptySlots[1].textContent).toContain('DEF');
    expect(emptySlots[2].textContent).toContain('MID');
  });

  it('should emit emptySlotSelected when empty formation slot is clicked', () => {
    const spy = vi.spyOn(component.emptySlotSelected, 'emit');
    fixture.componentRef.setInput('players', []);
    fixture.componentRef.setInput('formationSlots', [
      { slotIndex: 0, positionName: 'GK', playerId: null },
    ]);
    fixture.detectChanges();

    const emptySlot = fixture.nativeElement.querySelector('.empty-formation-slot');
    emptySlot.click();
    expect(spy).toHaveBeenCalledWith(0);
  });

  it('should render candidate slots when a player is selected', () => {
    fixture.componentRef.setInput('players', []);
    fixture.componentRef.setInput('selectedPlayerId', 'p1');
    fixture.componentRef.setInput('formationSlots', [
      { slotIndex: 0, positionName: 'GK', playerId: null },
    ]);
    fixture.detectChanges();

    const candidateSlots = fixture.nativeElement.querySelectorAll('.candidate-slot');
    // Total coordinates is 22, minus 1 formation slot = 21 candidate slots
    expect(candidateSlots.length).toBe(21);
  });

  it('should display preferredPosition when showPlaytime is false', () => {
    const players = [
      { id: '10', teamId: 't1', firstName: 'Paul', lastName: 'Pogba', jerseyNumber: 6, preferredPosition: 'MID', slotIndex: 7 },
    ];
    fixture.componentRef.setInput('players', players);
    fixture.componentRef.setInput('showPlaytime', false);
    fixture.detectChanges();

    const playerSlot = fixture.nativeElement.querySelector('.player-slot');
    expect(playerSlot.textContent).toContain('MID');
  });
});
