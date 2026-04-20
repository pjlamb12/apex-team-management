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
      { id: '2', teamId: 't1', firstName: 'P2', lastName: 'L2', jerseyNumber: 10, slotIndex: 9 }, // LF: 35, 20
    ];
    fixture.componentRef.setInput('players', players);
    fixture.detectChanges();

    const playerElements = fixture.nativeElement.querySelectorAll('.player-slot');
    
    // Check GK (Slot 0)
    const gk = Array.from(playerElements).find((el: any) => el.textContent.includes('L1')) as HTMLElement;
    expect(gk.style.left).toBe('50%');
    expect(gk.style.top).toBe('90%');

    // Check LF (Slot 9)
    const lf = Array.from(playerElements).find((el: any) => el.textContent.includes('L2')) as HTMLElement;
    expect(lf.style.left).toBe('35%');
    expect(lf.style.top).toBe('20%');
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
});
