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

  it('should exclude stepped-away (isActive: false) players from benchPlayers', () => {
    const lineupWithInactive = [
      ...mockLineup,
      {
        playerId: 'p-inactive',
        player: { id: 'p-inactive', firstName: 'Inactive', lastName: 'Player', isActive: false },
        status: 'bench',
      },
    ];
    service.initialize(eventId, lineupWithInactive as any, teamId);

    expect(service.benchPlayers().find(p => p.id === 'p-inactive')).toBeUndefined();
    expect(service.benchPlayers().map(p => p.id)).toEqual(['p2']);
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
    
    expect(service.events()).toEqual([
      expect.objectContaining({
        type: 'GOAL',
        playerId: 'p1',
        timestamp: 1000
      })
    ]);
  });

  describe('Bulk push and staging', () => {
    beforeEach(() => {
      service.initialize(eventId, mockLineup, teamId);
    });

    it('should push multiple events in a single update', () => {
      const events = [
        { type: 'GOAL', playerId: 'p1', timestamp: Date.now(), minuteOccurred: 10 },
        { type: 'SUB', playerIdIn: 'p2', playerIdOut: 'p1', slotIndex: 0, timestamp: Date.now() + 1, minuteOccurred: 10 }
      ];

      service.pushEvents(events);

      expect(service.events().length).toBe(2);
      expect(service.events()[0].type).toBe('GOAL');
      expect(service.events()[1].type).toBe('SUB');
      expect(service.events()[0].status).toBe('active');
      expect(service.events()[1].status).toBe('active');
    });

    it('should stage a substitution', () => {
      service.stageSub('p2', 'p1');
      expect(service.stagedSubs()).toEqual([{ inPlayerId: 'p2', outPlayerId: 'p1' }]);
    });

    it('should enforce exclusivity when staging subs (one player per pair)', () => {
      // Stage (p2, p1)
      service.stageSub('p2', 'p1');
      expect(service.stagedSubs()).toEqual([{ inPlayerId: 'p2', outPlayerId: 'p1' }]);

      // New sub involving same 'in' player: stage (p2, p3) replaces (p2, p1)
      service.stageSub('p2', 'p3');
      expect(service.stagedSubs()).toEqual([{ inPlayerId: 'p2', outPlayerId: 'p3' }]);

      // New sub involving same 'out' player: stage (p4, p3) replaces (p2, p3)
      service.stageSub('p4', 'p3');
      expect(service.stagedSubs()).toEqual([{ inPlayerId: 'p4', outPlayerId: 'p3' }]);
    });

    it('should unstage a player', () => {
      service.stageSub('p2', 'p1');
      service.unstageSub('p1');
      expect(service.stagedSubs()).toEqual([]);
    });

    it('should clear staged subs', () => {
      service.stageSub('p2', 'p1');
      service.clearStagedSubs();
      expect(service.stagedSubs()).toEqual([]);
    });

    it('should calculate statsSummary, including goals in the shot count', () => {
      service.pushEvent({ type: 'SHOT', timestamp: Date.now(), minuteOccurred: 5 });
      service.pushEvent({ type: 'GOAL', timestamp: Date.now() + 1, minuteOccurred: 10, playerId: 'p1' });
      service.pushEvent({ type: 'CORNER_KICK', timestamp: Date.now() + 2, minuteOccurred: 12 });
      service.pushEvent({ type: 'OPPONENT_SHOT', timestamp: Date.now() + 3, minuteOccurred: 15 });
      service.pushEvent({ type: 'OPPONENT_GOAL', timestamp: Date.now() + 4, minuteOccurred: 20 });
      service.pushEvent({ type: 'OPPONENT_CORNER_KICK', timestamp: Date.now() + 5, minuteOccurred: 22 });
      service.pushEvent({ type: 'BLOCKED_SHOT', timestamp: Date.now() + 6, minuteOccurred: 25, playerId: 'p1' });
      service.pushEvent({ type: 'BLOCKED_PENALTY', timestamp: Date.now() + 7, minuteOccurred: 26, playerId: 'p1' });

      const summary = service.statsSummary();
      expect(summary.teamShots).toBe(2); // 1 SHOT + 1 GOAL
      expect(summary.opponentShots).toBe(2); // 1 OPPONENT_SHOT + 1 OPPONENT_GOAL
      expect(summary.teamCorners).toBe(1);
      expect(summary.opponentCorners).toBe(1);
      expect(summary.teamSaves).toBe(2); // 1 BLOCKED_SHOT + 1 BLOCKED_PENALTY
    });

    it('should calculate playerCardCounts and ejectedPlayerIds correctly and remove them from activePlayers', () => {
      // Setup lineup: player 1 and player 2 are starting
      const lineup: any[] = [
        { playerId: 'p1', player: { id: 'p1', firstName: 'P1', lastName: 'L1' }, status: 'starting', slotIndex: 1 },
        { playerId: 'p2', player: { id: 'p2', firstName: 'P2', lastName: 'L2' }, status: 'starting', slotIndex: 2 }
      ];
      service.initialize('event-123', lineup, 'team-123', 2);
      
      expect(service.activePlayers().length).toBe(2);
      
      // Push 1 yellow card for p1
      service.pushEvent({ type: 'YELLOW_CARD', timestamp: Date.now(), minuteOccurred: 5, playerId: 'p1' });
      expect(service.playerCardCounts()['p1'].yellow).toBe(1);
      expect(service.playerCardCounts()['p1'].red).toBe(false);
      expect(service.ejectedPlayerIds().has('p1')).toBe(false);
      expect(service.activePlayers().length).toBe(2);

      // Push 2nd yellow card for p1 -> ejected!
      service.pushEvent({ type: 'YELLOW_CARD', timestamp: Date.now() + 10, minuteOccurred: 10, playerId: 'p1' });
      expect(service.playerCardCounts()['p1'].yellow).toBe(2);
      expect(service.playerCardCounts()['p1'].red).toBe(true);
      expect(service.ejectedPlayerIds().has('p1')).toBe(true);
      
      // p1 should be removed from activePlayers automatically
      expect(service.activePlayers().map(p => p.id)).not.toContain('p1');
      expect(service.activePlayers().length).toBe(1);
      expect(service.benchPlayers().map(p => p.id)).toContain('p1');
    });

    it('should clean up staged subs if the outgoing player is no longer active or the incoming player is no longer on the bench', () => {
      const lineup: any[] = [
        { playerId: 'p1', player: { id: 'p1', firstName: 'P1', lastName: 'L1' }, status: 'starting', slotIndex: 1 },
        { playerId: 'p2', player: { id: 'p2', firstName: 'P2', lastName: 'L2' }, status: 'starting', slotIndex: 2 },
        { playerId: 'p3', player: { id: 'p3', firstName: 'P3', lastName: 'L3' }, status: 'bench' },
        { playerId: 'p4', player: { id: 'p4', firstName: 'P4', lastName: 'L4' }, status: 'bench' }
      ];
      service.initialize('event-123', lineup, 'team-123', 2);

      // p1 and p2 are active. p3 and p4 are bench.
      // Stage sub: p3 (bench) -> p1 (active)
      service.stageSub('p3', 'p1');
      expect(service.stagedSubs()).toEqual([{ inPlayerId: 'p3', outPlayerId: 'p1' }]);

      // Now sub out p1 using another sub event (simulating a remote sync or another sub)
      service.pushEvent({ type: 'SUB', playerIdIn: 'p4', playerIdOut: 'p1', slotIndex: 1, timestamp: Date.now(), minuteOccurred: 5 });
      
      // Since p1 is no longer active, the staged sub involving p1 as the outgoing player should be automatically cleaned up!
      expect(service.stagedSubs()).toEqual([]);
    });

    it('should keep synced as false in markEventSynced if the event was deleted locally while in-flight', () => {
      const timestamp = 123456789;
      service.pushEvent({ type: 'GOAL', timestamp, minuteOccurred: 5, playerId: 'p1' });
      
      // Revert/delete the event locally before sync completes
      service.undo();
      
      const event = service.events().find(e => e.timestamp === timestamp)!;
      expect(event.status).toBe('deleted');
      expect(event.synced).toBe(false);

      // Simulate the sync POST completing and calling markEventSynced
      service.markEventSynced(timestamp, 'backend-id-123');

      const updatedEvent = service.events().find(e => e.timestamp === timestamp)!;
      expect(updatedEvent.id).toBe('backend-id-123');
      expect(updatedEvent.status).toBe('deleted');
      expect(updatedEvent.synced).toBe(false); // synced must remain false so syncDelete can run!
    });

    it('should preserve local deleted status and unsynced deletion state in handleRemoteEvent', () => {
      const timestamp = 123456789;
      service.pushEvent({ type: 'GOAL', timestamp, minuteOccurred: 5, playerId: 'p1' });
      
      // Revert/delete the event locally before sync completes
      service.undo();
      
      // mark event as having backend id but unsynced deletion
      service.markEventSynced(timestamp, 'backend-id-123');

      // Now simulate receiving the broadcast of the logged event from the socket
      service.handleRemoteEvent({
        id: 'backend-id-123',
        eventType: 'GOAL',
        minuteOccurred: 5,
        timestamp,
        status: 'active',
        payload: { playerId: 'p1' }
      });

      const updatedEvent = service.events().find(e => e.timestamp === timestamp)!;
      expect(updatedEvent.status).toBe('deleted');
      expect(updatedEvent.synced).toBe(false);
    });

    it('should correctly revert period on double period end undo back to P2 and P1', () => {
      service.initialize('event-123', mockLineup, 'team-123', 2);
      expect(service.currentPeriod()).toBe(1);

      // Period 1 ends -> enters Period 2
      service.pushEvent({ type: 'PERIOD_END', timestamp: 1000, minuteOccurred: 25 });
      expect(service.currentPeriod()).toBe(2);

      // In Period 2, a goal is scored
      service.pushEvent({ type: 'GOAL', timestamp: 2000, minuteOccurred: 30, playerId: 'p1' });
      expect(service.currentPeriod()).toBe(2);

      // Period 2 ends -> enters Period 3
      service.pushEvent({ type: 'PERIOD_END', timestamp: 3000, minuteOccurred: 50 });
      expect(service.currentPeriod()).toBe(3);

      // Accidental double period end -> enters Period 4
      service.pushEvent({ type: 'PERIOD_END', timestamp: 4000, minuteOccurred: 50 });
      expect(service.currentPeriod()).toBe(4);

      // 1st Undo: removes the second Period End -> back to Period 3
      service.undo();
      expect(service.currentPeriod()).toBe(3);

      // 2nd Undo: removes the first Period End -> back to Period 2!
      service.undo();
      expect(service.currentPeriod()).toBe(2);

      // 3rd Undo: removes the Goal in Period 2 -> still in Period 2
      service.undo();
      expect(service.currentPeriod()).toBe(2);

      // 4th Undo: removes Period 1 End -> back to Period 1!
      service.undo();
      expect(service.currentPeriod()).toBe(1);
    });

    it('should revert period when a PERIOD_END is removed via deleteEvent', () => {
      service.initialize('event-123', mockLineup, 'team-123', 2);
      
      service.pushEvent({ id: 'pe-1', type: 'PERIOD_END', timestamp: 1000, minuteOccurred: 25, synced: true });
      service.pushEvent({ id: 'pe-2', type: 'PERIOD_END', timestamp: 2000, minuteOccurred: 50, synced: true });
      expect(service.currentPeriod()).toBe(3);

      service.deleteEvent('pe-2');
      expect(service.currentPeriod()).toBe(2);

      service.deleteEvent('pe-1');
      expect(service.currentPeriod()).toBe(1);
    });

    it('should reconcile backend events accurately (adding missed events and removing remotely deleted events)', () => {
      service.initialize('event-123', mockLineup, 'team-123', 2);

      // Local initial event
      service.pushEvent({ id: 'e1', type: 'SHOT', timestamp: 1000, minuteOccurred: 5, synced: true });
      
      // An unsynced local event that is pending
      service.pushEvent({ type: 'CORNER_KICK', timestamp: 2000, minuteOccurred: 10, synced: false });

      expect(service.events().length).toBe(2);

      // Backend returns e1 plus two missed events (e2: OPPONENT_GOAL, e3: SHOT)
      const backendEvents = [
        { id: 'e1', eventType: 'SHOT', minuteOccurred: 5, payload: { timestamp: 1000 } },
        { id: 'e2', eventType: 'OPPONENT_GOAL', minuteOccurred: 15, payload: { timestamp: 3000 } },
        { id: 'e3', eventType: 'SHOT', minuteOccurred: 20, payload: { timestamp: 4000 } }
      ];

      service.reconcileBackendEvents(backendEvents);

      const activeEvents = service.events().filter(e => e.status !== 'deleted');
      // Should contain e1, unsynced corner kick, e2 (OPPONENT_GOAL), and e3 (SHOT)
      expect(activeEvents.length).toBe(4);
      expect(activeEvents.some(e => e.id === 'e2' && e.type === 'OPPONENT_GOAL')).toBe(true);
      expect(activeEvents.some(e => e.id === 'e3' && e.type === 'SHOT')).toBe(true);
      expect(activeEvents.some(e => e.type === 'CORNER_KICK' && !e.synced)).toBe(true);

      // Score should reflect the opponent goal
      expect(service.score().opponent).toBe(1);
    });
  });
});
