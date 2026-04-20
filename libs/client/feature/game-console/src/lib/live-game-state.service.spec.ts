import { TestBed } from '@angular/core/testing';
import { LiveGameStateService, LineupEntry } from './live-game-state.service';
import { describe, it, expect, beforeEach } from 'vitest';

describe('LiveGameStateService', () => {
  let service: LiveGameStateService;
  const eventId = 'event-123';
  const teamId = 'team-123';

  const mockLineup: LineupEntry[] = [
    {
      playerId: 'p1',
      player: { id: 'p1', firstName: 'P', lastName: '1', jerseyNumber: '1' } as any,
      status: 'starting',
      positionName: 'Forward',
      slotIndex: 0,
    },
    {
      playerId: 'p2',
      player: { id: 'p2', firstName: 'P', lastName: '2', jerseyNumber: '2' } as any,
      status: 'bench',
      positionName: null,
      slotIndex: null,
    },
    {
      playerId: 'p3',
      player: { id: 'p3', firstName: 'P', lastName: '3', jerseyNumber: '3' } as any,
      status: 'starting',
      positionName: 'Midfielder',
      slotIndex: 1,
    },
  ];

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(LiveGameStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with lineup and compute active/bench players with slots', () => {
    service.initialize(eventId, mockLineup, teamId);
    
    expect(service.activePlayers().length).toBe(2);
    
    const p1 = service.activePlayers().find(p => p.id === 'p1');
    expect(p1?.preferredPosition).toBe('Forward');
    expect((p1 as any).slotIndex).toBe(0);
    
    const p3 = service.activePlayers().find(p => p.id === 'p3');
    expect(p3?.preferredPosition).toBe('Midfielder');
    expect((p3 as any).slotIndex).toBe(1);
    
    expect(service.benchPlayers().length).toBe(1);
    expect(service.benchPlayers()[0].id).toBe('p2');
  });

  it('should update active/bench players when a SUB event is pushed, preserving slot', () => {
    service.initialize(eventId, mockLineup, teamId);
    
    const subEvent = {
      type: 'SUB',
      playerIdIn: 'p2',
      playerIdOut: 'p1',
      slotIndex: 0, // Injected to slot 0
      timestamp: Date.now(),
      minuteOccurred: 10,
    };
    
    service.pushEvent(subEvent);
    
    const p2Active = service.activePlayers().find(p => p.id === 'p2');
    expect(p2Active).toBeTruthy();
    expect((p2Active as any).slotIndex).toBe(0);
    expect(p2Active?.preferredPosition).toBe('Forward'); // Position from slot 0
    
    expect(service.activePlayers().find(p => p.id === 'p1')).toBeFalsy();
    expect(service.benchPlayers().find(p => p.id === 'p1')).toBeTruthy();
  });

  it('should handle POSITION_SWAP events', () => {
    service.initialize(eventId, mockLineup, teamId);
    
    // p1 is at slot 0 (Forward), p3 is at slot 1 (Midfielder)
    const swapEvent = {
      type: 'POSITION_SWAP',
      playerIdA: 'p1',
      playerIdB: 'p3',
      slotIndexA: 0,
      slotIndexB: 1,
      timestamp: Date.now(),
      minuteOccurred: 15,
    };
    
    service.pushEvent(swapEvent);
    
    const p1Active = service.activePlayers().find(p => p.id === 'p1');
    const p3Active = service.activePlayers().find(p => p.id === 'p3');
    
    expect((p1Active as any).slotIndex).toBe(1);
    expect(p1Active?.preferredPosition).toBe('Midfielder');
    
    expect((p3Active as any).slotIndex).toBe(0);
    expect(p3Active?.preferredPosition).toBe('Forward');
  });

  it('should undo a POSITION_SWAP and restore original slots', () => {
    service.initialize(eventId, mockLineup, teamId);
    
    const swapEvent = {
      type: 'POSITION_SWAP',
      playerIdA: 'p1',
      playerIdB: 'p3',
      slotIndexA: 0,
      slotIndexB: 1,
      timestamp: Date.now(),
      minuteOccurred: 15,
    };
    
    service.pushEvent(swapEvent);
    service.undo();
    
    const p1Active = service.activePlayers().find(p => p.id === 'p1');
    const p3Active = service.activePlayers().find(p => p.id === 'p3');
    
    expect((p1Active as any).slotIndex).toBe(0);
    expect(p1Active?.preferredPosition).toBe('Forward');
    expect((p3Active as any).slotIndex).toBe(1);
    expect(p3Active?.preferredPosition).toBe('Midfielder');
  });

  it('should restore state from localStorage on initialization', () => {
    const event = { type: 'GOAL', playerId: 'p1', timestamp: 1000 };
    localStorage.setItem(`event-logs-${eventId}`, JSON.stringify([event]));
    
    service.initialize(eventId, mockLineup, teamId);
    
    expect(service.events()).toEqual([event]);
  });
});
