import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VolleyballStatPadComponent } from './volleyball-stat-pad';
import { Player } from '@apex-team/shared/util/models';

describe('VolleyballStatPadComponent', () => {
  let component: VolleyballStatPadComponent;
  let fixture: ComponentFixture<VolleyballStatPadComponent>;

  const mockPlayer: Player = {
    id: 'p1',
    teamId: 't1',
    firstName: 'Jordan',
    lastName: 'Larson',
    jerseyNumber: 10,
    preferredPosition: 'Outside Hitter',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VolleyballStatPadComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(VolleyballStatPadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('Flow A: should immediately emit actionTriggered when player is selected and stat key is pressed', () => {
    fixture.componentRef.setInput('selectedPlayer', mockPlayer);
    fixture.detectChanges();

    const spy = vi.spyOn(component.actionTriggered, 'emit');

    // Tap KILL
    component.handleKeypadPress('KILL', 'KILL (+Pt)');
    expect(spy).toHaveBeenCalledWith({
      type: 'KILL',
      playerId: 'p1',
      payload: undefined,
    });

    // Tap Pass 3
    component.handleKeypadPress('SERVE_RECEIVE', 'Pass 3 (Perfect)', { score: 3 });
    expect(spy).toHaveBeenCalledWith({
      type: 'SERVE_RECEIVE',
      playerId: 'p1',
      payload: { score: 3 },
    });

    // Tap Overpass
    component.handleKeypadPress('SERVE_RECEIVE', 'Overpass', { score: 0, isOverpass: true, quality: 'OVERPASS' });
    expect(spy).toHaveBeenCalledWith({
      type: 'SERVE_RECEIVE',
      playerId: 'p1',
      payload: { score: 0, isOverpass: true, quality: 'OVERPASS' },
    });
  });

  it('Flow B: should arm stat when pressed without player, then fulfill when fulfillArmedStat is called', () => {
    fixture.componentRef.setInput('selectedPlayer', null);
    fixture.detectChanges();

    const armedSpy = vi.spyOn(component.armedStatChanged, 'emit');
    const actionSpy = vi.spyOn(component.actionTriggered, 'emit');

    // Press ACE
    component.handleKeypadPress('ACE', 'ACE (+Pt)');
    expect(component.armedStat()?.type).toBe('ACE');
    expect(armedSpy).toHaveBeenCalledWith('ACE');
    expect(actionSpy).not.toHaveBeenCalled();

    // Now player is selected/tapped
    const fulfilled = component.fulfillArmedStat(mockPlayer);
    expect(fulfilled).toBe(true);
    expect(actionSpy).toHaveBeenCalledWith({
      type: 'ACE',
      playerId: 'p1',
      payload: undefined,
    });
    expect(component.armedStat()).toBeNull();
  });

  it('should toggle off armed stat if pressed again', () => {
    component.handleKeypadPress('BLOCK', 'BLOCK (+Pt)');
    expect(component.armedStat()?.type).toBe('BLOCK');

    // Press again
    component.handleKeypadPress('BLOCK', 'BLOCK (+Pt)');
    expect(component.armedStat()).toBeNull();
  });

  it('should emit rotateClicked when Rotate button is clicked', () => {
    const spy = vi.spyOn(component.rotateClicked, 'emit');
    component.handleRotate();
    expect(spy).toHaveBeenCalled();
  });

  it('should emit addPointUs and addPointOpp', () => {
    const usSpy = vi.spyOn(component.addPointUs, 'emit');
    const oppSpy = vi.spyOn(component.addPointOpp, 'emit');

    component.handleAddPointUs();
    expect(usSpy).toHaveBeenCalled();

    component.handleAddPointOpp();
    expect(oppSpy).toHaveBeenCalled();
  });

  it('should emit quickLiberoSwap when Libero swap is clicked', () => {
    const spy = vi.spyOn(component.quickLiberoSwap, 'emit');
    component.handleQuickLiberoSwap();
    expect(spy).toHaveBeenCalled();
  });

  it('should emit undoClicked only when canUndo is true', () => {
    const spy = vi.spyOn(component.undoClicked, 'emit');

    fixture.componentRef.setInput('canUndo', true);
    fixture.detectChanges();
    component.handleUndo();
    expect(spy).toHaveBeenCalledTimes(1);

    fixture.componentRef.setInput('canUndo', false);
    fixture.detectChanges();
    component.handleUndo();
    expect(spy).toHaveBeenCalledTimes(1); // not called again
  });

  it('should emit subOffClicked when SUB_OFF is triggered with selected player', () => {
    fixture.componentRef.setInput('selectedPlayer', mockPlayer);
    fixture.detectChanges();

    const spy = vi.spyOn(component.subOffClicked, 'emit');
    component.handleKeypadPress('SUB_OFF', 'Sub Off to Bench');
    expect(spy).toHaveBeenCalledWith(mockPlayer);
  });

  it('should correctly distinguish armed Overpass vs armed Pass 0', () => {
    // Arm Overpass
    component.handleKeypadPress('SERVE_RECEIVE', 'Overpass', { score: 0, isOverpass: true, quality: 'OVERPASS' });
    expect(component.isStatArmed('SERVE_RECEIVE', { isOverpass: true })).toBe(true);
    expect(component.isStatArmed('SERVE_RECEIVE', { score: 0 })).toBe(false);

    // Disarm
    component.handleKeypadPress('SERVE_RECEIVE', 'Overpass', { score: 0, isOverpass: true, quality: 'OVERPASS' });
    expect(component.isStatArmed('SERVE_RECEIVE', { isOverpass: true })).toBe(false);

    // Arm Ace Against (score 0)
    component.handleKeypadPress('SERVE_RECEIVE', 'Pass 0 (Ace Against)', { score: 0 });
    expect(component.isStatArmed('SERVE_RECEIVE', { score: 0 })).toBe(true);
    expect(component.isStatArmed('SERVE_RECEIVE', { isOverpass: true })).toBe(false);
  });
});
