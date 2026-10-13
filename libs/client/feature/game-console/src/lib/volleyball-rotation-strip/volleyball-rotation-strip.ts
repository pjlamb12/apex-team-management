import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  flashOutline,
  personAddOutline,
  swapHorizontalOutline,
  shieldOutline,
  radioButtonOnOutline,
} from 'ionicons/icons';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Player } from '@apex-team/shared/util/models';

export interface VolleyballPlayerStatsItem {
  kills?: number;
  aces?: number;
  blocks?: number;
  digs?: number;
  assists?: number;
  passCount?: number;
  passScoreSum?: number;
  overpasses?: number;
  serviceErrors?: number;
  hittingErrors?: number;
  [key: string]: unknown;
}

export interface ZoneCardData {
  zoneNumber: number; // 1 to 6
  slotIndex: number;  // 0 to 5
  zoneName: string;
  isServer: boolean;
  isBackRow: boolean;
  player: (Player & { slotIndex?: number; preferredPosition?: string }) | null;
  isLibero: boolean;
  stats: {
    kills: number;
    aces: number;
    digs: number;
    passAvg: string;
  };
}

@Component({
  selector: 'app-volleyball-rotation-strip',
  standalone: true,
  imports: [CommonModule, IonIcon],
  templateUrl: './volleyball-rotation-strip.html',
  styleUrls: ['./volleyball-rotation-strip.scss'],
})
export class VolleyballRotationStripComponent {
  // Inputs
  activePlayers = input<(Player & { slotIndex?: number; preferredPosition?: string })[]>([]);
  selectedPlayerId = input<string | null>(null);
  playerStats = input<Record<string, VolleyballPlayerStatsItem>>({});
  liberoPlayer = input<Player | null>(null);
  isLiberoOnCourt = input<boolean>(false);
  replacedPlayer = input<Player | null>(null);
  replacedByLiberoId = input<string | null>(null);
  playersOnCourt = input<number>(6);

  // Outputs
  playerSelected = output<Player>();
  emptySlotClicked = output<number>();
  quickLiberoSwap = output<{ backRowPlayerId?: string }>();

  // Zone information (Zones 1-6 in order)
  // Zone 1 = slotIndex 0 (Back Right, Server)
  // Zone 2 = slotIndex 1 (Front Right)
  // Zone 3 = slotIndex 2 (Front Middle)
  // Zone 4 = slotIndex 3 (Front Left)
  // Zone 5 = slotIndex 4 (Back Left)
  // Zone 6 = slotIndex 5 (Back Middle)
  protected readonly zoneCards = computed<ZoneCardData[]>(() => {
    const active = this.activePlayers();
    const statsMap = this.playerStats();
    const libero = this.liberoPlayer();

    const zoneDefs = [
      { zoneNumber: 1, slotIndex: 0, zoneName: 'Zone 1 (BR)', isServer: true, isBackRow: true },
      { zoneNumber: 2, slotIndex: 1, zoneName: 'Zone 2 (FR)', isServer: false, isBackRow: false },
      { zoneNumber: 3, slotIndex: 2, zoneName: 'Zone 3 (FM)', isServer: false, isBackRow: false },
      { zoneNumber: 4, slotIndex: 3, zoneName: 'Zone 4 (FL)', isServer: false, isBackRow: false },
      { zoneNumber: 5, slotIndex: 4, zoneName: 'Zone 5 (BL)', isServer: false, isBackRow: true },
      { zoneNumber: 6, slotIndex: 5, zoneName: 'Zone 6 (BM)', isServer: false, isBackRow: true },
    ];

    return zoneDefs.map((def) => {
      const player = active.find((p) => p.slotIndex === def.slotIndex) || null;
      const isLibero = !!(player && libero && player.id === libero.id);

      let stats = { kills: 0, aces: 0, digs: 0, passAvg: '-' };
      if (player && statsMap[player.id]) {
        const ps = statsMap[player.id];
        const count = ps.passCount || 0;
        const sum = ps.passScoreSum || 0;
        stats = {
          kills: ps.kills || 0,
          aces: ps.aces || 0,
          digs: ps.digs || 0,
          passAvg: count > 0 ? (sum / count).toFixed(2) : '-',
        };
      }

      return {
        ...def,
        player,
        isLibero,
        stats,
      };
    });
  });

  // 7th Card Computed Data: Libero on bench, or Replaced Player on bench when Libero is on court
  protected readonly liberoCardData = computed(() => {
    const libero = this.liberoPlayer();
    if (!libero) return null;

    const statsMap = this.playerStats();
    const isLiberoOnCourt = this.isLiberoOnCourt();

    if (isLiberoOnCourt) {
      // Libero is on court (already shown in zoneCards): show replaced bench player if known
      const replaced = this.replacedPlayer();
      if (!replaced) return null;

      const ps = statsMap[replaced.id];
      const count = ps?.passCount || 0;
      const sum = ps?.passScoreSum || 0;
      return {
        player: replaced,
        isOnCourt: false,
        isLibero: false,
        badgeText: 'REPLACED',
        badgeClass: 'bg-slate-700 text-slate-200',
        statusText: 'Bench',
        statusClass: 'bg-slate-700/40 text-slate-400',
        stats: {
          digs: ps?.digs || 0,
          aces: ps?.aces || 0,
          kills: ps?.kills || 0,
          passAvg: count > 0 ? (sum / count).toFixed(2) : '-',
        },
      };
    }

    // Libero is on bench: show Libero card
    const ps = statsMap[libero.id];
    const count = ps?.passCount || 0;
    const sum = ps?.passScoreSum || 0;
    return {
      player: libero,
      isOnCourt: false,
      isLibero: true,
      badgeText: 'LIBERO',
      badgeClass: 'bg-purple-600 text-white',
      statusText: 'Bench',
      statusClass: 'bg-purple-900/40 text-purple-300',
      stats: {
        digs: ps?.digs || 0,
        aces: ps?.aces || 0,
        kills: ps?.kills || 0,
        passAvg: count > 0 ? (sum / count).toFixed(2) : '-',
      },
    };
  });

  constructor() {
    addIcons({
      flashOutline,
      personAddOutline,
      swapHorizontalOutline,
      shieldOutline,
      radioButtonOnOutline,
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

  protected handleQuickLiberoSwap(backRowPlayerId?: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.quickLiberoSwap.emit({ backRowPlayerId });
    void this.triggerHaptic(ImpactStyle.Medium);
  }

  protected getPlayerShortName(player: Player): string {
    if (!player) return '';
    if (player.lastName) {
      return `${player.firstName ? player.firstName[0] + '.' : ''} ${player.lastName}`;
    }
    return player.firstName || 'Player';
  }

  private async triggerHaptic(style: ImpactStyle): Promise<void> {
    try {
      await Haptics.impact({ style });
    } catch {
      // ignore on non-Capacitor environments
    }
  }
}
