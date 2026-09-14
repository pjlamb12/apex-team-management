import { Component, input, output, inject } from '@angular/core';
import { Player } from '@apex-team/shared/util/models';
import { IonCard, IonCardHeader, IonButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowDownCircleOutline } from 'ionicons/icons';
import { PlaytimeService } from '../rotation-engine/playtime.service';

@Component({
  selector: 'app-bench-view',
  imports: [IonCard, IonCardHeader, IonButton, IonIcon],
  templateUrl: './bench-view.html',
  styleUrls: ['./bench-view.scss'],
})
export class BenchViewComponent {
  protected playtimeService = inject(PlaytimeService);

  constructor() {
    addIcons({ arrowDownCircleOutline });
  }

  players = input.required<Player[]>();
  stagedInIds = input<Set<string>>(new Set());
  selectedPlayerId = input<string | null>(null);
  selectedActivePlayer = input<Player | null>(null);
  ejectedPlayerIds = input<Set<string>>(new Set());
  liberoDesignation = input<{ liberoId: string; replacedId: string } | null>(null);
  playerSelected = output<{ player: Player; event: Event }>();
  moveSelectedToBench = output<void>();
  addGuestPlayer = output<void>();

  protected selectPlayer(player: Player, event: Event) {
    this.playerSelected.emit({ player, event });
  }

  protected formatPlaytime(playerId: string): string {
    const seconds = this.playtimeService.playtimeMap()[playerId] || 0;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}
