import { TestBed } from '@angular/core/testing';
import { LiveClockService } from './live-clock.service';
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest';

describe('LiveClockService', () => {
  let service: LiveClockService;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({});
    service = TestBed.inject(LiveClockService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start at zero', () => {
    expect(service.elapsedMs()).toBe(0);
  });

  it('should track elapsed time when started', () => {
    service.start();
    vi.advanceTimersByTime(1000);
    expect(service.elapsedMs()).toBeGreaterThanOrEqual(1000);
    service.stop();
  });

  it('should pause when stopped', () => {
    service.start();
    vi.advanceTimersByTime(1000);
    service.stop();
    const pausedTime = service.elapsedMs();
    vi.advanceTimersByTime(1000);
    expect(service.elapsedMs()).toBe(pausedTime);
  });

  it('should resume from paused time', () => {
    service.start();
    vi.advanceTimersByTime(1000);
    service.stop();
    const pausedTime = service.elapsedMs();
    service.start();
    vi.advanceTimersByTime(1000);
    expect(service.elapsedMs()).toBeGreaterThanOrEqual(pausedTime + 1000);
    service.stop();
  });

  it('should reset to zero', () => {
    service.start();
    vi.advanceTimersByTime(1000);
    service.reset();
    expect(service.elapsedMs()).toBe(0);
  });
});
