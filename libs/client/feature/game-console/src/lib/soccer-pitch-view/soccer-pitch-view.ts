import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Player } from '@apex-team/shared/util/models';

export interface PositionedPlayer extends Player {
  x: number;
  y: number;
  slotIndex?: number;
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

  // Fixed coordinate map for slots 0-10 (standard 4-4-2)
  private readonly SLOT_COORDINATES: Record<number, { x: number; y: number }> = {
    0: { x: 50, y: 90 }, // GK
    1: { x: 20, y: 70 }, // LB
    2: { x: 40, y: 70 }, // LCB
    3: { x: 60, y: 70 }, // RCB
    4: { x: 80, y: 70 }, // RB
    5: { x: 20, y: 45 }, // LM
    6: { x: 40, y: 45 }, // LCM
    7: { x: 60, y: 45 }, // RCM
    8: { x: 80, y: 45 }, // RM
    9: { x: 35, y: 20 }, // LF
    10: { x: 65, y: 20 }, // RF
  };

  protected positionedPlayers = computed(() => {
    const players = this.players() as (Player & { slotIndex?: number })[];
    
    return players.map(player => {
      const slotIndex = player.slotIndex;
      const coords = slotIndex !== undefined ? this.SLOT_COORDINATES[slotIndex] : { x: 50, y: 50 };
      
      return {
        ...player,
        x: coords?.x ?? 50,
        y: coords?.y ?? 50
      };
    }) as PositionedPlayer[];
  });

  protected selectPlayer(player: Player, event: Event) {
    this.playerSelected.emit({ player, event });
  }

  protected trackBySlot(index: number, player: PositionedPlayer): string | number {
    return player.slotIndex !== undefined ? player.slotIndex : player.id;
  }
}
