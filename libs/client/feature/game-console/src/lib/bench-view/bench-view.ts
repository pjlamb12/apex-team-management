import { Component, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Player } from '@apex-team/shared/util/models';
import { IonCard, IonCardHeader } from '@ionic/angular/standalone';
import { PlaytimeService } from '../rotation-engine/playtime.service';

@Component({
  selector: 'app-bench-view',
  imports: [CommonModule, IonCard, IonCardHeader],
  templateUrl: './bench-view.html',
  styleUrls: ['./bench-view.scss'],
})
export class BenchViewComponent {
  protected playtimeService = inject(PlaytimeService);

  players = input.required<Player[]>();
  stagedInIds = input<Set<string>>(new Set());
  selectedPlayerId = input<string | null>(null);
  playerSelected = output<{ player: Player; event: Event }>();

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
