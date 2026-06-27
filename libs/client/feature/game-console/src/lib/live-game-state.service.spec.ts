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
  });
});
