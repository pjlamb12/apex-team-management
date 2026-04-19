import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PlayerActionMenuComponent } from './player-action-menu';

describe('PlayerActionMenuComponent', () => {
  let component: PlayerActionMenuComponent;
  let fixture: ComponentFixture<PlayerActionMenuComponent>;

  const mockPlayer = {
    id: 'p1',
    teamId: 't1',
    firstName: 'John',
    lastName: 'Doe',
    jerseyNumber: 10,
  } as any;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayerActionMenuComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PlayerActionMenuComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('player', mockPlayer);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display player name in header', () => {
    const header = fixture.nativeElement.querySelector('ion-list-header');
    expect(header.textContent).toContain('John');
    expect(header.textContent).toContain('Doe');
  });

  it('should emit GOAL action when Goal item is clicked', () => {
    const spy = vi.spyOn(component.actionSelected, 'emit');
    component['selectAction']('GOAL');
    expect(spy).toHaveBeenCalledWith({ type: 'GOAL', playerId: 'p1' });
  });

  it('should emit ASSIST action when Assist item is clicked', () => {
    const spy = vi.spyOn(component.actionSelected, 'emit');
    component['selectAction']('ASSIST');
    expect(spy).toHaveBeenCalledWith({ type: 'ASSIST', playerId: 'p1' });
  });

  it('should emit YELLOW_CARD action when Yellow Card item is clicked', () => {
    const spy = vi.spyOn(component.actionSelected, 'emit');
    component['selectAction']('YELLOW_CARD');
    expect(spy).toHaveBeenCalledWith({ type: 'YELLOW_CARD', playerId: 'p1' });
  });

  it('should emit RED_CARD action when Red Card item is clicked', () => {
    const spy = vi.spyOn(component.actionSelected, 'emit');
    component['selectAction']('RED_CARD');
    expect(spy).toHaveBeenCalledWith({ type: 'RED_CARD', playerId: 'p1' });
  });
});
