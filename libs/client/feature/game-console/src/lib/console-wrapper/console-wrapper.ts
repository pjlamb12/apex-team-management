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
        return this.http.get<any>(`${url}/teams/${teamId}/events/${eventId}`);
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
      switchMap(({ teamId, eventId }) => {
        const url = this.apiUrl;
        if (!url) return [];
        return this.http.get<LineupEntry[]>(`${url}/teams/${teamId}/events/${eventId}/lineup`);
      }),
      tap((lineup) => {
        const eventId = this.eventId();
        const teamId = this.teamId();
        if (eventId && teamId) {
          this.stateService.initialize(eventId, lineup, teamId);
          this.clockService.initialize(eventId);
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

  protected addOpponentGoal(): void {
    this.stateService.addOpponentGoal(this.clockService.currentMinute());
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
    const isSelectedActive = activePlayers.some(p => (p as any).id === currentSelectionId);
    
    // 1. Position Swap: Both are active
    if (isSelectedActive && isTappedActive) {
      const playerA = activePlayers.find(p => (p as any).id === currentSelectionId) as any;
      const playerB = activePlayers.find(p => (p as any).id === player.id) as any;

      if (playerA && playerB && playerA.slotIndex !== undefined && playerB.slotIndex !== undefined) {
        this.stateService.pushEvent({
          type: 'POSITION_SWAP',
          slotIndexA: playerA.slotIndex,
          slotIndexB: playerB.slotIndex,
          timestamp: Date.now(),
          minuteOccurred: this.clockService.currentMinute(),
        });
      }
      this.selectedPlayerId.set(null);
      this.actionPlayer.set(null);
    }
    // 2. Substitution: One active, one bench
    else if ((isSelectedOnBench && isTappedActive) || (isSelectedActive && isTappedOnBench)) {
      const inPlayerId = isSelectedOnBench ? currentSelectionId : player.id;
      const outPlayerId = isSelectedActive ? currentSelectionId : player.id;

      const outgoingActive = activePlayers.find(p => (p as any).id === outPlayerId) as any;
      
      if (outgoingActive && outgoingActive.slotIndex !== undefined) {
        this.stateService.pushEvent({
          type: 'SUB',
          playerIdIn: inPlayerId,
          playerIdOut: outPlayerId,
          slotIndex: outgoingActive.slotIndex,
          positionName: outgoingActive.preferredPosition ?? 'Unknown',
          timestamp: Date.now(),
          minuteOccurred: this.clockService.currentMinute(),
        });
      }
      
      this.selectedPlayerId.set(null);
      this.actionPlayer.set(null);
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
