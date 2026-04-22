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

  it('should track elapsed time when started', async () => {
    await service.start();
    vi.advanceTimersByTime(1000);
    expect(service.elapsedMs()).toBeGreaterThanOrEqual(1000);
    await service.stop();
  });

  it('should pause when stopped', async () => {
    await service.start();
    vi.advanceTimersByTime(1000);
    await service.stop();
    const pausedTime = service.elapsedMs();
    vi.advanceTimersByTime(1000);
    expect(service.elapsedMs()).toBe(pausedTime);
  });

  it('should resume from paused time', async () => {
    await service.start();
    vi.advanceTimersByTime(1000);
    await service.stop();
    const pausedTime = service.elapsedMs();
    await service.start();
    vi.advanceTimersByTime(1000);
    expect(service.elapsedMs()).toBeGreaterThanOrEqual(pausedTime + 1000);
    await service.stop();
  });

  it('should reset to zero', async () => {
    await service.start();
    vi.advanceTimersByTime(1000);
    await service.reset();
    expect(service.elapsedMs()).toBe(0);
  });
});
