import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { EventSyncService } from './event-sync.service';
import { LiveGameStateService } from './live-game-state.service';
import { RuntimeConfigLoaderService } from 'runtime-config-loader';
import { of } from 'rxjs';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('EventSyncService', () => {
  let service: EventSyncService;
  let stateService: LiveGameStateService;
  let httpMock: any;
  let configMock: any;

  beforeEach(() => {
    localStorage.clear();

    httpMock = {
      post: vi.fn().mockReturnValue(of({ id: 'server-event-1' })),
      delete: vi.fn().mockReturnValue(of(null)),
    };

    configMock = {
      getConfigObjectKey: vi.fn().mockReturnValue('http://api.test'),
    };

    TestBed.configureTestingModule({
      providers: [
        EventSyncService,
        LiveGameStateService,
        { provide: HttpClient, useValue: httpMock },
        { provide: RuntimeConfigLoaderService, useValue: configMock },
      ],
    });

    stateService = TestBed.inject(LiveGameStateService);
    stateService.initialize('event-123', [], 'team-123');

    service = TestBed.inject(EventSyncService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should POST to API when a SUB event is pushed with slotIndex', () => {
    const timestamp = Date.now();
    stateService.pushEvent({
      type: 'SUB',
      playerIdIn: 'p2',
      playerIdOut: 'p1',
      slotIndex: 0,
      minuteOccurred: 10,
      timestamp,
    });

    TestBed.flushEffects();

    expect(httpMock.post).toHaveBeenCalledWith(
      'http://api.test/teams/team-123/events/event-123/game-events',
      {
        eventType: 'SUB',
        minuteOccurred: 10,
        payload: {
          playerIdIn: 'p2',
          playerIdOut: 'p1',
          slotIndex: 0
        }
      }
    );
  });

  it('should POST to API when a POSITION_SWAP event is pushed', () => {
    const timestamp = Date.now();
    stateService.pushEvent({
      type: 'POSITION_SWAP',
      playerIdA: 'p1',
      playerIdB: 'p3',
      slotIndexA: 0,
      slotIndexB: 1,
      minuteOccurred: 15,
      timestamp,
    });

    TestBed.flushEffects();

    expect(httpMock.post).toHaveBeenCalledWith(
      'http://api.test/teams/team-123/events/event-123/game-events',
      {
        eventType: 'POSITION_SWAP',
        minuteOccurred: 15,
        payload: {
          playerIdA: 'p1',
          playerIdB: 'p3',
          slotIndexA: 0,
          slotIndexB: 1
        }
      }
    );
  });

  it('should mark event as synced after successful POST', () => {
    stateService.pushEvent({
      type: 'GOAL',
      playerId: 'p1',
      minuteOccurred: 15,
      timestamp: Date.now(),
    });

    TestBed.flushEffects();

    const events = stateService.events();
    expect(events[0].synced).toBe(true);
    expect(events[0].id).toBe('server-event-1');
  });

  it('should DELETE event on API when undo marks it as deleted after sync', () => {
    // Push an event and sync it to get a server ID
    stateService.pushEvent({
      type: 'GOAL',
      playerId: 'p1',
      minuteOccurred: 15,
      timestamp: Date.now(),
    });

    // Flush to trigger POST and get server ID assigned
    TestBed.flushEffects();

    // Undo marks event as deleted with synced: false
    stateService.undo();

    // Flush to trigger DELETE
    TestBed.flushEffects();

    expect(httpMock.delete).toHaveBeenCalledWith(
      'http://api.test/teams/team-123/events/event-123/game-events/server-event-1'
    );
  });

  it('should not double-sync an event that is already being synced', () => {
    stateService.pushEvent({
      type: 'GOAL',
      playerId: 'p1',
      minuteOccurred: 15,
      timestamp: Date.now(),
    });

    TestBed.flushEffects();
    // Flush effects again — should not POST a second time
    TestBed.flushEffects();

    expect(httpMock.post).toHaveBeenCalledTimes(1);
  });
});
