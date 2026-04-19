import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EventLogViewComponent } from './event-log';
import { LiveGameStateService, LineupEntry } from '../live-game-state.service';
import { signal, NO_ERRORS_SCHEMA } from '@angular/core';

describe('EventLogViewComponent', () => {
  let component: EventLogViewComponent;
  let fixture: ComponentFixture<EventLogViewComponent>;
  let stateService: LiveGameStateService;

  const mockLineup: LineupEntry[] = [
    {
      playerId: 'p1',
      player: { id: 'p1', firstName: 'John', lastName: 'Doe', jerseyNumber: '10' } as any,
      status: 'starting',
      positionName: 'Forward',
    },
  ];

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [EventLogViewComponent],
      providers: [LiveGameStateService],
    })
      .overrideComponent(EventLogViewComponent, {
        set: { schemas: [NO_ERRORS_SCHEMA] },
      })
      .compileComponents();

    stateService = TestBed.inject(LiveGameStateService);
    stateService.initialize('game-123', mockLineup);

    fixture = TestBed.createComponent(EventLogViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show empty state when no events exist', () => {
    const emptyState = fixture.nativeElement.querySelector('.empty-state');
    expect(emptyState).toBeTruthy();
  });

  it('should display events from the state service', () => {
    stateService.pushEvent({
      type: 'GOAL',
      playerId: 'p1',
      minuteOccurred: 15,
      timestamp: Date.now(),
    });
    fixture.detectChanges();

    const items = fixture.nativeElement.querySelectorAll('ion-item');
    expect(items.length).toBe(1);
  });

  it('should call stateService.undo when undo button is clicked', () => {
    const spy = vi.spyOn(stateService, 'undo');
    stateService.pushEvent({
      type: 'GOAL',
      playerId: 'p1',
      minuteOccurred: 15,
      timestamp: Date.now(),
    });
    fixture.detectChanges();

    component['undo']();
    expect(spy).toHaveBeenCalled();
  });

  it('should display events in reverse chronological order (newest first)', () => {
    stateService.pushEvent({
      type: 'GOAL',
      playerId: 'p1',
      minuteOccurred: 5,
      timestamp: 1000,
    });
    stateService.pushEvent({
      type: 'ASSIST',
      playerId: 'p1',
      minuteOccurred: 10,
      timestamp: 2000,
    });
    fixture.detectChanges();

    const events = component['events']();
    expect(events[0].minuteOccurred).toBe(10);
    expect(events[1].minuteOccurred).toBe(5);
  });
});
