import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Player } from '@apex-team/shared/util/models';

export interface PositionedPlayer extends Player {
  x: number;
  y: number;
}

@Component({
  selector: 'app-soccer-pitch-view',
  imports: [CommonModule],
  templateUrl: './soccer-pitch-view.html',
  styleUrls: ['./soccer-pitch-view.scss'],
})
export class SoccerPitchViewComponent {
  players = input.required<Player[]>();
  selectedPlayerId = input<string | null>(null);
  playerSelected = output<{ player: Player; event: Event }>();

  protected positionedPlayers = computed(() => {
    const players = this.players();
    const grouped: Record<string, Player[]> = {};

    players.forEach((p) => {
      const pos = p.preferredPosition || 'Midfielder';
      if (!grouped[pos]) grouped[pos] = [];
      grouped[pos].push(p);
    });

    const result: PositionedPlayer[] = [];

    // Mapping based on categories for a soccer pitch (top-down view)
    // Forwards at the top, GK at the bottom
    const yMap: Record<string, number> = {
      GK: 90,
      DEF: 70,
      MID: 45,
      FWD: 20,
    };

    Object.entries(grouped).forEach(([pos, playersInPos]) => {
      const y = yMap[pos] || 50;
      playersInPos.forEach((player, index) => {
        // Calculate X to spread them out evenly
        const count = playersInPos.length;
        const x = (100 / (count + 1)) * (index + 1);
        result.push({ ...player, x, y });
      });
    });

    return result;
  });

  protected selectPlayer(player: Player, event: Event) {
    this.playerSelected.emit({ player, event });
  }
}
