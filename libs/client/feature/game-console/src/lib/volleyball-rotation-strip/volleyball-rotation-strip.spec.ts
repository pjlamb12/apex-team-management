import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VolleyballRotationStripComponent } from './volleyball-rotation-strip';
import { Player } from '@apex-team/shared/util/models';

describe('VolleyballRotationStripComponent', () => {
  let component: VolleyballRotationStripComponent;
  let fixture: ComponentFixture<VolleyballRotationStripComponent>;

  const mockPlayers: (Player & { slotIndex?: number; preferredPosition?: string })[] = [
    { id: 'p1', teamId: 't1', firstName: 'John', lastName: 'Server', jerseyNumber: 1, slotIndex: 0 },
    { id: 'p2', teamId: 't1', firstName: 'Jane', lastName: 'FrontRight', jerseyNumber: 2, slotIndex: 1 },
    { id: 'p3', teamId: 't1', firstName: 'Bob', lastName: 'Middle', jerseyNumber: 3, slotIndex: 2 },
    { id: 'p4', teamId: 't1', firstName: 'Alice', lastName: 'Outside', jerseyNumber: 4, slotIndex: 3 },
    { id: 'p5', teamId: 't1', firstName: 'Charlie', lastName: 'BackLeft', jerseyNumber: 5, slotIndex: 4 },
    { id: 'p6', teamId: 't1', firstName: 'Dave', lastName: 'BackMiddle', jerseyNumber: 6, slotIndex: 5 },
  ];

  const mockLibero: Player = {
    id: 'p-libero',
    teamId: 't1',
    firstName: 'Lucy',
    lastName: 'Libero',
    jerseyNumber: 99,
    preferredPosition: 'Libero',
  };

  const mockStats = {
    p1: { kills: 3, aces: 2, digs: 5, passCount: 4, passScoreSum: 10 }, // passAvg: 2.50
    p2: { kills: 8, aces: 0, digs: 2, passCount: 0, passScoreSum: 0 },  // passAvg: '-'
    'p-libero': { digs: 12, aces: 1, kills: 0, passCount: 8, passScoreSum: 22 }, // passAvg: 2.75
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VolleyballRotationStripComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(VolleyballRotationStripComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('activePlayers', mockPlayers);
    fixture.componentRef.setInput('playerStats', mockStats);
    fixture.componentRef.setInput('liberoPlayer', mockLibero);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render all 6 rotation zones and the Libero card', () => {
    const zoneCards = fixture.nativeElement.querySelectorAll('.zone-card');
    expect(zoneCards.length).toBe(6);

    const liberoCard = fixture.nativeElement.querySelector('.libero-card');
    expect(liberoCard).toBeTruthy();
    expect(liberoCard.textContent).toContain('L. Libero');
    expect(liberoCard.textContent).toContain('LIBERO');
  });

  it('should prominently highlight Zone 1 with the SERVER badge', () => {
    const zoneCards = fixture.nativeElement.querySelectorAll('.zone-card');
    const zone1 = zoneCards[0];
    expect(zone1.textContent).toContain('SERVER');
    expect(zone1.textContent).toContain('#1');
    expect(zone1.textContent).toContain('Server');
  });

  it('should display live stats including Kills, Aces, Digs, and Passing Average', () => {
    const zoneCards = fixture.nativeElement.querySelectorAll('.zone-card');
    const zone1 = zoneCards[0];
    expect(zone1.textContent).toContain('K:3');
    expect(zone1.textContent).toContain('A:2');
    expect(zone1.textContent).toContain('D:5');
    expect(zone1.textContent).toContain('P:2.50');
  });

  it('should emit playerSelected when a zone card is clicked', () => {
    const spy = vi.spyOn(component.playerSelected, 'emit');
    const zoneCards = fixture.nativeElement.querySelectorAll('.zone-card');
    zoneCards[0].click();
    expect(spy).toHaveBeenCalledWith(mockPlayers[0]);
  });

  it('should emit playerSelected when the Libero card is clicked', () => {
    const spy = vi.spyOn(component.playerSelected, 'emit');
    const liberoCard = fixture.nativeElement.querySelector('.libero-card');
    liberoCard.click();
    expect(spy).toHaveBeenCalledWith(mockLibero);
  });

  it('should render empty slot card and emit emptySlotClicked when tapped', () => {
    const spy = vi.spyOn(component.emptySlotClicked, 'emit');
    // Provide only 5 players, leaving slot 5 empty
    fixture.componentRef.setInput('activePlayers', mockPlayers.slice(0, 5));
    fixture.detectChanges();

    const emptyCard = fixture.nativeElement.querySelector('.empty-card');
    expect(emptyCard).toBeTruthy();
    expect(emptyCard.textContent).toContain('Z6 Sub In');

    emptyCard.click();
    expect(spy).toHaveBeenCalledWith(5);
  });

  it('should not render embedded swap in/out buttons on player cards', () => {
    const buttons = fixture.nativeElement.querySelectorAll('.zone-card button, .libero-card button');
    expect(buttons.length).toBe(0);
  });

  it('should not duplicate Libero when Libero is on court and show replaced player in 7th card', () => {
    // Put Libero in slot 5 (Zone 6)
    const onCourtWithLibero = [
      ...mockPlayers.slice(0, 5),
      { ...mockLibero, slotIndex: 5 },
    ];
    fixture.componentRef.setInput('activePlayers', onCourtWithLibero);
    fixture.componentRef.setInput('isLiberoOnCourt', true);
    fixture.componentRef.setInput('replacedPlayer', mockPlayers[5]);
    fixture.detectChanges();

    const zoneCards = fixture.nativeElement.querySelectorAll('.zone-card');
    const zone6 = zoneCards[5];
    expect(zone6.textContent).toContain('L. Libero');
    expect(zone6.textContent).toContain('LIBERO');

    // 7th card should display the replaced player, NOT a duplicate Libero
    const seventhCard = fixture.nativeElement.querySelector('.libero-card');
    expect(seventhCard).toBeTruthy();
    expect(seventhCard.textContent).toContain('D. BackMiddle');
    expect(seventhCard.textContent).toContain('REPLACED');
    expect(seventhCard.textContent).not.toContain('L. Libero');
  });

  it('should hide 7th card if Libero is on court and no replaced player is provided', () => {
    const onCourtWithLibero = [
      ...mockPlayers.slice(0, 5),
      { ...mockLibero, slotIndex: 5 },
    ];
    fixture.componentRef.setInput('activePlayers', onCourtWithLibero);
    fixture.componentRef.setInput('isLiberoOnCourt', true);
    fixture.componentRef.setInput('replacedPlayer', null);
    fixture.detectChanges();

    const seventhCard = fixture.nativeElement.querySelector('.libero-card');
    expect(seventhCard).toBeNull();
  });
});
