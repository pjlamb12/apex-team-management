import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Player } from '@apex-team/shared/util/models';
import { IonCard, IonCardHeader } from '@ionic/angular/standalone';

@Component({
  selector: 'app-bench-view',
  imports: [CommonModule, IonCard, IonCardHeader],
  templateUrl: './bench-view.html',
  styleUrls: ['./bench-view.scss'],
})
export class BenchViewComponent {
  players = input.required<Player[]>();
  selectedPlayerId = input<string | null>(null);
  playerSelected = output<{ player: Player; event: Event }>();

  protected selectPlayer(player: Player, event: Event) {
    this.playerSelected.emit({ player, event });
  }
}
