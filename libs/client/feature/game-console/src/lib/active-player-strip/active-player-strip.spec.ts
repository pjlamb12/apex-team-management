import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { ActivePlayerStripComponent } from './active-player-strip';
import { Player } from '@apex-team/shared/util/models';

describe('ActivePlayerStripComponent', () => {
  let component: ActivePlayerStripComponent;
  let fixture: ComponentFixture<ActivePlayerStripComponent>;

  const mockActivePlayers: (Player & { slotIndex?: number; preferredPosition?: string })[] = [
    { id: 'p1', firstName: 'Steph', lastName: 'Curry', jerseyNumber: 30, preferredPosition: 'PG', slotIndex: 0 },
    { id: 'p2', firstName: 'Klay', lastName: 'Thompson', jerseyNumber: 11, preferredPosition: 'SG', slotIndex: 1 },
    { id: 'p3', firstName: 'Jimmy', lastName: 'Butler', jerseyNumber: 22, preferredPosition: 'SF', slotIndex: 2 },
    { id: 'p4', firstName: 'Draymond', lastName: 'Green', jerseyNumber: 23, preferredPosition: 'PF', slotIndex: 3 },
    { id: 'p5', firstName: 'Bam', lastName: 'Adebayo', jerseyNumber: 13, preferredPosition: 'C', slotIndex: 4 },
  ];

  const mockStats = {
    p1: { points: 18, fouls: 2 },
    p2: { points: 12, fouls: 1 },
    p3: { points: 15, fouls: 4 }, // 4 fouls = foul warning (foulLimit=5)
    p4: { points: 6, fouls: 5 },  // 5 fouls = fouled out
    p5: { points: 10, fouls: 0 },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActivePlayerStripComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ActivePlayerStripComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('activePlayers', mockActivePlayers);
    fixture.componentRef.setInput('playerStats', mockStats);
    fixture.componentRef.setInput('selectedPlayerId', 'p1');
    fixture.componentRef.setInput('foulLimit', 5);
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should render all 5 active player cards', () => {
    const cards = fixture.nativeElement.querySelectorAll('.player-card');
    expect(cards.length).toBe(5);
  });

  it('should display player points and foul counts', () => {
    expect(component['getPlayerPoints']('p1')).toBe(18);
    expect(component['getPlayerFouls']('p1')).toBe(2);
    expect(component['getPlayerPoints']('p3')).toBe(15);
    expect(component['getPlayerFouls']('p3')).toBe(4);
  });

  it('should flag foul warning at 4 fouls when foulLimit is 5', () => {
    expect(component['isFoulWarning']('p3')).toBe(true);
    expect(component['isFouledOut']('p3')).toBe(false);
  });

  it('should flag fouled out at 5 fouls when foulLimit is 5', () => {
    expect(component['isFouledOut']('p4')).toBe(true);
  });

  it('should emit playerSelected when a card is clicked', () => {
    const emitted: Player[] = [];
    component.playerSelected.subscribe((p) => emitted.push(p));

    const secondCard = fixture.nativeElement.querySelectorAll('.player-card')[1];
    secondCard.click();

    expect(emitted.length).toBe(1);
    expect(emitted[0].id).toBe('p2');
  });

  it('should highlight the currently selected player card', () => {
    const cards = fixture.nativeElement.querySelectorAll('.player-card');
    expect(cards[0].classList.contains('selected-card')).toBe(true);
    expect(cards[1].classList.contains('selected-card')).toBe(false);
  });

  it('should render empty slot cards and emit emptySlotClicked when under 5 players', () => {
    // Only 4 players active
    fixture.componentRef.setInput('activePlayers', mockActivePlayers.slice(0, 4));
    fixture.detectChanges();

    const emptyCards = fixture.nativeElement.querySelectorAll('.empty-card');
    expect(emptyCards.length).toBe(1);

    const emittedSlots: number[] = [];
    component.emptySlotClicked.subscribe((idx) => emittedSlots.push(idx));

    emptyCards[0].click();
    expect(emittedSlots.length).toBe(1);
    expect(emittedSlots[0]).toBe(4);
  });
});
