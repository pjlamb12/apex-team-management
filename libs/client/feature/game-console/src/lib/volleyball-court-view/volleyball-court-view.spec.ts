import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VolleyballCourtViewComponent } from './volleyball-court-view';
import { Player } from '@apex-team/shared/util/models';

describe('VolleyballCourtViewComponent', () => {
  let component: VolleyballCourtViewComponent;
  let fixture: ComponentFixture<VolleyballCourtViewComponent>;

  const mockPlayers: Player[] = [
    { id: '1', teamId: 't1', firstName: 'John', lastName: 'Doe', jerseyNumber: 10, preferredPosition: 'Setter' },
    { id: '2', teamId: 't1', firstName: 'Jane', lastName: 'Smith', jerseyNumber: 4, preferredPosition: 'Outside Hitter' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VolleyballCourtViewComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(VolleyballCourtViewComponent);
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

  it('should render players at zone-based coordinates', () => {
    const players = [
      { id: '1', teamId: 't1', firstName: 'P1', lastName: 'L1', jerseyNumber: 10, slotIndex: 0 }, // Zone 1: 75, 75
      { id: '2', teamId: 't1', firstName: 'P2', lastName: 'L2', jerseyNumber: 4, slotIndex: 2 },  // Zone 3: 50, 35
    ];
    fixture.componentRef.setInput('players', players);
    fixture.detectChanges();

    const playerElements = fixture.nativeElement.querySelectorAll('.player-slot');
    
    // Check Zone 1 (Slot 0)
    const z1 = Array.from(playerElements).find((el: any) => el.textContent.includes('L1')) as HTMLElement;
    expect(z1.style.left).toBe('75%');
    expect(z1.style.top).toBe('75%');

    // Check Zone 3 (Slot 2)
    const z3 = Array.from(playerElements).find((el: any) => el.textContent.includes('L2')) as HTMLElement;
    expect(z3.style.left).toBe('50%');
    expect(z3.style.top).toBe('35%');
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
});
