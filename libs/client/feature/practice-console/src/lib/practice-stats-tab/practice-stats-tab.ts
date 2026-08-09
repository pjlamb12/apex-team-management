import {
  Component,
  inject,
  signal,
  computed,
  OnInit,
  OnDestroy,
  Input,
  ViewChild,
  AfterViewInit,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonButton,
  IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  handRightOutline,
  starOutline,
  closeCircleOutline,
  flashOutline,
  arrowForwardOutline,
  alertCircleOutline,
  trashOutline,
  checkmarkCircleOutline,
  closeOutline,
  informationCircleOutline,
} from 'ionicons/icons';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import {
  EventsService,
  PlayersService,
} from '@apex-team/client/data-access/team';
import { SocketService } from '@apex-team/client/shared/services';
import { PlayerEntity } from '@apex-team/client/data-access/team';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-practice-stats-tab',
  standalone: true,
  imports: [CommonModule, IonButton, IonIcon],
  templateUrl: './practice-stats-tab.html',
  styleUrl: './practice-stats-tab.scss',
})
export class PracticeStatsTab implements OnInit, OnDestroy, AfterViewInit {
  @Input({ required: true }) teamId!: string;
  @Input({ required: true }) eventId!: string;

  @ViewChild('toastContainer') toastContainerEl?: ElementRef<HTMLDivElement>;

  private readonly eventsService = inject(EventsService);
  private readonly playersService = inject(PlayersService);
  private readonly socketService = inject(SocketService);

  protected players = signal<PlayerEntity[]>([]);
  protected selectedPlayerId = signal<string | null>(null);
  protected events = signal<any[]>([]);
  protected toasts = signal<{
    id: string;
    message: string;
    subMessage?: string;
    category: 'success' | 'error' | 'attempt' | 'info' | 'delete';
    type: string;
    isLeaving?: boolean;
  }[]>([]);

  // Computed sorted list of active events (newest first)
  protected sortedEvents = computed(() => {
    return [...this.events()]
      .filter((e) => e.status !== 'deleted')
      .sort((a, b) => {
        const timeA = new Date(a.createdAt || a.timestamp || 0).getTime();
        const timeB = new Date(b.createdAt || b.timestamp || 0).getTime();
        return timeB - timeA;
      });
  });

  // Calculate box score statistics for each player
  protected playerStats = computed(() => {
    const rawEvents = this.events().filter((e) => e.status !== 'deleted');
    const stats: Record<
      string,
      {
        kills: number;
        hits: number;
        hittingErrors: number;
        setAttempts: number;
        setAssists: number;
        setErrors: number;
        passCount: number;
        passScoreSum: number;
        aces: number;
        serviceErrors: number;
        serveAttempts: number;
      }
    > = {};

    rawEvents.forEach((e) => {
      const payload = e.payload || {};
      const pid = e.playerId || payload.playerId || payload.scorerId || payload.assistorId || e.scorerId || e.assistorId;
      if (!pid) return;

      if (!stats[pid]) {
        stats[pid] = {
          kills: 0,
          hits: 0,
          hittingErrors: 0,
          setAttempts: 0,
          setAssists: 0,
          setErrors: 0,
          passCount: 0,
          passScoreSum: 0,
          aces: 0,
          serviceErrors: 0,
          serveAttempts: 0,
        };
      }

      const type = e.eventType || e.type;
      if (type === 'KILL') {
        stats[pid].kills++;
      } else if (type === 'HITTING_ERROR') {
        stats[pid].hittingErrors++;
      } else if (type === 'HIT') {
        stats[pid].hits++;
      } else if (type === 'SET_ATTEMPT') {
        stats[pid].setAttempts++;
      } else if (type === 'SET_ASSIST') {
        stats[pid].setAssists++;
      } else if (type === 'SET_ERROR') {
        stats[pid].setErrors++;
      } else if (type === 'SERVE_RECEIVE') {
        stats[pid].passCount++;
        const score = payload.score ?? e.score ?? 0;
        stats[pid].passScoreSum += score;
      } else if (type === 'SERVE_ATTEMPT') {
        stats[pid].serveAttempts++;
      } else if (type === 'ACE') {
        stats[pid].aces++;
      } else if (type === 'SERVICE_ERROR') {
        stats[pid].serviceErrors++;
      }
    });

    return stats;
  });

  constructor() {
    addIcons({
      handRightOutline,
      starOutline,
      closeCircleOutline,
      flashOutline,
      arrowForwardOutline,
      alertCircleOutline,
      trashOutline,
      checkmarkCircleOutline,
      closeOutline,
      informationCircleOutline,
    });
  }

  ngAfterViewInit() {
    if (this.toastContainerEl) {
      const ionApp = document.querySelector('ion-app') || document.body;
      ionApp.appendChild(this.toastContainerEl.nativeElement);
    }
  }

  ngOnInit() {
    this.loadPlayers();
    this.loadEvents();

    this.socketService.onEvent('gameEventCreated', (gameEvent: any) => {
      if (gameEvent.eventId === this.eventId) {
        this.events.update((list) => [...list, gameEvent]);
      }
    });

    this.socketService.onEvent('gameEventDeleted', (data: any) => {
      if (data.eventId === this.eventId) {
        this.events.update((list) =>
          list.filter((e) => e.id !== data.id && e.id !== data.gameEventId)
        );
      }
    });
  }

  ngOnDestroy() {
    this.socketService.offEvent('gameEventCreated');
    this.socketService.offEvent('gameEventDeleted');
    
    if (this.toastContainerEl) {
      const el = this.toastContainerEl.nativeElement;
      if (el.parentNode) {
        el.parentNode.removeChild(el);
      }
    }
  }

  private loadPlayers() {
    this.eventsService.getEvent(this.teamId, this.eventId).subscribe((event) => {
      const players$ = event?.seasonId
        ? this.playersService.getPlayersForSeason(this.teamId, event.seasonId)
        : this.playersService.getPlayers(this.teamId);

      players$.subscribe((list) => {
        const sorted = [...list].sort((a, b) => {
          if (a.jerseyNumber !== undefined && b.jerseyNumber !== undefined) {
            return a.jerseyNumber - b.jerseyNumber;
          }
          return (a.lastName || '').localeCompare(b.lastName || '');
        });
        this.players.set(sorted);
      });
    });
  }

  private loadEvents() {
    this.eventsService.getGameEvents(this.teamId, this.eventId).subscribe((list) => {
      this.events.set(list);
    });
  }

  protected selectPlayer(playerId: string) {
    this.selectedPlayerId.set(this.selectedPlayerId() === playerId ? null : playerId);
  }

  private getCategory(type: string, score?: number): 'success' | 'error' | 'attempt' | 'info' | 'delete' {
    if (type === 'SERVE_RECEIVE' && score !== undefined) {
      if (score >= 2) return 'success';
      if (score === 1) return 'attempt';
      return 'error';
    }
    
    switch (type) {
      case 'KILL':
      case 'ACE':
      case 'SET_ASSIST':
        return 'success';
      case 'HITTING_ERROR':
      case 'SERVICE_ERROR':
      case 'SET_ERROR':
        return 'error';
      case 'HIT':
      case 'SERVE_ATTEMPT':
      case 'SET_ATTEMPT':
        return 'attempt';
      default:
        return 'info';
    }
  }

  private async triggerVibration(category: 'success' | 'error' | 'attempt' | 'info' | 'delete') {
    try {
      switch (category) {
        case 'success':
          await Haptics.impact({ style: ImpactStyle.Medium });
          break;
        case 'error':
          await Haptics.vibrate({ duration: 150 });
          break;
        case 'attempt':
          await Haptics.impact({ style: ImpactStyle.Light });
          break;
        case 'delete':
          await Haptics.impact({ style: ImpactStyle.Heavy });
          break;
        default:
          await Haptics.impact({ style: ImpactStyle.Light });
          break;
      }
    } catch {
      if (navigator.vibrate) {
        try {
          switch (category) {
            case 'success':
              navigator.vibrate(80);
              break;
            case 'error':
              navigator.vibrate([100, 50, 100]);
              break;
            case 'delete':
              navigator.vibrate(150);
              break;
            default:
              navigator.vibrate(40);
              break;
          }
        } catch {
          // ignore
        }
      }
    }
  }

  protected showToast(message: string, subMessage: string, category: 'success' | 'error' | 'attempt' | 'info' | 'delete', type: string) {
    const id = Math.random().toString(36).substring(2, 9);
    
    this.toasts.update((current) => {
      const next = [...current, { id, message, subMessage, category, type }];
      if (next.length > 3) {
        next[0].isLeaving = true;
      }
      return next;
    });

    setTimeout(() => {
      this.dismissToast(id);
    }, 2800);
  }

  protected dismissToast(id: string) {
    this.toasts.update((current) =>
      current.map((t) => (t.id === id ? { ...t, isLeaving: true } : t))
    );
    setTimeout(() => {
      this.toasts.update((current) => current.filter((t) => t.id !== id));
    }, 250);
  }

  protected async logAction(type: string, payloadExtra: Record<string, any> = {}) {
    const playerId = this.selectedPlayerId();
    if (!playerId) return;

    let payload: Record<string, any> = { playerId };
    if (type === 'KILL' || type === 'ACE') {
      payload = { scorerId: playerId };
    }
    payload = { ...payload, ...payloadExtra };

    try {
      const created = await firstValueFrom(
        this.eventsService.logGameEvent(this.teamId, this.eventId, {
          eventType: type,
          payload,
        })
      );
      if (!this.events().some((e) => e.id === created.id)) {
        this.events.update((list) => [...list, created]);
      }

      // Generate Toast and Vibration feedback
      const category = this.getCategory(type, payloadExtra['score']);
      const playerName = this.getPlayerNameById(playerId);
      const actionName = this.getEventLabel(created);
      
      this.showToast(
        playerName,
        `Logged: ${actionName}`,
        category,
        type
      );
      void this.triggerVibration(category);
    } catch (e) {
      console.error('Failed to log practice action:', e);
    }
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

  protected getPassAverage(passCount = 0, passScoreSum = 0): string {
    if (passCount === 0) return '-';
    return (passScoreSum / passCount).toFixed(2);
  }

  protected getPlayerShortName(player: PlayerEntity): string {
    const firstInitial = player.firstName ? `${player.firstName.charAt(0)}.` : '';
    return `${player.jerseyNumber !== null && player.jerseyNumber !== undefined ? '#' + player.jerseyNumber + ' ' : ''}${player.lastName}, ${firstInitial}`;
  }

  protected getPlayerNameById(playerId: string | null | undefined): string {
    if (!playerId) return 'Unknown Player';
    const player = this.players().find((p) => p.id === playerId);
    if (!player) return 'Unknown Player';
    return `${player.jerseyNumber ? '#' + player.jerseyNumber + ' ' : ''}${player.lastName}, ${player.firstName ? player.firstName.charAt(0) + '.' : ''}`;
  }

  protected getEventLabel(e: any): string {
    const type = e.eventType || e.type;
    const payload = e.payload || {};
    switch (type) {
      case 'KILL':
        return 'Kill';
      case 'HIT':
        return 'Hitting Attempt';
      case 'HITTING_ERROR':
        return 'Hitting Error';
      case 'SET_ATTEMPT':
        return 'Setting Attempt';
      case 'SET_ASSIST':
        return 'Setting Assist';
      case 'SET_ERROR':
        return 'Setting Error';
      case 'SERVE_RECEIVE':
        return `Pass (Score: ${payload.score ?? e.score ?? 0})`;
      case 'SERVE_ATTEMPT':
        return 'Serve Attempt';
      case 'ACE':
        return 'Ace';
      case 'SERVICE_ERROR':
        return 'Service Error';
      default:
        return type || 'Action';
    }
  }

  protected async deletePracticeEvent(gameEventId: string): Promise<void> {
    const eventToDelete = this.events().find((e) => e.id === gameEventId);
    try {
      await firstValueFrom(
        this.eventsService.deleteGameEvent(this.teamId, this.eventId, gameEventId)
      );
      this.events.update((list) => list.filter((e) => e.id !== gameEventId));

      if (eventToDelete) {
        const type = eventToDelete.eventType || eventToDelete.type;
        const playerId = eventToDelete.playerId || eventToDelete.payload?.playerId || eventToDelete.payload?.scorerId || eventToDelete.scorerId;
        const playerName = this.getPlayerNameById(playerId);
        const actionLabel = this.getEventLabel(eventToDelete);
        
        this.showToast(
          `Undone / Deleted`,
          `${playerName} - ${actionLabel}`,
          'delete',
          type
        );
        void this.triggerVibration('delete');
      }
    } catch (e) {
      console.error('Failed to delete practice event:', e);
    }
  }
}
