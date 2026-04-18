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
