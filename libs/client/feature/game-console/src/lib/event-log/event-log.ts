import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonList, IonItem, IonLabel, IonButton, IonIcon, IonBadge, IonNote, IonListHeader } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowUndoOutline, footballOutline, starOutline, cardOutline, swapHorizontalOutline, helpOutline } from 'ionicons/icons';
import { LiveGameStateService } from '../live-game-state.service';

@Component({
  selector: 'app-event-log',
  imports: [CommonModule, IonList, IonItem, IonLabel, IonButton, IonIcon, IonBadge, IonNote, IonListHeader],
  templateUrl: './event-log.html',
  styleUrls: ['./event-log.scss']
})
export class EventLogViewComponent {
  protected stateService = inject(LiveGameStateService);

  protected events = computed(() => {
    // Reverse events to show newest first
    return [...this.stateService.events()].reverse();
  });

  constructor() {
    addIcons({ 
      arrowUndoOutline, 
      footballOutline, 
      starOutline, 
      cardOutline, 
      swapHorizontalOutline,
      helpOutline
    });
  }

  protected getEventIcon(type: string): string {
    switch (type) {
      case 'GOAL':
      case 'OPPONENT_GOAL': return 'football-outline';
      case 'ASSIST': return 'star-outline';
      case 'YELLOW_CARD':
      case 'RED_CARD': return 'card-outline';
      case 'SUB': return 'swap-horizontal-outline';
      default: return 'help-outline';
    }
  }

  protected getEventColor(type: string): string {
    switch (type) {
      case 'GOAL': return 'success';
      case 'OPPONENT_GOAL': return 'danger';
      case 'YELLOW_CARD': return 'warning';
      case 'RED_CARD': return 'danger';
      case 'SUB': return 'tertiary';
      default: return 'medium';
    }
  }

  protected getPlayerName(playerId?: string): string {
    if (!playerId) return 'Unknown';
    const lineup = this.stateService.initialLineup();
    const entry = lineup.find(e => e.playerId === playerId);
    return entry ? `${entry.player.firstName} ${entry.player.lastName}` : 'Unknown Player';
  }

  protected undo(): void {
    this.stateService.undo();
  }
}
