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
  IonAccordion,
  IonAccordionGroup,
} from '@ionic/angular/standalone';
import { LiveGameStateService, ShootoutScorecardComponent, EventSyncService, BasketballCourtViewComponent, ShotEventRecord, calculateShotType } from '@apex-team/client/feature/game-console';
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
  shieldOutline,
  chatboxEllipsesOutline,
  basketballOutline,
  flameOutline,
  trendingUpOutline,
  flashOutline,
} from 'ionicons/icons';
import { AttendanceList, CoachingNotes } from '@apex-team/client/ui/attendance';
import { EventsService, EventEntity, AttendanceService, TeamService, PlayingTimeValidationReport, OpponentsService, AwardsService } from '@apex-team/client/data-access/team';
import { OpponentWithStats, PlayerAward } from '@apex-team/shared/util/models';
import { SocketService } from '@apex-team/client/data-access/socket';
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
    BasketballCourtViewComponent,
    IonAccordion,
    IonAccordionGroup,
  ],
  templateUrl: './game-summary.html',
  styleUrl: './game-summary.scss',
})
export class GameSummary implements OnDestroy {
  private _teamId = signal<string | null>(null);
  private _eventId = signal<string | null>(null);

  @Input() set id(val: string) {
    this._teamId.set(val);
  }
  public get teamId(): string {
    return this._teamId() ?? '';
  }

  @Input() set eventId(val: string) {
    this._eventId.set(val);
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
  protected activeSegment = signal<'highlights' | 'attendance' | 'playtime' | 'notes' | 'event-log' | 'boxscore' | 'shot-chart'>('highlights');
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
    const isBb = this.sportName() === 'Basketball';
    const defaultCount = isVb ? 3 : (isBb ? (this.game()?.periodCount || 4) : (this.game()?.periodCount || 2));
    const existingPeriods = this.gameEvents()
      .map(e => e.period ?? e.payload?.period)
      .filter((p): p is number => typeof p === 'number' && p > 0);
    const currentEditP = this.editPeriod();
    const maxP = Math.max(defaultCount, ...existingPeriods, currentEditP, isVb ? 3 : (isBb ? 4 : 2));

    const totalPeriodsToShow = isVb
      ? Math.max(maxP, 5)
      : (isBb ? Math.max(maxP, 4) : Math.max(maxP, defaultCount === 2 ? 4 : defaultCount));

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
    const isBb = this.sportName() === 'Basketball';
    const count = isBb ? (this.game()?.periodCount || 4) : (this.game()?.periodCount || 2);
    if (count === 4) {
      if (periodNum === 1) return '1st Quarter';
      if (periodNum === 2) return '2nd Quarter';
      if (periodNum === 3) return '3rd Quarter';
      if (periodNum === 4) return '4th Quarter';
      return periodNum === 5 ? 'Overtime' : `Overtime ${periodNum - 4}`;
    }
    if (count === 2) {
      if (periodNum === 1) return '1st Half';
      if (periodNum === 2) return '2nd Half';
      if (periodNum === 3) return 'Extra Time 1 (OT1)';
      if (periodNum === 4) return 'Extra Time 2 (OT2)';
      return `Period ${periodNum}`;
    }
    return `Period ${periodNum}`;
  }

  protected getPeriodShortLabel(periodNum: number): string {
    if (this.sportName() === 'Volleyball') {
      return `S${periodNum}`;
    }
    const isBb = this.sportName() === 'Basketball';
    const count = isBb ? (this.game()?.periodCount || 4) : (this.game()?.periodCount || 2);
    if (count === 4) {
      if (periodNum === 1) return 'Q1';
      if (periodNum === 2) return 'Q2';
      if (periodNum === 3) return 'Q3';
      if (periodNum === 4) return 'Q4';
      return periodNum === 5 ? 'OT' : `${periodNum - 4}OT`;
    }
    if (count === 2) {
      if (periodNum === 1) return '1H';
      if (periodNum === 2) return '2H';
      if (periodNum === 3) return 'OT1';
      if (periodNum === 4) return 'OT2';
      return `P${periodNum}`;
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
    const isBb = this.sportName() === 'Basketball';
    
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
        teamSaves: 0,
        fgMade: 0,
        fgAttempted: 0,
        fgPct: 0,
        fg3Made: 0,
        fg3Attempted: 0,
        fg3Pct: 0,
        ftMade: 0,
        ftAttempted: 0,
        ftPct: 0,
        reboundsTotal: 0,
        reboundsOffensive: 0,
        reboundsDefensive: 0,
        assists: 0,
        turnovers: 0,
        steals: 0,
        fouls: 0,
      };
    }

    if (isBb) {
      const totals = this.basketballTotals();
      return {
        kills: 0,
        aces: 0,
        blocks: totals.blocks,
        digs: 0,
        errors: totals.turnovers,
        teamShots: totals.fgAttempted,
        opponentShots: 0,
        teamCorners: 0,
        opponentCorners: 0,
        teamSaves: 0,
        fgMade: totals.fgMade,
        fgAttempted: totals.fgAttempted,
        fgPct: totals.fgPct,
        fg3Made: totals.fg3Made,
        fg3Attempted: totals.fg3Attempted,
        fg3Pct: totals.fg3Pct,
        ftMade: totals.ftMade,
        ftAttempted: totals.ftAttempted,
        ftPct: totals.ftPct,
        reboundsTotal: totals.reboundsTotal,
        reboundsOffensive: totals.reboundsOffensive,
        reboundsDefensive: totals.reboundsDefensive,
        assists: totals.assists,
        turnovers: totals.turnovers,
        steals: totals.steals,
        fouls: totals.fouls,
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
      errors: 0,
      fgMade: 0,
      fgAttempted: 0,
      fgPct: 0,
      fg3Made: 0,
      fg3Attempted: 0,
      fg3Pct: 0,
      ftMade: 0,
      ftAttempted: 0,
      ftPct: 0,
      reboundsTotal: 0,
      reboundsOffensive: 0,
      reboundsDefensive: 0,
      assists: 0,
      turnovers: 0,
      steals: 0,
      fouls: 0,
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

  protected basketballBoxScore = computed(() => {
    const players = this.lineup();
    const events = this.gameEvents();
    const pt = this.playingTime();

    // Calculate Plus/Minus
    const plusMinusMap: Record<string, number> = {};
    players.forEach(p => {
      plusMinusMap[p.playerId] = 0;
    });

    const onCourt = new Set<string>();
    players.forEach(p => {
      if (p.status === 'starting') {
        onCourt.add(p.playerId);
      }
    });

    const sortedChronological = [...events].sort((a, b) => {
      const periodA = a.period ?? a.payload?.period ?? 1;
      const periodB = b.period ?? b.payload?.period ?? 1;
      if (periodA !== periodB) return periodA - periodB;
      if (a.minuteOccurred !== b.minuteOccurred) return a.minuteOccurred - b.minuteOccurred;
      return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
    });

    sortedChronological.forEach(e => {
      const type = e.eventType || e.type;
      const payload = e.payload || {};
      if (type === 'SUB') {
        const outId = payload.outPlayerId || payload.playerIdOut || e.playerIdOut || e['outPlayerId'];
        const inId = payload.inPlayerId || payload.playerIdIn || e.playerIdIn || e['inPlayerId'];
        if (outId) onCourt.delete(outId);
        if (inId) onCourt.add(inId);
      } else if (type === 'MADE_1PT') {
        onCourt.forEach(id => {
          plusMinusMap[id] = (plusMinusMap[id] || 0) + 1;
        });
      } else if (type === 'MADE_2PT') {
        onCourt.forEach(id => {
          plusMinusMap[id] = (plusMinusMap[id] || 0) + 2;
        });
      } else if (type === 'MADE_3PT') {
        onCourt.forEach(id => {
          plusMinusMap[id] = (plusMinusMap[id] || 0) + 3;
        });
      } else if (type === 'OPPONENT_SCORE') {
        const pts = Number(payload.points ?? e.points ?? 2);
        onCourt.forEach(id => {
          plusMinusMap[id] = (plusMinusMap[id] || 0) - pts;
        });
      }
    });

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

      const ftMade = playerEvents.filter(e => (e.eventType || e.type) === 'MADE_1PT' && (e.playerId === playerId || e.payload?.playerId === playerId || e.payload?.scorerId === playerId)).length;
      const ftMissed = playerEvents.filter(e => (e.eventType || e.type) === 'MISSED_1PT' && (e.playerId === playerId || e.payload?.playerId === playerId || e.payload?.scorerId === playerId)).length;
      const ftAttempted = ftMade + ftMissed;
      const ftPct = ftAttempted > 0 ? (ftMade / ftAttempted) : 0;

      const fg2Made = playerEvents.filter(e => (e.eventType || e.type) === 'MADE_2PT' && (e.playerId === playerId || e.payload?.playerId === playerId || e.payload?.scorerId === playerId)).length;
      const fg2Missed = playerEvents.filter(e => (e.eventType || e.type) === 'MISSED_2PT' && (e.playerId === playerId || e.payload?.playerId === playerId || e.payload?.scorerId === playerId)).length;

      const fg3Made = playerEvents.filter(e => (e.eventType || e.type) === 'MADE_3PT' && (e.playerId === playerId || e.payload?.playerId === playerId || e.payload?.scorerId === playerId)).length;
      const fg3Missed = playerEvents.filter(e => (e.eventType || e.type) === 'MISSED_3PT' && (e.playerId === playerId || e.payload?.playerId === playerId || e.payload?.scorerId === playerId)).length;
      const fg3Attempted = fg3Made + fg3Missed;
      const fg3Pct = fg3Attempted > 0 ? (fg3Made / fg3Attempted) : 0;

      const fgMade = fg2Made + fg3Made;
      const fgAttempted = fgMade + fg2Missed + fg3Missed;
      const fgPct = fgAttempted > 0 ? (fgMade / fgAttempted) : 0;

      const points = ftMade * 1 + fg2Made * 2 + fg3Made * 3;

      const reboundsOffensive = playerEvents.filter(e => {
        const t = e.eventType || e.type;
        return (t === 'REBOUND_OFFENSIVE' || t === 'OFFENSIVE_REBOUND') && (e.playerId === playerId || e.payload?.playerId === playerId);
      }).length;

      const reboundsDefensive = playerEvents.filter(e => {
        const t = e.eventType || e.type;
        return (t === 'REBOUND_DEFENSIVE' || t === 'DEFENSIVE_REBOUND') && (e.playerId === playerId || e.payload?.playerId === playerId);
      }).length;

      const reboundsTotal = reboundsOffensive + reboundsDefensive;

      const assists = events.filter(e => {
        const t = e.eventType || e.type;
        const payload = e.payload || {};
        if (t === 'ASSIST' && (e.playerId === playerId || payload.playerId === playerId || payload.assistorId === playerId)) {
          return true;
        }
        if ((t === 'MADE_2PT' || t === 'MADE_3PT') && (payload.assistorId === playerId || e.assistorId === playerId)) {
          return true;
        }
        return false;
      }).length;

      const steals = playerEvents.filter(e => (e.eventType || e.type) === 'STEAL' && (e.playerId === playerId || e.payload?.playerId === playerId)).length;
      const blocks = playerEvents.filter(e => (e.eventType || e.type) === 'BLOCK' && (e.playerId === playerId || e.payload?.playerId === playerId)).length;
      const turnovers = playerEvents.filter(e => (e.eventType || e.type) === 'TURNOVER' && (e.playerId === playerId || e.payload?.playerId === playerId)).length;
      const fouls = playerEvents.filter(e => (e.eventType || e.type) === 'FOUL' && (e.playerId === playerId || e.payload?.playerId === playerId)).length;

      const totalSeconds = pt[playerId]?.totalSeconds || 0;
      const minutes = Math.round(totalSeconds / 60);

      const pm = plusMinusMap[playerId] ?? 0;
      const pmFormatted = pm > 0 ? `+${pm}` : `${pm}`;

      return {
        player: p.player,
        playerId,
        playerName: `${p.player.firstName} ${p.player.lastName}`,
        jerseyNumber: p.player.jerseyNumber ?? '-',
        position: p.positionName || p.player.preferredPosition || 'Player',
        status: p.status,
        minutes,
        points,
        fgMade,
        fgAttempted,
        fgPct,
        fg3Made,
        fg3Attempted,
        fg3Pct,
        ftMade,
        ftAttempted,
        ftPct,
        reboundsOffensive,
        reboundsDefensive,
        reboundsTotal,
        assists,
        steals,
        blocks,
        turnovers,
        fouls,
        plusMinus: pm,
        plusMinusFormatted: pmFormatted,
      };
    });
  });

  protected basketballTotals = computed(() => {
    const box = this.basketballBoxScore();
    const totals = {
      minutes: box.reduce((sum, r) => sum + r.minutes, 0),
      points: box.reduce((sum, r) => sum + r.points, 0),
      fgMade: box.reduce((sum, r) => sum + r.fgMade, 0),
      fgAttempted: box.reduce((sum, r) => sum + r.fgAttempted, 0),
      fgPct: 0,
      fg3Made: box.reduce((sum, r) => sum + r.fg3Made, 0),
      fg3Attempted: box.reduce((sum, r) => sum + r.fg3Attempted, 0),
      fg3Pct: 0,
      ftMade: box.reduce((sum, r) => sum + r.ftMade, 0),
      ftAttempted: box.reduce((sum, r) => sum + r.ftAttempted, 0),
      ftPct: 0,
      reboundsOffensive: box.reduce((sum, r) => sum + r.reboundsOffensive, 0),
      reboundsDefensive: box.reduce((sum, r) => sum + r.reboundsDefensive, 0),
      reboundsTotal: box.reduce((sum, r) => sum + r.reboundsTotal, 0),
      assists: box.reduce((sum, r) => sum + r.assists, 0),
      steals: box.reduce((sum, r) => sum + r.steals, 0),
      blocks: box.reduce((sum, r) => sum + r.blocks, 0),
      turnovers: box.reduce((sum, r) => sum + r.turnovers, 0),
      fouls: box.reduce((sum, r) => sum + r.fouls, 0),
    };
    totals.fgPct = totals.fgAttempted > 0 ? totals.fgMade / totals.fgAttempted : 0;
    totals.fg3Pct = totals.fg3Attempted > 0 ? totals.fg3Made / totals.fg3Attempted : 0;
    totals.ftPct = totals.ftAttempted > 0 ? totals.ftMade / totals.ftAttempted : 0;
    return totals;
  });

  protected basketballPeriodScores = computed(() => {
    const events = this.gameEvents();
    const periodCount = this.game()?.periodCount || 4;
    let maxPeriod = periodCount;
    events.forEach(e => {
      const p = e.period ?? e.payload?.period;
      if (typeof p === 'number' && p > maxPeriod) {
        maxPeriod = p;
      }
    });

    const periodScores: {
      period: number;
      label: string;
      teamScore: number;
      opponentScore: number;
      teamCumulative: number;
      opponentCumulative: number;
    }[] = [];

    let teamRunning = 0;
    let opponentRunning = 0;

    for (let p = 1; p <= maxPeriod; p++) {
      const periodEvents = events.filter(e => (e.period ?? e.payload?.period ?? 1) === p);
      let teamPts = 0;
      let oppPts = 0;

      periodEvents.forEach(e => {
        const type = e.eventType || e.type;
        const payload = e.payload || {};
        if (type === 'MADE_1PT') teamPts += 1;
        else if (type === 'MADE_2PT') teamPts += 2;
        else if (type === 'MADE_3PT') teamPts += 3;
        else if (type === 'OPPONENT_SCORE') {
          const pts = Number(payload.points ?? e.points ?? 2);
          oppPts += pts;
        }
      });

      teamRunning += teamPts;
      opponentRunning += oppPts;

      const label = p <= 4 ? `Q${p}` : `OT${p - 4}`;

      periodScores.push({
        period: p,
        label,
        teamScore: teamPts,
        opponentScore: oppPts,
        teamCumulative: teamRunning,
        opponentCumulative: opponentRunning,
      });
    }

    return periodScores;
  });

  protected basketballShots = computed<ShotEventRecord[]>(() => {
    const events = this.gameEvents();
    const lineup = this.lineup();
    const shotTypes = new Set([
      'MADE_1PT',
      'MISSED_1PT',
      'MADE_2PT',
      'MISSED_2PT',
      'MADE_3PT',
      'MISSED_3PT',
    ]);

    return events
      .filter(e => shotTypes.has(e.eventType || e.type))
      .map(e => {
        const type = (e.eventType || e.type) as ShotEventRecord['type'];
        const payload = e.payload || {};
        const pid = (e.playerId || payload.playerId || payload.scorerId) as string;
        const entry = lineup.find(l => l.playerId === pid);
        return {
          id: e.id,
          type,
          playerId: pid,
          playerName: entry ? `${entry.player.firstName} ${entry.player.lastName}` : undefined,
          playerJersey: entry?.player?.jerseyNumber ?? null,
          x: payload.x ?? payload.coordinates?.x ?? e.x,
          y: payload.y ?? payload.coordinates?.y ?? e.y,
          distanceFeet: payload.distanceFeet ?? e.distanceFeet,
          minuteOccurred: e.minuteOccurred,
          period: e.period ?? payload.period ?? 1,
        };
      });
  });

  protected summaryPlayers = computed(() => this.lineup().map(l => l.player));
  protected summaryActivePlayers = computed(() =>
    this.lineup()
      .filter(l => l.status === 'starting')
      .map(l => ({ ...l.player, preferredPosition: l.positionName }))
  );

  protected basketballScoringPlays = computed(() => {
    const lineup = this.lineup();
    const scoringTypes = new Set(['MADE_1PT', 'MADE_2PT', 'MADE_3PT', 'OPPONENT_SCORE']);
    return this.gameEvents()
      .filter(e => scoringTypes.has(e.eventType || e.type))
      .map(e => {
        const type = e.eventType || e.type;
        const payload = e.payload || {};
        const isTeam = type !== 'OPPONENT_SCORE';
        const scorerId = (e.playerId || payload.playerId || payload.scorerId) as string;
        const entry = lineup.find(l => l.playerId === scorerId);
        const assistorId = payload.assistorId || e.assistorId;
        const assistorEntry = assistorId ? lineup.find(l => l.playerId === assistorId) : null;
        let points = 2;
        if (type === 'MADE_1PT') points = 1;
        else if (type === 'MADE_2PT') points = 2;
        else if (type === 'MADE_3PT') points = 3;
        else if (type === 'OPPONENT_SCORE') points = Number(payload.points ?? e.points ?? 2);

        return {
          ...e,
          points,
          isTeam,
          player: entry?.player,
          assistorPlayer: assistorEntry?.player,
          distanceFeet: payload.distanceFeet ?? e.distanceFeet,
        };
      })
      .sort((a, b) => {
        const periodA = a.period ?? a.payload?.period ?? 1;
        const periodB = b.period ?? b.payload?.period ?? 1;
        if (periodA !== periodB) return periodA - periodB;
        if (a.minuteOccurred !== b.minuteOccurred) return a.minuteOccurred - b.minuteOccurred;
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      });
  });

  // Post-Game Shot Chart Period Filter
  protected shotChartPeriodFilter = signal<number | 'all'>('all');

  protected setShotChartPeriod(val: any): void {
    if (val === 'all') {
      this.shotChartPeriodFilter.set('all');
    } else if (val !== null && val !== undefined) {
      const num = Number(val);
      if (!isNaN(num)) {
        this.shotChartPeriodFilter.set(num);
      }
    }
  }

  protected shotChartPeriods = computed(() => {
    const periodCount = this.game()?.periodCount || 4;
    let maxPeriod = periodCount;
    this.gameEvents().forEach((e) => {
      const p = e.period ?? e.payload?.period;
      if (typeof p === 'number' && p > maxPeriod) {
        maxPeriod = p;
      }
    });
    const periods: { period: number; label: string }[] = [];
    for (let p = 1; p <= maxPeriod; p++) {
      periods.push({
        period: p,
        label: p <= 4 ? `Q${p}` : `OT${p - 4}`,
      });
    }
    return periods;
  });

  protected filteredBasketballShots = computed(() => {
    const shots = this.basketballShots();
    const filter = this.shotChartPeriodFilter();
    if (filter === 'all') return shots;
    return shots.filter((s) => (s.period ?? 1) === filter);
  });

  protected periodShootingStats = computed(() => {
    const shots = this.filteredBasketballShots();
    const fgShots = shots.filter(
      (s) =>
        s.type.startsWith('MADE_2PT') ||
        s.type.startsWith('MISSED_2PT') ||
        s.type.startsWith('MADE_3PT') ||
        s.type.startsWith('MISSED_3PT')
    );
    const fgMade = fgShots.filter((s) => s.type.startsWith('MADE')).length;
    const fgAtt = fgShots.length;
    const fgPct = fgAtt > 0 ? (fgMade / fgAtt) * 100 : 0;

    const fg3Shots = shots.filter((s) => s.type.startsWith('MADE_3PT') || s.type.startsWith('MISSED_3PT'));
    const fg3Made = fg3Shots.filter((s) => s.type === 'MADE_3PT').length;
    const fg3Att = fg3Shots.length;
    const fg3Pct = fg3Att > 0 ? (fg3Made / fg3Att) * 100 : 0;

    const fg2Shots = shots.filter((s) => s.type.startsWith('MADE_2PT') || s.type.startsWith('MISSED_2PT'));
    const fg2Made = fg2Shots.filter((s) => s.type === 'MADE_2PT').length;
    const fg2Att = fg2Shots.length;
    const fg2Pct = fg2Att > 0 ? (fg2Made / fg2Att) * 100 : 0;

    const ftShots = shots.filter((s) => s.type.startsWith('MADE_1PT') || s.type.startsWith('MISSED_1PT'));
    const ftMade = ftShots.filter((s) => s.type === 'MADE_1PT').length;
    const ftAtt = ftShots.length;
    const ftPct = ftAtt > 0 ? (ftMade / ftAtt) * 100 : 0;

    const totalPts = fg2Made * 2 + fg3Made * 3 + ftMade * 1;

    return {
      fgMade,
      fgAtt,
      fgPct,
      fg3Made,
      fg3Att,
      fg3Pct,
      fg2Made,
      fg2Att,
      fg2Pct,
      ftMade,
      ftAtt,
      ftPct,
      totalPts,
    };
  });

  protected basketballGameIntelligence = computed(() => {
    const events = this.sortedGameEvents();
    const lineup = this.lineup();
    const teamName = this.game()?.season?.team?.name || 'Apex';
    const oppName = this.game()?.opponent || 'Opponent';
    const periodCount = this.game()?.periodCount || 4;

    let maxPeriod = periodCount;
    events.forEach((e) => {
      const p = e.period ?? e.payload?.period;
      if (typeof p === 'number' && p > maxPeriod) {
        maxPeriod = p;
      }
    });

    const scoringTypes = new Set(['MADE_1PT', 'MADE_2PT', 'MADE_3PT', 'OPPONENT_SCORE']);
    const scoringEvents = events.filter((e) => scoringTypes.has(e.eventType || e.type));

    // 1. Momentum & Lead Progression
    let runningTeam = 0;
    let runningOpp = 0;
    let maxLeadTeam = 0;
    let maxLeadTeamMoment = '—';
    let maxLeadTeamPoint: { x: number; y: number } | null = null;
    let maxLeadOpp = 0;
    let maxLeadOppMoment = '—';
    let maxLeadOppPoint: { x: number; y: number } | null = null;
    let leadChanges = 0;
    let timesTied = 0;
    let lastLeader: 'team' | 'opp' | null = null;

    interface Step {
      period: number;
      minute: number;
      team: number;
      opp: number;
      diff: number;
      isTeam: boolean;
      points: number;
      scorerId?: string;
      scorerName?: string;
      scorerJersey?: string | number;
      assistorId?: string;
      assistorName?: string;
      assistorJersey?: string | number;
      type: string;
      rawEvent: any;
      xPos?: number;
      yPos?: number;
    }

    const steps: Step[] = [];

    scoringEvents.forEach((e) => {
      const type = e.eventType || e.type;
      const payload = e.payload || {};
      const isTeam = type !== 'OPPONENT_SCORE';
      let pts = 2;
      if (type === 'MADE_1PT') pts = 1;
      else if (type === 'MADE_2PT') pts = 2;
      else if (type === 'MADE_3PT') pts = 3;
      else if (type === 'OPPONENT_SCORE') pts = Number(payload.points ?? e.points ?? 2);

      if (isTeam) {
        runningTeam += pts;
      } else {
        runningOpp += pts;
      }

      const diff = runningTeam - runningOpp;
      const period = e.period ?? payload.period ?? 1;
      const minute = e.minuteOccurred ?? 0;
      const pLabel = period <= 4 ? `Q${period}` : `OT${period - 4}`;
      const timeStr = `${pLabel} ${minute}'`;

      if (diff > 0) {
        if (lastLeader === 'opp') {
          leadChanges++;
        }
        lastLeader = 'team';
      } else if (diff < 0) {
        if (lastLeader === 'team') {
          leadChanges++;
        }
        lastLeader = 'opp';
      } else {
        if (runningTeam > 0 || runningOpp > 0) {
          timesTied++;
        }
      }

      if (diff > maxLeadTeam) {
        maxLeadTeam = diff;
        maxLeadTeamMoment = `+${diff} (${timeStr})`;
      }
      if (-diff > maxLeadOpp) {
        maxLeadOpp = -diff;
        maxLeadOppMoment = `+${-diff} (${timeStr})`;
      }

      const scorerId = (e.playerId || payload.playerId || payload.scorerId) as string;
      const scorerEntry = lineup.find((l) => l.playerId === scorerId);
      const assistorId = payload.assistorId || e.assistorId;
      const assistorEntry = assistorId ? lineup.find((l) => l.playerId === assistorId) : null;

      steps.push({
        period,
        minute,
        team: runningTeam,
        opp: runningOpp,
        diff,
        isTeam,
        points: pts,
        scorerId,
        scorerName: scorerEntry ? `${scorerEntry.player.firstName} ${scorerEntry.player.lastName}` : undefined,
        scorerJersey: scorerEntry?.player?.jerseyNumber ?? undefined,
        assistorId,
        assistorName: assistorEntry ? `${assistorEntry.player.firstName} ${assistorEntry.player.lastName}` : undefined,
        assistorJersey: assistorEntry?.player?.jerseyNumber ?? undefined,
        type,
        rawEvent: e,
      });
    });

    // 2. Biggest Runs
    let currTeamRun = 0;
    let maxTeamRun = 0;
    let currOppRun = 0;
    let maxOppRun = 0;

    steps.forEach((s) => {
      if (s.isTeam) {
        currTeamRun += s.points;
        currOppRun = 0;
        if (currTeamRun > maxTeamRun) maxTeamRun = currTeamRun;
      } else {
        currOppRun += s.points;
        currTeamRun = 0;
        if (currOppRun > maxOppRun) maxOppRun = currOppRun;
      }
    });

    let biggestRunLabel = '—';
    if (maxTeamRun >= maxOppRun && maxTeamRun > 0) {
      biggestRunLabel = `${maxTeamRun}–0 ${teamName}`;
    } else if (maxOppRun > 0) {
      biggestRunLabel = `${maxOppRun}–0 ${oppName}`;
    }

    // 3. SVG Lead Curve Coordinates
    const svgWidth = 600;
    const svgHeight = 120;
    const yCenter = svgHeight / 2;
    const maxAbsDiff = Math.max(6, maxLeadTeam, maxLeadOpp);
    const yScale = 44 / maxAbsDiff;

    // Period Dividers
    const periodDividers: { x: number; label: string }[] = [];
    for (let p = 1; p < maxPeriod; p++) {
      periodDividers.push({
        x: Math.round((p / maxPeriod) * svgWidth * 10) / 10,
        label: p <= 4 ? `Q${p}` : `OT${p - 4}`,
      });
    }

    let curvePath = `M 0 ${yCenter}`;
    let prevY = yCenter;

    steps.forEach((step) => {
      const p = step.period;
      const playsInPeriod = steps.filter((s) => s.period === p);
      const idxInPeriod = playsInPeriod.indexOf(step);
      const frac = (idxInPeriod + 1) / (playsInPeriod.length + 1);
      const x = Math.round((((p - 1 + frac) / maxPeriod) * svgWidth) * 10) / 10;
      const y = Math.round((yCenter - step.diff * yScale) * 10) / 10;

      // Step line: horizontal to x, then vertical to y
      curvePath += ` L ${x} ${prevY} L ${x} ${y}`;
      prevY = y;
      step.xPos = x;
      step.yPos = y;

      if (step.diff === maxLeadTeam && maxLeadTeam > 0 && !maxLeadTeamPoint) {
        maxLeadTeamPoint = { x, y };
      }
      if (-step.diff === maxLeadOpp && maxLeadOpp > 0 && !maxLeadOppPoint) {
        maxLeadOppPoint = { x, y };
      }
    });

    // Close to end of SVG
    curvePath += ` L ${svgWidth} ${prevY}`;

    // Area path closed along yCenter = 60
    const areaPath = `${curvePath} L ${svgWidth} ${yCenter} L 0 ${yCenter} Z`;

    // 4. Pivotal Moments (Runs & Droughts)
    const pivotalMoments: {
      type: 'run_team' | 'run_opp' | 'drought';
      icon: string;
      title: string;
      subtitle: string;
      periodLabel: string;
      timeRange: string;
      isTeam: boolean;
    }[] = [];

    // Detect distinct runs >= 6 points
    let runPts = 0;
    let runTeamSide: boolean | null = null;
    let runStartMin = 0;
    let runEndMin = 0;
    let runPeriod = 1;
    const runScorers = new Map<string, number>();

    const flushRun = () => {
      if (runPts >= 6 && runTeamSide !== null) {
        const pLabel = runPeriod <= 4 ? `Q${runPeriod}` : `OT${runPeriod - 4}`;
        const topScorerInfo = [...runScorers.entries()].sort((a, b) => b[1] - a[1])[0];
        let sub = '';
        if (runTeamSide) {
          sub = topScorerInfo ? `Ignited by ${topScorerInfo[0]} (${topScorerInfo[1]} PTS)` : 'High-energy scoring surge';
        } else {
          sub = 'Opponent answering run';
        }
        pivotalMoments.push({
          type: runTeamSide ? 'run_team' : 'run_opp',
          icon: 'flame-outline',
          title: `${runTeamSide ? teamName : oppName} ${runPts}–0 Run`,
          subtitle: sub,
          periodLabel: pLabel,
          timeRange: `${runStartMin}' – ${runEndMin}'`,
          isTeam: runTeamSide,
        });
      }
      runPts = 0;
      runTeamSide = null;
      runScorers.clear();
    };

    steps.forEach((s) => {
      if (runTeamSide === null) {
        runTeamSide = s.isTeam;
        runPts = s.points;
        runStartMin = s.minute;
        runEndMin = s.minute;
        runPeriod = s.period;
        if (s.isTeam && s.scorerName) {
          runScorers.set(s.scorerName, (runScorers.get(s.scorerName) || 0) + s.points);
        }
      } else if (runTeamSide === s.isTeam && runPeriod === s.period) {
        runPts += s.points;
        runEndMin = s.minute;
        if (s.isTeam && s.scorerName) {
          runScorers.set(s.scorerName, (runScorers.get(s.scorerName) || 0) + s.points);
        }
      } else {
        flushRun();
        runTeamSide = s.isTeam;
        runPts = s.points;
        runStartMin = s.minute;
        runEndMin = s.minute;
        runPeriod = s.period;
        if (s.isTeam && s.scorerName) {
          runScorers.set(s.scorerName, (runScorers.get(s.scorerName) || 0) + s.points);
        }
      }
    });
    flushRun();

    // Detect droughts for team (gap of >= 3 minutes between team scores in same period with misses/turnovers)
    const teamSteps = steps.filter((s) => s.isTeam);
    for (let i = 0; i < teamSteps.length - 1; i++) {
      const s1 = teamSteps[i];
      const s2 = teamSteps[i + 1];
      if (s1.period === s2.period && s2.minute - s1.minute >= 3) {
        const gapMin = s2.minute - s1.minute;
        const pLabel = s1.period <= 4 ? `Q${s1.period}` : `OT${s1.period - 4}`;
        pivotalMoments.push({
          type: 'drought',
          icon: 'alert-circle-outline',
          title: `${gapMin}:00 Scoring Drought`,
          subtitle: `Held scoreless for ${gapMin} minutes`,
          periodLabel: pLabel,
          timeRange: `${s1.minute}' – ${s2.minute}'`,
          isTeam: false,
        });
      }
    }

    // Limit pivotal moments to top 4
    const topPivotalMoments = pivotalMoments.slice(0, 4);

    // 5. Scoring Distribution & Offensive Profile
    let paintMakes = 0;
    let midRangeMakes = 0;
    let threeMakes = 0;
    let ftMakes = 0;
    let assistedFGs = 0;
    let pointsOffTurnovers = 0;

    const allTeamShots = events.filter((e) => {
      const type = e.eventType || e.type;
      return type.startsWith('MADE_');
    });

    allTeamShots.forEach((e) => {
      const type = e.eventType || e.type;
      const payload = e.payload || {};
      const x = payload.x ?? payload.coordinates?.x ?? e.x;
      const y = payload.y ?? payload.coordinates?.y ?? e.y;
      const dist = payload.distanceFeet ?? e.distanceFeet;

      if (type === 'MADE_1PT') {
        ftMakes++;
      } else if (type === 'MADE_3PT') {
        threeMakes++;
        if (payload.assistorId || e.assistorId) {
          assistedFGs++;
        }
      } else if (type === 'MADE_2PT') {
        if (payload.assistorId || e.assistorId) {
          assistedFGs++;
        }
        if (x !== undefined && y !== undefined) {
          const geo = calculateShotType(x, y);
          if (geo.zone === 'paint') {
            paintMakes++;
          } else {
            midRangeMakes++;
          }
        } else if (dist !== undefined && dist <= 8) {
          paintMakes++;
        } else {
          // If neither is present, count as paint (layup/dunk)
          paintMakes++;
        }
      }
    });

    const paintPts = paintMakes * 2;
    const midRangePts = midRangeMakes * 2;
    const threePts = threeMakes * 3;
    const ftPts = ftMakes * 1;
    const totalTeamPts = paintPts + midRangePts + threePts + ftPts || runningTeam || 1;
    const totalFGs = paintMakes + midRangeMakes + threeMakes;

    // Detect points off turnovers
    events.forEach((e, idx) => {
      const type = e.eventType || e.type;
      if (type.startsWith('MADE_')) {
        const p = e.period ?? e.payload?.period ?? 1;
        const m = e.minuteOccurred ?? 0;
        // Look back for opponent turnover in same period within 2 minutes
        const prevEvents = events.slice(Math.max(0, idx - 5), idx);
        const hasOppTurnover = prevEvents.some((pe) => {
          const pt = pe.eventType || pe.type;
          const pp = pe.period ?? pe.payload?.period ?? 1;
          const pm = pe.minuteOccurred ?? 0;
          return pt === 'TURNOVER' && pe.payload?.team === 'opponent' && pp === p && m - pm <= 2;
        });
        if (hasOppTurnover) {
          const pts = type === 'MADE_1PT' ? 1 : type === 'MADE_3PT' ? 3 : 2;
          pointsOffTurnovers += pts;
        }
      }
    });

    const scoringDistribution = {
      paintPts,
      paintPct: totalTeamPts > 0 ? Math.round((paintPts / totalTeamPts) * 100) : 0,
      threePts,
      threePct: totalTeamPts > 0 ? Math.round((threePts / totalTeamPts) * 100) : 0,
      midRangePts,
      midRangePct: totalTeamPts > 0 ? Math.round((midRangePts / totalTeamPts) * 100) : 0,
      ftPts,
      ftPct: totalTeamPts > 0 ? Math.round((ftPts / totalTeamPts) * 100) : 0,
      totalPts: totalTeamPts,
      assistedFGs,
      totalFGs,
      assistedPct: totalFGs > 0 ? Math.round((assistedFGs / totalFGs) * 100) : 0,
      pointsOffTurnovers,
    };

    // 6. Quarter-by-Quarter Period Recap Cards
    const periodRecaps = [];
    for (let p = 1; p <= maxPeriod; p++) {
      const periodEvents = events.filter((e) => (e.period ?? e.payload?.period ?? 1) === p);
      let pTeamPts = 0;
      let pOppPts = 0;
      const playerPtsMap = new Map<string, { pts: number; fg3M: number; fg3A: number; ftM: number; ftA: number }>();

      let pFgMade = 0;
      let pFgAtt = 0;
      let pFg3Made = 0;
      let pFg3Att = 0;

      periodEvents.forEach((e) => {
        const type = e.eventType || e.type;
        const payload = e.payload || {};
        const pid = (e.playerId || payload.playerId || payload.scorerId) as string;

        if (type === 'MADE_1PT' || type === 'MADE_2PT' || type === 'MADE_3PT') {
          const pts = type === 'MADE_1PT' ? 1 : type === 'MADE_2PT' ? 2 : 3;
          pTeamPts += pts;

          if (pid) {
            const cur = playerPtsMap.get(pid) || { pts: 0, fg3M: 0, fg3A: 0, ftM: 0, ftA: 0 };
            cur.pts += pts;
            if (type === 'MADE_3PT') {
              cur.fg3M++;
              cur.fg3A++;
            }
            if (type === 'MADE_1PT') {
              cur.ftM++;
              cur.ftA++;
            }
            playerPtsMap.set(pid, cur);
          }

          if (type !== 'MADE_1PT') {
            pFgMade++;
            pFgAtt++;
            if (type === 'MADE_3PT') {
              pFg3Made++;
              pFg3Att++;
            }
          }
        } else if (type === 'MISSED_1PT' || type === 'MISSED_2PT' || type === 'MISSED_3PT') {
          if (type !== 'MISSED_1PT') {
            pFgAtt++;
            if (type === 'MISSED_3PT') {
              pFg3Att++;
            }
          }
          if (pid) {
            const cur = playerPtsMap.get(pid) || { pts: 0, fg3M: 0, fg3A: 0, ftM: 0, ftA: 0 };
            if (type === 'MISSED_3PT') cur.fg3A++;
            if (type === 'MISSED_1PT') cur.ftA++;
            playerPtsMap.set(pid, cur);
          }
        } else if (type === 'OPPONENT_SCORE') {
          const pts = Number(payload.points ?? e.points ?? 2);
          pOppPts += pts;
        }
      });

      const margin = pTeamPts - pOppPts;
      const marginFormatted = margin > 0 ? `+${margin}` : margin < 0 ? `${margin}` : 'EVEN';

      // Find top scorer
      let topScorerName = '—';
      let topScorerJersey: string | number = '';
      let topScorerPts = 0;
      let topScorerStatLine = '—';

      if (playerPtsMap.size > 0) {
        const sortedScorers = [...playerPtsMap.entries()].sort((a, b) => b[1].pts - a[1].pts);
        const top = sortedScorers[0];
        const playerEntry = lineup.find((l) => l.playerId === top[0]);
        if (playerEntry) {
          topScorerName = `${playerEntry.player.firstName} ${playerEntry.player.lastName}`;
          topScorerJersey = playerEntry.player.jerseyNumber ?? '';
          topScorerPts = top[1].pts;
          const statParts = [`${top[1].pts} PTS`];
          if (top[1].fg3A > 0) statParts.push(`${top[1].fg3M}/${top[1].fg3A} 3PT`);
          if (top[1].ftA > 0) statParts.push(`${top[1].ftM}/${top[1].ftA} FT`);
          topScorerStatLine = statParts.join(', ');
        }
      }

      let takeaway = 'Tied quarter';
      if (margin > 0) {
        takeaway = `Outscored opponent by +${margin}`;
      } else if (margin < 0) {
        takeaway = `Opponent +${-margin} advantage`;
      }

      periodRecaps.push({
        period: p,
        label: p <= 4 ? `Q${p}` : `OT${p - 4}`,
        teamScore: pTeamPts,
        opponentScore: pOppPts,
        margin,
        marginFormatted,
        topScorerName,
        topScorerJersey,
        topScorerPts,
        topScorerStatLine,
        fgMade: pFgMade,
        fgAtt: pFgAtt,
        fgPct: pFgAtt > 0 ? Math.round((pFgMade / pFgAtt) * 100) : 0,
        fg3Made: pFg3Made,
        fg3Att: pFg3Att,
        fg3Pct: pFg3Att > 0 ? Math.round((pFg3Made / pFg3Att) * 100) : 0,
        takeaway,
      });
    }

    // 7. Key Plays
    const keyPlays: {
      id: string;
      period: number;
      periodLabel: string;
      minuteOccurred: number;
      isTeam: boolean;
      points: number;
      type: string;
      description: string;
      secondaryText?: string;
      badgeLabel: string;
      badgeColor: string;
    }[] = [];

    steps.forEach((s, idx) => {
      const pLabel = s.period <= 4 ? `Q${s.period}` : `OT${s.period - 4}`;
      const isLeadChange = idx > 0 && Math.sign(s.diff) !== Math.sign(steps[idx - 1].diff) && s.diff !== 0;
      const isClutch = s.period >= 4 && s.minute >= 5 && Math.abs(s.diff) <= 5;
      const is3Pt = s.type === 'MADE_3PT';

      if (isLeadChange || isClutch || is3Pt) {
        let badgeLabel = 'Scoring Play';
        let badgeColor = 'primary';
        if (isLeadChange) {
          badgeLabel = 'LEAD CHANGE';
          badgeColor = 'warning';
        } else if (isClutch) {
          badgeLabel = 'CLUTCH PLAY';
          badgeColor = 'danger';
        } else if (is3Pt) {
          badgeLabel = '3-POINTER';
          badgeColor = 'secondary';
        }

        let desc = '';
        if (s.isTeam) {
          const jersey = s.scorerJersey !== undefined ? `#${s.scorerJersey} ` : '';
          desc = `${s.type === 'MADE_3PT' ? '3PT Field Goal' : 'Field Goal'} by ${jersey}${s.scorerName || 'Team'}`;
        } else {
          desc = `Opponent Score (+${s.points} PTS)`;
        }

        let sec = '';
        if (s.assistorName) {
          const aJersey = s.assistorJersey !== undefined ? `#${s.assistorJersey} ` : '';
          sec = `Assisted by ${aJersey}${s.assistorName}`;
        }

        keyPlays.push({
          id: s.rawEvent.id || `kp-${idx}`,
          period: s.period,
          periodLabel: pLabel,
          minuteOccurred: s.minute,
          isTeam: s.isTeam,
          points: s.points,
          type: s.type,
          description: desc,
          secondaryText: sec || undefined,
          badgeLabel,
          badgeColor,
        });
      }
    });

    return {
      momentum: {
        largestLeadTeam: maxLeadTeam,
        largestLeadTeamMoment: maxLeadTeamMoment,
        largestLeadOpponent: maxLeadOpp,
        largestLeadOpponentMoment: maxLeadOppMoment,
        leadChanges,
        timesTied,
        biggestRunTeam: maxTeamRun,
        biggestRunOpponent: maxOppRun,
        biggestRunLabel,
        svgCurvePath: curvePath,
        svgAreaPath: areaPath,
        periodDividers,
        maxLeadTeamPoint: maxLeadTeamPoint as { x: number; y: number } | null,
        maxLeadOppPoint: maxLeadOppPoint as { x: number; y: number } | null,
        maxAbsDiff,
      },
      pivotalMoments: topPivotalMoments,
      scoringDistribution,
      periodRecaps,
      keyPlays: keyPlays.slice(0, 10),
      fullPlaysCount: steps.length,
    };
  });

  protected getPlayerName(playerId: string | undefined): string {
    if (!playerId) return '';
    const entry = this.lineup().find(l => l.playerId === playerId);
    return entry ? `${entry.player.firstName} ${entry.player.lastName}` : '';
  }

  protected getPlayerJersey(playerId: string | undefined): string | number {
    if (!playerId) return '-';
    const entry = this.lineup().find(l => l.playerId === playerId);
    return entry?.player?.jerseyNumber ?? '-';
  }

  protected getPlayerDisplayName(playerId: string | undefined): string {
    if (!playerId) return '';
    const entry = this.lineup().find(l => l.playerId === playerId);
    if (!entry) return '';
    const jersey = entry.player?.jerseyNumber !== undefined && entry.player?.jerseyNumber !== null ? `#${entry.player.jerseyNumber} ` : '';
    return `${jersey}${entry.player.firstName} ${entry.player.lastName}`;
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
        sportName: this.sportName(),
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
      .filter(e => e.eventType === 'GOAL' || e.eventType === 'OPPONENT_GOAL' || e.eventType === 'OPPONENT_OWN_GOAL' || e.eventType === 'OWN_GOAL' || e.eventType === 'ASSIST')
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
    const isBB = this.sportName() === 'Basketball';
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

    if (isBB) {
      const events = this.gameEvents();
      let team = 0;
      let opponent = 0;
      events.forEach(e => {
        const type = e.eventType || e.type;
        if (type === 'MADE_1PT') team += 1;
        else if (type === 'MADE_2PT') team += 2;
        else if (type === 'MADE_3PT') team += 3;
        else if (type === 'OPPONENT_SCORE') {
          const pts = Number(e['points'] ?? e['payload']?.points ?? 2);
          opponent += pts;
        }
      });
      if (events.length === 0 && g && (g.status === 'completed' || g.status === 'abandoned_weather') && g.goalsFor !== null && g.goalsAgainst !== null) {
        return { team: g.goalsFor ?? 0, opponent: g.goalsAgainst ?? 0 };
      }
      return { team, opponent };
    }

    if (g && (g.status === 'completed' || g.status === 'abandoned_weather') && g.goalsFor !== null && g.goalsAgainst !== null) {
      return { team: g.goalsFor ?? 0, opponent: g.goalsAgainst ?? 0 };
    }

    const events = this.goals();
    const team = events.filter(e => e.eventType === 'GOAL' || e.eventType === 'OPPONENT_OWN_GOAL').length;
    const opponent = events.filter(e => e.eventType === 'OPPONENT_GOAL' || e.eventType === 'OWN_GOAL').length;
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
      shieldOutline,
      chatboxEllipsesOutline,
      basketballOutline,
      flameOutline,
      trendingUpOutline,
      flashOutline,
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

  protected isCreatingDossier = signal(false);

  protected async createOpponentDossier(): Promise<void> {
    const g = this.game();
    const teamId = this.teamId;
    if (!g || !g.opponent || !teamId) return;

    this.isCreatingDossier.set(true);
    try {
      const opp = await firstValueFrom(
        this.opponentsService.findOrCreateOpponent(teamId, {
          name: g.opponent,
          eventId: g.id,
        })
      );
      this.opponentDossier.set(opp);
      if (g) {
        this.game.set({ ...g, opponentId: opp.id });
      }
      const toast = await this.toastController.create({
        message: `Opponent dossier created for ${opp.name}!`,
        duration: 2500,
        color: 'success',
      });
      await toast.present();
    } catch (err) {
      console.error('Failed to create opponent dossier', err);
      const toast = await this.toastController.create({
        message: 'Failed to create opponent dossier. Please try again.',
        duration: 3000,
        color: 'danger',
      });
      await toast.present();
    } finally {
      this.isCreatingDossier.set(false);
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

  protected isBasketballShotEvent(type?: string): boolean {
    return ['MADE_2PT', 'MADE_3PT', 'MISSED_2PT', 'MISSED_3PT', 'MADE_1PT', 'MISSED_1PT'].includes(type || '');
  }

  protected openCreateModal(): void {
    this.isCreateMode.set(true);
    this.createEventType.set(this.sportName() === 'Basketball' ? 'MADE_2PT' : 'SUB');
    this.editEvent.set(null);
    this.editPeriod.set(1);
    this.editMinute.set(0);
    this.editPlayerIn.set(null);
    this.editPlayerOut.set(null);
    this.editPosition.set(this.sportName() === 'Volleyball' ? 'Setter' : (this.sportName() === 'Basketball' ? 'PG' : 'MID'));
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
    } else if (['MADE_2PT', 'MADE_3PT'].includes(type)) {
      payload['scorerId'] = this.editScorerId() || this.editPlayerId();
      payload['playerId'] = this.editScorerId() || this.editPlayerId();
      if (this.editAssistorId()) {
        payload['assistorId'] = this.editAssistorId();
      }
    } else if (['MADE_1PT', 'MISSED_1PT', 'MISSED_2PT', 'MISSED_3PT'].includes(type)) {
      payload['playerId'] = this.editScorerId() || this.editPlayerId();
    } else if (type === 'OPPONENT_SCORE') {
      payload['points'] = 2;
    } else if (type === 'OWN_GOAL') {
      payload['playerId'] = this.editPlayerId();
    } else if (type === 'OPPONENT_OWN_GOAL' || type === 'OPPONENT_GOAL' || type === 'OPPONENT_SHOT' || type === 'OPPONENT_CORNER_KICK' || type === 'OPPONENT_FOUL' || type === 'TIMEOUT') {
      // No player associated
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
    } else if (['MADE_2PT', 'MADE_3PT'].includes(event.eventType)) {
      payload['scorerId'] = this.editScorerId() || this.editPlayerId();
      payload['playerId'] = this.editScorerId() || this.editPlayerId();
      if (this.editAssistorId()) {
        payload['assistorId'] = this.editAssistorId();
      } else {
        delete payload['assistorId'];
      }
    } else if (['MADE_1PT', 'MISSED_1PT', 'MISSED_2PT', 'MISSED_3PT'].includes(event.eventType)) {
      payload['playerId'] = this.editScorerId() || this.editPlayerId();
    } else if (event.eventType === 'OPPONENT_SCORE') {
      payload['points'] = payload['points'] || 2;
    } else if (event.eventType === 'OWN_GOAL') {
      payload['playerId'] = this.editPlayerId();
    } else if (event.eventType === 'OPPONENT_OWN_GOAL' || event.eventType === 'OPPONENT_GOAL' || event.eventType === 'OPPONENT_SHOT' || event.eventType === 'OPPONENT_CORNER_KICK' || event.eventType === 'OPPONENT_FOUL' || event.eventType === 'TIMEOUT') {
      // No player associated
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
