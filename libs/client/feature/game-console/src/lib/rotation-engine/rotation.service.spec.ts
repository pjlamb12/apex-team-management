import { TestBed } from '@angular/core/testing';
import { RotationService } from './rotation.service';
import { LiveGameStateService, RotationConfig } from '../live-game-state.service';
import { PlaytimeService } from './playtime.service';
import { LiveClockService } from '../live-clock.service';
import { signal } from '@angular/core';

describe('RotationService', () => {
  let service: RotationService;
  let mockStateService: any;
  let mockPlaytimeService: any;
  let mockClockService: any;

  const player1 = { id: 'p1', name: 'Player 1', preferredPosition: 'Forward', slotIndex: 0 }; // GK
  const player2 = { id: 'p2', name: 'Player 2', preferredPosition: 'Forward', slotIndex: 1 };
  const player3 = { id: 'p3', name: 'Player 3', preferredPosition: 'Midfield', slotIndex: 2 };
  const player4 = { id: 'p4', name: 'Player 4', preferredPosition: 'Defense', slotIndex: 3 };
  
  const player5 = { id: 'p5', name: 'Player 5', preferredPosition: 'Forward' };
  const player6 = { id: 'p6', name: 'Player 6', preferredPosition: 'Midfield' };
  const player7 = { id: 'p7', name: 'Player 7', preferredPosition: 'Defense' };

  beforeEach(() => {
    mockStateService = {
      activePlayers: signal([player1, player2, player3, player4]),
      benchPlayers: signal([player5, player6, player7]),
      events: signal([]),
    };

    mockPlaytimeService = {
      playtimeMap: signal({
        p1: 600, // 10 mins
        p2: 600, // 10 mins
        p3: 300, // 5 mins
        p4: 300, // 5 mins
        p5: 0,
        p6: 0,
        p7: 300, // 5 mins
      }),
    };

    mockClockService = {
      elapsedMs: signal(900000), // 15 mins
    };

    TestBed.configureTestingModule({
      providers: [
        RotationService,
        { provide: LiveGameStateService, useValue: mockStateService },
        { provide: PlaytimeService, useValue: mockPlaytimeService },
        { provide: LiveClockService, useValue: mockClockService },
      ],
    });
    service = TestBed.inject(RotationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('PURE mode', () => {
    it('should suggest least-played bench for most-played active, protecting GK', () => {
      const config: any = { mode: 'PURE' };
      const suggestions = service.generateSuggestions(config);

      // Active candidates sorted by playtime (desc): p2 (600), p3 (300), p4 (300). p1 is GK (slot 0) so excluded.
      // Bench candidates sorted by playtime (asc): p5 (0), p6 (0), p7 (300).
      
      expect(suggestions.length).toBe(3);
      expect(suggestions[0]).toEqual({ inPlayerId: 'p5', outPlayerId: 'p2' });
      expect(suggestions[1].outPlayerId).not.toBe('p1'); // GK Protection
    });
  });

  describe('POSITION mode', () => {
    it('should suggest swaps within the same position group', () => {
      const config: any = { mode: 'POSITION' };
      const suggestions = service.generateSuggestions(config);

      // Forward: active p2 (600), bench p5 (0) -> suggestion
      // Midfield: active p3 (300), bench p6 (0) -> suggestion
      // Defense: active p4 (300), bench p7 (300) -> suggestion
      
      expect(suggestions.length).toBe(3);
      expect(suggestions).toContainEqual({ inPlayerId: 'p5', outPlayerId: 'p2' });
      expect(suggestions).toContainEqual({ inPlayerId: 'p6', outPlayerId: 'p3' });
      expect(suggestions).toContainEqual({ inPlayerId: 'p7', outPlayerId: 'p4' });
    });
  });

  describe('CONSTRAINT mode', () => {
    it('should respect maxFieldMinutes limit', () => {
      // p2 has 600s (10 mins), p3 and p4 have 300s (5 mins)
      // If maxFieldMinutes is 8, only p2 should be suggested for sub out if possible.
      const config: any = { mode: 'CONSTRAINT', maxFieldMinutes: 8 };
      const suggestions = service.generateSuggestions(config);

      expect(suggestions.length).toBe(1);
      expect(suggestions[0]).toEqual({ inPlayerId: 'p5', outPlayerId: 'p2' });
    });

    it('should respect minBenchMinutes limit', () => {
      // p5 subbed out at 12 mins (720s). Now is 15 mins (900s). Rested 3 mins.
      // If minBenchMinutes is 5, p5 should NOT be suggested if others available.
      mockStateService.events.set([
        { type: 'SUB', playerIdOut: 'p5', gameTimeMs: 720000, status: 'active' }
      ]);
      
      const config: any = { mode: 'CONSTRAINT', minBenchMinutes: 5 };
      const suggestions = service.generateSuggestions(config);

      // p5 excluded from constrained bench. p6 and p7 available.
      const inIds = suggestions.map(s => s.inPlayerId);
      expect(inIds).not.toContain('p5');
      expect(inIds).toContain('p6');
      expect(inIds).toContain('p7');
    });

    it('should fallback to PURE if no active player meets constraints', () => {
      const config: any = { mode: 'CONSTRAINT', maxFieldMinutes: 15 };
      const suggestions = service.generateSuggestions(config);

      // Nobody has played 15 mins (900s). Fallback to PURE logic.
      expect(suggestions.length).toBe(3);
    });
  });

  describe('Goalkeeper Protection', () => {
    it('should never suggest swapping out the player in slot 0', () => {
      const config: any = { mode: 'PURE' };
      // Give player 1 (GK) the most playtime
      mockPlaytimeService.playtimeMap.set({
        p1: 1000,
        p2: 500,
        p3: 500,
        p4: 500,
        p5: 0,
        p6: 0,
        p7: 0,
      });

      const suggestions = service.generateSuggestions(config);
      
      const outIds = suggestions.map(s => s.outPlayerId);
      expect(outIds).not.toContain('p1');
    });
  });
});
