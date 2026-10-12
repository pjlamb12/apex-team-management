import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { RapidActionKeypadComponent, KeypadActionPayload } from './rapid-action-keypad';
import { Player } from '@apex-team/shared/util/models';

describe('RapidActionKeypadComponent', () => {
  let component: RapidActionKeypadComponent;
  let fixture: ComponentFixture<RapidActionKeypadComponent>;

  const mockPlayer: Player = {
    id: 'p1',
    firstName: 'Steph',
    lastName: 'Curry',
    jerseyNumber: 30,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RapidActionKeypadComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RapidActionKeypadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('Flow A: should immediately emit actionTriggered if a player is selected', () => {
    fixture.componentRef.setInput('selectedPlayer', mockPlayer);
    fixture.detectChanges();

    const emitted: KeypadActionPayload[] = [];
    component.actionTriggered.subscribe((a) => emitted.push(a));

    component.handleKeypadPress('MADE_2PT');

    expect(emitted.length).toBe(1);
    expect(emitted[0].type).toBe('MADE_2PT');
    expect(emitted[0].playerId).toBe('p1');
    expect(component.armedStat()).toBeNull();
  });

  it('Flow B: should arm stat if no player is selected, then fulfill when fulfillArmedStat is called', () => {
    fixture.componentRef.setInput('selectedPlayer', null);
    fixture.detectChanges();

    const emittedActions: KeypadActionPayload[] = [];
    component.actionTriggered.subscribe((a) => emittedActions.push(a));

    // Tap stat key without selected player
    component.handleKeypadPress('MADE_3PT');

    expect(component.armedStat()).toBe('MADE_3PT');
    expect(emittedActions.length).toBe(0);

    // Now coach taps a player
    const fulfilled = component.fulfillArmedStat(mockPlayer);
    expect(fulfilled).toBe(true);

    expect(emittedActions.length).toBe(1);
    expect(emittedActions[0].type).toBe('MADE_3PT');
    expect(emittedActions[0].playerId).toBe('p1');
    expect(component.armedStat()).toBeNull();
  });

  it('should cancel armed stat when clearArmedStat is called', () => {
    component.handleKeypadPress('REBOUND_DEFENSIVE');
    expect(component.armedStat()).toBe('REBOUND_DEFENSIVE');

    component.clearArmedStat();
    expect(component.armedStat()).toBeNull();
  });

  it('should emit subOffClicked when SUB_OFF is pressed with selected player', () => {
    fixture.componentRef.setInput('selectedPlayer', mockPlayer);
    fixture.detectChanges();

    const subsEmitted: Player[] = [];
    component.subOffClicked.subscribe((p) => subsEmitted.push(p));

    component.handleKeypadPress('SUB_OFF');

    expect(subsEmitted.length).toBe(1);
    expect(subsEmitted[0].id).toBe('p1');
  });

  it('should emit undoClicked when handleUndo is invoked and canUndo is true', () => {
    fixture.componentRef.setInput('canUndo', true);
    fixture.detectChanges();

    let undoEmitted = false;
    component.undoClicked.subscribe(() => {
      undoEmitted = true;
    });

    component.handleUndo();
    expect(undoEmitted).toBe(true);
  });

  it('should not emit undoClicked if canUndo is false', () => {
    fixture.componentRef.setInput('canUndo', false);
    fixture.detectChanges();

    let undoEmitted = false;
    component.undoClicked.subscribe(() => {
      undoEmitted = true;
    });

    component.handleUndo();
    expect(undoEmitted).toBe(false);
  });

  it('should emit playerDeselected and clear armed stat when handleDeselect is called', () => {
    component.handleKeypadPress('STEAL');
    expect(component.armedStat()).toBe('STEAL');

    let deselectedEmitted = false;
    component.playerDeselected.subscribe(() => {
      deselectedEmitted = true;
    });

    component.handleDeselect();
    expect(deselectedEmitted).toBe(true);
    expect(component.armedStat()).toBeNull();
  });
});
