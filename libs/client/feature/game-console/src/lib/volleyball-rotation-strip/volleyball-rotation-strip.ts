import { Component, input, output, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  flashOutline,
  personAddOutline,
  swapHorizontalOutline,
  shieldOutline,
  radioButtonOnOutline,
  gridOutline,
  listOutline,
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
  roleShort: string;
  roleName: string;
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

  // Layout mode: 'court-grid' (2x3 court matrix) or 'strip' (1x7 horizontal row)
  layoutMode = signal<'court-grid' | 'strip'>('court-grid');

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
      { zoneNumber: 1, slotIndex: 0, zoneName: 'Zone 1 (BR)', roleShort: 'BR', roleName: 'Back Right (Server)', isServer: true, isBackRow: true },
      { zoneNumber: 2, slotIndex: 1, zoneName: 'Zone 2 (FR)', roleShort: 'FR', roleName: 'Front Right', isServer: false, isBackRow: false },
      { zoneNumber: 3, slotIndex: 2, zoneName: 'Zone 3 (FM)', roleShort: 'MF', roleName: 'Middle Front', isServer: false, isBackRow: false },
      { zoneNumber: 4, slotIndex: 3, zoneName: 'Zone 4 (FL)', roleShort: 'LF', roleName: 'Front Left', isServer: false, isBackRow: false },
      { zoneNumber: 5, slotIndex: 4, zoneName: 'Zone 5 (BL)', roleShort: 'BL', roleName: 'Back Left', isServer: false, isBackRow: true },
      { zoneNumber: 6, slotIndex: 5, zoneName: 'Zone 6 (BM)', roleShort: 'BM', roleName: 'Middle Back', isServer: false, isBackRow: true },
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

  // Front Row: Zone 4 (LF), Zone 3 (MF), Zone 2 (FR) from left to right at net
  protected readonly frontRowCards = computed<ZoneCardData[]>(() => {
    const cards = this.zoneCards();
    const z4 = cards.find((c) => c.zoneNumber === 4);
    const z3 = cards.find((c) => c.zoneNumber === 3);
    const z2 = cards.find((c) => c.zoneNumber === 2);
    const row: ZoneCardData[] = [];
    if (z4) row.push(z4);
    if (z3) row.push(z3);
    if (z2) row.push(z2);
    return row;
  });

  // Back Row: Zone 5 (BL), Zone 6 (BM), Zone 1 (BR / Server) from left to right behind attack line
  protected readonly backRowCards = computed<ZoneCardData[]>(() => {
    const cards = this.zoneCards();
    const z5 = cards.find((c) => c.zoneNumber === 5);
    const z6 = cards.find((c) => c.zoneNumber === 6);
    const z1 = cards.find((c) => c.zoneNumber === 1);
    const row: ZoneCardData[] = [];
    if (z5) row.push(z5);
    if (z6) row.push(z6);
    if (z1) row.push(z1);
    return row;
  });

  protected readonly currentServer = computed(() => {
    return this.zoneCards().find((c) => c.isServer)?.player || null;
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
      gridOutline,
      listOutline,
    });
  }

  setLayoutMode(mode: 'court-grid' | 'strip'): void {
    this.layoutMode.set(mode);
    void this.triggerHaptic(ImpactStyle.Light);
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
