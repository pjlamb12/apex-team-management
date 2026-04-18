import { TestBed } from '@angular/core/testing';
import { LiveGameStateService, LineupEntry } from './live-game-state.service';
import { describe, it, expect, beforeEach } from 'vitest';

describe('LiveGameStateService', () => {
  let service: LiveGameStateService;
  const gameId = 'game-123';

  const mockLineup: LineupEntry[] = [
    {
      playerId: 'p1',
      player: { id: 'p1', firstName: 'P', lastName: '1', jerseyNumber: '1' } as any,
      status: 'starting',
      positionName: 'Forward',
    },
    {
      playerId: 'p2',
      player: { id: 'p2', firstName: 'P', lastName: '2', jerseyNumber: '2' } as any,
      status: 'bench',
      positionName: null,
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

  it('should initialize with lineup and compute active/bench players', () => {
    service.initialize(gameId, mockLineup);
    
    expect(service.activePlayers().length).toBe(1);
    expect(service.activePlayers()[0].id).toBe('p1');
    expect(service.activePlayers()[0].preferredPosition).toBe('Forward');
    
    expect(service.benchPlayers().length).toBe(1);
    expect(service.benchPlayers()[0].id).toBe('p2');
  });

  it('should update active/bench players when a SUB event is pushed', () => {
    service.initialize(gameId, mockLineup);
    
    const subEvent = {
      type: 'SUB',
      playerIdIn: 'p2',
      playerIdOut: 'p1',
      timestamp: Date.now(),
    };
    
    service.pushEvent(subEvent);
    
    expect(service.activePlayers().length).toBe(1);
    expect(service.activePlayers()[0].id).toBe('p2');
    expect(service.activePlayers()[0].preferredPosition).toBe('Forward'); // Position preserved from swapped player
    
    expect(service.benchPlayers().length).toBe(1);
    expect(service.benchPlayers()[0].id).toBe('p1');
  });

  it('should undo a SUB event and restore roster', () => {
    service.initialize(gameId, mockLineup);
    
    const subEvent = {
      type: 'SUB',
      playerIdIn: 'p2',
      playerIdOut: 'p1',
      timestamp: Date.now(),
    };
    
    service.pushEvent(subEvent);
    expect(service.activePlayers()[0].id).toBe('p2');
    
    service.undo();
    expect(service.activePlayers()[0].id).toBe('p1');
  });

  it('should restore state from localStorage on initialization', () => {
    const event = { type: 'GOAL', playerId: 'p1', timestamp: 1000 };
    localStorage.setItem(`game-events-${gameId}`, JSON.stringify([event]));
    
    service.initialize(gameId, mockLineup);
    
    expect(service.events()).toEqual([event]);
  });
});
