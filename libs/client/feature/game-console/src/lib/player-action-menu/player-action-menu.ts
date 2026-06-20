import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonList, IonItem, IonLabel, IonIcon, IonListHeader } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { footballOutline, starOutline, cardOutline, shieldOutline, shieldHalfOutline } from 'ionicons/icons';
import { Player } from '@apex-team/shared/util/models';

@Component({
  selector: 'app-player-action-menu',
  imports: [CommonModule, IonList, IonItem, IonLabel, IonIcon, IonListHeader],
  templateUrl: './player-action-menu.html',
  styles: [`
    :host {
      display: block;
      min-width: 200px;
    }
  `]
})
export class PlayerActionMenuComponent {
  player = input.required<Player>();
  actionSelected = output<{ type: string; playerId: string }>();

  isGoalkeeper = computed(() => {
    const p = this.player() as any;
    return p.preferredPosition === 'Goalkeeper' || p.slotIndex === 0;
  });

  constructor() {
    addIcons({ footballOutline, starOutline, cardOutline, shieldOutline, shieldHalfOutline });
  }

  protected selectAction(type: string) {
    this.actionSelected.emit({ type, playerId: this.player().id });
  }
}
