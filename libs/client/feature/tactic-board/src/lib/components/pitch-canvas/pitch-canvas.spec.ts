import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PitchCanvas } from './pitch-canvas';
import { describe, it, expect, beforeEach } from 'vitest';

describe('PitchCanvas', () => {
  let component: PitchCanvas;
  let fixture: ComponentFixture<PitchCanvas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PitchCanvas],
    }).compileComponents();

    fixture = TestBed.createComponent(PitchCanvas);
    component = fixture.componentInstance;
    component.sport = 'soccer';
    component.pitchType = 'full_pitch';
    component.tokens = [
      { id: '1', label: '10', team: 'home', x: 50, y: 50 },
    ];
    fixture.detectChanges();
  });

  it('should create the pitch canvas component', () => {
    expect(component).toBeTruthy();
  });

  it('should render soccer pitch SVG when sport is soccer', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.pitch-svg')).toBeTruthy();
  });

  it('should calculate SVG paths for drawings', () => {
    const drawing = {
      id: 'd1',
      tool: 'run' as const,
      points: [{ x: 10, y: 10 }, { x: 20, y: 20 }],
      color: '#ffffff',
      width: 2,
    };
    const path = component.getSvgPath(drawing);
    expect(path).toBe('M 10 10 L 20 20');
  });

  it('should calculate wavy paths for dribble drawings', () => {
    const drawing = {
      id: 'd2',
      tool: 'dribble' as const,
      points: [{ x: 10, y: 10 }, { x: 50, y: 50 }],
      color: '#facc15',
      width: 2,
    };
    const path = component.getSvgPath(drawing);
    expect(path).toContain('C');
  });

  it('should return matching marker url for colors', () => {
    expect(component.getMarkerUrl('#38bdf8')).toBe('url(#arrow-38bdf8)');
    expect(component.getMarkerUrl('#f87171')).toBe('url(#arrow-f87171)');
    expect(component.getMarkerUrl('')).toBe('url(#arrow-yellow)');
  });

  it('should not open edit modal on single click', () => {
    const token = component.tokens[0];
    const event = new MouseEvent('click');
    component.onTokenClick(event, token);
    expect(component.editingToken()).toBeNull();
    expect(component.selectedToken()?.id).toBe(token.id);
  });

  it('should open edit modal on double click', () => {
    const token = component.tokens[0];
    const event = new MouseEvent('dblclick');
    component.onTokenDblClick(event, token);
    expect(component.editingToken()?.id).toBe(token.id);
  });

  it('should open edit modal on right click (contextmenu)', () => {
    const token = component.tokens[0];
    const event = new MouseEvent('contextmenu');
    component.onTokenContextMenu(event, token);
    expect(component.editingToken()?.id).toBe(token.id);
  });
});
