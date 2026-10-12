import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClockDisplayComponent } from './clock-display';
import { LiveClockService } from '../live-clock.service';
import { LiveGameStateService } from '../live-game-state.service';
import { signal } from '@angular/core';

describe('ClockDisplayComponent', () => {
  let component: ClockDisplayComponent;
  let fixture: ComponentFixture<ClockDisplayComponent>;
  let clockServiceMock: any;
  let stateServiceMock: any;

  beforeEach(async () => {
    clockServiceMock = {
      elapsedMs: signal(0),
    };
    stateServiceMock = {
      currentPeriod: signal(1),
      sportName: signal('Soccer'),
      periodLengthMinutes: signal(45),
    };

    await TestBed.configureTestingModule({
      imports: [ClockDisplayComponent],
      providers: [
        { provide: LiveClockService, useValue: clockServiceMock },
        { provide: LiveGameStateService, useValue: stateServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ClockDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display 00:00 when elapsed is 0 for soccer (count up)', () => {
    clockServiceMock.elapsedMs.set(0);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('00:00');
    expect(compiled.textContent).toContain('P1');
  });

  it('should format minutes and seconds correctly for count-up', () => {
    // 1 minute and 5 seconds = 65000ms
    clockServiceMock.elapsedMs.set(65000);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('01:05');
  });

  it('should display hours when elapsed is more than 1 hour', () => {
    // 1 hour, 2 minutes, 3 seconds = 3723000ms
    clockServiceMock.elapsedMs.set(3723000);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('01:02:03');
  });

  it('should countdown from period length for basketball and display Q1 label', () => {
    stateServiceMock.sportName.set('Basketball');
    stateServiceMock.periodLengthMinutes.set(8);
    stateServiceMock.currentPeriod.set(1);
    clockServiceMock.elapsedMs.set(0);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('08:00');
    expect(compiled.textContent).toContain('Q1');

    // 1 minute elapsed -> 7 minutes remaining (07:00)
    clockServiceMock.elapsedMs.set(60000);
    fixture.detectChanges();
    expect(compiled.textContent).toContain('07:00');

    // 7 mins 30s elapsed -> 30s remaining (00:30)
    clockServiceMock.elapsedMs.set(450000);
    fixture.detectChanges();
    expect(compiled.textContent).toContain('00:30');

    // 8 mins elapsed -> 00:00
    clockServiceMock.elapsedMs.set(480000);
    fixture.detectChanges();
    expect(compiled.textContent).toContain('00:00');
  });
});
