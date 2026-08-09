import { Component, inject, signal, computed, OnInit, OnDestroy, effect } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, switchMap, filter, tap, firstValueFrom, forkJoin, EMPTY, shareReplay } from 'rxjs';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonContent,
  IonPopover,
  IonBackButton,
  IonItem,
  IonLabel,
  IonToggle,
  IonRange,
  IonSelect,
  IonSelectOption,
  AlertController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronBackOutline, playOutline, pauseOutline, arrowForwardOutline, flagOutline, settingsOutline, alertCircleOutline, footballOutline, refreshOutline, shirtOutline, swapHorizontalOutline, trophyOutline, stopCircleOutline } from 'ionicons/icons';
import { Haptics, NotificationType } from '@capacitor/haptics';
import { LiveClockService } from '../live-clock.service';
import { LiveGameStateService, RotationConfig } from '../live-game-state.service';
import { RotationService } from '../rotation-engine/rotation.service';
import { EventsService, EventEntity, PlayersService } from '@apex-team/client/data-access/team';
import { ClockDisplayComponent } from '../clock-display/clock-display';
import { RuntimeConfigLoaderService } from 'runtime-config-loader';
import { BenchViewComponent } from '../bench-view/bench-view';
import { SoccerPitchViewComponent } from '../soccer-pitch-view/soccer-pitch-view';
import { VolleyballCourtViewComponent } from '../volleyball-court-view/volleyball-court-view';
import { PlayerActionMenuComponent } from '../player-action-menu/player-action-menu';
import { EventLogViewComponent } from '../event-log/event-log';
import { SubQueueComponent } from '../sub-queue/sub-queue';
import { EventSyncService } from '../event-sync.service';
import { ShootoutScorecardComponent } from '../shootout-scorecard/shootout-scorecard';
import { SocketService } from '@apex-team/client/shared/services';
import { Player, LineupEntry, getPositionFromSlot } from '@apex-team/shared/util/models';
import { ThemeToggle } from '@apex-team/client/ui/theme-toggle';

@Component({
  selector: 'app-console-wrapper',
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent,
    IonPopover,
    IonItem,
    IonLabel,
    IonToggle,
    IonRange,
    IonSelect,
    IonSelectOption,
    ClockDisplayComponent,
    BenchViewComponent,
    SoccerPitchViewComponent,
    VolleyballCourtViewComponent,
    PlayerActionMenuComponent,
    EventLogViewComponent,
    SubQueueComponent,
    ShootoutScorecardComponent,
    IonBackButton,
    ThemeToggle,
  ],
  templateUrl: './console-wrapper.html',
  styleUrls: ['./console-wrapper.scss'],
})
export class ConsoleWrapper implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private config = inject(RuntimeConfigLoaderService);
  protected clockService = inject(LiveClockService);
  protected stateService = inject(LiveGameStateService);
  protected rotationService = inject(RotationService);
  protected eventsService = inject(EventsService);
  protected syncService = inject(EventSyncService);
  protected playersService = inject(PlayersService);
  private socketService = inject(SocketService);
  private alertCtrl = inject(AlertController);

  private get apiUrl(): string {
    return this.config.getConfigObjectKey('apiBaseUrl') as string;
  }

  protected eventId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('eventId')))
  );

  protected teamId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('id')))
  );

  protected team = toSignal(
    this.route.paramMap.pipe(
      map((params) => params.get('id')),
      filter((id): id is string => !!id),
      switchMap((id) => {
        const url = this.apiUrl;
        if (!url) return [];
        return this.http.get<any>(`${url}/teams/${id}`);
      })
    )
  );

  private combinedData$ = this.route.paramMap.pipe(
    map((params) => ({
      teamId: params.get('id'),
      eventId: params.get('eventId')
    })),
    filter((p): p is { teamId: string; eventId: string } => !!p.teamId && !!p.eventId),
    tap(({ eventId }) => {
      this.socketService.joinEvent(eventId);
      this.socketService.onEvent('gameEventLogged', (event) => {
        this.stateService.handleRemoteEvent(event);
      });
      this.socketService.onEvent('gameEventRemoved', (data: any) => {
        this.stateService.handleRemoteDeletion(data);
      });
      this.socketService.onEvent('gameStatusUpdated', (event) => {
        this.stateService.handleRemoteStatusUpdate(event);
      });
      this.socketService.onEvent('eventUpdated', (updatedEvent: any) => {
        if (updatedEvent.id === eventId) {
          this.clockService.syncFromRemote(
            updatedEvent.clockStartTime,
            updatedEvent.clockAccumulatedMs || 0
          );
          this.stateService.handleRemoteStatusUpdate(updatedEvent);
        }
      });
    }),
    switchMap(({ teamId, eventId }) => {
      const url = this.apiUrl;
      if (!url) return EMPTY;
      
      return forkJoin({
        event: this.http.get<EventEntity>(`${url}/teams/${teamId}/events/${eventId}`),
        lineup: this.http.get<LineupEntry[]>(`${url}/teams/${teamId}/events/${eventId}/lineup`),
        team: this.http.get<any>(`${url}/teams/${teamId}`)
      }).pipe(
        tap(async ({ event, lineup, team }) => {
          // If the event is already completed, redirect and do not initialize the console
          if (event?.status === 'completed') {
            void this.router.navigate(['/teams', teamId, 'events', eventId, 'summary'], { replaceUrl: true });
            return;
          }

          if (eventId && teamId) {
            this.stateService.initialize(
              eventId,
              lineup,
              teamId,
              event?.playersOnField || undefined,
              event?.season?.team?.name || team?.name,
              team?.sport?.name,
              {
                bestOfSets: event?.league?.bestOfSets,
                setScoreGoal: event?.league?.setScoreGoal,
                winByTwo: event?.league?.winByTwo,
                pointCap: event?.league?.pointCap,
                decidingSetScoreGoal: event?.league?.decidingSetScoreGoal,
                decidingSetPointCap: event?.league?.decidingSetPointCap,
              },
              event?.opponent || undefined
            );
            this.clockService.initialize(
              eventId,
              event?.clockStartTime,
              event?.clockAccumulatedMs || 0
            );

            // If no events in local state, fetch from backend to restore logs
            try {
              const backendEvents = await firstValueFrom(this.eventsService.getGameEvents(teamId, eventId));
              if (backendEvents && backendEvents.length > 0) {
                // Map backend events to frontend GameEvent format
                const mappedEvents = backendEvents.map(be => ({
                  id: be.id,
                  type: be.eventType,
                  minuteOccurred: be.minuteOccurred,
                  timestamp: be.payload?.timestamp || Date.now(),
                  createdAt: be.createdAt,
                  synced: true,
                  status: 'active' as const,
                  payload: be.payload,
                  ...be.payload
                }));
                // Sort by timestamp to ensure they are in correct chronological order
                mappedEvents.sort((a, b) => {
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
                  const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                  const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                  return dateA - dateB;
                });
                this.stateService.setEvents(mappedEvents);
              }
            } catch (err) {
              console.error('Failed to restore event logs from backend', err);
            }
          }
        }),
        map(({ event, lineup }) => ({ event, lineup }))
      );
    }),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  protected event = toSignal(this.combinedData$.pipe(map(d => d.event)));
  protected lineup = toSignal(this.combinedData$.pipe(map(d => d.lineup)));

  protected isRunning = this.clockService.isRunning;
  protected isTransitioningPeriod = signal(false);

  protected isShootoutActive = signal(false);
  protected rotationAlertVisible = signal(false);
  protected selectedPlayerId = signal<string | null>(null);
  protected actionPlayer = signal<Player | null>(null);
  protected popoverEvent = signal<Event | null>(null);

  private reconnectedSub?: import('rxjs').Subscription;

  protected stagedInIds = computed(() => {
    return new Set(this.stateService.stagedSubs().map(s => s.inPlayerId));
  });

  constructor() {
    addIcons({
      chevronBackOutline,
      playOutline,
      pauseOutline,
      arrowForwardOutline,
      flagOutline,
      settingsOutline,
      alertCircleOutline,
      footballOutline,
      refreshOutline,
      shirtOutline,
      swapHorizontalOutline,
      trophyOutline,
      stopCircleOutline,
    });

    effect(() => {
      const elapsedMs = this.clockService.elapsedMs();
      const config = this.stateService.rotationConfig();

      if (!config.enabled || elapsedMs === 0) return;

      const intervalMs = config.intervalMinutes * 60000;
      const currentInterval = Math.floor(elapsedMs / intervalMs);

      if (currentInterval > this.stateService.lastIntervalTriggered()) {
        this.stateService.setLastIntervalTriggered(currentInterval);

        // Skip alert if subs are already staged
        if (this.stateService.stagedSubs().length > 0) {
          return;
        }

        this.rotationAlertVisible.set(true);
        this.triggerRotationAlert();
      }
    });

    effect(() => {
      const status = this.stateService.status();
      if (status === 'completed') {
        const teamId = this.teamId();
        const eventId = this.eventId();
        if (teamId && eventId) {
          this.clockService.stop();
          void this.router.navigate(['/teams', teamId, 'events', eventId, 'summary'], { replaceUrl: true });
        }
      }
    });

    effect(() => {
      const matchRes = this.stateService.matchResult();
      const status = this.stateService.status();
      if (matchRes && status !== 'completed') {
        void this.autoEndGame();
      }
    });
  }

  ngOnInit(): void {
    this.reconnectedSub = this.socketService.reconnected$.subscribe(() => {
      void this.refreshState();
    });
  }

  ngOnDestroy(): void {
    this.reconnectedSub?.unsubscribe();
    const eventId = this.eventId();
    if (eventId) {
      this.socketService.offEvent('gameEventLogged');
      this.socketService.offEvent('gameEventRemoved');
      this.socketService.offEvent('gameStatusUpdated');
      this.socketService.offEvent('eventUpdated');
      this.socketService.leaveEvent(eventId);
    }
  }

  public async refreshState(): Promise<void> {
    const teamId = this.teamId();
    const eventId = this.eventId();
    if (!teamId || !eventId) return;

    try {
      const [event, backendEvents, lineup] = await Promise.all([
        firstValueFrom(this.http.get<EventEntity>(`${this.apiUrl}/teams/${teamId}/events/${eventId}`)),
        firstValueFrom(this.eventsService.getGameEvents(teamId, eventId)),
        firstValueFrom(this.http.get<LineupEntry[]>(`${this.apiUrl}/teams/${teamId}/events/${eventId}/lineup`)),
      ]);

      if (event?.status === 'completed') {
        void this.router.navigate(['/teams', teamId, 'events', eventId, 'summary'], { replaceUrl: true });
        return;
      }

      if (event) {
        this.clockService.syncFromRemote(
          event.clockStartTime,
          event.clockAccumulatedMs || 0
        );
        this.stateService.handleRemoteStatusUpdate(event);
      }

      if (backendEvents) {
        this.stateService.reconcileBackendEvents(backendEvents);
      }

      if (lineup) {
        this.stateService.updateInitialLineup(lineup);
      }

      this.syncService.processNext();
    } catch (err) {
      console.error('Failed to refresh state after reconnect/resume', err);
    }
  }

  protected startClock(): void {
    void this.clockService.start();
    const teamId = this.teamId();
    const eventId = this.eventId();
    if (teamId && eventId) {
      void firstValueFrom(
        this.eventsService.updateEvent(teamId, eventId, {
          clockStartTime: new Date().toISOString(),
        })
      );
    }
  }

  protected stopClock(): void {
    void this.clockService.stop();
    const teamId = this.teamId();
    const eventId = this.eventId();
    if (teamId && eventId) {
      void firstValueFrom(
        this.eventsService.updateEvent(teamId, eventId, {
          clockStartTime: null,
          clockAccumulatedMs: this.clockService.elapsedMs(),
        })
      );
    }
  }

  protected startShootout(): void {
    void this.clockService.stop();
    this.isShootoutActive.set(true);
    const teamId = this.teamId();
    const eventId = this.eventId();
    if (teamId && eventId) {
      void firstValueFrom(
        this.eventsService.updateEvent(teamId, eventId, {
          clockStartTime: null,
          clockAccumulatedMs: this.clockService.elapsedMs(),
        })
      );
    }
  }

  protected addOpponentGoal(): void {
    this.stateService.addOpponentGoal(this.clockService.currentMinute(), this.clockService.elapsedMs());
  }

  protected addTeamShot(): void {
    this.stateService.pushEvent({
      type: 'SHOT',
      timestamp: Date.now(),
      minuteOccurred: this.clockService.currentMinute(),
      gameTimeMs: this.clockService.elapsedMs(),
    });
  }

  protected addTeamCorner(): void {
    this.stateService.pushEvent({
      type: 'CORNER_KICK',
      timestamp: Date.now(),
      minuteOccurred: this.clockService.currentMinute(),
      gameTimeMs: this.clockService.elapsedMs(),
    });
  }

  protected addOpponentShot(): void {
    this.stateService.pushEvent({
      type: 'OPPONENT_SHOT',
      timestamp: Date.now(),
      minuteOccurred: this.clockService.currentMinute(),
      gameTimeMs: this.clockService.elapsedMs(),
    });
  }

  protected addOpponentCorner(): void {
    this.stateService.pushEvent({
      type: 'OPPONENT_CORNER_KICK',
      timestamp: Date.now(),
      minuteOccurred: this.clockService.currentMinute(),
      gameTimeMs: this.clockService.elapsedMs(),
    });
  }

  protected addOpponentPoint(): void {
    this.stateService.pushEvent({
      type: 'POINT_LOST',
      timestamp: Date.now(),
      minuteOccurred: this.clockService.currentMinute(),
      gameTimeMs: this.clockService.elapsedMs(),
    });
  }

  protected addTeamPoint(): void {
    this.stateService.pushEvent({
      type: 'POINT_WON',
      timestamp: Date.now(),
      minuteOccurred: this.clockService.currentMinute(),
      gameTimeMs: this.clockService.elapsedMs(),
    });
  }



  protected addTeamBlock(): void {
    this.stateService.pushEvent({
      type: 'BLOCK',
      timestamp: Date.now(),
      minuteOccurred: this.clockService.currentMinute(),
      gameTimeMs: this.clockService.elapsedMs(),
    });
  }

  protected addTeamDig(): void {
    this.stateService.pushEvent({
      type: 'DIG',
      timestamp: Date.now(),
      minuteOccurred: this.clockService.currentMinute(),
      gameTimeMs: this.clockService.elapsedMs(),
    });
  }

  protected rotateActivePlayers(): void {
    const timestamp = Date.now();
    const currentMinute = this.clockService.currentMinute();
    const gameTimeMs = this.clockService.elapsedMs();
    const activePlayers = this.stateService.activePlayers();

    const getPlayerIdAtSlot = (slot: number) => activePlayers.find(p => (p as any).slotIndex === slot)?.id || '';

    const isSetComplete = !!this.stateService.currentSetResult();
    const basePayload = isSetComplete ? { hideFromLog: true } : {};

    const swaps = [
      { 
        type: 'POSITION_SWAP', 
        slotIndexA: 0, 
        slotIndexB: 1, 
        playerIdA: getPlayerIdAtSlot(0), 
        playerIdB: getPlayerIdAtSlot(1), 
        timestamp, 
        minuteOccurred: currentMinute, 
        gameTimeMs, 
        payload: { ...basePayload, slotIndexA: 0, slotIndexB: 1, playerIdA: getPlayerIdAtSlot(0), playerIdB: getPlayerIdAtSlot(1) } 
      },
      { 
        type: 'POSITION_SWAP', 
        slotIndexA: 1, 
        slotIndexB: 2, 
        playerIdA: getPlayerIdAtSlot(1), 
        playerIdB: getPlayerIdAtSlot(2), 
        timestamp: timestamp + 1, 
        minuteOccurred: currentMinute, 
        gameTimeMs, 
        payload: { ...basePayload, slotIndexA: 1, slotIndexB: 2, playerIdA: getPlayerIdAtSlot(1), playerIdB: getPlayerIdAtSlot(2) } 
      },
      { 
        type: 'POSITION_SWAP', 
        slotIndexA: 2, 
        slotIndexB: 3, 
        playerIdA: getPlayerIdAtSlot(2), 
        playerIdB: getPlayerIdAtSlot(3), 
        timestamp: timestamp + 2, 
        minuteOccurred: currentMinute, 
        gameTimeMs, 
        payload: { ...basePayload, slotIndexA: 2, slotIndexB: 3, playerIdA: getPlayerIdAtSlot(2), playerIdB: getPlayerIdAtSlot(3) } 
      },
      { 
        type: 'POSITION_SWAP', 
        slotIndexA: 3, 
        slotIndexB: 4, 
        playerIdA: getPlayerIdAtSlot(3), 
        playerIdB: getPlayerIdAtSlot(4), 
        timestamp: timestamp + 3, 
        minuteOccurred: currentMinute, 
        gameTimeMs, 
        payload: { ...basePayload, slotIndexA: 3, slotIndexB: 4, playerIdA: getPlayerIdAtSlot(3), playerIdB: getPlayerIdAtSlot(4) } 
      },
      { 
        type: 'POSITION_SWAP', 
        slotIndexA: 4, 
        slotIndexB: 5, 
        playerIdA: getPlayerIdAtSlot(4), 
        playerIdB: getPlayerIdAtSlot(5), 
        timestamp: timestamp + 4, 
        minuteOccurred: currentMinute, 
        gameTimeMs, 
        payload: { ...basePayload, slotIndexA: 4, slotIndexB: 5, playerIdA: getPlayerIdAtSlot(4), playerIdB: getPlayerIdAtSlot(5) } 
      }
    ];
    this.stateService.pushEvents(swaps);
  }


  protected async confirmEndSetEarly(): Promise<void> {
    const score = this.stateService.score();
    const alert = await this.alertCtrl.create({
      header: 'End Set Early?',
      message: `Are you sure you want to end Set ${this.stateService.currentPeriod()} early? The team with the higher score (${score.team} - ${score.opponent}) will win the set.`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'End Set',
          handler: () => {
            this.stateService.forceSetCompleted(true);
          }
        }
      ]
    });
    await alert.present();
  }

  protected async nextPeriod(): Promise<void> {
    const isVolleyball = this.stateService.sportName() === 'Volleyball';
    const setResult = this.stateService.currentSetResult();
    const score = this.stateService.score();

    // Check if score doesn't match expected winning rules (i.e. setResult is null or it was forced)
    const isUnexpected = isVolleyball && (!setResult || (setResult as any).forced);

    if (isUnexpected) {
      const alert = await this.alertCtrl.create({
        header: 'Proceed to Next Set?',
        message: `The current score (${score.team} - ${score.opponent}) does not match the expected winning rules. Are you sure you want to proceed?`,
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel'
          },
          {
            text: 'Proceed',
            handler: () => {
              this.executeNextPeriod();
            }
          }
        ]
      });
      await alert.present();
    } else {
      await this.executeNextPeriod();
    }
  }

  private async executeNextPeriod(): Promise<void> {
    if (this.isTransitioningPeriod()) return;
    this.isTransitioningPeriod.set(true);

    try {
      this.stateService.clearForceCompleted();

      const gameTimeMs = this.clockService.elapsedMs();
      this.stateService.pushEvent({
        type: 'PERIOD_END',
        timestamp: Date.now(),
        minuteOccurred: this.clockService.currentMinute(),
        gameTimeMs,
      });

      await this.clockService.stop();
      await this.clockService.reset();
      this.stateService.setLastIntervalTriggered(0);
      
      // Sync currentPeriod and reset clock to backend
      const teamId = this.teamId();
      const eventId = this.eventId();
      if (teamId && eventId) {
        await firstValueFrom(this.eventsService.updateEvent(teamId, eventId, {
          currentPeriod: this.stateService.currentPeriod(),
          clockStartTime: null,
          clockAccumulatedMs: 0
        }));
      }
    } finally {
      this.isTransitioningPeriod.set(false);
    }
  }

  private async triggerRotationAlert(): Promise<void> {
    // 1. Haptic alert
    try {
      await Haptics.notification({ type: NotificationType.Success });
    } catch (e) {
      // Ignore if not supported
    }
  }

  protected handleApplySuggestions(): void {
    const config = this.stateService.rotationConfig();
    const suggestions = this.rotationService.generateSuggestions(config);
    suggestions.forEach((s) => {
      this.stateService.stageSub(s.inPlayerId, s.outPlayerId);
    });
    this.rotationAlertVisible.set(false);
  }

  protected handleDismissAlert(): void {
    this.rotationAlertVisible.set(false);
  }

  protected async endGame(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'End Game?',
      message: 'Are you sure you want to end this game? Once ended, the game cannot be updated.',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'End Game',
          role: 'confirm',
          handler: () => {
            void this.performEndGame();
          }
        }
      ]
    });
    await alert.present();
  }

  private async performEndGame(): Promise<void> {
    const elapsedMs = this.clockService.elapsedMs();
    const currentMinute = this.clockService.currentMinute();

    // 1. Log a final PERIOD_END event so all active player stints are closed at the correct timestamp (if not already logged)
    const activeEvents = this.stateService.events().filter((e) => e.status !== 'deleted');
    const lastEvent = activeEvents[activeEvents.length - 1];
    if (!lastEvent || lastEvent.type !== 'PERIOD_END') {
      this.stateService.pushEvent({
        type: 'PERIOD_END',
        timestamp: Date.now(),
        minuteOccurred: currentMinute,
        gameTimeMs: elapsedMs,
      });
    }

    await this.clockService.stop();
    this.stateService.endGame();

    // 2. Sync final status, score, and actual elapsed duration to the database
    const teamId = this.teamId();
    const eventId = this.eventId();
    if (teamId && eventId) {
      const isVolleyball = this.stateService.sportName() === 'Volleyball';
      const score = this.stateService.score();
      const sets = this.stateService.setsWon();
      const goalsFor = isVolleyball ? sets.team : score.team;
      const goalsAgainst = isVolleyball ? sets.opponent : score.opponent;
      const actualDuration = elapsedMs > 0 ? Math.ceil(elapsedMs / 60000) : undefined;

      await firstValueFrom(this.eventsService.updateEvent(teamId, eventId, {
        status: 'completed',
        goalsFor,
        goalsAgainst,
        ...(actualDuration ? { durationMinutes: actualDuration } : {})
      }));
      
      // Navigate to summary
      void this.router.navigate(['/teams', teamId, 'events', eventId, 'summary']);
    }
  }

  private async autoEndGame(): Promise<void> {
    const elapsedMs = this.clockService.elapsedMs();
    const currentMinute = this.clockService.currentMinute();

    // Log a final PERIOD_END event so all active player stints are closed at the correct timestamp (if not already logged)
    const activeEvents = this.stateService.events().filter((e) => e.status !== 'deleted');
    const lastEvent = activeEvents[activeEvents.length - 1];
    if (!lastEvent || lastEvent.type !== 'PERIOD_END') {
      this.stateService.pushEvent({
        type: 'PERIOD_END',
        timestamp: Date.now(),
        minuteOccurred: currentMinute,
        gameTimeMs: elapsedMs,
      });
    }

    await this.clockService.stop();
    this.stateService.endGame();

    const teamId = this.teamId();
    const eventId = this.eventId();
    if (teamId && eventId) {
      const sets = this.stateService.setsWon();
      const goalsFor = sets.team;
      const goalsAgainst = sets.opponent;
      const actualDuration = elapsedMs > 0 ? Math.ceil(elapsedMs / 60000) : undefined;

      await firstValueFrom(this.eventsService.updateEvent(teamId, eventId, {
        status: 'completed',
        goalsFor,
        goalsAgainst,
        ...(actualDuration ? { durationMinutes: actualDuration } : {})
      }));
    }
  }

  protected handlePlayerSelection(data: { player: Player; event: Event }): void {
    const { player, event } = data;
    const currentSelectionId = this.selectedPlayerId();
    const isVolleyball = this.stateService.sportName() === 'Volleyball';
    
    // Check if one is bench and one is pitch
    const benchPlayers = this.stateService.benchPlayers();
    const activePlayers = this.stateService.activePlayers();

    const tappedActive = activePlayers.find(p => p.id === player.id);
    const tappedOnBench = !tappedActive && benchPlayers.some(p => p.id === player.id);

    // If no selection, select this player
    if (!currentSelectionId) {
      this.selectedPlayerId.set(player.id);
      
      if (tappedActive) {
        if (isVolleyball) {
          // In volleyball, context menu shows on first click of an active player
          this.actionPlayer.set(player);
          this.popoverEvent.set(event);
        }
      }
      return;
    }

    // If tapping same player, show actions (modal/popover)
    if (currentSelectionId === player.id) {
      if (tappedActive) {
        this.actionPlayer.set(player);
        this.popoverEvent.set(event);
      }
      return;
    }

    const selectedActive = activePlayers.find(p => (p as any).id === currentSelectionId);
    const selectedOnBench = !selectedActive && benchPlayers.some(p => p.id === currentSelectionId);
    
    // 1. Position Swap: Both are active
    if (selectedActive && tappedActive) {
      if (!isVolleyball) {
        const playerA = selectedActive as any;
        const playerB = tappedActive as any;

        if (playerA.slotIndex !== undefined && playerB.slotIndex !== undefined) {
          const sportName = this.team()?.sport?.name;
          const posA = getPositionFromSlot(playerA.slotIndex, sportName);
          const posB = getPositionFromSlot(playerB.slotIndex, sportName);

          this.stateService.pushEvent({
            type: 'POSITION_SWAP',
            slotIndexA: playerA.slotIndex,
            slotIndexB: playerB.slotIndex,
            playerIdA: playerA.id,
            playerIdB: playerB.id,
            positionNameA: posB,
            positionNameB: posA,
            timestamp: Date.now(),
            minuteOccurred: this.clockService.currentMinute(),
            gameTimeMs: this.clockService.elapsedMs(),
          });
        }
      } else {
        // In volleyball, two players on the court will never swap positions.
        // Selecting another active player just switches selection/opens context menu for them
        this.selectedPlayerId.set(player.id);
        this.actionPlayer.set(player);
        this.popoverEvent.set(event);
        return;
      }
      this.selectedPlayerId.set(null);
      this.actionPlayer.set(null);
    }
    // 2. Tactical Substitution Staging: One active, one bench
    else if ((selectedOnBench && tappedActive) || (selectedActive && tappedOnBench)) {
      const inPlayerId = selectedOnBench ? currentSelectionId : player.id;
      const outPlayerId = selectedActive ? currentSelectionId : player.id;

      this.stateService.stageSub(inPlayerId, outPlayerId);
      
      this.selectedPlayerId.set(null);
      this.actionPlayer.set(null);
    } else {
      // Just change selection to the new player
      this.selectedPlayerId.set(player.id);
      this.actionPlayer.set(null);
      if (tappedActive && isVolleyball) {
        this.actionPlayer.set(player);
        this.popoverEvent.set(event);
      }
    }
  }

  protected handleEmptySlotSelection(slotIndex: number): void {
    const currentSelectionId = this.selectedPlayerId();
    if (!currentSelectionId) return;

    const activePlayers = this.stateService.activePlayers();
    const selectedActive = activePlayers.find(p => p.id === currentSelectionId) as any;

    if (selectedActive && selectedActive.slotIndex !== undefined) {
      const sportName = this.team()?.sport?.name;
      const posB = getPositionFromSlot(slotIndex, sportName);

      // Move active player to new slot
      this.stateService.pushEvent({
        type: 'POSITION_SWAP',
        slotIndexA: selectedActive.slotIndex,
        slotIndexB: slotIndex,
        playerIdA: selectedActive.id,
        positionNameA: posB,
        timestamp: Date.now(),
        minuteOccurred: this.clockService.currentMinute(),
        gameTimeMs: this.clockService.elapsedMs(),
      });
    }

    this.selectedPlayerId.set(null);
  }

  protected handleApplySubs(): void {
    const staged = this.stateService.stagedSubs();
    if (staged.length === 0) return;

    const currentMinute = this.clockService.currentMinute();
    const gameTimeMs = this.clockService.elapsedMs();
    const timestamp = Date.now();
    const activePlayers = this.stateService.activePlayers();

    // Filter out staged subs that are no longer valid (e.g. due to remote updates)
    const validStaged = staged.filter(sub => {
      const isOutActive = activePlayers.some(p => p.id === sub.outPlayerId);
      const isInActive = activePlayers.some(p => p.id === sub.inPlayerId);
      return isOutActive && !isInActive;
    });

    if (validStaged.length === 0) {
      this.stateService.clearStagedSubs();
      return;
    }

    const events = validStaged.map(sub => {
      const outgoingActive = activePlayers.find(p => (p as any).id === sub.outPlayerId) as any;
      
      return {
        type: 'SUB',
        playerIdIn: sub.inPlayerId,
        playerIdOut: sub.outPlayerId,
        slotIndex: outgoingActive?.slotIndex ?? 0,
        positionName: outgoingActive?.preferredPosition ?? 'Unknown',
        timestamp,
        minuteOccurred: currentMinute,
        gameTimeMs,
      };
    });

    this.stateService.pushEvents(events);
    this.stateService.clearStagedSubs();
  }

  protected handleUnstageSub(playerId: string): void {
    this.stateService.unstageSub(playerId);
  }

  protected handleLiberoChange(event: any): void {
    const value = event.detail.value;
    this.stateService.pushEvent({
      type: 'LIBERO_CHANGED',
      timestamp: Date.now(),
      minuteOccurred: this.clockService.currentMinute(),
      gameTimeMs: this.clockService.elapsedMs(),
      liberoId: value || '',
      payload: { liberoId: value || '' }
    });
    this.stateService.setLiberoId(value || null);
  }

  protected handleClearSubs(): void {
    this.stateService.clearStagedSubs();
  }

  protected handleAction(action: { type: string; playerId: string; payload?: any }): void {
    const baseEvent = {
      type: action.type,
      timestamp: Date.now(),
      minuteOccurred: this.clockService.currentMinute(),
      gameTimeMs: this.clockService.elapsedMs(),
    };

    let eventPayload: Record<string, any>;
    if (action.type === 'GOAL') {
      eventPayload = { scorerId: action.playerId };
    } else if (action.type === 'ASSIST') {
      eventPayload = { assistorId: action.playerId };
    } else if (action.type === 'KILL' || action.type === 'ACE') {
      eventPayload = { scorerId: action.playerId };
    } else {
      // YELLOW_CARD, RED_CARD, and any other player-centric events
      eventPayload = { playerId: action.playerId };
    }

    if (action.payload) {
      eventPayload = { ...eventPayload, ...action.payload };
    }

    this.stateService.pushEvent({ ...baseEvent, ...eventPayload });
    this.selectedPlayerId.set(null);
    this.actionPlayer.set(null);
  }

  protected getHittingPct(kills = 0, hittingErrors = 0, hits = 0): string {
    const total = kills + hittingErrors + hits;
    if (total === 0) return '.000';
    const pct = (kills - hittingErrors) / total;
    if (pct < 0) {
      return pct.toFixed(3);
    }
    const fixed = pct.toFixed(3);
    return fixed.startsWith('0') ? fixed.substring(1) : fixed;
  }

  protected getPlayerShortName(player: Player): string {
    const firstInitial = player.firstName ? `${player.firstName.charAt(0)}.` : '';
    return `${player.jerseyNumber !== null && player.jerseyNumber !== undefined ? '#' + player.jerseyNumber + ' ' : ''}${player.lastName}, ${firstInitial}`;
  }

  protected getPassAverage(passCount = 0, passScoreSum = 0): string {
    if (passCount === 0) return '-';
    return (passScoreSum / passCount).toFixed(2);
  }

  protected async handleAddGuestPlayer(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Add Guest Player',
      inputs: [
        { name: 'firstName', type: 'text', placeholder: 'First Name' },
        { name: 'lastName', type: 'text', placeholder: 'Last Name' },
        { name: 'jerseyNumber', type: 'number', placeholder: 'Jersey Number' }
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Add',
          handler: (data) => {
            if (!data.firstName || !data.lastName || !data.jerseyNumber) {
              return false;
            }
            void this.addGuestPlayer(data.firstName, data.lastName, +data.jerseyNumber);
            return true;
          }
        }
      ]
    });
    await alert.present();
  }

  private async addGuestPlayer(firstName: string, lastName: string, jerseyNumber: number): Promise<void> {
    const tId = this.teamId();
    const eId = this.eventId();
    if (!tId || !eId) return;

    try {
      const currentEv = this.event();
      // 1. Create the guest player
      const guest = await firstValueFrom(
        this.playersService.addPlayer(tId, {
          firstName,
          lastName,
          jerseyNumber,
          isGuest: true,
          leagueId: currentEv?.leagueId || undefined,
        } as any)
      );

      // 2. Fetch the current lineup entries
      const currentLineup = await firstValueFrom(this.eventsService.getLineup(tId, eId));
      
      const newEntries = currentLineup.map(entry => ({
        playerId: entry.playerId,
        positionName: entry.positionName || undefined,
        slotIndex: entry.slotIndex !== null ? entry.slotIndex : undefined,
        status: entry.status,
      }));

      newEntries.push({
        playerId: guest.id,
        positionName: undefined,
        slotIndex: undefined,
        status: 'bench',
      });

      // 3. Save the lineup to backend
      const updatedLineup = await firstValueFrom(
        this.eventsService.saveLineup(tId, eId, { entries: newEntries })
      );

      // 4. Update the local live state service lineup so the UI updates
      this.stateService.updateInitialLineup(updatedLineup as any);
    } catch (err) {
      console.error('Failed to add guest player:', err);
    }
  }
}
