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
  syncFailed?: boolean;
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
  private _teamName = signal<string>('Apex Team');
  private _opponentName = signal<string>('Opponent');
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
  private _sportName = signal<string>('Soccer');
  private _bestOfSets = signal<number>(5);
  private _setScoreGoal = signal<number>(25);
  private _winByTwo = signal<boolean>(true);
  private _pointCap = signal<number | null>(null);
  private _decidingSetScoreGoal = signal<number>(15);
  private _decidingSetPointCap = signal<number | null>(null);

  public readonly bestOfSets = this._bestOfSets.asReadonly();
  public readonly setScoreGoal = this._setScoreGoal.asReadonly();
  public readonly winByTwo = this._winByTwo.asReadonly();
  public readonly pointCap = this._pointCap.asReadonly();
  public readonly decidingSetScoreGoal = this._decidingSetScoreGoal.asReadonly();
  public readonly decidingSetPointCap = this._decidingSetPointCap.asReadonly();

  public readonly events = this._events.asReadonly();
  public readonly eventId = this._eventId.asReadonly();
  public readonly teamId = this._teamId.asReadonly();
  public readonly teamName = this._teamName.asReadonly();
  public readonly opponentName = this._opponentName.asReadonly();
  public readonly initialLineup = this._initialLineup.asReadonly();
  public readonly players = computed(() => this._initialLineup().map((e) => e.player));
  public readonly playersOnField = this._playersOnField.asReadonly();
  public readonly currentPeriod = this._currentPeriod.asReadonly();
  public readonly status = this._status.asReadonly();
  public readonly stagedSubs = this._stagedSubs.asReadonly();
  public readonly lastIntervalTriggered = this._lastIntervalTriggered.asReadonly();
  public readonly rotationConfig = this._rotationConfig.asReadonly();
  public readonly sportName = this._sportName.asReadonly();

  public readonly runningBoxScore = computed(() => {
    const events = this._events().filter((e) => e.status !== 'deleted');
    const isVolleyball = this._sportName() === 'Volleyball';

    if (!isVolleyball) return [];

    const currentPeriod = this._currentPeriod();
    const boxScore = [];

    for (let p = 1; p <= currentPeriod; p++) {
      const setEvents = events.filter((e) => e['period'] === p);
      const teamPoints = setEvents.filter(
        (e) => e.type === 'KILL' || e.type === 'ACE' || e.type === 'POINT_WON'
      ).length;
      const opponentPoints = setEvents.filter(
        (e) =>
          e.type === 'SERVICE_ERROR' ||
          e.type === 'HITTING_ERROR' ||
          e.type === 'SET_ERROR' ||
          e.type === 'POINT_LOST' ||
          e.type === 'OPPONENT_GOAL'
      ).length;

      boxScore.push({
        setNumber: p,
        teamScore: teamPoints,
        opponentScore: opponentPoints,
        isCurrent: p === currentPeriod
      });
    }

    return boxScore;
  });

  private _forceSetCompleted = signal<boolean>(false);
  public readonly forceSetCompletedSignal = this._forceSetCompleted.asReadonly();

  public readonly currentSetResult = computed(() => {
    if (this._sportName() !== 'Volleyball') return null;

    const score = this.score();
    
    if (this._forceSetCompleted()) {
      const winner = score.team >= score.opponent ? ('team' as const) : ('opponent' as const);
      return { winner, score, forced: true };
    }

    const isDecidingSet = this._currentPeriod() === this._bestOfSets();
    const goal = isDecidingSet ? this._decidingSetScoreGoal() : this._setScoreGoal();
    const cap = isDecidingSet ? this._decidingSetPointCap() : this._pointCap();
    const winBy2 = this._winByTwo();

    const isTeamSetWon = (sTeam: number, sOpp: number) => {
      if (sTeam < goal) return false;
      if (cap !== null && cap > 0 && sTeam >= cap) return true;
      if (winBy2) return sTeam - sOpp >= 2;
      return true;
    };

    if (isTeamSetWon(score.team, score.opponent)) {
      return { winner: 'team' as const, score };
    }
    if (isTeamSetWon(score.opponent, score.team)) {
      return { winner: 'opponent' as const, score };
    }

    return null;
  });

  public forceSetCompleted(completed: boolean): void {
    this._forceSetCompleted.set(completed);
    if (this._eventId()) {
      localStorage.setItem(this.getForceCompletedStorageKey(), JSON.stringify(completed));
    }
  }

  public clearForceCompleted(): void {
    this.forceSetCompleted(false);
  }

  private getForceCompletedStorageKey(): string {
    return `${this._eventId()}_force_completed`;
  }

  public readonly matchResult = computed(() => {
    if (this._sportName() !== 'Volleyball') return null;

    const sets = this.setsWon();
    const bestOf = this._bestOfSets();
    const setsToWin = Math.ceil(bestOf / 2);

    if (sets.team >= setsToWin) {
      return { winner: 'team' as const, sets };
    }
    if (sets.opponent >= setsToWin) {
      return { winner: 'opponent' as const, sets };
    }

    return null;
  });

  public readonly playerCardCounts = computed(() => {
    const events = this._events().filter((e) => e.status !== 'deleted');
    const cards: Record<string, { yellow: number; red: boolean }> = {};

    events.forEach((e) => {
      const pid = e.playerId;
      if (!pid) return;
      if (!cards[pid]) {
        cards[pid] = { yellow: 0, red: false };
      }

      if (e.type === 'RED_CARD') {
        cards[pid].red = true;
      } else if (e.type === 'YELLOW_CARD') {
        cards[pid].yellow++;
        if (cards[pid].yellow >= 2) {
          cards[pid].red = true;
        }
      }
    });

    return cards;
  });

  public readonly ejectedPlayerIds = computed(() => {
    const counts = this.playerCardCounts();
    const ejected = new Set<string>();
    Object.entries(counts).forEach(([pid, info]) => {
      if (info.red) {
        ejected.add(pid);
      }
    });
    return ejected;
  });

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
          if (this._sportName() === 'Volleyball') {
            slotMap.set(event.slotIndexA, { ...playerB });
            slotMap.set(event.slotIndexB, { ...temp });
          } else {
            slotMap.set(event.slotIndexA, { ...playerB, position: playerA.position });
            slotMap.set(event.slotIndexB, { ...temp, position: playerB.position });
          }
        }
      }
    });

    // Remove any active player that is ejected
    const ejected = this.ejectedPlayerIds();
    for (const [slotIndex, data] of slotMap.entries()) {
      if (ejected.has(data.player.id)) {
        slotMap.delete(slotIndex);
      }
    }

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
    const isVolleyball = this._sportName() === 'Volleyball';

    if (isVolleyball) {
      const currentPeriod = this._currentPeriod();
      const setEvents = events.filter((e) => e['period'] === currentPeriod);
      
      const team = setEvents.filter(
        (e) => e.type === 'KILL' || e.type === 'ACE' || e.type === 'POINT_WON'
      ).length;

      const opponent = setEvents.filter(
        (e) =>
          e.type === 'SERVICE_ERROR' ||
          e.type === 'HITTING_ERROR' ||
          e.type === 'SET_ERROR' ||
          e.type === 'POINT_LOST' ||
          e.type === 'OPPONENT_GOAL'
      ).length;

      return { team, opponent };
    } else {
      const team = events.filter((e) => e.type === 'GOAL').length;
      const opponent = events.filter((e) => e.type === 'OPPONENT_GOAL' || e.type === 'OWN_GOAL').length;
      return { team, opponent };
    }
  });

  public readonly setsWon = computed(() => {
    const events = this._events().filter((e) => e.status !== 'deleted');
    const isVolleyball = this._sportName() === 'Volleyball';

    if (!isVolleyball) {
      return { team: 0, opponent: 0 };
    }

    let teamSets = 0;
    let opponentSets = 0;

    for (let p = 1; p < this._currentPeriod(); p++) {
      const setEvents = events.filter((e) => e['period'] === p);
      const teamPoints = setEvents.filter(
        (e) => e.type === 'KILL' || e.type === 'ACE' || e.type === 'POINT_WON'
      ).length;
      const opponentPoints = setEvents.filter(
        (e) =>
          e.type === 'SERVICE_ERROR' ||
          e.type === 'HITTING_ERROR' ||
          e.type === 'SET_ERROR' ||
          e.type === 'POINT_LOST' ||
          e.type === 'OPPONENT_GOAL'
      ).length;

      if (teamPoints > opponentPoints) {
        teamSets++;
      } else if (opponentPoints > teamPoints) {
        opponentSets++;
      }
    }

    // Include current set if completed
    const currentRes = this.currentSetResult();
    if (currentRes) {
      if (currentRes.winner === 'team') {
        teamSets++;
      } else if (currentRes.winner === 'opponent') {
        opponentSets++;
      }
    }

    return { team: teamSets, opponent: opponentSets };
  });

  public readonly statsSummary = computed(() => {
    const events = this._events().filter((e) => e.status !== 'deleted');
    const isVolleyball = this._sportName() === 'Volleyball';

    if (isVolleyball) {
      const kills = events.filter((e) => e.type === 'KILL').length;
      const aces = events.filter((e) => e.type === 'ACE').length;
      const blocks = events.filter((e) => e.type === 'BLOCK').length;
      const digs = events.filter((e) => e.type === 'DIG').length;
      const assists = events.filter((e) => e.type === 'ASSIST' || e.type === 'SET_ASSIST').length;
      const serviceErrors = events.filter((e) => e.type === 'SERVICE_ERROR').length;
      const hittingErrors = events.filter((e) => e.type === 'HITTING_ERROR').length;

      return {
        kills,
        aces,
        blocks,
        digs,
        assists,
        serviceErrors,
        hittingErrors,
        teamShots: 0,
        opponentShots: 0,
        teamCorners: 0,
        opponentCorners: 0,
        teamSaves: 0,
      };
    } else {
      const teamShots = events.filter((e) => e.type === 'SHOT' || e.type === 'GOAL').length;
      const opponentShots = events.filter((e) => e.type === 'OPPONENT_SHOT' || e.type === 'OPPONENT_GOAL').length;
      const teamCorners = events.filter((e) => e.type === 'CORNER_KICK').length;
      const opponentCorners = events.filter((e) => e.type === 'OPPONENT_CORNER_KICK').length;
      const teamSaves = events.filter((e) => e.type === 'BLOCKED_SHOT' || e.type === 'BLOCKED_PENALTY').length;

      return {
        kills: 0,
        aces: 0,
        blocks: 0,
        digs: 0,
        assists: 0,
        serviceErrors: 0,
        hittingErrors: 0,
        teamShots,
        opponentShots,
        teamCorners,
        opponentCorners,
        teamSaves,
      };
    }
  });

  public readonly playerStats = computed(() => {
    const events = this._events().filter((e) => e.status !== 'deleted');
    const stats: Record<string, {
      kills: number;
      aces: number;
      blocks: number;
      digs: number;
      assists: number;
      serviceErrors: number;
      hittingErrors: number;
      hits: number;
      setAttempts: number;
      setAssists: number;
      setErrors: number;
      passCount: number;
      passScoreSum: number;
      blockTouches: number;
      serveAttempts: number;
    }> = {};

    events.forEach((e) => {
      const pid = e.playerId || e['scorerId'] || e['payload']?.scorerId || e['payload']?.playerId;
      if (!pid) return;

      if (!stats[pid]) {
        stats[pid] = {
          kills: 0,
          aces: 0,
          blocks: 0,
          digs: 0,
          assists: 0,
          serviceErrors: 0,
          hittingErrors: 0,
          hits: 0,
          setAttempts: 0,
          setAssists: 0,
          setErrors: 0,
          passCount: 0,
          passScoreSum: 0,
          blockTouches: 0,
          serveAttempts: 0,
        };
      }

      if (e.type === 'KILL') {
        stats[pid].kills++;
      } else if (e.type === 'ACE') {
        stats[pid].aces++;
      } else if (e.type === 'BLOCK') {
        stats[pid].blocks++;
      } else if (e.type === 'DIG') {
        stats[pid].digs++;
      } else if (e.type === 'ASSIST') {
        stats[pid].assists++;
      } else if (e.type === 'SERVICE_ERROR') {
        stats[pid].serviceErrors++;
      } else if (e.type === 'HITTING_ERROR') {
        stats[pid].hittingErrors++;
      } else if (e.type === 'HIT') {
        stats[pid].hits++;
      } else if (e.type === 'SET_ATTEMPT') {
        stats[pid].setAttempts++;
      } else if (e.type === 'SET_ASSIST') {
        stats[pid].setAssists++;
        stats[pid].assists++;
      } else if (e.type === 'SET_ERROR') {
        stats[pid].setErrors++;
      } else if (e.type === 'SERVE_RECEIVE') {
        stats[pid].passCount++;
        const score = e['payload']?.score ?? e['score'] ?? 0;
        stats[pid].passScoreSum += score;
      } else if (e.type === 'BLOCK_TOUCH') {
        stats[pid].blockTouches++;
      } else if (e.type === 'SERVE_ATTEMPT') {
        stats[pid].serveAttempts++;
      }
    });

    return stats;
  });

  private _liberoId = signal<string | null>(null);
  public readonly liberoId = this._liberoId.asReadonly();

  public readonly liberoDesignation = computed(() => {
    const liberoId = this._liberoId();
    if (!liberoId) return null;

    // Check if the libero is currently on the court
    const active = this.activePlayers();
    const isLiberoOnCourt = active.some(p => p.id === liberoId);

    let replacedId = '';
    if (isLiberoOnCourt) {
      // Find the most recent active SUB event where the libero entered the court
      const events = this._events().filter(e => e.status !== 'deleted');
      const lastLiberoInEvent = [...events]
        .reverse()
        .find(e => e.type === 'SUB' && e.playerIdIn === liberoId);
      if (lastLiberoInEvent) {
        replacedId = lastLiberoInEvent.playerIdOut || '';
      }
    }

    return {
      liberoId,
      replacedId
    };
  });

  public setLiberoId(playerId: string | null): void {
    this._liberoId.set(playerId);
    if (this._eventId()) {
      localStorage.setItem(this.getLiberoStorageKey(), JSON.stringify(playerId));
    }
  }

  private getLiberoStorageKey(): string {
    return `${this._eventId()}_libero_id`;
  }

  public initialize(
    eventId: string,
    lineup: LineupEntry[] = [],
    teamId?: string,
    playersOnField?: number,
    teamName?: string,
    sportName?: string,
    winningRules?: {
      bestOfSets?: number;
      setScoreGoal?: number;
      winByTwo?: boolean;
      pointCap?: number | null;
      decidingSetScoreGoal?: number;
      decidingSetPointCap?: number | null;
    },
    opponentName?: string
  ): void {
    this._eventId.set(eventId);
    if (teamId) this._teamId.set(teamId);
    this._initialLineup.set(lineup);
    if (playersOnField) this._playersOnField.set(playersOnField);
    if (teamName) this._teamName.set(teamName);
    if (opponentName) this._opponentName.set(opponentName);
    else this._opponentName.set('Opponent');
    if (sportName) this._sportName.set(sportName);
    else this._sportName.set('Soccer');

    if (winningRules) {
      this._bestOfSets.set(winningRules.bestOfSets ?? 5);
      this._setScoreGoal.set(winningRules.setScoreGoal ?? 25);
      this._winByTwo.set(winningRules.winByTwo ?? true);
      this._pointCap.set(winningRules.pointCap ?? null);
      this._decidingSetScoreGoal.set(winningRules.decidingSetScoreGoal ?? 15);
      this._decidingSetPointCap.set(winningRules.decidingSetPointCap ?? null);
    } else {
      this._bestOfSets.set(5);
      this._setScoreGoal.set(25);
      this._winByTwo.set(true);
      this._pointCap.set(null);
      this._decidingSetScoreGoal.set(15);
      this._decidingSetPointCap.set(null);
    }

    const savedLibero = localStorage.getItem(this.getLiberoStorageKey());
    if (savedLibero !== null) {
      try {
        this._liberoId.set(JSON.parse(savedLibero));
      } catch (e) {
        this._liberoId.set(null);
      }
    } else {
      const initialLibero = lineup.find(e => e.positionName === 'Libero' || e.slotIndex === 99);
      this._liberoId.set(initialLibero ? initialLibero.playerId : null);
    }

    const savedForce = localStorage.getItem(this.getForceCompletedStorageKey());
    if (savedForce !== null) {
      try {
        this._forceSetCompleted.set(JSON.parse(savedForce));
      } catch (e) {
        this._forceSetCompleted.set(false);
      }
    } else {
      this._forceSetCompleted.set(false);
    }

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
        mapped.sort((a: any, b: any) => {
          const timeA = a.timestamp;
          const timeB = b.timestamp;
          if (Math.abs(timeA - timeB) > 10) {
            return timeA - timeB;
          }
          if (
            a.type === 'POSITION_SWAP' &&
            b.type === 'POSITION_SWAP' &&
            a['gameTimeMs'] === b['gameTimeMs']
          ) {
            return (a['slotIndexA'] ?? 0) - (b['slotIndexA'] ?? 0);
          }
          const dateA = a['createdAt'] ? new Date(a['createdAt']).getTime() : 0;
          const dateB = b['createdAt'] ? new Date(b['createdAt']).getTime() : 0;
          return dateA - dateB;
        });
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
    this.cleanStagedSubs();
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
    this.cleanStagedSubs();
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
    this.cleanStagedSubs();
  }

  public setEvents(events: GameEvent[]): void {
    const mapped = events.map((e) => this.mapEvent(e));
    mapped.sort((a, b) => {
      const timeA = a.timestamp;
      const timeB = b.timestamp;
      if (Math.abs(timeA - timeB) > 10) {
        return timeA - timeB;
      }
      if (
        a.type === 'POSITION_SWAP' &&
        b.type === 'POSITION_SWAP' &&
        a['gameTimeMs'] === b['gameTimeMs']
      ) {
        return (a['slotIndexA'] ?? 0) - (b['slotIndexA'] ?? 0);
      }
      const dateA = a['createdAt'] ? new Date(a['createdAt']).getTime() : 0;
      const dateB = b['createdAt'] ? new Date(b['createdAt']).getTime() : 0;
      return dateA - dateB;
    });
    this._events.set(mapped);
    
    // Recover current period from last active event if possible
    const lastEvent = mapped.filter((e) => e.status !== 'deleted').pop();
    if (lastEvent && lastEvent['period']) {
      this._currentPeriod.set(lastEvent['period']);
    }

    // Recover liberoId from last active LIBERO_CHANGED event if possible
    const lastLiberoEvent = mapped
      .filter((e) => e.type === 'LIBERO_CHANGED' && e.status !== 'deleted')
      .pop();
    if (lastLiberoEvent) {
      const payload = lastLiberoEvent['payload'] || {};
      const lId = payload.liberoId || lastLiberoEvent['liberoId'];
      this._liberoId.set(lId || null);
    }

    this.save();
    this.cleanStagedSubs();
  }

  private cleanStagedSubs(): void {
    const active = this.activePlayers();
    const activeIds = new Set(active.map((p) => p.id));
    const ejected = this.ejectedPlayerIds();

    this._stagedSubs.update((subs) =>
      subs.filter((s) => {
        // Outgoing player must be active and not ejected
        const isOutValid = activeIds.has(s.outPlayerId) && !ejected.has(s.outPlayerId);
        // Incoming player must be on the bench (not active) and not ejected
        const isInValid = !activeIds.has(s.inPlayerId) && !ejected.has(s.inPlayerId);
        return isOutValid && isInValid;
      })
    );
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

      if (lastActive.type === 'POSITION_SWAP') {
        const toDelete = new Set<any>();
        for (let i = activeEvents.length - 1; i >= 0; i--) {
          if (activeEvents[i].type === 'POSITION_SWAP') {
            toDelete.add(activeEvents[i]);
          } else {
            break;
          }
        }
        return prev.map((e) =>
          toDelete.has(e) ? { ...e, status: 'deleted', synced: false } : e
        );
      }

      return prev.map((e) =>
        e === lastActive ? { ...e, status: 'deleted', synced: false } : e
      );
    });
    this.save();
    this.cleanStagedSubs();
  }

  public deleteEvent(id: string): void {
    this._events.update((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, status: 'deleted', synced: false } : e
      )
    );
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
      prev.map((e) => {
        if (e.timestamp === localTimestamp) {
          // If the event was deleted locally while the sync request was in-flight,
          // we must keep synced as false so that the delete sync operation can run next.
          const wasDeleted = e.status === 'deleted';
          return {
            ...e,
            id: backendId,
            synced: !wasDeleted,
            syncFailed: false
          };
        }
        return e;
      })
    );
    this.save();
  }

  public markDeletionSynced(localTimestamp: number): void {
    this._events.update((prev) =>
      prev.map((e) =>
        e.timestamp === localTimestamp ? { ...e, synced: true, syncFailed: false } : e
      )
    );
    this.save();
  }

  public markEventSyncFailed(localTimestamp: number): void {
    this._events.update((prev) =>
      prev.map((e) =>
        e.timestamp === localTimestamp
          ? { ...e, syncFailed: true }
          : e
      )
    );
    this.save();
  }

  public retryEventSync(localTimestamp: number): void {
    this._events.update((prev) =>
      prev.map((e) =>
        e.timestamp === localTimestamp
          ? { ...e, syncFailed: false }
          : e
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

      let updatedList;
      if (existingIndex > -1) {
        const newEvents = [...prev];
        const localEvent = newEvents[existingIndex];
        // Preserve local deleted status and unsynced deletion state
        const status = localEvent.status === 'deleted' ? 'deleted' : (mappedEvent.status || 'active');
        const synced = localEvent.status === 'deleted' ? localEvent.synced : mappedEvent.synced;

        newEvents[existingIndex] = {
          ...localEvent,
          ...mappedEvent,
          status,
          synced,
          timestamp: localEvent.timestamp // Keep original local timestamp
        };
        updatedList = newEvents;
      } else {
        updatedList = [
          ...prev,
          {
            ...mappedEvent,
            timestamp: mappedEvent.timestamp || Date.now()
          }
        ];
      }

      // Always sort the updated list to ensure correct chronological processing order
      updatedList.sort((a, b) => {
        const timeA = a.timestamp;
        const timeB = b.timestamp;
        if (Math.abs(timeA - timeB) > 10) {
          return timeA - timeB;
        }
        if (
          a.type === 'POSITION_SWAP' &&
          b.type === 'POSITION_SWAP' &&
          a['gameTimeMs'] === b['gameTimeMs']
        ) {
          return (a['slotIndexA'] ?? 0) - (b['slotIndexA'] ?? 0);
        }
        const dateA = a['createdAt'] ? new Date(a['createdAt']).getTime() : 0;
        const dateB = b['createdAt'] ? new Date(b['createdAt']).getTime() : 0;
        return dateA - dateB;
      });

      return updatedList;
    });

    const type = event.eventType || event.type;
    if (type === 'LIBERO_CHANGED') {
      const payload = event.payload || {};
      const lId = payload.liberoId || event.liberoId;
      this._liberoId.set(lId || null);
    }

    this.save();
    this.cleanStagedSubs();
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
      timestamp: event.timestamp !== undefined ? event.timestamp : (payload.timestamp !== undefined ? Number(payload.timestamp) : Date.now()),
      createdAt: event.createdAt || payload.createdAt,
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

  public updateInitialLineup(lineup: LineupEntry[]): void {
    this._initialLineup.set(lineup);
  }
}
