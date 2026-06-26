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
  flagOutline
} from 'ionicons/icons';
import { AttendanceList } from '@apex-team/client/ui/attendance';
import { EventsService, EventEntity, AttendanceService } from '@apex-team/client/data-access/team';
import { SocketService } from '@apex-team/client/shared/services';

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
    AttendanceList,
    IonModal,
    ShootoutScorecardComponent,
    IonGrid,
    IonRow,
    IonCol,
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
  private readonly router = inject(Router);
  private readonly socketService = inject(SocketService);

  protected game = signal<EventEntity | null>(null);
  protected gameEvents = signal<any[]>([]);
  protected playingTime = signal<Record<string, any>>({});
  protected lineup = signal<any[]>([]);
  protected activeSegment = signal<'highlights' | 'attendance' | 'playtime'>('highlights');
  protected isLoading = signal(true);
  protected errorMessage = signal<string | null>(null);

  protected stateService = inject(LiveGameStateService);
  protected syncService = inject(EventSyncService);
  protected isShootoutModalOpen = signal(false);

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
    const teamShots = events.filter(e => e.eventType === 'SHOT' || e.eventType === 'GOAL').length;
    const opponentShots = events.filter(e => e.eventType === 'OPPONENT_SHOT' || e.eventType === 'OPPONENT_GOAL').length;
    const teamCorners = events.filter(e => e.eventType === 'CORNER_KICK').length;
    const opponentCorners = events.filter(e => e.eventType === 'OPPONENT_CORNER_KICK').length;
    return {
      teamShots,
      opponentShots,
      teamCorners,
      opponentCorners,
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
        ...be.payload
      }));
      
      this.stateService.initialize(this.eventId, this.lineup(), this.teamId, gameVal.playersOnField || undefined);
      this.stateService.setEvents(mappedEvents);
      this.isShootoutModalOpen.set(true);
    }
  }

  protected async onShootoutModalClose(): Promise<void> {
    this.isShootoutModalOpen.set(false);
    await this.loadData(this.teamId, this.eventId);
  }

  protected goals = computed(() => {
    const lineup = this.lineup();
    return this.gameEvents()
      .filter(e => e.eventType === 'GOAL' || e.eventType === 'OPPONENT_GOAL')
      .map(e => {
        if (e.eventType === 'GOAL') {
          const scorerId = e.payload?.scorerId || e.payload?.playerId || e.playerId;
          const entry = lineup.find(l => l.playerId === scorerId);
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
      });
  });

  protected score = computed(() => {
    const g = this.game();
    if (g && g.status === 'completed' && g.goalsFor !== null && g.goalsAgainst !== null) {
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
      flagOutline
    });

    effect(() => {
      const tId = this._teamId();
      const eId = this._eventId();
      if (tId && eId) {
        // Clean up previous event subscription if any
        this.socketService.offEvent('gameEventLogged');
        this.socketService.offEvent('gameEventRemoved');
        
        // Join new event room
        this.socketService.joinEvent(eId);
        
        this.socketService.onEvent('gameEventLogged', (event: any) => {
          this.stateService.handleRemoteEvent(event);
          this.gameEvents.update(events => {
            if (events.some(e => e.id === event.id)) return events;
            return [...events, event];
          });
        });
        
        this.socketService.onEvent('gameEventRemoved', (data: any) => {
          this.stateService.handleRemoteDeletion(data);
          this.gameEvents.update(events => events.filter(e => e.id !== data.id));
        });

        void this.loadData(tId, eId);
      }
    });
  }

  protected async loadData(teamId: string, eventId: string): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      const [game, events, playingTime, lineup] = await Promise.all([
        firstValueFrom(this.eventsService.getEvent(teamId, eventId)),
        firstValueFrom(this.eventsService.getGameEvents(teamId, eventId)),
        firstValueFrom(this.eventsService.getPlayingTime(teamId, eventId)),
        firstValueFrom(this.eventsService.getLineup(teamId, eventId))
      ]);
      this.game.set(game);
      this.gameEvents.set(events);
      this.playingTime.set(playingTime);
      this.lineup.set(lineup);
    } catch {
      this.errorMessage.set('Failed to load game summary.');
    } finally {
      this.isLoading.set(false);
    }
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
    const s = this.score();
    if (s.team > s.opponent) return 'WIN';
    if (s.team < s.opponent) return 'LOSS';
    return 'DRAW';
  }

  protected getResultColor(game: EventEntity): string {
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
      this.socketService.leaveEvent(eId);
    }
  }
}
