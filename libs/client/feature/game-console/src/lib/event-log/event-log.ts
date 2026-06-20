import { Component, inject, computed } from '@angular/core';
import { IonList, IonItem, IonLabel, IonButton, IonIcon, IonBadge, IonNote, IonListHeader, ToastController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowUndoOutline, footballOutline, starOutline, cardOutline, swapHorizontalOutline, helpOutline, shieldOutline } from 'ionicons/icons';
import { LiveGameStateService } from '../live-game-state.service';
import { EventsService } from '@apex-team/client/data-access/team';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-event-log',
  imports: [IonList, IonItem, IonLabel, IonButton, IonIcon, IonBadge, IonNote, IonListHeader],
  templateUrl: './event-log.html',
  styleUrls: ['./event-log.scss']
})
export class EventLogViewComponent {
  protected stateService = inject(LiveGameStateService);
  private toastController = inject(ToastController);
  private eventsService = inject(EventsService);

  protected events = computed(() => {
    // Filter out deleted events and reverse to show newest first
    return this.stateService.events()
      .filter(e => e.status !== 'deleted')
      .reverse();
  });

  constructor() {
    addIcons({ 
      arrowUndoOutline, 
      footballOutline, 
      starOutline, 
      cardOutline, 
      swapHorizontalOutline,
      helpOutline,
      shieldOutline
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
      case 'BLOCKED_SHOT':
      case 'BLOCKED_PENALTY': return 'shield-outline';
      case 'SHOOTOUT_KICK': return 'football-outline';
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
      case 'BLOCKED_SHOT': return 'primary';
      case 'BLOCKED_PENALTY': return 'success';
      case 'SHOOTOUT_KICK': return 'medium';
      default: return 'medium';
    }
  }

  protected getPlayerName(playerId?: string): string {
    if (!playerId) return '';
    const lineup = this.stateService.initialLineup();
    const entry = lineup.find(e => e.playerId === playerId);
    return entry ? `${entry.player.firstName} ${entry.player.lastName}` : '';
  }

  protected async undo(): Promise<void> {
    const activeEvents = this.stateService.events().filter(e => e.status !== 'deleted');
    if (activeEvents.length > 0) {
      const lastEvent = activeEvents[activeEvents.length - 1];
      this.stateService.undo();
      
      // If we undid a PERIOD_END, sync the reverted period back to the database
      if (lastEvent.type === 'PERIOD_END') {
        const teamId = this.stateService.teamId();
        const eventId = this.stateService.eventId();
        if (teamId && eventId) {
          try {
            await firstValueFrom(this.eventsService.updateEvent(teamId, eventId, {
              currentPeriod: this.stateService.currentPeriod()
            }));
          } catch (err) {
            console.error('Failed to sync reverted period to backend', err);
          }
        }
      }

      const toast = await this.toastController.create({
        message: `Undone: ${lastEvent.type.replace('_', ' ')}`,
        duration: 2000,
        position: 'bottom',
        color: 'medium'
      });
      await toast.present();
    }
  }
}
