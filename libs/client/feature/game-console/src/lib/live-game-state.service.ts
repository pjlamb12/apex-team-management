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
  private _eventId = signal<string | null>(null);
  private _teamId = signal<string | null>(null);
  private _initialLineup = signal<LineupEntry[]>([]);
  private _currentPeriod = signal<number>(1);
  private _status = signal<'scheduled' | 'in_progress' | 'completed'>('in_progress');

  public readonly events = this._events.asReadonly();
  public readonly eventId = this._eventId.asReadonly();
  public readonly teamId = this._teamId.asReadonly();
  public readonly initialLineup = this._initialLineup.asReadonly();
  public readonly currentPeriod = this._currentPeriod.asReadonly();
  public readonly status = this._status.asReadonly();

  public readonly activePlayers = computed(() => {
    const lineup = this._initialLineup();
    const events = this._events().filter((e) => e.status !== 'deleted');

    const slotMap = new Map<number, { player: Player; position: string }>();

    lineup
      .filter((e) => e.status === 'starting' && e.slotIndex !== null)
      .forEach((e) => {
        slotMap.set(e.slotIndex as number, {
          player: e.player,
          position: e.positionName || 'Unknown',
        });
      });

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
          const temp = { ...playerA };
          slotMap.set(event.slotIndexA, { ...playerB, position: playerA.position });
          slotMap.set(event.slotIndexB, { ...temp, position: playerB.position });
        }
      }
    });

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

  public initialize(eventId: string, lineup: LineupEntry[] = [], teamId?: string): void {
    this._eventId.set(eventId);
    if (teamId) this._teamId.set(teamId);
    this._initialLineup.set(lineup);

    const stored = localStorage.getItem(this.getStorageKey());
    if (stored) {
      try {
        const events = JSON.parse(stored);
        this._events.set(events);
        
        // Recover current period from last event if possible
        const lastEvent = events.filter((e: any) => e.status !== 'deleted').pop();
        if (lastEvent?.period) {
          this._currentPeriod.set(lastEvent.period);
        }
      } catch (e) {
        console.error('Failed to parse stored events', e);
        this._events.set([]);
      }
    } else {
      this._events.set([]);
    }
  }

  public pushEvent(event: GameEvent): void {
    this._events.update((prev) => [
      ...prev,
      { ...event, status: 'active', period: this._currentPeriod() },
    ]);
    this.save();
  }

  public setEvents(events: GameEvent[]): void {
    this._events.set(events);
    this.save();
  }

  public nextPeriod(): void {
    this._currentPeriod.update((p) => p + 1);
    this.save();
  }

  public setPeriod(period: number): void {
    this._currentPeriod.set(period);
    this.save();
  }

  public endGame(): void {
    this._status.set('completed');
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
    if (!this._eventId()) return;
    localStorage.setItem(this.getStorageKey(), JSON.stringify(this._events()));
  }

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

  public markDeletionSynced(localTimestamp: number): void {
    this._events.update((prev) =>
      prev.map((e) =>
        e.timestamp === localTimestamp ? { ...e, synced: true } : e
      )
    );
    this.save();
  }

  private getStorageKey(): string {
    return `event-logs-${this._eventId()}`;
  }
}
