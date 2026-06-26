import { Injectable, signal, computed } from '@angular/core';
import { Player, LineupEntry, StagedSub } from '@apex-team/shared/util/models';

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
  gameTimeMs?: number;
  timestamp: number;
  synced?: boolean;
  status?: 'active' | 'deleted';
  [key: string]: any;
}

export interface RotationConfig {
  enabled: boolean;
  intervalMinutes: number;
  mode: 'PURE' | 'POSITION' | 'CONSTRAINT';
  minBenchMinutes?: number;
  maxFieldMinutes?: number;
}

@Injectable({
  providedIn: 'root',
})
export class LiveGameStateService {
  private _events = signal<GameEvent[]>([]);
  private _eventId = signal<string | null>(null);
  private _teamId = signal<string | null>(null);
  private _initialLineup = signal<LineupEntry[]>([]);
  private _playersOnField = signal<number>(11);
  private _currentPeriod = signal<number>(1);
  private _status = signal<'scheduled' | 'in_progress' | 'completed'>('in_progress');
  private _stagedSubs = signal<StagedSub[]>([]);
  private _lastIntervalTriggered = signal<number>(0);
  private _rotationConfig = signal<RotationConfig>({
    enabled: false,
    intervalMinutes: 8,
    mode: 'PURE',
  });

  public readonly events = this._events.asReadonly();
  public readonly eventId = this._eventId.asReadonly();
  public readonly teamId = this._teamId.asReadonly();
  public readonly initialLineup = this._initialLineup.asReadonly();
  public readonly playersOnField = this._playersOnField.asReadonly();
  public readonly currentPeriod = this._currentPeriod.asReadonly();
  public readonly status = this._status.asReadonly();
  public readonly stagedSubs = this._stagedSubs.asReadonly();
  public readonly lastIntervalTriggered = this._lastIntervalTriggered.asReadonly();
  public readonly rotationConfig = this._rotationConfig.asReadonly();

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
      const inId = event.playerIdIn || event['inPlayerId'];
      if (event.type === 'SUB' && inId && event.slotIndex !== undefined) {
        const inEntry = lineup.find((e) => e.playerId === inId);
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

  public initialize(eventId: string, lineup: LineupEntry[] = [], teamId?: string, playersOnField?: number): void {
    this._eventId.set(eventId);
    if (teamId) this._teamId.set(teamId);
    this._initialLineup.set(lineup);
    if (playersOnField) this._playersOnField.set(playersOnField);

    // Reset singleton state to defaults before loading stored values
    this._events.set([]);
    this._stagedSubs.set([]);
    this._lastIntervalTriggered.set(0);
    this._currentPeriod.set(1);
    this._status.set('in_progress');
    this._rotationConfig.set({
      enabled: false,
      intervalMinutes: 8,
      mode: 'PURE',
    });

    const storedEvents = localStorage.getItem(this.getStorageKey());
    if (storedEvents) {
      try {
        const events = JSON.parse(storedEvents);
        const mapped = events.map((e: any) => this.mapEvent(e));
        this._events.set(mapped);
        
        // Recover current period from last event if possible
        const lastEvent = mapped.filter((e: any) => e.status !== 'deleted').pop();
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

    const storedConfig = localStorage.getItem(this.getConfigStorageKey());
    if (storedConfig) {
      try {
        const config = JSON.parse(storedConfig);
        this._rotationConfig.set(config);
      } catch (e) {
        console.error('Failed to parse stored rotation config', e);
      }
    }

    const storedRotationState = localStorage.getItem(this.getRotationStateStorageKey());
    if (storedRotationState) {
      try {
        const state = JSON.parse(storedRotationState);
        if (state.lastIntervalTriggered !== undefined) {
          this._lastIntervalTriggered.set(state.lastIntervalTriggered);
        }
      } catch (e) {
        console.error('Failed to parse stored rotation state', e);
      }
    }
  }

  public updateRotationConfig(config: Partial<RotationConfig>): void {
    this._rotationConfig.update((prev) => ({ ...prev, ...config }));
    this.saveConfig();
  }

  public setLastIntervalTriggered(interval: number): void {
    this._lastIntervalTriggered.set(interval);
    this.saveRotationState();
  }

  public pushEvent(event: GameEvent): void {
    this._events.update((prev) => [
      ...prev,
      this.mapEvent({ ...event, status: 'active', period: this._currentPeriod() }),
    ]);
    this.save();
  }

  public pushEvents(events: GameEvent[]): void {
    const decoratedEvents = events.map((e, index) => 
      this.mapEvent({
        ...e,
        timestamp: (e.timestamp || Date.now()) + index,
        status: 'active' as const,
        period: this._currentPeriod(),
      })
    );
    this._events.update((prev) => [...prev, ...decoratedEvents]);
    this.save();
  }

  public setEvents(events: GameEvent[]): void {
    const mapped = events.map((e) => this.mapEvent(e));
    this._events.set(mapped);
    this.save();
  }

  public stageSub(inPlayerId: string, outPlayerId: string): void {
    this._stagedSubs.update((prev) => {
      // Remove any existing sub where either player is already involved
      const filtered = prev.filter(
        (s) =>
          s.inPlayerId !== inPlayerId &&
          s.outPlayerId !== outPlayerId &&
          s.inPlayerId !== outPlayerId &&
          s.outPlayerId !== inPlayerId
      );
      return [...filtered, { inPlayerId, outPlayerId }];
    });
  }

  public unstageSub(playerId: string): void {
    this._stagedSubs.update((prev) =>
      prev.filter((s) => s.inPlayerId !== playerId && s.outPlayerId !== playerId)
    );
  }

  public clearStagedSubs(): void {
    this._stagedSubs.set([]);
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

  public addOpponentGoal(minuteOccurred: number, gameTimeMs?: number): void {
    this.pushEvent({
      type: 'OPPONENT_GOAL',
      timestamp: Date.now(),
      minuteOccurred,
      gameTimeMs,
    });
  }

  public undo(): void {
    this._events.update((prev) => {
      const activeEvents = prev.filter((e) => e.status !== 'deleted');
      if (activeEvents.length === 0) return prev;

      const lastActive = activeEvents[activeEvents.length - 1];

      // If we are undoing a PERIOD_END, revert the period back
      if (lastActive.type === 'PERIOD_END') {
        this._currentPeriod.set(lastActive['period'] || 1);
      }

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

  public saveConfig(): void {
    if (!this._eventId()) return;
    localStorage.setItem(this.getConfigStorageKey(), JSON.stringify(this._rotationConfig()));
  }

  public saveRotationState(): void {
    if (!this._eventId()) return;
    localStorage.setItem(this.getRotationStateStorageKey(), JSON.stringify({
      lastIntervalTriggered: this._lastIntervalTriggered()
    }));
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

  public handleRemoteEvent(event: any): void {
    this._events.update((prev) => {
      // Check if event already exists by id
      let existingIndex = prev.findIndex(e => e.id === event.id);

      // Map backend fields to frontend format
      const mappedEvent = this.mapEvent(event);
      mappedEvent.synced = true;

      // If not found by id, check if there is an unsynced local event of the same type and approximate gameTimeMs or matching payload data
      if (existingIndex === -1) {
        existingIndex = prev.findIndex(e => {
          if (e.synced) return false;
          if (e.type !== mappedEvent.type) return false;
          
          const timeMatches = (e.gameTimeMs !== undefined && mappedEvent['payload']?.gameTimeMs !== undefined)
            ? Math.abs(e.gameTimeMs - (mappedEvent['payload'].gameTimeMs as number)) < 1000
            : e.minuteOccurred === mappedEvent.minuteOccurred;

          if (!timeMatches) return false;

          // Match by specific payload keys
          if (e.type === 'GOAL') {
            return (e['scorerId'] === mappedEvent.playerId) || (e.playerId === mappedEvent.playerId);
          }
          if (e.type === 'ASSIST') {
            return (e['assistorId'] === mappedEvent.playerId) || (e.playerId === mappedEvent.playerId);
          }
          if (e.type === 'SUB') {
            return e.playerIdIn === mappedEvent.playerIdIn && e.playerIdOut === mappedEvent.playerIdOut;
          }
          if (e.type === 'POSITION_SWAP') {
            return e.playerIdA === mappedEvent.playerIdA && e.playerIdB === mappedEvent.playerIdB;
          }
          return true;
        });
      }

      if (existingIndex > -1) {
        const newEvents = [...prev];
        newEvents[existingIndex] = {
          ...newEvents[existingIndex],
          ...mappedEvent,
          timestamp: newEvents[existingIndex].timestamp // Keep original local timestamp
        };
        return newEvents;
      } else {
        return [
          ...prev,
          {
            ...mappedEvent,
            timestamp: Date.now()
          }
        ];
      }
    });
    this.save();
  }

  public handleRemoteDeletion(data: { id: string }): void {
    this._events.update((prev) =>
      prev.filter(e => e.id !== data.id)
    );
    this.save();
  }

  public handleRemoteStatusUpdate(event: any): void {
    if (event.status) {
      this._status.set(event.status);
    }
    if (event.currentPeriod) {
      this._currentPeriod.set(event.currentPeriod);
    }
    this.save();
  }

  private mapEvent(event: any): GameEvent {
    const type = event.eventType || event.type;
    const payload = event.payload || {};
    return {
      ...event,
      type,
      playerId: payload.playerId || payload.scorerId || payload.assistorId || event.playerId,
      playerIdIn: payload.inPlayerId || event.playerIdIn,
      playerIdOut: payload.outPlayerId || event.playerIdOut,
      playerIdA: payload.playerIdA || event.playerIdA,
      playerIdB: payload.playerIdB || event.playerIdB,
      slotIndex: payload.slotIndex !== undefined ? payload.slotIndex : event.slotIndex,
      slotIndexA: payload.slotIndexA !== undefined ? payload.slotIndexA : event.slotIndexA,
      slotIndexB: payload.slotIndexB !== undefined ? payload.slotIndexB : event.slotIndexB,
      position: payload.positionName || payload.position || event.position,
      synced: event.synced !== undefined ? event.synced : !!event.id,
      status: event.status || 'active',
      gameTimeMs: event.gameTimeMs !== undefined ? event.gameTimeMs : payload.gameTimeMs,
      period: event.period !== undefined ? event.period : payload.period,
    };
  }

  private getStorageKey(): string {
    return `event-logs-${this._eventId()}`;
  }

  private getConfigStorageKey(): string {
    return `rotation-config-${this._eventId()}`;
  }

  private getRotationStateStorageKey(): string {
    return `rotation-state-${this._eventId()}`;
  }
}
