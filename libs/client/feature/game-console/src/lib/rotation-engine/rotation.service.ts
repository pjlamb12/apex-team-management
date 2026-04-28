import { Injectable, inject } from '@angular/core';
import { LiveGameStateService, RotationConfig } from '../live-game-state.service';
import { StagedSub } from '@apex-team/shared/util/models';
import { PlaytimeService } from './playtime.service';
import { LiveClockService } from '../live-clock.service';

@Injectable({
  providedIn: 'root',
})
export class RotationService {
  private stateService = inject(LiveGameStateService);
  private playtimeService = inject(PlaytimeService);
  private clockService = inject(LiveClockService);

  public generateSuggestions(config: RotationConfig): StagedSub[] {
    const playtimeMap = this.playtimeService.playtimeMap();
    const activePlayers = this.stateService.activePlayers();
    const benchPlayers = this.stateService.benchPlayers();

    // Step 1: Identify Candidates
    // activePlayers: All players currently on field, excluding Goalkeeper (slot index 0), 
    // sorted by playtimeMap (descending - most played first).
    const activeCandidates = activePlayers
      .filter((p) => p.slotIndex !== 0) // Protect Goalkeeper
      .sort((a, b) => (playtimeMap[b.id] || 0) - (playtimeMap[a.id] || 0));

    // benchPlayers: All players currently on bench, 
    // sorted by playtimeMap (ascending - least played first).
    const benchCandidates = benchPlayers
      .sort((a, b) => (playtimeMap[a.id] || 0) - (playtimeMap[b.id] || 0));

    if (config.mode === 'PURE') {
      return this.generatePureSuggestions(activeCandidates, benchCandidates);
    }

    if (config.mode === 'POSITION') {
      return this.generatePositionSuggestions(activeCandidates, benchCandidates);
    }

    if (config.mode === 'CONSTRAINT') {
      return this.generateConstraintSuggestions(activeCandidates, benchCandidates, config);
    }

    return [];
  }

  private generatePureSuggestions(active: any[], bench: any[]): StagedSub[] {
    const suggestions: StagedSub[] = [];
    const count = Math.min(active.length, bench.length);

    for (let i = 0; i < count; i++) {
      suggestions.push({
        inPlayerId: bench[i].id,
        outPlayerId: active[i].id,
      });
    }

    return suggestions;
  }

  private generatePositionSuggestions(active: any[], bench: any[]): StagedSub[] {
    const suggestions: StagedSub[] = [];
    
    // Group active by position
    const activeByPos = new Map<string, any[]>();
    active.forEach(p => {
      const pos = p.preferredPosition || 'Unknown';
      if (!activeByPos.has(pos)) activeByPos.set(pos, []);
      activeByPos.get(pos)!.push(p);
    });

    // Group bench by position
    const benchByPos = new Map<string, any[]>();
    bench.forEach(p => {
      const pos = p.preferredPosition || 'Unknown';
      if (!benchByPos.has(pos)) benchByPos.set(pos, []);
      benchByPos.get(pos)!.push(p);
    });

    // Match within positions
    activeByPos.forEach((players, pos) => {
      const benchForPos = benchByPos.get(pos) || [];
      const count = Math.min(players.length, benchForPos.length);
      for (let i = 0; i < count; i++) {
        suggestions.push({
          inPlayerId: benchForPos[i].id,
          outPlayerId: players[i].id,
        });
      }
    });

    return suggestions;
  }

  private generateConstraintSuggestions(active: any[], bench: any[], config: RotationConfig): StagedSub[] {
    const minBenchSec = (config.minBenchMinutes || 0) * 60;
    const maxFieldSec = (config.maxFieldMinutes || 999) * 60;
    const playtimeMap = this.playtimeService.playtimeMap();
    const currentClockSec = this.clockService.elapsedMs() / 1000;

    // Filter active players who have played enough to be subbed out
    const constrainedActive = active.filter(p => (playtimeMap[p.id] || 0) >= maxFieldSec);
    
    // For bench players, we check if they have rested long enough.
    const events = this.stateService.events().filter(e => e.status !== 'deleted');
    const lastSubOutTimeSec: Record<string, number> = {};
    
    events.forEach(e => {
      if (e.type === 'SUB' && e.playerIdOut) {
        lastSubOutTimeSec[e.playerIdOut] = (e.gameTimeMs || 0) / 1000;
      }
    });

    const constrainedBench = bench.filter(p => {
      const lastOut = lastSubOutTimeSec[p.id];
      if (lastOut === undefined) return true; // Never subbed out
      return (currentClockSec - lastOut) >= minBenchSec;
    });

    // Pair them up
    return this.generatePureSuggestions(
      constrainedActive.length > 0 ? constrainedActive : active,
      constrainedBench.length > 0 ? constrainedBench : bench
    );
  }
}

