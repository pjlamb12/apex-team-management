import { Injectable, signal, computed } from '@angular/core';
import { Player } from '@apex-team/shared/util/models';

export interface GameEvent {
  id?: string;
  type: string;
  playerId?: string;
  playerIdIn?: string;
  playerIdOut?: string;
  playerIdA?: string;
  playerIdB?: string;
  slotIndex?: number;
  slotIndexA?: number;
  slotIndexB?: number;
  position?: string;
  minuteOccurred: number;
  timestamp: number;
  synced?: boolean;
  status?: 'active' | 'deleted';
  [key: string]: any;
}

export interface LineupEntry {
  playerId: string;
  player: Player;
  positionName: string | null;
  status: 'starting' | 'bench';
  slotIndex: number | null;
}

@Injectable({
  providedIn: 'root',
})
export class LiveGameStateService {
  private _events = signal<GameEvent[]>([]);
  private _gameId = signal<string | null>(null);
  private _initialLineup = signal<LineupEntry[]>([]);

  public readonly events = this._events.asReadonly();
  public readonly gameId = this._gameId.asReadonly();
  public readonly initialLineup = this._initialLineup.asReadonly();

  public readonly activePlayers = computed(() => {
    const lineup = this._initialLineup();
    const events = this._events().filter((e) => e.status !== 'deleted');

    // Use a map of slotIndex -> { player, position }
    // Slot indices 0-10 for a standard 11-player lineup (soccer)
    const slotMap = new Map<number, { player: Player; position: string }>();

    // 1. Initialize from initial starting players
    lineup
      .filter((e) => e.status === 'starting' && e.slotIndex !== null)
      .forEach((e) => {
        slotMap.set(e.slotIndex as number, {
          player: e.player,
          position: e.positionName || 'Unknown',
        });
      });

    // 2. Apply events in order
    events.forEach((event) => {
      if (event.type === 'SUB' && event.playerIdIn && event.slotIndex !== undefined) {
        const inEntry = lineup.find((e) => e.playerId === event.playerIdIn);
        if (inEntry) {
          const currentInSlot = slotMap.get(event.slotIndex);
          slotMap.set(event.slotIndex, {
            player: inEntry.player,
            position: currentInSlot?.position || 'Unknown',
          });
        }
      } else if (
        event.type === 'POSITION_SWAP' &&
        event.slotIndexA !== undefined &&
        event.slotIndexB !== undefined
      ) {
        const playerA = slotMap.get(event.slotIndexA);
        const playerB = slotMap.get(event.slotIndexB);

        if (playerA && playerB) {
          // Swap the contents of the slots
          // Note: The position (e.g. "Forward") is tied to the slot, 
          // but we swap the player objects while keeping the slot's original position label
          // for now, OR do we swap everything? 
          // Plan says: "players at slotIndexA and slotIndexB should swap their slots"
          // If slot 0 is "Forward" and slot 1 is "Midfielder", and we swap players,
          // usually the coach means "Player A is now Midfielder, Player B is now Forward".
          
          const temp = { ...playerA };
          slotMap.set(event.slotIndexA, { ...playerB, position: playerA.position });
          slotMap.set(event.slotIndexB, { ...temp, position: playerB.position });
        }
      }
    });

    // 3. Return as array of players with their assigned slot and position
    return Array.from(slotMap.entries()).map(([slotIndex, data]) => ({
      ...data.player,
      preferredPosition: data.position,
      slotIndex,
    }));
  });

  public readonly benchPlayers = computed(() => {
    const lineup = this._initialLineup();
    const active = this.activePlayers();
    const activeIds = new Set(active.map((p) => p.id));

    return lineup
      .filter((e) => !activeIds.has(e.playerId))
      .map((e) => e.player);
  });

  public readonly score = computed(() => {
    const events = this._events().filter((e) => e.status !== 'deleted');
    const team = events.filter((e) => e.type === 'GOAL').length;
    const opponent = events.filter((e) => e.type === 'OPPONENT_GOAL').length;
    return { team, opponent };
  });

  public initialize(gameId: string, lineup: LineupEntry[] = []): void {
    this._gameId.set(gameId);
    this._initialLineup.set(lineup);

    const stored = localStorage.getItem(this.getStorageKey());
    if (stored) {
      try {
        const events = JSON.parse(stored);
        this._events.set(events);
      } catch (e) {
        console.error('Failed to parse stored events', e);
        this._events.set([]);
      }
    } else {
      this._events.set([]);
    }
  }

  public pushEvent(event: GameEvent): void {
    this._events.update((prev) => [...prev, { ...event, status: 'active' }]);
    this.save();
  }

  public addOpponentGoal(minuteOccurred: number): void {
    this.pushEvent({
      type: 'OPPONENT_GOAL',
      timestamp: Date.now(),
      minuteOccurred,
    });
  }

  public undo(): void {
    this._events.update((prev) => {
      const activeEvents = prev.filter((e) => e.status !== 'deleted');
      if (activeEvents.length === 0) return prev;

      const lastActive = activeEvents[activeEvents.length - 1];
      return prev.map((e) =>
        e === lastActive ? { ...e, status: 'deleted', synced: false } : e
      );
    });
    this.save();
  }

  public save(): void {
    const gameId = this._gameId();
    if (!gameId) return;
    localStorage.setItem(this.getStorageKey(), JSON.stringify(this._events()));
  }

  /**
   * Immutably marks an event as synced and records its backend ID.
   * Required by EventSyncService — do NOT mutate signal-owned objects directly.
   */
  public markEventSynced(localTimestamp: number, backendId: string): void {
    this._events.update((prev) =>
      prev.map((e) =>
        e.timestamp === localTimestamp
          ? { ...e, id: backendId, synced: true }
          : e
      )
    );
    this.save();
  }

  /**
   * Immutably marks a deleted event's sync flag after backend DELETE succeeds.
   */
  public markDeletionSynced(localTimestamp: number): void {
    this._events.update((prev) =>
      prev.map((e) =>
        e.timestamp === localTimestamp ? { ...e, synced: true } : e
      )
    );
    this.save();
  }

  private getStorageKey(): string {
    return `game-events-${this._gameId()}`;
  }
}
