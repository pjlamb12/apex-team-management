import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { warningOutline, alertCircleOutline, personOutline, personAddOutline } from 'ionicons/icons';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Player } from '@apex-team/shared/util/models';

export interface BasketballPlayerStatsItem {
  points?: number;
  fouls?: number;
  assists?: number;
  rebounds?: number;
  steals?: number;
  blocks?: number;
  turnovers?: number;
  [key: string]: any;
}

@Component({
  selector: 'app-active-player-strip',
  standalone: true,
  imports: [CommonModule, IonIcon],
  templateUrl: './active-player-strip.html',
  styleUrls: ['./active-player-strip.scss'],
})
export class ActivePlayerStripComponent {
  // Inputs
  activePlayers = input<(Player & { slotIndex?: number; preferredPosition?: string })[]>([]);
  selectedPlayerId = input<string | null>(null);
  playerStats = input<Record<string, BasketballPlayerStatsItem>>({});
  foulLimit = input<number>(5);
  playersOnCourt = input<number>(5);

  // Outputs
  playerSelected = output<Player>();
  emptySlotClicked = output<number>();

  // Empty slots on court when under maximum players
  protected readonly emptySlots = computed(() => {
    const active = this.activePlayers();
    const max = this.playersOnCourt();
    if (active.length >= max) return [];

    const usedIndexes = new Set(
      active.map((p) => p.slotIndex).filter((idx): idx is number => idx !== undefined)
    );

    const slots: { slotIndex: number; positionName: string }[] = [];
    const defaultPosNames = ['PG', 'SG', 'SF', 'PF', 'C'];

    for (let i = 0; i < max; i++) {
      if (!usedIndexes.has(i)) {
        slots.push({
          slotIndex: i,
          positionName: defaultPosNames[i] || `Slot ${i + 1}`,
        });
      }
    }
    return slots;
  });

  constructor() {
    addIcons({
      warningOutline,
      alertCircleOutline,
      personOutline,
      personAddOutline,
    });
  }

  protected handlePlayerClick(player: Player): void {
    this.playerSelected.emit(player);
    void this.triggerHaptic(ImpactStyle.Light);
  }

  protected handleEmptySlotClick(slotIndex: number): void {
    this.emptySlotClicked.emit(slotIndex);
    void this.triggerHaptic(ImpactStyle.Light);
  }

  protected getPlayerPoints(playerId: string): number {
    return this.playerStats()[playerId]?.points ?? 0;
  }

  protected getPlayerFouls(playerId: string): number {
    return this.playerStats()[playerId]?.fouls ?? 0;
  }

  protected isFoulWarning(playerId: string): boolean {
    const fouls = this.getPlayerFouls(playerId);
    const limit = this.foulLimit();
    return fouls === limit - 1;
  }

  protected isFouledOut(playerId: string): boolean {
    const fouls = this.getPlayerFouls(playerId);
    const limit = this.foulLimit();
    return fouls >= limit;
  }

  private async triggerHaptic(style: ImpactStyle): Promise<void> {
    try {
      await Haptics.impact({ style });
    } catch {
      // ignore in non-mobile environments
    }
  }
}
