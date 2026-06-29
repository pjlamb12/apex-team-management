import {
  Component,
  inject,
  signal,
  computed,
  OnInit,
  OnDestroy,
  Input,
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
} from 'ionicons/icons';
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
export class PracticeStatsTab implements OnInit, OnDestroy {
  @Input({ required: true }) teamId!: string;
  @Input({ required: true }) eventId!: string;

  private readonly eventsService = inject(EventsService);
  private readonly playersService = inject(PlayersService);
  private readonly socketService = inject(SocketService);

  protected players = signal<PlayerEntity[]>([]);
  protected selectedPlayerId = signal<string | null>(null);
  protected events = signal<any[]>([]);

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
    });
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
  }

  private loadPlayers() {
    this.playersService.getPlayers(this.teamId).subscribe((list) => {
      const sorted = [...list].sort((a, b) => {
        if (a.jerseyNumber !== undefined && b.jerseyNumber !== undefined) {
          return a.jerseyNumber - b.jerseyNumber;
        }
        return (a.lastName || '').localeCompare(b.lastName || '');
      });
      this.players.set(sorted);
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

  protected async logAction(type: string, payloadExtra: Record<string, any> = {}) {
    const playerId = this.selectedPlayerId();
    if (!playerId) return;

    let payload: Record<string, any> = { playerId };
    if (type === 'KILL') {
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
      default:
        return type || 'Action';
    }
  }

  protected async deletePracticeEvent(gameEventId: string): Promise<void> {
    try {
      await firstValueFrom(
        this.eventsService.deleteGameEvent(this.teamId, this.eventId, gameEventId)
      );
      this.events.update((list) => list.filter((e) => e.id !== gameEventId));
    } catch (e) {
      console.error('Failed to delete practice event:', e);
    }
  }
}
