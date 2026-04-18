import { TestBed } from '@angular/core/testing';
import { LiveGameStateService } from './live-game-state.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('LiveGameStateService', () => {
  let service: LiveGameStateService;
  const gameId = 'game-123';

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(LiveGameStateService);
    service.initialize(gameId);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with empty events', () => {
    expect(service.events()).toEqual([]);
  });

  it('should push events and persist to localStorage', () => {
    const event = { type: 'GOAL', playerId: 'player-1', timestamp: Date.now() };
    service.pushEvent(event);
    
    expect(service.events()).toEqual([event]);
    
    const stored = JSON.parse(localStorage.getItem(`game-events-${gameId}`) || '[]');
    expect(stored).toEqual([event]);
  });

  it('should undo the last event', () => {
    const event1 = { type: 'GOAL', playerId: 'player-1', timestamp: 1000 };
    const event2 = { type: 'GOAL', playerId: 'player-2', timestamp: 2000 };
    
    service.pushEvent(event1);
    service.pushEvent(event2);
    expect(service.events()).toEqual([event1, event2]);
    
    service.undo();
    expect(service.events()).toEqual([event1]);
    
    const stored = JSON.parse(localStorage.getItem(`game-events-${gameId}`) || '[]');
    expect(stored).toEqual([event1]);
  });

  it('should restore state from localStorage on initialization', () => {
    const event = { type: 'GOAL', playerId: 'player-1', timestamp: 1000 };
    localStorage.setItem(`game-events-${gameId}`, JSON.stringify([event]));
    
    // Create a new instance to simulate reload
    const newService = TestBed.inject(LiveGameStateService);
    newService.initialize(gameId);
    
    expect(newService.events()).toEqual([event]);
  });
});
