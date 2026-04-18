import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { LiveClockService } from './live-clock.service';

describe('LiveClockService', () => {
  let service: LiveClockService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LiveClockService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start at zero', () => {
    expect(service.elapsedMs()).toBe(0);
  });

  it('should track elapsed time when started', fakeAsync(() => {
    service.start();
    tick(1000);
    expect(service.elapsedMs()).toBeGreaterThanOrEqual(1000);
    service.stop();
  }));

  it('should pause when stopped', fakeAsync(() => {
    service.start();
    tick(1000);
    service.stop();
    const pausedTime = service.elapsedMs();
    tick(1000);
    expect(service.elapsedMs()).toBe(pausedTime);
  }));

  it('should resume from paused time', fakeAsync(() => {
    service.start();
    tick(1000);
    service.stop();
    const pausedTime = service.elapsedMs();
    service.start();
    tick(1000);
    expect(service.elapsedMs()).toBeGreaterThanOrEqual(pausedTime + 1000);
    service.stop();
  }));

  it('should reset to zero', fakeAsync(() => {
    service.start();
    tick(1000);
    service.reset();
    expect(service.elapsedMs()).toBe(0);
  }));
});
