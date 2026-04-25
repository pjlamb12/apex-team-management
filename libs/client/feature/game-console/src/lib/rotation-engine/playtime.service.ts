import { Injectable, inject, computed } from '@angular/core';
import { LiveGameStateService } from '../live-game-state.service';
import { LiveClockService } from '../live-clock.service';

@Injectable({
  providedIn: 'root',
})
export class PlaytimeService {
  private stateService = inject(LiveGameStateService);
  private clockService = inject(LiveClockService);

  /**
   * Map of player IDs to total seconds played.
   * Derived from the game event log and the live game clock.
   */
  public readonly playtimeMap = computed(() => {
    const events = this.stateService.events().filter(e => e.status !== 'deleted');
    const initialLineup = this.stateService.initialLineup();
    const currentClockMs = this.clockService.elapsedMs();
    
    const totalsMs: Record<string, number> = {};
    const stintStartMs: Record<string, number> = {};
    const onField = new Set<string>();

    // Initialize totals for all players in the lineup
    initialLineup.forEach(entry => {
      totalsMs[entry.playerId] = 0;
      if (entry.status === 'starting') {
        onField.add(entry.playerId);
        stintStartMs[entry.playerId] = 0;
      }
    });

    // Process event log
    events.forEach(event => {
      const eventTimeMs = event.gameTimeMs ?? (event.minuteOccurred - 1) * 60000;

      if (event.type === 'PERIOD_END') {
        // Close all stints at the end of the period
        onField.forEach(playerId => {
          const start = stintStartMs[playerId] ?? 0;
          totalsMs[playerId] = (totalsMs[playerId] || 0) + Math.max(0, eventTimeMs - start);
          stintStartMs[playerId] = 0; // Reset for next period start
        });
      } else if (event.type === 'SUB') {
        if (event.playerIdOut) {
          const start = stintStartMs[event.playerIdOut] ?? 0;
          totalsMs[event.playerIdOut] = (totalsMs[event.playerIdOut] || 0) + Math.max(0, eventTimeMs - start);
          delete stintStartMs[event.playerIdOut];
          onField.delete(event.playerIdOut);
        }
        if (event.playerIdIn) {
          stintStartMs[event.playerIdIn] = eventTimeMs;
          onField.add(event.playerIdIn);
          if (totalsMs[event.playerIdIn] === undefined) totalsMs[event.playerIdIn] = 0;
        }
      }
      // POSITION_SWAP and other events don't change playtime stints
    });

    // Add current active stint for players on the field
    onField.forEach(playerId => {
      const start = stintStartMs[playerId] ?? 0;
      totalsMs[playerId] = (totalsMs[playerId] || 0) + Math.max(0, currentClockMs - start);
    });

    // Convert to seconds
    const result: Record<string, number> = {};
    Object.keys(totalsMs).forEach(playerId => {
      result[playerId] = Math.floor(totalsMs[playerId] / 1000);
    });

    return result;
  });
}
