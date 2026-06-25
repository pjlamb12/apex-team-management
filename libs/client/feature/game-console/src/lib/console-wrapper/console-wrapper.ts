import { Component, inject, signal, computed, OnInit, OnDestroy, effect } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, switchMap, filter, tap, firstValueFrom } from 'rxjs';
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
import { chevronBackOutline, playOutline, pauseOutline, arrowForwardOutline, flagOutline, settingsOutline, alertCircleOutline, footballOutline } from 'ionicons/icons';
import { Haptics, NotificationType } from '@capacitor/haptics';
import { LiveClockService } from '../live-clock.service';
import { LiveGameStateService, RotationConfig } from '../live-game-state.service';
import { RotationService } from '../rotation-engine/rotation.service';
import { EventsService, EventEntity } from '@apex-team/client/data-access/team';
import { ClockDisplayComponent } from '../clock-display/clock-display';
import { RuntimeConfigLoaderService } from 'runtime-config-loader';
import { BenchViewComponent } from '../bench-view/bench-view';
import { SoccerPitchViewComponent } from '../soccer-pitch-view/soccer-pitch-view';
import { PlayerActionMenuComponent } from '../player-action-menu/player-action-menu';
import { EventLogViewComponent } from '../event-log/event-log';
import { SubQueueComponent } from '../sub-queue/sub-queue';
import { EventSyncService } from '../event-sync.service';
import { ShootoutScorecardComponent } from '../shootout-scorecard/shootout-scorecard';
import { SocketService } from '@apex-team/client/shared/services';
import { Player, LineupEntry } from '@apex-team/shared/util/models';
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

  protected event = toSignal(
    this.route.paramMap.pipe(
      map((params) => ({
        teamId: params.get('id'),
        eventId: params.get('eventId')
      })),
      filter((p): p is { teamId: string; eventId: string } => !!p.teamId && !!p.eventId),
      switchMap(({ teamId, eventId }) => {
        const url = this.apiUrl;
        if (!url) return [];
        return this.http.get<EventEntity>(`${url}/teams/${teamId}/events/${eventId}`);
      })
    )
  );

  protected lineup = toSignal(
    this.route.paramMap.pipe(
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
        if (!url) return [];
        return this.http.get<LineupEntry[]>(`${url}/teams/${teamId}/events/${eventId}/lineup`);
      }),
      tap(async (lineup) => {
        const eventId = this.eventId();
        const teamId = this.teamId();
        const eventData = this.event();

        // If the event is already completed, redirect and do not initialize the console
        if (eventData?.status === 'completed') {
          void this.router.navigate(['/teams', teamId, 'events', eventId, 'summary'], { replaceUrl: true });
          return;
        }

        if (eventId && teamId) {
          this.stateService.initialize(eventId, lineup, teamId, eventData?.playersOnField || undefined);
          this.clockService.initialize(
            eventId,
            eventData?.clockStartTime,
            eventData?.clockAccumulatedMs || 0
          );

          // If no events in local state, fetch from backend to restore logs
          if (this.stateService.events().length === 0) {
            try {
              const backendEvents = await firstValueFrom(this.eventsService.getGameEvents(teamId, eventId));
              if (backendEvents && backendEvents.length > 0) {
                // Map backend events to frontend GameEvent format
                const mappedEvents = backendEvents.map(be => ({
                  id: be.id,
                  type: be.eventType,
                  minuteOccurred: be.minuteOccurred,
                  timestamp: Date.now(), // Use current time since backend doesn't store original local timestamp
                  synced: true,
                  status: 'active' as const,
                  ...be.payload
                }));
                this.stateService.setEvents(mappedEvents);
              }
            } catch (err) {
              console.error('Failed to restore event logs from backend', err);
            }
          }
        }
      })
    )
  );

  protected isRunning = this.clockService.isRunning;

  protected isShootoutActive = signal(false);
  protected rotationAlertVisible = signal(false);
  protected selectedPlayerId = signal<string | null>(null);
  protected actionPlayer = signal<Player | null>(null);
  protected popoverEvent = signal<Event | null>(null);

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
      const e = this.event();
      if (e && e.status === 'completed') {
        const teamId = this.teamId();
        const eventId = this.eventId();
        if (teamId && eventId) {
          this.clockService.stop();
          void this.router.navigate(['/teams', teamId, 'events', eventId, 'summary'], { replaceUrl: true });
        }
      }
    });
  }

  ngOnInit(): void {
    // Initialization logic if needed
  }

  ngOnDestroy(): void {
    const eventId = this.eventId();
    if (eventId) {
      this.socketService.offEvent('gameEventLogged');
      this.socketService.offEvent('gameEventRemoved');
      this.socketService.offEvent('gameStatusUpdated');
      this.socketService.offEvent('eventUpdated');
      this.socketService.leaveEvent(eventId);
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

  protected async nextPeriod(): Promise<void> {
    const gameTimeMs = this.clockService.elapsedMs();
    this.stateService.pushEvent({
      type: 'PERIOD_END',
      timestamp: Date.now(),
      minuteOccurred: this.clockService.currentMinute(),
      gameTimeMs,
    });

    await this.clockService.stop();
    await this.clockService.reset();
    this.stateService.nextPeriod();
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

    // 1. Log a final PERIOD_END event so all active player stints are closed at the correct timestamp
    this.stateService.pushEvent({
      type: 'PERIOD_END',
      timestamp: Date.now(),
      minuteOccurred: currentMinute,
      gameTimeMs: elapsedMs,
    });

    await this.clockService.stop();
    this.stateService.endGame();

    // 2. Sync final status, score, and actual elapsed duration to the database
    const teamId = this.teamId();
    const eventId = this.eventId();
    if (teamId && eventId) {
      const score = this.stateService.score();
      const actualDuration = elapsedMs > 0 ? Math.ceil(elapsedMs / 60000) : undefined;

      await firstValueFrom(this.eventsService.updateEvent(teamId, eventId, {
        status: 'completed',
        goalsFor: score.team,
        goalsAgainst: score.opponent,
        ...(actualDuration ? { durationMinutes: actualDuration } : {})
      }));
      
      // Navigate to summary
      void this.router.navigate(['/teams', teamId, 'events', eventId, 'summary']);
    }
  }

  protected handlePlayerSelection(data: { player: Player; event: Event }): void {
    const { player, event } = data;
    const currentSelectionId = this.selectedPlayerId();
    
    // Check if one is bench and one is pitch
    const benchPlayers = this.stateService.benchPlayers();
    const activePlayers = this.stateService.activePlayers();

    const tappedActive = activePlayers.find(p => p.id === player.id);
    const tappedOnBench = !tappedActive && benchPlayers.some(p => p.id === player.id);

    // If no selection, select this player
    if (!currentSelectionId) {
      this.selectedPlayerId.set(player.id);
      
      // If we tapped an active player, don't show popover immediately
      // User must tap AGAIN to show popover
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
      const playerA = selectedActive as any;
      const playerB = tappedActive as any;

      if (playerA.slotIndex !== undefined && playerB.slotIndex !== undefined) {
        this.stateService.pushEvent({
          type: 'POSITION_SWAP',
          slotIndexA: playerA.slotIndex,
          slotIndexB: playerB.slotIndex,
          timestamp: Date.now(),
          minuteOccurred: this.clockService.currentMinute(),
          gameTimeMs: this.clockService.elapsedMs(),
        });
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
    }
  }

  protected handleEmptySlotSelection(slotIndex: number): void {
    const currentSelectionId = this.selectedPlayerId();
    if (!currentSelectionId) return;

    const activePlayers = this.stateService.activePlayers();
    const selectedActive = activePlayers.find(p => p.id === currentSelectionId) as any;

    if (selectedActive && selectedActive.slotIndex !== undefined) {
      // Move active player to new slot
      this.stateService.pushEvent({
        type: 'POSITION_SWAP',
        slotIndexA: selectedActive.slotIndex,
        slotIndexB: slotIndex,
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

    const events = staged.map(sub => {
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

  protected handleClearSubs(): void {
    this.stateService.clearStagedSubs();
  }

  protected handleAction(action: { type: string; playerId: string }): void {
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
    } else {
      // YELLOW_CARD, RED_CARD, and any other player-centric events
      eventPayload = { playerId: action.playerId };
    }

    this.stateService.pushEvent({ ...baseEvent, ...eventPayload });
    this.selectedPlayerId.set(null);
    this.actionPlayer.set(null);
  }
}
