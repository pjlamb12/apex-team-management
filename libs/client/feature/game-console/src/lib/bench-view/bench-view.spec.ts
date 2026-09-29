import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BenchViewComponent } from './bench-view';
import { Player } from '@apex-team/shared/util/models';

describe('BenchViewComponent', () => {
  let component: BenchViewComponent;
  let fixture: ComponentFixture<BenchViewComponent>;

  const mockPlayers: Player[] = [
    { id: '1', teamId: 't1', firstName: 'John', lastName: 'Doe', jerseyNumber: 10 },
    { id: '2', teamId: 't1', firstName: 'Jane', lastName: 'Smith', jerseyNumber: 22 },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BenchViewComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BenchViewComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('players', mockPlayers);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render all bench players', () => {
    const cards = fixture.nativeElement.querySelectorAll('ion-card');
    expect(cards.length).toBe(mockPlayers.length);
  });

  it('should emit playerSelected when a card is clicked', () => {
    const spy = vi.spyOn(component.playerSelected, 'emit');
    const card = fixture.nativeElement.querySelector('ion-card');
    card.click();
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({
      player: expect.objectContaining({ id: '1' }),
      event: expect.any(Object)
    }));
  });

  it('should highlight the selected player', () => {
    fixture.componentRef.setInput('selectedPlayerId', '2');
    fixture.detectChanges();
    const selectedAttribute = fixture.nativeElement.querySelector('ion-card.selected');
    expect(selectedAttribute).toBeTruthy();
    expect(selectedAttribute.textContent).toContain('22');
    expect(selectedAttribute.textContent).toContain('Smith');
  });

  it('should show Sub Off to Bench button and emit moveSelectedToBench when clicked', () => {
    const spy = vi.spyOn(component.moveSelectedToBench, 'emit');
    fixture.componentRef.setInput('selectedActivePlayer', mockPlayers[0]);
    fixture.detectChanges();

    const subOffBtn = fixture.nativeElement.querySelector('ion-button[color="warning"]');
    expect(subOffBtn).toBeTruthy();
    expect(subOffBtn.textContent).toContain('Sub Off to Bench');

    subOffBtn.click();
    expect(spy).toHaveBeenCalled();
  });
});
