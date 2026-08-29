import { Component, inject, signal, effect, Input, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { 
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonIcon,
  IonSpinner,
  IonButton,
  IonSegment,
  IonSegmentButton,
  IonSelect,
  IonSelectOption,
  IonModal,
  IonGrid,
  IonRow,
  IonCol,
  IonInput,
  AlertController,
  ToastController,
  ModalController,
  IonToggle,
} from '@ionic/angular/standalone';
import { LiveGameStateService, ShootoutScorecardComponent, EventSyncService } from '@apex-team/client/feature/game-console';
import { addIcons } from 'ionicons';
import { 
  trophyOutline, 
  timeOutline, 
  locationOutline, 
  shirtOutline, 
  footballOutline, 
  swapHorizontalOutline,
  statsChartOutline,
  settingsOutline,
  arrowUpCircle,
  arrowDownCircle,
  peopleOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  alertCircleOutline,
  bandageOutline,
  chevronBackOutline,
  flagOutline,
  pencilOutline,
  trashOutline,
  listOutline,
  chevronUpOutline,
  chevronDownOutline,
  sparklesOutline,
} from 'ionicons/icons';
import { AttendanceList, CoachingNotes } from '@apex-team/client/ui/attendance';
import { EventsService, EventEntity, AttendanceService, TeamService, PlayingTimeValidationReport, OpponentsService, AwardsService } from '@apex-team/client/data-access/team';
import { OpponentWithStats, PlayerAward } from '@apex-team/shared/util/models';
import { SocketService } from '../../../shared/services/socket.service';
import { MatchRecapModalComponent } from './match-recap-modal/match-recap-modal';
import { AwardBadgeModalComponent } from './award-badge-modal/award-badge-modal';


@Component({
  selector: 'app-game-summary',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
    IonBadge,
    IonIcon,
    IonSpinner,
    IonButton,
    IonSegment,
    IonSegmentButton,
    IonSelect,
    IonSelectOption,
    IonInput,
    AttendanceList,
    IonModal,
    ShootoutScorecardComponent,
    IonGrid,
    IonRow,
    IonCol,
    CoachingNotes,
    IonToggle,
  ],
  templateUrl: './game-summary.html',
  styleUrl: './game-summary.scss',
})
export class GameSummary implements OnDestroy {
  @Input() set id(val: string) {
    this._teamId.set(val);
  }
  @Input() set eventId(val: string) {
    this._eventId.set(val);
  }

  private _teamId = signal<string | null>(null);
  private _eventId = signal<string | null>(null);

  public get teamId(): string {
    return this._teamId() ?? '';
  }
  public get eventId(): string {
    return this._eventId() ?? '';
  }

  private readonly eventsService = inject(EventsService);
  private readonly teamService = inject(TeamService);
  private readonly opponentsService = inject(OpponentsService);
  private readonly router = inject(Router);
  private readonly socketService = inject(SocketService);
  private readonly alertController = inject(AlertController);
  private readonly toastController = inject(ToastController);
  private readonly modalCtrl = inject(ModalController);
  private readonly awardsService = inject(AwardsService);

  protected sportName = signal<string>('Soccer');
  protected game = signal<EventEntity | null>(null);
  protected opponentDossier = signal<OpponentWithStats | null>(null);
  protected eventAwards = signal<PlayerAward[]>([]);
  protected gameEvents = signal<any[]>([]);
  protected sortedGameEvents = computed(() => {
    // 1. Sort the raw events first
    const sorted = [...this.gameEvents()].sort((a, b) => {
      const periodA = a.period ?? a.payload?.period ?? 1;
      const periodB = b.period ?? b.payload?.period ?? 1;
      if (periodA !== periodB) {
        return periodA - periodB;
      }
      if (a.minuteOccurred !== b.minuteOccurred) {
        return a.minuteOccurred - b.minuteOccurred;
      }
      const seqA = a.payload?.['sequence'] ?? a.payload?.['order'] ?? 999;
      const seqB = b.payload?.['sequence'] ?? b.payload?.['order'] ?? 999;
      if (seqA !== seqB) {
        return seqA - seqB;
      }
      return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
    });

    // 2. Filter hideFromLog and group swaps
    const processed: any[] = [];
    for (let i = 0; i < sorted.length; i++) {
      const e = sorted[i];
      const type = e.eventType || e.type;
      const payload = e.payload || {};
      
      if (type === 'POSITION_SWAP' && payload.hideFromLog) {
        continue;
      }

      if (type === 'LIBERO_CHANGED') {
        continue;
      }

      if (type === 'POSITION_SWAP') {
        const group = [e];
        const gameTime = payload.gameTimeMs;
        if (gameTime !== undefined && gameTime !== null) {
          while (
            i + 1 < sorted.length &&
            (sorted[i + 1].eventType || sorted[i + 1].type) === 'POSITION_SWAP' &&
            (sorted[i + 1].payload?.gameTimeMs === gameTime || sorted[i + 1].payload?.['gameTimeMs'] === gameTime)
          ) {
            group.push(sorted[i + 1]);
            i++;
          }
        }

        if (group.length >= 4) {
          processed.push({
            id: group[0].id || `rot-${group[0].createdAt || Date.now()}`,
            eventType: 'COURT_ROTATE',
            type: 'COURT_ROTATE',
            minuteOccurred: group[0].minuteOccurred,
            payload: group[0].payload,
            createdAt: group[0].createdAt
          });
        } else {
          processed.push(...group);
        }
      } else {
        processed.push(e);
      }
    }

    return processed;
  });
  protected playingTime = signal<Record<string, any>>({});
  protected playingTimeValidation = signal<PlayingTimeValidationReport | null>(null);
  protected lineup = signal<any[]>([]);
  protected activeSegment = signal<'highlights' | 'attendance' | 'playtime' | 'notes' | 'event-log' | 'boxscore'>('highlights');
  protected isLoading = signal(true);
  protected errorMessage = signal<string | null>(null);

  protected stateService = inject(LiveGameStateService);
  protected syncService = inject(EventSyncService);
  protected isShootoutModalOpen = signal(false);

  // Edit event state signals
  protected isEditModalOpen = signal(false);
  protected editEvent = signal<any | null>(null);
  protected editPeriod = signal<number>(1);
  protected editMinute = signal<number>(0);
  protected editPlayerIn = signal<string | null>(null);
  protected editPlayerOut = signal<string | null>(null);
  protected editPosition = signal<string | null>(null);
  protected editScorerId = signal<string | null>(null);
  protected editAssistorId = signal<string | null>(null);
  protected editPlayerId = signal<string | null>(null);
  protected editPlayerA = signal<string | null>(null);
  protected editPlayerB = signal<string | null>(null);
  protected editPositionA = signal<string | null>(null);
  protected editPositionB = signal<string | null>(null);

  // Create event state signals
  protected isCreateMode = signal(false);
  protected createEventType = signal<string>('SUB');

  protected availablePeriods = computed(() => {
    const isVb = this.sportName() === 'Volleyball';
    const defaultCount = isVb ? 3 : (this.game()?.periodCount || 2);
    const existingPeriods = this.gameEvents()
      .map(e => e.period ?? e.payload?.period)
      .filter((p): p is number => typeof p === 'number' && p > 0);
    const currentEditP = this.editPeriod();
    const maxP = Math.max(defaultCount, ...existingPeriods, currentEditP, isVb ? 3 : 2);

    const totalPeriodsToShow = isVb
      ? Math.max(maxP, 5)
      : Math.max(maxP, defaultCount === 2 ? 4 : defaultCount);

    const periods: number[] = [];
    for (let i = 1; i <= totalPeriodsToShow; i++) {
      periods.push(i);
    }
    return periods;
  });

  protected getPeriodLabel(periodNum: number): string {
    if (this.sportName() === 'Volleyball') {
      return `Set ${periodNum}`;
    }
    const count = this.game()?.periodCount || 2;
    if (count === 2) {
      if (periodNum === 1) return '1st Half';
      if (periodNum === 2) return '2nd Half';
      if (periodNum === 3) return 'Extra Time 1 (OT1)';
      if (periodNum === 4) return 'Extra Time 2 (OT2)';
      return `Period ${periodNum}`;
    }
    if (count === 4) {
      if (periodNum === 1) return '1st Quarter';
      if (periodNum === 2) return '2nd Quarter';
      if (periodNum === 3) return '3rd Quarter';
      if (periodNum === 4) return '4th Quarter';
      return `Overtime ${periodNum - 4}`;
    }
    return `Period ${periodNum}`;
  }

  protected getPeriodShortLabel(periodNum: number): string {
    if (this.sportName() === 'Volleyball') {
      return `S${periodNum}`;
    }
    const count = this.game()?.periodCount || 2;
    if (count === 2) {
      if (periodNum === 1) return '1H';
      if (periodNum === 2) return '2H';
      if (periodNum === 3) return 'OT1';
      if (periodNum === 4) return 'OT2';
      return `P${periodNum}`;
    }
    if (count === 4) {
      if (periodNum === 1) return '1Q';
      if (periodNum === 2) return '2Q';
      if (periodNum === 3) return '3Q';
      if (periodNum === 4) return '4Q';
      return `OT${periodNum - 4}`;
    }
    return `P${periodNum}`;
  }



  protected setResults = computed(() => {
    const events = this.gameEvents();
    
    // Find all unique periods that have events
    const periods = Array.from(new Set(events.map(e => e.period || e.payload?.period).filter(p => p !== undefined && p !== null))) as number[];
    
    const results = periods.map(p => {
      const setEvents = events.filter(e => (e.period === p || e.payload?.period === p) && e.status !== 'deleted');
      const teamScore = setEvents.filter(
        (e) => e.eventType === 'KILL' || e.eventType === 'ACE' || e.eventType === 'POINT_WON'
      ).length;
      const opponentScore = setEvents.filter(
        (e) =>
          e.eventType === 'SERVICE_ERROR' ||
          e.eventType === 'HITTING_ERROR' ||
          e.eventType === 'SET_ERROR' ||
          e.eventType === 'POINT_LOST' ||
          e.eventType === 'OPPONENT_GOAL'
      ).length;

      // Only include the set if there are actually points scored in it
      if (teamScore === 0 && opponentScore === 0) return null;

      const winner = teamScore > opponentScore ? 'team' : 'opponent';

      return {
        id: `set-${p}`,
        setNumber: p,
        teamScore,
        opponentScore,
        winner
      };
    }).filter((r): r is NonNullable<typeof r> => r !== null);

    return results.sort((a, b) => a.setNumber - b.setNumber);
  });

  protected hasShootout = computed(() => {
    return this.gameEvents().some(e => e.eventType === 'SHOOTOUT_KICK');
  });

  protected shootoutScore = computed(() => {
    const events = this.gameEvents().filter(e => e.eventType === 'SHOOTOUT_KICK');
    const team = events.filter(e => e.payload?.team === 'team' && e.payload?.outcome === 'goal').length;
    const opponent = events.filter(e => e.payload?.team === 'opponent' && e.payload?.outcome === 'goal').length;
    return { team, opponent };
  });

  protected statsSummary = computed(() => {
    const events = this.gameEvents();
    const isVb = this.sportName() === 'Volleyball';
    
    if (isVb) {
      const kills = events.filter(e => e.eventType === 'KILL').length;
      const aces = events.filter(e => e.eventType === 'ACE').length;
      const blocks = events.filter(e => e.eventType === 'BLOCK').length;
      const digs = events.filter(e => e.eventType === 'DIG').length;
      const errors = events.filter(e => e.eventType === 'SERVICE_ERROR' || e.eventType === 'HITTING_ERROR').length;
      return {
        kills,
        aces,
        blocks,
        digs,
        errors,
        teamShots: 0,
        opponentShots: 0,
        teamCorners: 0,
        opponentCorners: 0,
        teamSaves: 0
      };
    }

    const teamShots = events.filter(e => e.eventType === 'SHOT' || e.eventType === 'GOAL').length;
    const opponentShots = events.filter(e => e.eventType === 'OPPONENT_SHOT' || e.eventType === 'OPPONENT_GOAL').length;
    const teamCorners = events.filter(e => e.eventType === 'CORNER_KICK').length;
    const opponentCorners = events.filter(e => e.eventType === 'OPPONENT_CORNER_KICK').length;
    const teamSaves = events.filter(e => e.eventType === 'BLOCKED_SHOT' || e.eventType === 'BLOCKED_PENALTY').length;
    return {
      teamShots,
      opponentShots,
      teamCorners,
      opponentCorners,
      teamSaves,
      kills: 0,
      aces: 0,
      blocks: 0,
      digs: 0,
      errors: 0
    };
  });

  protected shootoutRounds = computed(() => {
    const events = this.gameEvents().filter(e => e.eventType === 'SHOOTOUT_KICK');
    const roundsMap = new Map<number, { round: number; teamKick: any; opponentKick: any }>();

    events.forEach(e => {
      const payload = e.payload || {};
      const r = (payload.round as number) || 1;
      if (!roundsMap.has(r)) {
        roundsMap.set(r, { round: r, teamKick: null, opponentKick: null });
      }
      const roundObj = roundsMap.get(r)!;
      if (payload.team === 'team') {
        roundObj.teamKick = e;
      } else {
        roundObj.opponentKick = e;
      }
    });

    return Array.from(roundsMap.values()).sort((a, b) => a.round - b.round);
  });

  protected volleyballBoxScore = computed(() => {
    const players = this.lineup();
    const events = this.gameEvents();

    return players.map(p => {
      const playerId = p.playerId;
      const playerEvents = events.filter(e => {
        const payload = e.payload || {};
        return (
          e.playerId === playerId ||
          payload.playerId === playerId ||
          payload.scorerId === playerId ||
          payload.assistorId === playerId
        );
      });

      const kills = playerEvents.filter(e => e.eventType === 'KILL').length;
      const aces = playerEvents.filter(e => e.eventType === 'ACE').length;
      const blocks = playerEvents.filter(e => e.eventType === 'BLOCK').length;
      const digs = playerEvents.filter(e => e.eventType === 'DIG').length;
      const assists = playerEvents.filter(e => e.eventType === 'ASSIST' || e.eventType === 'SET_ASSIST').length;
      const serviceErrors = playerEvents.filter(e => e.eventType === 'SERVICE_ERROR').length;
      const hittingErrors = playerEvents.filter(e => e.eventType === 'HITTING_ERROR').length;
      const hits = playerEvents.filter(e => e.eventType === 'HIT').length;

      const totalAttempts = kills + hittingErrors + hits;
      const hittingPercentage = totalAttempts > 0 ? (kills - hittingErrors) / totalAttempts : 0;

      const passesEvents = playerEvents.filter(e => e.eventType === 'SERVE_RECEIVE');
      const passes = passesEvents.length;
      const totalPassScore = passesEvents.reduce((sum, e) => {
        const payload = e.payload || {};
        const score = payload.score ?? e['score'] ?? 0;
        return sum + score;
      }, 0);
      const averagePassRating = passes > 0 ? totalPassScore / passes : 0;

      return {
        player: p.player,
        kills,
        aces,
        blocks,
        digs,
        assists,
        serviceErrors,
        hittingErrors,
        hittingPercentage,
        passes,
        averagePassRating,
        hits
      };
    });
  });

  protected getPlayerName(playerId: string | undefined): string {
    if (!playerId) return '';
    const entry = this.lineup().find(l => l.playerId === playerId);
    return entry ? `${entry.player.firstName} ${entry.player.lastName}` : '';
  }

  protected openShootoutModal(): void {
    const gameVal = this.game();
    if (gameVal) {
      const mappedEvents = this.gameEvents().map(be => ({
        id: be.id,
        type: be.eventType,
        minuteOccurred: be.minuteOccurred,
        timestamp: Date.now() + Math.random(),
        synced: true,
        status: 'active' as const,
        payload: be.payload,
        ...be.payload
      }));
      
      this.stateService.initialize(this.eventId, this.lineup(), this.teamId, gameVal.playersOnField || undefined, gameVal.season?.team?.name);
      this.stateService.setEvents(mappedEvents);
      this.isShootoutModalOpen.set(true);
    }
  }

  protected async onShootoutModalClose(): Promise<void> {
    this.isShootoutModalOpen.set(false);
    await this.loadData(this.teamId, this.eventId, true);
  }

  protected async openAiRecapModal(): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: MatchRecapModalComponent,
      componentProps: {
        teamId: this.teamId,
        eventId: this.eventId,
      },
      breakpoints: [0, 0.7, 1.0],
      initialBreakpoint: 1.0,
    });
    await modal.present();
  }

  protected async openAwardBadgesModal(): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: AwardBadgeModalComponent,
      componentProps: {
        teamId: this.teamId,
        eventId: this.eventId,
        seasonId: this.game()?.seasonId,
      },
      breakpoints: [0, 0.85, 1.0],
      initialBreakpoint: 1.0,
    });
    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (data?.awards) {
      this.eventAwards.set(data.awards);
    } else {
      await this.loadData(this.teamId, this.eventId, true);
    }
  }

  protected goals = computed(() => {
    const lineup = this.lineup();
    return this.gameEvents()
      .filter(e => e.eventType === 'GOAL' || e.eventType === 'OPPONENT_GOAL' || e.eventType === 'OWN_GOAL' || e.eventType === 'ASSIST')
      .map(e => {
        if (e.eventType === 'GOAL' || e.eventType === 'OWN_GOAL') {
          const scorerId = e.payload?.scorerId || e.payload?.playerId || e.playerId;
          const entry = lineup.find(l => l.playerId === scorerId);
          
          const assistorId = e.payload?.assistorId;
          const assistorEntry = assistorId ? lineup.find(l => l.playerId === assistorId) : null;

          if (entry) {
            return {
              ...e,
              payload: {
                ...e.payload,
                player: entry.player,
                assistorPlayer: assistorEntry ? assistorEntry.player : null
              }
            };
          }
        } else if (e.eventType === 'ASSIST') {
          const assistorId = e.payload?.assistorId || e.payload?.playerId || e.playerId;
          const entry = lineup.find(l => l.playerId === assistorId);
          if (entry) {
            return {
              ...e,
              payload: {
                ...e.payload,
                player: entry.player
              }
            };
          }
        }
        return e;
      })
      .sort((a, b) => {
        const periodA = a.period ?? a.payload?.period ?? 1;
        const periodB = b.period ?? b.payload?.period ?? 1;
        if (periodA !== periodB) {
          return periodA - periodB;
        }
        if (a.minuteOccurred !== b.minuteOccurred) {
          return a.minuteOccurred - b.minuteOccurred;
        }
        const seqA = a.payload?.['sequence'] ?? a.payload?.['order'] ?? 999;
        const seqB = b.payload?.['sequence'] ?? b.payload?.['order'] ?? 999;
        if (seqA !== seqB) {
          return seqA - seqB;
        }
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      });
  });

  protected score = computed(() => {
    const isVB = this.sportName() === 'Volleyball';
    const g = this.game();

    if (isVB) {
      const results = this.setResults();
      let teamSets = 0;
      let opponentSets = 0;
      results.forEach(r => {
        if (r.winner === 'team') {
          teamSets++;
        } else {
          opponentSets++;
        }
      });
      return { team: teamSets, opponent: opponentSets };
    }

    if (g && (g.status === 'completed' || g.status === 'abandoned_weather') && g.goalsFor !== null && g.goalsAgainst !== null) {
      return { team: g.goalsFor ?? 0, opponent: g.goalsAgainst ?? 0 };
    }

    const events = this.goals();
    const team = events.filter(e => e.eventType === 'GOAL').length;
    const opponent = events.filter(e => e.eventType === 'OPPONENT_GOAL').length;
    return { team, opponent };
  });

  protected sortedPlayingTime = computed(() => {
    const pt = this.playingTime();
    const lineup = this.lineup();
    
    return lineup.map(entry => {
      const stats = pt[entry.playerId] || { totalSeconds: 0, positionSeconds: {} };
      return {
        ...entry,
        totalSeconds: stats.totalSeconds,
        positionSeconds: stats.positionSeconds
      };
    }).sort((a, b) => b.totalSeconds - a.totalSeconds);
  });

  constructor() {
    addIcons({ 
      trophyOutline, 
      timeOutline, 
      locationOutline, 
      shirtOutline, 
      footballOutline, 
      swapHorizontalOutline,
      statsChartOutline,
      settingsOutline,
      arrowUpCircle,
      arrowDownCircle,
      peopleOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      alertCircleOutline,
      bandageOutline,
      chevronBackOutline,
      flagOutline,
      pencilOutline,
      trashOutline,
      listOutline,
      chevronUpOutline,
      chevronDownOutline,
      sparklesOutline,
    });

    effect(() => {
      const tId = this._teamId();
      const eId = this._eventId();
      if (tId && eId) {
        // Clean up previous event subscription if any
        this.socketService.offEvent('gameEventLogged');
        this.socketService.offEvent('gameEventRemoved');
        this.socketService.offEvent('gameEventUpdated');
        
        // Join new event room
        this.socketService.joinEvent(eId);
        
        this.socketService.onEvent('gameEventLogged', (event: any) => {
          this.stateService.handleRemoteEvent(event);
          this.gameEvents.update(events => {
            if (events.some(e => e.id === event.id)) return events;
            return [...events, event];
          });
        });

        this.socketService.onEvent('gameEventUpdated', (event: any) => {
          this.gameEvents.update(events => events.map(e => e.id === event.id ? event : e));
          void this.loadData(tId, eId, true);
        });
        
        this.socketService.onEvent('gameEventRemoved', (data: any) => {
          this.stateService.handleRemoteDeletion(data);
          this.gameEvents.update(events => events.filter(e => e.id !== data.id));
        });

        void this.loadData(tId, eId);
      }
    });

    this.socketService.reconnected$.subscribe(() => {
      const tId = this._teamId();
      const eId = this._eventId();
      if (tId && eId) {
        void this.loadData(tId, eId, true);
      }
    });
  }

  protected async loadData(teamId: string, eventId: string, silent = false): Promise<void> {
    if (!silent) {
      this.isLoading.set(true);
    }
    this.errorMessage.set(null);
    try {
      const [game, events, playingTime, lineup, awards] = await Promise.all([
        firstValueFrom(this.eventsService.getEvent(teamId, eventId)),
        firstValueFrom(this.eventsService.getGameEvents(teamId, eventId)),
        firstValueFrom(this.eventsService.getPlayingTime(teamId, eventId)),
        firstValueFrom(this.eventsService.getLineup(teamId, eventId)),
        firstValueFrom(this.awardsService.getEventAwards(teamId, eventId)).catch(() => []),
      ]);
      const team = await this.teamService.getTeam(teamId);
      this.game.set(game);
      this.gameEvents.set(events);
      this.playingTime.set(playingTime);
      this.lineup.set(lineup);
      this.eventAwards.set(awards || []);
      this.sportName.set(team.sport?.name || 'Soccer');

      // Load Opponent Dossier
      if (game.opponentId) {
        try {
          const opp = await firstValueFrom(this.opponentsService.getOpponent(teamId, game.opponentId));
          this.opponentDossier.set(opp);
        } catch {
          // ignore
        }
      } else if (game.opponent) {
        try {
          const opps = await firstValueFrom(this.opponentsService.getOpponents(teamId, game.opponent.trim()));
          const found = opps.find((o) => o.name.toLowerCase() === game.opponent!.trim().toLowerCase());
          if (found) {
            const opp = await firstValueFrom(this.opponentsService.getOpponent(teamId, found.id));
            this.opponentDossier.set(opp);
          }
        } catch {
          // ignore
        }
      }
    } catch {
      this.errorMessage.set('Failed to load game summary.');
    } finally {
      if (!silent) {
        this.isLoading.set(false);
      }
    }
  }

  protected async promptLogOpponentReflection(): Promise<void> {
    const opp = this.opponentDossier();
    if (!opp) return;

    const alert = await this.alertController.create({
      header: `Scouting Note: ${opp.name}`,
      message: 'Log a post-match observation or tactical reflection to this opponent\'s dossier.',
      inputs: [
        {
          name: 'content',
          type: 'textarea',
          placeholder: 'e.g. Good high press in 1st half. Vulnerable on deep crosses to far post...',
        },
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Save Note',
          handler: async (data) => {
            if (data.content?.trim()) {
              try {
                await firstValueFrom(
                  this.opponentsService.addScoutingNote(this.teamId, opp.id, {
                    content: data.content.trim(),
                  })
                );
                const toast = await this.toastController.create({
                  message: 'Scouting note logged to opponent dossier!',
                  duration: 2000,
                  color: 'success',
                });
                await toast.present();
              } catch {
                console.error('Failed to save scouting note');
              }
            }
          },
        },
      ],
    });

    await alert.present();
  }

  protected formatSeconds(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  }

  protected getTopPosition(positionSeconds: Record<string, number>): string | null {
    const entries = Object.entries(positionSeconds);
    if (entries.length === 0) return null;
    return entries.sort((a, b) => b[1] - a[1])[0][0];
  }

  protected getResult(game: EventEntity): string {
    if (game.status === 'abandoned_weather') return 'UNFINISHED (WEATHER)';
    const s = this.score();
    if (s.team > s.opponent) return 'WIN';
    if (s.team < s.opponent) return 'LOSS';
    return 'DRAW';
  }

  protected getResultColor(game: EventEntity): string {
    if (game.status === 'abandoned_weather') return 'warning';
    const res = this.getResult(game);
    if (res === 'WIN') return 'success';
    if (res === 'LOSS') return 'danger';
    return 'medium';
  }

  ngOnDestroy(): void {
    const eId = this._eventId();
    if (eId) {
      this.socketService.offEvent('gameEventLogged');
      this.socketService.offEvent('gameEventRemoved');
      this.socketService.offEvent('gameEventUpdated');
      this.socketService.leaveEvent(eId);
    }
  }

  protected isGoalEvent(type?: string): boolean {
    return type === 'GOAL';
  }

  protected isOwnGoalEvent(type?: string): boolean {
    return type === 'OWN_GOAL';
  }
  protected openCreateModal(): void {
    this.isCreateMode.set(true);
    this.createEventType.set('SUB');
    this.editEvent.set(null);
    this.editPeriod.set(1);
    this.editMinute.set(0);
    this.editPlayerIn.set(null);
    this.editPlayerOut.set(null);
    this.editPosition.set(this.sportName() === 'Volleyball' ? 'Setter' : 'MID');
    this.editScorerId.set(null);
    this.editAssistorId.set(null);
    this.editPlayerId.set(null);
    this.editPlayerA.set(null);
    this.editPlayerB.set(null);
    this.editPositionA.set(null);
    this.editPositionB.set(null);
    this.isEditModalOpen.set(true);
  }

  protected openEditModal(event: any): void {
    this.isCreateMode.set(false);
    this.editEvent.set(event);
    this.editPeriod.set(event.period ?? event.payload?.period ?? 1);
    this.editMinute.set(event.minuteOccurred ?? 0);
    const payload = event.payload || {};
    this.editPlayerIn.set(payload.inPlayerId || null);
    this.editPlayerOut.set(payload.outPlayerId || null);
    this.editPosition.set(payload.positionName || null);
    this.editScorerId.set(payload.scorerId || event.playerId || null);
    this.editAssistorId.set(payload.assistorId || null);
    this.editPlayerId.set(payload.playerId || payload.assistorId || event.playerId || null);
    this.editPlayerA.set(payload.playerIdA || event.playerIdA || null);
    this.editPlayerB.set(payload.playerIdB || event.playerIdB || null);
    this.editPositionA.set(payload.positionNameA || event.positionNameA || null);
    this.editPositionB.set(payload.positionNameB || event.positionNameB || null);
    this.isEditModalOpen.set(true);
  }

  protected closeEditModal(): void {
    this.isEditModalOpen.set(false);
    this.editEvent.set(null);
    this.isCreateMode.set(false);
    this.editPeriod.set(1);
    this.editPlayerA.set(null);
    this.editPlayerB.set(null);
    this.editPositionA.set(null);
    this.editPositionB.set(null);
  }

  protected onEditPeriodChange(event: any): void {
    const val = parseInt(event.detail.value, 10);
    if (!isNaN(val)) {
      this.editPeriod.set(val);
    }
  }

  protected onEditMinuteChange(event: any): void {
    const val = parseInt(event.detail.value, 10);
    if (!isNaN(val)) {
      this.editMinute.set(val);
    }
  }

  protected async confirmSaveEdit(): Promise<void> {
    const alert = await this.alertController.create({
      header: this.isCreateMode() ? 'Confirm Add Event' : 'Confirm Edit',
      message: this.isCreateMode()
        ? 'Are you sure you want to add this event? This will update the playing stats.'
        : 'Are you sure you want to save these changes? This will recalculate playing time stats.',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: this.isCreateMode() ? 'Add' : 'Save',
          handler: () => {
            if (this.isCreateMode()) {
              void this.saveCreate();
            } else {
              void this.saveEdit();
            }
          }
        }
      ]
    });
    await alert.present();
  }

  protected async saveCreate(): Promise<void> {
    const type = this.createEventType();
    const payload: Record<string, any> = {
      period: this.editPeriod()
    };

    if (type === 'SUB') {
      payload['inPlayerId'] = this.editPlayerIn();
      payload['outPlayerId'] = this.editPlayerOut();
      payload['positionName'] = this.editPosition();
    } else if (type === 'POSITION_SWAP') {
      payload['playerIdA'] = this.editPlayerA();
      const entryA = this.lineup().find(l => l.playerId === this.editPlayerA());
      if (entryA && entryA.slotIndex !== undefined && entryA.slotIndex !== null) {
        payload['slotIndexA'] = entryA.slotIndex;
      }
      if (this.editPlayerB()) {
        payload['playerIdB'] = this.editPlayerB();
        const entryB = this.lineup().find(l => l.playerId === this.editPlayerB());
        if (entryB && entryB.slotIndex !== undefined && entryB.slotIndex !== null) {
          payload['slotIndexB'] = entryB.slotIndex;
        }
      }
      if (this.editPositionA()) {
        payload['positionNameA'] = this.editPositionA();
      }
      if (this.editPositionB()) {
        payload['positionNameB'] = this.editPositionB();
      }
    } else if (type === 'GOAL') {
      payload['scorerId'] = this.editScorerId();
      payload['assistorId'] = this.editAssistorId() || undefined;
    } else if (type === 'OWN_GOAL') {
      payload['playerId'] = this.editPlayerId();
    } else if (type === 'ASSIST') {
      payload['assistorId'] = this.editPlayerId() || undefined;
    } else {
      payload['playerId'] = this.editPlayerId() || undefined;
    }

    try {
      // 1. Log the main event
      await firstValueFrom(this.eventsService.logGameEvent(this.teamId, this.eventId, {
        eventType: type,
        minuteOccurred: this.editMinute(),
        payload
      }));

      // 2. If it's a GOAL and has an assistor, also log the ASSIST event
      if (type === 'GOAL' && this.editAssistorId()) {
        await firstValueFrom(this.eventsService.logGameEvent(this.teamId, this.eventId, {
          eventType: 'ASSIST',
          minuteOccurred: this.editMinute(),
          payload: {
            period: this.editPeriod(),
            assistorId: this.editAssistorId()
          }
        }));
      }

      const toast = await this.toastController.create({
        message: 'Event created successfully.',
        duration: 2000,
        color: 'success'
      });
      await toast.present();
      this.closeEditModal();
      await this.loadData(this.teamId, this.eventId, true);
    } catch (err) {
      console.error('Failed to create event:', err);
      const alert = await this.alertController.create({
        header: 'Error',
        message: 'Failed to create the event. Please check inputs and try again.',
        buttons: ['OK']
      });
      await alert.present();
    }
  }

  protected async saveEdit(): Promise<void> {
    const event = this.editEvent();
    if (!event) return;

    const payload: Record<string, any> = {
      ...event.payload,
      period: this.editPeriod()
    };

    if (event.eventType === 'SUB') {
      payload['inPlayerId'] = this.editPlayerIn();
      payload['outPlayerId'] = this.editPlayerOut();
      payload['positionName'] = this.editPosition();
    } else if (event.eventType === 'POSITION_SWAP') {
      payload['playerIdA'] = this.editPlayerA();
      const entryA = this.lineup().find(l => l.playerId === this.editPlayerA());
      if (entryA && entryA.slotIndex !== undefined && entryA.slotIndex !== null) {
        payload['slotIndexA'] = entryA.slotIndex;
      }
      if (this.editPlayerB()) {
        payload['playerIdB'] = this.editPlayerB();
        const entryB = this.lineup().find(l => l.playerId === this.editPlayerB());
        if (entryB && entryB.slotIndex !== undefined && entryB.slotIndex !== null) {
          payload['slotIndexB'] = entryB.slotIndex;
        }
      } else {
        delete payload['playerIdB'];
        delete payload['slotIndexB'];
      }
      if (this.editPositionA()) {
        payload['positionNameA'] = this.editPositionA();
      } else {
        delete payload['positionNameA'];
      }
      if (this.editPositionB()) {
        payload['positionNameB'] = this.editPositionB();
      } else {
        delete payload['positionNameB'];
      }
    } else if (event.eventType === 'GOAL') {
      payload['scorerId'] = this.editScorerId();
      payload['assistorId'] = this.editAssistorId() || undefined;
    } else if (event.eventType === 'OWN_GOAL') {
      payload['playerId'] = this.editPlayerId();
    } else if (event.eventType === 'ASSIST') {
      payload['assistorId'] = this.editPlayerId();
    } else {
      payload['playerId'] = this.editPlayerId();
    }

    const updateData = {
      minuteOccurred: this.editMinute(),
      payload
    };

    try {
      // Update main event
      await firstValueFrom(this.eventsService.updateGameEvent(this.teamId, this.eventId, event.id, updateData));

      // Manage assistor sync logic
      if (event.eventType === 'GOAL') {
        const existingAssist = this.gameEvents().find(ge => 
          ge.eventType === 'ASSIST' && 
          ge.minuteOccurred === event.minuteOccurred &&
          (ge.period ?? ge.payload?.period ?? 1) === (event.period ?? event.payload?.period ?? 1)
        );

        if (this.editAssistorId()) {
          if (existingAssist) {
            await firstValueFrom(this.eventsService.updateGameEvent(this.teamId, this.eventId, existingAssist.id, {
              minuteOccurred: this.editMinute(),
              payload: {
                ...existingAssist.payload,
                period: this.editPeriod(),
                assistorId: this.editAssistorId()
              }
            }));
          } else {
            await firstValueFrom(this.eventsService.logGameEvent(this.teamId, this.eventId, {
              eventType: 'ASSIST',
              minuteOccurred: this.editMinute(),
              payload: {
                period: this.editPeriod(),
                assistorId: this.editAssistorId()
              }
            }));
          }
        } else {
          if (existingAssist) {
            await firstValueFrom(this.eventsService.deleteGameEvent(this.teamId, this.eventId, existingAssist.id));
          }
        }
      }
      
      const toast = await this.toastController.create({
        message: 'Event updated successfully.',
        duration: 2000,
        color: 'success'
      });
      await toast.present();
      this.closeEditModal();
      await this.loadData(this.teamId, this.eventId, true);
    } catch (err) {
      console.error('Failed to update event:', err);
      const alert = await this.alertController.create({
        header: 'Error',
        message: 'Failed to update the event. Please check inputs and try again.',
        buttons: ['OK']
      });
      await alert.present();
    }
  }

  protected async confirmDelete(event: any): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Confirm Delete',
      message: 'Are you sure you want to delete this event? This will permanently remove it from the game history.',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            void this.deleteEvent(event);
          }
        }
      ]
    });
    await alert.present();
  }

  protected async deleteEvent(event: any): Promise<void> {
    try {
      await firstValueFrom(this.eventsService.deleteGameEvent(this.teamId, this.eventId, event.id));
      const toast = await this.toastController.create({
        message: 'Event deleted successfully.',
        duration: 2000,
        color: 'success'
      });
      await toast.present();
      await this.loadData(this.teamId, this.eventId, true);
    } catch (err) {
      console.error('Failed to delete event:', err);
      const alert = await this.alertController.create({
        header: 'Error',
        message: 'Failed to delete the event. Please try again.',
        buttons: ['OK']
      });
      await alert.present();
    }
  }

  protected async checkPlayingTime(): Promise<void> {
    try {
      const report = await firstValueFrom(this.eventsService.validatePlayingTime(this.teamId, this.eventId));
      this.playingTimeValidation.set(report);

      if (report.suggestedCorrections.length === 0) {
        const alert = await this.alertController.create({
          header: 'Playing Time Looks Good',
          message: 'No substitution errors were found for this game.',
          buttons: ['OK']
        });
        await alert.present();
        return;
      }

      await this.confirmApplyCorrections(report);
    } catch (err) {
      console.error('Failed to validate playing time:', err);
      const alert = await this.alertController.create({
        header: 'Error',
        message: 'Failed to check playing time. Please try again.',
        buttons: ['OK']
      });
      await alert.present();
    }
  }

  protected async confirmApplyCorrections(report: PlayingTimeValidationReport): Promise<void> {
    const message = report.suggestedCorrections.map(c => c.reason).join('<br><br>');
    const alert = await this.alertController.create({
      header: 'Possible Substitution Errors Found',
      message,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Apply Corrections',
          handler: () => {
            void this.applyPlayingTimeCorrections(report.suggestedCorrections);
          }
        }
      ]
    });
    await alert.present();
  }

  protected async applyPlayingTimeCorrections(corrections: PlayingTimeValidationReport['suggestedCorrections']): Promise<void> {
    try {
      const result = await firstValueFrom(
        this.eventsService.applyPlayingTimeCorrections(this.teamId, this.eventId, corrections)
      );
      this.playingTimeValidation.set(result.report);
      const toast = await this.toastController.create({
        message: 'Playing time corrected successfully.',
        duration: 2000,
        color: 'success'
      });
      await toast.present();
      await this.loadData(this.teamId, this.eventId, true);
    } catch (err) {
      console.error('Failed to apply playing time corrections:', err);
      const alert = await this.alertController.create({
        header: 'Error',
        message: 'Failed to apply corrections. Please check for errors again and retry.',
        buttons: ['OK']
      });
      await alert.present();
    }
  }

  protected canMoveUp(event: any): boolean {
    const period = event.period ?? event.payload?.period ?? 1;
    const sameMinute = this.sortedGameEvents().filter(
      e => e.minuteOccurred === event.minuteOccurred && (e.period ?? e.payload?.period ?? 1) === period
    );
    const index = sameMinute.findIndex(e => e.id === event.id);
    return index > 0;
  }

  protected canMoveDown(event: any): boolean {
    const period = event.period ?? event.payload?.period ?? 1;
    const sameMinute = this.sortedGameEvents().filter(
      e => e.minuteOccurred === event.minuteOccurred && (e.period ?? e.payload?.period ?? 1) === period
    );
    const index = sameMinute.findIndex(e => e.id === event.id);
    return index >= 0 && index < sameMinute.length - 1;
  }

  protected async moveEventUp(event: any): Promise<void> {
    const period = event.period ?? event.payload?.period ?? 1;
    const sameMinute = this.sortedGameEvents().filter(
      e => e.minuteOccurred === event.minuteOccurred && (e.period ?? e.payload?.period ?? 1) === period
    );
    const index = sameMinute.findIndex(e => e.id === event.id);
    if (index <= 0) return;

    const otherEvent = sameMinute[index - 1];
    await this.swapEventOrder(event, otherEvent);
  }

  protected async moveEventDown(event: any): Promise<void> {
    const period = event.period ?? event.payload?.period ?? 1;
    const sameMinute = this.sortedGameEvents().filter(
      e => e.minuteOccurred === event.minuteOccurred && (e.period ?? e.payload?.period ?? 1) === period
    );
    const index = sameMinute.findIndex(e => e.id === event.id);
    if (index < 0 || index >= sameMinute.length - 1) return;

    const otherEvent = sameMinute[index + 1];
    await this.swapEventOrder(event, otherEvent);
  }

  private reorderTimeout: any = null;
  private pendingSequenceUpdates = new Map<string, any>();

  private async swapEventOrder(eventA: any, eventB: any): Promise<void> {
    const period = eventA.period ?? eventA.payload?.period ?? 1;
    const sameMinute = this.sortedGameEvents().filter(
      e => e.minuteOccurred === eventA.minuteOccurred && (e.period ?? e.payload?.period ?? 1) === period
    );
    const idxA = sameMinute.findIndex(item => item.id === eventA.id);
    const idxB = sameMinute.findIndex(item => item.id === eventB.id);
    if (idxA < 0 || idxB < 0) return;

    const newSeqA = idxB;
    const newSeqB = idxA;

    const payloadA = { ...(eventA.payload || {}), sequence: newSeqA };
    const payloadB = { ...(eventB.payload || {}), sequence: newSeqB };

    this.gameEvents.update(events => 
      events.map(e => {
        if (e.id === eventA.id) return { ...e, payload: payloadA };
        if (e.id === eventB.id) return { ...e, payload: payloadB };
        return e;
      })
    );

    this.pendingSequenceUpdates.set(eventA.id, payloadA);
    this.pendingSequenceUpdates.set(eventB.id, payloadB);

    if (this.reorderTimeout) {
      clearTimeout(this.reorderTimeout);
    }

    this.reorderTimeout = setTimeout(async () => {
      const updates = Array.from(this.pendingSequenceUpdates.entries());
      this.pendingSequenceUpdates.clear();
      this.reorderTimeout = null;

      try {
        for (const [id, payload] of updates) {
          await firstValueFrom(this.eventsService.updateGameEvent(this.teamId, this.eventId, id, {
            payload
          }));
        }
        
        const toast = await this.toastController.create({
          message: 'Event order saved.',
          duration: 1500,
          color: 'success'
        });
        await toast.present();
        await this.loadData(this.teamId, this.eventId, true);
      } catch (err) {
        console.error('Failed to swap event order:', err);
        const alert = await this.alertController.create({
          header: 'Error',
          message: 'Failed to save event order to server. Please reload.',
          buttons: ['OK']
        });
        await alert.present();
      }
    }, 500);
  }

  protected async toggleIgnorePlayingTime(event: any): Promise<void> {
    const checked = event.detail.checked;
    const gameVal = this.game();
    if (!gameVal) return;

    try {
      const updated = await firstValueFrom(
        this.eventsService.updateEvent(this.teamId, gameVal.id, {
          ignorePlayingTime: checked
        })
      );
      this.game.set(updated);
    } catch (err) {
      console.error('Failed to update ignorePlayingTime:', err);
      this.errorMessage.set('Failed to update playing time setting.');
    }
  }
}
