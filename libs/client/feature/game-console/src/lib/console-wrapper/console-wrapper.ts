import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, switchMap, filter, tap } from 'rxjs';
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
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronBackOutline, playOutline, pauseOutline } from 'ionicons/icons';
import { LiveClockService } from '../live-clock.service';
import { LiveGameStateService, LineupEntry } from '../live-game-state.service';
import { ClockDisplayComponent } from '../clock-display/clock-display';
import { RuntimeConfigLoaderService } from 'runtime-config-loader';
import { BenchViewComponent } from '../bench-view/bench-view';
import { SoccerPitchViewComponent } from '../soccer-pitch-view/soccer-pitch-view';
import { PlayerActionMenuComponent } from '../player-action-menu/player-action-menu';
import { EventLogViewComponent } from '../event-log/event-log';
import { EventSyncService } from '../event-sync.service';
import { Player } from '@apex-team/shared/util/models';

@Component({
  selector: 'app-console-wrapper',
  imports: [
    CommonModule,
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent,
    IonPopover,
    ClockDisplayComponent,
    BenchViewComponent,
    SoccerPitchViewComponent,
    PlayerActionMenuComponent,
    EventLogViewComponent,
    IonBackButton,
  ],
  templateUrl: './console-wrapper.html',
  styleUrls: ['./console-wrapper.scss'],
})
export class ConsoleWrapper implements OnInit {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private config = inject(RuntimeConfigLoaderService);
  protected clockService = inject(LiveClockService);
  protected stateService = inject(LiveGameStateService);
  protected syncService = inject(EventSyncService);

  private get apiUrl(): string {
    return this.config.getConfigObjectKey('apiBaseUrl') as string;
  }

  protected gameId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('gameId')))
  );

  protected teamId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('id')))
  );

  protected game = toSignal(
    this.route.paramMap.pipe(
      map((params) => params.get('gameId')),
      filter((id): id is string => !!id),
      switchMap((id) => this.http.get<any>(`${this.apiUrl}/games/${id}`))
    )
  );

  protected lineup = toSignal(
    this.route.paramMap.pipe(
      map((params) => params.get('gameId')),
      filter((id): id is string => !!id),
      switchMap((id) => this.http.get<LineupEntry[]>(`${this.apiUrl}/games/${id}/lineup`)),
      tap((lineup) => {
        const gameId = this.gameId();
        if (gameId) {
          this.stateService.initialize(gameId, lineup);
          this.clockService.initialize(gameId);
        }
      })
    )
  );

  protected isRunning = this.clockService.isRunning;

  protected selectedPlayerId = signal<string | null>(null);
  protected actionPlayer = signal<Player | null>(null);
  protected popoverEvent = signal<Event | null>(null);

  constructor() {
    addIcons({ chevronBackOutline, playOutline, pauseOutline });
  }

  ngOnInit(): void {
    // Initialization logic if needed
  }

  protected startClock(): void {
    this.clockService.start();
  }

  protected stopClock(): void {
    this.clockService.stop();
  }

  protected handlePlayerSelection(data: { player: Player; event: Event }): void {
    const { player, event } = data;
    const currentSelectionId = this.selectedPlayerId();
    
    // Check if one is bench and one is pitch
    const benchPlayers = this.stateService.benchPlayers();
    const activePlayers = this.stateService.activePlayers();

    const isTappedActive = activePlayers.some(p => p.id === player.id);
    const isTappedOnBench = benchPlayers.some(p => p.id === player.id);

    // If no selection, select this player
    if (!currentSelectionId) {
      this.selectedPlayerId.set(player.id);
      
      // If we tapped an active player and no bench player was selected, show actions
      if (isTappedActive) {
        this.actionPlayer.set(player);
        this.popoverEvent.set(event);
      }
      return;
    }

    // If tapping same player, deselect
    if (currentSelectionId === player.id) {
      this.selectedPlayerId.set(null);
      this.actionPlayer.set(null);
      return;
    }

    const isSelectedOnBench = benchPlayers.some(p => p.id === currentSelectionId);
    const isSelectedActive = activePlayers.some(p => p.id === currentSelectionId);
    
    // Swap only if one is active and one is bench
    if ((isSelectedOnBench && isTappedActive) || (isSelectedActive && isTappedOnBench)) {
      const inPlayerId = isSelectedOnBench ? currentSelectionId : player.id;
      const outPlayerId = isSelectedActive ? currentSelectionId : player.id;

      // Determine the position the outgoing player held so we can pass it to the backend
      const outgoingActive = activePlayers.find(p => p.id === outPlayerId);
      const positionName = outgoingActive?.preferredPosition ?? 'Unknown';

      this.stateService.pushEvent({
        type: 'SUB',
        playerIdIn: inPlayerId,
        playerIdOut: outPlayerId,
        positionName,
        timestamp: Date.now(),
        minuteOccurred: this.clockService.currentMinute(),
      });
      
      this.selectedPlayerId.set(null);
    } else {
      // Just change selection to the new player
      this.selectedPlayerId.set(player.id);

      // If we switched to another active player, show its actions
      if (isTappedActive) {
        this.actionPlayer.set(player);
        this.popoverEvent.set(event);
      } else {
        this.actionPlayer.set(null);
      }
    }
  }

  protected handleAction(action: { type: string; playerId: string }): void {
    const baseEvent = {
      type: action.type,
      timestamp: Date.now(),
      minuteOccurred: this.clockService.currentMinute(),
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
