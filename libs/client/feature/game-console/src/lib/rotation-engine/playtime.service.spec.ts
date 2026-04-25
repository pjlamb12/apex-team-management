import { TestBed } from '@angular/core/testing';
import { PlaytimeService } from './playtime.service';
import { LiveGameStateService } from '../live-game-state.service';
import { LiveClockService } from '../live-clock.service';
import { signal } from '@angular/core';

describe('PlaytimeService', () => {
  let service: PlaytimeService;
  let mockStateService: any;
  let mockClockService: any;

  beforeEach(() => {
    mockStateService = {
      events: signal([]),
      initialLineup: signal([]),
    };

    mockClockService = {
      elapsedMs: signal(0),
    };

    TestBed.configureTestingModule({
      providers: [
        PlaytimeService,
        { provide: LiveGameStateService, useValue: mockStateService },
        { provide: LiveClockService, useValue: mockClockService },
      ],
    });

    service = TestBed.inject(PlaytimeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return 0 for everyone initially', () => {
    mockStateService.initialLineup.set([
      { playerId: 'p1', status: 'starting' },
      { playerId: 'p2', status: 'bench' },
    ]);
    
    const playtime = service.playtimeMap();
    expect(playtime['p1']).toBe(0);
    expect(playtime['p2']).toBe(0);
  });

  it('should track realtime for starters', () => {
    mockStateService.initialLineup.set([
      { playerId: 'p1', status: 'starting' },
    ]);
    
    mockClockService.elapsedMs.set(5000); // 5 seconds
    
    const playtime = service.playtimeMap();
    expect(playtime['p1']).toBe(5);
  });

  it('should handle sub in/out events', () => {
    mockStateService.initialLineup.set([
      { playerId: 'p1', status: 'starting' },
      { playerId: 'p2', status: 'bench' },
    ]);

    // Sub p1 out, p2 in at 10 seconds
    mockStateService.events.set([
      {
        type: 'SUB',
        playerIdOut: 'p1',
        playerIdIn: 'p2',
        gameTimeMs: 10000,
        status: 'active',
      },
    ]);

    mockClockService.elapsedMs.set(15000); // 15 seconds total

    const playtime = service.playtimeMap();
    expect(playtime['p1']).toBe(10); // 10s played before sub
    expect(playtime['p2']).toBe(5);  // 5s played since sub (15 - 10)
  });

  it('should handle period ends', () => {
    mockStateService.initialLineup.set([
      { playerId: 'p1', status: 'starting' },
    ]);

    // Period 1 ends at 45m (2700s)
    mockStateService.events.set([
      {
        type: 'PERIOD_END',
        gameTimeMs: 45 * 60 * 1000,
        status: 'active',
        period: 1,
      },
    ]);

    // Clock is at 5m in Period 2
    mockClockService.elapsedMs.set(5 * 60 * 1000);

    const playtime = service.playtimeMap();
    // 45m (P1) + 5m (P2) = 50m = 3000s
    expect(playtime['p1']).toBe(50 * 60);
  });

  it('should handle multiple sub stints', () => {
    mockStateService.initialLineup.set([
      { playerId: 'p1', status: 'starting' },
      { playerId: 'p2', status: 'bench' },
    ]);

    mockStateService.events.set([
      { type: 'SUB', playerIdOut: 'p1', playerIdIn: 'p2', gameTimeMs: 10000, status: 'active' }, // p1 plays 10s
      { type: 'SUB', playerIdOut: 'p2', playerIdIn: 'p1', gameTimeMs: 20000, status: 'active' }, // p2 plays 10s
    ]);

    mockClockService.elapsedMs.set(30000);

    const playtime = service.playtimeMap();
    expect(playtime['p1']).toBe(20); // 10s + (30-20)s
    expect(playtime['p2']).toBe(10); // 10s
  });

  it('should fall back to minuteOccurred if gameTimeMs is missing', () => {
    mockStateService.initialLineup.set([
      { playerId: 'p1', status: 'starting' },
      { playerId: 'p2', status: 'bench' },
    ]);

    mockStateService.events.set([
      { type: 'SUB', playerIdOut: 'p1', playerIdIn: 'p2', minuteOccurred: 2, status: 'active' }, // 2nd minute = 1:00 elapsed = 60s
    ]);

    mockClockService.elapsedMs.set(120000); // 2:00 elapsed

    const playtime = service.playtimeMap();
    expect(playtime['p1']).toBe(60); 
    expect(playtime['p2']).toBe(60);
  });
});
