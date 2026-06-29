import { Component, inject, computed, ViewChild, ElementRef, signal, effect } from '@angular/core';
import { IonList, IonItem, IonLabel, IonButton, IonIcon, IonBadge, IonNote, IonListHeader, ToastController, IonSpinner } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowUndoOutline, footballOutline, starOutline, cardOutline, swapHorizontalOutline, helpOutline, shieldOutline, flagOutline, timeOutline, flashOutline, ribbonOutline, handRightOutline, closeCircleOutline, alertCircleOutline, syncOutline, addCircleOutline, removeCircleOutline, arrowForwardOutline } from 'ionicons/icons';
import { LiveGameStateService, GameEvent } from '../live-game-state.service';
import { EventsService } from '@apex-team/client/data-access/team';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-event-log',
  imports: [IonList, IonItem, IonLabel, IonButton, IonIcon, IonBadge, IonNote, IonListHeader, IonSpinner],
  templateUrl: './event-log.html',
  styleUrls: ['./event-log.scss']
})
export class EventLogViewComponent {
  protected stateService = inject(LiveGameStateService);
  private toastController = inject(ToastController);
  private eventsService = inject(EventsService);

  @ViewChild('scrollContainer') scrollContainer?: ElementRef<HTMLDivElement>;

  protected hasScrollBottom = signal(false);

  protected events = computed(() => {
    const rawEvents = this.stateService.events().filter(e => e.status !== 'deleted');
    const processed: any[] = [];
    
    for (let i = 0; i < rawEvents.length; i++) {
      const e = rawEvents[i];
      
      // If it's a POSITION_SWAP and marked hideFromLog, skip it
      if (e.type === 'POSITION_SWAP' && e['payload']?.hideFromLog) {
        continue;
      }

      // Hide LIBERO_CHANGED events from visual log
      if (e.type === 'LIBERO_CHANGED') {
        continue;
      }
      
      // Check if we can group contiguous POSITION_SWAP events with same gameTimeMs
      if (e.type === 'POSITION_SWAP') {
        const group = [e];
        while (
          i + 1 < rawEvents.length &&
          rawEvents[i + 1].type === 'POSITION_SWAP' &&
          rawEvents[i + 1].gameTimeMs === e.gameTimeMs
        ) {
          group.push(rawEvents[i + 1]);
          i++;
        }
        
        // If it's a group of 5 swaps (which is a full rotation), represent it as COURT_ROTATE
        if (group.length >= 4) {
          processed.push({
            id: group[0].id || `rot-${group[0].timestamp}`,
            type: 'COURT_ROTATE',
            timestamp: group[0].timestamp,
            minuteOccurred: group[0].minuteOccurred,
            gameTimeMs: group[0].gameTimeMs
          });
        } else {
          // Otherwise, push individual swaps
          processed.push(...group);
        }
      } else {
        processed.push(e);
      }
    }
    
    return processed.reverse();
  });

  constructor() {
    addIcons({ 
      arrowUndoOutline, 
      footballOutline, 
      starOutline, 
      cardOutline, 
      swapHorizontalOutline,
      helpOutline,
      shieldOutline,
      flagOutline,
      timeOutline,
      flashOutline,
      ribbonOutline,
      handRightOutline,
      closeCircleOutline,
      alertCircleOutline,
      syncOutline,
      addCircleOutline,
      removeCircleOutline,
      arrowForwardOutline
    });

    effect(() => {
      // Whenever events change, check scroll height after DOM update
      this.events();
      setTimeout(() => {
        this.checkScroll();
      }, 50);
    });
  }

  protected onScroll(): void {
    this.checkScroll();
  }

  private checkScroll(): void {
    const el = this.scrollContainer?.nativeElement;
    if (!el) return;
    const threshold = 5;
    const canScrollDown = el.scrollHeight > el.clientHeight && (el.scrollHeight - el.scrollTop - el.clientHeight > threshold);
    this.hasScrollBottom.set(canScrollDown);
  }

  protected getEventIcon(type: string): string {
    switch (type) {
      case 'GOAL':
      case 'OPPONENT_GOAL':
      case 'OWN_GOAL': return 'football-outline';
      case 'ASSIST': return 'star-outline';
      case 'YELLOW_CARD':
      case 'RED_CARD': return 'card-outline';
      case 'SUB': return 'swap-horizontal-outline';
      case 'BLOCKED_SHOT':
      case 'BLOCKED_PENALTY': return 'shield-outline';
      case 'SHOOTOUT_KICK': return 'football-outline';
      case 'SHOT':
      case 'OPPONENT_SHOT': return 'football-outline';
      case 'CORNER_KICK':
      case 'OPPONENT_CORNER_KICK': return 'flag-outline';
      case 'PERIOD_START':
      case 'PERIOD_END': return 'time-outline';
      case 'KILL': return 'flash-outline';
      case 'ACE': return 'ribbon-outline';
      case 'BLOCK': return 'shield-outline';
      case 'BLOCK_TOUCH': return 'shield-outline';
      case 'DIG': return 'hand-right-outline';
      case 'SERVICE_ERROR': return 'close-circle-outline';
      case 'HITTING_ERROR': return 'alert-circle-outline';
      case 'POSITION_SWAP': return 'swap-horizontal-outline';
      case 'COURT_ROTATE': return 'sync-outline';
      case 'POINT_WON': return 'add-circle-outline';
      case 'POINT_LOST': return 'remove-circle-outline';
      case 'SERVE_RECEIVE': return 'arrow-forward-outline';
      case 'HIT': return 'flash-outline';
      case 'SET_ATTEMPT': return 'arrow-forward-outline';
      case 'SET_ASSIST': return 'star-outline';
      case 'SET_ERROR': return 'close-circle-outline';
      default: return 'help-outline';
    }
  }

  protected getEventColor(type: string): string {
    switch (type) {
      case 'GOAL': return 'success';
      case 'OPPONENT_GOAL':
      case 'OWN_GOAL': return 'danger';
      case 'YELLOW_CARD': return 'warning';
      case 'RED_CARD': return 'danger';
      case 'SUB': return 'tertiary';
      case 'BLOCKED_SHOT': return 'primary';
      case 'BLOCKED_PENALTY': return 'success';
      case 'SHOOTOUT_KICK': return 'medium';
      case 'SHOT': return 'primary';
      case 'OPPONENT_SHOT': return 'medium';
      case 'CORNER_KICK': return 'secondary';
      case 'OPPONENT_CORNER_KICK': return 'medium';
      case 'PERIOD_START':
      case 'PERIOD_END': return 'medium';
      case 'KILL': return 'success';
      case 'ACE': return 'success';
      case 'BLOCK': return 'primary';
      case 'BLOCK_TOUCH': return 'medium';
      case 'DIG': return 'secondary';
      case 'SERVICE_ERROR': return 'warning';
      case 'HITTING_ERROR': return 'danger';
      case 'POSITION_SWAP': return 'medium';
      case 'COURT_ROTATE': return 'primary';
      case 'POINT_WON': return 'success';
      case 'POINT_LOST': return 'danger';
      case 'SERVE_RECEIVE': return 'primary';
      case 'HIT': return 'medium';
      case 'SET_ATTEMPT': return 'medium';
      case 'SET_ASSIST': return 'primary';
      case 'SET_ERROR': return 'danger';
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

  protected retrySync(event: GameEvent): void {
    if (event.timestamp) {
      this.stateService.retryEventSync(event.timestamp);
    }
  }
}
