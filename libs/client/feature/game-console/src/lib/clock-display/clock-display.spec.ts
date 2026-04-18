import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClockDisplayComponent } from './clock-display';
import { LiveClockService } from '../live-clock.service';
import { signal } from '@angular/core';

describe('ClockDisplayComponent', () => {
  let component: ClockDisplayComponent;
  let fixture: ComponentFixture<ClockDisplayComponent>;
  let clockServiceMock: any;

  beforeEach(async () => {
    clockServiceMock = {
      elapsedMs: signal(0),
    };

    await TestBed.configureTestingModule({
      imports: [ClockDisplayComponent],
      providers: [{ provide: LiveClockService, useValue: clockServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(ClockDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display 00:00 when elapsed is 0', () => {
    clockServiceMock.elapsedMs.set(0);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('00:00');
  });

  it('should format minutes and seconds correctly', () => {
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
});
