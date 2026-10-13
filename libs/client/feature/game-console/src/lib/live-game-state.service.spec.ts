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

  it('should reset all state signals to clean defaults when reset() is called', () => {
    service.initialize(eventId, mockLineup, teamId, 11, 'My Team', 'Soccer');
    service.endGame('completed');
    expect(service.status()).toBe('completed');
    expect(service.eventId()).toBe(eventId);

    service.reset();

    expect(service.eventId()).toBeNull();
    expect(service.teamId()).toBeNull();
    expect(service.status()).toBe('in_progress');
    expect(service.sportName()).toBeNull();
    expect(service.events()).toHaveLength(0);
    expect(service.initialLineup()).toHaveLength(0);
    expect(service.stagedSubs()).toHaveLength(0);
    expect(service.lastIntervalTriggered()).toBe(0);
    expect(service.currentPeriod()).toBe(1);
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

  it('should allow subbing off an active player to bench without replacement (injury / playing down)', () => {
    service.initialize(eventId, mockLineup, teamId);

    // Sub out p1 without bringing anyone in
    const subOutEvent = {
      type: 'SUB',
      playerIdOut: 'p1',
      slotIndex: 0,
      timestamp: Date.now(),
      minuteOccurred: 12,
    };

    service.pushEvent(subOutEvent);

    expect(service.activePlayers().find(p => p.id === 'p1')).toBeUndefined();
    expect(service.benchPlayers().find(p => p.id === 'p1')).toBeTruthy();
    // Only p3 is active now
    expect(service.activePlayers().length).toBe(1);
    expect(service.activePlayers()[0].id).toBe('p3');
  });

  it('should allow subbing on a bench player into an empty slot without subbing someone off', () => {
    service.initialize(eventId, mockLineup, teamId);

    // First sub out p1 so slot 0 is empty
    service.pushEvent({
      type: 'SUB',
      playerIdOut: 'p1',
      slotIndex: 0,
      timestamp: Date.now(),
      minuteOccurred: 10,
    });

    // Now sub bench player p2 directly into empty slot 0
    service.pushEvent({
      type: 'SUB',
      playerIdIn: 'p2',
      slotIndex: 0,
      positionName: 'Forward',
      timestamp: Date.now() + 1000,
      minuteOccurred: 15,
    });

    const p2Active = service.activePlayers().find(p => p.id === 'p2');
    expect(p2Active).toBeTruthy();
    expect((p2Active as any).slotIndex).toBe(0);
    expect(service.benchPlayers().find(p => p.id === 'p2')).toBeUndefined();
  });

  it('should not allow subbing on an additional player if field is already at maximum capacity (playersOnField)', () => {
    // 2 starters (p1, p3), playersOnField = 2
    service.initialize(eventId, mockLineup, teamId, 2);
    expect(service.activePlayers().length).toBe(2);

    // Try to sub bench player p2 into slot 2 without subbing anyone out
    service.pushEvent({
      type: 'SUB',
      playerIdIn: 'p2',
      slotIndex: 2,
      positionName: 'Defender',
      timestamp: Date.now(),
      minuteOccurred: 15,
    });

    // p2 should NOT have been added to active players
    expect(service.activePlayers().length).toBe(2);
    expect(service.activePlayers().find(p => p.id === 'p2')).toBeUndefined();
    expect(service.benchPlayers().find(p => p.id === 'p2')).toBeTruthy();
  });

  it('should strictly deduplicate players so a player cannot appear on the field twice', () => {
    // Lineup with duplicate starter entry
    const duplicateLineup = [
      ...mockLineup,
      {
        playerId: 'p1',
        player: { id: 'p1', firstName: 'P1', lastName: 'Dup', jerseyNumber: 10 },
        status: 'starting',
        slotIndex: 5,
        positionName: 'Defender',
      },
    ];

    service.initialize(eventId, duplicateLineup as any, teamId);
    const p1Count = service.activePlayers().filter(p => p.id === 'p1').length;
    expect(p1Count).toBe(1);

    // Also test: subbing an already-active player into another slot moves them, doesn't duplicate
    service.pushEvent({
      type: 'SUB',
      playerIdIn: 'p1',
      slotIndex: 8,
      positionName: 'Midfielder',
      timestamp: Date.now(),
      minuteOccurred: 20,
    });

    const p1Occurrences = service.activePlayers().filter(p => p.id === 'p1');
    expect(p1Occurrences.length).toBe(1);
    expect((p1Occurrences[0] as any).slotIndex).toBe(8);
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

    it('should award a point to team on addOpponentOwnGoal without attaching to a player', () => {
      expect(service.score()).toEqual({ team: 0, opponent: 0 });
      service.addOpponentOwnGoal(14);
      expect(service.score()).toEqual({ team: 1, opponent: 0 });
      const lastEvent = service.events()[service.events().length - 1];
      expect(lastEvent.type).toBe('OPPONENT_OWN_GOAL');
      expect(lastEvent.playerId).toBeUndefined();
      expect(lastEvent.minuteOccurred).toBe(14);
    });

    it('should undo OPPONENT_OWN_GOAL correctly', () => {
      service.addOpponentOwnGoal(14);
      expect(service.score().team).toBe(1);
      service.undo();
      expect(service.score().team).toBe(0);
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

    it('should accurately represent 1-3-4-1 and 1-2-5-1 formations in activePlayers', () => {
      // 1-3-4-1 formation: 1 GK (0), 3 DEF (2, 3, 4), 4 MID (6, 7, 8, 9), 1 FWD (13)
      const formation1341Lineup: LineupEntry[] = [
        { playerId: 'gk', player: { id: 'gk', firstName: 'GK', lastName: 'Keeper' } as any, status: 'starting', slotIndex: 0, positionName: 'GK' },
        { playerId: 'd1', player: { id: 'd1', firstName: 'D', lastName: '1' } as any, status: 'starting', slotIndex: 2, positionName: 'DEF' },
        { playerId: 'd2', player: { id: 'd2', firstName: 'D', lastName: '2' } as any, status: 'starting', slotIndex: 3, positionName: 'DEF' },
        { playerId: 'd3', player: { id: 'd3', firstName: 'D', lastName: '3' } as any, status: 'starting', slotIndex: 4, positionName: 'DEF' },
        { playerId: 'm1', player: { id: 'm1', firstName: 'M', lastName: '1' } as any, status: 'starting', slotIndex: 6, positionName: 'MID' },
        { playerId: 'm2', player: { id: 'm2', firstName: 'M', lastName: '2' } as any, status: 'starting', slotIndex: 7, positionName: 'MID' },
        { playerId: 'm3', player: { id: 'm3', firstName: 'M', lastName: '3' } as any, status: 'starting', slotIndex: 8, positionName: 'MID' },
        { playerId: 'm4', player: { id: 'm4', firstName: 'M', lastName: '4' } as any, status: 'starting', slotIndex: 9, positionName: 'MID' },
        { playerId: 'f1', player: { id: 'f1', firstName: 'F', lastName: '1' } as any, status: 'starting', slotIndex: 13, positionName: 'FWD' },
      ];

      service.initialize(eventId, formation1341Lineup, teamId, 9);
      const active = service.activePlayers();
      expect(active.length).toBe(9);
      const slots = active.map(p => (p as any).slotIndex).sort((a, b) => a - b);
      expect(slots).toEqual([0, 2, 3, 4, 6, 7, 8, 9, 13]);

      // 1-2-5-1 formation: 1 GK (0), 2 DEF (2, 4), 5 MID (6, 7, 8, 9, 10), 1 FWD (13)
      const formation1251Lineup: LineupEntry[] = [
        { playerId: 'gk', player: { id: 'gk', firstName: 'GK', lastName: 'Keeper' } as any, status: 'starting', slotIndex: 0, positionName: 'GK' },
        { playerId: 'd1', player: { id: 'd1', firstName: 'D', lastName: '1' } as any, status: 'starting', slotIndex: 2, positionName: 'DEF' },
        { playerId: 'd2', player: { id: 'd2', firstName: 'D', lastName: '4' } as any, status: 'starting', slotIndex: 4, positionName: 'DEF' },
        { playerId: 'm1', player: { id: 'm1', firstName: 'M', lastName: '1' } as any, status: 'starting', slotIndex: 6, positionName: 'MID' },
        { playerId: 'm2', player: { id: 'm2', firstName: 'M', lastName: '2' } as any, status: 'starting', slotIndex: 7, positionName: 'MID' },
        { playerId: 'm3', player: { id: 'm3', firstName: 'M', lastName: '3' } as any, status: 'starting', slotIndex: 8, positionName: 'MID' },
        { playerId: 'm4', player: { id: 'm4', firstName: 'M', lastName: '4' } as any, status: 'starting', slotIndex: 9, positionName: 'MID' },
        { playerId: 'm5', player: { id: 'm5', firstName: 'M', lastName: '5' } as any, status: 'starting', slotIndex: 10, positionName: 'MID' },
        { playerId: 'f1', player: { id: 'f1', firstName: 'F', lastName: '1' } as any, status: 'starting', slotIndex: 13, positionName: 'FWD' },
      ];

      service.initialize(eventId, formation1251Lineup, teamId, 9);
      const active1251 = service.activePlayers();
      expect(active1251.length).toBe(9);
      const slots1251 = active1251.map(p => (p as any).slotIndex).sort((a, b) => a - b);
      expect(slots1251).toEqual([0, 2, 4, 6, 7, 8, 9, 10, 13]);
    });

    it('should strictly enforce playersOnField limit to prevent phantom 10th player in 9v9', () => {
      // Lineup with 10 starters for a 9-player event
      const tenStarters: LineupEntry[] = Array.from({ length: 10 }, (_, i) => ({
        playerId: `p${i + 1}`,
        player: { id: `p${i + 1}`, firstName: `P`, lastName: `${i + 1}` } as any,
        status: 'starting',
        slotIndex: i,
        positionName: 'MID',
      }));

      service.initialize(eventId, tenStarters, teamId, 9);
      expect(service.activePlayers().length).toBe(9);
    });

    it('should not create duplicate phantom players during substitution when slotIndex differs from outPlayer position', () => {
      const lineup: LineupEntry[] = [
        { playerId: 'p1', player: { id: 'p1', firstName: 'P', lastName: '1' } as any, status: 'starting', slotIndex: 3, positionName: 'DEF' },
        { playerId: 'p2', player: { id: 'p2', firstName: 'P', lastName: '2' } as any, status: 'starting', slotIndex: 4, positionName: 'DEF' },
        { playerId: 'p-bench', player: { id: 'p-bench', firstName: 'Bench', lastName: 'Player' } as any, status: 'bench', slotIndex: null, positionName: null },
      ];

      service.initialize(eventId, lineup, teamId, 2);
      expect(service.activePlayers().length).toBe(2);

      // Substitute p-bench in for p1, but sub event records slotIndex 3
      service.pushEvent({
        type: 'SUB',
        playerIdIn: 'p-bench',
        playerIdOut: 'p1',
        slotIndex: 3,
        timestamp: Date.now(),
        minuteOccurred: 10,
      });

      const active = service.activePlayers();
      expect(active.length).toBe(2);
      expect(active.find(p => p.id === 'p1')).toBeUndefined();
      expect(active.find(p => p.id === 'p-bench')).toBeDefined();
    });

    it('should default sportName to null and isSportReady to false before initialization', () => {
      const freshService = TestBed.inject(LiveGameStateService);
      freshService.setSportName(null);
      expect(freshService.sportName()).toBeNull();
      expect(freshService.isSportReady()).toBe(false);
    });

    it('should update sportName and isSportReady when setSportName or initialize is called', () => {
      service.setSportName('Basketball');
      expect(service.sportName()).toBe('Basketball');
      expect(service.isSportReady()).toBe(true);

      service.setSportName(null);
      expect(service.sportName()).toBeNull();
      expect(service.isSportReady()).toBe(false);

      service.initialize(eventId, mockLineup, teamId, 5, undefined, 'Basketball');
      expect(service.sportName()).toBe('Basketball');
      expect(service.isSportReady()).toBe(true);
    });

    it('should compute basketball score and player stats correctly', () => {
      service.initialize(eventId, mockLineup, teamId, 5, undefined, 'Basketball');

      // 1PT, 2PT, 3PT makes and misses
      service.pushEvents([
        { type: 'MADE_3PT', playerId: 'p1', x: 50, y: 65, distanceFeet: 23, timestamp: 1000 },
        { type: 'MADE_2PT', playerId: 'p1', assistorId: 'p3', x: 50, y: 25, distanceFeet: 6, timestamp: 1010 },
        { type: 'MADE_1PT', playerId: 'p1', timestamp: 1020 },
        { type: 'MISSED_3PT', playerId: 'p3', x: 95, y: 15, timestamp: 1030 },
        { type: 'REBOUND_OFFENSIVE', playerId: 'p1', timestamp: 1035 },
        { type: 'REBOUND_DEFENSIVE', playerId: 'p3', timestamp: 1040 },
        { type: 'STEAL', playerId: 'p3', timestamp: 1050 },
        { type: 'BLOCK', playerId: 'p3', timestamp: 1060 },
        { type: 'TURNOVER', playerId: 'p1', timestamp: 1070 },
        { type: 'FOUL', playerId: 'p1', timestamp: 1080 },
        { type: 'OPPONENT_SCORE', points: 3, timestamp: 1090 } as any,
        { type: 'OPPONENT_SCORE', points: 2, timestamp: 1100 } as any,
      ]);

      // Score: 3 + 2 + 1 = 6 for team, 3 + 2 = 5 for opponent
      expect(service.score()).toEqual({ team: 6, opponent: 5 });

      // Player p1 stats
      const stats = service.playerStats();
      expect(stats['p1'].points).toBe(6);
      expect(stats['p1'].fgMade).toBe(2);
      expect(stats['p1'].fgAttempted).toBe(2);
      expect(stats['p1'].fg3Made).toBe(1);
      expect(stats['p1'].ftMade).toBe(1);
      expect(stats['p1'].reboundsOffensive).toBe(1);
      expect(stats['p1'].turnovers).toBe(1);
      expect(stats['p1'].fouls).toBe(1);

      // Player p3 stats (assisted p1's 2PT, missed 3PT, D-REB, STL, BLK)
      expect(stats['p3'].assists).toBe(1);
      expect(stats['p3'].fgAttempted).toBe(1);
      expect(stats['p3'].fg3Attempted).toBe(1);
      expect(stats['p3'].reboundsDefensive).toBe(1);
      expect(stats['p3'].steals).toBe(1);
      expect(stats['p3'].blocks).toBe(1);

      // Basketball shots list
      const shots = service.basketballShots();
      expect(shots.length).toBe(4); // 3 makes + 1 miss
    });

    it('should track team fouls and bonus threshold per period', () => {
      service.initialize(eventId, mockLineup, teamId, 5, undefined, 'Basketball', { bonusThreshold: 4 });
      expect(service.bonusThreshold()).toBe(4);

      service.pushEvents([
        { type: 'FOUL', playerId: 'p1', timestamp: 100 },
        { type: 'FOUL', playerId: 'p3', timestamp: 200 },
        { type: 'FOUL', playerId: 'p1', timestamp: 300 },
      ]);

      expect(service.basketballFouls().teamFouls).toBe(3);
      expect(service.basketballFouls().inBonus).toBe(false);

      // 4th foul triggers bonus
      service.pushEvent({ type: 'FOUL', playerId: 'p3', timestamp: 400 });
      expect(service.basketballFouls().teamFouls).toBe(4);
      expect(service.basketballFouls().inBonus).toBe(true);
    });

    it('should support undoLastEvent to revert recent actions', () => {
      service.initialize(eventId, mockLineup, teamId, 5, undefined, 'Basketball');

      expect(service.canUndo()).toBe(false);

      service.pushEvent({ type: 'MADE_2PT', playerId: 'p1', timestamp: 100 });
      expect(service.score().team).toBe(2);
      expect(service.canUndo()).toBe(true);

      const undone = service.undoLastEvent();
      expect(undone?.type).toBe('MADE_2PT');
      expect(service.score().team).toBe(0);
      expect(service.canUndo()).toBe(false);
    });

    it('should track double bonus threshold and bonus states correctly', () => {
      service.initialize(eventId, mockLineup, teamId, 5, undefined, 'Basketball', {
        bonusThreshold: 5,
        doubleBonusThreshold: 10,
      });
      expect(service.bonusThreshold()).toBe(5);
      expect(service.doubleBonusThreshold()).toBe(10);

      expect(service.basketballFouls().bonusState).toBe('NONE');
      expect(service.basketballFouls().inBonus).toBe(false);
      expect(service.basketballFouls().inDoubleBonus).toBe(false);

      // Add 5 fouls -> enters BONUS
      for (let i = 1; i <= 5; i++) {
        service.pushEvent({ type: 'FOUL', playerId: 'p1', timestamp: i * 10 });
      }
      expect(service.basketballFouls().teamFouls).toBe(5);
      expect(service.basketballFouls().inBonus).toBe(true);
      expect(service.basketballFouls().inDoubleBonus).toBe(false);
      expect(service.basketballFouls().bonusState).toBe('BONUS');

      // Add 5 more fouls -> enters DOUBLE_BONUS
      for (let i = 6; i <= 10; i++) {
        service.pushEvent({ type: 'FOUL', playerId: 'p3', timestamp: i * 10 });
      }
      expect(service.basketballFouls().teamFouls).toBe(10);
      expect(service.basketballFouls().inBonus).toBe(true);
      expect(service.basketballFouls().inDoubleBonus).toBe(true);
      expect(service.basketballFouls().bonusState).toBe('DOUBLE_BONUS');

      // Opponent fouls
      for (let i = 1; i <= 5; i++) {
        service.pushEvent({ type: 'OPPONENT_FOUL', timestamp: 100 + i });
      }
      expect(service.basketballFouls().opponentFouls).toBe(5);
      expect(service.basketballFouls().opponentInBonus).toBe(true);
      expect(service.basketballFouls().opponentBonusState).toBe('BONUS');
    });

    it('should track personal fouls, foul trouble, and fouled out status', () => {
      service.initialize(eventId, mockLineup, teamId, 5, undefined, 'Basketball', {
        foulLimit: 5,
      });

      // 1 to 3 fouls: normal
      for (let i = 1; i <= 3; i++) {
        service.pushEvent({ type: 'FOUL', playerId: 'p1', timestamp: i * 10 });
      }
      let stats = service.playerStats();
      expect(stats['p1'].fouls).toBe(3);
      expect(stats['p1'].foulTrouble).toBe(false);
      expect(stats['p1'].fouledOut).toBe(false);

      // 4 fouls: foul trouble (limit - 1)
      service.pushEvent({ type: 'FOUL', playerId: 'p1', timestamp: 40 });
      stats = service.playerStats();
      expect(stats['p1'].fouls).toBe(4);
      expect(stats['p1'].foulTrouble).toBe(true);
      expect(stats['p1'].fouledOut).toBe(false);

      // 5 fouls: fouled out
      service.pushEvent({ type: 'FOUL', playerId: 'p1', timestamp: 50 });
      stats = service.playerStats();
      expect(stats['p1'].fouls).toBe(5);
      expect(stats['p1'].foulTrouble).toBe(false);
      expect(stats['p1'].fouledOut).toBe(true);
    });

    it('should track basketball timeouts for team and opponent', () => {
      service.initialize(eventId, mockLineup, teamId, 5, undefined, 'Basketball', {
        timeoutsLimit: 5,
      });
      expect(service.timeoutsLimit()).toBe(5);
      expect(service.basketballTimeouts().teamRemaining).toBe(5);
      expect(service.basketballTimeouts().opponentRemaining).toBe(5);

      service.callTeamTimeout(1, 60000);
      expect(service.basketballTimeouts().teamUsed).toBe(1);
      expect(service.basketballTimeouts().teamRemaining).toBe(4);

      service.callOpponentTimeout(2, 120000);
      expect(service.basketballTimeouts().opponentUsed).toBe(1);
      expect(service.basketballTimeouts().opponentRemaining).toBe(4);

      // Legacy or shorthand OPPONENT_TIMEOUT
      service.pushEvent({ type: 'OPPONENT_TIMEOUT', timestamp: 200 });
      expect(service.basketballTimeouts().opponentUsed).toBe(2);
      expect(service.basketballTimeouts().opponentRemaining).toBe(3);
    });

    it('should compute running quarter period scores and line score data', () => {
      service.initialize(eventId, mockLineup, teamId, 5, undefined, 'Basketball');

      // Period 1
      service.pushEvents([
        { type: 'MADE_3PT', playerId: 'p1', timestamp: 10, period: 1 } as any,
        { type: 'MADE_2PT', playerId: 'p1', timestamp: 20, period: 1 } as any,
        { type: 'OPPONENT_SCORE', points: 3, timestamp: 30, period: 1 } as any,
      ]);

      // Period 2
      service.pushEvents([
        { type: 'MADE_1PT', playerId: 'p2', timestamp: 40, period: 2 } as any,
        { type: 'OPPONENT_SCORE', points: 2, timestamp: 50, period: 2 } as any,
      ]);

      const periodScores = service.basketballPeriodScores();
      expect(periodScores.length).toBeGreaterThanOrEqual(4);

      // Q1
      expect(periodScores[0].period).toBe(1);
      expect(periodScores[0].label).toBe('Q1');
      expect(periodScores[0].teamScore).toBe(5);
      expect(periodScores[0].opponentScore).toBe(3);
      expect(periodScores[0].teamCumulative).toBe(5);
      expect(periodScores[0].opponentCumulative).toBe(3);

      // Q2
      expect(periodScores[1].period).toBe(2);
      expect(periodScores[1].label).toBe('Q2');
      expect(periodScores[1].teamScore).toBe(1);
      expect(periodScores[1].opponentScore).toBe(2);
      expect(periodScores[1].teamCumulative).toBe(6);
      expect(periodScores[1].opponentCumulative).toBe(5);

      // Q3 and Q4 zero deltas
      expect(periodScores[2].teamScore).toBe(0);
      expect(periodScores[2].teamCumulative).toBe(6);
    });

    it('should track basketball plus/minus based on on-court stints and substitutions', () => {
      // p1 starting, p2 starting, p3 bench
      const customLineup = [
        { playerId: 'p1', player: { id: 'p1', firstName: 'A', lastName: 'A' }, status: 'starting' },
        { playerId: 'p2', player: { id: 'p2', firstName: 'B', lastName: 'B' }, status: 'starting' },
        { playerId: 'p3', player: { id: 'p3', firstName: 'C', lastName: 'C' }, status: 'bench' },
      ];
      service.initialize(eventId, customLineup as any, teamId, 2, undefined, 'Basketball');

      // Team scores 3PT with p1 & p2 on court
      service.pushEvent({ type: 'MADE_3PT', playerId: 'p1', timestamp: 10 });
      let pm = service.basketballPlusMinus();
      expect(pm['p1']).toBe(3);
      expect(pm['p2']).toBe(3);
      expect(pm['p3']).toBe(0);

      // Opponent scores 2PT
      service.pushEvent({ type: 'OPPONENT_SCORE', points: 2, timestamp: 20 } as any);
      pm = service.basketballPlusMinus();
      expect(pm['p1']).toBe(1);
      expect(pm['p2']).toBe(1);
      expect(pm['p3']).toBe(0);

      // Sub: p1 out, p3 in
      service.pushEvent({ type: 'SUB', playerIdOut: 'p1', playerIdIn: 'p3', timestamp: 30 });

      // p3 scores 2PT
      service.pushEvent({ type: 'MADE_2PT', playerId: 'p3', timestamp: 40 });
      pm = service.basketballPlusMinus();
      expect(pm['p1']).toBe(1); // p1 was off-court, remains +1
      expect(pm['p2']).toBe(3); // p2 was on-court: 1 + 2 = +3
      expect(pm['p3']).toBe(2); // p3 was on-court: 0 + 2 = +2
    });

    it('should aggregate full basketball box score with percentages and formatted plus/minus', () => {
      service.initialize(eventId, mockLineup, teamId, 5, undefined, 'Basketball');

      service.pushEvents([
        { type: 'MADE_2PT', playerId: 'p1', timestamp: 10 },
        { type: 'MISSED_2PT', playerId: 'p1', timestamp: 20 },
        { type: 'MADE_3PT', playerId: 'p1', timestamp: 30 },
        { type: 'MADE_1PT', playerId: 'p1', timestamp: 40 },
        { type: 'OFFENSIVE_REBOUND', playerId: 'p1', timestamp: 50 },
        { type: 'DEFENSIVE_REBOUND', playerId: 'p1', timestamp: 60 },
        { type: 'FOUL', playerId: 'p1', timestamp: 70 },
      ]);

      const boxScore = service.basketballBoxScore();
      expect(boxScore.length).toBe(mockLineup.length);

      const p1 = boxScore.find((p) => p.playerId === 'p1');
      expect(p1).toBeDefined();
      expect(p1?.points).toBe(6);
      expect(p1?.fgMade).toBe(2);
      expect(p1?.fgAttempted).toBe(3);
      expect(p1?.fgPct).toBe('66.7%');
      expect(p1?.fg3Made).toBe(1);
      expect(p1?.fg3Attempted).toBe(1);
      expect(p1?.fg3Pct).toBe('100.0%');
      expect(p1?.ftMade).toBe(1);
      expect(p1?.ftAttempted).toBe(1);
      expect(p1?.ftPct).toBe('100.0%');
      expect(p1?.reboundsOffensive).toBe(1);
      expect(p1?.reboundsDefensive).toBe(1);
      expect(p1?.reboundsTotal).toBe(2);
      expect(p1?.fouls).toBe(1);
      expect(p1?.plusMinus).toBe(6);
      expect(p1?.plusMinusFormatted).toBe('+6');
    });

    it('should correctly calculate plus/minus in box score for substituted players with 0 individual stats', () => {
      // p1 starting, p2 bench
      const customLineup = [
        { playerId: 'p1', player: { id: 'p1', firstName: 'Devin', lastName: 'Booker' }, status: 'starting' },
        { playerId: 'p2', player: { id: 'p2', firstName: 'Klay', lastName: 'Thompson' }, status: 'bench' },
      ];
      service.initialize(eventId, customLineup as any, teamId, 5, undefined, 'Basketball');

      // 1. Team scores 7 points with Booker on court
      service.pushEvents([
        { type: 'MADE_3PT', playerId: 'p1', gameTimeMs: 10000 },
        { type: 'MADE_2PT', playerId: 'p1', gameTimeMs: 20000 },
        { type: 'MADE_2PT', playerId: 'p1', gameTimeMs: 30000 },
      ]);

      let boxScore = service.basketballBoxScore();
      let booker = boxScore.find((p) => p.playerId === 'p1');
      let klay = boxScore.find((p) => p.playerId === 'p2');
      expect(booker?.plusMinus).toBe(7);
      expect(booker?.plusMinusFormatted).toBe('+7');
      expect(klay?.plusMinus).toBe(0);
      expect(klay?.plusMinusFormatted).toBe('0');

      // 2. Booker is subbed out, Klay is subbed in
      service.pushEvent({
        type: 'SUB',
        playerIdOut: 'p1',
        playerIdIn: 'p2',
        gameTimeMs: 40000,
      });

      // 3. Team scores 6 points with Klay on court (Klay doesn't record any personal stats)
      service.pushEvents([
        { type: 'MADE_3PT', playerId: 'other_player', gameTimeMs: 50000 },
        { type: 'MADE_3PT', playerId: 'other_player', gameTimeMs: 60000 },
      ]);

      boxScore = service.basketballBoxScore();
      booker = boxScore.find((p) => p.playerId === 'p1');
      klay = boxScore.find((p) => p.playerId === 'p2');

      // Booker stays at +7
      expect(booker?.plusMinus).toBe(7);
      expect(booker?.plusMinusFormatted).toBe('+7');

      // Klay is now +6 even with 0 individual points recorded!
      expect(klay?.plusMinus).toBe(6);
      expect(klay?.plusMinusFormatted).toBe('+6');
      expect(klay?.points).toBe(0);
    });

    describe('Basketball Overtime', () => {
      it('should compute isOvertime and overtimeNumber based on regulationPeriodCount', () => {
        service.initialize(eventId, mockLineup, teamId, 5, undefined, 'Basketball', { periodCount: 4 });

        expect(service.regulationPeriodCount()).toBe(4);
        expect(service.currentPeriod()).toBe(1);
        expect(service.isOvertime()).toBe(false);
        expect(service.overtimeNumber()).toBe(0);
        expect(service.periodLengthMinutes()).toBe(8);

        // Advance to Period 4 (regulation end)
        service.pushEvents([
          { type: 'PERIOD_END', timestamp: 1 },
          { type: 'PERIOD_END', timestamp: 2 },
          { type: 'PERIOD_END', timestamp: 3 },
        ]);
        expect(service.currentPeriod()).toBe(4);
        expect(service.isOvertime()).toBe(false);
        expect(service.overtimeNumber()).toBe(0);

        // Advance to Period 5 (OT1)
        service.pushEvent({ type: 'PERIOD_END', timestamp: 4 });
        expect(service.currentPeriod()).toBe(5);
        expect(service.isOvertime()).toBe(true);
        expect(service.overtimeNumber()).toBe(1);
        expect(service.periodLengthMinutes()).toBe(4); // Default OT length

        // Advance to Period 6 (OT2)
        service.pushEvent({ type: 'PERIOD_END', timestamp: 5 });
        expect(service.currentPeriod()).toBe(6);
        expect(service.isOvertime()).toBe(true);
        expect(service.overtimeNumber()).toBe(2);
      });

      it('should allow setting custom overtime duration per period', () => {
        service.initialize(eventId, mockLineup, teamId, 5, undefined, 'Basketball', { periodCount: 4 });

        // Advance to period 5
        service.pushEvents([
          { type: 'PERIOD_END', timestamp: 1 },
          { type: 'PERIOD_END', timestamp: 2 },
          { type: 'PERIOD_END', timestamp: 3 },
          { type: 'PERIOD_END', timestamp: 4 },
        ]);

        service.setOvertimeLength(5, 5);
        expect(service.overtimePeriodLengthMinutes()).toBe(5);
        expect(service.periodLengths()[5]).toBe(5);
        expect(service.periodLengthMinutes()).toBe(5);

        // Next OT (period 6) set to 3 minutes
        service.pushEvent({ type: 'PERIOD_END', timestamp: 5 });
        service.setOvertimeLength(3, 6);
        expect(service.periodLengths()[5]).toBe(5);
        expect(service.periodLengths()[6]).toBe(3);
        expect(service.periodLengthMinutes()).toBe(3);
      });

      it('should restore overtime period lengths from OVERTIME_START events when recomputing', () => {
        service.initialize(eventId, mockLineup, teamId, 5, undefined, 'Basketball', { periodCount: 4 });

        service.pushEvents([
          { type: 'PERIOD_END', timestamp: 1 },
          { type: 'PERIOD_END', timestamp: 2 },
          { type: 'PERIOD_END', timestamp: 3 },
          { type: 'PERIOD_END', timestamp: 4 },
          { type: 'OVERTIME_START', period: 5, overtimeMinutes: 3, timestamp: 5 },
        ]);

        expect(service.currentPeriod()).toBe(5);
        expect(service.periodLengths()[5]).toBe(3);
        expect(service.periodLengthMinutes()).toBe(3);
      });

      it('should format basketball period scores with Q1..Q4 and OT1..OTn', () => {
        service.initialize(eventId, mockLineup, teamId, 5, undefined, 'Basketball', { periodCount: 4 });

        // 4 regulation periods + 2 overtimes
        service.pushEvents([
          { type: 'MADE_2PT', playerId: 'p1', period: 1, timestamp: 1 },
          { type: 'PERIOD_END', timestamp: 2 },
          { type: 'MADE_3PT', playerId: 'p1', period: 2, timestamp: 3 },
          { type: 'PERIOD_END', timestamp: 4 },
          { type: 'OPPONENT_SCORE', points: 2, period: 3, timestamp: 5 } as any,
          { type: 'PERIOD_END', timestamp: 6 },
          { type: 'MADE_2PT', playerId: 'p1', period: 4, timestamp: 7 },
          { type: 'PERIOD_END', timestamp: 8 },
          { type: 'MADE_2PT', playerId: 'p1', period: 5, timestamp: 9 },
          { type: 'PERIOD_END', timestamp: 10 },
          { type: 'MADE_1PT', playerId: 'p1', period: 6, timestamp: 11 },
        ]);

        const periodScores = service.basketballPeriodScores();
        expect(periodScores.length).toBe(6);
        expect(periodScores[0].label).toBe('Q1');
        expect(periodScores[1].label).toBe('Q2');
        expect(periodScores[2].label).toBe('Q3');
        expect(periodScores[3].label).toBe('Q4');
        expect(periodScores[4].label).toBe('OT1');
        expect(periodScores[5].label).toBe('OT2');
        expect(periodScores[4].teamScore).toBe(2);
        expect(periodScores[5].teamScore).toBe(1);
      });

      it('should format basketball period scores with H1..H2 when regulation period count is 2', () => {
        service.initialize(eventId, mockLineup, teamId, 5, undefined, 'Basketball', { periodCount: 2 });

        service.pushEvents([
          { type: 'MADE_2PT', playerId: 'p1', period: 1, timestamp: 1 },
          { type: 'PERIOD_END', timestamp: 2 },
          { type: 'MADE_2PT', playerId: 'p1', period: 2, timestamp: 3 },
          { type: 'PERIOD_END', timestamp: 4 },
          { type: 'MADE_2PT', playerId: 'p1', period: 3, timestamp: 5 },
        ]);

        const periodScores = service.basketballPeriodScores();
        expect(periodScores.length).toBe(3);
        expect(periodScores[0].label).toBe('H1');
        expect(periodScores[1].label).toBe('H2');
        expect(periodScores[2].label).toBe('OT1');
      });
    });
  });

  describe('Volleyball Score & Stats Tracking', () => {
    const vballLineup: LineupEntry[] = [
      { playerId: 'p1', player: { id: 'p1', firstName: 'John', lastName: 'Server', jerseyNumber: 1 }, status: 'starting', slotIndex: 0 },
      { playerId: 'p2', player: { id: 'p2', firstName: 'Jane', lastName: 'Hitter', jerseyNumber: 2 }, status: 'starting', slotIndex: 1 },
      { playerId: 'p3', player: { id: 'p3', firstName: 'Bob', lastName: 'Middle', jerseyNumber: 3, preferredPosition: 'Middle Blocker' }, status: 'starting', slotIndex: 4 },
      { playerId: 'p4', player: { id: 'p4', firstName: 'Lucy', lastName: 'Libero', jerseyNumber: 99, preferredPosition: 'Libero' }, status: 'bench' },
    ];

    it('should compute volleyball set scores with KILL, ACE, BLOCK, and errors', () => {
      service.initialize(eventId, vballLineup, teamId, 6, undefined, 'Volleyball');

      service.pushEvents([
        { type: 'KILL', playerId: 'p2', period: 1, timestamp: 1 },
        { type: 'ACE', playerId: 'p1', period: 1, timestamp: 2 },
        { type: 'BLOCK', playerId: 'p3', period: 1, timestamp: 3 },
        { type: 'POINT_WON', period: 1, timestamp: 4 },
        { type: 'SERVICE_ERROR', playerId: 'p1', period: 1, timestamp: 5 },
        { type: 'HITTING_ERROR', playerId: 'p2', period: 1, timestamp: 6 },
        { type: 'SET_ERROR', playerId: 'p1', period: 1, timestamp: 7 },
        { type: 'SERVE_RECEIVE', playerId: 'p2', period: 1, timestamp: 8, payload: { score: 0 } },
        { type: 'SERVE_RECEIVE', playerId: 'p2', period: 1, timestamp: 8.5, payload: { score: 0, isOverpass: true, quality: 'OVERPASS' } },
        { type: 'POINT_LOST', period: 1, timestamp: 9 },
      ]);

      // Team points: KILL (1) + ACE (1) + BLOCK (1) + POINT_WON (1) = 4
      // Opponent points: SERVICE_ERROR (1) + HITTING_ERROR (1) + SET_ERROR (1) + SERVE_RECEIVE 0 (1) [not overpass] + POINT_LOST (1) = 5
      expect(service.score()).toEqual({ team: 4, opponent: 5 });
      expect(service.playerStats()['p2'].passCount).toBe(2);
      expect(service.playerStats()['p2'].overpasses).toBe(1);
    });

    it('should undo atomic batch of POSITION_SWAP events in single undoLastEvent', () => {
      service.initialize(eventId, vballLineup, teamId, 6, undefined, 'Volleyball');

      const initialP1Slot = service.activePlayers().find(p => p.id === 'p1')?.slotIndex;
      expect(initialP1Slot).toBe(0);

      // Push 3 consecutive swaps simulating rotation
      service.pushEvents([
        { type: 'POSITION_SWAP', slotIndexA: 0, slotIndexB: 1, playerIdA: 'p1', playerIdB: 'p2', timestamp: 10 } as any,
        { type: 'POSITION_SWAP', slotIndexA: 1, slotIndexB: 2, playerIdA: 'p1', playerIdB: 'p3', timestamp: 11 } as any,
      ]);

      expect(service.canUndo()).toBe(true);
      const undone = service.undoLastEvent();
      expect(undone?.type).toBe('POSITION_SWAP');

      // P1 should be restored back to slot 0
      const restoredP1Slot = service.activePlayers().find(p => p.id === 'p1')?.slotIndex;
      expect(restoredP1Slot).toBe(0);
    });

    it('should execute quickLiberoSwap to swap Libero into back row and back out', () => {
      service.initialize(eventId, vballLineup, teamId, 6, undefined, 'Volleyball');
      service.setLiberoId('p4');

      // Libero currently on bench
      expect(service.activePlayers().some(p => p.id === 'p4')).toBe(false);

      // Quick swap in: should replace p3 (Middle Blocker in back row slotIndex 4)
      const swappedIn = service.quickLiberoSwap();
      expect(swappedIn).toBe(true);
      expect(service.activePlayers().some(p => p.id === 'p4')).toBe(true);
      expect(service.activePlayers().some(p => p.id === 'p3')).toBe(false);

      // Quick swap out: should swap p4 out and restore p3
      const swappedOut = service.quickLiberoSwap();
      expect(swappedOut).toBe(true);
      expect(service.activePlayers().some(p => p.id === 'p4')).toBe(false);
      expect(service.activePlayers().some(p => p.id === 'p3')).toBe(true);
    });
  });
});


