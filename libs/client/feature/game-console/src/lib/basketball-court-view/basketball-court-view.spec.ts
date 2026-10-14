import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BasketballCourtViewComponent, ShotEventRecord, ShotLoggedPayload } from './basketball-court-view';
import { Player } from '@apex-team/shared/util/models';

describe('BasketballCourtViewComponent', () => {
  let component: BasketballCourtViewComponent;
  let fixture: ComponentFixture<BasketballCourtViewComponent>;

  const mockActivePlayers: (Player & { slotIndex?: number; preferredPosition?: string })[] = [
    { id: 'p1', firstName: 'Steph', lastName: 'Curry', jerseyNumber: 30, preferredPosition: 'PG', slotIndex: 0 },
    { id: 'p2', firstName: 'Klay', lastName: 'Thompson', jerseyNumber: 11, preferredPosition: 'SG', slotIndex: 1 },
    { id: 'p3', firstName: 'Jimmy', lastName: 'Butler', jerseyNumber: 22, preferredPosition: 'SF', slotIndex: 2 },
    { id: 'p4', firstName: 'Draymond', lastName: 'Green', jerseyNumber: 23, preferredPosition: 'PF', slotIndex: 3 },
    { id: 'p5', firstName: 'Bam', lastName: 'Adebayo', jerseyNumber: 13, preferredPosition: 'C', slotIndex: 4 },
  ];

  const mockShots: ShotEventRecord[] = [
    { id: 's1', type: 'MADE_3PT', playerId: 'p1', playerJersey: 30, x: 50, y: 65, distanceFeet: 23, period: 1 },
    { id: 's2', type: 'MISSED_3PT', playerId: 'p2', playerJersey: 11, x: 95, y: 15, distanceFeet: 22, period: 1 },
    { id: 's3', type: 'MADE_2PT', playerId: 'p5', playerJersey: 13, x: 50, y: 20, distanceFeet: 4, period: 2 },
    { id: 's4', type: 'MISSED_2PT', playerId: 'p4', playerJersey: 23, x: 30, y: 35, distanceFeet: 14, period: 2 },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BasketballCourtViewComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BasketballCourtViewComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('activePlayers', mockActivePlayers);
    fixture.componentRef.setInput('shots', mockShots);
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should display shot markers based on shots input', () => {
    const markers = fixture.nativeElement.querySelectorAll('.shot-marker');
    expect(markers.length).toBe(4);
  });

  it('should filter shots by makes and misses', () => {
    component['setFilter']('makes');
    fixture.detectChanges();
    let markers = fixture.nativeElement.querySelectorAll('.shot-marker');
    expect(markers.length).toBe(2);

    component['setFilter']('misses');
    fixture.detectChanges();
    markers = fixture.nativeElement.querySelectorAll('.shot-marker');
    expect(markers.length).toBe(2);

    component['setFilter']('all');
    fixture.detectChanges();
    markers = fixture.nativeElement.querySelectorAll('.shot-marker');
    expect(markers.length).toBe(4);
  });

  it('should update shot filter button active state and counts', () => {
    expect(component['allCount']()).toBe(4);
    expect(component['makesCount']()).toBe(2);
    expect(component['missesCount']()).toBe(2);

    component['setFilter']('makes');
    fixture.detectChanges();
    expect(component.shotFilter()).toBe('makes');

    component['setFilter']('misses');
    fixture.detectChanges();
    expect(component.shotFilter()).toBe('misses');
  });

  it('should filter shots by specific player', () => {
    component['togglePlayerFilter']('p1');
    fixture.detectChanges();
    const markers = fixture.nativeElement.querySelectorAll('.shot-marker');
    expect(markers.length).toBe(1);

    component['togglePlayerFilter']('p1'); // toggle off
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.shot-marker').length).toBe(4);
  });

  it('should default to active period when currentPeriod is set and clear on period advance', () => {
    // Set active period to Q1
    fixture.componentRef.setInput('currentPeriod', 1);
    fixture.detectChanges();

    expect(component.activePeriod()).toBe(1);
    let markers = fixture.nativeElement.querySelectorAll('.shot-marker');
    // Only s1 and s2 belong to Q1
    expect(markers.length).toBe(2);
    expect(component['allCount']()).toBe(2);

    // Advance period to Q2
    fixture.componentRef.setInput('currentPeriod', 2);
    fixture.detectChanges();

    expect(component.activePeriod()).toBe(2);
    markers = fixture.nativeElement.querySelectorAll('.shot-marker');
    // s3 and s4 belong to Q2
    expect(markers.length).toBe(2);
    expect(component['allCount']()).toBe(2);

    // Advance period to Q3 (no shots logged yet) -> court clears cleanly!
    fixture.componentRef.setInput('currentPeriod', 3);
    fixture.detectChanges();

    expect(component.activePeriod()).toBe(3);
    markers = fixture.nativeElement.querySelectorAll('.shot-marker');
    expect(markers.length).toBe(0);
    expect(component['allCount']()).toBe(0);
  });

  it('should allow toggling between periods courtside using setPeriod', () => {
    fixture.componentRef.setInput('currentPeriod', 2);
    fixture.detectChanges();

    // In Q2: shows 2 shots
    expect(component['filteredShots']().length).toBe(2);

    // Switch courtside to view Q1
    component.setPeriod(1);
    fixture.detectChanges();
    expect(component.activePeriod()).toBe(1);
    expect(component['filteredShots']().length).toBe(2);
    expect(component['filteredShots']()[0].id).toBe('s1');

    // Switch courtside to view All
    component.setPeriod('all');
    fixture.detectChanges();
    expect(component.activePeriod()).toBe('all');
    expect(component['filteredShots']().length).toBe(4);

    // Switch back to current period Q2
    component.setPeriod(2);
    fixture.detectChanges();
    expect(component.activePeriod()).toBe(2);
    expect(component['filteredShots']().length).toBe(2);
  });

  it('should render period pills for each period and all when showPeriodToggle is true', () => {
    fixture.componentRef.setInput('currentPeriod', 2);
    fixture.componentRef.setInput('showPeriodToggle', true);
    fixture.detectChanges();

    const pills = fixture.nativeElement.querySelectorAll('.period-pill');
    // Q1, Q2*, All -> 3 pills
    expect(pills.length).toBe(3);
    expect(pills[0].textContent.trim()).toBe('Q1');
    expect(pills[1].textContent.trim()).toBe('Q2*');
    expect(pills[2].textContent.trim()).toBe('All');
  });

  it('should not render period pills when showPeriodToggle is false (default)', () => {
    fixture.componentRef.setInput('currentPeriod', 2);
    fixture.detectChanges();

    const pills = fixture.nativeElement.querySelectorAll('.period-pill');
    expect(pills.length).toBe(0);
  });

  it('should not render court toggle button when showCourtToggle is false (default)', () => {
    const buttons = Array.from(fixture.nativeElement.querySelectorAll('ion-button')) as HTMLElement[];
    const courtToggle = buttons.find((b) => b.textContent?.includes('Court'));
    expect(courtToggle).toBeUndefined();
  });

  it('should render court toggle button when showCourtToggle is true', () => {
    fixture.componentRef.setInput('showCourtToggle', true);
    fixture.detectChanges();

    const buttons = Array.from(fixture.nativeElement.querySelectorAll('ion-button')) as HTMLElement[];
    const courtToggle = buttons.find((b) => b.textContent?.includes('Court'));
    expect(courtToggle).toBeDefined();
    expect(courtToggle?.textContent?.trim()).toBe('Half Court');
  });

  it('should open HUD with calculated 2PT for a touch inside the arc', () => {
    const container = component.courtSurface()?.nativeElement;
    expect(container).toBeDefined();

    vi.spyOn(container!, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      width: 500,
      height: 500,
      right: 500,
      bottom: 500,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    const mockEvent = new MouseEvent('click', { clientX: 250, clientY: 100 });
    component['handleCourtClick'](mockEvent);

    const activeTouch = component.activeTouch();
    expect(activeTouch).not.toBeNull();
    expect(activeTouch?.shotType).toBe('2PT');
    expect(activeTouch?.x).toBe(50);
    expect(activeTouch?.y).toBe(20);
  });

  it('should open HUD with calculated 3PT for a touch outside the arc', () => {
    const container = component.courtSurface()?.nativeElement;

    vi.spyOn(container!, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      width: 500,
      height: 500,
      right: 500,
      bottom: 500,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    const mockEvent = new MouseEvent('click', { clientX: 250, clientY: 350 });
    component['handleCourtClick'](mockEvent);

    const activeTouch = component.activeTouch();
    expect(activeTouch).not.toBeNull();
    expect(activeTouch?.shotType).toBe('3PT');
  });

  it('should toggle between half court and full court', () => {
    expect(component.isHalfCourt()).toBe(true);
    expect(component.courtAspectRatio()).toBe('500 / 470');
    expect(component.courtViewBox()).toBe('0 0 500 470');

    component['toggleHalfCourt']();
    expect(component.isHalfCourt()).toBe(false);
    expect(component.courtAspectRatio()).toBe('500 / 940');
    expect(component.courtViewBox()).toBe('0 0 500 940');
  });

  it('should emit shotLogged when confirming a MADE 3PT shot', () => {
    const emittedShots: ShotLoggedPayload[] = [];
    component.shotLogged.subscribe((s) => emittedShots.push(s));

    component.activeTouch.set({
      x: 50,
      y: 70,
      pixelX: 250,
      pixelY: 350,
      shotType: '3PT',
      distanceFeet: 24,
      zone: 'arc_3',
      targetPlayerId: 'p1',
    });

    component['confirmShot'](true);

    expect(emittedShots.length).toBe(1);
    expect(emittedShots[0].type).toBe('MADE_3PT');
    expect(emittedShots[0].playerId).toBe('p1');
    expect(emittedShots[0].x).toBe(50);
    expect(emittedShots[0].y).toBe(70);
    expect(component.activeTouch()).toBeNull();
  });

  it('should emit shotLogged when confirming a MISSED 2PT shot with override', () => {
    const emittedShots: ShotLoggedPayload[] = [];
    component.shotLogged.subscribe((s) => emittedShots.push(s));

    component.activeTouch.set({
      x: 50,
      y: 70,
      pixelX: 250,
      pixelY: 350,
      shotType: '3PT',
      distanceFeet: 24,
      zone: 'arc_3',
      targetPlayerId: 'p2',
    });

    // Override to 2PT
    component['setShotTypeOverride']('2PT');
    component['confirmShot'](false);

    expect(emittedShots.length).toBe(1);
    expect(emittedShots[0].type).toBe('MISSED_2PT');
    expect(emittedShots[0].playerId).toBe('p2');
    expect(component.activeTouch()).toBeNull();
  });

  it('should dismiss HUD when dismissHud is called', () => {
    component.activeTouch.set({
      x: 50,
      y: 50,
      pixelX: 250,
      pixelY: 250,
      shotType: '2PT',
      distanceFeet: 15,
      zone: 'mid_range',
      targetPlayerId: 'p1',
    });

    component['dismissHud']();
    expect(component.activeTouch()).toBeNull();
  });

  it('should handle lineup mode empty slot click and player selection', () => {
    fixture.componentRef.setInput('isLineupMode', true);
    fixture.componentRef.setInput('formationSlots', [
      { slotIndex: 0, positionName: 'PG', playerId: null },
      { slotIndex: 1, positionName: 'SG', playerId: 'p2' },
    ]);
    fixture.detectChanges();

    const emptySlotsEmitted: number[] = [];
    component.emptySlotSelected.subscribe((s) => emptySlotsEmitted.push(s));

    const mockEvent = new MouseEvent('click');
    component['selectEmptySlot'](0, mockEvent);

    expect(emptySlotsEmitted).toEqual([0]);
  });

  it('should compute selectedShooter and update when setTargetPlayer is called', () => {
    component.activeTouch.set({
      x: 50,
      y: 50,
      pixelX: 250,
      pixelY: 250,
      shotType: '2PT',
      distanceFeet: 15,
      zone: 'mid_range',
      targetPlayerId: 'p1',
    });

    expect(component['selectedShooter']()?.id).toBe('p1');
    expect(component['selectedShooter']()?.jerseyNumber).toBe(30);

    component['setTargetPlayer']('p2');
    expect(component.activeTouch()?.targetPlayerId).toBe('p2');
    expect(component['selectedShooter']()?.id).toBe('p2');
    expect(component['selectedShooter']()?.jerseyNumber).toBe(11);
  });

  it('should calculate safe HUD transforms preventing boundary clipping across court zones', () => {
    // Near left edge (x < 18)
    component.activeTouch.set({
      x: 10,
      y: 20,
      pixelX: 50,
      pixelY: 100,
      shotType: '3PT',
      distanceFeet: 22,
      zone: 'corner_left',
    });
    expect(component['getHudTransform']()).toBe('translate(0%, 16px)');

    // Near right edge (x > 82)
    component.activeTouch.set({
      x: 90,
      y: 20,
      pixelX: 450,
      pixelY: 100,
      shotType: '3PT',
      distanceFeet: 22,
      zone: 'corner_right',
    });
    expect(component['getHudTransform']()).toBe('translate(-100%, 16px)');

    // Center court (x = 50, y = 60)
    component.activeTouch.set({
      x: 50,
      y: 60,
      pixelX: 250,
      pixelY: 300,
      shotType: '3PT',
      distanceFeet: 23,
      zone: 'top_arc',
    });
    expect(component['getHudTransform']()).toBe('translate(-50%, calc(-100% - 14px))');
  });
});
