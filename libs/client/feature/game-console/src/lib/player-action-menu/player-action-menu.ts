import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonList, IonItem, IonLabel, IonIcon, IonListHeader, IonButton } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { footballOutline, starOutline, cardOutline, shieldOutline, shieldHalfOutline, flashOutline } from 'ionicons/icons';
import { Player } from '@apex-team/shared/util/models';

@Component({
  selector: 'app-player-action-menu',
  imports: [CommonModule, IonList, IonItem, IonLabel, IonIcon, IonListHeader, IonButton],
  templateUrl: './player-action-menu.html',
  styles: [`
    :host {
      display: block;
      min-width: 200px;
    }
    ion-icon[slot="start"] {
      margin-inline-end: 20px;
    }
  `]
})
export class PlayerActionMenuComponent {
  player = input.required<Player>();
  sportName = input<string>('Soccer');
  actionSelected = output<{ type: string; playerId: string; payload?: any }>();

  isGoalkeeper = computed(() => {
    const p = this.player() as any;
    return p.preferredPosition === 'Goalkeeper' || p.slotIndex === 0;
  });

  constructor() {
    addIcons({ footballOutline, starOutline, cardOutline, shieldOutline, shieldHalfOutline, flashOutline });
  }

  protected selectAction(type: string) {
    this.actionSelected.emit({ type, playerId: this.player().id });
  }

  protected selectPassingAction(score: number) {
    this.actionSelected.emit({
      type: 'SERVE_RECEIVE',
      playerId: this.player().id,
      payload: { score }
    });
  }
}
