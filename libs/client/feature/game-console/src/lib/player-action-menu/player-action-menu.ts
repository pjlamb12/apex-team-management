import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonList, IonItem, IonLabel, IonIcon, IonListHeader } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { footballOutline, starOutline, cardOutline } from 'ionicons/icons';
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

  constructor() {
    addIcons({ footballOutline, starOutline, cardOutline });
  }

  protected selectAction(type: string) {
    this.actionSelected.emit({ type, playerId: this.player().id });
  }
}
