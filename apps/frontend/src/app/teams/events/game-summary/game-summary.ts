import { Component, inject, signal, effect, Input, computed } from '@angular/core';
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
} from '@ionic/angular/standalone';
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
  arrowDownCircle
} from 'ionicons/icons';
import { EventsService, EventEntity } from '@apex-team/client/data-access/team';

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
  ],
  templateUrl: './game-summary.html',
  styleUrl: './game-summary.scss',
})
export class GameSummary {
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

  protected game = signal<EventEntity | null>(null);
  protected gameEvents = signal<any[]>([]);
  protected isLoading = signal(true);
  protected errorMessage = signal<string | null>(null);

  protected goals = computed(() => {
    return this.gameEvents().filter(e => e.eventType === 'GOAL' || e.eventType === 'OPPONENT_GOAL');
  });

  protected score = computed(() => {
    const g = this.goals();
    const team = g.filter(e => e.eventType === 'GOAL').length;
    const opponent = g.filter(e => e.eventType === 'OPPONENT_GOAL').length;
    return { team, opponent };
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
      arrowDownCircle
    });

    effect(() => {
      const tId = this._teamId();
      const eId = this._eventId();
      if (tId && eId) {
        void this.loadData(tId, eId);
      }
    });
  }

  protected async loadData(teamId: string, eventId: string): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      const [game, events] = await Promise.all([
        firstValueFrom(this.eventsService.getEvent(teamId, eventId)),
        firstValueFrom(this.eventsService.getGameEvents(teamId, eventId))
      ]);
      this.game.set(game);
      this.gameEvents.set(events);
    } catch {
      this.errorMessage.set('Failed to load game summary.');
    } finally {
      this.isLoading.set(false);
    }
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
}
